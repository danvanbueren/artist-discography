import fs from 'fs'
import path from 'path'
import {
  isImageFullyCached,
  optimizeAndCacheImage,
} from './mediaOptimizer'
import {
  isAudioFullyCached,
  optimizeAndCacheAudio,
} from './audioOptimizer'
import { slugify } from './slugs'

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif'])
const AUDIO_EXTENSIONS = new Set(['.mp3', '.m4a', '.wav', '.ogg', '.flac', '.aac', '.mp4', '.webm'])

let activeBackgroundWarmingPromise = null
let lastWarmingCheckTimestamp = 0
const MIN_WARMING_INTERVAL_MS = 10000 // 10s cooldown for site-load full scans

/**
 * Concurrency helper to process items with limited simultaneous async tasks.
 *
 * @param {Array<T>} items
 * @param {number} concurrency
 * @param {function(T): Promise<any>} iteratorFn
 * @returns {Promise<Array<any>>}
 */
async function asyncPool(items, concurrency, iteratorFn) {
  const ret = []
  const executing = new Set()

  for (const item of items) {
    const p = Promise.resolve().then(() => iteratorFn(item))
    ret.push(p)
    executing.add(p)

    const clean = () => executing.delete(p)
    p.then(clean, clean)

    if (executing.size >= concurrency) {
      await Promise.race(executing)
    }
  }

  return Promise.all(ret)
}

/**
 * Pre-optimizes and caches specific media files immediately (e.g. following upload or update).
 *
 * @param {Array<string>} filePaths - Absolute file paths to optimize
 * @param {Object} [options={}] - Options including custom job targets
 * @returns {Promise<{ imagesWarmed: number, audioWarmed: number }>}
 */
export async function warmMediaFiles(filePaths = [], options = {}) {
  if (!Array.isArray(filePaths) || filePaths.length === 0) {
    return { imagesWarmed: 0, audioWarmed: 0 }
  }

  const validPaths = filePaths.filter(fp => fp && typeof fp === 'string' && fs.existsSync(fp))
  let imagesWarmed = 0
  let audioWarmed = 0

  const imageFiles = []
  const audioFiles = []

  for (const fp of validPaths) {
    const ext = path.extname(fp).toLowerCase()
    if (IMAGE_EXTENSIONS.has(ext)) {
      imageFiles.push(fp)
    } else if (AUDIO_EXTENSIONS.has(ext)) {
      audioFiles.push(fp)
    }
  }

  // Pre-cache all standard image variants
  await asyncPool(imageFiles, 4, async (imgPath) => {
    try {
      const fileName = path.basename(imgPath)
      const targetLabel = options.targetMap?.[imgPath] || (fileName.toLowerCase().startsWith('logo') ? 'Artist Logo' : fileName)
      const details = options.detailsMap?.[imgPath] || {}
      await optimizeAndCacheImage(imgPath, undefined, { target: targetLabel, details })
      imagesWarmed++
    } catch (err) {
      console.error(`Error warming image ${imgPath}:`, err)
    }
  })

  // Pre-transcode audio tiers
  await asyncPool(audioFiles, 2, async (audioPath) => {
    try {
      const fileName = path.basename(audioPath)
      const targetLabel = options.targetMap?.[audioPath] || fileName
      const details = options.detailsMap?.[audioPath] || {}
      await optimizeAndCacheAudio(audioPath, undefined, { target: targetLabel, details })
      audioWarmed++
    } catch (err) {
      console.error(`Error warming audio ${audioPath}:`, err)
    }
  })

  return { imagesWarmed, audioWarmed }
}

/**
 * Scans the data directory and artist dataset to gather all media file paths.
 *
 * @param {Object} [artistData]
 * @returns {{ images: Array<string>, audio: Array<string> }}
 */
