import fs from 'fs'
import path from 'path'
import { isImageFullyCached, optimizeAndCacheImage } from './mediaOptimizer'
import { isAudioFullyCached, optimizeAndCacheAudio } from './audioOptimizer'
import { createJob, updateJobProgress, completeJob, failJob } from '../api/jobTracker'
import { slugify } from '../data/slugs'

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

  const validPaths = filePaths.filter((fp) => fp && typeof fp === 'string' && fs.existsSync(fp))
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
      const targetLabel =
        options.targetMap?.[imgPath] ||
        (fileName.toLowerCase().startsWith('logo') ? 'Artist Logo' : fileName)
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

  const uncachedImages = images.filter((img) => !isImageFullyCached(img))
  const uncachedAudio = audio.filter((aud) => !isAudioFullyCached(aud))

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

  // Ensure favicon suite is primed if custom logo is present
  try {
    const dataDir = path.join(process.cwd(), 'data')
    const { findLogoFile, generateFaviconSuite } = await import('./logoUtils')
    const customLogo = findLogoFile(dataDir)
    if (customLogo) {
      const faviconsDir = path.join(dataDir, 'cache', 'favicons')
      if (!fs.existsSync(faviconsDir) || fs.readdirSync(faviconsDir).length === 0) {
        await generateFaviconSuite(customLogo)
      }
    }
  } catch (favErr) {
    console.warn('Notice: Favicon priming during media warming:', favErr.message)
  }

  return {
    imagesChecked: images.length,
    imagesWarmed,
    audioChecked: audio.length,
    audioWarmed,
  }
}

/**
 * Executes a comprehensive catalog media validation and cache warming job.
 * Emits live status updates via jobTracker, prunes orphaned files, warms missing variants,
 * and records completed audit details in the recent history log.
 *
 * @param {Object} [artistData]
 *   audioWarmed: number,
 *   orphanedFilesRemoved: number,
 *   bytesReclaimed: number
 * }>}
 */
let activeValidationPromise = null

