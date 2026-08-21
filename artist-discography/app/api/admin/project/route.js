import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import {
  loadConfigData,
  loadAllProjectsData,
  saveProjectData,
  deleteProjectData,
  getProjectsDirPath,
} from '../../../../lib/artistData'
import { slugify, isSlugReserved } from '../../../../lib/slugs'
import { warmMediaFiles } from '../../../../lib/mediaWarmer'
import { scheduleAutomatedCachePrune } from '../../../../lib/cacheCleaner'

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
    const requestedSlug = formData.get('originalSlug') || formData.get('projectSlug') || null
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

    // Action 1: Delete Project
    if (action === 'delete') {
      const deleteResult = deleteProjectData(oldSlug)
      if (!deleteResult.success) {
        return NextResponse.json(
          { success: false, error: `Failed to delete project: ${deleteResult.error}` },
          { status: 500 },
        )
      }

      // Schedule automated background cleanup to remove orphaned media cache files
      scheduleAutomatedCachePrune(3000)

      return NextResponse.json({
        success: true,
        message: `Project "${oldProject?.name || 'Project'}" deleted successfully.`,
      })
    }

    // Action 2: Update Project
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
    const coverUrl = String(formData.get('coverUrl') || '').trim()
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
    } catch (err) {
      return NextResponse.json(
        { success: false, error: 'Invalid tracks JSON data' },
        { status: 400 },
      )
    }

    const newSlug = slugify(name) || `project-${index + 1}`

    // Reject system-reserved slugs
    if (isSlugReserved(newSlug)) {
      return NextResponse.json(
        {
          success: false,
          error: `The title "${name}" produces a reserved route URL (/${newSlug}). Please choose a different project title.`,
        },
        { status: 400 },
      )
    }

    // Check duplicate project slug across other projects
    const isDuplicateProject = projectsList.some((p, i) => {
      if (i === index) return false
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

    // Check duplicate track slugs within the project
    const trackSlugsSeen = new Set()
    for (let i = 0; i < parsedTracks.length; i++) {
      const tName = String(parsedTracks[i]?.name || '').trim()
      const tSlug = slugify(tName)
      if (tSlug) {
        if (trackSlugsSeen.has(tSlug)) {
          return NextResponse.json(
            {
              success: false,
              error: `Duplicate track title "${tName}" (slug: "${tSlug}") in project. Track titles within a project must be unique.`,
            },
            { status: 400 },
          )
        }
        trackSlugsSeen.add(tSlug)
      }
    }

    // Directory and file rename helpers with Windows file-lock retry handling
    const safeRenameSync = (oldPath, newPath, maxRetries = 5, delayMs = 50) => {
      if (!fs.existsSync(oldPath)) return false
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          fs.renameSync(oldPath, newPath)
          return true
        } catch (err) {
          if (
            (err.code === 'EBUSY' || err.code === 'EPERM' || err.code === 'EACCES') &&
            attempt < maxRetries
          ) {
            const start = Date.now()
            while (Date.now() - start < delayMs * attempt) {}
          } else {
            if (attempt === maxRetries) {
              console.error(
                `Failed to rename ${oldPath} to ${newPath} after ${maxRetries} attempts:`,
                err,
              )
            }
          }
        }
      }
      return false
    }

    const safeUnlinkSync = (targetPath, maxRetries = 3, delayMs = 50) => {
      if (!fs.existsSync(targetPath)) return false
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          fs.unlinkSync(targetPath)
          return true
        } catch (err) {
          if (
            (err.code === 'EBUSY' || err.code === 'EPERM' || err.code === 'EACCES') &&
            attempt < maxRetries
          ) {
            const start = Date.now()
            while (Date.now() - start < delayMs * attempt) {}
          }
        }
      }
      return false
    }

    const projectsDir = getProjectsDirPath()
    const oldProjectDir = oldSlug ? path.join(projectsDir, oldSlug) : null
    const targetProjectDir = path.join(projectsDir, newSlug)

    // Rename directory if slug changed and old dir exists
    if (oldSlug && oldSlug !== newSlug && oldProjectDir && fs.existsSync(oldProjectDir)) {
      safeRenameSync(oldProjectDir, targetProjectDir)
    }

    if (!fs.existsSync(targetProjectDir)) {
      fs.mkdirSync(targetProjectDir, { recursive: true })
    }

    const filesToWarm = []
    const targetMap = {}
    const detailsMap = {}

    // Process Cover File
    let coverProp = coverUrl || oldProject.cover || ''
    // If coverProp had an absolute media path from old slug, extract relative filename
    if (coverProp.startsWith('/api/media/projects/')) {
      const parts = coverProp.replace('/api/media/projects/', '').split('/')
      parts.shift() // remove old slug
      coverProp = parts.join('/').split('?')[0]
    } else if (coverProp.startsWith('/api/media/')) {
      coverProp = coverProp.replace('/api/media/', '').split('?')[0]
    }

    const coverFile = formData.get('coverFile')
    if (
      coverFile &&
      typeof coverFile === 'object' &&
      typeof coverFile.arrayBuffer === 'function' &&
      coverFile.size > 0
    ) {
      const origExt = path.extname(coverFile.name || '').toLowerCase()
      const ext =
        origExt && ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.gif', '.avif'].includes(origExt)
          ? origExt
          : '.jpg'
      const artPath = path.join(targetProjectDir, `art${ext}`)
      const buffer = Buffer.from(await coverFile.arrayBuffer())
      fs.writeFileSync(artPath, buffer)
      coverProp = `art${ext}`
      filesToWarm.push(artPath)
      targetMap[artPath] = `${name} (Cover Art)`
      detailsMap[artPath] = {
        projectSlug: newSlug,
        projectName: name,
        isCover: true,
        fileName: `art${ext}`,
      }
    }

    // If coverProp is not explicitly set, check if an art file exists in the directory
    if (!coverProp || !fs.existsSync(path.join(targetProjectDir, coverProp))) {
      for (const imgExt of ['.jpg', '.jpeg', '.png', '.webp', '.avif']) {
        if (fs.existsSync(path.join(targetProjectDir, `art${imgExt}`))) {
          coverProp = `art${imgExt}`
          break
        }
      }
    }

    // Process Tracks
    const formattedTracks = []
    const audioExtensions = ['.mp3', '.m4a', '.wav', '.ogg', '.flac', '.aac', '.mp4', '.webm']
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.gif', '.avif']

    for (let i = 0; i < parsedTracks.length; i++) {
      const track = parsedTracks[i] ?? {}
      const trackName = String(track.name || '').trim()
      const rawTrackArtist = String(track.artist || '').trim()
      const trackArtist = rawTrackArtist || artist || primaryArtistName
      const trackSlug = slugify(trackName)
      const rawOriginalName = String(track.originalName || '').trim()
      const origSlug = rawOriginalName ? slugify(rawOriginalName) : null
      const oldProjTrackName = oldProject?.tracks?.[i]?.name
      const fallbackOrigSlug = oldProjTrackName ? slugify(oldProjTrackName) : null

      // Track the filename actually written to disk for this track (used for response + orphan cleanup)
      let writtenAudioFilename = null
      const audioFile = formData.get(`track_${i}_audioFile`)

      if (
        audioFile &&
        typeof audioFile === 'object' &&
        typeof audioFile.arrayBuffer === 'function' &&
        audioFile.size > 0
      ) {
        const origExt = path.extname(audioFile.name || '').toLowerCase()
        const ext = origExt && audioExtensions.includes(origExt) ? origExt : '.mp3'
        const audioPath = path.join(targetProjectDir, `${trackSlug}${ext}`)
        const buffer = Buffer.from(await audioFile.arrayBuffer())
        fs.writeFileSync(audioPath, buffer)
        writtenAudioFilename = `${trackSlug}${ext}`
        filesToWarm.push(audioPath)
        targetMap[audioPath] = `${name} - Track: "${trackName || `Track ${i + 1}`}"`
        detailsMap[audioPath] = {
          projectSlug: newSlug,
          projectName: name,
          trackSlug,
          trackName: trackName || `Track ${i + 1}`,
          fileName: `${trackSlug}${ext}`,
        }
      } else {
        // 1. Check if an existing audio file matches this track slug
        for (const ext of audioExtensions) {
          const checkPath = path.join(targetProjectDir, `${trackSlug}${ext}`)
          if (fs.existsSync(checkPath)) {
            writtenAudioFilename = `${trackSlug}${ext}`
            break
          }
        }

        // 2. If no new file uploaded and not found under current slug, check if renamed from previous slug
        if (!writtenAudioFilename && trackSlug) {
          const candidateOldSlugs = [origSlug, fallbackOrigSlug].filter((s) => s && s !== trackSlug)
          for (const oldCandidateSlug of candidateOldSlugs) {
            for (const ext of audioExtensions) {
              const oldAudioPath = path.join(targetProjectDir, `${oldCandidateSlug}${ext}`)
              if (fs.existsSync(oldAudioPath)) {
                const newAudioPath = path.join(targetProjectDir, `${trackSlug}${ext}`)
                const renamed = safeRenameSync(oldAudioPath, newAudioPath)
                if (renamed) {
                  writtenAudioFilename = `${trackSlug}${ext}`
                  filesToWarm.push(newAudioPath)
                  targetMap[newAudioPath] = `${name} - Track: "${trackName || `Track ${i + 1}`}"`
                  detailsMap[newAudioPath] = {
                    projectSlug: newSlug,
                    projectName: name,
                    trackSlug,
                    trackName: trackName || `Track ${i + 1}`,
                    fileName: `${trackSlug}${ext}`,
                  }
                }
                break
              }
            }
            if (writtenAudioFilename) break
          }
        }
      }

      // Also rename custom track cover art if it was named after old track slug
      if (trackSlug) {
        const candidateOldSlugs = [origSlug, fallbackOrigSlug].filter((s) => s && s !== trackSlug)
        for (const oldCandidateSlug of candidateOldSlugs) {
          for (const imgExt of imageExtensions) {
            const oldArtPath = path.join(targetProjectDir, `${oldCandidateSlug}-art${imgExt}`)
            if (fs.existsSync(oldArtPath)) {
              const newArtPath = path.join(targetProjectDir, `${trackSlug}-art${imgExt}`)
              const renamed = safeRenameSync(oldArtPath, newArtPath)
              if (renamed) {
                filesToWarm.push(newArtPath)
                targetMap[newArtPath] = `${name} - Track: "${trackName || `Track ${i + 1}`}" (Art)`
                detailsMap[newArtPath] = {
                  projectSlug: newSlug,
                  projectName: name,
                  trackSlug,
                  trackName: trackName || `Track ${i + 1}`,
                  fileName: `${trackSlug}-art${imgExt}`,
                }
              }
              break
            }
          }
        }
      }

      const defaultLinks = {
        amazon: '',
        apple: '',
        bandcamp: '',
        deezer: '',
        itunes: '',
        pandora: '',
        soundcloud: '',
        spotify: '',
        tidal: '',
        youtube: '',
      }

      const trackLinks = { ...defaultLinks, ...(track.links || {}) }

      formattedTracks.push({
        name: trackName,
        artist: trackArtist,
        links: trackLinks,
        _writtenAudioFilename: writtenAudioFilename,
      })
    }

    // Clean up audio files in project directory that are no longer referenced by any track slug
    try {
      const expectedAudioFilenames = new Set(
        formattedTracks.map((t) => t._writtenAudioFilename).filter(Boolean),
      )
      const validTrackSlugs = new Set(parsedTracks.map((t) => slugify(t?.name)).filter(Boolean))

      if (fs.existsSync(targetProjectDir)) {
        const existingFiles = fs.readdirSync(targetProjectDir)
        const audioExtensions = ['.mp3', '.m4a', '.wav', '.ogg', '.flac', '.aac', '.mp4', '.webm']
        existingFiles.forEach((file) => {
          const ext = path.extname(file).toLowerCase()
          const baseName = path.parse(file).name
          if (audioExtensions.includes(ext)) {
            const isExpected = expectedAudioFilenames.has(file) || validTrackSlugs.has(baseName)
            if (!isExpected) {
              safeUnlinkSync(path.join(targetProjectDir, file))
            }
          }
        })
      }
    } catch (err) {
      console.error('Error cleaning unreferenced audio files:', err)
    }

    // Strip internal helper field before saving to JSON
    const tracksToSave = formattedTracks.map(({ _writtenAudioFilename, ...rest }) => rest)

    const updatedProjectObj = {
      name,
      type,
      artist,
      date,
      visibility,
      copyright,
      ...(coverProp ? { cover: coverProp } : {}),
      tracks: tracksToSave,
    }

    const saveResult = saveProjectData(newSlug, updatedProjectObj)
    if (!saveResult.success) {
      return NextResponse.json(
        { success: false, error: `Failed to update project: ${saveResult.error}` },
        { status: 500 },
      )
    }

    // Pre-compress and cache any uploaded or renamed media files in the background without blocking the HTTP response
    if (filesToWarm.length > 0) {
      setTimeout(() => {
        warmMediaFiles(filesToWarm, { targetMap, detailsMap }).catch((warmErr) => {
          console.warn('Post-update media warming error:', warmErr)
        })
      }, 10)
    }

    // Schedule background cache cleanup to remove superseded variants after warming settles
    scheduleAutomatedCachePrune(15000)

    const timestamp = Date.now()
    const resolvedCover = coverProp
      ? coverProp.startsWith('http://') ||
        coverProp.startsWith('https://') ||
        coverProp.startsWith('/')
        ? coverProp
        : `/api/media/projects/${newSlug}/${coverProp}?t=${timestamp}`
      : ''

    const enrichedTracks = tracksToSave.map((t, i) => {
      const writtenFilename = formattedTracks[i]?._writtenAudioFilename
      let audioUrl = ''
      let hasAudio = false
      if (writtenFilename) {
        hasAudio = true
        audioUrl = `/api/audio/projects/${newSlug}/${writtenFilename}?t=${timestamp}`
      }
      return {
        ...t,
        audioUrl,
        hasAudio,
      }
    })

    const returnedProjectObj = {
      ...updatedProjectObj,
      cover: resolvedCover,
      hasCover: Boolean(resolvedCover),
      tracks: enrichedTracks,
    }

    return NextResponse.json({
      success: true,
      projectSlug: newSlug,
      updatedProject: returnedProjectObj,
      message: `Project "${name}" updated successfully!`,
    })
  } catch (err) {
    console.error('Error updating project:', err)
    return NextResponse.json(
      { success: false, error: `Server error: ${err.message}` },
      { status: 500 },
    )
  }
}
