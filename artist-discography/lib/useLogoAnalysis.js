'use client'

import { useState, useEffect } from 'react'

/**
 * Custom hook to analyze an image (like an artist logo) for luminance and color saturation.
 * Determines if an image is monochrome (flat black/white) and light vs dark.
 */
export function useLogoAnalysis(imageSrc) {
  const [analysis, setAnalysis] = useState({
    isMonochrome: false,
    isLight: false,
    isDark: false,
    loaded: false,
  })

  useEffect(() => {
    if (!imageSrc) return

    let isMounted = true
    const img = new Image()
    img.crossOrigin = 'Anonymous'

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Scale down image for fast pixel sampling
        const width = 64
        const height = Math.max(1, Math.round((img.height / img.width) * width))
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

          // Ignore transparent / semi-transparent pixels
          if (a > 30) {
            opaquePixelCount++
            // Perceived luminance formula
            const luminance = 0.299 * r + 0.587 * g + 0.114 * b
            totalLuminance += luminance

            // Color saturation / difference between max and min RGB channels
            const max = Math.max(r, g, b)
            const min = Math.min(r, g, b)
            totalSaturation += max - min
          }
        }

        if (opaquePixelCount === 0) return

        const avgLuminance = totalLuminance / opaquePixelCount
        const avgSaturation = totalSaturation / opaquePixelCount

        // Low saturation (< 32) indicates a flat black, white, or greyscale logo
        const isMonochrome = avgSaturation < 32
        const isLight = isMonochrome && avgLuminance > 140
        const isDark = isMonochrome && avgLuminance <= 140

        if (isMounted) {
          setAnalysis({
            isMonochrome,
            isLight,
            isDark,
            loaded: true,
          })
        }
      } catch (err) {
        // Fallback gracefully if canvas sampling fails
        if (isMounted) {
          setAnalysis({ isMonochrome: false, isLight: false, isDark: false, loaded: true })
        }
      }
    }

    img.onerror = () => {
      if (isMounted) {
        setAnalysis({ isMonochrome: false, isLight: false, isDark: false, loaded: true })
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
  if (!analysis || !analysis.isMonochrome) {
    return false
  }
  // Overlay gradient triggers when:
  // - White/light logo in light mode
  // - Black/dark logo in dark mode
  return (analysis.isLight && !isDarkMode) || (analysis.isDark && isDarkMode)
}

/**
 * Helper to compute CSS filter based on logo analysis and current theme mode
 */
export function getLogoFilter(analysis, isDarkMode, baseFilter = 'drop-shadow(0px 6px 16px rgba(0,0,0,0.3))') {
  if (!analysis || !analysis.isMonochrome) {
    return baseFilter
  }

  // White/light monochrome logo in light mode -> Invert to black
  if (analysis.isLight && !isDarkMode) {
    return `invert(1) ${baseFilter}`
  }

  // Black/dark monochrome logo in dark mode -> Invert to white
  if (analysis.isDark && isDarkMode) {
    return `invert(1) ${baseFilter}`
  }

  return baseFilter
}
