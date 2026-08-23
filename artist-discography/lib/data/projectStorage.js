import fs from 'fs'
import path from 'path'
import { slugify } from './slugs'
import {
  atomicWriteJson,
  createRollingBackup,
  archiveMalformedFile,
  tryHeuristicJsonRepair,
} from './atomicStorage'

export const DEFAULT_PROJECT_SCAFFOLD = {
  name: '',
  type: 'Single',
  artist: '',
  date: '',
  visibility: 'public',
  copyright: 'cleared',
  cover: 'art.jpg',
  tracks: [
    {
      name: '',
      artist: '',
      links: {
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
      },
    },
  ],
}

const SUPPORTED_AUDIO_EXTS = ['.mp3', '.m4a', '.wav', '.ogg', '.flac', '.aac', '.mp4', '.webm']
const SUPPORTED_IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.gif', '.avif']

/**
 * Returns the absolute path to data/projects directory.
 *
 * @returns {string}
 */
export function getProjectsDirPath() {
  return path.join(process.cwd(), 'data', 'projects')
}

/**
 * Returns the absolute path to a specific project.json file.
 *
 * @param {string} projectSlug - Project slug identifier
 * @returns {string}
 */
export function getProjectFilePath(projectSlug) {
  return path.join(process.cwd(), 'data', 'projects', projectSlug, 'project.json')
}

/**
 * Safely resolves a local file path inside baseDir without path traversal.
 *
 * @param {string} baseDir - Root directory to contain paths within
 * @param {string} relativePath - Relative path to resolve
 * @returns {string|null} Full verified file path or null
 */
export function resolveLocalPath(baseDir, relativePath) {
  try {
    const fullPath = path.resolve(path.join(baseDir, relativePath))
    if (fullPath.startsWith(baseDir) && fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
      return fullPath
    }
  } catch {}
  return null
}

/**
 * Validates, repairs, and resolves assets for a single project object.
 *
 * @param {Object} raw - Raw project JSON data
 * @param {string} projectSlug - Slug identifier for directory asset lookups
 * @param {string} [defaultArtistName='Artist'] - Fallback artist name
 * @param {string[]} [issues=[]] - Diagnostic issues list
 * @returns {{ project: Object, repaired: boolean }}
 */
