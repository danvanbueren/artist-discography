import fs from 'fs'
import path from 'path'
import { warmMediaFiles } from './mediaWarmer'

export const BACKGROUND_IMAGE_MIME_TYPES = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.svg': 'image/svg+xml',
}

export const SUPPORTED_BACKGROUND_EXTS = Object.keys(BACKGROUND_IMAGE_MIME_TYPES)

/**
 * Searches a directory for a file matching background.<ext> with a supported image extension.
 *
 * @param {string} dir - Directory to search
 * @returns {string|null} Full path to background file or null
 */
export function findBackgroundFile(dir) {
  if (!dir || !fs.existsSync(/*turbopackIgnore: true*/ dir)) return null
  try {
    const files = fs.readdirSync(/*turbopackIgnore: true*/ dir)
    const backgroundFile = files.find((file) => {
      const lower = file.toLowerCase()
      const ext = path.extname(lower)
      return lower.startsWith('background.') && SUPPORTED_BACKGROUND_EXTS.includes(ext)
    })
    return backgroundFile ? path.join(dir, backgroundFile) : null
  } catch (err) {
    console.error(`Error searching directory ${dir} for background:`, err)
    return null
  }
}

/**
 * Returns structured metadata about the currently active custom background image.
 *
 * @returns {{
 *   exists: boolean,
 *   filename: string|null,
 *   fullPath: string|null,
 *   ext: string|null,
 *   mimeType: string|null,
 *   sizeBytes: number|null,
 *   mtimeMs: number|null,
 *   url: string|null
 * }}
 */
export function getBackgroundDetails() {
  const dataDir = path.join(process.cwd(), 'data')
  const backgroundPath = findBackgroundFile(dataDir)

  if (!backgroundPath || !fs.existsSync(/*turbopackIgnore: true*/ backgroundPath)) {
    return {
      exists: false,
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
    const stats = fs.statSync(/*turbopackIgnore: true*/ backgroundPath)
    const filename = path.basename(backgroundPath)
    const ext = path.extname(filename).toLowerCase()
    const mimeType = BACKGROUND_IMAGE_MIME_TYPES[ext] || 'image/jpeg'

    return {
      exists: true,
      filename,
      fullPath: backgroundPath,
      ext,
      mimeType,
      sizeBytes: stats.size,
      mtimeMs: stats.mtimeMs,
      url: '/api/background',
    }
  } catch (err) {
    console.error('Error getting background stats:', err)
    return {
      exists: false,
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
 * Atomically saves a custom background image to the data/ directory, removing previous backgrounds first.
 *
 * @param {Buffer|Uint8Array} buffer - Image file buffer
 * @param {string} [originalName='background.jpg'] - Original uploaded filename
 * @returns {Promise<{ success: boolean, background: Object, error?: string }>}
 */
export async function saveCustomBackground(buffer, originalName = 'background.jpg') {
  try {
    if (!buffer || buffer.length === 0) {
      return { success: false, error: 'Uploaded file is empty.' }
    }

    const dataDir = path.join(process.cwd(), 'data')
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }

    const origExt = path.extname(originalName || '').toLowerCase()
    const ext = origExt && SUPPORTED_BACKGROUND_EXTS.includes(origExt) ? origExt : '.jpg'

    // Clean up any existing data/background.* files to prevent conflicting extensions
    try {
      const existingFiles = fs.readdirSync(dataDir)
      for (const file of existingFiles) {
        const lower = file.toLowerCase()
        if (
          lower.startsWith('background.') &&
          SUPPORTED_BACKGROUND_EXTS.includes(path.extname(lower))
        ) {
          try {
            fs.unlinkSync(path.join(dataDir, file))
          } catch {}
        }
      }
    } catch (cleanErr) {
      console.warn('Warning during old background cleanup:', cleanErr)
    }

    const targetPath = path.join(dataDir, `background${ext}`)
    const tempPath = path.join(
      dataDir,
      `.tmp.${process.pid}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}`,
    )

    fs.writeFileSync(tempPath, Buffer.from(buffer))
    fs.renameSync(tempPath, targetPath)

    // Pre-warm optimized media cache variants
    try {
      await warmMediaFiles([targetPath])
    } catch (warmErr) {
      console.warn('Error warming uploaded background:', warmErr)
    }

    const updatedDetails = getBackgroundDetails()
    return {
      success: true,
      background: updatedDetails,
    }
  } catch (err) {
    console.error('Failed to save custom background:', err)
    return {
      success: false,
      error: `Failed to save background file: ${err.message}`,
    }
  }
}

/**
 * Removes custom background files from the data/ directory.
 *
 * @returns {{ success: boolean, background: Object, error?: string }}
 */
export function deleteCustomBackground() {
  try {
    const dataDir = path.join(process.cwd(), 'data')
    if (fs.existsSync(dataDir)) {
      const existingFiles = fs.readdirSync(dataDir)
      for (const file of existingFiles) {
        const lower = file.toLowerCase()
        if (
          lower.startsWith('background.') &&
          SUPPORTED_BACKGROUND_EXTS.includes(path.extname(lower))
        ) {
          try {
            fs.unlinkSync(path.join(dataDir, file))
          } catch (e) {
            console.warn(`Could not delete custom background ${file}:`, e)
          }
        }
      }
    }

    const updatedDetails = getBackgroundDetails()
    return {
      success: true,
      background: updatedDetails,
    }
  } catch (err) {
    console.error('Failed to remove custom background:', err)
    return {
      success: false,
      error: `Failed to remove custom background: ${err.message}`,
    }
  }
}
