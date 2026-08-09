import fs from 'fs'
import path from 'path'

export const DEFAULT_DATA_SCAFFOLD = {
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

        if (!Array.isArray(updatedProj.tracks)) {
          updatedProj.tracks = []
          repaired = true
          issues.push(`Project at index ${projIndex} missing "tracks" array.`)
        } else {
          updatedProj.tracks = updatedProj.tracks.map((track, trackIndex) => {
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
            return updatedTrack
          })
        }
        return updatedProj
      })
    }

    return { data, repaired }
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
