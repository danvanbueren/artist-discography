import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import {
  loadConfigData,
  loadAllProjectsData,
  saveProjectData,
  deleteProjectData,
  getProjectsDirPath,
} from '@/lib/data/artistData'
import { slugify, isSlugReserved } from '@/lib/data/slugs'
import { warmMediaFiles } from '@/lib/media/mediaWarmer'
import { scheduleAutomatedCachePrune } from '@/lib/media/cacheCleaner'
import { syncProjectTrackFiles, safeRenameSync, safeUnlinkSync } from '@/lib/api/projectRouteHelpers'

/**
 * POST /api/admin/project
 * In-place project release update and deletion endpoint.
 */
export async function POST(request) {
  try {
    const formData = await request.formData()
    const password = formData.get('password') || request.headers.get('x-admin-password') || ''
    const action = String(formData.get('action') || 'update').toLowerCase()
    const projectIndexStr = formData.get('projectIndex')

    const configResult = loadConfigData()
    const configData = configResult?.data ?? {}

    const adminAccess = Boolean(configData?.adminAccess)
    const adminPassword = String(configData?.adminPassword ?? '')

    if (!adminAccess) {
      return NextResponse.json(
        { success: false, error: 'Admin access is disabled in config.json' },
        { status: 403 },
      )
    }

    if (password !== adminPassword) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Invalid admin password' },
        { status: 401 },
      )
    }

    const projectsList = loadAllProjectsData(configData?.artist?.name)

    let oldProject = null
    const originalNameStr = formData.get('originalName')
    const requestedSlug =
      formData.get('originalSlug') ||
      formData.get('projectSlug') ||
      (originalNameStr ? slugify(String(originalNameStr)) : null)
    if (requestedSlug) {
      oldProject = projectsList.find((p) => slugify(p.name) === String(requestedSlug).trim())
    }

    const index = parseInt(projectIndexStr, 10)
    if (!oldProject && !isNaN(index) && index >= 0 && index < projectsList.length) {
      oldProject = projectsList[index]
    }

    if (!oldProject) {
      return NextResponse.json(
        { success: false, error: 'Invalid project selection or project not found' },
        { status: 400 },
      )
    }

    const oldSlug = slugify(oldProject?.name || '') || `project-${index + 1}`

    // 1. Delete Project Action
    if (action === 'delete') {
      const deleteResult = deleteProjectData(oldSlug)
      if (!deleteResult.success) {
        return NextResponse.json(
          { success: false, error: `Failed to delete project: ${deleteResult.error}` },
          { status: 500 },
        )
      }

      scheduleAutomatedCachePrune(3000)

      return NextResponse.json({
        success: true,
        message: `Project "${oldProject?.name || 'Project'}" deleted successfully.`,
      })
    }

    // 2. Update Project Action
    const primaryArtistName = String(configData.artist?.name || 'Artist').trim()
    const name = String(formData.get('name') || '').trim()
    const type = String(formData.get('type') || 'Single').trim()
    const rawArtist = String(formData.get('artist') || '').trim()
    const artist = rawArtist || primaryArtistName
    const date = String(formData.get('date') || new Date().toISOString().split('T')[0]).trim()
    const visibility =
      String(formData.get('visibility') || '')
        .trim()
        .toLowerCase() === 'private'
        ? 'private'
        : 'public'
    const copyright =
      String(formData.get('copyright') || '')
        .trim()
        .toLowerCase() === 'uncleared'
        ? 'uncleared'
        : 'cleared'
    const tracksRaw = String(formData.get('tracks') || '[]')

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Project name is required' },
        { status: 400 },
      )
    }

    let parsedTracks = []
    try {
      parsedTracks = JSON.parse(tracksRaw)
      if (!Array.isArray(parsedTracks)) parsedTracks = []
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid tracks JSON data' },
        { status: 400 },
      )
    }

    const newSlug = slugify(name) || `project-${index + 1}`

    if (isSlugReserved(newSlug)) {
      return NextResponse.json(
        {
          success: false,
          error: `The title "${name}" produces a reserved route URL (/${newSlug}).`,
        },
        { status: 400 },
      )
    }

    const targetProjectIndex = projectsList.findIndex(
      (p) => slugify(p.name) === oldSlug || p.name === oldProject.name,
    )

    const isDuplicateProject = projectsList.some((p, i) => {
      if (i === targetProjectIndex || slugify(p.name) === oldSlug) return false
      return slugify(p.name) === newSlug
    })

    if (isDuplicateProject) {
      return NextResponse.json(
        {
          success: false,
          error: `A project with title "${name}" (slug: "${newSlug}") already exists.`,
        },
        { status: 400 },
      )
    }

    const oldProjectDir = path.join(process.cwd(), 'data', 'projects', oldSlug)
    const newProjectDir = path.join(process.cwd(), 'data', 'projects', newSlug)
    let currentProjectDir = oldProjectDir

    // If project name changed, rename or migrate directory
    if (oldSlug !== newSlug && fs.existsSync(oldProjectDir)) {
      if (safeRenameSync(oldProjectDir, newProjectDir)) {
        currentProjectDir = newProjectDir
      } else {
        if (!fs.existsSync(newProjectDir)) {
          fs.mkdirSync(newProjectDir, { recursive: true })
        }
        try {
          const oldFiles = fs.readdirSync(oldProjectDir)
          for (const file of oldFiles) {
            const src = path.join(oldProjectDir, file)
            const dst = path.join(newProjectDir, file)
            if (fs.existsSync(src) && fs.statSync(src).isFile()) {
              fs.copyFileSync(src, dst)
            }
          }
          deleteProjectData(oldSlug)
          currentProjectDir = newProjectDir
        } catch (migErr) {
          console.error(`Failed to migrate files from ${oldSlug} to ${newSlug}:`, migErr)
          currentProjectDir = newProjectDir
        }
      }
    } else if (oldSlug !== newSlug) {
      currentProjectDir = newProjectDir
    }

    if (!fs.existsSync(currentProjectDir)) {
      fs.mkdirSync(currentProjectDir, { recursive: true })
    }

    const filesToWarm = []
    const targetMap = {}
    const detailsMap = {}

    // Cover Artwork Upload / Removal
    const coverFile = formData.get('coverFile')
    const removeCover = String(formData.get('removeCover') || 'false').toLowerCase() === 'true'
    let coverUrl = oldProject.cover || ''

    if (removeCover) {
      // Find and delete existing cover art files from currentProjectDir
      if (fs.existsSync(currentProjectDir)) {
        const dirFiles = fs.readdirSync(currentProjectDir)
        for (const file of dirFiles) {
          if (file.toLowerCase().startsWith('art.') || file.toLowerCase().includes('cover')) {
            const cPath = path.join(currentProjectDir, file)
            safeUnlinkSync(cPath)
          }
        }
      }
      coverUrl = ''
      scheduleAutomatedCachePrune(1000)
    } else if (
      coverFile &&
      typeof coverFile === 'object' &&
      typeof coverFile.arrayBuffer === 'function' &&
      coverFile.size > 0
    ) {
      const coverExt = path.extname(coverFile.name || '.jpg').toLowerCase() || '.jpg'
      const coverFileName = `art${coverExt}`
      const coverDestPath = path.join(currentProjectDir, coverFileName)

      const buffer = Buffer.from(await coverFile.arrayBuffer())
      fs.writeFileSync(coverDestPath, buffer)
      coverUrl = `/api/media/${newSlug}/${coverFileName}`

      filesToWarm.push(coverDestPath)
      targetMap[coverDestPath] = `${name} (Cover Art)`
      detailsMap[coverDestPath] = {
        projectSlug: newSlug,
        projectName: name,
        isCover: true,
        fileName: coverFileName,
      }
    } else if (coverUrl && oldSlug !== newSlug) {
      const coverFileName = path.basename(coverUrl)
      coverUrl = `/api/media/${newSlug}/${coverFileName}`
    }

    // Sync Audio Tracks
    const { updatedTracks, newlyUploadedFiles } = await syncProjectTrackFiles({
      formData,
      parsedTracks,
      oldTracks: oldProject.tracks || [],
      projectDir: currentProjectDir,
      newSlug,
      projectName: name,
    })

    if (Array.isArray(newlyUploadedFiles) && newlyUploadedFiles.length > 0) {
      for (const item of newlyUploadedFiles) {
        if (item.filePath && fs.existsSync(item.filePath)) {
          filesToWarm.push(item.filePath)
          if (item.target) targetMap[item.filePath] = item.target
          if (item.details) detailsMap[item.filePath] = item.details
        }
      }
    }

    scheduleAutomatedCachePrune(2000)

    const projectDataToSave = {
      name,
      slug: newSlug,
      type,
      artist,
      date,
      visibility,
      copyright,
      cover: coverUrl,
      tracks: updatedTracks,
      links: oldProject.links || {},
    }

    const saveResult = saveProjectData(newSlug, projectDataToSave)
    if (!saveResult.success) {
      return NextResponse.json(
        { success: false, error: `Failed to save project metadata: ${saveResult.error}` },
        { status: 500 },
      )
    }

    // Immediately pre-optimize in background and broadcast progress to media jobs center
    if (filesToWarm.length > 0) {
      setTimeout(() => {
        warmMediaFiles(filesToWarm, { targetMap, detailsMap }).catch((warmErr) => {
          console.warn('Post-update media warming error:', warmErr)
        })
      }, 10)
    }

    return NextResponse.json({
      success: true,
      message: `Project "${name}" updated successfully.`,
      updatedProject: projectDataToSave,
    })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: `Internal Server Error: ${err.message}` },
      { status: 500 },
    )
  }
}

export const PUT = POST
