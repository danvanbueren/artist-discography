/**
 * Converts a string title into a clean, URL-safe slug.
 * Example: "Midnight Echoes (Deluxe)" -> "midnight-echoes-deluxe"
 */
export function slugify(text) {
  if (!text || typeof text !== 'string') return ''
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accent marks
    .replace(/[^a-z0-9\s-]/g, '')   // remove non-alphanumeric chars
    .replace(/[\s_-]+/g, '-')       // replace spaces/underscores with single dash
    .replace(/^-+|-+$/g, '')        // trim leading/trailing dashes
}

/**
 * Finds a project in the projects array by its slugified name.
 */
export function findProjectBySlug(projects, slug) {
  if (!Array.isArray(projects) || !slug) return null
  const normalizedSlug = slugify(slug)
  if (!normalizedSlug) return null

  return projects.find((project, index) => {
    const projSlug = slugify(project.name) || `project-${index + 1}`
    return projSlug === normalizedSlug
  }) || null
}

/**
 * Finds a track in a project's track list by its slugified name.
 */
export function findTrackBySlug(tracks, slug) {
  if (!Array.isArray(tracks) || !slug) return null
  const normalizedSlug = slugify(slug)
  if (!normalizedSlug) return null

  return tracks.find((track, index) => {
    const trackSlug = slugify(track.name) || `track-${index + 1}`
    return trackSlug === normalizedSlug
  }) || null
}
