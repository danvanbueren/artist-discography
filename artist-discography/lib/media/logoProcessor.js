import fs from 'fs'
import path from 'path'
import { LOGO_IMAGE_MIME_TYPES, findLogoFile } from './logoConstants'

let sharpModule = null

/**
 * Dynamically loads sharp module if installed.
 *
 * @returns {Promise<Function|null>}
 */
export async function getSharp() {
  if (sharpModule !== null) return sharpModule
  try {
    const mod = await import('sharp')
    sharpModule = mod.default || mod
  } catch (err) {
    console.warn('Sharp module not available for logo processing:', err.message)
    sharpModule = false
  }
  return sharpModule
}

export const FAVICON_CONFIG = [
  { size: 16, name: 'favicon-16.png' },
  { size: 32, name: 'favicon-32.png' },
  { size: 48, name: 'favicon-48.png' },
  { size: 96, name: 'favicon-96.png' },
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 192, name: 'web-app-manifest-192x192.png' },
  { size: 512, name: 'web-app-manifest-512x512.png' },
]

/**
 * Analyzes the average luminance of non-transparent pixels in an image.
 *
 * @param {string|Buffer} input - Image path or buffer
 * @param {Function} [sharpInstance] - Optional loaded sharp module
 * @returns {Promise<{ avgLuminance: number, isLight: boolean }>}
 */
export async function detectLogoLuminance(input, sharpInstance = null) {
  const sharp = sharpInstance || (await getSharp())
  if (!sharp) {
    return { avgLuminance: 255, isLight: true }
  }

  try {
    const { data, info } = await sharp(input)
      .ensureAlpha()
      .resize(128, 128, { fit: 'inside' })
      .raw()
      .toBuffer({ resolveWithObject: true })

    let totalLuminance = 0
    let totalWeight = 0

    const channels = info.channels
    for (let i = 0; i < data.length; i += channels) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const a = data[i + 3]

      if (a > 25) {
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b
        const weight = a / 255
        totalLuminance += luminance * weight
        totalWeight += weight
      }
    }

    const avgLuminance = totalWeight > 0 ? totalLuminance / totalWeight : 255
    const isLight = avgLuminance >= 128
    return { avgLuminance, isLight }
  } catch (err) {
    console.warn('Error analyzing logo luminance:', err)
    return { avgLuminance: 255, isLight: true }
  }
}

/**
 * Generates the full suite of square favicon PNGs from the source logo.
 *
 * @param {string|Buffer} source - Path to logo file or image buffer
 * @returns {Promise<Object>} Object mapping size -> generated file path
 */
