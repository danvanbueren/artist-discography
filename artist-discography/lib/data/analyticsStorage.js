import fs from 'fs'
import path from 'path'
import { atomicWriteJson, createRollingBackup, tryHeuristicJsonRepair } from './atomicStorage'
import { formatBytes, getTodayDateString, buildTimelineBuckets } from './analyticsUtils'

export { formatBytes, getTodayDateString, buildTimelineBuckets }

const ANALYTICS_DIR_NAME = 'analytics'
const MAX_RECENT_EVENTS = 200

/**
 * Returns the absolute path to data/analytics/
 */
export function getAnalyticsDir() {
  const dir = path.join(process.cwd(), 'data', ANALYTICS_DIR_NAME)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  return dir
}

/**
 * Safely parses a JSON file from disk with heuristic recovery fallback
 *
 * @param {string} filePath
 * @param {*} fallback
 * @returns {*}
 */
function safeReadJson(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback
    const raw = fs.readFileSync(filePath, 'utf8')
    if (!raw || !raw.trim()) return fallback
    try {
      return JSON.parse(raw)
    } catch {
      const repaired = tryHeuristicJsonRepair(raw)
      return repaired || fallback
    }
  } catch (err) {
    console.warn(`Warning: Failed to read analytics file ${filePath}:`, err)
    return fallback
  }
}

// In-memory buffer for high-frequency bandwidth increments to avoid disk thrashing
let bandwidthBuffer = {
  audioBytes: 0,
  mediaBytes: 0,
  projectBytes: {},
}
let bandwidthFlushTimer = null

/**
 * Flushes buffered bandwidth increments to disk
 */
function flushBandwidthBuffer() {
  if (bandwidthFlushTimer) {
    clearTimeout(bandwidthFlushTimer)
    bandwidthFlushTimer = null
  }

  const { audioBytes, mediaBytes, projectBytes } = bandwidthBuffer
  const totalDelta = audioBytes + mediaBytes
  if (totalDelta <= 0 && Object.keys(projectBytes).length === 0) return

  // Reset buffer immediately before disk write
  bandwidthBuffer = {
    audioBytes: 0,
    mediaBytes: 0,
    projectBytes: {},
  }

  try {
    const analyticsDir = getAnalyticsDir()
    const dailyPath = path.join(analyticsDir, 'daily.json')
    const totalsPath = path.join(analyticsDir, 'totals.json')
    const today = getTodayDateString()

    // 1. Update daily.json
    const dailyData = safeReadJson(dailyPath, {})
    if (!dailyData[today]) {
      dailyData[today] = {
        pageViews: 0,
        streams: 0,
        bandwidthBytes: 0,
        bandwidthAudioBytes: 0,
        bandwidthMediaBytes: 0,
        pages: {},
        projects: {},
        tracks: {},
        referrers: {},
        projectsBandwidth: {},
      }
    }
    const dayEntry = dailyData[today]
    dayEntry.bandwidthBytes = (dayEntry.bandwidthBytes || 0) + totalDelta
    dayEntry.bandwidthAudioBytes = (dayEntry.bandwidthAudioBytes || 0) + audioBytes
    dayEntry.bandwidthMediaBytes = (dayEntry.bandwidthMediaBytes || 0) + mediaBytes

    if (!dayEntry.projectsBandwidth) dayEntry.projectsBandwidth = {}
    for (const [proj, b] of Object.entries(projectBytes)) {
      dayEntry.projectsBandwidth[proj] = (dayEntry.projectsBandwidth[proj] || 0) + b
    }
    atomicWriteJson(dailyPath, dailyData)

    // 2. Update totals.json
    const totalsData = safeReadJson(totalsPath, {
      totalPageViews: 0,
      totalStreams: 0,
      totalBandwidthBytes: 0,
      totalBandwidthAudioBytes: 0,
      totalBandwidthMediaBytes: 0,
      projects: {},
      tracks: {},
      pages: {},
      projectsBandwidth: {},
    })
    totalsData.totalBandwidthBytes = (totalsData.totalBandwidthBytes || 0) + totalDelta
    totalsData.totalBandwidthAudioBytes = (totalsData.totalBandwidthAudioBytes || 0) + audioBytes
    totalsData.totalBandwidthMediaBytes = (totalsData.totalBandwidthMediaBytes || 0) + mediaBytes

    if (!totalsData.projectsBandwidth) totalsData.projectsBandwidth = {}
    for (const [proj, b] of Object.entries(projectBytes)) {
      totalsData.projectsBandwidth[proj] = (totalsData.projectsBandwidth[proj] || 0) + b
    }
    atomicWriteJson(totalsPath, totalsData)
  } catch (err) {
    console.warn('Warning during bandwidth buffer flush:', err)
  }
}

