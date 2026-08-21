import fs from 'fs'
import path from 'path'
import {
  IMAGE_CACHE_DIR,
  STANDARD_IMAGE_VARIANTS,
  computeImageCacheKey,
  purgeInvalidMemoryCache,
} from './mediaOptimizer'
import { AUDIO_CACHE_DIR, STANDARD_AUDIO_VARIANTS, computeAudioCacheKey } from './audioOptimizer'
import { collectAllMediaFiles } from './mediaWarmer'

const CACHE_PRUNE_COOLDOWN_MS = 60 * 60 * 1000 // 1 hour cooldown for regular background periodic scans
const IN_FLIGHT_SAFETY_GRACE_PERIOD_MS = 60 * 1000 // 60s protection for in-flight transcodes/writes

let lastPruneTimestamp = 0
let activePrunePromise = null
let scheduledPruneTimer = null

/**
 * Gathers the complete set of valid cache filenames and hashes for all currently active media files on disk.
 *
 * @param {Object} [artistData]
 * @returns {{ validImageFiles: Set<string>, validImageHashes: Set<string>, validAudioFiles: Set<string>, validAudioHashes: Set<string> }}
 */
export function getActiveValidCacheEntries(artistData = null) {
  const { images, audio } = collectAllMediaFiles(artistData)

  const validImageFiles = new Set()
  const validImageHashes = new Set()
  const validAudioFiles = new Set()
  const validAudioHashes = new Set()

  // 1. Process active image files
  for (const rawImgPath of images) {
    try {
      const imgPath = path.resolve(rawImgPath)
      if (!imgPath || !fs.existsSync(/*turbopackIgnore: true*/ imgPath)) continue
      const stat = fs.statSync(/*turbopackIgnore: true*/ imgPath)
      if (!stat.isFile()) continue

      for (const variant of STANDARD_IMAGE_VARIANTS) {
        const { cacheHash, cacheFileName } = computeImageCacheKey(imgPath, stat, variant)
        validImageFiles.add(cacheFileName)
        validImageHashes.add(cacheHash)
      }
    } catch (err) {
      console.warn(`Error computing valid cache keys for image ${rawImgPath}:`, err.message)
    }
  }

  // 2. Process active audio files
  for (const rawAudioPath of audio) {
    try {
      const audioPath = path.resolve(rawAudioPath)
      if (!audioPath || !fs.existsSync(/*turbopackIgnore: true*/ audioPath)) continue
      const stat = fs.statSync(/*turbopackIgnore: true*/ audioPath)
      if (!stat.isFile()) continue

      for (const variant of STANDARD_AUDIO_VARIANTS) {
        const { cacheHash, cacheFileName } = computeAudioCacheKey(audioPath, stat, variant)
        validAudioFiles.add(cacheFileName)
        validAudioHashes.add(cacheHash)

        // Include potential MP3 fallback hash if lossless FLAC transcode fell back
        if (variant.format === 'flac' || variant.quality === 'lossless') {
          validAudioFiles.add(`${cacheHash}.mp3`)
        }
      }
    } catch (err) {
      console.warn(`Error computing valid cache keys for audio ${rawAudioPath}:`, err.message)
    }
  }

  return {
    validImageFiles,
    validImageHashes,
    validAudioFiles,
    validAudioHashes,
  }
}

/**
 * Scans disk cache directories and removes any orphaned, superseded, or stale temporary files.
 *
 * @param {Object} [options={}]
 * @param {boolean} [options.force=false] - Bypass the 1-hour cooldown interval
 * @param {Object} [options.artistData=null]
 * @returns {Promise<{
 *   success: boolean,
 *   skipped?: boolean,
 *   reason?: string,
 *   imagesPruned: number,
 *   imagesBytesReclaimed: number,
 *   audioPruned: number,
 *   audioBytesReclaimed: number,
 *   memoryEntriesPurged: number,
 *   timestamp: number
 * }>}
 */
