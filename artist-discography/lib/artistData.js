import fs from 'fs'
import path from 'path'
import { slugify } from './slugs'

export const DEFAULT_CONFIG_SCAFFOLD = {
  adminAccess: true,
  adminPassword: 'admin123',
  devAccess: false,
  privateAccessCode: 'access123',
  siteUrl: 'localhost',
  artist: {
    name: '',
    bio: '',
    links: {
      platforms: {
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
      socials: {
        discord: '',
        facebook: '',
        instagram: '',
        snapchat: '',
        tiktok: '',
        x: '',
      },
    },
  },
}

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

export const DEFAULT_DATA_SCAFFOLD = {
  ...DEFAULT_CONFIG_SCAFFOLD,
  projects: [DEFAULT_PROJECT_SCAFFOLD],
}

export function getConfigFilePath() {
  return path.join(process.cwd(), 'data', 'config.json')
}

export function getProjectsDirPath() {
  return path.join(process.cwd(), 'data', 'projects')
}

export function getProjectFilePath(projectSlug) {
  return path.join(process.cwd(), 'data', 'projects', projectSlug, 'project.json')
}

export function getLegacyArtistDataFilePath() {
  return path.join(process.cwd(), 'data', 'artist-data.json')
}

export function getArtistDataFilePath() {
  return getConfigFilePath()
}

const SUPPORTED_AUDIO_EXTS = ['.mp3', '.m4a', '.wav', '.ogg', '.flac', '.aac', '.mp4', '.webm']
const SUPPORTED_IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.gif', '.avif']
const MAX_BACKUPS_TO_KEEP = 15

function resolveLocalPath(baseDir, relativePath) {
  try {
    const fullPath = path.resolve(path.join(baseDir, relativePath))
    if (fullPath.startsWith(baseDir) && fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
      return fullPath
    }
  } catch {}
  return null
}

/**
 * Creates an automated timestamped snapshot backup in data/backups/
 * Bounded to keep the latest MAX_BACKUPS_TO_KEEP files for a given prefix.
 *
 * @param {string} sourceFilePath
 * @param {string} [prefix='config']
 */
export function createRollingBackup(sourceFilePath, prefix = 'config') {
  try {
    if (!sourceFilePath || !fs.existsSync(sourceFilePath)) return null

    const dataDir = path.join(process.cwd(), 'data')
    const backupsDir = path.join(dataDir, 'backups')
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true })
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const safePrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, '_')
    const backupFile = path.join(backupsDir, `${safePrefix}-${timestamp}.json`)
    fs.copyFileSync(sourceFilePath, backupFile)

    // Maintain bounded rolling window for this prefix
    try {
      const existingBackups = fs
        .readdirSync(backupsDir)
        .filter((f) => f.startsWith(`${safePrefix}-`) && f.endsWith('.json'))
        .map((f) => {
          const full = path.join(backupsDir, f)
          return { name: f, fullPath: full, time: fs.statSync(full).mtimeMs }
        })
        .sort((a, b) => b.time - a.time)

      if (existingBackups.length > MAX_BACKUPS_TO_KEEP) {
        for (const oldBackup of existingBackups.slice(MAX_BACKUPS_TO_KEEP)) {
          try {
            fs.unlinkSync(oldBackup.fullPath)
          } catch {}
        }
      }
    } catch (pruneErr) {
      console.warn('Warning during rolling backup pruning:', pruneErr)
    }

    return backupFile
  } catch (err) {
    console.warn('Warning: Failed to create rolling snapshot backup:', err)
    return null
  }
}

/**
 * Safely archives a malformed/corrupted JSON file to data/<prefix>.corrupted-<timestamp>.json
 * before any fallback scaffolding is initialized.
 *
 * @param {string} filePath
 * @param {string} rawContent
 * @param {string} [prefix='config']
 * @returns {string|null} Path to archived file
 */
