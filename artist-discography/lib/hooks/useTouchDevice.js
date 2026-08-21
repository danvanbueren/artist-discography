'use client'

import { useState, useEffect } from 'react'

let isTouchDevice = false
let isInitialized = false
const listeners = new Set()

function checkCapabilities() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(pointer: coarse)').matches ||
    'ontouchstart' in window ||
    Boolean(navigator.maxTouchPoints && navigator.maxTouchPoints > 0)
  )
}

function initGlobalListeners() {
  if (typeof window === 'undefined' || isInitialized) return
  isInitialized = true
  isTouchDevice = checkCapabilities()

  const setTouch = (val) => {
    if (isTouchDevice !== val) {
      isTouchDevice = val
      listeners.forEach((fn) => fn(val))
    }
  }

  window.addEventListener(
    'pointerdown',
    (e) => {
      if (e.pointerType === 'touch') setTouch(true)
      else if (e.pointerType === 'mouse' || e.pointerType === 'pen') setTouch(false)
    },
    { passive: true },
  )

  window.addEventListener('touchstart', () => setTouch(true), { passive: true })
  window.addEventListener(
    'mousemove',
    (e) => {
      if (e.movementX !== 0 || e.movementY !== 0) setTouch(false)
    },
    { passive: true },
  )
}

/**
 * Hook to detect whether the user is interacting via touch or mouse.
 * Returns true if touch interaction is detected / touch-primary device, false for mouse.
 */
export function useTouchDevice() {
  const [isTouch, setIsTouch] = useState(() => {
    if (!isInitialized && typeof window !== 'undefined') {
      initGlobalListeners()
    }
    return isTouchDevice
  })

  useEffect(() => {
    initGlobalListeners()
    listeners.add(setIsTouch)
    return () => {
      listeners.delete(setIsTouch)
    }
  }, [])

  return isTouch
}
