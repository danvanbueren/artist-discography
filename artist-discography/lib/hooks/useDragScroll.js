'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'

/**
 * Custom hook providing smooth mouse drag scrolling and wheel-to-horizontal scrolling
 * for scrollable containers (navbars, pill lists, platform button groups).
 * Uses a callback ref (also mirrored to `.ref.current`) and ref-backed dragging state
 * so pointer movement never triggers React re-renders.
 */
export function useDragScroll() {
  const [node, setNode] = useState(null)
  const nodeRef = useRef(null)
  const isDraggingRef = useRef(false)
  const startXRef = useRef(0)
  const scrollLeftRef = useRef(0)
  const hasDraggedRef = useRef(false)

  const ref = useMemo(() => {
    const callbackRef = (el) => {
      callbackRef.current = el
      nodeRef.current = el
      setNode(el)
    }
    callbackRef.current = null
    return callbackRef
  }, [])

  const applyDragStyles = useCallback((dragging) => {
    const el = nodeRef.current
    if (!el) return
    el.style.cursor = dragging ? 'grabbing' : ''
    el.style.userSelect = dragging ? 'none' : ''
  }, [])

  const onMouseDown = useCallback(
    (e) => {
      const el = nodeRef.current
      if (!el) return
      isDraggingRef.current = true
      hasDraggedRef.current = false
      startXRef.current = e.pageX - el.offsetLeft
      scrollLeftRef.current = el.scrollLeft
      applyDragStyles(true)
    },
    [applyDragStyles],
  )

  const stopDragging = useCallback(() => {
    if (!isDraggingRef.current) return
    isDraggingRef.current = false
    applyDragStyles(false)
  }, [applyDragStyles])

  const onMouseMove = useCallback((e) => {
    const el = nodeRef.current
    if (!isDraggingRef.current || !el) return
    const x = e.pageX - el.offsetLeft
    const walk = (x - startXRef.current) * 1.5
    if (Math.abs(walk) > 4) {
      hasDraggedRef.current = true
    }
    el.scrollLeft = scrollLeftRef.current - walk
  }, [])

  useEffect(() => {
    if (!node) return

    const handleWheel = (e) => {
      if (e.deltaY !== 0 && node.scrollWidth > node.clientWidth) {
        e.preventDefault()
        node.scrollLeft += e.deltaY * 1.2
      }
    }

    node.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      node.removeEventListener('wheel', handleWheel)
    }
  }, [node])

  return {
    ref,
    isDragging: false,
    hasDraggedRef,
    bind: {
      onMouseDown,
      onMouseLeave: stopDragging,
      onMouseUp: stopDragging,
      onMouseMove,
    },
  }
}
