'use client'

import { useState, useEffect } from 'react'

const DEFAULT_FALLBACK_COLORS = [
  'hsl(220, 12%, 35%)',
  'hsl(220, 10%, 55%)',
  'hsl(220, 14%, 25%)',
  'hsl(220, 8%, 65%)',
  'hsl(220, 10%, 45%)',
]

const VIBRANT_PALETTE_CACHE = new Map()
const IN_FLIGHT_COLOR_PROMISES = new Map()

const DEFAULT_PALETTE_STATE = {
  colors: DEFAULT_FALLBACK_COLORS,
  isMonochrome: false,
  avgSaturation: 0,
  isLoaded: false,
}

/**
 * Downscales internal media URLs to a 48px WebP thumbnail for fast palette sampling.
 *
 * @param {string} url - Candidate image URL
 * @returns {string} Normalized thumbnail URL
 */
function normalizeSamplingUrl(url) {
  if (!url || typeof url !== 'string') return ''
  if (url.startsWith('data:') || url.startsWith('blob:')) return url
  if (
    url.startsWith('/api/media') ||
    url.startsWith('/api/logo') ||
    url.startsWith('/api/icon') ||
    url.startsWith('/api/og') ||
    url.startsWith('/api/background')
  ) {
    if (/[?&]w=\d+/.test(url)) return url
    const separator = url.includes('?') ? '&' : '?'
    return `${url}${separator}w=48&q=20&fmt=webp`
  }
  return url
}

function getCachedVibrantPalette(imageSrc) {
  if (!imageSrc) {
    return {
      colors: DEFAULT_FALLBACK_COLORS,
      isMonochrome: false,
      avgSaturation: 0,
      isLoaded: true,
    }
  }
  if (VIBRANT_PALETTE_CACHE.has(imageSrc)) {
    return VIBRANT_PALETTE_CACHE.get(imageSrc)
  }
  if (typeof window !== 'undefined') {
    try {
      const stored = sessionStorage.getItem(`vibrant_palette_v2_${imageSrc}`)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed && Array.isArray(parsed.colors) && parsed.isLoaded) {
          VIBRANT_PALETTE_CACHE.set(imageSrc, parsed)
          return parsed
        }
      }
    } catch {}
  }
  return DEFAULT_PALETTE_STATE
}

function saveCachedVibrantPalette(imageSrc, data) {
  if (!imageSrc || !data) return
  VIBRANT_PALETTE_CACHE.set(imageSrc, data)
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(`vibrant_palette_v2_${imageSrc}`, JSON.stringify(data))
    } catch {}
  }
}

function buildFallbackPalette() {
  return {
    colors: DEFAULT_FALLBACK_COLORS,
    isMonochrome: false,
    avgSaturation: 0,
    isLoaded: true,
  }
}

