import fs from 'fs'
import path from 'path'
import { warmMediaFiles } from './mediaWarmer'

export const LOGO_IMAGE_MIME_TYPES = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.avif': 'image/avif',
}

const SUPPORTED_LOGO_EXTS = Object.keys(LOGO_IMAGE_MIME_TYPES)

/**
 * Searches a directory for a file matching logo.<ext> with a supported image extension.
 *
 * @param {string} dir
 * @returns {string|null} Full path to logo file or null
 */
export function findLogoFile(dir) {
  if (!dir || !fs.existsSync(/*turbopackIgnore: true*/ dir)) return null
  try {
    const files = fs.readdirSync(/*turbopackIgnore: true*/ dir)
    const logoFile = files.find((file) => {
      const lower = file.toLowerCase()
      const ext = path.extname(lower)
      return lower.startsWith('logo.') && SUPPORTED_LOGO_EXTS.includes(ext)
    })
    return logoFile ? path.join(dir, logoFile) : null
  } catch (err) {
    console.error(`Error searching directory ${dir} for logo:`, err)
    return null
  }
}

/**
 * Returns structured metadata about the currently active artist logo.
 *
 * @returns {{
 *   exists: boolean,
 *   isCustom: boolean,
 *   filename: string|null,
 *   fullPath: string|null,
 *   ext: string|null,
 *   mimeType: string|null,
 *   sizeBytes: number|null,
 *   mtimeMs: number|null,
 *   url: string|null
 * }}
 */
export function getLogoDetails() {
  const dataDir = path.join(process.cwd(), 'data')
  const publicDir = path.join(process.cwd(), 'public')

  let logoPath = findLogoFile(dataDir)
  let isCustom = true

  if (!logoPath) {
    logoPath = findLogoFile(publicDir)
    isCustom = false
  }

  if (!logoPath || !fs.existsSync(/*turbopackIgnore: true*/ logoPath)) {
    return {
      exists: false,
      isCustom: false,
      filename: null,
      fullPath: null,
      ext: null,
      mimeType: null,
      sizeBytes: null,
      mtimeMs: null,
      url: null,
    }
  }

  try {
    const stats = fs.statSync(/*turbopackIgnore: true*/ logoPath)
    const filename = path.basename(logoPath)
    const ext = path.extname(filename).toLowerCase()
    const mimeType = LOGO_IMAGE_MIME_TYPES[ext] || 'image/png'

    return {
      exists: true,
      isCustom,
      filename,
      fullPath: logoPath,
      ext,
      mimeType,
      sizeBytes: stats.size,
      mtimeMs: stats.mtimeMs,
      url: '/api/logo',
    }
  } catch (err) {
    console.error('Error getting logo stats:', err)
    return {
      exists: false,
      isCustom: false,
      filename: null,
      fullPath: null,
      ext: null,
      mimeType: null,
      sizeBytes: null,
      mtimeMs: null,
      url: null,
    }
  }
}

let sharpModule = null

async function getSharp() {
  if (sharpModule !== null) return sharpModule
  try {
    const mod = await import('sharp')
    sharpModule = mod.default || mod
  } catch (err) {
    console.warn('Sharp module failed to load in logoUtils:', err.message)
    sharpModule = false
  }
  return sharpModule
}

export const FAVICON_CONFIG = [
  { size: 16, name: 'favicon-16.png' },
  { size: 32, name: 'favicon-32.png' },
  { size: 48, name: 'favicon-48.png' },
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 192, name: 'icon-192.png' },
  { size: 512, name: 'icon-512.png' },
]

/**
 * Analyzes the perceived luminance of visible/non-transparent pixels in an image.
 *
 * @param {string|Buffer} source - Path to image or image buffer
 * @param {Object} [sharpInstance] - Optional Sharp instance
 * @returns {Promise<{ avgLuminance: number, isLight: boolean }>}
 */
