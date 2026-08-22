import fs from 'fs'
import path from 'path'
import {
  atomicWriteJson,
  createRollingBackup,
  archiveMalformedFile,
  tryHeuristicJsonRepair,
} from './atomicStorage'

export const DEFAULT_CONFIG_SCAFFOLD = {
  adminAccess: true,
  adminPassword: 'admin123',
  privateAccessCode: 'access123',
  siteUrl: '',
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

/**
 * Returns the absolute path to data/config.json.
 *
 * @returns {string}
 */
export function getConfigFilePath() {
  return path.join(process.cwd(), 'data', 'config.json')
}

/**
 * Returns the absolute path to legacy data/artist-data.json.
 *
 * @returns {string}
 */
export function getLegacyArtistDataFilePath() {
  return path.join(process.cwd(), 'data', 'artist-data.json')
}

/**
 * Validates and repairs the config.json schema.
 *
 * @param {Object} raw - Raw unvalidated config object
 * @param {string[]} [issues=[]] - Diagnostic issues accumulator
 * @returns {{ data: Object, repaired: boolean }}
 */
export function validateAndRepairConfig(raw, issues = []) {
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
      typeof DEFAULT_CONFIG_SCAFFOLD.siteUrl === 'string' ? DEFAULT_CONFIG_SCAFFOLD.siteUrl : ''
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
 * Loads, parses, and validates data/config.json with automatic repair.
 *
 * @returns {{ data: Object, health: { isHealthy: boolean, createdNewFile: boolean, issues: string[] } }}
 */
export function loadConfigFile() {
  const issues = []
  let createdNewFile = false

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

    const { data: repairedData, repaired } = validateAndRepairConfig(parsedData, issues)

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
 * Saves config data to data/config.json with a rolling backup.
 *
 * @param {Object} configData - Config object to save
 * @returns {{ success: boolean, error?: string, issues?: string[] }}
 */
export function saveConfigFile(configData) {
  try {
    const filePath = getConfigFilePath()
    createRollingBackup(filePath, 'config')

    const issues = []
    const { data: sanitizedConfig } = validateAndRepairConfig(configData, issues)
    atomicWriteJson(filePath, sanitizedConfig)

    return { success: true, issues }
  } catch (err) {
    console.error('Error saving config.json:', err)
    return { success: false, error: err.message }
  }
}
