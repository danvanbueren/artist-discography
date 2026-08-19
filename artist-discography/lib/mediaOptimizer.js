import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { createJob, updateJobProgress, completeJob, failJob } from './jobTracker'

const CACHE_DIR = path.join(process.cwd(), 'data', 'cache', 'images')
const IN_MEMORY_IMAGE_CACHE = new Map()
const MAX_MEMORY_VARIANTS = 100
const MAX_MEMORY_VARIANT_SIZE_BYTES = 2 * 1024 * 1024 // 2MB max per in-memory variant

let sharpModule = null

async function getSharp() {
  if (sharpModule !== null) return sharpModule
  try {
    const mod = await import('sharp')
    sharpModule = mod.default || mod
  } catch (err) {
    console.warn('Sharp module failed to load, falling back to original images:', err.message)
    sharpModule = false
  }
  return sharpModule
}

const MIME_MAP = {
  webp: 'image/webp',
  avif: 'image/avif',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  png: 'image/png',
  svg: 'image/svg+xml',
  gif: 'image/gif',
  ico: 'image/x-icon',
}

export const IMAGE_CACHE_DIR = CACHE_DIR

/**
 * Computes deterministic cache key and filename for an image transformation.
 */
export function computeImageCacheKey(sourceFilePath, stat, options = {}) {
  const ext = path.extname(sourceFilePath).toLowerCase().replace('.', '')
  const {
    width = null,
    quality = null,
    format = 'webp',
    blur = null,
  } = options

  const targetFormat = format === 'original' ? (ext === 'jpg' ? 'jpeg' : ext) : format
  const targetQuality = quality ? Math.min(100, Math.max(1, parseInt(quality, 10))) : (blur ? 30 : 80)
  const targetWidth = width ? Math.min(3840, Math.max(16, parseInt(width, 10))) : null
  const targetBlur = blur ? Math.min(50, Math.max(0.3, parseFloat(blur))) : null

  const hashInput = `${sourceFilePath}:${stat.mtimeMs}:${stat.size}:w=${targetWidth}:q=${targetQuality}:fmt=${targetFormat}:b=${targetBlur}`
  const cacheHash = crypto.createHash('md5').update(hashInput).digest('hex')
  const cacheFileName = `${cacheHash}.${targetFormat}`

  return { cacheHash, cacheFileName, targetFormat }
}

/**
 * Purges memory cache entries that are not in the valid hashes set.
 */
export function purgeInvalidMemoryCache(validHashesSet) {
  if (!validHashesSet || !(validHashesSet instanceof Set)) return 0
  let evicted = 0
  for (const key of IN_MEMORY_IMAGE_CACHE.keys()) {
    if (!validHashesSet.has(key)) {
      IN_MEMORY_IMAGE_CACHE.delete(key)
      evicted++
    }
  }
  return evicted
}

export function ensureCacheDir() {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true })
    }
  } catch (err) {
    console.warn('Could not create media cache directory:', err)
  }
}

/**
 * Optimizes an image file based on dimensions, quality, format, and optional blur.
 * Uses sharp with atomic disk-based persistent caching for fast sub-millisecond responses.
 *
 * @param {string} sourceFilePath - Absolute path to original image file
 * @param {Object} options
 * @param {number} [options.width] - Target width in pixels
 * @param {number} [options.quality] - Target quality (1-100)
 * @param {string} [options.format] - Target format ('webp' | 'avif' | 'jpeg' | 'png' | 'original')
 * @param {number} [options.blur] - Gaussian blur sigma (0.3 to 50)
 * @returns {Promise<{ buffer: Buffer, mimeType: string, isFromCache: boolean }>}
 */
