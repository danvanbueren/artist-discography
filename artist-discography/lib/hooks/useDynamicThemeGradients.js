'use client'

import { useMemo } from 'react'
import { useVibrantColors } from './useVibrantColors'
import { usePerformanceMode } from '@/lib/performance/PerformanceModeContext'

function parseHsl(hslStr) {
  const match = hslStr ? hslStr.match(/hsl\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)/i) : null
  if (!match) return { h: 220, s: 15, l: 50 }
  return {
    h: parseInt(match[1], 10),
    s: parseInt(match[2], 10),
    l: parseInt(match[3], 10),
  }
}

/**
 * Custom hook to generate dynamic static text and logo gradient styles
 * derived directly from the artwork image's sampled color palette.
 * Lightness is adaptively adjusted for dark/light themes to guarantee AAA contrast.
 */
export function useDynamicThemeGradients(imageSrc, isDarkMode) {
  const { isLiteMode } = usePerformanceMode()
  const { colors, isMonochrome, isLoaded } = useVibrantColors(imageSrc)

  return useMemo(() => {
    const parsed = colors.map(parseHsl)
    const p1 = parsed[0] || { h: 220, s: 15, l: 50 }
    const p2 = parsed[1] || { h: 220, s: 12, l: 60 }
    const p3 = parsed[2] || { h: 220, s: 10, l: 40 }
    const p4 = parsed[3] || { h: 220, s: 14, l: 55 }

    let primaryColors, secondaryColors, glowColors

    if (isDarkMode) {
      // Dark mode: high lightness (78% - 94%) for crisp contrast against dark background
      const l1 = `hsl(${p1.h}, ${Math.max(35, p1.s)}%, ${Math.min(96, Math.max(82, p1.l + 32))}%)`
      const l2 = `hsl(${p2.h}, ${Math.max(35, p2.s)}%, ${Math.min(94, Math.max(78, p2.l + 28))}%)`
      const l3 = `hsl(${p3.h}, ${Math.max(35, p3.s)}%, ${Math.min(92, Math.max(75, p3.l + 25))}%)`
      const l4 = `hsl(${p4.h}, ${Math.max(35, p4.s)}%, ${Math.min(95, Math.max(80, p4.l + 30))}%)`

      primaryColors = [l1, l2, l3, l4, l1]

      const s1 = `hsl(${p1.h}, ${Math.max(25, p1.s)}%, ${Math.min(90, Math.max(72, p1.l + 22))}%)`
      const s2 = `hsl(${p2.h}, ${Math.max(25, p2.s)}%, ${Math.min(88, Math.max(68, p2.l + 18))}%)`
      const s3 = `hsl(${p3.h}, ${Math.max(25, p3.s)}%, ${Math.min(86, Math.max(65, p3.l + 15))}%)`

      secondaryColors = [s1, s2, s3, s1]

      glowColors = [
        `hsla(${p1.h}, ${Math.max(50, p1.s)}%, 65%, 0.45)`,
        `hsla(${p2.h}, ${Math.max(50, p2.s)}%, 65%, 0.45)`,
        `hsla(${p3.h}, ${Math.max(50, p3.s)}%, 65%, 0.45)`,
      ]
    } else {
      // Light mode: low lightness (10% - 28%) for deep rich contrast against light background
      const d1 = `hsl(${p1.h}, ${Math.max(45, p1.s)}%, ${Math.min(26, Math.max(10, p1.l - 36))}%)`
      const d2 = `hsl(${p2.h}, ${Math.max(45, p2.s)}%, ${Math.min(28, Math.max(12, p2.l - 32))}%)`
      const d3 = `hsl(${p3.h}, ${Math.max(45, p3.s)}%, ${Math.min(30, Math.max(14, p3.l - 28))}%)`
      const d4 = `hsl(${p4.h}, ${Math.max(45, p4.s)}%, ${Math.min(25, Math.max(10, p4.l - 35))}%)`

      primaryColors = [d1, d2, d3, d4, d1]

      const s1 = `hsl(${p1.h}, ${Math.max(35, p1.s)}%, ${Math.min(32, Math.max(16, p1.l - 26))}%)`
      const s2 = `hsl(${p2.h}, ${Math.max(35, p2.s)}%, ${Math.min(34, Math.max(18, p2.l - 24))}%)`
      const s3 = `hsl(${p3.h}, ${Math.max(35, p3.s)}%, ${Math.min(36, Math.max(20, p3.l - 22))}%)`

      secondaryColors = [s1, s2, s3, s1]

      glowColors = [
        `hsla(${p1.h}, ${Math.max(50, p1.s)}%, 28%, 0.30)`,
        `hsla(${p2.h}, ${Math.max(50, p2.s)}%, 28%, 0.30)`,
        `hsla(${p3.h}, ${Math.max(50, p3.s)}%, 28%, 0.30)`,
      ]
    }

    const primaryGradient = `linear-gradient(135deg, ${primaryColors.join(', ')})`
    const secondaryGradient = `linear-gradient(135deg, ${secondaryColors.join(', ')})`

    return {
      primaryTextSx: {
        background: primaryGradient,
        backgroundSize: '100% 100%',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        transition: isLoaded && !isLiteMode ? 'background 0.8s ease-in-out' : 'none',
      },
      secondaryTextSx: {
        background: secondaryGradient,
        backgroundSize: '100% 100%',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        transition: isLoaded && !isLiteMode ? 'background 0.8s ease-in-out' : 'none',
      },
      logoGradientSx: {
        background: primaryGradient,
        backgroundSize: '100% 100%',
        transition: isLoaded && !isLiteMode ? 'background 0.8s ease-in-out' : 'none',
        WebkitMaskImage: 'url(/api/logo?w=640&fmt=webp)',
        maskImage: 'url(/api/logo?w=640&fmt=webp)',
        WebkitMaskSize: 'contain',
        maskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        maskPosition: 'center',
      },
      getLogoFilter: (baseFilter = '', options = {}) => {
        const cleanBase = baseFilter === 'none' ? '' : baseFilter
        if (isLiteMode) {
          const fallbackFilter = options?.isLowContrast
            ? `drop-shadow(0px 1px 4px ${glowColors[0]})`
            : cleanBase.replace(/drop-shadow\([^)]*\)\s*/g, '').trim()
          return {
            filter: fallbackFilter || 'none',
            transition: 'opacity 0.3s ease',
          }
        }
        return {
          filter: `drop-shadow(0px 6px 20px ${glowColors[0]}) ${cleanBase}`.trim(),
        }
      },
      isMonochrome,
    }
  }, [colors, isMonochrome, isLoaded, isDarkMode, isLiteMode])
}
