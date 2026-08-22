'use client'

import { Box, Typography, Paper, List } from '@mui/material'
import QueueMusicRoundedIcon from '@mui/icons-material/QueueMusicRounded'
import QueueTrackRow from './QueueTrackRow'

/**
 * Section container for either Manual Queue or Autoplay Discography list.
 *
 * @param {Object} props
 * @param {'queue'|'autoplay'} props.listType - List section identifier
 * @param {string} props.title - Header label (e.g. 'Queue (3)' or 'Up Next / Autoplay (12)')
 * @param {string} [props.subtitle] - Optional subtitle note
 * @param {Array} props.items - Track item array
 * @param {boolean} props.isTouch - Touch device state
 * @param {Object|null} props.draggedItem - Currently dragged item reference
 * @param {Object|null} props.dragOverItem - Current drop target indicator state
 * @param {Function} props.onPlayQueuedTrack - Play track trigger
 * @param {Function} props.onRemove - Remove item trigger
 * @param {Function} props.onCloseDialog - Close dialog callback
 * @param {Function} props.onTouchDragStart - Touch drag handler
 * @param {Function} props.onDragStart - HTML5 drag start handler
 * @param {Function} props.onDragOver - HTML5 drag over handler
 * @param {Function} props.onListDragOver - HTML5 list container drag over handler
 * @param {Function} props.onDragLeave - HTML5 drag leave handler
 * @param {Function} props.onDrop - HTML5 drop handler
 * @param {Function} props.onDragEnd - HTML5 drag end handler
 */
export default function QueueSectionList({
  listType,
  title,
  subtitle,
  items = [],
  isTouch,
  draggedItem,
  dragOverItem,
  onPlayQueuedTrack,
  onRemove,
  onCloseDialog,
  onTouchDragStart,
  onDragStart,
  onDragOver,
  onListDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
}) {
  const isQueue = listType === 'queue'
  const isDragOverEmpty = dragOverItem?.listType === listType && items.length === 0

  return (
    <Box sx={{ mb: 3 }} data-queue-section={listType}>
      <Typography
        variant='subtitle1'
        sx={{
          fontWeight: 700,
          color: isQueue ? 'primary.main' : 'text.primary',
          mb: subtitle ? 0.25 : 1,
        }}
      >
        {title}
      </Typography>

      {subtitle && (
        <Typography variant='caption' sx={{ color: 'text.secondary', display: 'block', mb: 1.25 }}>
          {subtitle}
        </Typography>
      )}

      {items.length === 0 ? (
        <Paper
          variant='outlined'
          onDragOver={(e) => {
            e.preventDefault()
            onDragOver(e, listType, 0)
          }}
          onDrop={(e) => onDrop(e, listType)}
          sx={{
            p: 3,
            textAlign: 'center',
            borderRadius: 2,
            bgcolor: 'action.hover',
            borderStyle: isDragOverEmpty ? 'dashed' : 'solid',
            borderColor: isDragOverEmpty ? 'primary.main' : 'divider',
          }}
        >
          <Typography
            variant='body2'
            color='text.secondary'
            fontStyle='italic'
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: 0.5,
            }}
          >
            {isQueue ? (
              <>
                No tracks in queue. Click
                <QueueMusicRoundedIcon fontSize='small' sx={{ color: 'text.secondary' }} />
                on any track or drag a track here.
              </>
            ) : (
              'All tracks in autoplay queue have been played.'
            )}
          </Typography>
        </Paper>
      ) : (
        <List
          disablePadding
          onDragOver={(e) => onListDragOver(e, listType)}
          onDrop={(e) => onDrop(e, listType)}
        >
          {items.map((item, idx) => {
            const showTopLine =
              dragOverItem?.listType === listType &&
              dragOverItem?.itemIndex === idx &&
              dragOverItem?.position === 'top'
            const showBottomLine =
              dragOverItem?.listType === listType &&
              dragOverItem?.itemIndex === idx &&
              dragOverItem?.position === 'bottom'

            const isCurrentlyDragged =
              draggedItem?.listType === listType && draggedItem?.index === idx

            return (
              <QueueTrackRow
                key={idx}
                item={item}
                index={idx}
                listType={listType}
                isTouch={isTouch}
                isCurrentlyDragged={isCurrentlyDragged}
                showTopLine={showTopLine}
                showBottomLine={showBottomLine}
                onPlayQueuedTrack={onPlayQueuedTrack}
                onRemove={onRemove}
                onCloseDialog={onCloseDialog}
                onTouchDragStart={onTouchDragStart}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onDragEnd={onDragEnd}
              />
            )
          })}
        </List>
      )}
    </Box>
  )
}