export async function getOptimizedImage(sourceFilePath, options = {}) {
  const {
    width = null,
    quality = null,
    format = 'webp',
    blur = null,
  } = options

  const ext = path.extname(sourceFilePath).toLowerCase().replace('.', '')
  
  // Non-raster / animated vector types that should not be converted with sharp
  if (['svg', 'ico', 'gif'].includes(ext) && !width && !blur) {
    const rawBuffer = fs.readFileSync(/*turbopackIgnore: true*/ sourceFilePath)
    return {
      buffer: rawBuffer,
      mimeType: MIME_MAP[ext] || 'application/octet-stream',
      isFromCache: false,
    }
  }

  const sharp = await getSharp()
  if (!sharp) {
    const rawBuffer = fs.readFileSync(/*turbopackIgnore: true*/ sourceFilePath)
    return {
      buffer: rawBuffer,
      mimeType: MIME_MAP[ext] || 'application/octet-stream',
      isFromCache: false,
    }
  }

  const stat = fs.statSync(/*turbopackIgnore: true*/ sourceFilePath)
  const targetQuality = quality ? Math.min(100, Math.max(1, parseInt(quality, 10))) : (blur ? 30 : 80)
  const targetWidth = width ? Math.min(3840, Math.max(16, parseInt(width, 10))) : null
  const targetBlur = blur ? Math.min(50, Math.max(0.3, parseFloat(blur))) : null

  const { cacheHash, cacheFileName, targetFormat } = computeImageCacheKey(sourceFilePath, stat, options)
  const cacheFilePath = path.join(CACHE_DIR, cacheFileName)

  // 1. In-memory fast tier check
  if (IN_MEMORY_IMAGE_CACHE.has(cacheHash)) {
    const cachedMem = IN_MEMORY_IMAGE_CACHE.get(cacheHash)
    return {
      buffer: cachedMem.buffer,
      mimeType: cachedMem.mimeType,
      isFromCache: true,
    }
  }

  ensureCacheDir()

  // 2. Check if cached variant exists on disk
  try {
    if (fs.existsSync(cacheFilePath)) {
      const cachedStat = fs.statSync(/*turbopackIgnore: true*/ cacheFilePath)
      if (cachedStat.size > 0) {
        const cachedBuffer = fs.readFileSync(/*turbopackIgnore: true*/ cacheFilePath)
        const mimeType = MIME_MAP[targetFormat] || 'image/webp'
        if (cachedBuffer.length <= MAX_MEMORY_VARIANT_SIZE_BYTES) {
          if (IN_MEMORY_IMAGE_CACHE.size >= MAX_MEMORY_VARIANTS) {
            const oldestKey = IN_MEMORY_IMAGE_CACHE.keys().next().value
            IN_MEMORY_IMAGE_CACHE.delete(oldestKey)
          }
          IN_MEMORY_IMAGE_CACHE.set(cacheHash, { buffer: cachedBuffer, mimeType })
        }
        return {
          buffer: cachedBuffer,
          mimeType,
          isFromCache: true,
        }
      }
    }
  } catch (err) {
    // Cache read failure, proceed to generation
  }

  // 3. Transform image using sharp
  try {
    let pipeline = sharp(sourceFilePath, { failOnError: false })

    if (targetWidth) {
      pipeline = pipeline.resize({
        width: targetWidth,
        withoutEnlargement: true,
        fit: 'inside',
      })
    }

    if (targetBlur) {
      pipeline = pipeline.blur(targetBlur)
    }

    if (targetFormat === 'webp') {
      pipeline = pipeline.webp({ quality: targetQuality, effort: 4 })
    } else if (targetFormat === 'avif') {
      pipeline = pipeline.avif({ quality: targetQuality, effort: 4 })
    } else if (targetFormat === 'jpeg' || targetFormat === 'jpg') {
      pipeline = pipeline.jpeg({ quality: targetQuality, progressive: true })
    } else if (targetFormat === 'png') {
      pipeline = pipeline.png({ compressionLevel: 8 })
    } else {
      pipeline = pipeline.webp({ quality: targetQuality, effort: 4 })
    }

    const outputBuffer = await pipeline.toBuffer()
    const mimeType = MIME_MAP[targetFormat] || 'image/webp'

    // Write to in-memory cache if within safe memory limit
    if (outputBuffer.length <= MAX_MEMORY_VARIANT_SIZE_BYTES) {
      if (IN_MEMORY_IMAGE_CACHE.size >= MAX_MEMORY_VARIANTS) {
        const oldestKey = IN_MEMORY_IMAGE_CACHE.keys().next().value
        IN_MEMORY_IMAGE_CACHE.delete(oldestKey)
      }
      IN_MEMORY_IMAGE_CACHE.set(cacheHash, { buffer: outputBuffer, mimeType })
    }

    // Write to disk cache atomically via temporary file to prevent partial read race conditions
    const tempFilePath = `${cacheFilePath}.${process.pid}.${Date.now()}.tmp`
    try {
      fs.writeFile(tempFilePath, outputBuffer, (err) => {
        if (!err) {
          try {
            fs.rename(tempFilePath, cacheFilePath, () => {})
          } catch (renameErr) {
            try { fs.unlink(tempFilePath, () => {}) } catch (e) {}
          }
        }
      })
    } catch (writeErr) {
      // Non-fatal cache write failure
    }

    return {
      buffer: outputBuffer,
      mimeType,
      isFromCache: false,
    }
  } catch (err) {
    console.warn(`Sharp optimization failed for ${sourceFilePath}, falling back to original:`, err.message)
    const fallbackBuffer = fs.readFileSync(/*turbopackIgnore: true*/ sourceFilePath)
    return {
      buffer: fallbackBuffer,
      mimeType: MIME_MAP[ext] || 'application/octet-stream',
      isFromCache: false,
    }
  }
}

/**
 * Standard preset variations used across the frontend UI.
 */