export function archiveMalformedFile(filePath, rawContent, prefix = 'config') {
  try {
    const dataDir = path.join(process.cwd(), 'data')
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const safePrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, '_')
    const corruptedPath = path.join(dataDir, `${safePrefix}.corrupted-${timestamp}.json`)
    fs.writeFileSync(corruptedPath, rawContent, 'utf8')
    console.error(`CRITICAL: Malformed JSON file archived to ${corruptedPath}`)
    return corruptedPath
  } catch (err) {
    console.error('Failed to archive corrupted JSON file:', err)
    return null
  }
}

/**
 * Attempts heuristic syntax repairs on corrupted JSON strings
 * (removes JS comments, strips trailing commas, auto-closes unclosed quotes and braces).
 *
 * @param {string} raw
 * @returns {Object|null}
 */
export function tryHeuristicJsonRepair(raw) {
  if (typeof raw !== 'string') return null
  let text = raw.trim()
  if (!text) return null

  // 1. Remove JavaScript-style comments (// and /* */)
  text = text.replace(/\/\*[\s\S]*?\*\/|([^:]|^)\/\/.*$/gm, '$1').trim()

  // 2. Remove trailing commas before } or ]
  text = text.replace(/,\s*([}\]])/g, '$1')

  // 3. Try standard parse
  try {
    return JSON.parse(text)
  } catch {}

  // 4. Check for unclosed string quote
  const quoteCount = (text.match(/(?<!\\)"/g) || []).length
  if (quoteCount % 2 !== 0) {
    text += '"'
  }

  // 5. Clean any trailing commas again
  text = text.replace(/,\s*([}\]])/g, '$1')

  // 6. Fix missing closing brackets/braces in matching nesting order
  const stack = []
  let inString = false
  let escaped = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (escaped) {
      escaped = false
      continue
    }
    if (ch === '\\') {
      escaped = true
      continue
    }
    if (ch === '"') {
      inString = !inString
      continue
    }
    if (!inString) {
      if (ch === '{') stack.push('}')
      else if (ch === '[') stack.push(']')
      else if (ch === '}' || ch === ']') {
        if (stack.length > 0 && stack[stack.length - 1] === ch) {
          stack.pop()
        }
      }
    }
  }

  while (stack.length > 0) {
    text += stack.pop()
  }

  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

/**
 * Atomically writes data to disk using an adjacent temporary swap file.
 *
 * @param {string} filePath
 * @param {Object} data
 */
function atomicWriteJson(filePath, data) {
  const dirPath = path.dirname(filePath)
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }

  const baseName = path.basename(filePath)
  const rand = Math.random().toString(36).substring(2, 8)
  const tempPath = path.join(dirPath, `.${baseName}.tmp.${process.pid}.${Date.now()}.${rand}`)
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8')

  const maxRetries = 5
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      fs.renameSync(tempPath, filePath)
      return
    } catch (err) {
      if (
        (err.code === 'EBUSY' || err.code === 'EPERM' || err.code === 'EACCES') &&
        attempt < maxRetries
      ) {
        const start = Date.now()
        while (Date.now() - start < 40 * attempt) {}
      } else {
        if (attempt === maxRetries) {
          // If rename completely fails, fallback to direct write and remove temp
          try {
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8')
            try {
              fs.unlinkSync(tempPath)
            } catch {}
            return
          } catch (writeErr) {
            console.error(`Failed atomic write swap for ${filePath}:`, err)
            throw writeErr
          }
        }
      }
    }
  }
}

/**
 * Automatically migrates legacy data/artist-data.json into data/config.json
 * and per-project project.json files if encountered.
 */
