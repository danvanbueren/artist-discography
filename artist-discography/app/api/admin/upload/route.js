import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { loadArtistData, saveArtistData } from '../../../../lib/artistData'
import { slugify } from '../../../../lib/slugs'
import { warmMediaFiles } from '../../../../lib/mediaWarmer'

export async function POST(request) {
  try {
    const formData = await request.formData()
    const password = formData.get('password') || request.headers.get('x-admin-password') || ''

    const dataResult = loadArtistData()
    const currentData = dataResult?.data ?? {}

    const adminAccess = Boolean(currentData?.adminAccess)
    const adminPassword = String(currentData?.adminPassword ?? '')

    if (!adminAccess) {
      return NextResponse.json(
        { success: false, error: 'Admin access is disabled in artist-data.json' },
        { status: 403 }
      )
    }

    if (password !== adminPassword) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Invalid admin password' },
        { status: 401 }
      )
    }

    const primaryArtistName = String(currentData.artist?.name || 'Artist').trim()
    const name = String(formData.get('name') || '').trim()
    const type = String(formData.get('type') || 'Single').trim()
    const rawArtist = String(formData.get('artist') || '').trim()
    const artist = rawArtist || primaryArtistName
    const date = String(formData.get('date') || new Date().toISOString().split('T')[0]).trim()
    const coverUrl = String(formData.get('coverUrl') || '').trim()
    const tracksRaw = String(formData.get('tracks') || '[]')

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Project name is required' },
        { status: 400 }
      )
    }

    let parsedTracks = []
    try {
      parsedTracks = JSON.parse(tracksRaw)
      if (!Array.isArray(parsedTracks)) parsedTracks = []
    } catch (err) {
      return NextResponse.json(
        { success: false, error: 'Invalid tracks JSON data' },
        { status: 400 }
      )
    }

    const projectSlug = slugify(name) || `project-${Date.now()}`

    // Check duplicate project slug across existing projects
    const isDuplicateProject = (currentData.projects || []).some((p) => slugify(p.name) === projectSlug)
    if (isDuplicateProject) {
      return NextResponse.json(
        { success: false, error: `A project with title "${name}" (slug: "${projectSlug}") already exists.` },
        { status: 400 }
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
            { success: false, error: `Duplicate track title "${tName}" (slug: "${tSlug}") in project. Track titles within a project must be unique.` },
            { status: 400 }
          )
        }
        trackSlugsSeen.add(tSlug)
      }
    }

    const projectsDir = path.join(process.cwd(), 'data', 'projects')
    const targetProjectDir = path.join(projectsDir, projectSlug)

    if (!fs.existsSync(targetProjectDir)) {
      fs.mkdirSync(targetProjectDir, { recursive: true })
    }

    const filesToWarm = []

    // Process Cover File
    let coverProp = coverUrl
    const coverFile = formData.get('coverFile')
    if (coverFile && typeof coverFile === 'object' && typeof coverFile.arrayBuffer === 'function' && coverFile.size > 0) {
      const origExt = path.extname(coverFile.name || '').toLowerCase()
      const ext = origExt && ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.gif', '.avif'].includes(origExt) ? origExt : '.jpg'
      const artPath = path.join(targetProjectDir, `art${ext}`)
      const buffer = Buffer.from(await coverFile.arrayBuffer())
      fs.writeFileSync(artPath, buffer)
      // When art.<ext> exists in projects/<projectSlug>, artistData auto-resolves it. Leaving cover empty or set to art.<ext>
      coverProp = `art${ext}`
      filesToWarm.push(artPath)
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

      if (audioFile && typeof audioFile === 'object' && typeof audioFile.arrayBuffer === 'function' && audioFile.size > 0) {
        const origExt = path.extname(audioFile.name || '').toLowerCase()
        const ext = origExt && ['.mp3', '.m4a', '.wav', '.ogg', '.flac', '.aac', '.mp4', '.webm'].includes(origExt) ? origExt : '.mp3'
        const audioPath = path.join(targetProjectDir, `${trackSlug}${ext}`)
        const buffer = Buffer.from(await audioFile.arrayBuffer())
        fs.writeFileSync(audioPath, buffer)
        writtenAudioFilename = `${trackSlug}${ext}`
        filesToWarm.push(audioPath)
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

    // Read existing artist-data.json directly to preserve top-level structure
    const filePath = path.join(process.cwd(), 'data', 'artist-data.json')
    let fullJsonData = {}
    if (fs.existsSync(filePath)) {
      try {
        fullJsonData = JSON.parse(fs.readFileSync(filePath, 'utf8'))
      } catch (e) {
        fullJsonData = currentData
      }
    } else {
      fullJsonData = currentData
    }

    if (!Array.isArray(fullJsonData.projects)) {
      fullJsonData.projects = []
    }

    // Strip internal helper field before saving to JSON
    const tracksToSave = formattedTracks.map(({ _writtenAudioFilename, ...rest }) => rest)

    const newProjectObj = {
      name,
      type,
      artist,
      date,
      ...(coverProp ? { cover: coverProp } : {}),
      tracks: tracksToSave,
    }

    // Insert new project at index 0 (latest release first)
    fullJsonData.projects.unshift(newProjectObj)

    const saveResult = saveArtistData(fullJsonData)
    if (!saveResult.success) {
      return NextResponse.json(
        { success: false, error: `Failed to update artist-data.json: ${saveResult.error}` },
        { status: 500 }
      )
    }

    // Immediately pre-compress and cache all uploaded artwork and audio streams
    if (filesToWarm.length > 0) {
      try {
        const targetMap = {}
        if (coverFile && typeof coverFile === 'object') {
          for (const fp of filesToWarm) {
            if (fp.includes('art.')) {
              targetMap[fp] = `${name} (Cover Art)`
            }
          }
        }
        for (let i = 0; i < formattedTracks.length; i++) {
          const tName = formattedTracks[i]?.name || `Track ${i + 1}`
          for (const fp of filesToWarm) {
            const base = path.basename(fp)
            if (!base.startsWith('art.') && !targetMap[fp]) {
              targetMap[fp] = `${name} - Track: "${tName}"`
            }
          }
        }
        await warmMediaFiles(filesToWarm, { targetMap })
      } catch (warmErr) {
        console.warn('Post-upload media warming error:', warmErr)
      }
    }

    const timestamp = Date.now()
    const resolvedCover = coverProp
      ? (coverProp.startsWith('http://') || coverProp.startsWith('https://') || coverProp.startsWith('/')
          ? coverProp
          : `/api/media/projects/${projectSlug}/${coverProp}?t=${timestamp}`)
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
      { status: 500 }
    )
  }
}
