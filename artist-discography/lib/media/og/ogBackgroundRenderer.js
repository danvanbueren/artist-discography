import fs from 'fs'
import crypto from 'crypto'

const BACKGROUND_BUFFER_CACHE = new Map()

let sharpModule = null

async function getSharp() {
  if (sharpModule !== null) return sharpModule
  try {
    const mod = await import('sharp')
    const sharpInstance = mod.default || mod
    if (sharpInstance && typeof sharpInstance.cache === 'function') {
      sharpInstance.cache(false)
    }
    sharpModule = sharpInstance
  } catch (err) {
    console.warn('Sharp module failed to load in ogBackgroundRenderer:', err.message)
    sharpModule = false
  }
  return sharpModule
}

/**
 * Creates an SVG dark tint overlay buffer for composite rendering.
 *
 * @param {number} width
 * @param {number} height
 * @returns {Buffer}
 */
function createDarkOverlayBuffer(width = 1200, height = 630) {
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${width}" height="${height}" fill="#0e1117" fill-opacity="0.75" />
  </svg>`
  return Buffer.from(svg)
}

/**
 * Generates a fallback 1200x630 dark gradient background when no source image exists.
 *
 * @returns {string} Base64 data URL
 */
function getFallbackDarkGradientDataUrl() {
  const svg = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0e1117" />
        <stop offset="50%" stop-color="#161b22" />
        <stop offset="100%" stop-color="#0a0c10" />
      </linearGradient>
    </defs>
    <rect width="1200" height="630" fill="url(#bg)" />
  </svg>`
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}

/**
 * Generates a 1200x630 dark, blurred ambient background image as a Base64 data URL.
 *
 * @param {string|Buffer|null} imageSource - Absolute path or Buffer of source artwork
 * @returns {Promise<string>} Base64 image data URL
 */
export async function renderOgBlurredBackground(imageSource) {
  if (!imageSource) {
    return getFallbackDarkGradientDataUrl()
  }

  let cacheKey = ''
  if (typeof imageSource === 'string') {
    try {
      if (!fs.existsSync(imageSource)) return getFallbackDarkGradientDataUrl()
      const stat = fs.statSync(imageSource)
      cacheKey = `bg:${imageSource}:${stat.mtimeMs}:${stat.size}`
    } catch {
      return getFallbackDarkGradientDataUrl()
    }
  } else if (Buffer.isBuffer(imageSource)) {
    cacheKey = `bg:${crypto.createHash('md5').update(imageSource.subarray(0, 4096)).digest('hex')}`
  }

  if (cacheKey && BACKGROUND_BUFFER_CACHE.has(cacheKey)) {
    return BACKGROUND_BUFFER_CACHE.get(cacheKey)
  }

  const sharp = await getSharp()
  if (!sharp) {
    return getFallbackDarkGradientDataUrl()
  }

  try {
    const darkOverlay = createDarkOverlayBuffer(1200, 630)

    const blurredBuffer = await sharp(imageSource, { failOnError: false })
      .resize(1200, 630, { fit: 'cover', position: 'center' })
      .blur(45)
      .composite([{ input: darkOverlay, blend: 'over' }])
      .jpeg({ quality: 80, progressive: true })
      .toBuffer()

    const dataUrl = `data:image/jpeg;base64,${blurredBuffer.toString('base64')}`

    if (cacheKey) {
      if (BACKGROUND_BUFFER_CACHE.size >= 60) {
        const oldest = BACKGROUND_BUFFER_CACHE.keys().next().value
        BACKGROUND_BUFFER_CACHE.delete(oldest)
      }
      BACKGROUND_BUFFER_CACHE.set(cacheKey, dataUrl)
    }

    return dataUrl
  } catch (err) {
    console.warn('Error generating blurred OG background with Sharp:', err.message)
    return getFallbackDarkGradientDataUrl()
  }
}