export function migrateLegacyMonolithIfNeeded() {
  const configPath = getConfigFilePath()
  const legacyPath = getLegacyArtistDataFilePath()

  if (!fs.existsSync(configPath) && fs.existsSync(legacyPath)) {
    try {
      console.log(
        'Migrating legacy artist-data.json into config.json and per-project project.json files...',
      )
      const raw = fs.readFileSync(legacyPath, 'utf8')
      let parsed = null
      try {
        parsed = JSON.parse(raw)
      } catch {
        parsed = tryHeuristicJsonRepair(raw)
      }

      if (parsed && typeof parsed === 'object') {
        createRollingBackup(legacyPath, 'artist-data.pre-migration')

        const configData = {
          adminAccess: Boolean(parsed.adminAccess),
          adminPassword: String(parsed.adminPassword || DEFAULT_CONFIG_SCAFFOLD.adminPassword),
          devAccess: Boolean(parsed.devAccess),
          privateAccessCode: String(
            parsed.privateAccessCode || DEFAULT_CONFIG_SCAFFOLD.privateAccessCode,
          ),
          siteUrl: String(parsed.siteUrl || DEFAULT_CONFIG_SCAFFOLD.siteUrl),
          artist: parsed.artist || { ...DEFAULT_CONFIG_SCAFFOLD.artist },
        }

        atomicWriteJson(configPath, configData)

        if (Array.isArray(parsed.projects)) {
          const projectsDir = getProjectsDirPath()
          for (let i = 0; i < parsed.projects.length; i++) {
            const proj = parsed.projects[i]
            if (!proj || typeof proj !== 'object') continue
            const slug = slugify(proj.name) || `project-${i + 1}`
            const projFilePath = getProjectFilePath(slug)

            let coverFilename = 'art.jpg'
            if (proj.cover && typeof proj.cover === 'string') {
              if (proj.cover.startsWith('http://') || proj.cover.startsWith('https://')) {
                coverFilename = proj.cover
              } else {
                const parts = proj.cover.split('?')[0].split('/')
                coverFilename = parts[parts.length - 1] || 'art.jpg'
              }
            }

            const cleanTracks = Array.isArray(proj.tracks)
              ? proj.tracks.map((t) => {
                  let trackCover = undefined
                  if (t.cover && typeof t.cover === 'string') {
                    if (t.cover.startsWith('http://') || t.cover.startsWith('https://')) {
                      trackCover = t.cover
                    } else {
                      const parts = t.cover.split('?')[0].split('/')
                      const fn = parts[parts.length - 1]
                      if (fn && fn !== coverFilename && fn !== 'art.jpg') {
                        trackCover = fn
                      }
                    }
                  }
                  return {
                    name: String(t.name || ''),
                    artist: String(t.artist || ''),
                    links: { ...(t.links || {}) },
                    ...(trackCover ? { cover: trackCover } : {}),
                  }
                })
              : []

            const projectData = {
              name: String(proj.name || ''),
              type: String(proj.type || 'Single'),
              artist: String(proj.artist || ''),
              date: String(proj.date || ''),
              visibility: proj.visibility === 'private' ? 'private' : 'public',
              copyright: proj.copyright === 'uncleared' ? 'uncleared' : 'cleared',
              cover: coverFilename,
              tracks: cleanTracks,
            }

            atomicWriteJson(projFilePath, projectData)
          }
        }

        try {
          fs.unlinkSync(legacyPath)
        } catch {}
        console.log('Legacy data migration completed successfully.')
      }
    } catch (migErr) {
      console.error('Error during legacy artist-data.json migration:', migErr)
    }
  }
}

export class ArtistDataManager {
  static getConfigPath() {
    return getConfigFilePath()
  }

  static getProjectsPath() {
    return getProjectsDirPath()
  }

