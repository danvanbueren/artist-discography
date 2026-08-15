import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

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

function ensureCacheDir() {
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
  const targetFormat = format === 'original' ? (ext === 'jpg' ? 'jpeg' : ext) : format
  const targetQuality = quality ? Math.min(100, Math.max(1, parseInt(quality, 10))) : (blur ? 30 : 80)
  const targetWidth = width ? Math.min(3840, Math.max(16, parseInt(width, 10))) : null
  const targetBlur = blur ? Math.min(50, Math.max(0.3, parseFloat(blur))) : null

  // Compute a deterministic cache key based on file modification, size, and transformation parameters
  const hashInput = `${sourceFilePath}:${stat.mtimeMs}:${stat.size}:w=${targetWidth}:q=${targetQuality}:fmt=${targetFormat}:b=${targetBlur}`
  const cacheHash = crypto.createHash('md5').update(hashInput).digest('hex')
  const cacheFileName = `${cacheHash}.${targetFormat}`
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
