/**
 * Merges query parameters into an internal media/logo/background API URL
 * while preserving existing cache-busting params such as `v` or `t`.
 *
 * @param {string|null} src - Base media URL
 * @param {Record<string, string|number|null|undefined>} [params={}] - Query parameters to set or delete
 * @returns {string}
 */
export function withMediaQuery(src, params = {}) {
  if (!src || typeof src !== 'string') return ''
  const [basePath, existingQuery = ''] = src.split('?')
  const searchParams = new URLSearchParams(existingQuery)
  for (const [key, val] of Object.entries(params)) {
    if (val === undefined || val === null || val === '') {
      searchParams.delete(key)
    } else {
      searchParams.set(key, String(val))
    }
  }
  const queryStr = searchParams.toString()
  return queryStr ? `${basePath}?${queryStr}` : basePath
}
