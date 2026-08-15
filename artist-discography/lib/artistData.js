import fs from 'fs'
import path from 'path'
import { slugify } from './slugs'

export const DEFAULT_DATA_SCAFFOLD = {
  adminAccess: true,
  adminPassword: 'admin123',
  devAccess: false,
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

function resolveLocalPath(baseDir, relativePath) {
  try {
    const fullPath = path.resolve(path.join(baseDir, relativePath))
    if (fullPath.startsWith(baseDir) && fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
      return fullPath
    }
  } catch {}
  return null
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
          fs.writeFileSync(filePath, JSON.stringify(DEFAULT_DATA_SCAFFOLD, null, 2), 'utf8')
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
      try {
        parsedData = JSON.parse(rawContent)
      } catch (err) {
        issues.push(`Invalid JSON syntax in file: ${err.message}.`)
        try {
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
          const backupFileName = `artist-data.malformed.${timestamp}.json`
          const backupFilePath = path.join(path.dirname(filePath), backupFileName)
          const staticBackupFilePath = path.join(path.dirname(filePath), 'artist-data.malformed.json')

          fs.writeFileSync(backupFilePath, rawContent, 'utf8')
          fs.writeFileSync(staticBackupFilePath, rawContent, 'utf8')
          issues.push(`Saved copy of corrupt JSON to ${backupFileName} and artist-data.malformed.json.`)
        } catch (backupErr) {
          issues.push(`Failed to backup corrupt JSON file: ${backupErr.message}`)
        }

        try {
          fs.writeFileSync(filePath, JSON.stringify(DEFAULT_DATA_SCAFFOLD, null, 2), 'utf8')
          issues.push('Overwritten corrupt JSON file with default scaffold.')
        } catch (writeErr) {
          issues.push(`Failed to overwrite corrupt JSON file with default scaffold: ${writeErr.message}`)
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

      const { data: repairedData, repaired } = this.validateAndRepair(parsedData, issues)

      if (repaired) {
        try {
          fs.writeFileSync(filePath, JSON.stringify(repairedData, null, 2), 'utf8')
          issues.push('Structural issues detected and auto-repaired in artist-data.json.')
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
      const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`
      fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8')
      fs.renameSync(tempPath, filePath)
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

export function saveArtistData(data) {
  return ArtistDataManager.saveData(data)
}