/**
 * Records transferred bandwidth in bytes (buffered for high performance)
 *
 * @param {Object} params
 * @param {number} params.bytes
 * @param {'audio'|'media'|'other'} [params.type='audio']
 * @param {string} [params.projectSlug]
 */
export function recordBandwidthUsage({ bytes = 0, type = 'audio', projectSlug = '' }) {
  if (!bytes || bytes <= 0 || isNaN(bytes)) return

  if (type === 'audio') {
    bandwidthBuffer.audioBytes += bytes
  } else {
    bandwidthBuffer.mediaBytes += bytes
  }

  if (projectSlug) {
    bandwidthBuffer.projectBytes[projectSlug] =
      (bandwidthBuffer.projectBytes[projectSlug] || 0) + bytes
  }

  // Schedule delayed flush if not already active
  if (!bandwidthFlushTimer) {
    bandwidthFlushTimer = setTimeout(flushBandwidthBuffer, 3000)
  }
}

/**
 * Records an analytics event (stream or pageview)
 *
 * @param {Object} event
 * @param {'stream'|'pageview'} event.type
 * @param {string} [event.project]
 * @param {string} [event.projectSlug]
 * @param {string} [event.track]
 * @param {string} [event.path]
 * @param {string} [event.referrer]
 * @param {string} [event.userAgent]
 * @returns {boolean}
 */
