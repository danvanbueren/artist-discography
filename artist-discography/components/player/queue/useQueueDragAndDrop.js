'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

/**
 * Custom hook managing drag-and-drop state, touch gesture listeners,
 * and boundary auto-scrolling for the playback queue dialog.
 *
 * @param {Object} params
 * @param {boolean} params.open - Dialog visibility
 * @param {Array} params.manualQueue - Manual queue list
 * @param {Array} params.autoplayTracks - Autoplay tracks list
 * @param {Function} [params.onQueueDragDrop] - Drop callback
 * @returns {{
 *   contentRef: React.RefObject<HTMLDivElement>,
 *   draggedItem: Object|null,
 *   dragOverItem: Object|null,
 *   handleTouchDragStart: (e: React.TouchEvent, listType: string, index: number) => void,
 *   handleDragStart: (e: React.DragEvent, listType: string, index: number) => void,
 *   handleDragOver: (e: React.DragEvent, listType: string, index: number) => void,
 *   handleListDragOver: (e: React.DragEvent, listType: string) => void,
 *   handleDragLeave: (e: React.DragEvent) => void,
 *   handleDrop: (e: React.DragEvent, listType: string) => void,
 *   handleDragEnd: () => void
 * }}
 */
export function useQueueDragAndDrop({
  open,
  manualQueue = [],
  autoplayTracks = [],
  onQueueDragDrop,
}) {
  const contentRef = useRef(null)

  const [draggedItem, setDraggedItem] = useState(null)
  const [dragOverItem, setDragOverItem] = useState(null)

  const dragOverItemRef = useRef(null)
  dragOverItemRef.current = dragOverItem

  const touchDragStateRef = useRef({
    active: false,
    fromList: null,
    fromIndex: -1,
  })

  const autoScrollAnimRef = useRef(null)
  const scrollSpeedRef = useRef(0)
  const lastTouchPosRef = useRef(null)

  const stopAutoScroll = useCallback(() => {
    scrollSpeedRef.current = 0
    if (autoScrollAnimRef.current) {
      cancelAnimationFrame(autoScrollAnimRef.current)
      autoScrollAnimRef.current = null
    }
  }, [])

  // Helper to determine drop target from (clientX, clientY) coordinates
  const updateDropTargetFromCoords = useCallback((clientX, clientY) => {
    if (!contentRef.current) return

    const queueContainer = contentRef.current.querySelector('[data-queue-section="queue"]')
    const autoplayContainer = contentRef.current.querySelector('[data-queue-section="autoplay"]')

    const autoplayRect = autoplayContainer?.getBoundingClientRect()
    let targetList = 'queue'
    if (autoplayRect && clientY >= autoplayRect.top) {
      targetList = 'autoplay'
    }

    const listItems = contentRef.current.querySelectorAll(`[data-list-type="${targetList}"]`)
    if (listItems.length === 0) {
      setDragOverItem({ listType: targetList, targetIndex: 0, itemIndex: 0, position: 'top' })
      return
    }

    let found = false
    listItems.forEach((el, index) => {
      const rect = el.getBoundingClientRect()
      if (clientY >= rect.top && clientY <= rect.bottom) {
        const position = clientY < rect.top + rect.height / 2 ? 'top' : 'bottom'
        const targetIndex = position === 'top' ? index : index + 1
        setDragOverItem({ listType: targetList, targetIndex, itemIndex: index, position })
        found = true
      }
    })

    if (!found) {
      const firstRect = listItems[0].getBoundingClientRect()
      const lastRect = listItems[listItems.length - 1].getBoundingClientRect()
      if (clientY < firstRect.top) {
        setDragOverItem({ listType: targetList, targetIndex: 0, itemIndex: 0, position: 'top' })
      } else if (clientY > lastRect.bottom) {
        setDragOverItem({
          listType: targetList,
          targetIndex: listItems.length,
          itemIndex: listItems.length - 1,
          position: 'bottom',
        })
      }
    }
  }, [])

  // Auto-scroll loop when dragging near boundary
  const autoScrollLoop = useCallback(() => {
    if (scrollSpeedRef.current !== 0 && contentRef.current) {
      contentRef.current.scrollTop += scrollSpeedRef.current
      if (lastTouchPosRef.current) {
        updateDropTargetFromCoords(lastTouchPosRef.current.x, lastTouchPosRef.current.y)
      }
      autoScrollAnimRef.current = requestAnimationFrame(autoScrollLoop)
    } else {
      if (autoScrollAnimRef.current) {
        cancelAnimationFrame(autoScrollAnimRef.current)
        autoScrollAnimRef.current = null
      }
    }
  }, [updateDropTargetFromCoords])

  const checkAndTriggerAutoScroll = useCallback(
    (clientY) => {
      if (!contentRef.current) return

      const rect = contentRef.current.getBoundingClientRect()
      const threshold = 64

      if (clientY < rect.top + threshold) {
        const dist = Math.max(0, rect.top + threshold - clientY)
        const ratio = Math.min(1, dist / threshold)
        scrollSpeedRef.current = -Math.round(ratio * 12 + 3)
        if (!autoScrollAnimRef.current) {
          autoScrollAnimRef.current = requestAnimationFrame(autoScrollLoop)
        }
      } else if (clientY > rect.bottom - threshold) {
        const dist = Math.max(0, clientY - (rect.bottom - threshold))
        const ratio = Math.min(1, dist / threshold)
        scrollSpeedRef.current = Math.round(ratio * 12 + 3)
        if (!autoScrollAnimRef.current) {
          autoScrollAnimRef.current = requestAnimationFrame(autoScrollLoop)
        }
      } else {
        stopAutoScroll()
      }
    },
    [autoScrollLoop, stopAutoScroll],
  )

  // Clean up auto scroll on unmount or dialog close
  useEffect(() => {
    if (!open) {
      stopAutoScroll()
      setDraggedItem(null)
      setDragOverItem(null)
    }
    return () => {
      stopAutoScroll()
    }
  }, [open, stopAutoScroll])

  // --- Touch Drag Gesture Handlers ---
  const handleTouchDragStart = (e, listType, index) => {
    const touch = e.touches[0]
    if (!touch) return

    setDraggedItem({ listType, index })
    touchDragStateRef.current = {
      active: true,
      fromList: listType,
      fromIndex: index,
    }
    lastTouchPosRef.current = { x: touch.clientX, y: touch.clientY }
    updateDropTargetFromCoords(touch.clientX, touch.clientY)

    const onTouchMove = (moveEvent) => {
      const t = moveEvent.touches[0]
      if (!t) return
      lastTouchPosRef.current = { x: t.clientX, y: t.clientY }
      updateDropTargetFromCoords(t.clientX, t.clientY)
      checkAndTriggerAutoScroll(t.clientY)
      if (moveEvent.cancelable) {
        moveEvent.preventDefault()
      }
    }

    const onTouchEnd = () => {
      stopAutoScroll()
      const currentDragOver = dragOverItemRef.current
      const fromState = touchDragStateRef.current

      if (fromState.active && onQueueDragDrop) {
        const targetList = currentDragOver?.listType || fromState.fromList
        const fallbackIndex = targetList === 'queue' ? manualQueue.length : autoplayTracks.length
        const toIndex = currentDragOver ? currentDragOver.targetIndex : fallbackIndex

        onQueueDragDrop({
          fromList: fromState.fromList,
          fromIndex: fromState.fromIndex,
          toList: targetList,
          toIndex: toIndex,
        })
      }

      touchDragStateRef.current = { active: false, fromList: null, fromIndex: -1 }
      setDraggedItem(null)
      setDragOverItem(null)

      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('touchcancel', onTouchEnd)
    }

    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onTouchEnd)
    window.addEventListener('touchcancel', onTouchEnd)
  }

  // --- Desktop HTML5 Drag Handlers ---
  const handleDragStart = (e, listType, index) => {
    e.stopPropagation()
    setDraggedItem({ listType, index })
    e.dataTransfer.effectAllowed = 'move'
    try {
      e.dataTransfer.setData('text/plain', JSON.stringify({ listType, index }))
    } catch {}
  }

  const handleDragOver = (e, listType, index) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'move'

    checkAndTriggerAutoScroll(e.clientY)

    const rect = e.currentTarget.getBoundingClientRect()
    const position = e.clientY - rect.top < rect.height / 2 ? 'top' : 'bottom'
    const targetIndex = position === 'top' ? index : index + 1

    if (
      !dragOverItem ||
      dragOverItem.listType !== listType ||
      dragOverItem.itemIndex !== index ||
      dragOverItem.position !== position
    ) {
      setDragOverItem({ listType, targetIndex, itemIndex: index, position })
    }
  }

  const handleListDragOver = (e, listType) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'move'

    checkAndTriggerAutoScroll(e.clientY)

    const listElement = e.currentTarget
    const itemElements = Array.from(listElement.children)

    if (itemElements.length === 0) {
      setDragOverItem({ listType, targetIndex: 0, itemIndex: 0, position: 'top' })
      return
    }

    let closestIndex = 0
    let closestDist = Infinity
    let closestPos = 'top'

    itemElements.forEach((el, index) => {
      const rect = el.getBoundingClientRect()
      const midY = rect.top + rect.height / 2
      const dist = Math.abs(e.clientY - midY)
      if (dist < closestDist) {
        closestDist = dist
        closestIndex = index
        closestPos = e.clientY < midY ? 'top' : 'bottom'
      }
    })

    const targetIndex = closestPos === 'top' ? closestIndex : closestIndex + 1

    if (
      !dragOverItem ||
      dragOverItem.listType !== listType ||
      dragOverItem.itemIndex !== closestIndex ||
      dragOverItem.position !== closestPos
    ) {
      setDragOverItem({ listType, targetIndex, itemIndex: closestIndex, position: closestPos })
    }
  }

  const handleDragLeave = (e) => {
    e.stopPropagation()
  }

  const handleDrop = (e, listType) => {
    e.preventDefault()
    e.stopPropagation()
    stopAutoScroll()

    let source = draggedItem
    if (!source) {
      try {
        const raw = e.dataTransfer.getData('text/plain')
        if (raw) source = JSON.parse(raw)
      } catch {}
    }

    if (!source) {
      setDraggedItem(null)
      setDragOverItem(null)
      return
    }

    const targetList = dragOverItem?.listType || listType
    const fallbackIndex = targetList === 'queue' ? manualQueue.length : autoplayTracks.length
    const toIndex = dragOverItem ? dragOverItem.targetIndex : fallbackIndex

    if (onQueueDragDrop) {
      onQueueDragDrop({
        fromList: source.listType,
        fromIndex: source.index,
        toList: targetList,
        toIndex: toIndex,
      })
    }

    setDraggedItem(null)
    setDragOverItem(null)
  }

  const handleDragEnd = () => {
    stopAutoScroll()
    setDraggedItem(null)
    setDragOverItem(null)
  }

  return {
    contentRef,
    draggedItem,
    dragOverItem,
    handleTouchDragStart,
    handleDragStart,
    handleDragOver,
    handleListDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
  }
}
