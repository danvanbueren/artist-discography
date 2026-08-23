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
