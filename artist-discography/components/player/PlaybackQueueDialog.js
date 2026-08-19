'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded'
import QueueMusicRoundedIcon from '@mui/icons-material/QueueMusicRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import DragIndicatorRoundedIcon from '@mui/icons-material/DragIndicatorRounded'
import MusicNoteRoundedIcon from '@mui/icons-material/MusicNoteRounded'
import ProgressiveImage from '../common/ProgressiveImage'
import { useTouchDevice } from '../../lib/hooks/useTouchDevice'

export default function PlaybackQueueDialog({
  open,
  onClose,
  manualQueue = [],
  autoplayTracks = [],
  onQueueDragDrop,
  onRemoveFromManualQueue,
  onRemoveFromAutoplay,
  onPlayQueuedTrack,
}) {
  const isTouch = useTouchDevice()
  const contentRef = useRef(null)

  // Drag-and-drop state — fully local to this dialog
  const [draggedItem, setDraggedItem] = useState(null) // { listType: 'queue'|'autoplay', index: number }
  const [dragOverItem, setDragOverItem] = useState(null) // { listType: 'queue'|'autoplay', targetIndex: number, itemIndex: number, position: 'top'|'bottom' }

  // Refs for touch dragging and auto-scrolling without stale closures
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

  // Auto-scroll loop when dragging near top/bottom boundary
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
  }, [])

  const checkAndTriggerAutoScroll = useCallback((clientY) => {
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
  }, [autoScrollLoop, stopAutoScroll])

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

  const handleDragLeave = (e, listType, index) => {
    e.stopPropagation()
    if (dragOverItem && dragOverItem.listType === listType && dragOverItem.itemIndex === index) {
      setDragOverItem(null)
    }
  }

  const handleDrop = (e, targetListType, fallbackIndex) => {
    e.preventDefault()
    e.stopPropagation()
    stopAutoScroll()
    if (draggedItem && onQueueDragDrop) {
      const toIndex = dragOverItem && dragOverItem.listType === targetListType
        ? dragOverItem.targetIndex
        : fallbackIndex
      onQueueDragDrop({
        fromList: draggedItem.listType,
        fromIndex: draggedItem.index,
        toList: targetListType,
        toIndex: toIndex,
      })
    }
    setDraggedItem(null)
    setDragOverItem(null)
  }

  const handleDragEnd = (e) => {
    if (e && e.stopPropagation) e.stopPropagation()
    stopAutoScroll()
    setDraggedItem(null)
    setDragOverItem(null)
  }

  const renderInsertionLine = () => (
    <Box
      sx={{
        position: 'absolute',
        left: 4,
        right: 4,
        height: 3,
        bgcolor: 'primary.main',
        borderRadius: 1.5,
        boxShadow: '0 0 8px rgba(25, 118, 210, 0.85)',
        zIndex: 10,
        pointerEvents: 'none',
        '&::before, &::after': {
          content: '""',
          position: 'absolute',
          top: -2.5,
          width: 8,
          height: 8,
          borderRadius: '50%',
          bgcolor: 'primary.main',
          boxShadow: '0 0 8px rgba(25, 118, 210, 0.85)',
        },
        '&::before': { left: -4 },
        '&::after': { right: -4 },
      }}
    />
  )

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 4,
            p: 1,
            maxHeight: '80vh',
            bgcolor: 'background.paper',
            backgroundImage: 'none',
            boxShadow: '0 24px 48px rgba(0, 0, 0, 0.4)',
            border: '1px solid',
            borderColor: 'divider',
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          m: 0,
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Stack
          direction="row"
          spacing={1.5}
          sx={{ alignItems: 'center' }}
        >
          <QueueMusicRoundedIcon sx={{ color: 'common.white' }} />
          <Typography variant="h6" fontWeight={800}>
            Queue
          </Typography>
        </Stack>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ color: 'text.secondary' }}
        >
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent
        ref={contentRef}
        sx={{
          p: 2,
          maxHeight: '80vh',
          overflowY: 'auto',
        }}
      >

        {/* SECTION 1: QUEUE */}
        <Box sx={{ mb: 3 }} data-queue-section="queue">
          <Typography variant="subtitle1" fontWeight={700} color="primary.main" sx={{ mb: 1 }}>
            Queue ({manualQueue.length})
          </Typography>

          {manualQueue.length === 0 ? (
            <Paper
              variant="outlined"
              onDragOver={(e) => {
                e.preventDefault()
                checkAndTriggerAutoScroll(e.clientY)
                setDragOverItem({ listType: 'queue', targetIndex: 0, itemIndex: 0, position: 'top' })
              }}
              onDrop={(e) => handleDrop(e, 'queue', 0)}
              sx={{
                p: 3,
                textAlign: 'center',
                borderRadius: 2,
                bgcolor: 'action.hover',
                borderStyle: dragOverItem?.listType === 'queue' ? 'dashed' : 'solid',
                borderColor: dragOverItem?.listType === 'queue' ? 'primary.main' : 'divider',
              }}
            >
              <Typography
                variant="body2"
                color="text.secondary"
                fontStyle="italic"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                  gap: 0.5,
                }}
              >
                No tracks in queue. Click
                <QueueMusicRoundedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                on any track or drag a track here.
              </Typography>
            </Paper>
          ) : (
            <List
              disablePadding
              onDragOver={(e) => handleListDragOver(e, 'queue')}
              onDrop={(e) => handleDrop(e, 'queue', manualQueue.length)}
            >
              {manualQueue.map((item, idx) => {
                const showTopLine =
                  dragOverItem?.listType === 'queue' &&
                  dragOverItem?.itemIndex === idx &&
                  dragOverItem?.position === 'top'
                const showBottomLine =
                  dragOverItem?.listType === 'queue' &&
                  dragOverItem?.itemIndex === idx &&
                  dragOverItem?.position === 'bottom'

                const isCurrentlyDragged =
                  draggedItem?.listType === 'queue' && draggedItem?.index === idx

                return (
                  <ListItem
                    key={idx}
                    data-list-type="queue"
                    data-item-index={idx}
                    draggable={!isTouch}
                    onDragStart={(e) => handleDragStart(e, 'queue', idx)}
                    onDragOver={(e) => handleDragOver(e, 'queue', idx)}
                    onDragLeave={(e) => handleDragLeave(e, 'queue', idx)}
                    onDrop={(e) => handleDrop(e, 'queue', idx)}
                    onDragEnd={handleDragEnd}
                    onClick={() => {
                      if (isTouch) {
                        if (onPlayQueuedTrack) onPlayQueuedTrack(item, idx, true)
                        onClose()
                      }
                    }}
                    sx={{
                      position: 'relative',
                      borderRadius: 2,
                      mb: 1,
                      py: 1,
                      pl: 1.5,
                      pr: isTouch ? '52px' : '88px',
                      cursor: isTouch ? 'pointer' : 'grab',
                      WebkitUserDrag: isTouch ? 'none' : 'element',
                      userSelect: 'none',
                      touchAction: 'pan-y',
                      transition: 'background-color 0.15s ease, opacity 0.15s ease',
                      opacity: isCurrentlyDragged ? 0.4 : 1,
                      bgcolor: 'action.hover',
                      border: '1px solid transparent',
                      '&:hover': { bgcolor: 'action.selected' },
                      '&:active': {
                        bgcolor: 'action.selected',
                        cursor: isTouch ? 'pointer' : 'grabbing',
                      },
                    }}
                    secondaryAction={
                      <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                        {!isTouch && (
                          <IconButton
                            size="small"
                            color="primary"
                            title="Play Track"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (onPlayQueuedTrack) onPlayQueuedTrack(item, idx, true)
                              onClose()
                            }}
                            sx={{
                              '&:hover': {
                                bgcolor: 'action.selected',
                                transform: 'scale(1.12)',
                              },
                            }}
                          >
                            <PlayArrowRoundedIcon fontSize="small" />
                          </IconButton>
                        )}
                        <IconButton
                          size="small"
                          title="Remove from Queue"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (onRemoveFromManualQueue) onRemoveFromManualQueue(idx)
                          }}
                        >
                          <DeleteOutlineRoundedIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    }
                  >
                    {showTopLine && (
                      <Box sx={{ position: 'absolute', top: -2, left: 0, right: 0 }}>
                        {renderInsertionLine()}
                      </Box>
                    )}
                    {showBottomLine && (
                      <Box sx={{ position: 'absolute', bottom: -2, left: 0, right: 0 }}>
                        {renderInsertionLine()}
                      </Box>
                    )}
                    <Box
                      onTouchStart={(e) => handleTouchDragStart(e, 'queue', idx)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 1.5,
                        color: 'text.secondary',
                        cursor: 'grab',
                        userSelect: 'none',
                        touchAction: 'none',
                        p: 0.5,
                        m: -0.5,
                        borderRadius: 1,
                        '&:active': { color: 'primary.main' },
                      }}
                    >
                      <DragIndicatorRoundedIcon />
                    </Box>
                    {(() => {
                      const coverUrl = item.track?.cover || item.track?.projectCover || item.project?.cover || item.project?.image || ''
                      return (
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 1.5,
                            bgcolor: 'action.hover',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mr: 1.5,
                            flexShrink: 0,
                            overflow: 'hidden',
                            border: '1px solid',
                            borderColor: 'divider',
                          }}
                        >
                          {coverUrl ? (
                            <ProgressiveImage
                              src={coverUrl}
                              alt={item.track?.name || 'Cover'}
                              targetWidth={80}
                              placeholderWidth={24}
                              sx={{ width: '100%', height: '100%' }}
                            />
                          ) : (
                            <MusicNoteRoundedIcon fontSize="small" sx={{ color: 'text.secondary', opacity: 0.7 }} />
                          )}
                        </Box>
                      )
                    })()}
                    <ListItemText
                      primary={item.track?.name || `Track ${idx + 1}`}
                      secondary={
                        (() => {
                          const projName = item.project?.name || item.track?.project || ''
                          const artistName = item.track?.artist || item.project?.artist || ''
                          if (projName && artistName) return `${projName} • ${artistName}`
                          return projName || artistName || 'Artist'
                        })()
                      }
                      slotProps={{
                        primary: {
                          variant: 'body1',
                          fontWeight: 600,
                          noWrap: true,
                          sx: {
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            display: 'block',
                          },
                        },
                        secondary: {
                          variant: 'caption',
                          noWrap: true,
                          sx: {
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            display: 'block',
                          },
                        },
                      }}
                      sx={{
                        minWidth: 0,
                        overflow: 'hidden',
                        my: 0,
                        mr: 1,
                      }}
                    />
                  </ListItem>
                )
              })}
            </List>
          )}
        </Box>

        {/* SECTION 2: AUTOPLAY */}
        <Box data-queue-section="autoplay">
          <Typography variant="subtitle1" fontWeight={700} color="text.secondary" sx={{ mb: 1 }}>
            Autoplay
          </Typography>

          {autoplayTracks.length === 0 ? (
            <Paper
              variant="outlined"
              onDragOver={(e) => {
                e.preventDefault()
                checkAndTriggerAutoScroll(e.clientY)
                setDragOverItem({ listType: 'autoplay', targetIndex: 0, itemIndex: 0, position: 'top' })
              }}
              onDrop={(e) => handleDrop(e, 'autoplay', 0)}
              sx={{
                p: 2,
                textAlign: 'center',
                borderRadius: 2,
                bgcolor: 'action.hover',
                borderStyle: dragOverItem?.listType === 'autoplay' ? 'dashed' : 'solid',
                borderColor: dragOverItem?.listType === 'autoplay' ? 'primary.main' : 'divider',
              }}
            >
              <Typography variant="body2" color="text.secondary" fontStyle="italic">
                No upcoming autoplay tracks. Drag a track here.
              </Typography>
            </Paper>
          ) : (
            <List
              disablePadding
              onDragOver={(e) => handleListDragOver(e, 'autoplay')}
              onDrop={(e) => handleDrop(e, 'autoplay', autoplayTracks.length)}
            >
              {autoplayTracks.map((item, idx) => {
                const showTopLine =
                  dragOverItem?.listType === 'autoplay' &&
                  dragOverItem?.itemIndex === idx &&
                  dragOverItem?.position === 'top'
                const showBottomLine =
                  dragOverItem?.listType === 'autoplay' &&
                  dragOverItem?.itemIndex === idx &&
                  dragOverItem?.position === 'bottom'

                const isCurrentlyDragged =
                  draggedItem?.listType === 'autoplay' && draggedItem?.index === idx

                return (
                  <ListItem
                    key={idx}
                    data-list-type="autoplay"
                    data-item-index={idx}
                    draggable={!isTouch}
                    onDragStart={(e) => handleDragStart(e, 'autoplay', idx)}
                    onDragOver={(e) => handleDragOver(e, 'autoplay', idx)}
                    onDragLeave={(e) => handleDragLeave(e, 'autoplay', idx)}
                    onDrop={(e) => handleDrop(e, 'autoplay', idx)}
                    onDragEnd={handleDragEnd}
                    onClick={() => {
                      if (isTouch) {
                        if (onPlayQueuedTrack) onPlayQueuedTrack(item, idx, false)
                        onClose()
                      }
                    }}
                    sx={{
                      position: 'relative',
                      borderRadius: 2,
                      mb: 0.75,
                      py: 0.75,
                      pl: 1.5,
                      pr: isTouch ? '52px' : '88px',
                      cursor: isTouch ? 'pointer' : 'grab',
                      WebkitUserDrag: isTouch ? 'none' : 'element',
                      userSelect: 'none',
                      touchAction: 'pan-y',
                      transition: 'background-color 0.15s ease, opacity 0.15s ease',
                      opacity: isCurrentlyDragged ? 0.4 : 1,
                      bgcolor: 'action.hover',
                      border: '1px solid transparent',
                      '&:hover': { bgcolor: 'action.selected' },
                      '&:active': {
                        bgcolor: 'action.selected',
                        cursor: isTouch ? 'pointer' : 'grabbing',
                      },
                    }}
                    secondaryAction={
                      <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                        {!isTouch && (
                          <IconButton
                            size="small"
                            color="primary"
                            title="Play Track"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (onPlayQueuedTrack) onPlayQueuedTrack(item, idx, false)
                              onClose()
                            }}
                            sx={{
                              '&:hover': {
                                bgcolor: 'action.selected',
                                transform: 'scale(1.12)',
                              },
                            }}
                          >
                            <PlayArrowRoundedIcon fontSize="small" />
                          </IconButton>
                        )}
                        <IconButton
                          size="small"
                          title="Remove from Autoplay"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (onRemoveFromAutoplay) onRemoveFromAutoplay(idx)
                          }}
                        >
                          <DeleteOutlineRoundedIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    }
                  >
                    {showTopLine && (
                      <Box sx={{ position: 'absolute', top: -2, left: 0, right: 0 }}>
                        {renderInsertionLine()}
                      </Box>
                    )}
                    {showBottomLine && (
                      <Box sx={{ position: 'absolute', bottom: -2, left: 0, right: 0 }}>
                        {renderInsertionLine()}
                      </Box>
                    )}
                    <Box
                      onTouchStart={(e) => handleTouchDragStart(e, 'autoplay', idx)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 1.5,
                        color: 'text.secondary',
                        cursor: 'grab',
                        userSelect: 'none',
                        touchAction: 'none',
                        p: 0.5,
                        m: -0.5,
                        borderRadius: 1,
                        '&:active': { color: 'primary.main' },
                      }}
                    >
                      <DragIndicatorRoundedIcon />
                    </Box>
                    {(() => {
                      const coverUrl = item.track?.cover || item.track?.projectCover || item.project?.cover || item.project?.image || ''
                      return (
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 1.5,
                            bgcolor: 'action.hover',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mr: 1.5,
                            flexShrink: 0,
                            overflow: 'hidden',
                            border: '1px solid',
                            borderColor: 'divider',
                          }}
                        >
                          {coverUrl ? (
                            <ProgressiveImage
                              src={coverUrl}
                              alt={item.track?.name || 'Cover'}
                              targetWidth={80}
                              placeholderWidth={24}
                              sx={{ width: '100%', height: '100%' }}
                            />
                          ) : (
                            <MusicNoteRoundedIcon fontSize="small" sx={{ color: 'text.secondary', opacity: 0.7 }} />
                          )}
                        </Box>
                      )
                    })()}
                    <ListItemText
                      primary={item.track?.name || `Track ${idx + 1}`}
                      secondary={
                        (() => {
                          const projName = item.project?.name || item.track?.project || ''
                          const artistName = item.track?.artist || item.project?.artist || ''
                          if (projName && artistName) return `${projName} • ${artistName}`
                          return projName || artistName || 'Artist'
                        })()
                      }
                      slotProps={{
                        primary: {
                          variant: 'body1',
                          fontWeight: 600,
                          noWrap: true,
                          sx: {
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            display: 'block',
                          },
                        },
                        secondary: {
                          variant: 'caption',
                          noWrap: true,
                          sx: {
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            display: 'block',
                          },
                        },
                      }}
                      sx={{
                        minWidth: 0,
                        overflow: 'hidden',
                        my: 0,
                        mr: 1,
                      }}
                    />
                  </ListItem>
                )
              })}
            </List>
          )}
        </Box>

      </DialogContent>
    </Dialog>
  )
}
