'use client'

import { useState, useEffect } from 'react'

const LOGO_ANALYSIS_CACHE = new Map()

const DEFAULT_LOGO_ANALYSIS = {
  isMonochrome: false,
  isLight: false,
  isDark: false,
  aspectRatio: null,
  loaded: false,
}

function getCachedLogoAnalysis(imageSrc) {
  if (!imageSrc) return DEFAULT_LOGO_ANALYSIS
  if (LOGO_ANALYSIS_CACHE.has(imageSrc)) {
    return LOGO_ANALYSIS_CACHE.get(imageSrc)
  }
  if (typeof window !== 'undefined') {
    try {
      const stored = sessionStorage.getItem(`logo_analysis_${imageSrc}`)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed && typeof parsed === 'object' && parsed.loaded) {
          LOGO_ANALYSIS_CACHE.set(imageSrc, parsed)
          return parsed
        }
      }
    } catch {}
  }
  return DEFAULT_LOGO_ANALYSIS
}

function saveCachedLogoAnalysis(imageSrc, data) {
  if (!imageSrc || !data) return
  LOGO_ANALYSIS_CACHE.set(imageSrc, data)
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(`logo_analysis_${imageSrc}`, JSON.stringify(data))
    } catch {}
  }
}

/**
 * Custom hook to analyze an image (like an artist logo) for luminance, color saturation, and aspect ratio.
 * Determines if an image is monochrome (flat black/white) and light vs dark.
 */
export function useLogoAnalysis(imageSrc) {
  const [analysis, setAnalysis] = useState(() => getCachedLogoAnalysis(imageSrc))

  useEffect(() => {
    if (!imageSrc) return

    const cached = getCachedLogoAnalysis(imageSrc)
    if (cached.loaded) {
      setAnalysis(cached)
      return
    }

    let isMounted = true
    const img = new Image()
    img.crossOrigin = 'Anonymous'

    img.onload = () => {
      try {
        const naturalWidth = img.naturalWidth || img.width || 100
        const naturalHeight = img.naturalHeight || img.height || 50
        const aspectRatio = naturalWidth / naturalHeight

        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          const fallbackData = { isMonochrome: false, isLight: false, isDark: false, aspectRatio, loaded: true }
          saveCachedLogoAnalysis(imageSrc, fallbackData)
          if (isMounted) setAnalysis(fallbackData)
          return
        }

        const width = 64
        const height = Math.max(1, Math.round((naturalHeight / naturalWidth) * width))
        canvas.width = width
        canvas.height = height

        ctx.drawImage(img, 0, 0, width, height)
        const imageData = ctx.getImageData(0, 0, width, height)
        const data = imageData.data

        let totalLuminance = 0
        let totalSaturation = 0
        let opaquePixelCount = 0

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]
          const a = data[i + 3]

          if (a > 30) {
            opaquePixelCount++
            const luminance = 0.299 * r + 0.587 * g + 0.114 * b
            totalLuminance += luminance
            const max = Math.max(r, g, b)
            const min = Math.min(r, g, b)
            totalSaturation += max - min
          }
        }

        if (opaquePixelCount === 0) {
          const fallbackData = { isMonochrome: false, isLight: false, isDark: false, aspectRatio, loaded: true }
          saveCachedLogoAnalysis(imageSrc, fallbackData)
          if (isMounted) setAnalysis(fallbackData)
          return
        }

        const avgLuminance = totalLuminance / opaquePixelCount
        const avgSaturation = totalSaturation / opaquePixelCount

        const isMonochrome = avgSaturation < 32
        const isLight = isMonochrome && avgLuminance > 140
        const isDark = isMonochrome && avgLuminance <= 140

        const result = {
          isMonochrome,
          isLight,
          isDark,
          aspectRatio,
          loaded: true,
        }

        saveCachedLogoAnalysis(imageSrc, result)
        if (isMounted) {
          setAnalysis(result)
        }
      } catch (err) {
        const errorResult = { isMonochrome: false, isLight: false, isDark: false, aspectRatio: null, loaded: true }
        saveCachedLogoAnalysis(imageSrc, errorResult)
        if (isMounted) {
          setAnalysis(errorResult)
        }
      }
    }

    img.onerror = () => {
      const errorResult = { isMonochrome: false, isLight: false, isDark: false, aspectRatio: null, loaded: true }
      saveCachedLogoAnalysis(imageSrc, errorResult)
      if (isMounted) {
        setAnalysis(errorResult)
      }
    }

    img.src = imageSrc

    return () => {
      isMounted = false
    }
  }, [imageSrc])

  return analysis
}

/**
 * Helper to determine if the logo should be masked with the hero text gradient
 */
export function shouldApplyLogoGradient(analysis, isDarkMode) {
  if (!analysis || !analysis.loaded) {
    return true
  }
  if (analysis.isMonochrome) {
    return true
  }
  return false
}

/**
 * Helper to compute CSS filter based on logo analysis and current theme mode
 */
export function getLogoFilter(analysis, isDarkMode, baseFilter = 'drop-shadow(0px 6px 16px rgba(0,0,0,0.3))') {
  const cleanBase = baseFilter === 'none' ? '' : baseFilter

  if (!analysis || !analysis.loaded) {
    return !isDarkMode ? `invert(1) ${cleanBase}`.trim() : (cleanBase || 'none')
  }

  if (!analysis.isMonochrome) {
    return cleanBase || 'none'
  }

  if (analysis.isLight && !isDarkMode) {
    return `invert(1) ${cleanBase}`.trim()
  }

  if (analysis.isDark && isDarkMode) {
    return `invert(1) ${cleanBase}`.trim()
  }

  return cleanBase || 'none'
}
