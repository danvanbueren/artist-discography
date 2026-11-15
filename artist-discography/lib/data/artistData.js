import fs from 'fs'
import path from 'path'
import { slugify } from './slugs'
import {
  atomicWriteJson,
  createRollingBackup,
  archiveMalformedFile,
  tryHeuristicJsonRepair,
} from './atomicStorage'
import {
  DEFAULT_CONFIG_SCAFFOLD,
  getConfigFilePath,
  getLegacyArtistDataFilePath,
  validateAndRepairConfig,
  loadConfigFile,
  saveConfigFile,
} from './artistConfig'
import {
  DEFAULT_PROJECT_SCAFFOLD,
  getProjectsDirPath,
  getProjectFilePath,
  validateAndResolveProject,
  loadProjectFile,
  loadAllProjectsFiles,
  saveProjectFile,
  deleteProjectDirectory,
} from './projectStorage'
import { normalizeSiteUrl, normalizeArtistDataUrls } from './urlNormalization'
import { bumpArtistDataMutationVersion, getArtistDataMutationVersion } from './cacheSignal'
import { getBackgroundDetails } from '@/lib/media/backgroundUtils'
import { getLogoDetails } from '@/lib/media/logoUtils'

let cachedArtistDataEntry = null

/**
 * Invalidates the in-memory unified artist data cache and increments
 * the process-wide data mutation counter.
 */
export function invalidateArtistDataCache() {
  cachedArtistDataEntry = null
  bumpArtistDataMutationVersion()
}

/**
 * Computes a lightweight filesystem stat signature covering config.json,
 * custom logo/background media, and per-project directories/project.json files.
 *
 * @param {string|null} [cachedBgPath=null] - Previously discovered background file path
 * @param {string|null} [cachedLogoPath=null] - Previously discovered logo file path
 * @returns {string}
 */
function computeArtistDataSignature(cachedBgPath = null, cachedLogoPath = null) {
  const parts = [`v:${getArtistDataMutationVersion()}`]
  const configPath = getConfigFilePath()

  try {
    const cfgStat = fs.statSync(configPath)
    parts.push(`cfg:${cfgStat.mtimeMs}:${cfgStat.size}`)
  } catch {
    parts.push('cfg:missing')
  }

  const dataDir = path.dirname(configPath)
  try {
    const dataStat = fs.statSync(dataDir)
    parts.push(`data:${dataStat.mtimeMs}`)
  } catch {
    parts.push('data:missing')
  }

  if (cachedBgPath) {
    try {
      const bgStat = fs.statSync(/*turbopackIgnore: true*/ cachedBgPath)
      parts.push(`bg:${bgStat.mtimeMs}:${bgStat.size}`)
    } catch {
      parts.push('bg:missing')
    }
  }

  if (cachedLogoPath) {
    try {
      const logoStat = fs.statSync(/*turbopackIgnore: true*/ cachedLogoPath)
      parts.push(`logo:${logoStat.mtimeMs}:${logoStat.size}`)
    } catch {
      parts.push('logo:missing')
    }
  }

  const projectsDir = getProjectsDirPath()
  try {
    const dirStat = fs.statSync(projectsDir)
    parts.push(`pdir:${dirStat.mtimeMs}`)
    const entries = fs
      .readdirSync(projectsDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
      .sort((a, b) => a.name.localeCompare(b.name))

    for (const entry of entries) {
      const slugDir = path.join(projectsDir, entry.name)
      const projJson = path.join(slugDir, 'project.json')
      let slugMtime = 'x'
      let jsonSig = 'missing'
      try {
        slugMtime = String(fs.statSync(slugDir).mtimeMs)
      } catch {}
      try {
        const jStat = fs.statSync(projJson)
        jsonSig = `${jStat.mtimeMs}:${jStat.size}`
      } catch {}
      parts.push(`${entry.name}:${slugMtime}:${jsonSig}`)
    }
  } catch {
    parts.push('pdir:missing')
  }

  return parts.join('|')
}

export const DEFAULT_DATA_SCAFFOLD = {
  ...DEFAULT_CONFIG_SCAFFOLD,
  projects: [DEFAULT_PROJECT_SCAFFOLD],
}

// Re-export constants and utility functions for backward compatibility
export {
  DEFAULT_CONFIG_SCAFFOLD,
  DEFAULT_PROJECT_SCAFFOLD,
  getConfigFilePath,
  getLegacyArtistDataFilePath,
  getProjectsDirPath,
  getProjectFilePath,
  createRollingBackup,
  archiveMalformedFile,
  tryHeuristicJsonRepair,
  normalizeSiteUrl,
  normalizeArtistDataUrls,
}

export function getArtistDataFilePath() {
  return getConfigFilePath()
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

/**
 * Class-based manager interface for accessing config and project files.
 */
export class ArtistDataManager {
  static getConfigPath() {
    return getConfigFilePath()
  }

  static getProjectsPath() {
    return getProjectsDirPath()
  }

  static validateAndRepairConfig(raw, issues = []) {
    return validateAndRepairConfig(raw, issues)
  }

  static loadConfig() {
    migrateLegacyMonolithIfNeeded()
    return loadConfigFile()
  }

  static validateAndResolveProject(raw, projectSlug, defaultArtistName = 'Artist', issues = []) {
    return validateAndResolveProject(raw, projectSlug, defaultArtistName, issues)
  }

  static loadProject(projectSlug, defaultArtistName = 'Artist') {
    return loadProjectFile(projectSlug, defaultArtistName)
  }

  static loadAllProjects(defaultArtistName = 'Artist') {
    return loadAllProjectsFiles(defaultArtistName)
  }

  /**
   * Unified data loader that combines config.json and all project.json files,
   * reusing a stat-validated in-memory snapshot when nothing on disk changed.
   */
  static loadData() {
    if (cachedArtistDataEntry) {
      const currentSignature = computeArtistDataSignature(
        cachedArtistDataEntry.bgPath,
        cachedArtistDataEntry.logoPath,
      )
      if (currentSignature === cachedArtistDataEntry.signature) {
        return structuredClone(cachedArtistDataEntry.result)
      }
    }

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

    const logoInfo = getLogoDetails()
    const backgroundInfo = getBackgroundDetails()
    const unifiedData = {
      ...configData,
      projects,
      logoInfo,
      backgroundInfo,
    }

    const result = {
      data: unifiedData,
      health: {
        isHealthy: configHealth.isHealthy && issues.length === 0,
        createdNewFile: configHealth.createdNewFile,
        issues,
      },
    }

    const bgPath = backgroundInfo?.fullPath || null
    const logoPath = logoInfo?.fullPath || null
    cachedArtistDataEntry = {
      bgPath,
      logoPath,
      signature: computeArtistDataSignature(bgPath, logoPath),
      result: structuredClone(result),
    }

    return result
  }

  static saveConfig(configData) {
    const result = saveConfigFile(configData)
    invalidateArtistDataCache()
    return result
  }

  static saveProject(projectSlug, projectData) {
    const result = saveProjectFile(projectSlug, projectData)
    invalidateArtistDataCache()
    return result
  }

  static deleteProject(projectSlug) {
    const result = deleteProjectDirectory(projectSlug)
    invalidateArtistDataCache()
    return result
  }

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

      invalidateArtistDataCache()
      return { success: true }
    } catch (err) {
      console.error('Error saving artist data:', err)
      return { success: false, error: err.message }
    }
  }
}

// Export canonical functions
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
