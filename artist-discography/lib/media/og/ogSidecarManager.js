import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { atomicWriteJson } from '@/lib/data/atomicStorage'

export const OG_CACHE_DIR = path.join(process.cwd(), 'data', 'cache', 'og')
const SIDECAR_MEM_CACHE = new Map()

export function ensureOgCacheDir() {
  try {
    if (!fs.existsSync(OG_CACHE_DIR)) {
      fs.mkdirSync(OG_CACHE_DIR, { recursive: true })
    }
  } catch (err) {
    console.warn('Could not create OG cache directory:', err.message)
  }
}

/**
 * Safely retrieves file stat mtime and size without throwing.
 *
 * @param {string} filePath
 * @returns {{ exists: boolean, mtimeMs: number, size: number }}
 */
export function getFileStatInfo(filePath) {
  if (!filePath || typeof filePath !== 'string') {
    return { exists: false, mtimeMs: 0, size: 0 }
  }
  try {
    if (fs.existsSync(filePath)) {
      const stat = fs.statSync(filePath)
      if (stat.isFile()) {
        return { exists: true, mtimeMs: Math.floor(stat.mtimeMs), size: stat.size }
      }
    }
  } catch {}
  return { exists: false, mtimeMs: 0, size: 0 }
}

/**
 * Computes deterministic source fingerprint and cache hash for an OG entity.
 *
 * @param {'general' | 'project' | 'track'} entityType
 * @param {Object} data - Entity metadata, paths, and text
 * @returns {{ hash: string, fingerprint: Object }}
 */
export function computeEntityFingerprint(entityType, data = {}) {
  const version = 'v1'
  const fingerprint = {
    entityType,
    version,
    slug: data.slug || '',
    text: {
      name: String(data.name || ''),
      artist: String(data.artist || ''),
      bio: String(data.bio || ''),
      date: String(data.date || ''),
      type: String(data.type || ''),
      projectName: String(data.projectName || ''),
      projectType: String(data.projectType || ''),
      socialsHash: crypto
        .createHash('md5')
        .update(JSON.stringify(data.socials || {}))
        .digest('hex')
        .slice(0, 10),
      statsHash: `${data.stats?.totalProjects || 0}:${data.stats?.totalTracks || 0}:${data.stats?.totalPlatforms || 0}`,
    },
    files: {
      artwork: getFileStatInfo(data.artworkPath),
      logo: getFileStatInfo(data.logoPath),
      background: getFileStatInfo(data.backgroundPath),
      audio: getFileStatInfo(data.audioPath),
      config: getFileStatInfo(path.join(process.cwd(), 'data', 'config.json')),
      projectJson: data.projectJsonPath ? getFileStatInfo(data.projectJsonPath) : null,
    },
  }

  const serialized = JSON.stringify(fingerprint)
  const hash = crypto.createHash('md5').update(serialized).digest('hex')

  return { hash, fingerprint }
}

/**
 * Reads sidecar JSON metadata from memory cache or disk.
 *
 * @param {string} hash - MD5 cache hash
 * @returns {Object|null}
 */
export function readSidecar(hash) {
  if (!hash || typeof hash !== 'string') return null

  if (SIDECAR_MEM_CACHE.has(hash)) {
    return SIDECAR_MEM_CACHE.get(hash)
  }

  const sidecarPath = path.join(OG_CACHE_DIR, `${hash}.json`)
  try {
    if (fs.existsSync(sidecarPath)) {
      const raw = fs.readFileSync(sidecarPath, 'utf8')
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object') {
        SIDECAR_MEM_CACHE.set(hash, parsed)
        return parsed
      }
    }
  } catch (err) {
    // Read failure
  }

  return null
}

/**
 * Atomically saves sidecar JSON metadata to data/cache/og/<hash>.json.
 *
 * @param {string} hash - MD5 cache hash
 * @param {Object} sidecarData
 * @returns {boolean}
 */
export function writeSidecar(hash, sidecarData) {
  if (!hash || !sidecarData || typeof sidecarData !== 'object') return false

  ensureOgCacheDir()
  const sidecarPath = path.join(OG_CACHE_DIR, `${hash}.json`)

  try {
    atomicWriteJson(sidecarPath, sidecarData)
    SIDECAR_MEM_CACHE.set(hash, sidecarData)
    return true
  } catch (err) {
    console.warn(`Failed to write OG sidecar for ${hash}:`, err.message)
    return false
  }
}

/**
 * Checks if a cached OG image and its sidecar are fully valid against the current source fingerprint.
 *
 * @param {string} hash
 * @param {Object} currentFingerprint
 * @returns {boolean}
 */
export function isSidecarValid(hash, currentFingerprint) {
  if (!hash) return false

  const sidecar = readSidecar(hash)
  if (!sidecar) return false

  const pngPath = path.join(OG_CACHE_DIR, `${hash}.png`)
  if (!fs.existsSync(pngPath)) return false

  try {
    const pngStat = fs.statSync(pngPath)
    if (pngStat.size === 0) return false
  } catch {
    return false
  }

  const prevFp = sidecar.sourceFingerprint
  if (!prevFp) return false

  return JSON.stringify(prevFp) === JSON.stringify(currentFingerprint)
}
