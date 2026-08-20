import fs from 'fs'
import path from 'path'
import { slugify } from './slugs'

export const DEFAULT_DATA_SCAFFOLD = {
  adminAccess: true,
  adminPassword: 'admin123',
  devAccess: false,
  privateAccessCode: 'access123',
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
  projects: [
    {
      name: '',
      type: '',
      artist: '',
      date: '',
      cover: '',
      visibility: 'public',
      copyright: 'cleared',
      tracks: [
        {
          name: '',
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
    },
  ],
}

export function getArtistDataFilePath() {
  return path.join(process.cwd(), 'data', 'artist-data.json')
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
 * Bounded to keep the latest MAX_BACKUPS_TO_KEEP files.
 *
 * @param {string} sourceFilePath
 */
export function createRollingBackup(sourceFilePath) {
  try {
    if (!sourceFilePath || !fs.existsSync(sourceFilePath)) return null

    const dataDir = path.dirname(sourceFilePath)
    const backupsDir = path.join(dataDir, 'backups')
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true })
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupFile = path.join(backupsDir, `artist-data-${timestamp}.json`)
    fs.copyFileSync(sourceFilePath, backupFile)

    // Maintain bounded rolling window
    try {
      const existingBackups = fs.readdirSync(backupsDir)
        .filter((f) => f.startsWith('artist-data-') && f.endsWith('.json'))
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
 * Safely archives a malformed/corrupted JSON file to data/artist-data.corrupted-<timestamp>.json
 * before any fallback scaffolding is initialized.
 *
 * @param {string} filePath
 * @param {string} rawContent
 * @returns {string|null} Path to archived file
 */
export function archiveMalformedFile(filePath, rawContent) {
  try {
    const dataDir = path.dirname(filePath)
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const corruptedPath = path.join(dataDir, `artist-data.corrupted-${timestamp}.json`)
    fs.writeFileSync(corruptedPath, rawContent, 'utf8')
    console.error(`CRITICAL: Malformed artist-data.json archived to ${corruptedPath}`)
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

  const rand = Math.random().toString(36).substring(2, 8)
  const tempPath = path.join(dirPath, `.artist-data.json.tmp.${process.pid}.${Date.now()}.${rand}`)
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8')
  fs.renameSync(tempPath, filePath)
}

export class ArtistDataManager {
  static getFilePath() {
    return getArtistDataFilePath()
  }

  static loadData() {
    const issues = []
    let createdNewFile = false

    try {
      const filePath = this.getFilePath()

      let fileExists = false
      try {
        fileExists = fs.existsSync(filePath)
      } catch (err) {
        issues.push(`Error checking existence of data file: ${err.message}`)
      }

      if (!fileExists) {
        const dirPath = path.dirname(filePath)
        try {
          if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true })
          }
          atomicWriteJson(filePath, DEFAULT_DATA_SCAFFOLD)
          createdNewFile = true
          issues.push('JSON file did not exist. Created new scaffold at data/artist-data.json.')
        } catch (err) {
          issues.push(`data/ folder or artist-data.json file did not exist and could not be created automatically: ${err.message}`)
        }
        return {
          data: DEFAULT_DATA_SCAFFOLD,
          health: {
            isHealthy: createdNewFile,
            createdNewFile,
            issues,
          },
        }
      }

      let rawContent = ''
      try {
        rawContent = fs.readFileSync(filePath, 'utf8')
      } catch (err) {
        issues.push(`Failed to read JSON file: ${err.message}`)
        return {
          data: DEFAULT_DATA_SCAFFOLD,
          health: {
            isHealthy: false,
            createdNewFile: false,
            issues,
          },
        }
      }

      let parsedData = null
      let wasHeuristicallyRepaired = false

      try {
        parsedData = JSON.parse(rawContent)
      } catch (parseErr) {
        // Attempt heuristic recovery before destructive fallback
        const repaired = tryHeuristicJsonRepair(rawContent)
        if (repaired && typeof repaired === 'object') {
          parsedData = repaired
          wasHeuristicallyRepaired = true
          issues.push('Heuristically auto-repaired minor JSON syntax corruption (e.g. comments, trailing commas, unclosed brackets).')
        } else {
          // Zero-Data-Loss quarantine: Archive corrupted file without deleting raw user content
          const corruptedPath = archiveMalformedFile(filePath, rawContent)
          issues.push(`Invalid JSON syntax in file: ${parseErr.message}. Archived raw corrupted file to ${path.basename(corruptedPath || '')}.`)

          // Create fresh fallback so app remains functional
          try {
            atomicWriteJson(filePath, DEFAULT_DATA_SCAFFOLD)
            issues.push('Initialized working fallback default scaffold.')
          } catch (writeErr) {
            issues.push(`Failed to write fallback scaffold: ${writeErr.message}`)
          }

          return {
            data: DEFAULT_DATA_SCAFFOLD,
            health: {
              isHealthy: false,
              createdNewFile: false,
              issues,
            },
          }
        }
      }

      const { data: repairedData, repaired } = this.validateAndRepair(parsedData, issues)

      if (repaired || wasHeuristicallyRepaired) {
        try {
          createRollingBackup(filePath)
          atomicWriteJson(filePath, repairedData)
          issues.push('Structural schema issues detected and auto-repaired in artist-data.json.')
        } catch (err) {
          issues.push(`Failed to auto-save repaired JSON structure: ${err.message}`)
        }
      }

      const sanitizedData = JSON.parse(JSON.stringify(repairedData))

      return {
        data: sanitizedData,
        health: {
          isHealthy: issues.length === 0,
          createdNewFile,
          issues: [...issues],
        },
      }
    } catch (err) {
      return {
        data: DEFAULT_DATA_SCAFFOLD,
        health: {
          isHealthy: false,
          createdNewFile: false,
          issues: [`Unexpected error loading artist data: ${err.message}`],
        },
      }
    }
  }

  static validateAndRepair(raw, issues = []) {
    let repaired = false
    const data = typeof raw === 'object' && raw !== null ? { ...raw } : {}

    if (typeof data.adminAccess !== 'boolean') {
      data.adminAccess = DEFAULT_DATA_SCAFFOLD.adminAccess
      repaired = true
      issues.push('Missing or invalid "adminAccess" boolean property.')
    }

    if (typeof data.adminPassword !== 'string') {
      data.adminPassword = DEFAULT_DATA_SCAFFOLD.adminPassword
      repaired = true
      issues.push('Missing or invalid "adminPassword" string property.')
    }

    if (typeof data.devAccess !== 'boolean') {
      data.devAccess = DEFAULT_DATA_SCAFFOLD.devAccess
      repaired = true
      issues.push('Missing or invalid "devAccess" boolean property.')
    }

    if (typeof data.privateAccessCode !== 'string') {
      data.privateAccessCode = typeof DEFAULT_DATA_SCAFFOLD.privateAccessCode === 'string' ? DEFAULT_DATA_SCAFFOLD.privateAccessCode : ''
      repaired = true
      issues.push('Missing or invalid "privateAccessCode" string property.')
    }

    if (typeof data.artist !== 'object' || data.artist === null) {
      data.artist = { ...DEFAULT_DATA_SCAFFOLD.artist }
      repaired = true
      issues.push('Missing or invalid "artist" object.')
    } else {
      data.artist = { ...data.artist }
    }

    if (typeof data.artist.name !== 'string') {
      data.artist.name = DEFAULT_DATA_SCAFFOLD.artist.name
      repaired = true
      issues.push('Missing or invalid "artist.name" string property.')
    }

    if (typeof data.artist.bio !== 'string') {
      data.artist.bio = DEFAULT_DATA_SCAFFOLD.artist.bio
      repaired = true
      issues.push('Missing or invalid "artist.bio" string property.')
    }

    if (typeof data.artist.links !== 'object' || data.artist.links === null) {
      data.artist.links = { ...DEFAULT_DATA_SCAFFOLD.artist.links }
      repaired = true
      issues.push('Missing or invalid "artist.links" object.')
    } else {
      data.artist.links = { ...data.artist.links }
    }

    const platformsDefault = DEFAULT_DATA_SCAFFOLD.artist.links.platforms
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

    const socialsDefault = DEFAULT_DATA_SCAFFOLD.artist.links.socials
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

    const dataDir = path.join(process.cwd(), 'data')
    let totalTracksCount = 0
    let tracksWithAudioCount = 0
    let totalProjectsCount = 0
    let projectsWithCoverCount = 0

    if (!Array.isArray(data.projects)) {
      data.projects = [...DEFAULT_DATA_SCAFFOLD.projects]
      repaired = true
      issues.push('Missing or invalid "projects" array.')
    } else {
      data.projects = data.projects.map((proj, projIndex) => {
        if (typeof proj !== 'object' || proj === null) {
          repaired = true
          issues.push(`Project at index ${projIndex} was invalid and reset to default scaffold.`)
          return { ...DEFAULT_DATA_SCAFFOLD.projects[0] }
        }
        totalProjectsCount++
        const updatedProj = { ...proj }
        if (typeof updatedProj.name !== 'string') {
          updatedProj.name = ''
          repaired = true
          issues.push(`Project at index ${projIndex} missing "name".`)
        }
        if (typeof updatedProj.type !== 'string') {
          updatedProj.type = ''
          repaired = true
          issues.push(`Project at index ${projIndex} missing "type".`)
        }
        if (typeof updatedProj.artist !== 'string') {
          updatedProj.artist = data.artist.name || ''
          repaired = true
          issues.push(`Project at index ${projIndex} missing "artist".`)
        }
        if (typeof updatedProj.date !== 'string') {
          updatedProj.date = ''
          repaired = true
          issues.push(`Project at index ${projIndex} missing "date".`)
        }
        if (updatedProj.visibility !== 'public' && updatedProj.visibility !== 'private') {
          updatedProj.visibility = 'public'
          repaired = true
          issues.push(`Project at index ${projIndex} missing or invalid "visibility" property (defaulted to "public").`)
        }
        if (updatedProj.copyright !== 'cleared' && updatedProj.copyright !== 'uncleared') {
          updatedProj.copyright = 'cleared'
          repaired = true
          issues.push(`Project at index ${projIndex} missing or invalid "copyright" property (defaulted to "cleared").`)
        }

        const projectSlug = slugify(updatedProj.name) || `project-${projIndex + 1}`

        // Resolve Project Cover Artwork in data/projects/<projectSlug>/art.<ext>
        let resolvedCover = null
        let hasCover = false
        if (typeof updatedProj.cover === 'string' && updatedProj.cover.trim() !== '') {
          const trimCover = updatedProj.cover.trim()
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
          // Try data/projects/<projectSlug>/art.<ext>
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

          // Legacy fallback: data/covers/<projectSlug>.<ext>
          if (!hasCover) {
            for (const ext of SUPPORTED_IMAGE_EXTS) {
              const candidateRel = path.join('covers', `${projectSlug}${ext}`)
              const matchPath = resolveLocalPath(dataDir, candidateRel)
              if (matchPath) {
                const relPath = path.relative(dataDir, matchPath).replace(/\\/g, '/')
                resolvedCover = `/api/media/${relPath}`
                hasCover = true
                break
              }
            }
          }
        }

        updatedProj.cover = resolvedCover
        updatedProj.hasCover = hasCover
        if (hasCover) projectsWithCoverCount++

        if (!Array.isArray(updatedProj.tracks)) {
          updatedProj.tracks = []
          repaired = true
          issues.push(`Project at index ${projIndex} missing "tracks" array.`)
        } else {
          updatedProj.tracks = updatedProj.tracks.map((track, trackIndex) => {
            totalTracksCount++
            if (typeof track !== 'object' || track === null) {
              repaired = true
              issues.push(`Track at index ${trackIndex} in project ${projIndex} was invalid.`)
              return { name: '', links: { ...DEFAULT_DATA_SCAFFOLD.projects[0].tracks[0].links } }
            }
            const updatedTrack = { ...track }
            if (typeof updatedTrack.name !== 'string') {
              updatedTrack.name = ''
              repaired = true
              issues.push(`Track at index ${trackIndex} in project ${projIndex} missing "name".`)
            }
            if (typeof updatedTrack.links !== 'object' || updatedTrack.links === null) {
              updatedTrack.links = { ...DEFAULT_DATA_SCAFFOLD.projects[0].tracks[0].links }
              repaired = true
              issues.push(`Track "${updatedTrack.name || trackIndex}" in project ${projIndex} missing "links" object.`)
            } else {
              const trackLinksDefault = DEFAULT_DATA_SCAFFOLD.projects[0].tracks[0].links
              const tLinksObj = { ...updatedTrack.links }
              for (const key of Object.keys(trackLinksDefault)) {
                if (typeof tLinksObj[key] !== 'string') {
                  tLinksObj[key] = ''
                  repaired = true
                  issues.push(`Missing link key "${key}" under track "${updatedTrack.name || trackIndex}" in project ${projIndex}.`)
                }
              }
              updatedTrack.links = tLinksObj
            }

            const trackSlug = slugify(updatedTrack.name)

            // Resolve Track Audio by scanning data/projects/<projectSlug>/<trackSlug>.<ext>
            let resolvedAudioUrl = null
            let hasAudio = false

            if (trackSlug) {
              // Try data/projects/<projectSlug>/<trackSlug>.<ext>
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

              // Legacy fallbacks: data/audio/<projectSlug>/<trackSlug>.<ext> & data/audio/<trackSlug>.<ext>
              if (!hasAudio) {
                for (const ext of SUPPORTED_AUDIO_EXTS) {
                  const candidateRel = path.join('audio', projectSlug, `${trackSlug}${ext}`)
                  const matchPath = resolveLocalPath(dataDir, candidateRel)
                  if (matchPath) {
                    const relPath = path.relative(dataDir, matchPath).replace(/\\/g, '/')
                    resolvedAudioUrl = `/api/audio/${relPath}`
                    hasAudio = true
                    break
                  }
                }
              }

              if (!hasAudio) {
                for (const ext of SUPPORTED_AUDIO_EXTS) {
                  const candidateRel = path.join('audio', `${trackSlug}${ext}`)
                  const matchPath = resolveLocalPath(dataDir, candidateRel)
                  if (matchPath) {
                    const relPath = path.relative(dataDir, matchPath).replace(/\\/g, '/')
                    resolvedAudioUrl = `/api/audio/${relPath}`
                    hasAudio = true
                    break
                  }
                }
              }
            }

            updatedTrack.audioUrl = resolvedAudioUrl
            updatedTrack.hasAudio = hasAudio
            if (hasAudio) tracksWithAudioCount++

            // Track cover (or fallback to project cover)
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
        return updatedProj
      })
    }

    if (totalTracksCount > 0 && tracksWithAudioCount < totalTracksCount) {
      issues.push(`Audio Coverage: ${tracksWithAudioCount} of ${totalTracksCount} tracks have audio files in data/projects/.`)
    }
    if (totalProjectsCount > 0 && projectsWithCoverCount < totalProjectsCount) {
      issues.push(`Album Art Coverage: ${projectsWithCoverCount} of ${totalProjectsCount} projects have cover art in data/projects/.`)
    }

    return { data, repaired }
  }

  static saveData(data) {
    try {
      const filePath = this.getFilePath()
      const dirPath = path.dirname(filePath)
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true })
      }

      // 1. Create rolling backup snapshot before save
      createRollingBackup(filePath)

      // 2. Validate and repair schema
      const issues = []
      const { data: sanitizedData } = this.validateAndRepair(data, issues)

      // 3. Atomically write to swap file
      atomicWriteJson(filePath, sanitizedData)

      return { success: true, issues }
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

export function saveArtistData(data) {
  return ArtistDataManager.saveData(data)
}
