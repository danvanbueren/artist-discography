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
