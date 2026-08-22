'use client'

import { memo } from 'react'
import { Card, CardContent, Box, Chip, IconButton, Grid, Tooltip } from '@mui/material'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import DeleteIcon from '@mui/icons-material/Delete'
import AdminTextInput from '../common/AdminTextInput'
import { TrackAudioUploader } from '../track/TrackAudioUploader'
import { TrackLinksGrid } from '../track/TrackLinksGrid'

/**
 * TrackCreateCard
 * Form card for configuring an individual track during new project creation.
 */
const TrackCreateCard = memo(function TrackCreateCard({
  track,
  index,
  totalTracks,
  defaultArtist,
  projectName = '',
  allProjects = [],
  currentTracks = [],
  isDuplicate,
  isDirtyTitle,
  isSavedTitle,
  isDirtyArtist,
  isSavedArtist,
  isDirtyLink,
  isSavedLink,
  onUpdateTrackName,
  onUpdateTrackArtist,
  onUpdateTrackLink,
  onAudioUpload,
  onAudioRemove,
  onMoveUp,
  onMoveDown,
  onDeleteTrack,
}) {
  return (
    <Card
      variant='outlined'
      sx={{
        mb: 2,
        borderRadius: 3,
        bgcolor: 'background.paper',
        borderColor: isDuplicate ? 'error.main' : 'divider',
        boxShadow: isDuplicate ? '0 0 12px rgba(244, 67, 54, 0.25)' : 'none',
        transition: 'all 0.2s ease',
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
        {/* Header Bar */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={`Track ${index + 1}`}
              size='small'
              color='primary'
              sx={{ fontWeight: 700, borderRadius: 1.5 }}
            />
            {isDuplicate && (
              <Chip
                label='Duplicate Track Title'
                size='small'
                color='error'
                variant='outlined'
                sx={{ fontWeight: 700, borderRadius: 1.5 }}
              />
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Tooltip title='Move Up' arrow>
              <span>
                <IconButton size='small' disabled={index === 0} onClick={() => onMoveUp?.(index)}>
                  <ArrowUpwardIcon fontSize='small' />
                </IconButton>
              </span>
            </Tooltip>

            <Tooltip title='Move Down' arrow>
              <span>
                <IconButton
                  size='small'
                  disabled={index >= totalTracks - 1}
                  onClick={() => onMoveDown?.(index)}
                >
                  <ArrowDownwardIcon fontSize='small' />
                </IconButton>
              </span>
            </Tooltip>

            <Tooltip title='Delete Track' arrow>
              <span>
                <IconButton
                  size='small'
                  color='error'
                  disabled={totalTracks <= 1}
                  onClick={() => onDeleteTrack?.(track, index)}
                >
                  <DeleteIcon fontSize='small' />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </Box>

        {/* Title and Artist Row */}
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <AdminTextInput
              label='Track Title'
              size='small'
              fullWidth
              value={track.name || ''}
              onChange={(val) => onUpdateTrackName?.(index, val)}
              error={isDuplicate}
              helperText={isDuplicate ? 'Duplicate title within this project' : undefined}
              isDirty={isDirtyTitle}
              isSaved={isSavedTitle}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <AdminTextInput
              label='Artist (Optional Override)'
              size='small'
              fullWidth
              value={track.artist || ''}
              onChange={(val) => onUpdateTrackArtist?.(index, val)}
              placeholder={defaultArtist}
              isDirty={isDirtyArtist}
              isSaved={isSavedArtist}
            />
          </Grid>
        </Grid>

        {/* Audio File Upload */}
        <TrackAudioUploader
          track={track}
          index={index}
          isEditing={false}
          onAudioUpload={onAudioUpload}
          onAudioRemove={onAudioRemove}
        />

        {/* Streaming Platform Links Accordion */}
        <TrackLinksGrid
          index={index}
          track={track}
          defaultArtist={defaultArtist}
          projectName={projectName}
          currentProjectIndex={-1}
          currentTracks={currentTracks}
          allProjects={allProjects}
          onUpdateLink={onUpdateTrackLink}
          isDirty={isDirtyLink}
          isSaved={isSavedLink}
        />
      </CardContent>
    </Card>
  )
})

export default TrackCreateCard