function extractPaletteFromImage(img) {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return buildFallbackPalette()

  const width = 32
  const height = Math.max(1, Math.round((img.height / img.width) * width))
  canvas.width = width
  canvas.height = height

  ctx.drawImage(img, 0, 0, width, height)
  const data = ctx.getImageData(0, 0, width, height).data

  const allPixels = []
  let totalSat = 0
  let opaqueCount = 0

  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3]
    if (a < 50) continue

    const rNorm = data[i] / 255
    const gNorm = data[i + 1] / 255
    const bNorm = data[i + 2] / 255

    const max = Math.max(rNorm, gNorm, bNorm)
    const min = Math.min(rNorm, gNorm, bNorm)
    const d = max - min

    let h = 0
    let s = 0
    const l = (max + min) / 2

    if (d !== 0) {
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      switch (max) {
        case rNorm:
          h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0)
          break
        case gNorm:
          h = (bNorm - rNorm) / d + 2
          break
        case bNorm:
          h = (rNorm - gNorm) / d + 4
          break
      }
      h /= 6
    }

    const hueDeg = Math.round(h * 360)
    const satPct = Math.round(s * 100)
    const lightPct = Math.round(l * 100)

    totalSat += satPct
    opaqueCount++

    if (lightPct >= 5 && lightPct <= 95) {
      allPixels.push({ h: hueDeg, s: satPct, l: lightPct })
    }
  }

  if (opaqueCount === 0) return buildFallbackPalette()

  const avgSat = Math.round(totalSat / opaqueCount)
  const isMonochrome = avgSat < 20
  const selected = []

  if (isMonochrome) {
    const sortedByLightness = [...allPixels].sort((a, b) => b.l - a.l)
    const step = Math.max(1, Math.floor(sortedByLightness.length / 5))
    for (let i = 0; i < 5; i++) {
      const sample = sortedByLightness[Math.min(i * step, sortedByLightness.length - 1)] || {
        h: 0,
        s: 0,
        l: 50,
      }
      selected.push({
        h: sample.h,
        s: Math.min(sample.s, 10),
        l: Math.min(75, Math.max(20, sample.l)),
      })
    }
  } else {
    const colorful = allPixels.filter((p) => p.s >= 15)
    colorful.sort((a, b) => b.s * 1.5 + (50 - Math.abs(b.l - 50)) - (a.s * 1.5 + (50 - Math.abs(a.l - 50))))

    const minHueDiff = 25
    for (const sample of colorful) {
      if (selected.length >= 5) break
      const isFarEnough = selected.every((sel) => {
        const diff = Math.abs(sel.h - sample.h)
        return Math.min(diff, 360 - diff) >= minHueDiff
      })
      if (isFarEnough || selected.length === 0) {
        selected.push({
          h: sample.h,
          s: sample.s,
          l: Math.min(75, Math.max(25, sample.l)),
        })
      }
    }

    if (selected.length < 5 && selected.length > 0) {
      const baseCount = selected.length
      let idx = 0
      while (selected.length < 5) {
        const base = selected[idx % baseCount]
        const lightMod = (selected.length % 2 === 0 ? 18 : -18) + idx * 4
        selected.push({
          h: base.h,
          s: base.s,
          l: Math.min(78, Math.max(22, base.l + lightMod)),
        })
        idx++
      }
    }
  }

  const finalColors =
    selected.length >= 3
      ? selected.slice(0, 5).map((c) => `hsl(${c.h}, ${c.s}%, ${c.l}%)`)
      : DEFAULT_FALLBACK_COLORS

  return {
    colors: finalColors,
    isMonochrome,
    avgSaturation: avgSat,
    isLoaded: true,
  }
}

function sampleVibrantPalette(imageSrc) {
  if (IN_FLIGHT_COLOR_PROMISES.has(imageSrc)) {
    return IN_FLIGHT_COLOR_PROMISES.get(imageSrc)
  }

  const promise = new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'Anonymous'

    img.onload = () => {
      try {
        const result = extractPaletteFromImage(img)
        saveCachedVibrantPalette(imageSrc, result)
        resolve(result)
      } catch {
        resolve(buildFallbackPalette())
      }
    }

    img.onerror = () => {
      resolve(buildFallbackPalette())
    }

    img.src = imageSrc
  }).finally(() => {
    IN_FLIGHT_COLOR_PROMISES.delete(imageSrc)
  })

  IN_FLIGHT_COLOR_PROMISES.set(imageSrc, promise)
  return promise
}

/**
 * Custom hook to analyze an image and sample its true color palette.
 * Deduplicates concurrent image decodes and samples 32px thumbnails.
 *
 * @param {string|null} rawImageSrc - Artwork URL
 * @returns {{ colors: string[], isMonochrome: boolean, avgSaturation: number, isLoaded: boolean }}
 */
export function useVibrantColors(rawImageSrc) {
  const imageSrc = normalizeSamplingUrl(rawImageSrc)
  const [palette, setPalette] = useState(() => getCachedVibrantPalette(imageSrc))

  useEffect(() => {
    if (!imageSrc) {
      setPalette((prev) => {
        if (prev.isLoaded && prev.colors === DEFAULT_FALLBACK_COLORS) return prev
        return buildFallbackPalette()
      })
      return
    }

    const cached = getCachedVibrantPalette(imageSrc)
    if (cached.isLoaded) {
      setPalette((prev) => (prev === cached ? prev : cached))
      return
    }

    let isMounted = true
    sampleVibrantPalette(imageSrc).then((result) => {
      if (!isMounted) return
      setPalette((prev) => {
        const sameColors =
          prev.colors.length === result.colors.length &&
          prev.colors.every((col, i) => col === result.colors[i])
        if (
          sameColors &&
          prev.isMonochrome === result.isMonochrome &&
          prev.avgSaturation === result.avgSaturation &&
          prev.isLoaded === result.isLoaded
        ) {
          return prev
        }
        return result
      })
    })

    return () => {
      isMounted = false
    }
  }, [imageSrc])

  return palette
}
