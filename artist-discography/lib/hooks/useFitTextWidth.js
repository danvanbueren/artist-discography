'use client'

import { useState, useRef, useEffect, useMemo } from 'react'

/**
 * Calculates rendered text pixel width at a 100px base font size using an off-screen HTML5 Canvas.
 *
 * @param {string} text - Target text
 * @returns {number} Width in pixels
 */
export function getTextWidthAt100px(text) {
  if (typeof window === 'undefined' || !text) return (text?.length || 0) * 58
  try {
    if (!getTextWidthAt100px.canvas) {
      getTextWidthAt100px.canvas = document.createElement('canvas')
    }
    const ctx = getTextWidthAt100px.canvas.getContext('2d')
    if (!ctx) return text.length * 58
    ctx.font = '800 100px Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    return ctx.measureText(text).width || text.length * 58
  } catch {
    return (text?.length || 0) * 58
  }
}

/**
 * Custom hook to calculate responsive logo and font dimensions to fill container width without wrapping.
 *
 * @param {Object} params
 * @param {string} params.name - Artist or header title
 * @param {number} [params.aspectRatio=1.0] - Logo image aspect ratio
 * @returns {{
 *   containerRef: React.RefObject<HTMLDivElement>,
 *   dimensions: { logoHeight: number, logoWidth: number, fontSize: number, gap: number, isFullWidth: boolean } | null
 * }}
 */
export function useFitTextWidth({ name = '', aspectRatio = 1.0 } = {}) {
  const containerRef = useRef(null)
  const [containerWidth, setContainerWidth] = useState(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    let rafId = null

    const updateWidth = () => {
      const w = el.clientWidth || 0
      if (w > 0) {
        setContainerWidth((prev) => (prev === w ? prev : w))
      }
    }

    const handleResize = () => {
      if (rafId !== null) return
      rafId = window.requestAnimationFrame(() => {
        rafId = null
        updateWidth()
      })
    }

    updateWidth()

    let resizeObserver = null
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(handleResize)
      resizeObserver.observe(el)
    }

    window.addEventListener('resize', handleResize, { passive: true })

    return () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId)
      }
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  const dimensions = useMemo(() => {
    if (!containerWidth || containerWidth <= 0) return null

    const W = containerWidth
    const ar = aspectRatio && !isNaN(aspectRatio) && aspectRatio > 0 ? aspectRatio : 1.0

    const text = name || 'Artist'
    const textWidthAt100 = getTextWidthAt100px(text)
    const textRatio = textWidthAt100 / 100

    // Proportion constants
    const kf = 0.6 // font size to logo height ratio
    const kg = 0.14 // gap to logo height ratio

    // Breakpoint-specific bounds
    let hMax, hMin, fMax, fMin, gapMax, gapMin
    if (W >= 800) {
      // Desktop
      hMax = 180
      hMin = 64
      fMax = 100
      fMin = 30
      gapMax = 28
      gapMin = 14
    } else if (W >= 540) {
      // Tablet
      hMax = 130
      hMin = 50
      fMax = 72
      fMin = 24
      gapMax = 20
      gapMin = 10
    } else {
      // Mobile
      hMax = 95
      hMin = 40
      fMax = 54
      fMin = 19
      gapMax = 14
      gapMin = 8
    }

    // Solve for target height: W = H * ar + H * kg + (H * kf) * textRatio = H * (ar + kg + kf * textRatio)
    const divisor = Math.max(0.5, ar + kg + kf * textRatio)
    const hTarget = W / divisor

    // Clamp height and font size
    const logoHeight = Math.round(Math.max(hMin, Math.min(hMax, hTarget)))
    const logoWidth = Math.round(logoHeight * ar)
    const rawFontSize = Math.round(logoHeight * kf)
    const fontSize = Math.round(Math.max(fMin, Math.min(fMax, rawFontSize)))
    const rawGap = Math.round(logoHeight * kg)
    const gap = Math.round(Math.max(gapMin, Math.min(gapMax, rawGap)))

    // Estimated total content width at calculated scale
    const estimatedTotalWidth = logoWidth + gap + Math.round(fontSize * textRatio)
    const isFullWidth = estimatedTotalWidth >= W - 10

    return {
      logoHeight,
      logoWidth,
      fontSize,
      gap,
      isFullWidth,
    }
  }, [containerWidth, aspectRatio, name])

  return {
    containerRef,
    dimensions,
  }
}