export function validateAndResolveProject(
  raw,
  projectSlug,
  defaultArtistName = 'Artist',
  issues = [],
) {
  let repaired = false
  const proj = typeof raw === 'object' && raw !== null ? { ...raw } : {}
  const dataDir = path.join(process.cwd(), 'data')

  if (typeof proj.name !== 'string' || !proj.name.trim()) {
    proj.name = projectSlug
      ? projectSlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
      : 'Untitled Project'
    repaired = true
  }

  if (typeof proj.type !== 'string' || !proj.type.trim()) {
    proj.type = 'Single'
    repaired = true
  }

  if (typeof proj.artist !== 'string') {
    proj.artist = defaultArtistName || ''
    repaired = true
  }

  if (typeof proj.date !== 'string') {
    proj.date = ''
    repaired = true
  }

  if (proj.visibility !== 'public' && proj.visibility !== 'private') {
    proj.visibility = 'public'
    repaired = true
  }

  if (proj.copyright !== 'cleared' && proj.copyright !== 'uncleared') {
    proj.copyright = 'cleared'
    repaired = true
  }

  // Resolve cover artwork
  let resolvedCover = null
  let hasCover = false
  if (typeof proj.cover === 'string' && proj.cover.trim() !== '') {
    const trimCover = proj.cover.trim()
    if (/^https?:\/\//i.test(trimCover)) {
      resolvedCover = trimCover
      hasCover = true
    } else {
      const matchPath =
        resolveLocalPath(dataDir, path.join('projects', projectSlug, trimCover)) ||
        resolveLocalPath(dataDir, path.join('projects', trimCover)) ||
        resolveLocalPath(dataDir, path.join('covers', trimCover)) ||
        resolveLocalPath(dataDir, trimCover)
      if (matchPath) {
        const relPath = path.relative(dataDir, matchPath).replace(/\\/g, '/')
        resolvedCover = `/api/media/${relPath}`
        hasCover = true
      }
    }
  }

  if (!hasCover && projectSlug) {
    for (const ext of SUPPORTED_IMAGE_EXTS) {
      const candidateRel = path.join('projects', projectSlug, `art${ext}`)
      const matchPath = resolveLocalPath(dataDir, candidateRel)
      if (matchPath) {
        const relPath = path.relative(dataDir, matchPath).replace(/\\/g, '/')
        resolvedCover = `/api/media/${relPath}`
        hasCover = true
        break
      }
    }
  }

  proj.cover = resolvedCover
  proj.hasCover = hasCover

  // Resolve tracks
  if (!Array.isArray(proj.tracks)) {
    proj.tracks = []
    repaired = true
  } else {
    proj.tracks = proj.tracks.map((track, trackIndex) => {
      if (typeof track !== 'object' || track === null) {
        repaired = true
        return {
          name: `Track ${trackIndex + 1}`,
          links: { ...DEFAULT_PROJECT_SCAFFOLD.tracks[0].links },
        }
      }
      const updatedTrack = { ...track }
      if (typeof updatedTrack.name !== 'string') {
        updatedTrack.name = `Track ${trackIndex + 1}`
        repaired = true
      }

      const defaultLinks = DEFAULT_PROJECT_SCAFFOLD.tracks[0].links
      const tLinksObj = { ...defaultLinks, ...(updatedTrack.links || {}) }
      updatedTrack.links = tLinksObj

      const trackSlug = slugify(updatedTrack.name)
      let resolvedAudioUrl = null
      let hasAudio = false

      if (trackSlug) {
        for (const ext of SUPPORTED_AUDIO_EXTS) {
          const candidateRel = path.join('projects', projectSlug, `${trackSlug}${ext}`)
          const matchPath = resolveLocalPath(dataDir, candidateRel)
          if (matchPath) {
            const relPath = path.relative(dataDir, matchPath).replace(/\\/g, '/')
            resolvedAudioUrl = `/api/audio/${relPath}`
            hasAudio = true
            break
          }
        }
      }

      updatedTrack.audioUrl = resolvedAudioUrl
      updatedTrack.hasAudio = hasAudio

      // Track cover fallback
      let resolvedTrackCover = resolvedCover
      if (typeof updatedTrack.cover === 'string' && updatedTrack.cover.trim() !== '') {
        const trimTCover = updatedTrack.cover.trim()
        if (/^https?:\/\//i.test(trimTCover)) {
          resolvedTrackCover = trimTCover
        } else {
          const matchPath =
            resolveLocalPath(dataDir, path.join('projects', projectSlug, trimTCover)) ||
            resolveLocalPath(dataDir, path.join('projects', trimTCover)) ||
            resolveLocalPath(dataDir, path.join('covers', trimTCover)) ||
            resolveLocalPath(dataDir, trimTCover)
          if (matchPath) {
            const relPath = path.relative(dataDir, matchPath).replace(/\\/g, '/')
            resolvedTrackCover = `/api/media/${relPath}`
          }
        }
      }
      updatedTrack.cover = resolvedTrackCover

      return updatedTrack
    })
  }

  return { project: proj, repaired }
}

/**
 * Loads and validates a single project by its slug.
 *
 * @param {string} projectSlug - Slug name of project
 * @param {string} [defaultArtistName='Artist'] - Default artist fallback
 * @returns {Object|null}
 */
