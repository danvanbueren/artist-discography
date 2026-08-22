import { getCookie, setCookie } from '../data/cookies'

export const QUALITY_TIERS = {
  LOW: '128k',
  HIGH: '320k',
  LOSSLESS: 'lossless',
}

export const QUALITY_TIER_CONFIG = {
  '128k': {
    id: '128k',
    label: 'Compressed (128 kbps)',
    bitrateLabel: '128 kbps',
    description: 'Minimal data usage, fastest loading on cellular or constrained networks.',
  },
  '320k': {
    id: '320k',
    label: 'High Quality',
    bitrateLabel: '320 kbps',
    description: 'Recommended. Perceptually transparent fidelity with instant buffering.',
  },
  lossless: {
    id: 'lossless',
    label: 'Lossless FLAC',
    bitrateLabel: 'Lossless',
    description: 'Bit-perfect studio master audio. Recommended for fast Wi-Fi / broadband.',
  },
}

/**
 * Retrieves saved audio quality preference from cookies/localStorage.
 * @returns {string|null}
 */
export function getSavedAudioQuality() {
  if (typeof window === 'undefined') return null
  try {
    const saved = getCookie('audio_quality_tier') || localStorage.getItem('audio_quality_tier')
    if (
      saved &&
      (saved === '128k' || saved === '192k' || saved === '320k' || saved === 'lossless')
    ) {
      return saved === '192k' ? '320k' : saved
    }
  } catch {}
  return null
}

/**
 * Saves user audio quality preference to cookies & localStorage.
 * @param {'128k'|'320k'|'lossless'} tier
 */
export function saveAudioQuality(tier) {
  if (typeof window === 'undefined') return
  try {
    setCookie('audio_quality_tier', tier)
    localStorage.setItem('audio_quality_tier', tier)
  } catch {}
}

/**
 * Measures network performance and determines recommended initial audio quality tier.
 * If the user has already saved a quality preference, returns the saved preference immediately.
 *
 * @returns {Promise<'128k'|'320k'|'lossless'>}
 */
export async function detectInitialAudioQuality() {
  const saved = getSavedAudioQuality()
  if (saved) return saved

  if (typeof window === 'undefined') return QUALITY_TIERS.HIGH

  // 1. Check NetworkInformation API if supported
  if (navigator.connection) {
    const conn = navigator.connection
    if (conn.saveData || conn.effectiveType === '2g' || conn.effectiveType === 'slow-2g') {
      return QUALITY_TIERS.LOW
    }
    if (conn.effectiveType === '3g') {
      return QUALITY_TIERS.LOW
    }
  }

  // 2. Perform a lightweight network probe to measure round-trip latency & speed
  try {
    const probeUrl = `/api/logo?w=48&fmt=webp&_t=${Date.now()}`
    const startTime = performance.now()
    const response = await fetch(probeUrl, {
      cache: 'no-store',
      priority: 'high',
    })
    const blob = await response.blob()
    const durationMs = performance.now() - startTime

    if (blob.size > 0 && durationMs > 0) {
      // Calculate speed in kbps: (bytes * 8) / (seconds * 1000)
      const speedKbps = (blob.size * 8) / (durationMs / 1000)

      // Over 6 Mbps and latency under 120ms -> Lossless
      if (speedKbps > 6000 && durationMs < 120) {
        return QUALITY_TIERS.LOSSLESS
      }
      // Over 1.5 Mbps -> High Quality 320k
      if (speedKbps > 1500) {
        return QUALITY_TIERS.HIGH
      }
      return QUALITY_TIERS.LOW
    }
  } catch {
    // Probe failed or offline, fallback to safe high quality 320k
  }

  return QUALITY_TIERS.HIGH
}