export async function detectLogoLuminance(source, sharpInstance = null) {
  const sharp = sharpInstance || (await getSharp())
  if (!sharp) return { avgLuminance: 255, isLight: true }

  try {
    const input = typeof source === 'string' ? source : Buffer.from(source)
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
 * Detects logo lightness and adds a solid contrasting background (dark background for light logos,
 * white background for dark logos) with standard favicon padding for crisp visibility.
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

  // Contrast background: Dark obsidian for light/white logos; Pure White for dark logos
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
  const targetSize = parseInt(requestedSize, 10) || 32
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
          mimeType: 'image/png',
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
          mimeType: 'image/png',
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
      targetSize >= 180 &&
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

/**
 * Saves a new custom logo to the data/ directory, removing any existing data/logo.* files first.
 *
 * @param {Buffer|Uint8Array} buffer - File buffer
 * @param {string} originalName - Original uploaded filename
 * @returns {Promise<{ success: boolean, logo: Object, error?: string }>}
 */
export async function saveCustomLogo(buffer, originalName = 'logo.png') {
  try {
    if (!buffer || buffer.length === 0) {
      return { success: false, error: 'Uploaded file is empty.' }
    }

    const dataDir = path.join(process.cwd(), 'data')
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }

    const origExt = path.extname(originalName || '').toLowerCase()
    const ext = origExt && SUPPORTED_LOGO_EXTS.includes(origExt) ? origExt : '.png'

    // Clean up any existing data/logo.* files to prevent conflicting extensions
    try {
      const existingFiles = fs.readdirSync(dataDir)
      for (const file of existingFiles) {
        const lower = file.toLowerCase()
        if (lower.startsWith('logo.') && SUPPORTED_LOGO_EXTS.includes(path.extname(lower))) {
          try {
            fs.unlinkSync(path.join(dataDir, file))
          } catch {}
        }
      }
    } catch (cleanErr) {
      console.warn('Warning during old logo cleanup:', cleanErr)
    }

    const targetPath = path.join(dataDir, `logo${ext}`)
    fs.writeFileSync(targetPath, Buffer.from(buffer))

    // Pre-generate full favicon suite and pre-warm media variants
    try {
      await generateFaviconSuite(targetPath)
      await warmMediaFiles([targetPath])
    } catch (warmErr) {
      console.warn('Error warming uploaded logo/favicons:', warmErr)
    }

    const updatedDetails = getLogoDetails()
    return {
      success: true,
      logo: updatedDetails,
    }
  } catch (err) {
    console.error('Failed to save custom logo:', err)
    return {
      success: false,
      error: `Failed to save logo file: ${err.message}`,
    }
  }
}

/**
 * Removes custom logo files and cached favicons from data/ directory to revert to public/ default logo.
 *
 * @returns {{ success: boolean, logo: Object, error?: string }}
 */
export function deleteCustomLogo() {
  try {
    const dataDir = path.join(process.cwd(), 'data')
    if (fs.existsSync(dataDir)) {
      const existingFiles = fs.readdirSync(dataDir)
      for (const file of existingFiles) {
        const lower = file.toLowerCase()
        if (lower.startsWith('logo.') && SUPPORTED_LOGO_EXTS.includes(path.extname(lower))) {
          try {
            fs.unlinkSync(path.join(dataDir, file))
          } catch (e) {
            console.warn(`Could not delete custom logo ${file}:`, e)
          }
        }
      }

      // Purge cached favicons
      const faviconsCacheDir = path.join(dataDir, 'cache', 'favicons')
      if (fs.existsSync(faviconsCacheDir)) {
        try {
          const iconFiles = fs.readdirSync(faviconsCacheDir)
          for (const icon of iconFiles) {
            try {
              fs.unlinkSync(path.join(faviconsCacheDir, icon))
            } catch {}
          }
        } catch {}
      }
    }

    const updatedDetails = getLogoDetails()
    return {
      success: true,
      logo: updatedDetails,
    }
  } catch (err) {
    console.error('Failed to remove custom logo:', err)
    return {
      success: false,
      error: `Failed to remove custom logo: ${err.message}`,
    }
  }
}
