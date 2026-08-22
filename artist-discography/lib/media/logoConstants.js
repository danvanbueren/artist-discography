import fs from 'fs'
import path from 'path'

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

export const SUPPORTED_LOGO_EXTS = Object.keys(LOGO_IMAGE_MIME_TYPES)

/**
 * Searches a directory for a file matching logo.<ext> with a supported image extension.
 *
 * @param {string} dir - Directory to search
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