export function loadProjectFile(projectSlug, defaultArtistName = 'Artist') {
  const filePath = getProjectFilePath(projectSlug)
  if (!fs.existsSync(filePath)) {
    return null
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf8')
    let parsed = null
    try {
      parsed = JSON.parse(raw)
    } catch {
      parsed = tryHeuristicJsonRepair(raw)
    }

    if (!parsed || typeof parsed !== 'object') {
      archiveMalformedFile(filePath, raw, `project-${projectSlug}`)
      return null
    }

    const { project } = validateAndResolveProject(parsed, projectSlug, defaultArtistName)
    return project
  } catch (err) {
    console.error(`Error loading project ${projectSlug}:`, err)
    return null
  }
}

/**
 * Discovers and loads all projects from data/projects/ directory.
 * Sorted naturally by release date descending (newest first).
 *
 * @param {string} [defaultArtistName='Artist']
 * @returns {Array<Object>}
 */
export function loadAllProjectsFiles(defaultArtistName = 'Artist') {
  const projectsDir = getProjectsDirPath()
  if (!fs.existsSync(projectsDir)) {
    return []
  }

  try {
    const entries = fs.readdirSync(projectsDir, { withFileTypes: true })
    const projects = []

    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      if (entry.name.startsWith('.')) continue
      const slug = entry.name
      const projFilePath = path.join(projectsDir, slug, 'project.json')

      if (fs.existsSync(projFilePath)) {
        const proj = loadProjectFile(slug, defaultArtistName)
        if (proj) {
          projects.push(proj)
        }
      }
    }

    // Sort projects by release date descending (newest first)
    projects.sort((a, b) => {
      const timeA = a.date ? new Date(a.date).getTime() : 0
      const timeB = b.date ? new Date(b.date).getTime() : 0
      const validA = !isNaN(timeA) ? timeA : 0
      const validB = !isNaN(timeB) ? timeB : 0
      if (validB !== validA) {
        return validB - validA
      }
      return (a.name || '').localeCompare(b.name || '')
    })

    return projects
  } catch (err) {
    console.error('Error discovering projects:', err)
    return []
  }
}

/**
 * Saves project data to data/projects/<slug>/project.json with a rolling backup.
 *
 * @param {string} projectSlug - Project identifier
 * @param {Object} projectData - Project metadata object
 * @returns {{ success: boolean, error?: string }}
 */
