/**
 * Formats a project date string into standard display format: "MMM d, YYYY" (e.g. "Jan 1, 2026").
 * Supports YYYY-MM-DD, YYYY-MM, YYYY, or ISO date strings.
 * Returns original input string if empty or unparseable.
 *
 * @param {string} dateStr - Raw date string (e.g., "2026-01-01")
 * @returns {string} Formatted date string (e.g., "Jan 1, 2026")
 */
export function formatProjectDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return dateStr || ''

  const trimmed = dateStr.trim()
  if (!trimmed) return ''

  // Matches YYYY-MM-DD or YYYY-MM-DDT...
  const ymdMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10)
    const monthIdx = parseInt(ymdMatch[2], 10) - 1
    const day = parseInt(ymdMatch[3], 10)

    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ]

    if (monthIdx >= 0 && monthIdx < 12 && day >= 1 && day <= 31) {
      return `${months[monthIdx]} ${day}, ${year}`
    }
  }

  // Matches YYYY-MM
  const ymMatch = trimmed.match(/^(\d{4})-(\d{1,2})$/)
  if (ymMatch) {
    const year = parseInt(ymMatch[1], 10)
    const monthIdx = parseInt(ymMatch[2], 10) - 1

    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ]

    if (monthIdx >= 0 && monthIdx < 12) {
      return `${months[monthIdx]} ${year}`
    }
  }

  return trimmed
}