export async function generateFaviconSuite(source) {
  const sharp = await getSharp()
  if (!sharp) return null

  const dataDir = path.join(process.cwd(), 'data')
  const faviconsDir = path.join(dataDir, 'cache', 'favicons')
  if (!fs.existsSync(faviconsDir)) {
    fs.mkdirSync(faviconsDir, { recursive: true })
  }

  const input = typeof source === 'string' ? source : Buffer.from(source)
  const { isLight } = await detectLogoLuminance(input, sharp)

  // Dark obsidian for light/white logos; pure white for dark logos
  const bgColor = isLight ? { r: 15, g: 15, b: 20, alpha: 1 } : { r: 255, g: 255, b: 255, alpha: 1 }
  const results = {}

  for (const { size, name } of FAVICON_CONFIG) {
    const destPath = path.join(faviconsDir, name)
    try {
      const padding = Math.max(1, Math.round(size * 0.08))
      const innerSize = Math.max(8, size - padding * 2)

      const resizedLogo = await sharp(input)
        .resize(innerSize, innerSize, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .toBuffer()

      await sharp({
        create: {
          width: size,
          height: size,
          channels: 4,
          background: bgColor,
        },
      })
        .composite([
          {
            input: resizedLogo,
            gravity: 'center',
          },
        ])
        .png({ compressionLevel: 9, quality: 95 })
        .toFile(destPath)

      results[size] = destPath
    } catch (err) {
      console.error(`Error generating favicon size ${size}px:`, err)
    }
  }

  return results
}

/**
 * Resolves the path to the best matching favicon image for a requested size.
 *
 * @param {number|string} [requestedSize=32]
 * @returns {Promise<{ filePath: string, isCustom: boolean, mimeType: string, sizeBytes?: number, mtimeMs?: number }|null>}
 */
export async function getFaviconPath(requestedSize = 32) {
  const isIcoRequest =
    requestedSize === 'ico' || requestedSize === 'favicon.ico' || requestedSize === 'any'
  const isAppleRequest = requestedSize === 'apple' || requestedSize === 'apple-touch-icon'
  const targetSize = isAppleRequest ? 180 : parseInt(requestedSize, 10) || 32

  const dataDir = path.join(process.cwd(), 'data')
  const faviconsCacheDir = path.join(dataDir, 'cache', 'favicons')
  const publicFaviconsDir = path.join(process.cwd(), 'public', 'favicons')

  const customLogoPath = findLogoFile(dataDir)

  if (customLogoPath) {
    const config = FAVICON_CONFIG.find((c) => c.size === targetSize) || {
      size: targetSize,
      name: `favicon-${targetSize}.png`,
    }
    const cachedFilePath = path.join(faviconsCacheDir, config.name)

    if (fs.existsSync(/*turbopackIgnore: true*/ cachedFilePath)) {
      const logoStat = fs.statSync(/*turbopackIgnore: true*/ customLogoPath)
      const iconStat = fs.statSync(/*turbopackIgnore: true*/ cachedFilePath)
      if (iconStat.mtimeMs >= logoStat.mtimeMs) {
        return {
          filePath: cachedFilePath,
          isCustom: true,
          mimeType: isIcoRequest ? 'image/x-icon' : 'image/png',
          sizeBytes: iconStat.size,
          mtimeMs: iconStat.mtimeMs,
        }
      }
    }

    // Dynamically generate if missing or outdated
    const sharp = await getSharp()
    if (sharp) {
      if (!fs.existsSync(/*turbopackIgnore: true*/ faviconsCacheDir)) {
        fs.mkdirSync(/*turbopackIgnore: true*/ faviconsCacheDir, { recursive: true })
      }
      try {
        const { isLight } = await detectLogoLuminance(customLogoPath, sharp)
        const bgColor = isLight
          ? { r: 15, g: 15, b: 20, alpha: 1 }
          : { r: 255, g: 255, b: 255, alpha: 1 }

        const padding = Math.max(1, Math.round(targetSize * 0.08))
        const innerSize = Math.max(8, targetSize - padding * 2)

        const resizedLogo = await sharp(customLogoPath)
          .resize(innerSize, innerSize, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          })
          .toBuffer()

        await sharp({
          create: {
            width: targetSize,
            height: targetSize,
            channels: 4,
            background: bgColor,
          },
        })
          .composite([
            {
              input: resizedLogo,
              gravity: 'center',
            },
          ])
          .png({ compressionLevel: 9, quality: 95 })
          .toFile(cachedFilePath)

        const iconStat = fs.statSync(/*turbopackIgnore: true*/ cachedFilePath)
        return {
          filePath: cachedFilePath,
          isCustom: true,
          mimeType: isIcoRequest ? 'image/x-icon' : 'image/png',
          sizeBytes: iconStat.size,
          mtimeMs: iconStat.mtimeMs,
        }
      } catch (err) {
        console.warn(`Failed to dynamically generate ${targetSize}px favicon:`, err)
      }
    }

    const stat = fs.statSync(/*turbopackIgnore: true*/ customLogoPath)
    return {
      filePath: customLogoPath,
      isCustom: true,
      mimeType: LOGO_IMAGE_MIME_TYPES[path.extname(customLogoPath).toLowerCase()] || 'image/png',
      sizeBytes: stat.size,
      mtimeMs: stat.mtimeMs,
    }
  }

  // Fallback to static public/favicons/
  if (fs.existsSync(/*turbopackIgnore: true*/ publicFaviconsDir)) {
    if (isIcoRequest) {
      const icoPath = path.join(publicFaviconsDir, 'favicon.ico')
      if (fs.existsSync(/*turbopackIgnore: true*/ icoPath)) {
        const s = fs.statSync(/*turbopackIgnore: true*/ icoPath)
        return {
          filePath: icoPath,
          isCustom: false,
          mimeType: 'image/x-icon',
          sizeBytes: s.size,
          mtimeMs: s.mtimeMs,
        }
      }
    }
    if (
      targetSize >= 500 &&
      fs.existsSync(
        /*turbopackIgnore: true*/ path.join(publicFaviconsDir, 'web-app-manifest-512x512.png'),
      )
    ) {
      const p = path.join(publicFaviconsDir, 'web-app-manifest-512x512.png')
      const s = fs.statSync(/*turbopackIgnore: true*/ p)
      return {
        filePath: p,
        isCustom: false,
        mimeType: 'image/png',
        sizeBytes: s.size,
        mtimeMs: s.mtimeMs,
      }
    }
    if (
      targetSize >= 190 &&
      fs.existsSync(
        /*turbopackIgnore: true*/ path.join(publicFaviconsDir, 'web-app-manifest-192x192.png'),
      )
    ) {
      const p = path.join(publicFaviconsDir, 'web-app-manifest-192x192.png')
      const s = fs.statSync(/*turbopackIgnore: true*/ p)
      return {
        filePath: p,
        isCustom: false,
        mimeType: 'image/png',
        sizeBytes: s.size,
        mtimeMs: s.mtimeMs,
      }
    }
    if (
      (targetSize >= 180 || isAppleRequest) &&
      fs.existsSync(/*turbopackIgnore: true*/ path.join(publicFaviconsDir, 'apple-icon.png'))
    ) {
      const p = path.join(publicFaviconsDir, 'apple-icon.png')
      const s = fs.statSync(/*turbopackIgnore: true*/ p)
      return {
        filePath: p,
        isCustom: false,
        mimeType: 'image/png',
        sizeBytes: s.size,
        mtimeMs: s.mtimeMs,
      }
    }
    if (fs.existsSync(/*turbopackIgnore: true*/ path.join(publicFaviconsDir, 'icon1.png'))) {
      const p = path.join(publicFaviconsDir, 'icon1.png')
      const s = fs.statSync(/*turbopackIgnore: true*/ p)
      return {
        filePath: p,
        isCustom: false,
        mimeType: 'image/png',
        sizeBytes: s.size,
        mtimeMs: s.mtimeMs,
      }
    }
    if (fs.existsSync(/*turbopackIgnore: true*/ path.join(publicFaviconsDir, 'favicon.ico'))) {
      const p = path.join(publicFaviconsDir, 'favicon.ico')
      const s = fs.statSync(/*turbopackIgnore: true*/ p)
      return {
        filePath: p,
        isCustom: false,
        mimeType: 'image/x-icon',
        sizeBytes: s.size,
        mtimeMs: s.mtimeMs,
      }
    }
  }

  return null
}