export function saveProjectFile(projectSlug, projectData) {
  try {
    const projDir = path.join(getProjectsDirPath(), projectSlug)
    if (!fs.existsSync(projDir)) {
      fs.mkdirSync(projDir, { recursive: true })
    }

    const filePath = getProjectFilePath(projectSlug)
    createRollingBackup(filePath, `project-${projectSlug}`)

    // Clean ephemeral properties for persistence
    const cleanedTracks = (projectData.tracks || []).map((t) => {
      const cleanT = {
        name: String(t.name || '').trim(),
        artist: String(t.artist || '').trim(),
        links: { ...(t.links || {}) },
      }
      if (t.cover && typeof t.cover === 'string') {
        if (!t.cover.startsWith('/api/media')) {
          cleanT.cover = t.cover
        } else if (t.cover.startsWith('/api/media/')) {
          const parts = t.cover
            .replace(/^\/api\/media\//, '')
            .split('?')[0]
            .split('/')
          const fn = parts[parts.length - 1]
          if (fn && fn !== 'art.jpg') {
            cleanT.cover = fn
          }
        }
      }
      return cleanT
    })

    let coverToPersist = projectData.cover !== undefined ? projectData.cover : 'art.jpg'
    if (typeof coverToPersist === 'string' && coverToPersist.startsWith('/api/media/')) {
      const parts = coverToPersist
        .replace(/^\/api\/media\//, '')
        .split('?')[0]
        .split('/')
      coverToPersist = parts[parts.length - 1] || ''
    } else if (typeof coverToPersist !== 'string') {
      coverToPersist = ''
    }

    const cleanedProject = {
      name: String(projectData.name || '').trim(),
      type: String(projectData.type || 'Single').trim(),
      artist: String(projectData.artist || '').trim(),
      date: String(projectData.date || '').trim(),
      visibility: projectData.visibility === 'private' ? 'private' : 'public',
      copyright: projectData.copyright === 'uncleared' ? 'uncleared' : 'cleared',
      ...(coverToPersist ? { cover: coverToPersist } : {}),
      tracks: cleanedTracks,
    }

    atomicWriteJson(filePath, cleanedProject)
    return { success: true }
  } catch (err) {
    console.error(`Error saving project ${projectSlug}:`, err)
    return { success: false, error: err.message }
  }
}

/**
 * Deletes a project folder data/projects/<slug>/.
 *
 * @param {string} projectSlug - Project identifier to delete
 * @returns {{ success: boolean, error?: string }}
 */
export function deleteProjectDirectory(projectSlug) {
  try {
    const projDir = path.join(getProjectsDirPath(), projectSlug)
    if (fs.existsSync(projDir)) {
      fs.rmSync(projDir, { recursive: true, force: true })
    }
    return { success: true }
  } catch (err) {
    console.error(`Error deleting project ${projectSlug}:`, err)
    return { success: false, error: err.message }
  }
}

/**
 * Scans the data/projects/ directory to sanitize project folder names, remove empty/invalid directories,
 * reconcile sluggified project folder names with project.json, clean unassociated audio files,
 * and enforce a single canonical artwork file per project.
 *
 * @param {string} [defaultArtistName='Artist']
 * @returns {Promise<{
 *   success: boolean,
 *   actions: Array<string>,
 *   emptyFoldersRemoved: number,
 *   foldersRenamed: number,
 *   projectsRenamed: number,
 *   extraAudioFilesRemoved: number,
 *   extraImageFilesRemoved: number,
 *   totalBytesReclaimed: number,
 *   validProjectsCount: number,
 * }>}
 */
export async function auditAndSanitizeProjectsDirectory(defaultArtistName = 'Artist') {
  const projectsDir = getProjectsDirPath()
  const { formatBytes } = await import('./analyticsUtils')

  const actions = []
  let emptyFoldersRemoved = 0
  let foldersRenamed = 0
  let projectsRenamed = 0
  let extraAudioFilesRemoved = 0
  let extraImageFilesRemoved = 0
  let totalBytesReclaimed = 0

  if (!fs.existsSync(projectsDir)) {
    return {
      success: true,
      actions,
      emptyFoldersRemoved: 0,
      foldersRenamed: 0,
      projectsRenamed: 0,
      extraAudioFilesRemoved: 0,
      extraImageFilesRemoved: 0,
      totalBytesReclaimed: 0,
      validProjectsCount: 0,
    }
  }

  let entries = []
  try {
    entries = fs.readdirSync(projectsDir, { withFileTypes: true })
  } catch (err) {
    console.error('Error reading projects directory during audit:', err)
    return { success: false, actions, error: err.message }
  }

  // Filter valid directory entries (excluding hidden directories)
  const dirEntries = entries.filter((e) => e.isDirectory() && !e.name.startsWith('.'))
  let validProjectsCount = 0

  for (const entry of dirEntries) {
    let currentDirName = entry.name
    let currentDirPath = path.join(projectsDir, currentDirName)

    if (!fs.existsSync(currentDirPath)) continue

    // 1. Check if folder is completely empty or only contains hidden/junk files
    let dirFiles = []
    try {
      dirFiles = fs.readdirSync(currentDirPath)
    } catch {
      continue
    }

    const nonHiddenFiles = dirFiles.filter((f) => !f.startsWith('.'))
    if (nonHiddenFiles.length === 0) {
      try {
        fs.rmSync(currentDirPath, { recursive: true, force: true })
        emptyFoldersRemoved++
        actions.push(`Deleted empty directory: data/projects/${currentDirName}`)
      } catch (rmErr) {
        console.warn(`Could not remove empty folder data/projects/${currentDirName}:`, rmErr.message)
      }
      continue
    }

    // 2. Check for project.json
    const projFilePath = path.join(currentDirPath, 'project.json')
    if (!fs.existsSync(projFilePath)) {
      const isOnlyJunk = nonHiddenFiles.every(
        (f) => f.endsWith('.tmp') || f.includes('.tmp.') || f.startsWith('project.corrupted'),
      )
      if (isOnlyJunk) {
        try {
          fs.rmSync(currentDirPath, { recursive: true, force: true })
          emptyFoldersRemoved++
          actions.push(`Deleted invalid directory without project.json: data/projects/${currentDirName}`)
        } catch {}
        continue
      }
      actions.push(`Warning: directory data/projects/${currentDirName} is missing project.json (preserved)`)
      continue
    }

    // 3. Read and parse project.json
    let rawJson = ''
    try {
      rawJson = fs.readFileSync(projFilePath, 'utf8')
    } catch {
      continue
    }

    let parsedProj = null
    try {
      parsedProj = JSON.parse(rawJson)
    } catch {
      parsedProj = tryHeuristicJsonRepair(rawJson)
    }

    if (!parsedProj || typeof parsedProj !== 'object') {
      archiveMalformedFile(projFilePath, rawJson, `project-${currentDirName}`)
      actions.push(`Quarantined malformed project.json in data/projects/${currentDirName}`)
      continue
    }

    // 4. Ensure valid project name & compute expected slug
    let projName =
      typeof parsedProj.name === 'string' && parsedProj.name.trim()
        ? parsedProj.name.trim()
        : currentDirName.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

    let expectedSlug = slugify(projName) || 'untitled-project'

    // 5. Slug Reconciliation & Collisions
    if (currentDirName !== expectedSlug) {
      let targetSlug = expectedSlug
      let targetPath = path.join(projectsDir, targetSlug)

      // If targetSlug already exists and is a DIFFERENT directory
      if (fs.existsSync(targetPath) && targetPath.toLowerCase() !== currentDirPath.toLowerCase()) {
        let counter = 1
        while (fs.existsSync(path.join(projectsDir, `${expectedSlug}-${counter}`))) {
          counter++
        }
        targetSlug = `${expectedSlug}-${counter}`
        targetPath = path.join(projectsDir, targetSlug)

        const updatedProjName = `${projName} (${counter})`
        parsedProj.name = updatedProjName
        projName = updatedProjName
        atomicWriteJson(projFilePath, parsedProj)
        projectsRenamed++
        actions.push(
          `Renamed duplicate project title to "${updatedProjName}" in data/projects/${currentDirName}/project.json`,
        )
      }

      // Rename directory to targetSlug
      try {
        if (currentDirPath.toLowerCase() === targetPath.toLowerCase()) {
          const tempHop = path.join(
            projectsDir,
            `.tmp-rename-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          )
          fs.renameSync(currentDirPath, tempHop)
          fs.renameSync(tempHop, targetPath)
        } else {
          fs.renameSync(currentDirPath, targetPath)
        }
        foldersRenamed++
        actions.push(`Renamed directory data/projects/${currentDirName} to data/projects/${targetSlug}`)
        currentDirName = targetSlug
        currentDirPath = targetPath
      } catch (renameErr) {
        console.warn(`Could not rename folder ${currentDirName} to ${targetSlug}:`, renameErr.message)
      }
    }

    validProjectsCount++

    // 6. Inspect & sanitize assets inside data/projects/<currentDirName>
    let filesInDir = []
    try {
      filesInDir = fs.readdirSync(currentDirPath)
    } catch {
      continue
    }

    const validTrackSlugs = new Set(
      (parsedProj.tracks || [])
        .map((t) => (t && typeof t.name === 'string' ? slugify(t.name) : null))
        .filter(Boolean),
    )

    // Audio file sanitization
    for (const f of filesInDir) {
      const fPath = path.join(currentDirPath, f)
      try {
        const stat = fs.statSync(fPath)
        if (!stat.isFile()) continue

        const ext = path.extname(f).toLowerCase()
        if (SUPPORTED_AUDIO_EXTS.includes(ext)) {
          const baseName = path.basename(f, ext)
          if (!validTrackSlugs.has(baseName)) {
            const fSize = stat.size
            fs.unlinkSync(fPath)
            extraAudioFilesRemoved++
            totalBytesReclaimed += fSize
            actions.push(
              `Deleted extra unassociated audio file: data/projects/${currentDirName}/${f} (${formatBytes(fSize)})`,
            )
          }
        }
      } catch (fileErr) {
        console.warn(`Error processing file ${f} in project ${currentDirName}:`, fileErr.message)
      }
    }

    // Artwork sanitization: enforce single canonical art.<ext>
    try {
      const recheckedFiles = fs.readdirSync(currentDirPath)
      const imageFiles = recheckedFiles.filter((f) => {
        const ext = path.extname(f).toLowerCase()
        return SUPPORTED_IMAGE_EXTS.includes(ext)
      })

      if (imageFiles.length > 0) {
        // Determine canonical artwork file
        let canonicalArt =
          imageFiles.find((f) => f.toLowerCase() === 'art.jpg') ||
          imageFiles.find((f) => f.toLowerCase().startsWith('art.')) ||
          imageFiles[0]

        // Standardize canonical image name to lowercase art.<ext>
        const cExt = path.extname(canonicalArt).toLowerCase()
        const targetArtName = `art${cExt}`

        if (canonicalArt !== targetArtName) {
          const oldArtPath = path.join(currentDirPath, canonicalArt)
          const newArtPath = path.join(currentDirPath, targetArtName)
          try {
            if (oldArtPath.toLowerCase() === newArtPath.toLowerCase()) {
              const tempArtHop = path.join(
                currentDirPath,
                `.tmp-art-hop-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              )
              fs.renameSync(oldArtPath, tempArtHop)
              fs.renameSync(tempArtHop, newArtPath)
            } else {
              fs.renameSync(oldArtPath, newArtPath)
            }
            actions.push(
              `Standardized artwork filename to ${targetArtName} in data/projects/${currentDirName}`,
            )
            canonicalArt = targetArtName
            parsedProj.cover = targetArtName
            atomicWriteJson(path.join(currentDirPath, 'project.json'), parsedProj)
          } catch (artRenameErr) {
            console.warn(`Could not standardize artwork filename:`, artRenameErr.message)
          }
        }

        // Delete any redundant/extra artwork files
        const remainingImages = fs.readdirSync(currentDirPath).filter((f) => {
          const ext = path.extname(f).toLowerCase()
          return SUPPORTED_IMAGE_EXTS.includes(ext)
        })

        for (const imgFile of remainingImages) {
          if (imgFile.toLowerCase() === canonicalArt.toLowerCase()) continue
          const redundantPath = path.join(currentDirPath, imgFile)
          try {
            const stat = fs.statSync(redundantPath)
            if (stat.isFile()) {
              const rSize = stat.size
              fs.unlinkSync(redundantPath)
              extraImageFilesRemoved++
              totalBytesReclaimed += rSize
              actions.push(
                `Deleted redundant artwork file: data/projects/${currentDirName}/${imgFile} (${formatBytes(rSize)})`,
              )
            }
          } catch (rErr) {
            console.warn(`Error deleting redundant art ${imgFile}:`, rErr.message)
          }
        }
      }
    } catch (artErr) {
      console.warn(`Error sanitizing artwork for project ${currentDirName}:`, artErr.message)
    }
  }

  return {
    success: true,
    actions,
    emptyFoldersRemoved,
    foldersRenamed,
    projectsRenamed,
    extraAudioFilesRemoved,
    extraImageFilesRemoved,
    totalBytesReclaimed,
    validProjectsCount,
  }
}
