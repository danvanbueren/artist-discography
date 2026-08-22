/**
 * Converts a string title into a clean, URL-safe slug.
 * Example: "Midnight Echoes (Deluxe)" -> "midnight-echoes-deluxe"
 */
export function slugify(text) {
  if (!text || typeof text !== 'string') return ''
  const cleaned = text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accent marks
    .replace(/[^a-z0-9\s-]/g, '') // remove non-alphanumeric chars
    .replace(/[\s_-]+/g, '-') // replace spaces/underscores with single dash
    .replace(/^-+|-+$/g, '') // trim leading/trailing dashes

  if (cleaned) return cleaned

  if (text.trim()) {
    let hash = 0
    const str = text.trim()
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i)
      hash |= 0
    }
    return `item-${Math.abs(hash).toString(36)}`
  }

  return ''
}

/**
 * Set of reserved system URL slugs and internal namespaces.
 * Project names that resolve to these slugs are prohibited to prevent URL collisions.
 */
export const RESERVED_SLUGS = new Set([
  '_sys',
  'sys',
  '_admin',
  'admin',
  '_dev',
  'dev',
  'api',
  'manifest',
  'manifest.json',
  'manifest.webmanifest',
  'favicon',
  'favicon.ico',
  'robots',
  'robots.txt',
  'sitemap',
  'sitemap.xml',
  'data',
  'public',
  'cache',
])

/**
 * Checks if a string or its slugified form is reserved by the system.
 */
export function isSlugReserved(text) {
  if (!text || typeof text !== 'string') return false
  const trimmedLower = text.trim().toLowerCase()
  if (RESERVED_SLUGS.has(trimmedLower)) return true
  const slug = slugify(text)
  return RESERVED_SLUGS.has(slug)
}

/**
 * Given a project name that conflicts with a reserved slug (e.g. "_sys"),
 * resolves a safe, non-reserved name by appending an incremental number (e.g. "_sys 1", "_sys 2").
 */
export function resolveNonReservedProjectName(rawName, existingNames = []) {
  const baseName = typeof rawName === 'string' && rawName.trim() ? rawName.trim() : 'Project'
  const existingSet = new Set(
    (existingNames || []).map((n) => (typeof n === 'string' ? n.trim().toLowerCase() : '')),
  )

  let counter = 1
  let candidate = `${baseName} ${counter}`
  while (isSlugReserved(candidate) || existingSet.has(candidate.toLowerCase())) {
    counter++
    candidate = `${baseName} ${counter}`
  }
  return candidate
}

/**
 * Finds a project in the projects array by its slugified name.
 */
export function findProjectBySlug(projects, slug) {
  if (!Array.isArray(projects) || !slug) return null
  const normalizedSlug = slugify(slug)
  if (!normalizedSlug) return null

  return (
    projects.find((project, index) => {
      const projSlug = slugify(project.name) || `project-${index + 1}`
      return projSlug === normalizedSlug
    }) || null
  )
}

/**
 * Finds a track in a project's track list by its slugified name.
 */
export function findTrackBySlug(tracks, slug) {
  if (!Array.isArray(tracks) || !slug) return null
  const normalizedSlug = slugify(slug)
  if (!normalizedSlug) return null

  return (
    tracks.find((track) => {
      const trackSlug = slugify(track.name)
      return trackSlug === normalizedSlug
    }) || null
  )
}
