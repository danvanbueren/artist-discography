'use client'

import { useState } from 'react'
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Typography,
  useTheme,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded'
import QueueMusicRoundedIcon from '@mui/icons-material/QueueMusicRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import DragIndicatorRoundedIcon from '@mui/icons-material/DragIndicatorRounded'
import MusicNoteRoundedIcon from '@mui/icons-material/MusicNoteRounded'

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
  const theme = useTheme()

  // Drag-and-drop state — fully local to this dialog
  const [draggedItem, setDraggedItem] = useState(null) // { listType: 'queue'|'autoplay', index: number }
  const [dragOverItem, setDragOverItem] = useState(null) // { listType: 'queue'|'autoplay', targetIndex: number, itemIndex: number, position: 'top'|'bottom' }

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

      <DialogContent sx={{ p: 2, maxHeight: '80vh', overflowY: 'auto' }}>

        {/* SECTION 1: QUEUE */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={700} color="primary.main" sx={{ mb: 1 }}>
            Queue ({manualQueue.length})
          </Typography>

          {manualQueue.length === 0 ? (
            <Paper
              variant="outlined"
              onDragOver={(e) => {
                e.preventDefault()
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

                return (
                  <ListItem
                    key={idx}
                    draggable={true}
                    onDragStart={(e) => handleDragStart(e, 'queue', idx)}
                    onDragOver={(e) => handleDragOver(e, 'queue', idx)}
                    onDragLeave={(e) => handleDragLeave(e, 'queue', idx)}
                    onDrop={(e) => handleDrop(e, 'queue', idx)}
                    onDragEnd={handleDragEnd}
                    sx={{
                      position: 'relative',
                      borderRadius: 2,
                      mb: 1,
                      py: 1,
                      px: 1.5,
                      cursor: 'grab',
                      WebkitUserDrag: 'element',
                      userSelect: 'none',
                      transition: 'background-color 0.15s ease, opacity 0.15s ease',
                      opacity: draggedItem?.listType === 'queue' && draggedItem?.index === idx ? 0.4 : 1,
                      bgcolor: 'action.hover',
                      border: '1px solid transparent',
                      '&:hover': { bgcolor: 'action.selected' },
                      '&:active': { cursor: 'grabbing' },
                    }}
                    secondaryAction={
                      <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
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
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        mr: 1.5,
                        color: 'text.secondary',
                        cursor: 'grab',
                        userSelect: 'none',
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
                            <Box
                              component="img"
                              src={coverUrl}
                              alt={item.track?.name || 'Cover'}
                              draggable={false}
                              sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
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
                        primary: { variant: 'body1', fontWeight: 600, noWrap: true },
                        secondary: { variant: 'caption', noWrap: true },
                      }}
                    />
                  </ListItem>
                )
              })}
            </List>
          )}
        </Box>

        {/* SECTION 2: AUTOPLAY */}
        <Box>
          <Typography variant="subtitle1" fontWeight={700} color="text.secondary" sx={{ mb: 1 }}>
            Autoplay
          </Typography>

          {autoplayTracks.length === 0 ? (
            <Paper
              variant="outlined"
              onDragOver={(e) => {
                e.preventDefault()
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

                return (
                  <ListItem
                    key={idx}
                    draggable={true}
                    onDragStart={(e) => handleDragStart(e, 'autoplay', idx)}
                    onDragOver={(e) => handleDragOver(e, 'autoplay', idx)}
                    onDragLeave={(e) => handleDragLeave(e, 'autoplay', idx)}
                    onDrop={(e) => handleDrop(e, 'autoplay', idx)}
                    onDragEnd={handleDragEnd}
                    sx={{
                      position: 'relative',
                      borderRadius: 2,
                      mb: 0.75,
                      py: 0.75,
                      px: 1.5,
                      cursor: 'grab',
                      WebkitUserDrag: 'element',
                      userSelect: 'none',
                      transition: 'background-color 0.15s ease, opacity 0.15s ease',
                      opacity: draggedItem?.listType === 'autoplay' && draggedItem?.index === idx ? 0.4 : 1,
                      bgcolor: 'action.hover',
                      border: '1px solid transparent',
                      '&:hover': { bgcolor: 'action.selected' },
                      '&:active': { cursor: 'grabbing' },
                    }}
                    secondaryAction={
                      <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
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
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        mr: 1.5,
                        color: 'text.secondary',
                        cursor: 'grab',
                        userSelect: 'none',
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
                            <Box
                              component="img"
                              src={coverUrl}
                              alt={item.track?.name || 'Cover'}
                              draggable={false}
                              sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
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
                        primary: { variant: 'body1', fontWeight: 600, noWrap: true },
                        secondary: { variant: 'caption', noWrap: true },
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
