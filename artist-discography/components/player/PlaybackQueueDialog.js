'use client'

import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Stack,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import QueueMusicRoundedIcon from '@mui/icons-material/QueueMusicRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import { useTouchDevice } from '@/lib/hooks/useTouchDevice'
import { useQueueDragAndDrop } from './queue/useQueueDragAndDrop'
import QueueSectionList from './queue/QueueSectionList'

/**
 * PlaybackQueueDialog
 * Modal dialog showing active manual queue and upcoming autoplay discography tracks
 * with full touch & desktop drag-and-drop reordering.
 */
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
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isTouch = useTouchDevice()

  const {
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
  } = useQueueDragAndDrop({
    open,
    manualQueue,
    autoplayTracks,
    onQueueDragDrop,
  })

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={isMobile}
      maxWidth='sm'
      fullWidth
      sx={{
        '& .MuiDialog-container': isMobile
          ? {
              height: '100dvh',
              maxHeight: '100dvh',
            }
          : undefined,
      }}
      slotProps={{
        paper: {
          sx: {
            borderRadius: isMobile ? 0 : 4,
            p: isMobile ? 0 : 1,
            height: isMobile ? '100dvh' : 'auto',
            maxHeight: isMobile ? '100dvh' : '85vh',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'background.paper',
            backgroundImage: 'none',
            boxShadow: '0 24px 48px rgba(0, 0, 0, 0.4)',
            border: isMobile ? 'none' : '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          m: 0,
          p: 2,
          pt: isMobile ? 'calc(env(safe-area-inset-top, 0px) + 12px)' : 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <Stack direction='row' spacing={1.5} sx={{ alignItems: 'center' }}>
          <QueueMusicRoundedIcon sx={{ color: 'common.white' }} />
          <Typography variant='h6' sx={{ fontWeight: 800 }}>
            Queue
          </Typography>
        </Stack>
        <IconButton aria-label='close' onClick={onClose} sx={{ color: 'text.secondary' }}>
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent
        ref={contentRef}
        sx={{
          p: 2,
          pb: isMobile ? 'calc(env(safe-area-inset-bottom, 0px) + 32px)' : 2.5,
          flex: '1 1 auto',
          overflowY: 'auto',
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch',
          minHeight: 0,
        }}
      >
        {/* SECTION 1: MANUAL QUEUE */}
        <QueueSectionList
          listType='queue'
          title={`Queue (${manualQueue.length})`}
          items={manualQueue}
          isTouch={isTouch}
          draggedItem={draggedItem}
          dragOverItem={dragOverItem}
          onPlayQueuedTrack={onPlayQueuedTrack}
          onRemove={onRemoveFromManualQueue}
          onCloseDialog={onClose}
          onTouchDragStart={handleTouchDragStart}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onListDragOver={handleListDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onDragEnd={handleDragEnd}
        />

        {/* SECTION 2: AUTOPLAY / UP NEXT */}
        <QueueSectionList
          listType='autoplay'
          title={`Up Next / Autoplay (${autoplayTracks.length})`}
          subtitle='Continuous playback will proceed with these tracks in order. Drag to reorder.'
          items={autoplayTracks}
          isTouch={isTouch}
          draggedItem={draggedItem}
          dragOverItem={dragOverItem}
          onPlayQueuedTrack={onPlayQueuedTrack}
          onRemove={onRemoveFromAutoplay}
          onCloseDialog={onClose}
          onTouchDragStart={handleTouchDragStart}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onListDragOver={handleListDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onDragEnd={handleDragEnd}
        />
      </DialogContent>
    </Dialog>
  )
}