export function collectAllMediaFiles(artistData = null) {
  const images = new Set()
  const audio = new Set()

  const dataDir = path.join(process.cwd(), 'data')
  const projectsDir = path.join(dataDir, 'projects')
  const coversDir = path.join(dataDir, 'covers')
  const audioDir = path.join(dataDir, 'audio')
  const publicDir = path.join(process.cwd(), 'public')

  // 1. Scan logo files in data/ and public/
  try {
    if (fs.existsSync(dataDir)) {
      const dataFiles = fs.readdirSync(dataDir)
      for (const file of dataFiles) {
        const lower = file.toLowerCase()
        if (lower.startsWith('logo.')) {
          const ext = path.extname(lower)
          if (IMAGE_EXTENSIONS.has(ext)) {
            images.add(path.join(dataDir, file))
          }
        }
      }
    }
    if (fs.existsSync(publicDir)) {
      const pubFiles = fs.readdirSync(publicDir)
      for (const file of pubFiles) {
        const lower = file.toLowerCase()
        if (lower.startsWith('logo.')) {
          const ext = path.extname(lower)
          if (IMAGE_EXTENSIONS.has(ext)) {
            images.add(path.join(publicDir, file))
          }
        }
      }
    }
  } catch {}

  // 2. Scan data/projects/ directory tree
  try {
    if (fs.existsSync(projectsDir)) {
      const projectEntries = fs.readdirSync(projectsDir, { withFileTypes: true })
      for (const entry of projectEntries) {
        if (entry.isDirectory()) {
          const pDir = path.join(projectsDir, entry.name)
          const files = fs.readdirSync(pDir)
          for (const file of files) {
            const fullPath = path.join(pDir, file)
            const ext = path.extname(file).toLowerCase()
            if (IMAGE_EXTENSIONS.has(ext)) {
              images.add(fullPath)
            } else if (AUDIO_EXTENSIONS.has(ext)) {
              audio.add(fullPath)
            }
          }
        }
      }
    }
  } catch {}

  // 3. Scan legacy data/covers/ & data/audio/
  try {
    if (fs.existsSync(coversDir)) {
      const cFiles = fs.readdirSync(coversDir)
      for (const file of cFiles) {
        const ext = path.extname(file).toLowerCase()
        if (IMAGE_EXTENSIONS.has(ext)) {
          images.add(path.join(coversDir, file))
        }
      }
    }
    if (fs.existsSync(audioDir)) {
      const aFiles = fs.readdirSync(audioDir)
      for (const file of aFiles) {
        const ext = path.extname(file).toLowerCase()
        if (AUDIO_EXTENSIONS.has(ext)) {
          audio.add(path.join(audioDir, file))
        }
      }
    }
  } catch {}

  return {
    images: Array.from(images),
    audio: Array.from(audio),
  }
}

/**
 * Checks all media across the application and pre-warms any uncached image or audio variants.
 *
 * @param {Object} [artistData]
 * @returns {Promise<{ imagesChecked: number, imagesWarmed: number, audioChecked: number, audioWarmed: number }>}
 */
export async function warmAllArtistMedia(artistData = null) {
  const { images, audio } = collectAllMediaFiles(artistData)

  const uncachedImages = images.filter(img => !isImageFullyCached(img))
  const uncachedAudio = audio.filter(aud => !isAudioFullyCached(aud))

  let imagesWarmed = 0
  let audioWarmed = 0

  if (uncachedImages.length > 0) {
    await asyncPool(uncachedImages, 4, async (imgPath) => {
      try {
        const fileName = path.basename(imgPath)
        const targetLabel = fileName.toLowerCase().startsWith('logo') ? 'Artist Logo' : fileName
        await optimizeAndCacheImage(imgPath, undefined, { target: targetLabel })
        imagesWarmed++
      } catch (err) {
        console.error(`Error warming image ${imgPath}:`, err)
      }
    })
  }

  if (uncachedAudio.length > 0) {
    await asyncPool(uncachedAudio, 2, async (audioPath) => {
      try {
        const fileName = path.basename(audioPath)
        await optimizeAndCacheAudio(audioPath, undefined, { target: fileName })
        audioWarmed++
      } catch (err) {
        console.error(`Error warming audio ${audioPath}:`, err)
      }
    })
  }

  return {
    imagesChecked: images.length,
    imagesWarmed,
    audioChecked: audio.length,
    audioWarmed,
  }
}

/**
 * Site-load fallback readiness verification.
 * Runs in the background without blocking SSR page rendering, ensuring all media is primed and ready.
 *
 * @param {Object} [artistData]
 */
export function ensureAllMediaReadyFallback(artistData = null) {
  const now = Date.now()
  if (activeBackgroundWarmingPromise) {
    return activeBackgroundWarmingPromise
  }

  if (now - lastWarmingCheckTimestamp < MIN_WARMING_INTERVAL_MS) {
    return Promise.resolve()
  }

  lastWarmingCheckTimestamp = now

    activeBackgroundWarmingPromise = (async () => {
    try {
      await warmAllArtistMedia(artistData)
      try {
        const { ensureAutomatedCachePruning } = await import('./cacheCleaner')
        ensureAutomatedCachePruning(artistData)
      } catch (pruneErr) {
        console.warn('Background automated cache pruning check warning:', pruneErr.message)
      }
    } catch (err) {
      console.warn('Background media warming check failed:', err)
    } finally {
      activeBackgroundWarmingPromise = null
    }
  })()

  return activeBackgroundWarmingPromise
}
