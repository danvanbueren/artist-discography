import { slugify } from '../../lib/slugs'

export function resolveOverrideArtist(artistValue, primaryArtist = '', projectArtist = '') {
  if (!artistValue || typeof artistValue !== 'string') return ''
  const trimmed = artistValue.trim()
  if (!trimmed) return ''
  const lower = trimmed.toLowerCase()
  if (primaryArtist && lower === primaryArtist.trim().toLowerCase()) return ''
  if (projectArtist && lower === projectArtist.trim().toLowerCase()) return ''
  return trimmed
}

export function getMediaThumbnailUrl(src, width = 120, quality = 80) {
  if (!src || typeof src !== 'string') return ''
  const trimmed = src.trim()
  if (!trimmed) return ''
  if (trimmed.startsWith('blob:') || trimmed.startsWith('data:')) {
    return trimmed
  }
  let base = trimmed
  if (!base.startsWith('http://') && !base.startsWith('https://') && !base.startsWith('/')) {
    base = `/api/media/${base}`
  }
  if (base.startsWith('/api/media/')) {
    const separator = base.includes('?') ? '&' : '?'
    if (!base.includes('w=') && !base.includes('fmt=')) {
      return `${base}${separator}w=${width}&q=${quality}&fmt=webp`
    }
  }
  return base
}

export function formatMediaPath(urlOrFilename, defaultProjectSlug = '', mediaType = 'media') {
  if (!urlOrFilename || typeof urlOrFilename !== 'string') return ''
  const trimmed = urlOrFilename.trim()
  if (trimmed.startsWith('blob:') || trimmed.startsWith('data:')) {
    return 'Local preview (staged)'
  }
  if (trimmed.startsWith('/api/media/')) {
    return `data/${trimmed.replace(/^\/api\/media\//, '')}`
  }
  if (trimmed.startsWith('/api/audio/')) {
    return `data/${trimmed.replace(/^\/api\/audio\//, '')}`
  }
  if (trimmed.startsWith('data/')) {
    return trimmed
  }
  if (defaultProjectSlug) {
    return `data/projects/${defaultProjectSlug}/${trimmed}`
  }
  return `data/${trimmed}`
}

export function isProjectSlugDuplicate(name, projectsList, excludeIndex = -1) {
  const targetSlug = slugify(name)
  if (!targetSlug) return false
  return projectsList.some((p, idx) => {
    if (excludeIndex >= 0 && idx === excludeIndex) return false
    return slugify(p.name) === targetSlug
  })
}

export function getDuplicateTrackSlugIndexes(tracksList) {
  const dupIndexes = new Set()
  const map = new Map()
  tracksList.forEach((t, idx) => {
    const s = slugify(t.name)
    if (!s) return
    if (!map.has(s)) map.set(s, [])
    map.get(s).push(idx)
  })
  map.forEach((indexes) => {
    if (indexes.length > 1) {
      indexes.forEach((i) => dupIndexes.add(i))
    }
  })
  return dupIndexes
}