export async function pruneUnusedCacheFiles(options = {}) {
  const { force = false, artistData = null } = options
  const now = Date.now()

  if (!force && now - lastPruneTimestamp < CACHE_PRUNE_COOLDOWN_MS) {
    return {
      success: true,
      skipped: true,
      reason: 'cooldown_active',
      lastPruneTimestamp,
    }
  }

  if (activePrunePromise) {
    return activePrunePromise
  }

  activePrunePromise = (async () => {
    try {
      const { validImageFiles, validImageHashes, validAudioFiles } =
        getActiveValidCacheEntries(artistData)

      let imagesPruned = 0
      let imagesBytesReclaimed = 0
      let audioPruned = 0
      let audioBytesReclaimed = 0

      // 1. Scan and clean image cache directory (data/cache/images/)
      try {
        if (fs.existsSync(/*turbopackIgnore: true*/ IMAGE_CACHE_DIR)) {
          const imageEntries = fs.readdirSync(/*turbopackIgnore: true*/ IMAGE_CACHE_DIR)
          for (const fileName of imageEntries) {
            const filePath = path.join(IMAGE_CACHE_DIR, fileName)
            try {
              const stat = fs.statSync(/*turbopackIgnore: true*/ filePath)
              if (!stat.isFile()) continue

              const fileAgeMs = now - stat.mtimeMs

              // Always protect recently touched files to prevent racing active transcode operations
              if (fileAgeMs < IN_FLIGHT_SAFETY_GRACE_PERIOD_MS) {
                continue
              }

              const isTempFile = fileName.endsWith('.tmp') || fileName.includes('.tmp.')
              const isOrphan = !validImageFiles.has(fileName)

              if (isTempFile || isOrphan) {
                const fileSize = stat.size
                fs.unlinkSync(/*turbopackIgnore: true*/ filePath)
                imagesPruned++
                imagesBytesReclaimed += fileSize
              }
            } catch (fileErr) {
              console.warn(`Could not prune image cache file ${fileName}:`, fileErr.message)
            }
          }
        }
      } catch (dirErr) {
        console.warn('Error reading image cache directory during prune:', dirErr.message)
      }

      // 2. Scan and clean audio cache directory (data/cache/audio/)
      try {
        if (fs.existsSync(/*turbopackIgnore: true*/ AUDIO_CACHE_DIR)) {
          const audioEntries = fs.readdirSync(/*turbopackIgnore: true*/ AUDIO_CACHE_DIR)
          for (const fileName of audioEntries) {
            const filePath = path.join(AUDIO_CACHE_DIR, fileName)
            try {
              const stat = fs.statSync(/*turbopackIgnore: true*/ filePath)
              if (!stat.isFile()) continue

              const fileAgeMs = now - stat.mtimeMs

              // Always protect recently touched files to prevent racing active transcode operations
              if (fileAgeMs < IN_FLIGHT_SAFETY_GRACE_PERIOD_MS) {
                continue
              }

              const isTempFile = fileName.endsWith('.tmp') || fileName.includes('.tmp.')
              const isOrphan = !validAudioFiles.has(fileName)

              if (isTempFile || isOrphan) {
                const fileSize = stat.size
                fs.unlinkSync(/*turbopackIgnore: true*/ filePath)
                audioPruned++
                audioBytesReclaimed += fileSize
              }
            } catch (fileErr) {
              console.warn(`Could not prune audio cache file ${fileName}:`, fileErr.message)
            }
          }
        }
      } catch (dirErr) {
        console.warn('Error reading audio cache directory during prune:', dirErr.message)
      }

      // 3. Purge invalid hashes from fast in-memory tier
      let memoryEntriesPurged = 0
      try {
        memoryEntriesPurged = purgeInvalidMemoryCache(validImageHashes)
      } catch (memErr) {
        console.warn('Error purging in-memory image cache:', memErr.message)
      }

      lastPruneTimestamp = Date.now()

      return {
        success: true,
        imagesPruned,
        imagesBytesReclaimed,
        audioPruned,
        audioBytesReclaimed,
        memoryEntriesPurged,
        timestamp: lastPruneTimestamp,
      }
    } catch (err) {
      console.error('Failed to execute automated cache prune:', err)
      return {
        success: false,
        error: err.message,
        timestamp: Date.now(),
      }
    } finally {
      activePrunePromise = null
    }
  })()

  return activePrunePromise
}

/**
 * Schedules a debounced automated cache cleanup after an asynchronous delay.
 * Useful following admin deletions, updates, or uploads so that stale files are cleaned
 * without blocking the HTTP request or competing with in-flight transcoding.
 *
 * @param {number} [delayMs=10000] - Delay in milliseconds
 */
export function scheduleAutomatedCachePrune(delayMs = 10000) {
  if (scheduledPruneTimer) {
    clearTimeout(scheduledPruneTimer)
  }

  scheduledPruneTimer = setTimeout(() => {
    scheduledPruneTimer = null
    pruneUnusedCacheFiles({ force: true }).catch((err) => {
      console.warn('Scheduled automated cache cleanup warning:', err.message)
    })
  }, delayMs)

  if (typeof scheduledPruneTimer?.unref === 'function') {
    scheduledPruneTimer.unref()
  }
}

/**
 * Site-load fallback readiness hook.
 * Checks if the periodic cooldown has passed, and if so, runs automated cache pruning in the background.
 *
 * @param {Object} [artistData]
 */
export function ensureAutomatedCachePruning(artistData = null) {
  const now = Date.now()
  if (now - lastPruneTimestamp >= CACHE_PRUNE_COOLDOWN_MS) {
    // Non-blocking invocation
    pruneUnusedCacheFiles({ force: false, artistData }).catch((err) => {
      console.warn('Background periodic cache cleanup warning:', err.message)
    })
  }
}

/**
 * Returns diagnostic statistics regarding the current disk media cache.
 *
 * @returns {{
 *   imageCache: { count: number, totalBytes: number },
 *   audioCache: { count: number, totalBytes: number },
 *   lastPruneTimestamp: number
 * }}
 */
export function getCacheStats() {
  let imageCount = 0
  let imageBytes = 0
  let audioCount = 0
  let audioBytes = 0

  try {
    if (fs.existsSync(/*turbopackIgnore: true*/ IMAGE_CACHE_DIR)) {
      const files = fs.readdirSync(/*turbopackIgnore: true*/ IMAGE_CACHE_DIR)
      for (const file of files) {
        try {
          const stat = fs.statSync(/*turbopackIgnore: true*/ path.join(IMAGE_CACHE_DIR, file))
          if (stat.isFile()) {
            imageCount++
            imageBytes += stat.size
          }
        } catch {}
      }
    }
  } catch {}

  try {
    if (fs.existsSync(/*turbopackIgnore: true*/ AUDIO_CACHE_DIR)) {
      const files = fs.readdirSync(/*turbopackIgnore: true*/ AUDIO_CACHE_DIR)
      for (const file of files) {
        try {
          const stat = fs.statSync(/*turbopackIgnore: true*/ path.join(AUDIO_CACHE_DIR, file))
          if (stat.isFile()) {
            audioCount++
            audioBytes += stat.size
          }
        } catch {}
      }
    }
  } catch {}

  return {
    imageCache: {
      count: imageCount,
      totalBytes: imageBytes,
    },
    audioCache: {
      count: audioCount,
      totalBytes: audioBytes,
    },
    lastPruneTimestamp,
  }
}
