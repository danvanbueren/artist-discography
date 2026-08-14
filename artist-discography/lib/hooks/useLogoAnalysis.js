'use client'

import { useState, useEffect } from 'react'

/**
 * Custom hook to analyze an image (like an artist logo) for luminance, color saturation, and aspect ratio.
 * Determines if an image is monochrome (flat black/white) and light vs dark.
 */
export function useLogoAnalysis(imageSrc) {
  const [analysis, setAnalysis] = useState({
    isMonochrome: false,
    isLight: false,
    isDark: false,
    aspectRatio: null,
    loaded: false,
  })

  useEffect(() => {
    if (!imageSrc) return

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
          if (isMounted) setAnalysis(a => ({ ...a, aspectRatio, loaded: true }))
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
          if (isMounted) setAnalysis(a => ({ ...a, aspectRatio, loaded: true }))
          return
        }

        const avgLuminance = totalLuminance / opaquePixelCount
        const avgSaturation = totalSaturation / opaquePixelCount

        const isMonochrome = avgSaturation < 32
        const isLight = isMonochrome && avgLuminance > 140
        const isDark = isMonochrome && avgLuminance <= 140

        if (isMounted) {
          setAnalysis({
            isMonochrome,
            isLight,
            isDark,
            aspectRatio,
            loaded: true,
          })
        }
      } catch (err) {
        if (isMounted) {
          setAnalysis({ isMonochrome: false, isLight: false, isDark: false, aspectRatio: null, loaded: true })
        }
      }
    }

    img.onerror = () => {
      if (isMounted) {
        setAnalysis({ isMonochrome: false, isLight: false, isDark: false, aspectRatio: null, loaded: true })
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