export function createEmptyTrack() {
  return {
    id: `track-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: '',
    originalName: '',
    artist: '',
    audioFile: null,
    audioFileName: '',
    links: {
      spotify: '',
      apple: '',
      youtube: '',
      soundcloud: '',
      amazon: '',
      bandcamp: '',
      deezer: '',
      itunes: '',
      pandora: '',
      tidal: '',
    },
  }
}

/**
 * Constructs a targeted search URL for a given platform, artist, and track/project name.
 */
export function buildPlatformSearchUrl(platformKey, artistName = '', trackName = '', projectName = '') {
  const cleanArtist = (artistName || '').trim()
  const cleanTrack = (trackName || '').trim()
  const cleanProject = (projectName || '').trim()

  const queryTerms = [cleanArtist, cleanTrack || cleanProject].filter(Boolean).join(' ')
  const encodedQuery = encodeURIComponent(queryTerms || 'music')

  switch (platformKey) {
    case 'spotify':
      return `https://open.spotify.com/search/${encodedQuery}`
    case 'youtube':
      return `https://www.youtube.com/results?search_query=${encodedQuery}`
    case 'apple':
      return `https://music.apple.com/us/search?term=${encodedQuery}`
    case 'soundcloud':
      return `https://soundcloud.com/search?q=${encodedQuery}`
    case 'bandcamp':
      return `https://bandcamp.com/search?q=${encodedQuery}`
    case 'tidal':
      return `https://listen.tidal.com/search?q=${encodedQuery}`
    case 'deezer':
      return `https://www.deezer.com/search/${encodedQuery}`
    case 'amazon':
      return `https://music.amazon.com/search/${encodedQuery}`
    case 'pandora':
      return `https://www.pandora.com/search/${encodedQuery}/all`
    case 'itunes':
      return `https://www.google.com/search?q=${encodeURIComponent(`${queryTerms} itunes`)}`
    default:
      return `https://www.google.com/search?q=${encodeURIComponent(`${queryTerms} ${platformKey}`.trim())}`
  }
}

/**
 * Normalizes a streaming link URL for comparison.
 */
