import fs from 'fs'
import path from 'path'
import { loadConfigData, loadArtistData } from '@/lib/data/artistData'
import { findProjectBySlug, findTrackBySlug, slugify } from '@/lib/data/slugs'
import { getLogoDetails } from '@/lib/media/logoUtils'
import { getBackgroundDetails } from '@/lib/media/backgroundUtils'
import { formatProjectDate } from '@/lib/data/dateUtils'
import { getPlatformIconBase64 } from './ogIcons'
import {
  resolveTrackAudioPath,
  probeAudioDurationSeconds,
  computeProjectAudioDuration,
  formatDuration,
} from './ogAudioDuration'
import { extractOgPalette } from './ogColorExtractor'
import { renderOgBlurredBackground } from './ogBackgroundRenderer'
import { computeEntityFingerprint } from './ogSidecarManager'

const ORDERED_PLATFORM_KEYS = [
  'spotify',
  'apple',
  'youtube',
  'soundcloud',
  'amazon',
  'bandcamp',
  'deezer',
  'itunes',
  'pandora',
  'tidal',
  'instagram',
  'discord',
  'x',
  'twitter',
  'facebook',
  'tiktok',
  'snapchat',
]

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
 * Resolves full verified on-disk absolute file path for a cover image.
 *
 * @param {string} projectSlug
 * @param {string} coverValue - Cover filename, /api/media/... URL, or null
 * @returns {string|null}
 */
