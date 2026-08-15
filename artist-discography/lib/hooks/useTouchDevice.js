'use client'

import { useState, useEffect } from 'react'

/**
 * Hook to detect whether the user is interacting via touch or mouse.
 * Returns true if touch interaction is detected / touch-primary device, false for mouse.
 */
export function useTouchDevice() {
  const [isTouch, setIsTouch] = useState(false)

  useEffect(() => {
    // 1. Initial capability check
    const checkInitial = () => {
      if (typeof window === 'undefined') return false
      return (
        window.matchMedia('(pointer: coarse)').matches ||
        'ontouchstart' in window ||
        Boolean(navigator.maxTouchPoints && navigator.maxTouchPoints > 0)
      )
    }

    setIsTouch(checkInitial())

    // 2. Active pointer/touch listeners for dynamic switching (e.g. 2-in-1 laptops, dev tools)
    const handlePointerDown = (e) => {
      if (e.pointerType === 'touch') {
        setIsTouch(true)
      } else if (e.pointerType === 'mouse' || e.pointerType === 'pen') {
        setIsTouch(false)
      }
    }

    const handleTouchStart = () => {
      setIsTouch(true)
    }

    const handleMouseMove = (e) => {
      // Ignore simulated mouse events that have 0 movement
      if (e.movementX !== 0 || e.movementY !== 0) {
        setIsTouch(false)
      }
    }

    window.addEventListener('pointerdown', handlePointerDown, { passive: true })
    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('mousemove', handleMouseMove, { passive: true })

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  return isTouch
}