  /**
   * Validates and repairs the config.json schema.
   */
  static validateAndRepairConfig(raw, issues = []) {
    let repaired = false
    const data = typeof raw === 'object' && raw !== null ? { ...raw } : {}

    if (typeof data.adminAccess !== 'boolean') {
      data.adminAccess = DEFAULT_CONFIG_SCAFFOLD.adminAccess
      repaired = true
      issues.push('Missing or invalid "adminAccess" boolean property.')
    }

    if (typeof data.adminPassword !== 'string') {
      data.adminPassword = DEFAULT_CONFIG_SCAFFOLD.adminPassword
      repaired = true
      issues.push('Missing or invalid "adminPassword" string property.')
    }

    if (typeof data.devAccess !== 'boolean') {
      data.devAccess = DEFAULT_CONFIG_SCAFFOLD.devAccess
      repaired = true
      issues.push('Missing or invalid "devAccess" boolean property.')
    }

    if (typeof data.privateAccessCode !== 'string') {
      data.privateAccessCode =
        typeof DEFAULT_CONFIG_SCAFFOLD.privateAccessCode === 'string'
          ? DEFAULT_CONFIG_SCAFFOLD.privateAccessCode
          : ''
      repaired = true
      issues.push('Missing or invalid "privateAccessCode" string property.')
    }

    if (typeof data.siteUrl !== 'string') {
      data.siteUrl =
        typeof DEFAULT_CONFIG_SCAFFOLD.siteUrl === 'string'
          ? DEFAULT_CONFIG_SCAFFOLD.siteUrl
          : 'localhost'
      repaired = true
      issues.push('Missing or invalid "siteUrl" string property.')
    }

    if (typeof data.artist !== 'object' || data.artist === null) {
      data.artist = { ...DEFAULT_CONFIG_SCAFFOLD.artist }
      repaired = true
      issues.push('Missing or invalid "artist" object.')
    } else {
      data.artist = { ...data.artist }
    }

    if (typeof data.artist.name !== 'string') {
      data.artist.name = DEFAULT_CONFIG_SCAFFOLD.artist.name
      repaired = true
      issues.push('Missing or invalid "artist.name" string property.')
    }

    if (typeof data.artist.bio !== 'string') {
      data.artist.bio = DEFAULT_CONFIG_SCAFFOLD.artist.bio
      repaired = true
      issues.push('Missing or invalid "artist.bio" string property.')
    }

    if (typeof data.artist.links !== 'object' || data.artist.links === null) {
      data.artist.links = { ...DEFAULT_CONFIG_SCAFFOLD.artist.links }
      repaired = true
      issues.push('Missing or invalid "artist.links" object.')
    } else {
      data.artist.links = { ...data.artist.links }
    }

    const platformsDefault = DEFAULT_CONFIG_SCAFFOLD.artist.links.platforms
    if (typeof data.artist.links.platforms !== 'object' || data.artist.links.platforms === null) {
      data.artist.links.platforms = { ...platformsDefault }
      repaired = true
      issues.push('Missing or invalid "artist.links.platforms" object.')
    } else {
      const pObj = { ...data.artist.links.platforms }
      for (const key of Object.keys(platformsDefault)) {
        if (typeof pObj[key] !== 'string') {
          pObj[key] = ''
          repaired = true
          issues.push(`Missing platform key "${key}" under artist.links.platforms.`)
        }
      }
      data.artist.links.platforms = pObj
    }

    const socialsDefault = DEFAULT_CONFIG_SCAFFOLD.artist.links.socials
    if (typeof data.artist.links.socials !== 'object' || data.artist.links.socials === null) {
      data.artist.links.socials = { ...socialsDefault }
      repaired = true
      issues.push('Missing or invalid "artist.links.socials" object.')
    } else {
      const sObj = { ...data.artist.links.socials }
      for (const key of Object.keys(socialsDefault)) {
        if (typeof sObj[key] !== 'string') {
          sObj[key] = ''
          repaired = true
          issues.push(`Missing social key "${key}" under artist.links.socials.`)
        }
      }
      data.artist.links.socials = sObj
    }

    return { data, repaired }
  }

