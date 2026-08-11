import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { loadArtistData, saveArtistData } from '../../../../lib/artistData'
import { slugify } from '../../../../lib/slugs'

export async function POST(request) {
  try {
    const formData = await request.formData()
    const password = formData.get('password') || request.headers.get('x-admin-password') || ''
    const action = String(formData.get('action') || 'update').toLowerCase()
    const projectIndexStr = formData.get('projectIndex')

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

    const index = parseInt(projectIndexStr, 10)
    if (isNaN(index) || index < 0 || index >= fullJsonData.projects.length) {
      return NextResponse.json(
        { success: false, error: 'Invalid project index specified' },
        { status: 400 }
      )
    }

    // Action 1: Delete Project
    if (action === 'delete') {
      const removedProject = fullJsonData.projects.splice(index, 1)[0]
      if (removedProject && removedProject.name) {
        const projSlug = slugify(removedProject.name)
        const projDir = path.join(process.cwd(), 'data', 'projects', projSlug)
        if (fs.existsSync(projDir)) {
          try {
            fs.rmSync(projDir, { recursive: true, force: true })
          } catch (err) {
            console.error('Error removing project folder:', err)
          }
        }
      }

      const saveResult = saveArtistData(fullJsonData)
      if (!saveResult.success) {
        return NextResponse.json(
          { success: false, error: `Failed to delete project: ${saveResult.error}` },
          { status: 500 }
        )
      }
      return NextResponse.json({
        success: true,
        message: `Project "${removedProject?.name || 'Project'}" deleted successfully.`,
      })
    }

    // Action 2: Update Project
    const name = String(formData.get('name') || '').trim()
    const type = String(formData.get('type') || 'Single').trim()
    const artist = String(formData.get('artist') || fullJsonData.artist?.name || '').trim()
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

    const oldProject = fullJsonData.projects[index]
    const oldSlug = slugify(oldProject?.name || '')
    const newSlug = slugify(name)

    if (!newSlug) {
      return NextResponse.json(
        { success: false, error: 'Could not generate a valid slug from project name' },
        { status: 400 }
      )
    }

    // Check duplicate project slug across other projects
    const isDuplicateProject = fullJsonData.projects.some((p, i) => {
      if (i === index) return false
      return slugify(p.name) === newSlug
    })

    if (isDuplicateProject) {
      return NextResponse.json(
        { success: false, error: `A project with title "${name}" (slug: "${newSlug}") already exists.` },
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
    const oldProjectDir = oldSlug ? path.join(projectsDir, oldSlug) : null
    const targetProjectDir = path.join(projectsDir, newSlug)

    // Rename directory if slug changed and old dir exists
    if (oldSlug && oldSlug !== newSlug && oldProjectDir && fs.existsSync(oldProjectDir)) {
      try {
        fs.renameSync(oldProjectDir, targetProjectDir)
      } catch (err) {
        console.error('Directory rename error:', err)
      }
    }

    if (!fs.existsSync(targetProjectDir)) {
      fs.mkdirSync(targetProjectDir, { recursive: true })
    }

    // Process Cover File
    let coverProp = coverUrl || oldProject.cover || ''
    const coverFile = formData.get('coverFile')
    if (coverFile && typeof coverFile === 'object' && typeof coverFile.arrayBuffer === 'function' && coverFile.size > 0) {
      const origExt = path.extname(coverFile.name || '').toLowerCase()
      const ext = origExt && ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.gif', '.avif'].includes(origExt) ? origExt : '.jpg'
      const artPath = path.join(targetProjectDir, `art${ext}`)
      const buffer = Buffer.from(await coverFile.arrayBuffer())
      fs.writeFileSync(artPath, buffer)
      coverProp = `art${ext}`
    }

    // Process Tracks
    const formattedTracks = []
    for (let i = 0; i < parsedTracks.length; i++) {
      const track = parsedTracks[i] ?? {}
      const trackName = String(track.name || '').trim()
      const trackArtist = String(track.artist || artist || '').trim()
      const trackSlug = slugify(trackName) || `track-${i + 1}`

      let audioProp = String(track.audioUrl || track.audio || '').trim()
      const audioFile = formData.get(`track_${i}_audioFile`)

      if (audioFile && typeof audioFile === 'object' && typeof audioFile.arrayBuffer === 'function' && audioFile.size > 0) {
        const origExt = path.extname(audioFile.name || '').toLowerCase()
        const ext = origExt && ['.mp3', '.m4a', '.wav', '.ogg', '.flac', '.aac', '.mp4', '.webm'].includes(origExt) ? origExt : '.mp3'
        const audioPath = path.join(targetProjectDir, `${trackSlug}${ext}`)
        const buffer = Buffer.from(await audioFile.arrayBuffer())
        fs.writeFileSync(audioPath, buffer)
        audioProp = `${trackSlug}${ext}`
      } else if (audioProp && !audioProp.startsWith('http://') && !audioProp.startsWith('https://') && !audioProp.startsWith('/')) {
        const origExt = path.extname(audioProp).toLowerCase()
        const ext = origExt && ['.mp3', '.m4a', '.wav', '.ogg', '.flac', '.aac', '.mp4', '.webm'].includes(origExt) ? origExt : '.mp3'
        const desiredFilename = `${trackSlug}${ext}`
        const oldAudioPath = path.join(targetProjectDir, audioProp)
        const newAudioPath = path.join(targetProjectDir, desiredFilename)

        if (audioProp !== desiredFilename && fs.existsSync(oldAudioPath)) {
          try {
            if (fs.existsSync(newAudioPath)) {
              fs.unlinkSync(newAudioPath)
            }
            fs.renameSync(oldAudioPath, newAudioPath)
            audioProp = desiredFilename
          } catch (renameErr) {
            console.error(`Failed to rename track audio file from ${audioProp} to ${desiredFilename}:`, renameErr)
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
        audio: audioProp,
        links: trackLinks,
      })
    }

    // Clean up unreferenced audio files in project directory
    try {
      const referencedAudioFiles = new Set(
        formattedTracks
          .map((t) => t.audio)
          .filter((a) => a && !a.startsWith('http://') && !a.startsWith('https://') && !a.startsWith('/'))
      )

      if (fs.existsSync(targetProjectDir)) {
        const existingFiles = fs.readdirSync(targetProjectDir)
        const audioExtensions = ['.mp3', '.m4a', '.wav', '.ogg', '.flac', '.aac', '.mp4', '.webm']
        existingFiles.forEach((file) => {
          const ext = path.extname(file).toLowerCase()
          if (audioExtensions.includes(ext) && !referencedAudioFiles.has(file)) {
            try {
              fs.unlinkSync(path.join(targetProjectDir, file))
            } catch (e) {
              console.error(`Failed to delete orphaned audio file ${file}:`, e)
            }
          }
        })
      }
    } catch (err) {
      console.error('Error cleaning unreferenced audio files:', err)
    }

    const updatedProjectObj = {
      name,
      type,
      artist,
      date,
      ...(coverProp ? { cover: coverProp } : {}),
      tracks: formattedTracks,
    }

    fullJsonData.projects[index] = updatedProjectObj

    const saveResult = saveArtistData(fullJsonData)
    if (!saveResult.success) {
      return NextResponse.json(
        { success: false, error: `Failed to update project: ${saveResult.error}` },
        { status: 500 }
      )
    }

    const timestamp = Date.now()
    const resolvedCover = coverProp
      ? (coverProp.startsWith('http://') || coverProp.startsWith('https://') || coverProp.startsWith('/')
          ? coverProp
          : `/api/media/projects/${newSlug}/${coverProp}?t=${timestamp}`)
      : ''

    const enrichedTracks = formattedTracks.map((t) => {
      const audioVal = String(t.audio || '').trim()
      let audioUrl = ''
      let hasAudio = false
      if (audioVal) {
        hasAudio = true
        audioUrl = (audioVal.startsWith('http://') || audioVal.startsWith('https://') || audioVal.startsWith('/'))
          ? audioVal
          : `/api/audio/projects/${newSlug}/${audioVal}?t=${timestamp}`
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
      { status: 500 }
    )
  }
}