export const STANDARD_IMAGE_VARIANTS = [
  // Low-resolution blurred placeholders (LQIP)
  { width: 40, quality: 30, blur: 6, format: 'webp' },
  { width: 32, quality: 30, blur: 6, format: 'webp' },
  { width: 48, quality: 20, blur: 8, format: 'webp' },
  // UI Thumbnail / Player bar sizes
  { width: 80, quality: 80, format: 'webp' },
  { width: 100, quality: 80, format: 'webp' },
  { width: 120, quality: 80, format: 'webp' },
  { width: 120, quality: 75, format: 'webp' },
  { width: 160, quality: 80, format: 'webp' },
  { width: 320, quality: 80, format: 'webp' },
  // Card, Header, and Modal sizes
  { width: 400, quality: 80, format: 'webp' },
  { width: 600, quality: 80, format: 'webp' },
  { width: 600, quality: 85, format: 'webp' },
  { width: 640, quality: 80, format: 'webp' },
  { width: 800, quality: 80, format: 'webp' },
  { width: 1080, quality: 80, format: 'webp' },
  { width: 1920, quality: 80, format: 'webp' },
  // Full original dimensions in WebP
  { width: null, quality: 80, format: 'webp' },
]

/**
 * Checks if a specific image transformation variant is already generated and cached on disk.
 *
 * @param {string} sourceFilePath
 * @param {Object} options
 * @returns {boolean}
 */
export function isImageVariantCached(sourceFilePath, options = {}) {
  try {
    if (!sourceFilePath || !fs.existsSync(sourceFilePath)) return false
    const stat = fs.statSync(sourceFilePath)
    if (!stat.isFile()) return false

    const ext = path.extname(sourceFilePath).toLowerCase().replace('.', '')
    const {
      width = null,
      quality = null,
      format = 'webp',
      blur = null,
    } = options

    if (['svg', 'ico', 'gif'].includes(ext) && !options.width && !options.blur) return true

    const { cacheFileName } = computeImageCacheKey(sourceFilePath, stat, options)
    const cacheFilePath = path.join(CACHE_DIR, cacheFileName)

    return fs.existsSync(cacheFilePath) && fs.statSync(cacheFilePath).size > 0
  } catch {
    return false
  }
}

/**
 * Checks whether all standard image transformation variants are present in the disk cache.
 *
 * @param {string} sourceFilePath
 * @returns {boolean}
 */
export function isImageFullyCached(sourceFilePath) {
  try {
    if (!sourceFilePath || !fs.existsSync(sourceFilePath)) return false
    const ext = path.extname(sourceFilePath).toLowerCase().replace('.', '')
    if (['svg', 'ico'].includes(ext)) return true

    return STANDARD_IMAGE_VARIANTS.every(variant => isImageVariantCached(sourceFilePath, variant))
  } catch {
    return false
  }
}

/**
 * Pre-generates and caches all standard image variations for immediate zero-latency serving.
 *
 * @param {string} sourceFilePath
 * @param {Array<Object>} [variants=STANDARD_IMAGE_VARIANTS]
 * @param {Object} [jobOptions={}]
 * @returns {Promise<{ total: number, generated: number, cached: number }>}
 */
export async function optimizeAndCacheImage(sourceFilePath, variants = STANDARD_IMAGE_VARIANTS, jobOptions = {}) {
  const fileName = path.basename(sourceFilePath || '')
  const jobId = jobOptions.jobId || `img_${crypto.createHash('md5').update(sourceFilePath || '').digest('hex').slice(0, 8)}_${Date.now()}`
  const targetLabel = jobOptions.target || (fileName.toLowerCase().startsWith('logo') ? 'Artist Logo' : fileName)

  try {
    if (!sourceFilePath || !fs.existsSync(sourceFilePath)) {
      return { total: 0, generated: 0, cached: 0 }
    }

    const ext = path.extname(sourceFilePath).toLowerCase().replace('.', '')
    if (['svg', 'ico'].includes(ext)) {
      return { total: 1, generated: 0, cached: 1 }
    }

    createJob({
      id: jobId,
      type: 'image',
      file: fileName,
      target: targetLabel,
      totalSteps: variants.length,
      details: {
        sourcePath: sourceFilePath,
        format: ext,
      },
    })

    let generated = 0
    let cached = 0

    for (let i = 0; i < variants.length; i++) {
      const variant = variants[i]
      const stepDescription = variant.blur
        ? `Generating low-res placeholder (${variant.width || 40}px blur, ${i + 1}/${variants.length})`
        : `Generating WebP ${variant.width ? `${variant.width}px` : 'Full Original'} (Q: ${variant.quality || 80}, ${i + 1}/${variants.length})`

      updateJobProgress(jobId, {
        currentStep: stepDescription,
        completedSteps: i,
        progress: Math.round((i / variants.length) * 100),
      })

      if (isImageVariantCached(sourceFilePath, variant)) {
        cached++
      } else {
        await getOptimizedImage(sourceFilePath, variant)
        generated++
      }
    }

    completeJob(jobId, {
      summary: `Image optimized (${generated} generated, ${cached} cached)`,
      generated,
      cached,
      total: variants.length,
    })

    return { total: variants.length, generated, cached }
  } catch (err) {
    console.error(`Failed to pre-cache image variants for ${sourceFilePath}:`, err)
    failJob(jobId, err)
    return { total: variants.length, generated: 0, cached: 0 }
  }
}
