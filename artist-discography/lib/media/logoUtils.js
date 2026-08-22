import fs from 'fs'
import path from 'path'
import { warmMediaFiles } from './mediaWarmer'
import { LOGO_IMAGE_MIME_TYPES, SUPPORTED_LOGO_EXTS, findLogoFile } from './logoConstants'
import {
  FAVICON_CONFIG,
  detectLogoLuminance,
  generateFaviconSuite,
  getFaviconPath,
} from './logoProcessor'

export {
  LOGO_IMAGE_MIME_TYPES,
  SUPPORTED_LOGO_EXTS,
  FAVICON_CONFIG,
  findLogoFile,
  detectLogoLuminance,
  generateFaviconSuite,
  getFaviconPath,
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

/**
 * Saves a new custom logo to the data/ directory, removing any existing data/logo.* files first.
 *
 * @param {Buffer|Uint8Array} buffer - File buffer
 * @param {string} [originalName='logo.png'] - Original uploaded filename
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