export async function runCatalogMediaValidationJob(artistData = null) {
  if (activeValidationPromise) {
    return activeValidationPromise
  }

  activeValidationPromise = (async () => {
    const validationJob = createJob({
      id: `validate-cache-${Date.now()}`,
      type: 'validation',
      file: 'All Catalog Media & Cache',
      target: 'Media Cache Audit',
      totalSteps: 5,
    })

    try {
      const allActions = []
      const { formatBytes } = await import('../data/analyticsUtils')

    // Step 1: Audit and sanitize projects directory (empty folders, slug alignment, extra audio/art files)
    updateJobProgress(validationJob.id, {
      progress: 10,
      currentStep: 'Auditing projects directory structure and asset integrity...',
    })
    const { auditAndSanitizeProjectsDirectory } = await import('../data/projectStorage')
    const projectAuditResult = await auditAndSanitizeProjectsDirectory(artistData?.name)
    if (Array.isArray(projectAuditResult.actions)) {
      allActions.push(...projectAuditResult.actions)
    }

    // Step 2: Discover all catalog media files
    updateJobProgress(validationJob.id, {
      progress: 25,
      currentStep: 'Discovering all catalog tracks, covers, and logos...',
    })
    const { images, audio } = collectAllMediaFiles(artistData)

    // Step 3: Audit cache coverage for images and audio
    updateJobProgress(validationJob.id, {
      progress: 45,
      currentStep: 'Auditing image and audio cache integrity...',
    })
    const uncachedImages = images.filter((img) => !isImageFullyCached(img))
    const uncachedAudio = audio.filter((aud) => !isAudioFullyCached(aud))

    // Step 4: Scan disk and prune orphaned / stale cache files
    updateJobProgress(validationJob.id, {
      progress: 60,
      currentStep: 'Scanning disk for orphaned or stale cache files...',
    })
    const { pruneUnusedCacheFiles } = await import('./cacheCleaner')
    const pruneResult = await pruneUnusedCacheFiles({ force: true, artistData })
    if (Array.isArray(pruneResult.actions)) {
      allActions.push(...pruneResult.actions)
    }

    const imagesPruned = pruneResult.imagesPruned || 0
    const audioPruned = pruneResult.audioPruned || 0
    const totalOrphans = imagesPruned + audioPruned
    const totalReclaimedBytes =
      (pruneResult.imagesBytesReclaimed || 0) +
      (pruneResult.audioBytesReclaimed || 0) +
      (projectAuditResult.totalBytesReclaimed || 0)

    // If actions were taken, also log a dedicated completed cleanup record into recent history
    if (allActions.length > 0) {
      const cleanupJob = createJob({
        id: `cleanup-cache-${Date.now()}`,
        type: 'cleanup',
        file: `${allActions.length} action${allActions.length === 1 ? '' : 's'} performed`,
        target: 'Catalog Asset Cleanup',
        totalSteps: 1,
      })
      completeJob(cleanupJob.id, {
        summary: `Performed ${allActions.length} cleanup action${allActions.length === 1 ? '' : 's'} (${formatBytes(totalReclaimedBytes)} reclaimed)`,
        actions: allActions,
        bytesReclaimed: totalReclaimedBytes,
      })
    }

    // Step 5: Warm any missing media variants with standard active jobs
    const totalToWarm = uncachedImages.length + uncachedAudio.length
    let imagesWarmed = 0
    let audioWarmed = 0
    const mediaWarnings = []

    if (totalToWarm > 0) {
      updateJobProgress(validationJob.id, {
        progress: 80,
        currentStep: `Generating ${totalToWarm} missing media variant${totalToWarm === 1 ? '' : 's'} in background...`,
      })

      if (uncachedImages.length > 0) {
        await asyncPool(uncachedImages, 4, async (imgPath) => {
          const fileName = path.basename(imgPath)
          const targetLabel = fileName.toLowerCase().startsWith('logo')
            ? 'Artist Logo'
            : fileName
          try {
            const res = await optimizeAndCacheImage(imgPath, undefined, { target: targetLabel })
            if (res.error) {
              allActions.push(`Warning: Image optimization failed for ${fileName} (${res.error})`)
              mediaWarnings.push(`${fileName}: ${res.error}`)
            } else if (res.warning) {
              allActions.push(`Notice: Image optimization warning for ${fileName} (${res.warning})`)
              imagesWarmed++
            } else {
              imagesWarmed++
            }
          } catch (err) {
            allActions.push(`Warning: Image optimization failed for ${fileName} (${err.message})`)
            mediaWarnings.push(`${fileName}: ${err.message}`)
          }
        })
      }

      if (uncachedAudio.length > 0) {
        await asyncPool(uncachedAudio, 2, async (audioPath) => {
          const fileName = path.basename(audioPath)
          try {
            const res = await optimizeAndCacheAudio(audioPath, undefined, { target: fileName })
            if (res.error) {
              allActions.push(`Warning: Audio transcode failed for ${fileName} (${res.error})`)
              mediaWarnings.push(`${fileName}: ${res.error}`)
            } else if (res.warning) {
              allActions.push(`Notice: Audio transcode warning for ${fileName} (${res.warning})`)
              audioWarmed++
            } else {
              audioWarmed++
            }
          } catch (err) {
            allActions.push(`Warning: Audio transcode failed for ${fileName} (${err.message})`)
            mediaWarnings.push(`${fileName}: ${err.message}`)
          }
        })
      }
    }

    // Prime favicon suite if custom logo exists
    try {
      const dataDir = path.join(process.cwd(), 'data')
      const { findLogoFile, generateFaviconSuite } = await import('./logoUtils')
      const customLogo = findLogoFile(dataDir)
      if (customLogo) {
        const faviconsDir = path.join(dataDir, 'cache', 'favicons')
        if (!fs.existsSync(faviconsDir) || fs.readdirSync(faviconsDir).length === 0) {
          await generateFaviconSuite(customLogo)
        }
      }
    } catch (favErr) {
      console.warn('Notice: Favicon priming during media warming:', favErr.message)
    }

    // Step 6: Construct complete summary and finish the validation job
    const totalWarmed = imagesWarmed + audioWarmed
    let summaryText = ''

    if (totalToWarm === 0 && allActions.length === 0) {
      summaryText =
        'All files checked — everything is up to date and no orphaned files were detected.'
    } else if (totalWarmed > 0 && allActions.length === 0) {
      summaryText = `Validation complete: generated ${totalWarmed} new media variant${totalWarmed === 1 ? '' : 's'}.`
    } else if (totalWarmed === 0 && allActions.length > 0) {
      summaryText = `Validation complete: performed ${allActions.length} action${allActions.length === 1 ? '' : 's'} (${formatBytes(totalReclaimedBytes)} reclaimed).`
    } else {
      summaryText = `Validation complete: generated ${totalWarmed} new media variant${totalWarmed === 1 ? '' : 's'} and performed ${allActions.length} action${allActions.length === 1 ? '' : 's'} (${formatBytes(totalReclaimedBytes)} reclaimed).`
    }

    if (mediaWarnings.length > 0) {
      summaryText += ` Encountered ${mediaWarnings.length} media issue${mediaWarnings.length === 1 ? '' : 's'} (see actions log).`
    }

    completeJob(validationJob.id, {
      summary: summaryText,
      actions: allActions,
      warnings: mediaWarnings.length > 0 ? mediaWarnings : undefined,
      imagesChecked: images.length,
      imagesWarmed,
      audioChecked: audio.length,
      audioWarmed,
      orphanedFilesRemoved: totalOrphans,
      bytesReclaimed: totalReclaimedBytes,
    })

    return {
      success: true,
      actions: allActions,
      imagesChecked: images.length,
      imagesWarmed,
      audioChecked: audio.length,
      audioWarmed,
      orphanedFilesRemoved: totalOrphans,
      bytesReclaimed: totalReclaimedBytes,
    }
  } catch (err) {
    failJob(validationJob.id, err)
    return {
      success: false,
      error: err.message,
    }
  }
  })().finally(() => {
    activeValidationPromise = null
  })

  return activeValidationPromise
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
