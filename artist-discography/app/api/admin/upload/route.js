import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import {
  loadConfigData,
  loadAllProjectsData,
  saveProjectData,
  getProjectsDirPath,
} from '../../../../lib/artistData'
import { slugify, isSlugReserved } from '../../../../lib/slugs'
import { warmMediaFiles } from '../../../../lib/mediaWarmer'
import { scheduleAutomatedCachePrune } from '../../../../lib/cacheCleaner'

export async function POST(request) {
  try {
    const formData = await request.formData()
    const password = formData.get('password') || request.headers.get('x-admin-password') || ''

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

    if (isSlugReserved(name)) {
      return NextResponse.json(
        {
          success: false,
          error: `The project title "${name}" (slug: "${slugify(name)}") is reserved for system routes (e.g. _sys) and cannot be used.`,
        },
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

    const projectSlug = slugify(name) || `project-${Date.now()}`

    const existingProjects = loadAllProjectsData(primaryArtistName)
    const isDuplicateProject = existingProjects.some((p) => slugify(p.name) === projectSlug)
    if (isDuplicateProject) {
      return NextResponse.json(
        {
          success: false,
          error: `A project with title "${name}" (slug: "${projectSlug}") already exists.`,
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

    const projectsDir = getProjectsDirPath()
    const targetProjectDir = path.join(projectsDir, projectSlug)

    if (!fs.existsSync(targetProjectDir)) {
      fs.mkdirSync(targetProjectDir, { recursive: true })
    }

    const filesToWarm = []
    const targetMap = {}
    const detailsMap = {}

    // Process Cover File
    let coverProp = coverUrl
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
        projectSlug,
        projectName: name,
        isCover: true,
        fileName: `art${ext}`,
      }
    }

    // Process Tracks
    const formattedTracks = []
    for (let i = 0; i < parsedTracks.length; i++) {
      const track = parsedTracks[i] ?? {}
      const trackName = String(track.name || '').trim()
      const rawTrackArtist = String(track.artist || '').trim()
      const trackArtist = rawTrackArtist || artist || primaryArtistName
      const trackSlug = slugify(trackName)

      let writtenAudioFilename = null
      const audioFile = formData.get(`track_${i}_audioFile`)

      if (
        audioFile &&
        typeof audioFile === 'object' &&
        typeof audioFile.arrayBuffer === 'function' &&
        audioFile.size > 0
      ) {
        const origExt = path.extname(audioFile.name || '').toLowerCase()
        const ext =
          origExt &&
          ['.mp3', '.m4a', '.wav', '.ogg', '.flac', '.aac', '.mp4', '.webm'].includes(origExt)
            ? origExt
            : '.mp3'
        const audioPath = path.join(targetProjectDir, `${trackSlug}${ext}`)
        const buffer = Buffer.from(await audioFile.arrayBuffer())
        fs.writeFileSync(audioPath, buffer)
        writtenAudioFilename = `${trackSlug}${ext}`
        filesToWarm.push(audioPath)
        targetMap[audioPath] = `${name} - Track: "${trackName || `Track ${i + 1}`}"`
        detailsMap[audioPath] = {
          projectSlug,
          projectName: name,
          trackSlug,
          trackName: trackName || `Track ${i + 1}`,
          fileName: `${trackSlug}${ext}`,
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

    // Strip internal helper field before saving to JSON
    const tracksToSave = formattedTracks.map(({ _writtenAudioFilename, ...rest }) => rest)

    const newProjectObj = {
      name,
      type,
      artist,
      date,
      visibility,
      copyright,
      ...(coverProp ? { cover: coverProp } : {}),
      tracks: tracksToSave,
    }

    const saveResult = saveProjectData(projectSlug, newProjectObj)
    if (!saveResult.success) {
      return NextResponse.json(
        { success: false, error: `Failed to save project: ${saveResult.error}` },
        { status: 500 },
      )
    }

    // Immediately pre-compress and cache all uploaded artwork and audio streams in the background without blocking HTTP response
    if (filesToWarm.length > 0) {
      setTimeout(() => {
        warmMediaFiles(filesToWarm, { targetMap, detailsMap }).catch((warmErr) => {
          console.warn('Post-upload media warming error:', warmErr)
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
        : `/api/media/projects/${projectSlug}/${coverProp}?t=${timestamp}`
      : ''

    const enrichedTracks = tracksToSave.map((t, i) => {
      const writtenFilename = formattedTracks[i]?._writtenAudioFilename
      let audioUrl = ''
      let hasAudio = false
      if (writtenFilename) {
        hasAudio = true
        audioUrl = `/api/audio/projects/${projectSlug}/${writtenFilename}?t=${timestamp}`
      }
      return {
        ...t,
        audioUrl,
        hasAudio,
      }
    })

    const createdProjectObj = {
      ...newProjectObj,
      cover: resolvedCover,
      hasCover: Boolean(resolvedCover),
      tracks: enrichedTracks,
    }

    return NextResponse.json({
      success: true,
      projectSlug,
      createdProject: createdProjectObj,
      message: 'Project and media files saved successfully!',
    })
  } catch (err) {
    console.error('Error uploading project:', err)
    return NextResponse.json(
      { success: false, error: `Server error: ${err.message}` },
      { status: 500 },
    )
  }
}
