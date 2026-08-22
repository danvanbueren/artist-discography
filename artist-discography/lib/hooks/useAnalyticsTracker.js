'use client'

import { useEffect, useRef } from 'react'

const lastStreamedCache = new Map()
let lastPagePath = ''
let lastPageTime = 0

/**
 * Sends an analytics event to /api/analytics/track using sendBeacon or keepalive fetch
 *
 * @param {Object} payload
 */
function sendAnalyticsPayload(payload) {
  if (typeof window === 'undefined') return

  try {
    const data = JSON.stringify(payload)
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([data], { type: 'application/json' })
      const queued = navigator.sendBeacon('/api/analytics/track', blob)
      if (queued) return
    }
  } catch {}

  try {
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {})
  } catch {}
}

/**
 * Triggers a page view event with client-side deduplication (5s window)
 *
 * @param {Object} [params]
 * @param {string} [params.path]
 * @param {string} [params.referrer]
 */
export function trackPageView({ path: customPath, referrer: customReferrer } = {}) {
  if (typeof window === 'undefined') return

  const path = customPath || window.location.pathname || '/'
  // Exclude admin panel views from public page analytics
  if (path.startsWith('/sys/admin')) return

  const now = Date.now()
  if (path === lastPagePath && now - lastPageTime < 5000) {
    return
  }

  lastPagePath = path
  lastPageTime = now

  let referrer = customReferrer
  if (!referrer && typeof document !== 'undefined' && document.referrer) {
    try {
      const refUrl = new URL(document.referrer)
      if (refUrl.hostname !== window.location.hostname) {
        referrer = refUrl.hostname
      }
    } catch {}
  }

  sendAnalyticsPayload({
    type: 'pageview',
    path,
    referrer: referrer || 'direct',
  })
}

/**
 * Triggers an audio stream event with client-side deduplication (30s cooldown per track)
 *
 * @param {Object} params
 * @param {string} params.project
 * @param {string} [params.projectSlug]
 * @param {string} params.track
 * @param {string} [params.path]
 */
export function trackStreamEvent({ project = '', projectSlug = '', track = '', path = '' }) {
  if (typeof window === 'undefined' || !track) return

  const trackKey = `${project}::${track}`.toLowerCase()
  const now = Date.now()
  const lastTime = lastStreamedCache.get(trackKey) || 0

  if (now - lastTime < 30000) {
    return
  }

  lastStreamedCache.set(trackKey, now)

  // Clean old cache entries
  if (lastStreamedCache.size > 100) {
    for (const [k, t] of lastStreamedCache.entries()) {
      if (now - t > 60000) lastStreamedCache.delete(k)
    }
  }

  sendAnalyticsPayload({
    type: 'stream',
    project,
    projectSlug,
    track,
    path: path || window.location.pathname || '/',
  })
}

/**
 * React hook to automatically record page view analytics on client route transitions
 *
 * @param {string} currentPath
 * @param {boolean} [enabled=true]
 */
export function useAnalyticsTracker(currentPath = '/', enabled = true) {
  const isFirstMountRef = useRef(true)

  useEffect(() => {
    if (!enabled) return

    if (isFirstMountRef.current) {
      isFirstMountRef.current = false
      trackPageView({ path: currentPath })
      return
    }

    trackPageView({ path: currentPath })
  }, [currentPath, enabled])
}
