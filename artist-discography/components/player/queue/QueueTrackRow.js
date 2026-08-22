'use client'

import { Box, ListItem, ListItemText, Typography, IconButton, Stack } from '@mui/material'
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import DragIndicatorRoundedIcon from '@mui/icons-material/DragIndicatorRounded'
import MusicNoteRoundedIcon from '@mui/icons-material/MusicNoteRounded'
import ProgressiveImage from '@/components/ui/ProgressiveImage'

/**
 * Insertion indicator line when dragging tracks.
 */
function InsertionIndicator() {
  return (
    <Box
      sx={{
        width: '100%',
        height: '3px',
        bgcolor: 'primary.main',
        borderRadius: '2px',
        boxShadow: '0 0 10px rgba(25, 118, 210, 0.9)',
        position: 'relative',
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
}

/**
 * Single queued track row supporting touch drag handles and desktop HTML5 drag/drop.
 *
 * @param {Object} props
 * @param {Object} props.item - Queue item object
 * @param {number} props.index - Index in the section list
 * @param {'queue'|'autoplay'} props.listType - List category
 * @param {boolean} props.isTouch - Touch device status
 * @param {boolean} props.isCurrentlyDragged - Whether this row is actively being dragged
 * @param {boolean} props.showTopLine - Display top drop indicator
 * @param {boolean} props.showBottomLine - Display bottom drop indicator
 * @param {Function} props.onPlayQueuedTrack - Play track trigger
 * @param {Function} props.onRemove - Remove item trigger
 * @param {Function} props.onCloseDialog - Close dialog callback
 * @param {Function} props.onTouchDragStart - Touch drag initiator
 * @param {Function} props.onDragStart - HTML5 drag start handler
 * @param {Function} props.onDragOver - HTML5 drag over handler
 * @param {Function} props.onDragLeave - HTML5 drag leave handler
 * @param {Function} props.onDrop - HTML5 drop handler
 * @param {Function} props.onDragEnd - HTML5 drag end handler
 */
export default function QueueTrackRow({
  item,
  index,
  listType,
  isTouch,
  isCurrentlyDragged,
  showTopLine,
  showBottomLine,
  onPlayQueuedTrack,
  onRemove,
  onCloseDialog,
  onTouchDragStart,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
}) {
  const isQueueType = listType === 'queue'
  const isDirectTrack = Boolean(item.audioUrl || (item.name && !item.track))
  const trackObj = isDirectTrack ? item : item.track || {}
  const projectName = isDirectTrack
    ? item.project || 'Project'
    : item.project?.name || item.project || 'Project'
  const artistName = trackObj.artist || item.projectArtist || 'Artist'
  const coverUrl =
    item.project?.cover || item.track?.cover || trackObj.projectCover || trackObj.cover

  const handleRowClick = () => {
    if (isTouch) {
      if (onPlayQueuedTrack) onPlayQueuedTrack(item, index, isQueueType)
      if (onCloseDialog) onCloseDialog()
    }
  }

  const handlePlayClick = (e) => {
    e.stopPropagation()
    if (onPlayQueuedTrack) onPlayQueuedTrack(item, index, isQueueType)
    if (onCloseDialog) onCloseDialog()
  }

  const handleRemoveClick = (e) => {
    e.stopPropagation()
    if (onRemove) onRemove(index)
  }

  return (
    <ListItem
      data-list-type={listType}
      data-item-index={index}
      draggable={!isTouch}
      onDragStart={(e) => onDragStart(e, listType, index)}
      onDragOver={(e) => onDragOver(e, listType, index)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, listType)}
      onDragEnd={onDragEnd}
      onClick={handleRowClick}
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
        <Stack direction='row' spacing={0.5} sx={{ alignItems: 'center' }}>
          {!isTouch && (
            <IconButton
              size='small'
              color='primary'
              title='Play Track'
              onClick={handlePlayClick}
              sx={{
                '&:hover': {
                  bgcolor: 'action.selected',
                  transform: 'scale(1.12)',
                },
              }}
            >
              <PlayArrowRoundedIcon fontSize='small' />
            </IconButton>
          )}
          <IconButton
            size='small'
            title={isQueueType ? 'Remove from Queue' : 'Remove from Autoplay'}
            onClick={handleRemoveClick}
          >
            <DeleteOutlineRoundedIcon fontSize='small' />
          </IconButton>
        </Stack>
      }
    >
      {showTopLine && (
        <Box sx={{ position: 'absolute', top: -2, left: 0, right: 0 }}>
          <InsertionIndicator />
        </Box>
      )}
      {showBottomLine && (
        <Box sx={{ position: 'absolute', bottom: -2, left: 0, right: 0 }}>
          <InsertionIndicator />
        </Box>
      )}

      {/* Drag handle */}
      <Box
        onTouchStart={(e) => onTouchDragStart(e, listType, index)}
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

      {/* Artwork thumbnail */}
      <Box
        sx={{
          width: 44,
          height: 44,
          aspectRatio: '1 / 1',
          borderRadius: 1.5,
          bgcolor: 'rgba(255, 255, 255, 0.08)',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mr: 1.5,
          flexShrink: 0,
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {coverUrl ? (
          <ProgressiveImage
            src={coverUrl}
            alt={trackObj.name || projectName}
            targetWidth={120}
            placeholderWidth={32}
            quality={75}
            sx={{
              width: '100%',
              height: '100%',
            }}
          />
        ) : (
          <MusicNoteRoundedIcon sx={{ fontSize: 22, color: 'text.secondary' }} />
        )}
      </Box>

      {/* Track info text */}
      <ListItemText
        primary={
          <Typography
            variant='body2'
            sx={{
              fontWeight: 700,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              color: 'text.primary',
            }}
          >
            {trackObj.name || 'Untitled Track'}
          </Typography>
        }
        secondary={
          <Typography
            variant='caption'
            sx={{
              color: 'text.secondary',
              display: 'block',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {artistName} • {projectName}
          </Typography>
        }
      />
    </ListItem>
  )
}
