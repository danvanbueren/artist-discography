import fs from 'fs'
import path from 'path'

const PLATFORM_IMAGE_BASE64_CACHE = new Map()

const PLATFORM_FILENAMES = {
  spotify: 'spotify.webp',
  apple: 'apple.webp',
  youtube: 'youtube.webp',
  soundcloud: 'soundcloud.webp',
  bandcamp: 'bandcamp.webp',
  deezer: 'deezer.webp',
  tidal: 'tidal.webp',
  pandora: 'pandora.webp',
  amazon: 'amazon.webp',
  itunes: 'itunes.webp',
  discord: 'discord.webp',
  instagram: 'instagram.webp',
  x: 'x.webp',
  twitter: 'x.webp',
  facebook: 'facebook.webp',
  tiktok: 'tiktok.webp',
  snapchat: 'snapchat.webp',
}

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
  } catch {
    sharpModule = false
  }
  return sharpModule
}

/**
 * Returns PNG Base64 data URL for a platform icon from public/platforms/ (converted from WebP to PNG for Satori compatibility).
 *
 * @param {string} platformKey
 * @returns {Promise<string|null>} PNG Base64 data URL or null
 */
export async function getPlatformIconBase64(platformKey) {
  const cleanKey = String(platformKey || '').toLowerCase()
  const filename = PLATFORM_FILENAMES[cleanKey]
  if (!filename) return null

  if (PLATFORM_IMAGE_BASE64_CACHE.has(cleanKey)) {
    return PLATFORM_IMAGE_BASE64_CACHE.get(cleanKey)
  }

  try {
    const iconPath = path.join(process.cwd(), 'public', 'platforms', filename)
    if (fs.existsSync(iconPath)) {
      const rawBuffer = fs.readFileSync(iconPath)
      const sharp = await getSharp()
      let pngBuffer = rawBuffer
      if (sharp) {
        pngBuffer = await sharp(rawBuffer).png().toBuffer()
      }
      const dataUrl = `data:image/png;base64,${pngBuffer.toString('base64')}`
      PLATFORM_IMAGE_BASE64_CACHE.set(cleanKey, dataUrl)
      return dataUrl
    }
  } catch (err) {
    // Icon read/convert failed
  }

  return null
}

/**
 * SVG Path constants for MUI icons rendered in Satori Open Graph cards.
 */
export const SVG_ICONS = {
  // MUI Album Rounded
  album: (color = 'currentColor', size = 24) => (
    <svg
      width={size}
      height={size}
      viewBox='0 0 24 24'
      fill={color}
      style={{ display: 'flex', flexShrink: 0 }}
    >
      <path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-5.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z' />
    </svg>
  ),

  // MUI MusicNote Rounded
  musicNote: (color = 'currentColor', size = 24) => (
    <svg
      width={size}
      height={size}
      viewBox='0 0 24 24'
      fill={color}
      style={{ display: 'flex', flexShrink: 0 }}
    >
      <path d='M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z' />
    </svg>
  ),

  // MUI Link Rounded
  link: (color = 'currentColor', size = 24) => (
    <svg
      width={size}
      height={size}
      viewBox='0 0 24 24'
      fill={color}
      style={{ display: 'flex', flexShrink: 0 }}
    >
      <path d='M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z' />
    </svg>
  ),

  // MUI Schedule / AccessTime Rounded
  clock: (color = 'currentColor', size = 24) => (
    <svg
      width={size}
      height={size}
      viewBox='0 0 24 24'
      fill={color}
      style={{ display: 'flex', flexShrink: 0 }}
    >
      <path d='M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z' />
    </svg>
  ),
}
