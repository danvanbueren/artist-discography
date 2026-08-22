/**
 * Normalizes a configured siteUrl string into a valid absolute base URL.
 * Defaults to 'http://localhost:3000' if set to 'localhost', empty, or omitted.
 *
 * @param {string} [url] - Configured site URL string
 * @returns {string} Fully qualified absolute URL without trailing slash
 */
export function normalizeSiteUrl(url) {
  if (!url) return 'http://localhost:3000'
  const trimmed = String(url).trim().replace(/\/+$/, '')
  if (!trimmed || trimmed === 'localhost') return 'http://localhost:3000'
  if (trimmed.startsWith('localhost:') || trimmed.startsWith('127.0.0.1:')) {
    return `http://${trimmed}`
  }
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

/**
 * Normalizes all URL references inside artist profile data.
 *
 * @param {Object} artistData - Artist profile metadata object
 * @returns {Object} Normalized artist profile metadata
 */
export function normalizeArtistDataUrls(artistData) {
  if (!artistData || typeof artistData !== 'object') return artistData
  const siteUrl = normalizeSiteUrl(artistData.siteUrl)
  return {
    ...artistData,
    siteUrl,
  }
}