export function resolveCoverFilePath(projectSlug, coverValue) {
  const dataDir = path.join(process.cwd(), 'data')

  if (typeof coverValue === 'string' && coverValue.trim() !== '') {
    const cleanCover = coverValue.split('?')[0].trim()

    // 1. If coverValue is /api/media/...
    if (cleanCover.startsWith('/api/media/')) {
      const relPath = cleanCover.replace(/^\/api\/media\//, '')
      const fullPath = path.join(dataDir, relPath)
      if (fs.existsSync(fullPath)) return fullPath
    }

    // 2. If coverValue is a filename or relative project path
    const candidate1 = path.join(dataDir, 'projects', projectSlug || '', cleanCover)
    if (fs.existsSync(candidate1) && fs.statSync(candidate1).isFile()) return candidate1

    const candidate2 = path.join(dataDir, cleanCover)
    if (fs.existsSync(candidate2) && fs.statSync(candidate2).isFile()) return candidate2
  }

  // 3. Fallback: discover art.* directly in data/projects/<projectSlug>/
  if (projectSlug) {
    const projectDir = path.join(dataDir, 'projects', projectSlug)
    for (const ext of ['.jpg', '.jpeg', '.png', '.webp', '.avif']) {
      const artPath = path.join(projectDir, `art${ext}`)
      if (fs.existsSync(artPath) && fs.statSync(artPath).isFile()) {
        return artPath
      }
    }
  }

  return null
}

/**
 * Converts a local image file to a lightweight, scaled Base64 data URL.
 * Scales down large images to prevent SVG/XML document bloat in Satori.
 *
 * @param {string} filePath
 * @param {Object} [options={}]
 * @param {number} [options.maxDim=800]
 * @param {boolean} [options.isLogo=false]
 * @returns {Promise<string|null>}
 */
export async function fileToBase64DataUrl(filePath, options = {}) {
  if (!filePath || typeof filePath !== 'string') return null
  const { maxDim = 800, isLogo = false } = options

  try {
    if (fs.existsSync(filePath)) {
      const sharp = await getSharp()
      if (sharp) {
        if (isLogo) {
          const buffer = await sharp(filePath)
            .resize(maxDim, maxDim, { fit: 'inside', withoutEnlargement: true })
            .png()
            .toBuffer()
          return `data:image/png;base64,${buffer.toString('base64')}`
        }

        const buffer = await sharp(filePath)
          .resize(maxDim, maxDim, { fit: 'cover', withoutEnlargement: true })
          .jpeg({ quality: 85, progressive: true })
          .toBuffer()
        return `data:image/jpeg;base64,${buffer.toString('base64')}`
      }

      const buffer = fs.readFileSync(filePath)
      const ext = path.extname(filePath).toLowerCase().replace('.', '')
      const mime =
        ext === 'png'
          ? 'image/png'
          : ext === 'webp'
            ? 'image/webp'
            : ext === 'svg'
              ? 'image/svg+xml'
              : 'image/jpeg'
      return `data:${mime};base64,${buffer.toString('base64')}`
    }
  } catch {}
  return null
}

/**
 * Resolves full context for the General Discography card.
 */
export async function resolveGeneralOgContext() {
  const configResult = loadConfigData()
  const config = configResult?.data ?? {}
  const artistResult = loadArtistData()
  const discography = artistResult?.data ?? {}

  const artistName = config?.artist?.name?.trim() || 'Artist'
  const bio = config?.artist?.bio?.trim() || ''

  const socialLinks = {
    ...(config?.artist?.links?.platforms || {}),
    ...(config?.artist?.links?.socials || {}),
    ...(config?.artist?.platforms || {}),
    ...(config?.artist?.socials || {}),
  }

  const publicProjects = (discography?.projects ?? []).filter((p) => p.visibility !== 'private')
  let totalTracks = 0
  for (const proj of publicProjects) {
    totalTracks += (proj.tracks || []).length
  }

  const sortedKeys = Object.keys(socialLinks).sort((a, b) => {
    const idxA = ORDERED_PLATFORM_KEYS.indexOf(a.toLowerCase())
    const idxB = ORDERED_PLATFORM_KEYS.indexOf(b.toLowerCase())
    return (idxA !== -1 ? idxA : 999) - (idxB !== -1 ? idxB : 999)
  })

  const activePlatforms = []
  for (const key of sortedKeys) {
    const url = socialLinks[key]
    if (url && typeof url === 'string' && url.trim() !== '') {
      const iconUrl = await getPlatformIconBase64(key)
      if (iconUrl) {
        activePlatforms.push({ key, iconUrl })
      }
    }
  }

  const activePlatformsCount = Object.values(socialLinks).filter(
    (u) => typeof u === 'string' && u.trim() !== '',
  ).length

  const stats = {
    totalProjects: publicProjects.length,
    totalTracks,
    totalPlatforms: activePlatformsCount,
  }

  // Background resolution: uploaded background or newest album art
  const bgDetails = getBackgroundDetails()
  let bgPath = bgDetails.exists ? bgDetails.fullPath : null
  if (!bgPath && publicProjects.length > 0) {
    const newestProject = publicProjects[0]
    const pSlug = newestProject.slug || slugify(newestProject.name)
    bgPath = resolveCoverFilePath(pSlug, newestProject.cover)
  }

  const logoDetails = getLogoDetails()
  const logoPath = logoDetails.exists ? logoDetails.fullPath : null
  const logoDataUrl = await fileToBase64DataUrl(logoPath, { maxDim: 600, isLogo: true })

  const paletteSource = bgPath || logoPath
  const palette = await extractOgPalette(paletteSource)
  const backgroundDataUrl = await renderOgBlurredBackground(bgPath)

  const { hash, fingerprint } = computeEntityFingerprint('general', {
    name: artistName,
    bio,
    socials: socialLinks,
    stats,
    artworkPath: bgPath,
    logoPath,
    backgroundPath: bgPath,
  })

  return {
    entityType: 'general',
    hash,
    fingerprint,
    artistName,
    bio,
    socialLinks,
    displayPlatforms: activePlatforms.slice(0, 8),
    stats,
    palette,
    themeColorHex: palette?.themeColorHex || '#5865F2',
    logoDataUrl,
    backgroundDataUrl,
  }
}

/**
 * Resolves full context for a Single Project card.
 */
export async function resolveProjectOgContext(projectSlug) {
  const artistResult = loadArtistData()
  const discography = artistResult?.data ?? {}
  const publicProjects = (discography?.projects ?? []).filter((p) => p.visibility !== 'private')
  const project = findProjectBySlug(publicProjects, projectSlug)
  if (!project) return null

  const configResult = loadConfigData()
  const config = configResult?.data ?? {}
  const defaultArtist = config?.artist?.name?.trim() || 'Artist'

  const projectName = project.name || 'Project'
  const projectArtist = project.artist || defaultArtist
  const releaseDate = formatProjectDate(project.date) || ''
  const projectType = project.type || 'Single'
  const tracks = project.tracks || []

  const projectDir = path.join(process.cwd(), 'data', 'projects', projectSlug)
  const resolvedCoverPath = resolveCoverFilePath(projectSlug, project.cover)
  const coverDataUrl = await fileToBase64DataUrl(resolvedCoverPath, { maxDim: 800 })

  const logoDetails = getLogoDetails()
  const logoPath = logoDetails.exists ? logoDetails.fullPath : null
  const logoDataUrl = await fileToBase64DataUrl(logoPath, { maxDim: 400, isLogo: true })

  const palette = await extractOgPalette(resolvedCoverPath || logoPath)
  const backgroundDataUrl = await renderOgBlurredBackground(resolvedCoverPath)
  const { totalSeconds, formattedDuration } = await computeProjectAudioDuration(projectSlug, tracks)

  const projectJsonPath = path.join(projectDir, 'project.json')
  const { hash, fingerprint } = computeEntityFingerprint('project', {
    slug: projectSlug,
    name: projectName,
    artist: projectArtist,
    date: project.date || '',
    type: projectType,
    artworkPath: resolvedCoverPath,
    logoPath,
    projectJsonPath,
    stats: { totalTracks: tracks.length, totalSeconds },
  })

  return {
    entityType: 'project',
    slug: projectSlug,
    hash,
    fingerprint,
    projectName,
    projectArtist,
    releaseDate,
    projectType,
    trackCount: tracks.length,
    formattedDuration,
    totalSeconds,
    palette,
    themeColorHex: palette?.themeColorHex || '#5865F2',
    coverDataUrl,
    logoDataUrl,
    backgroundDataUrl,
  }
}

/**
 * Resolves full context for an Individual Track card.
 */
export async function resolveTrackOgContext(projectSlug, trackSlug) {
  const artistResult = loadArtistData()
  const discography = artistResult?.data ?? {}
  const publicProjects = (discography?.projects ?? []).filter((p) => p.visibility !== 'private')
  const project = findProjectBySlug(publicProjects, projectSlug)
  if (!project) return null

  const track = findTrackBySlug(project.tracks || [], trackSlug)
  if (!track) return null

  const configResult = loadConfigData()
  const config = configResult?.data ?? {}
  const defaultArtist = config?.artist?.name?.trim() || 'Artist'

  const trackName = track.name || 'Untitled Track'
  const trackArtist = track.artist || project.artist || defaultArtist
  const projectName = project.name || ''
  const projectType = project.type || 'Single'
  const releaseDate = formatProjectDate(project.date) || ''

  const projectDir = path.join(process.cwd(), 'data', 'projects', projectSlug)
  const resolvedCoverPath =
    resolveCoverFilePath(projectSlug, track.cover) ||
    resolveCoverFilePath(projectSlug, project.cover)
  const coverDataUrl = await fileToBase64DataUrl(resolvedCoverPath, { maxDim: 800 })

  const logoDetails = getLogoDetails()
  const logoPath = logoDetails.exists ? logoDetails.fullPath : null
  const logoDataUrl = await fileToBase64DataUrl(logoPath, { maxDim: 400, isLogo: true })

  const audioPath = resolveTrackAudioPath(projectSlug, track)
  const durationSeconds = audioPath ? await probeAudioDurationSeconds(audioPath) : null
  const formattedDuration = durationSeconds ? formatDuration(durationSeconds) : '0:00'

  const palette = await extractOgPalette(resolvedCoverPath || logoPath)
  const backgroundDataUrl = await renderOgBlurredBackground(resolvedCoverPath)

  const projectJsonPath = path.join(projectDir, 'project.json')
  const { hash, fingerprint } = computeEntityFingerprint('track', {
    slug: `${projectSlug}/${trackSlug}`,
    name: trackName,
    artist: trackArtist,
    date: project.date || '',
    projectName,
    projectType,
    artworkPath: resolvedCoverPath,
    logoPath,
    audioPath,
    projectJsonPath,
    stats: { durationSeconds: durationSeconds || 0 },
  })

  return {
    entityType: 'track',
    slug: `${projectSlug}/${trackSlug}`,
    hash,
    fingerprint,
    trackName,
    trackArtist,
    projectName,
    projectType,
    releaseDate,
    formattedDuration,
    durationSeconds,
    palette,
    themeColorHex: palette?.themeColorHex || '#5865F2',
    coverDataUrl,
    logoDataUrl,
    backgroundDataUrl,
  }
}
