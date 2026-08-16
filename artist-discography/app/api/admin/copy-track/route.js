import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { loadArtistData, saveArtistData } from '../../../../lib/artistData'
import { slugify } from '../../../../lib/slugs'
import { warmMediaFiles } from '../../../../lib/mediaWarmer'

const SUPPORTED_AUDIO_EXTS = ['.mp3', '.m4a', '.wav', '.ogg', '.flac', '.aac', '.mp4', '.webm']

export async function POST(request) {
  try {
    const body = await request.json()
    const { password, sourceProjectIndex, sourceTrackIndex, targetProjectIndex } = body ?? {}

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
      return NextResponse.json(
        { success: false, error: 'No projects found in dataset' },
        { status: 400 }
      )
    }

    const srcProjIdx = parseInt(sourceProjectIndex, 10)
    const srcTrackIdx = parseInt(sourceTrackIndex, 10)
    const tgtProjIdx = parseInt(targetProjectIndex, 10)

    if (
      isNaN(srcProjIdx) || srcProjIdx < 0 || srcProjIdx >= fullJsonData.projects.length ||
      isNaN(tgtProjIdx) || tgtProjIdx < 0 || tgtProjIdx >= fullJsonData.projects.length
    ) {
      return NextResponse.json(
        { success: false, error: 'Invalid project selection' },
        { status: 400 }
      )
    }

    const sourceProject = fullJsonData.projects[srcProjIdx]
    const targetProject = fullJsonData.projects[tgtProjIdx]

    if (!Array.isArray(sourceProject.tracks) || isNaN(srcTrackIdx) || srcTrackIdx < 0 || srcTrackIdx >= sourceProject.tracks.length) {
      return NextResponse.json(
        { success: false, error: 'Invalid source track selection' },
        { status: 400 }
      )
    }

    const sourceTrack = sourceProject.tracks[srcTrackIdx]
    const sourceProjectSlug = slugify(sourceProject.name) || `project-${srcProjIdx + 1}`
    const targetProjectSlug = slugify(targetProject.name) || `project-${tgtProjIdx + 1}`
    const sourceTrackSlug = slugify(sourceTrack.name)

    if (!targetProjectSlug) {
      return NextResponse.json(
        { success: false, error: 'Target project has invalid title/slug' },
        { status: 400 }
      )
    }

    // Determine unique track title and track slug in target project
    if (!Array.isArray(targetProject.tracks)) {
      targetProject.tracks = []
    }

    const existingTargetSlugs = new Set(targetProject.tracks.map((t) => slugify(t.name)))
    let newTrackName = sourceTrack.name || 'Untitled Track'
    let newTrackSlug = slugify(newTrackName)
    let copyCount = 1

    while (existingTargetSlugs.has(newTrackSlug)) {
      copyCount++
      newTrackName = `${sourceTrack.name || 'Untitled Track'} (Copy ${copyCount})`
      newTrackSlug = slugify(newTrackName)
    }

    const projectsDir = path.join(process.cwd(), 'data', 'projects')
    const sourceProjDir = path.join(projectsDir, sourceProjectSlug)
    const targetProjDir = path.join(projectsDir, targetProjectSlug)

    if (!fs.existsSync(targetProjDir)) {
      fs.mkdirSync(targetProjDir, { recursive: true })
    }

    // Find physical audio file of source track
    const filesToWarm = []
    let copiedAudioExt = null
    if (fs.existsSync(sourceProjDir) && sourceTrackSlug) {
      for (const ext of SUPPORTED_AUDIO_EXTS) {
        const candidateSourceFile = path.join(sourceProjDir, `${sourceTrackSlug}${ext}`)
        if (fs.existsSync(candidateSourceFile)) {
          const destinationFile = path.join(targetProjDir, `${newTrackSlug}${ext}`)
          try {
            fs.copyFileSync(candidateSourceFile, destinationFile)
            copiedAudioExt = ext
            filesToWarm.push(destinationFile)
            break
          } catch (copyErr) {
            console.error('Failed to copy physical audio file:', copyErr)
          }
        }
      }
    }

    // Copy custom track cover artwork if present
    let clonedCover = sourceTrack.cover || ''
    if (clonedCover && !clonedCover.startsWith('http://') && !clonedCover.startsWith('https://') && !clonedCover.startsWith('/') && fs.existsSync(sourceProjDir)) {
      const sourceCoverFile = path.join(sourceProjDir, clonedCover)
      if (fs.existsSync(sourceCoverFile)) {
        const ext = path.extname(clonedCover).toLowerCase() || '.jpg'
        const targetCoverFilename = `${newTrackSlug}-art${ext}`
        const destCoverFile = path.join(targetProjDir, targetCoverFilename)
        try {
          fs.copyFileSync(sourceCoverFile, destCoverFile)
          clonedCover = targetCoverFilename
          filesToWarm.push(destCoverFile)
        } catch (coverErr) {
          console.error('Failed to copy track cover art file:', coverErr)
        }
      }
    }

    // Clone track metadata
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

    const primaryArtistName = String(fullJsonData.artist?.name || 'Artist').trim()
    const clonedTrack = {
      name: newTrackName,
      artist: String(sourceTrack.artist || '').trim() || String(targetProject.artist || '').trim() || primaryArtistName,
      links: { ...defaultLinks, ...(sourceTrack.links || {}) },
      ...(clonedCover ? { cover: clonedCover } : {}),
    }

    targetProject.tracks.push(clonedTrack)

    const saveResult = saveArtistData(fullJsonData)
    if (!saveResult.success) {
      return NextResponse.json(
        { success: false, error: `Failed to save copied track: ${saveResult.error}` },
        { status: 500 }
      )
    }

    // Immediately pre-compress and cache any copied audio and artwork
    if (filesToWarm.length > 0) {
      try {
        await warmMediaFiles(filesToWarm)
      } catch (warmErr) {
        console.warn('Post-copy media warming error:', warmErr)
      }
    }

    const timestamp = Date.now()
    const enrichedTargetTracks = targetProject.tracks.map((t) => {
      const tSlug = slugify(t.name)
      let audioUrl = ''
      let hasAudio = false
      if (tSlug && targetProjDir && fs.existsSync(targetProjDir)) {
        for (const ext of SUPPORTED_AUDIO_EXTS) {
          if (fs.existsSync(path.join(targetProjDir, `${tSlug}${ext}`))) {
            hasAudio = true
            audioUrl = `/api/audio/projects/${targetProjectSlug}/${tSlug}${ext}?t=${timestamp}`
            break
          }
        }
      }
      return {
        ...t,
        audioUrl,
        hasAudio,
      }
    })

    const SUPPORTED_IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.gif', '.avif']
    let resolvedTargetCover = ''
    if (targetProject.cover) {
      resolvedTargetCover = targetProject.cover.startsWith('http://') || targetProject.cover.startsWith('https://') || targetProject.cover.startsWith('/')
        ? targetProject.cover
        : `/api/media/projects/${targetProjectSlug}/${targetProject.cover}?t=${timestamp}`
    } else if (targetProjDir && fs.existsSync(targetProjDir)) {
      for (const ext of SUPPORTED_IMAGE_EXTS) {
        if (fs.existsSync(path.join(targetProjDir, `art${ext}`))) {
          resolvedTargetCover = `/api/media/projects/${targetProjectSlug}/art${ext}?t=${timestamp}`
          break
        }
      }
    }

    const returnedTargetProject = {
      ...targetProject,
      cover: resolvedTargetCover,
      hasCover: Boolean(resolvedTargetCover),
      tracks: enrichedTargetTracks,
    }

    return NextResponse.json({
      success: true,
      message: `Successfully copied track "${sourceTrack.name}" to project "${targetProject.name}"${copiedAudioExt ? ' (with audio file)' : ''}!`,
      updatedTargetProject: returnedTargetProject,
      targetProjectIndex: tgtProjIdx,
    })
  } catch (err) {
    console.error('Error copying track:', err)
    return NextResponse.json(
      { success: false, error: `Server error: ${err.message}` },
      { status: 500 }
    )
  }
}
