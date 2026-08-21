import { slugify, isSlugReserved } from '../../lib/slugs'

export function isProjectSlugReserved(name) {
  return isSlugReserved(name)
}

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

export function getProjectNameValidationError(name, projectsList, excludeIndex = -1) {
  if (!name || typeof name !== 'string' || !name.trim()) return null
  if (isProjectSlugReserved(name)) {
    const slug = slugify(name) || name.trim()
    return `The name / URL slug "${slug}" is reserved for system routes (e.g. _sys) and cannot be used.`
  }
  if (isProjectSlugDuplicate(name, projectsList, excludeIndex)) {
    return 'A project with this title / URL slug already exists.'
  }
  return null
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
export function buildPlatformSearchUrl(
  platformKey,
  artistName = '',
  trackName = '',
  projectName = '',
) {
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

let cachedProjectsRef = null
let cachedLinksIndex = null

/**
 * Builds a fast Map index of all streaming links across all projects.
 * Cached by allProjects reference for instant O(1) duplicate checks.
 */
export function getProjectsLinkIndex(allProjects) {
  if (cachedProjectsRef === allProjects && cachedLinksIndex) {
    return cachedLinksIndex
  }
  const index = new Map()
  if (Array.isArray(allProjects)) {
    for (let pIdx = 0; pIdx < allProjects.length; pIdx++) {
      const project = allProjects[pIdx]
      if (!project) continue
      const tracks = project.tracks ?? []
      for (let tIdx = 0; tIdx < tracks.length; tIdx++) {
        const track = tracks[tIdx]
        if (!track?.links) continue
        for (const [key, linkVal] of Object.entries(track.links)) {
          if (!linkVal || typeof linkVal !== 'string') continue
          const norm = normalizeLinkForComparison(linkVal)
          if (norm && norm.length >= 5 && !index.has(norm)) {
            index.set(norm, {
              projectIndex: pIdx,
              trackIndex: tIdx,
              projectName: project.name || `Project #${pIdx + 1}`,
              trackName: track.name || `Track #${tIdx + 1}`,
              platformKey: key,
            })
          }
        }
      }
    }
  }
  cachedProjectsRef = allProjects
  cachedLinksIndex = index
  return index
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

  // 1. PRIMARY SEARCH: O(1) index lookup across all other projects
  if (Array.isArray(allProjects) && allProjects.length > 0) {
    const linkIndex = getProjectsLinkIndex(allProjects)
    const match = linkIndex.get(normalizedTarget)
    if (match && match.projectIndex !== currentProjectIndex) {
      const platformName = getPlatformLabel(match.platformKey)
      return {
        isDuplicate: true,
        scope: 'other_project',
        projectName: match.projectName,
        trackName: match.trackName,
        platform: match.platformKey,
        message: `⚠️ Duplicate link: matches Track '${match.trackName}' in Project '${match.projectName}' (${platformName})`,
      }
    }
  }

  // 2. SECONDARY SEARCH: Check all other tracks within the same project
  const activeTracks =
    Array.isArray(currentTracks) && currentTracks.length > 0
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
  const thisTrackLinks =
    currentTrackLinks || (currentTrackIndex >= 0 && activeTracks[currentTrackIndex]?.links) || null
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
  if (
    lower.includes('music.apple.com/') &&
    lower.includes('/album/') &&
    !lower.includes('?i=') &&
    !lower.includes('&i=')
  ) {
    return true
  }

  // SoundCloud: /sets/ (SoundCloud playlist/album URLs)
  if (lower.includes('soundcloud.com/') && lower.includes('/sets/')) return true

  // Tidal: /album/ without /track/
  if (lower.includes('tidal.com/') && lower.includes('/album/') && !lower.includes('/track/'))
    return true

  // Deezer: /album/ without /track/
  if (lower.includes('deezer.com/') && lower.includes('/album/') && !lower.includes('/track/'))
    return true

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

/**
 * Analyzes a Spotify URL to check for tracking/share parameters (like ?si=...) and generates a clean canonical Spotify URL.
 */
export function analyzeSpotifyUrl(url) {
  if (!url || typeof url !== 'string') return { hasTrackingParams: false, cleanedUrl: url || '' }
  const trimmed = url.trim()
  const lower = trimmed.toLowerCase()

  const isSpotify = lower.includes('spotify.com') || lower.includes('spotify.link')
  if (!isSpotify) {
    return { hasTrackingParams: false, cleanedUrl: trimmed }
  }

  const hasTracking = /[?&](si|context|utm_[a-zA-Z0-9_]+|nd|go)=/i.test(trimmed)
  if (!hasTracking) {
    return { hasTrackingParams: false, cleanedUrl: trimmed }
  }

  let cleanedUrl = trimmed
  try {
    const hasProtocol = /^https?:\/\//i.test(trimmed)
    const urlToParse = hasProtocol ? trimmed : `https://${trimmed}`
    const parsed = new URL(urlToParse)

    parsed.searchParams.delete('si')
    parsed.searchParams.delete('context')
    parsed.searchParams.delete('utm_source')
    parsed.searchParams.delete('utm_medium')
    parsed.searchParams.delete('utm_campaign')
    parsed.searchParams.delete('utm_term')
    parsed.searchParams.delete('utm_content')
    parsed.searchParams.delete('nd')
    parsed.searchParams.delete('go')

    const search = parsed.searchParams.toString()
    const resultWithProtocol = `${parsed.origin}${parsed.pathname}${search ? `?${search}` : ''}`
    cleanedUrl = hasProtocol ? resultWithProtocol : resultWithProtocol.replace(/^https?:\/\//, '')
  } catch {
    cleanedUrl = trimmed
      .replace(/([?&])si=[^&]+/gi, '')
      .replace(/([?&])context=[^&]+/gi, '')
      .replace(/([?&])utm_[a-zA-Z0-9_]+=[^&]+/gi, '')
      .replace(/([?&])nd=[^&]+/gi, '')
      .replace(/([?&])go=[^&]+/gi, '')
      .replace(/\?&/, '?')
      .replace(/&&/, '&')
      .replace(/[?&]$/, '')
  }

  return {
    hasTrackingParams: true,
    cleanedUrl,
  }
}