export function recordAnalyticsEvent(event = {}) {
  try {
    const analyticsDir = getAnalyticsDir()
    const dailyPath = path.join(analyticsDir, 'daily.json')
    const eventsPath = path.join(analyticsDir, 'events.json')
    const totalsPath = path.join(analyticsDir, 'totals.json')

    const type = event.type === 'stream' ? 'stream' : 'pageview'
    const today = getTodayDateString()
    const now = Date.now()
    const isoDate = new Date(now).toISOString()

    const rawPath = String(event.path || '/').trim() || '/'
    const cleanPath = rawPath.split('?')[0] || '/'
    const project = String(event.project || '').trim()
    const projectSlug = String(event.projectSlug || '').trim()
    const track = String(event.track || '').trim()
    const referrer = String(event.referrer || 'direct').trim() || 'direct'

    // 1. Update daily.json
    const dailyData = safeReadJson(dailyPath, {})
    if (!dailyData[today]) {
      dailyData[today] = {
        pageViews: 0,
        streams: 0,
        bandwidthBytes: 0,
        bandwidthAudioBytes: 0,
        bandwidthMediaBytes: 0,
        pages: {},
        projects: {},
        tracks: {},
        referrers: {},
        projectsBandwidth: {},
      }
    }

    const dayEntry = dailyData[today]
    if (type === 'stream') {
      dayEntry.streams = (dayEntry.streams || 0) + 1
      if (projectSlug || project) {
        const key = projectSlug || project
        dayEntry.projects[key] = (dayEntry.projects[key] || 0) + 1
      }
      if (track) {
        dayEntry.tracks[track] = (dayEntry.tracks[track] || 0) + 1
      }
    } else {
      dayEntry.pageViews = (dayEntry.pageViews || 0) + 1
      dayEntry.pages[cleanPath] = (dayEntry.pages[cleanPath] || 0) + 1
      if (referrer) {
        dayEntry.referrers[referrer] = (dayEntry.referrers[referrer] || 0) + 1
      }
    }
    atomicWriteJson(dailyPath, dailyData)

    // 2. Update events.json (sliding window)
    const eventsList = safeReadJson(eventsPath, [])
    const eventRecord = {
      id: `evt_${now}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: now,
      isoDate,
      date: today,
      type,
      path: cleanPath,
      project: project || undefined,
      projectSlug: projectSlug || undefined,
      track: track || undefined,
      referrer: referrer !== 'direct' ? referrer : undefined,
    }
    eventsList.unshift(eventRecord)
    if (eventsList.length > MAX_RECENT_EVENTS) {
      eventsList.length = MAX_RECENT_EVENTS
    }
    atomicWriteJson(eventsPath, eventsList)

    // 3. Update totals.json
    const totalsData = safeReadJson(totalsPath, {
      totalPageViews: 0,
      totalStreams: 0,
      totalBandwidthBytes: 0,
      totalBandwidthAudioBytes: 0,
      totalBandwidthMediaBytes: 0,
      projects: {},
      tracks: {},
      pages: {},
      projectsBandwidth: {},
      firstTrackedDate: today,
      lastTrackedDate: today,
    })

    totalsData.lastTrackedDate = today
    if (!totalsData.firstTrackedDate) {
      totalsData.firstTrackedDate = today
    }

    if (type === 'stream') {
      totalsData.totalStreams = (totalsData.totalStreams || 0) + 1
      if (projectSlug || project) {
        const key = projectSlug || project
        if (!totalsData.projects[key]) {
          totalsData.projects[key] = { name: project || key, streams: 0 }
        }
        totalsData.projects[key].streams = (totalsData.projects[key].streams || 0) + 1
      }
      if (track) {
        totalsData.tracks[track] = (totalsData.tracks[track] || 0) + 1
      }
    } else {
      totalsData.totalPageViews = (totalsData.totalPageViews || 0) + 1
      totalsData.pages[cleanPath] = (totalsData.pages[cleanPath] || 0) + 1
    }
    atomicWriteJson(totalsPath, totalsData)

    return true
  } catch (err) {
    console.error('Error recording analytics event:', err)
    return false
  }
}

/**
 * Aggregates and retrieves analytics summary and timeline for the requested range
 *
 * @param {Object} [params]
 * @param {'7d'|'30d'|'all'} [params.range='30d']
 * @returns {Object}
 */
export function getAnalyticsSummary({ range = '30d' } = {}) {
  // Ensure any buffered bandwidth data is flushed to disk before calculating summary
  flushBandwidthBuffer()

  const analyticsDir = getAnalyticsDir()
  const dailyPath = path.join(analyticsDir, 'daily.json')
  const eventsPath = path.join(analyticsDir, 'events.json')
  const totalsPath = path.join(analyticsDir, 'totals.json')

  const dailyData = safeReadJson(dailyPath, {})
  const eventsList = safeReadJson(eventsPath, [])
  const totalsData = safeReadJson(totalsPath, {
    totalPageViews: 0,
    totalStreams: 0,
    totalBandwidthBytes: 0,
    totalBandwidthAudioBytes: 0,
    totalBandwidthMediaBytes: 0,
    projects: {},
    tracks: {},
    pages: {},
    projectsBandwidth: {},
  })

  // Build chronological timeline buckets according to range and fidelity
  const { timeline, fidelity, cutoffDate } = buildTimelineBuckets({
    dailyData,
    range,
    firstTrackedDate: totalsData.firstTrackedDate,
  })

  let rangeStreams = 0
  let rangePageViews = 0
  let rangeBandwidth = 0
  let rangeAudioBandwidth = 0
  let rangeMediaBandwidth = 0
  const rangeProjects = {}
  const rangeTracks = {}
  const rangePages = {}
  const rangeProjectsBandwidth = {}

  for (const [dateStr, dayEntry] of Object.entries(dailyData)) {
    const entryDate = new Date(`${dateStr}T00:00:00`)
    const isWithinRange = range === 'all' || entryDate >= cutoffDate

    if (isWithinRange) {
      rangeStreams += dayEntry.streams || 0
      rangePageViews += dayEntry.pageViews || 0
      rangeBandwidth += dayEntry.bandwidthBytes || 0
      rangeAudioBandwidth += dayEntry.bandwidthAudioBytes || 0
      rangeMediaBandwidth += dayEntry.bandwidthMediaBytes || 0

      for (const [proj, count] of Object.entries(dayEntry.projects || {})) {
        rangeProjects[proj] = (rangeProjects[proj] || 0) + count
      }
      for (const [trk, count] of Object.entries(dayEntry.tracks || {})) {
        rangeTracks[trk] = (rangeTracks[trk] || 0) + count
      }
      for (const [p, count] of Object.entries(dayEntry.pages || {})) {
        rangePages[p] = (rangePages[p] || 0) + count
      }
      for (const [proj, b] of Object.entries(dayEntry.projectsBandwidth || {})) {
        rangeProjectsBandwidth[proj] = (rangeProjectsBandwidth[proj] || 0) + b
      }
    }
  }

  // Project Breakdown
  const projectBreakdown = Object.entries(rangeProjects)
    .map(([slug, count]) => {
      const bBytes = rangeProjectsBandwidth[slug] || 0
      return {
        slug,
        name: totalsData.projects?.[slug]?.name || slug,
        streams: count,
        bandwidthBytes: bBytes,
        bandwidthFormatted: formatBytes(bBytes),
        percentage: rangeStreams > 0 ? Math.round((count / rangeStreams) * 100) : 0,
      }
    })
    .sort((a, b) => b.streams - a.streams)

  // Track Breakdown
  const trackBreakdown = Object.entries(rangeTracks)
    .map(([name, count]) => ({
      name,
      streams: count,
      percentage: rangeStreams > 0 ? Math.round((count / rangeStreams) * 100) : 0,
    }))
    .sort((a, b) => b.streams - a.streams)
    .slice(0, 15)

  // Page Breakdown
  const pageBreakdown = Object.entries(rangePages)
    .map(([p, count]) => ({
      path: p,
      visits: count,
      percentage: rangePageViews > 0 ? Math.round((count / rangePageViews) * 100) : 0,
    }))
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 15)

  const topProject = projectBreakdown[0] || null
  const topTrack = trackBreakdown[0] || null

  return {
    range,
    summary: {
      totalStreams: range === 'all' ? totalsData.totalStreams || rangeStreams : rangeStreams,
      totalPageViews:
        range === 'all' ? totalsData.totalPageViews || rangePageViews : rangePageViews,
      totalBandwidthBytes:
        range === 'all' ? totalsData.totalBandwidthBytes || rangeBandwidth : rangeBandwidth,
      totalBandwidthFormatted: formatBytes(
        range === 'all' ? totalsData.totalBandwidthBytes || rangeBandwidth : rangeBandwidth,
      ),
      audioBandwidthBytes:
        range === 'all'
          ? totalsData.totalBandwidthAudioBytes || rangeAudioBandwidth
          : rangeAudioBandwidth,
      audioBandwidthFormatted: formatBytes(
        range === 'all'
          ? totalsData.totalBandwidthAudioBytes || rangeAudioBandwidth
          : rangeAudioBandwidth,
      ),
      mediaBandwidthBytes:
        range === 'all'
          ? totalsData.totalBandwidthMediaBytes || rangeMediaBandwidth
          : rangeMediaBandwidth,
      mediaBandwidthFormatted: formatBytes(
        range === 'all'
          ? totalsData.totalBandwidthMediaBytes || rangeMediaBandwidth
          : rangeMediaBandwidth,
      ),
      topProjectName: topProject?.name || 'None',
      topProjectStreams: topProject?.streams || 0,
      topTrackName: topTrack?.name || 'None',
      topTrackStreams: topTrack?.streams || 0,
      firstTrackedDate: totalsData.firstTrackedDate || null,
      lastTrackedDate: totalsData.lastTrackedDate || null,
    },
    fidelity,
    timeline,
    projectBreakdown,
    trackBreakdown,
    pageBreakdown,
    recentEvents: eventsList.slice(0, 30),
  }
}

/**
 * Resets/clears all analytics data after backing up existing files
 *
 * @returns {boolean}
 */
export function clearAnalyticsData() {
  try {
    const analyticsDir = getAnalyticsDir()
    const dailyPath = path.join(analyticsDir, 'daily.json')
    const eventsPath = path.join(analyticsDir, 'events.json')
    const totalsPath = path.join(analyticsDir, 'totals.json')

    // Create backups
    if (fs.existsSync(dailyPath)) createRollingBackup(dailyPath, 'analytics-daily')
    if (fs.existsSync(eventsPath)) createRollingBackup(eventsPath, 'analytics-events')
    if (fs.existsSync(totalsPath)) createRollingBackup(totalsPath, 'analytics-totals')

    // Reset files atomically
    atomicWriteJson(dailyPath, {})
    atomicWriteJson(eventsPath, [])
    atomicWriteJson(totalsPath, {
      totalPageViews: 0,
      totalStreams: 0,
      totalBandwidthBytes: 0,
      totalBandwidthAudioBytes: 0,
      totalBandwidthMediaBytes: 0,
      projects: {},
      tracks: {},
      pages: {},
      projectsBandwidth: {},
      firstTrackedDate: getTodayDateString(),
      lastTrackedDate: getTodayDateString(),
    })

    bandwidthBuffer = {
      audioBytes: 0,
      mediaBytes: 0,
      projectBytes: {},
    }

    return true
  } catch (err) {
    console.error('Error clearing analytics data:', err)
    return false
  }
}
