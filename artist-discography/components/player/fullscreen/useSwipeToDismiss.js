'use client'

import { useRef, useCallback } from 'react'

/**
 * Custom hook providing touch handlers for omnidirectional swipe-to-dismiss gesture.
 *
 * @param {Function} [onDismiss] - Callback when swipe gesture exceeds threshold
 * @param {number} [threshold=75] - Minimum swipe distance in pixels to trigger dismiss
 * @returns {{
 *   handleTouchStart: (e: React.TouchEvent) => void,
 *   handleTouchMove: (e: React.TouchEvent) => void,
 *   handleTouchEnd: (e: React.TouchEvent) => void
 * }}
 */
export function useSwipeToDismiss(onDismiss, threshold = 75) {
  const touchStartY = useRef(0)
  const touchStartX = useRef(0)
  const isSwiping = useRef(false)

  const handleTouchStart = useCallback((e) => {
    if (e.touches && e.touches.length === 1) {
      if (e.target && e.target.closest && e.target.closest('.MuiSlider-root')) {
        isSwiping.current = false
        return
      }
      touchStartY.current = e.touches[0].clientY
      touchStartX.current = e.touches[0].clientX
      isSwiping.current = true
    }
  }, [])

  const handleTouchMove = useCallback(() => {
    // Retain gesture tracking
  }, [])

  const handleTouchEnd = useCallback(
    (e) => {
      if (!isSwiping.current) return
      isSwiping.current = false

      if (e.changedTouches && e.changedTouches.length === 1) {
        const endY = e.changedTouches[0].clientY
        const endX = e.changedTouches[0].clientX
        const deltaY = endY - touchStartY.current
        const deltaX = endX - touchStartX.current
        const swipeDistance = Math.hypot(deltaX, deltaY)

        if (swipeDistance > threshold) {
          if (onDismiss) onDismiss()
        }
      }
    },
    [onDismiss, threshold],
  )

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  }
}
