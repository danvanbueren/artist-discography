'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * Custom hook providing smooth mouse drag scrolling and wheel-to-horizontal scrolling
 * for scrollable containers (navbars, pill lists, platform button groups).
 */
export function useDragScroll() {
  const ref = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const startXRef = useRef(0)
  const scrollLeftRef = useRef(0)
  const hasDraggedRef = useRef(false)

  const onMouseDown = useCallback((e) => {
    if (!ref.current) return
    setIsDragging(true)
    hasDraggedRef.current = false
    startXRef.current = e.pageX - ref.current.offsetLeft
    scrollLeftRef.current = ref.current.scrollLeft
  }, [])

  const onMouseLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const onMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const onMouseMove = useCallback(
    (e) => {
      if (!isDragging || !ref.current) return
      const x = e.pageX - ref.current.offsetLeft
      const walk = (x - startXRef.current) * 1.5
      if (Math.abs(walk) > 4) {
        hasDraggedRef.current = true
      }
      ref.current.scrollLeft = scrollLeftRef.current - walk
    },
    [isDragging],
  )

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const handleWheel = (e) => {
      if (e.deltaY !== 0) {
        if (el.scrollWidth > el.clientWidth) {
          e.preventDefault()
          el.scrollLeft += e.deltaY * 1.2
        }
      }
    }

    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      el.removeEventListener('wheel', handleWheel)
    }
  }, [])

  return {
    ref,
    isDragging,
    hasDraggedRef,
    bind: {
      onMouseDown,
      onMouseLeave,
      onMouseUp,
      onMouseMove,
    },
  }
}