export function normalizeLinkForComparison(url) {
  if (!url || typeof url !== 'string') return ''
  let cleaned = url.trim().toLowerCase()
  cleaned = cleaned.replace(/^https?:\/\//, '').replace(/^www\./, '')
  cleaned = cleaned.replace(/\/+$/, '')
  return cleaned
}

const PLATFORM_NAME_MAP = {
  spotify: 'Spotify',
  apple: 'Apple Music',
  youtube: 'YouTube',
  soundcloud: 'SoundCloud',
  bandcamp: 'Bandcamp',
  tidal: 'Tidal',
  deezer: 'Deezer',
  amazon: 'Amazon Music',
  pandora: 'Pandora',
  itunes: 'iTunes',
}

function getPlatformLabel(key) {
  return PLATFORM_NAME_MAP[key] || (key ? key.charAt(0).toUpperCase() + key.slice(1) : '')
}

/**
 * Checks if a streaming link is already used by another project, another track in the same project, or another field on the same track.
 */
export function findDuplicateStreamingLink(url, context = {}, allProjects = []) {
  if (!url || typeof url !== 'string') return null
  const normalizedTarget = normalizeLinkForComparison(url)
  if (!normalizedTarget || normalizedTarget.length < 5) return null

  const {
    currentProjectIndex = -1,
    currentTrackIndex = -1,
    platformKey = '',
    currentTracks = [],
    currentTrackLinks = null,
  } = context

  // 1. PRIMARY SEARCH: Check other projects in allProjects
  if (Array.isArray(allProjects)) {
    for (let pIdx = 0; pIdx < allProjects.length; pIdx++) {
      if (pIdx === currentProjectIndex) continue // Evaluated in secondary check
      const project = allProjects[pIdx]
      if (!project) continue
      const tracks = project.tracks ?? []

      for (let tIdx = 0; tIdx < tracks.length; tIdx++) {
        const track = tracks[tIdx]
        if (!track?.links) continue

        for (const [key, linkVal] of Object.entries(track.links)) {
          if (linkVal && normalizeLinkForComparison(linkVal) === normalizedTarget) {
            const platformName = getPlatformLabel(key)
            const projName = project.name || `Project #${pIdx + 1}`
            const trkName = track.name || `Track #${tIdx + 1}`
            return {
              isDuplicate: true,
              scope: 'other_project',
              projectName: projName,
              trackName: trkName,
              platform: key,
              message: `⚠️ Duplicate link: matches Track '${trkName}' in Project '${projName}' (${platformName})`,
            }
          }
        }
      }
    }
  }

  // 2. SECONDARY SEARCH: Check all other tracks within the same project
  const activeTracks = Array.isArray(currentTracks) && currentTracks.length > 0
    ? currentTracks
    : (currentProjectIndex >= 0 && allProjects?.[currentProjectIndex]?.tracks) || []

  for (let tIdx = 0; tIdx < activeTracks.length; tIdx++) {
    if (tIdx === currentTrackIndex) continue // Skip self track for tertiary check
    const track = activeTracks[tIdx]
    if (!track?.links) continue

    for (const [key, linkVal] of Object.entries(track.links)) {
      if (linkVal && normalizeLinkForComparison(linkVal) === normalizedTarget) {
        const platformName = getPlatformLabel(key)
        const trkName = track.name || `Track #${tIdx + 1}`
        return {
          isDuplicate: true,
          scope: 'same_project',
          trackName: trkName,
          platform: key,
          message: `⚠️ Duplicate link: matches Track '${trkName}' (${platformName}) in this project`,
        }
      }
    }
  }

  // 3. TERTIARY SEARCH: Check all other platform fields on the exact same track
  const thisTrackLinks = currentTrackLinks || (currentTrackIndex >= 0 && activeTracks[currentTrackIndex]?.links) || null
  if (thisTrackLinks && typeof thisTrackLinks === 'object') {
    for (const [key, linkVal] of Object.entries(thisTrackLinks)) {
      if (key === platformKey) continue // Don't compare field to itself
      if (linkVal && normalizeLinkForComparison(linkVal) === normalizedTarget) {
        const platformName = getPlatformLabel(key)
        return {
          isDuplicate: true,
          scope: 'same_track',
          platform: key,
          message: `⚠️ Duplicate link: already pasted in ${platformName} on this track`,
        }
      }
    }
  }

  return null
}

/**
 * Detects if a URL is likely an album or playlist collection rather than a single song/track.
 */
export function isAlbumLevelUrl(url) {
  if (!url || typeof url !== 'string') return false
  const lower = url.toLowerCase().trim()

  // Spotify: /album/
  if (lower.includes('spotify.com/album/')) return true

  // Apple Music: /album/ without ?i= or &i=
  if (lower.includes('music.apple.com/') && lower.includes('/album/') && !lower.includes('?i=') && !lower.includes('&i=')) {
    return true
  }

  // SoundCloud: /sets/ (SoundCloud playlist/album URLs)
  if (lower.includes('soundcloud.com/') && lower.includes('/sets/')) return true

  // Tidal: /album/ without /track/
  if (lower.includes('tidal.com/') && lower.includes('/album/') && !lower.includes('/track/')) return true

  // Deezer: /album/ without /track/
  if (lower.includes('deezer.com/') && lower.includes('/album/') && !lower.includes('/track/')) return true

  return false
}

/**
 * Analyzes a YouTube URL to check for playlist parameters and generates a stripped, clean direct video URL.
 */
export function analyzeYouTubeUrl(url) {
  if (!url || typeof url !== 'string') return { hasPlaylist: false, cleanedUrl: url || '' }
  const trimmed = url.trim()
  const lower = trimmed.toLowerCase()

  const isYouTube = lower.includes('youtube.com') || lower.includes('youtu.be')
  if (!isYouTube) {
    return { hasPlaylist: false, cleanedUrl: trimmed }
  }

  const hasListParam = /[?&]list=[a-zA-Z0-9_-]+/i.test(trimmed)
  const hasIndexParam = /[?&]index=\d+/i.test(trimmed)

  if (!hasListParam && !hasIndexParam) {
    return { hasPlaylist: false, cleanedUrl: trimmed }
  }

  let cleanedUrl = trimmed
  try {
    const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`)
    parsed.searchParams.delete('list')
    parsed.searchParams.delete('index')
    parsed.searchParams.delete('start_radio')
    parsed.searchParams.delete('rv')
    cleanedUrl = parsed.toString()
  } catch {
    cleanedUrl = trimmed
      .replace(/([?&])list=[^&]+/gi, '')
      .replace(/([?&])index=\d+/gi, '')
      .replace(/\?&/, '?')
      .replace(/&&/, '&')
      .replace(/[?&]$/, '')
  }

  return {
    hasPlaylist: true,
    cleanedUrl,
  }
}
