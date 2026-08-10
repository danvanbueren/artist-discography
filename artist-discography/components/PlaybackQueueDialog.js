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
import QueueMusicRoundedIcon from '@mui/icons-material/QueueMusicRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import DragIndicatorRoundedIcon from '@mui/icons-material/DragIndicatorRounded'

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
  const [dragOverItem, setDragOverItem] = useState(null) // { listType: 'queue'|'autoplay', index: number }

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
    if (!dragOverItem || dragOverItem.listType !== listType || dragOverItem.index !== index) {
      setDragOverItem({ listType, index })
    }
  }

  const handleDragLeave = (e, listType, index) => {
    e.stopPropagation()
    if (dragOverItem && dragOverItem.listType === listType && dragOverItem.index === index) {
      setDragOverItem(null)
    }
  }

  const handleDrop = (e, targetListType, targetIndex) => {
    e.preventDefault()
    e.stopPropagation()
    if (draggedItem && onQueueDragDrop) {
      onQueueDragDrop({
        fromList: draggedItem.listType,
        fromIndex: draggedItem.index,
        toList: targetListType,
        toIndex: targetIndex,
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
          <QueueMusicRoundedIcon color="primary" />
          <Typography variant="h6" fontWeight={800}>
            Playback Queue
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

      <DialogContent dividers sx={{ p: 2, maxHeight: '60vh' }}>

        {/* SECTION 1: QUEUE */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={700} color="primary.main" sx={{ mb: 1 }}>
            Queue ({manualQueue.length})
          </Typography>

          {manualQueue.length === 0 ? (
            <Paper
              variant="outlined"
              onDragOver={(e) => { e.preventDefault(); setDragOverItem({ listType: 'queue', index: 0 }) }}
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
              <Typography variant="body2" color="text.secondary" fontStyle="italic">
                No tracks in queue. Click &quot;+ Queue&quot; on any track or drag a track here.
              </Typography>
            </Paper>
          ) : (
            <List disablePadding sx={{ maxHeight: 220, overflowY: 'auto' }}>
              {manualQueue.map((item, idx) => (
                <ListItem
                  key={idx}
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, 'queue', idx)}
                  onDragOver={(e) => handleDragOver(e, 'queue', idx)}
                  onDragLeave={(e) => handleDragLeave(e, 'queue', idx)}
                  onDrop={(e) => handleDrop(e, 'queue', idx)}
                  onDragEnd={handleDragEnd}
                  sx={{
                    borderRadius: 2,
                    mb: 1,
                    py: 1,
                    px: 1.5,
                    cursor: 'grab',
                    WebkitUserDrag: 'element',
                    userSelect: 'none',
                    transition: 'all 0.15s ease',
                    opacity: draggedItem?.listType === 'queue' && draggedItem?.index === idx ? 0.4 : 1,
                    bgcolor: dragOverItem?.listType === 'queue' && dragOverItem?.index === idx
                      ? alpha(theme.palette.primary.main, 0.15)
                      : 'action.hover',
                    border: dragOverItem?.listType === 'queue' && dragOverItem?.index === idx
                      ? `1px dashed ${theme.palette.primary.main}`
                      : '1px solid transparent',
                    '&:hover': { bgcolor: 'action.selected' },
                    '&:active': { cursor: 'grabbing' },
                  }}
                  secondaryAction={
                    <IconButton
                      size="small"
                      onClick={() => { if (onRemoveFromManualQueue) onRemoveFromManualQueue(idx) }}
                    >
                      <DeleteOutlineRoundedIcon fontSize="small" />
                    </IconButton>
                  }
                >
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
                  <ListItemText
                    primary={item.track?.name || `Track ${idx + 1}`}
                    secondary={item.project?.name || item.track?.artist || 'Artist'}
                    slotProps={{
                      primary: { variant: 'body1', fontWeight: 600, noWrap: true },
                      secondary: { variant: 'caption', noWrap: true },
                    }}
                    onClick={() => {
                      if (onPlayQueuedTrack) onPlayQueuedTrack(item, idx, true)
                      onClose()
                    }}
                    sx={{ cursor: 'pointer' }}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* SECTION 2: AUTOPLAY */}
        <Box>
          <Typography variant="subtitle1" fontWeight={700} color="text.secondary" sx={{ mb: 1 }}>
            Autoplay
          </Typography>

          {autoplayTracks.length === 0 ? (
            <Paper
              variant="outlined"
              onDragOver={(e) => { e.preventDefault(); setDragOverItem({ listType: 'autoplay', index: 0 }) }}
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
            <List disablePadding sx={{ maxHeight: 220, overflowY: 'auto' }}>
              {autoplayTracks.map((item, idx) => (
                <ListItem
                  key={idx}
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, 'autoplay', idx)}
                  onDragOver={(e) => handleDragOver(e, 'autoplay', idx)}
                  onDragLeave={(e) => handleDragLeave(e, 'autoplay', idx)}
                  onDrop={(e) => handleDrop(e, 'autoplay', idx)}
                  onDragEnd={handleDragEnd}
                  sx={{
                    borderRadius: 2,
                    mb: 0.75,
                    py: 0.75,
                    px: 1.5,
                    cursor: 'grab',
                    WebkitUserDrag: 'element',
                    userSelect: 'none',
                    transition: 'all 0.15s ease',
                    opacity: draggedItem?.listType === 'autoplay' && draggedItem?.index === idx ? 0.4 : 1,
                    bgcolor: dragOverItem?.listType === 'autoplay' && dragOverItem?.index === idx
                      ? alpha(theme.palette.primary.main, 0.15)
                      : 'action.hover',
                    border: dragOverItem?.listType === 'autoplay' && dragOverItem?.index === idx
                      ? `1px dashed ${theme.palette.primary.main}`
                      : '1px solid transparent',
                    '&:hover': { bgcolor: 'action.selected' },
                    '&:active': { cursor: 'grabbing' },
                  }}
                  secondaryAction={
                    <IconButton
                      size="small"
                      onClick={() => { if (onRemoveFromAutoplay) onRemoveFromAutoplay(idx) }}
                    >
                      <DeleteOutlineRoundedIcon fontSize="small" />
                    </IconButton>
                  }
                >
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
                  <ListItemText
                    primary={item.track?.name || `Track ${idx + 1}`}
                    secondary={item.project?.name || item.track?.artist || 'Artist'}
                    slotProps={{
                      primary: { variant: 'body1', fontWeight: 600, noWrap: true },
                      secondary: { variant: 'caption', noWrap: true },
                    }}
                    onClick={() => {
                      if (onPlayQueuedTrack) onPlayQueuedTrack(item, idx, false)
                      onClose()
                    }}
                    sx={{ cursor: 'pointer' }}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Box>

      </DialogContent>
    </Dialog>
  )
}
