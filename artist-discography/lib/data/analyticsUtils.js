/**
 * Formats byte counts into human-readable strings (e.g. 1.2 MB, 450 KB)
 *
 * @param {number} bytes
 * @returns {string}
 */
export function formatBytes(bytes = 0) {
  if (!bytes || bytes <= 0 || isNaN(bytes)) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const val = bytes / Math.pow(k, i)
  return `${val.toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`
}

/**
 * Returns today's ISO date string (YYYY-MM-DD)
 *
 * @returns {string}
 */
export function getTodayDateString() {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Formats a millisecond timestamp into a concise relative time string.
 *
 * @param {number} timestamp
 * @returns {string}
 */
export function formatEventRelativeTime(timestamp) {
  if (!timestamp) return ''
  const diffSec = Math.max(0, Math.floor((Date.now() - timestamp) / 1000))
  if (diffSec < 60) return 'Just now'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDays = Math.floor(diffHr / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  const d = new Date(timestamp)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
}

const MONTH_NAMES_SHORT = [
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
const MONTH_NAMES_FULL = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

function parseLocalDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d, 0, 0, 0, 0)
}

function formatLocalDate(d) {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getMondayOfDate(d) {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const dayOfWeek = date.getDay()
  const diff = (dayOfWeek + 6) % 7
  date.setDate(date.getDate() - diff)
  return date
}

/**
 * Builds chronological timeline buckets aggregated by the appropriate fidelity
 * (day, week, month, year) based on requested range and total historical data span.
 *
 * @param {Object} options
 * @param {Object} [options.dailyData] - Map of date string to day metrics object
 * @param {'7d'|'30d'|'all'} [options.range] - Selected timeframe
 * @param {string} [options.firstTrackedDate] - ISO date string of earliest tracked event
 * @returns {{ timeline: Array, fidelity: string, cutoffDate: Date }}
 */
export function buildTimelineBuckets({
  dailyData = {},
  range = '30d',
  firstTrackedDate = null,
} = {}) {
  const todayStr = getTodayDateString()
  const todayDate = parseLocalDate(todayStr)

  let startDate
  let fidelity = 'day'

  if (range === '7d') {
    startDate = new Date(todayDate)
    startDate.setDate(todayDate.getDate() - 6)
    fidelity = 'day'
  } else if (range === '30d') {
    startDate = new Date(todayDate)
    startDate.setDate(todayDate.getDate() - 29)
    fidelity = 'day'
  } else {
    // range === 'all'
    const dailyKeys = Object.keys(dailyData).sort()
    let earliestStr = firstTrackedDate || dailyKeys[0] || todayStr
    if (dailyKeys.length > 0 && dailyKeys[0] < earliestStr) {
      earliestStr = dailyKeys[0]
    }
    if (earliestStr > todayStr) {
      earliestStr = todayStr
    }

    startDate = parseLocalDate(earliestStr)
    const diffDays = Math.max(
      1,
      Math.round((todayDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1,
    )

    if (diffDays <= 31) {
      fidelity = 'day'
    } else if (diffDays <= 120) {
      fidelity = 'week'
    } else if (diffDays <= 730) {
      fidelity = 'month'
    } else {
      fidelity = 'year'
    }
  }

  const bucketsMap = {}

  if (fidelity === 'day') {
    const curr = new Date(startDate)
    while (curr <= todayDate) {
      const key = formatLocalDate(curr)
      bucketsMap[key] = {
        date: key,
        dayLabel: `${curr.getMonth() + 1}/${curr.getDate()}`,
        label: `${MONTH_NAMES_SHORT[curr.getMonth()]} ${curr.getDate()}, ${curr.getFullYear()}`,
        fidelity: 'day',
        streams: 0,
        pageViews: 0,
        bandwidthBytes: 0,
        bandwidthAudioBytes: 0,
        bandwidthMediaBytes: 0,
      }
      curr.setDate(curr.getDate() + 1)
    }
  } else if (fidelity === 'week') {
    const mondayStart = getMondayOfDate(startDate)
    const curr = new Date(mondayStart)
    const lastMonday = getMondayOfDate(todayDate)
    while (curr <= lastMonday) {
      const key = formatLocalDate(curr)
      bucketsMap[key] = {
        date: key,
        dayLabel: `${curr.getMonth() + 1}/${curr.getDate()}`,
        label: `Week of ${MONTH_NAMES_SHORT[curr.getMonth()]} ${curr.getDate()}, ${curr.getFullYear()}`,
        fidelity: 'week',
        streams: 0,
        pageViews: 0,
        bandwidthBytes: 0,
        bandwidthAudioBytes: 0,
        bandwidthMediaBytes: 0,
      }
      curr.setDate(curr.getDate() + 7)
    }
  } else if (fidelity === 'month') {
    let currYear = startDate.getFullYear()
    let currMonth = startDate.getMonth()
    const endYear = todayDate.getFullYear()
    const endMonth = todayDate.getMonth()

    while (currYear < endYear || (currYear === endYear && currMonth <= endMonth)) {
      const key = `${currYear}-${String(currMonth + 1).padStart(2, '0')}`
      bucketsMap[key] = {
        date: key,
        dayLabel: `${MONTH_NAMES_SHORT[currMonth]} '${String(currYear).slice(2)}`,
        label: `${MONTH_NAMES_FULL[currMonth]} ${currYear}`,
        fidelity: 'month',
        streams: 0,
        pageViews: 0,
        bandwidthBytes: 0,
        bandwidthAudioBytes: 0,
        bandwidthMediaBytes: 0,
      }
      currMonth++
      if (currMonth > 11) {
        currMonth = 0
        currYear++
      }
    }
  } else if (fidelity === 'year') {
    const startYear = startDate.getFullYear()
    const endYear = todayDate.getFullYear()
    for (let yr = startYear; yr <= endYear; yr++) {
      const key = String(yr)
      bucketsMap[key] = {
        date: key,
        dayLabel: String(yr),
        label: `Year ${yr}`,
        fidelity: 'year',
        streams: 0,
        pageViews: 0,
        bandwidthBytes: 0,
        bandwidthAudioBytes: 0,
        bandwidthMediaBytes: 0,
      }
    }
  }

  // Populate metrics from dailyData
  for (const [dateStr, dayEntry] of Object.entries(dailyData)) {
    const entryDate = parseLocalDate(dateStr)
    if (entryDate < startDate || entryDate > todayDate) {
      continue
    }

    let bucketKey
    if (fidelity === 'day') {
      bucketKey = dateStr
    } else if (fidelity === 'week') {
      bucketKey = formatLocalDate(getMondayOfDate(entryDate))
    } else if (fidelity === 'month') {
      bucketKey = dateStr.slice(0, 7)
    } else if (fidelity === 'year') {
      bucketKey = dateStr.slice(0, 4)
    }

    if (bucketKey && bucketsMap[bucketKey]) {
      bucketsMap[bucketKey].streams += dayEntry.streams || 0
      bucketsMap[bucketKey].pageViews += dayEntry.pageViews || 0
      bucketsMap[bucketKey].bandwidthBytes += dayEntry.bandwidthBytes || 0
      bucketsMap[bucketKey].bandwidthAudioBytes += dayEntry.bandwidthAudioBytes || 0
      bucketsMap[bucketKey].bandwidthMediaBytes += dayEntry.bandwidthMediaBytes || 0
    }
  }

  const timeline = Object.values(bucketsMap).sort((a, b) => a.date.localeCompare(b.date))

  return {
    timeline,
    fidelity,
    cutoffDate: startDate,
  }
}