  /**
   * Loads and validates data/config.json.
   */
  static loadConfig() {
    const issues = []
    let createdNewFile = false

    migrateLegacyMonolithIfNeeded()

    try {
      const filePath = getConfigFilePath()

      if (!fs.existsSync(filePath)) {
        const dirPath = path.dirname(filePath)
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true })
        }
        atomicWriteJson(filePath, DEFAULT_CONFIG_SCAFFOLD)
        createdNewFile = true
        issues.push('Config file did not exist. Created new scaffold at data/config.json.')
        return {
          data: { ...DEFAULT_CONFIG_SCAFFOLD },
          health: { isHealthy: true, createdNewFile, issues },
        }
      }

      let rawContent = ''
      try {
        rawContent = fs.readFileSync(filePath, 'utf8')
      } catch (err) {
        issues.push(`Failed to read config.json: ${err.message}`)
        return {
          data: { ...DEFAULT_CONFIG_SCAFFOLD },
          health: { isHealthy: false, createdNewFile: false, issues },
        }
      }

      let parsedData = null
      let wasHeuristicallyRepaired = false

      try {
        parsedData = JSON.parse(rawContent)
      } catch (parseErr) {
        const repaired = tryHeuristicJsonRepair(rawContent)
        if (repaired && typeof repaired === 'object') {
          parsedData = repaired
          wasHeuristicallyRepaired = true
          issues.push('Heuristically auto-repaired JSON syntax corruption in config.json.')
        } else {
          const corruptedPath = archiveMalformedFile(filePath, rawContent, 'config')
          issues.push(
            `Invalid JSON syntax in config.json: ${parseErr.message}. Archived to ${path.basename(corruptedPath || '')}.`,
          )
          atomicWriteJson(filePath, DEFAULT_CONFIG_SCAFFOLD)
          return {
            data: { ...DEFAULT_CONFIG_SCAFFOLD },
            health: { isHealthy: false, createdNewFile: false, issues },
          }
        }
      }

      const { data: repairedData, repaired } = this.validateAndRepairConfig(parsedData, issues)

      if (repaired || wasHeuristicallyRepaired) {
        try {
          createRollingBackup(filePath, 'config')
          atomicWriteJson(filePath, repairedData)
          issues.push('Structural schema issues auto-repaired in config.json.')
        } catch (err) {
          issues.push(`Failed to auto-save repaired config.json: ${err.message}`)
        }
      }

      return {
        data: JSON.parse(JSON.stringify(repairedData)),
        health: {
          isHealthy: issues.length === 0,
          createdNewFile,
          issues,
        },
      }
    } catch (err) {
      return {
        data: { ...DEFAULT_CONFIG_SCAFFOLD },
        health: {
          isHealthy: false,
          createdNewFile: false,
          issues: [`Unexpected error loading config: ${err.message}`],
        },
      }
    }
  }

  /**
   * Validates, repairs, and resolves assets for a single project object.
   */
  static validateAndResolveProject(raw, projectSlug, defaultArtistName = 'Artist', issues = []) {
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

        // Track cover
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
   * Loads a single project from data/projects/<slug>/project.json.
   */
  static loadProject(projectSlug, defaultArtistName = 'Artist') {
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

      const { project } = this.validateAndResolveProject(parsed, projectSlug, defaultArtistName)
      return project
    } catch (err) {
      console.error(`Error loading project ${projectSlug}:`, err)
      return null
    }
  }

  /**
   * Discovers and loads all projects from data/projects/ directory.
   * Sorted naturally by release date descending (newest first).
   */
  static loadAllProjects(defaultArtistName = 'Artist') {
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
          const proj = this.loadProject(slug, defaultArtistName)
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
   * Unified data loader that combines config.json and all project.json files.
   */
  static loadData() {
    const { data: configData, health: configHealth } = this.loadConfig()
    const artistName = configData.artist?.name || 'Artist'
    const projects = this.loadAllProjects(artistName)

    const issues = [...(configHealth.issues || [])]

    let totalTracksCount = 0
    let tracksWithAudioCount = 0
    let totalProjectsCount = projects.length
    let projectsWithCoverCount = 0

    for (const proj of projects) {
      if (proj.hasCover) projectsWithCoverCount++
      if (Array.isArray(proj.tracks)) {
        for (const track of proj.tracks) {
          totalTracksCount++
          if (track.hasAudio) tracksWithAudioCount++
        }
      }
    }

    if (totalTracksCount > 0 && tracksWithAudioCount < totalTracksCount) {
      issues.push(
        `Audio Coverage: ${tracksWithAudioCount} of ${totalTracksCount} tracks have audio files in data/projects/.`,
      )
    }
    if (totalProjectsCount > 0 && projectsWithCoverCount < totalProjectsCount) {
      issues.push(
        `Album Art Coverage: ${projectsWithCoverCount} of ${totalProjectsCount} projects have cover art in data/projects/.`,
      )
    }

    const unifiedData = {
      ...configData,
      projects,
    }

    return {
      data: unifiedData,
      health: {
        isHealthy: configHealth.isHealthy && issues.length === 0,
        createdNewFile: configHealth.createdNewFile,
        issues,
      },
    }
  }

  /**
   * Saves config data to data/config.json.
   */
  static saveConfig(configData) {
    try {
      const filePath = getConfigFilePath()
      createRollingBackup(filePath, 'config')

      const issues = []
      const { data: sanitizedConfig } = this.validateAndRepairConfig(configData, issues)
      atomicWriteJson(filePath, sanitizedConfig)

      return { success: true, issues }
    } catch (err) {
      console.error('Error saving config.json:', err)
      return { success: false, error: err.message }
    }
  }

  /**
   * Saves project data to data/projects/<slug>/project.json.
   */
  static saveProject(projectSlug, projectData) {
    try {
      const projDir = path.join(getProjectsDirPath(), projectSlug)
      if (!fs.existsSync(projDir)) {
        fs.mkdirSync(projDir, { recursive: true })
      }

      const filePath = getProjectFilePath(projectSlug)
      createRollingBackup(filePath, `project-${projectSlug}`)

      // Clean properties for persistence (omit resolved audioUrl, hasAudio, hasCover, etc.)
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

      let coverToPersist = projectData.cover || 'art.jpg'
      if (typeof coverToPersist === 'string' && coverToPersist.startsWith('/api/media/')) {
        const parts = coverToPersist
          .replace(/^\/api\/media\//, '')
          .split('?')[0]
          .split('/')
        coverToPersist = parts[parts.length - 1] || 'art.jpg'
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
   */
  static deleteProject(projectSlug) {
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
   * Saves comprehensive data (config + projects), used for batch dev operations like seed dummy.
   */
  static saveData(data) {
    try {
      const { projects, ...configFields } = data || {}
      const configRes = this.saveConfig(configFields)
      if (!configRes.success) {
        return configRes
      }

      if (Array.isArray(projects)) {
        for (let i = 0; i < projects.length; i++) {
          const proj = projects[i]
          const slug = slugify(proj.name) || `project-${i + 1}`
          const projRes = this.saveProject(slug, proj)
          if (!projRes.success) {
            return projRes
          }
        }
      }

      return { success: true }
    } catch (err) {
      console.error('Error saving artist data:', err)
      return { success: false, error: err.message }
    }
  }
}

export function loadArtistData() {
  try {
    return ArtistDataManager.loadData()
  } catch (err) {
    return {
      data: DEFAULT_DATA_SCAFFOLD,
      health: {
        isHealthy: false,
        createdNewFile: false,
        issues: [`Failed to load artist data: ${err.message}`],
      },
    }
  }
}

export function loadConfigData() {
  return ArtistDataManager.loadConfig()
}

export function loadAllProjectsData(defaultArtistName = 'Artist') {
  return ArtistDataManager.loadAllProjects(defaultArtistName)
}

export function loadProjectData(projectSlug, defaultArtistName = 'Artist') {
  return ArtistDataManager.loadProject(projectSlug, defaultArtistName)
}

export function saveConfigData(config) {
  return ArtistDataManager.saveConfig(config)
}

export function saveProjectData(projectSlug, projectData) {
  return ArtistDataManager.saveProject(projectSlug, projectData)
}

export function deleteProjectData(projectSlug) {
  return ArtistDataManager.deleteProject(projectSlug)
}

export function saveArtistData(data) {
  return ArtistDataManager.saveData(data)
}

/**
 * Normalizes a configured siteUrl string into a valid absolute base URL.
 * Defaults to 'http://localhost:3000' if set to 'localhost', empty, or omitted.
 *
 * @param {string} [url]
 * @returns {string}
 */
export function normalizeSiteUrl(url) {
  if (!url) return 'http://localhost:3000'
  const trimmed = String(url).trim().replace(/\/+$/, '')
  if (!trimmed || trimmed === 'localhost') return 'http://localhost:3000'
  if (trimmed.startsWith('localhost:') || trimmed.startsWith('127.0.0.1:'))
    return `http://${trimmed}`
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}
