'use client'

import { memo } from 'react'
import { Paper, Box, Typography, IconButton, Tooltip, LinearProgress } from '@mui/material'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import MusicNoteIcon from '@mui/icons-material/MusicNote'
import DeleteIcon from '@mui/icons-material/Delete'
import GraphicEqIcon from '@mui/icons-material/GraphicEq'
import { formatMediaPath } from '../adminUtils'

/**
 * Audio file drag-drop upload and status panel for track edit/create cards.
 */
export const TrackAudioUploader = memo(function TrackAudioUploader({
  track,
  index,
  isEditing = false,
  isAudioTranscoding = false,
  transcodeProgress = null,
  transcodePhase = null,
  onAudioUpload,
  onAudioRemove,
}) {
  const hasUploadedAudio = Boolean(track.audioFile)
  const hasExistingAudio = Boolean(track.audio || track.hasAudio || track.audioUrl)
  const audioDisplay = track.audioFileName
    ? track.audioFileName
    : track.audio
      ? formatMediaPath(track.audio)
      : track.audioUrl
        ? formatMediaPath(track.audioUrl)
        : null

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      onAudioUpload?.(index, file)
    }
  }

  return (
    <Paper
      variant='outlined'
      sx={{
        p: 1.5,
        mt: 1.5,
        borderRadius: 2,
        bgcolor: isAudioTranscoding
          ? 'rgba(144, 202, 249, 0.08)'
          : hasUploadedAudio
            ? 'rgba(102, 187, 106, 0.08)'
            : hasExistingAudio
              ? 'rgba(144, 202, 249, 0.08)'
              : 'rgba(255, 179, 0, 0.08)',
        borderColor: isAudioTranscoding
          ? 'primary.main'
          : hasUploadedAudio
            ? 'success.main'
            : hasExistingAudio
              ? 'primary.main'
              : 'warning.main',
        transition: 'all 0.2s ease',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0, flexGrow: 1 }}>
          {isAudioTranscoding ? (
            <GraphicEqIcon
              sx={{
                color: 'primary.main',
                animation: 'pulse 1s infinite ease-in-out',
                '@keyframes pulse': {
                  '0%, 100%': { opacity: 0.5, transform: 'scale(0.95)' },
                  '50%': { opacity: 1, transform: 'scale(1.05)' },
                },
              }}
            />
          ) : hasUploadedAudio ? (
            <CheckCircleIcon sx={{ color: 'success.main' }} />
          ) : hasExistingAudio ? (
            <MusicNoteIcon sx={{ color: 'primary.main' }} />
          ) : (
            <MusicNoteIcon sx={{ color: 'warning.main' }} />
          )}

          <Box sx={{ minWidth: 0, flexGrow: 1 }}>
            <Typography
              variant='body2'
              sx={{
                fontWeight: 600,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                color: hasUploadedAudio
                  ? 'success.main'
                  : hasExistingAudio
                    ? 'primary.main'
                    : 'warning.main',
              }}
            >
              {isAudioTranscoding
                ? `Optimizing Stream: ${transcodePhase || 'Processing audio tiers...'}`
                : hasUploadedAudio
                  ? `Staged for Upload: ${track.audioFileName}`
                  : hasExistingAudio
                    ? `Audio Attached: ${audioDisplay}`
                    : 'No Audio File Attached'}
            </Typography>

            <Typography
              variant='caption'
              sx={{
                color: hasUploadedAudio || hasExistingAudio ? 'text.secondary' : 'warning.light',
                display: 'block',
              }}
            >
              {isAudioTranscoding
                ? 'Generating AAC (320k, 192k, 128k) streaming variants...'
                : hasUploadedAudio
                  ? 'File will be uploaded and transcoded on save.'
                  : hasExistingAudio
                    ? 'Audio stream is active and configured.'
                    : 'Supported: WAV, FLAC, AIFF, MP3, M4A, OGG'}
            </Typography>
          </Box>
        </Box>

        {/* Upload / Replace / Delete Buttons */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0 }}>
          <input
            type='file'
            accept='audio/*'
            id={`track-audio-${index}-${isEditing ? 'edit' : 'create'}`}
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <label htmlFor={`track-audio-${index}-${isEditing ? 'edit' : 'create'}`}>
            <Tooltip
              title={
                hasExistingAudio || hasUploadedAudio ? 'Replace Audio File' : 'Upload Audio File'
              }
              arrow
            >
              <IconButton
                component='span'
                size='small'
                sx={{
                  color: hasUploadedAudio || hasExistingAudio ? 'text.secondary' : 'primary.main',
                  bgcolor: 'action.hover',
                  '&:hover': { bgcolor: 'action.selected' },
                }}
              >
                <CloudUploadIcon fontSize='small' />
              </IconButton>
            </Tooltip>
          </label>

          {(hasUploadedAudio || (isEditing && hasExistingAudio)) && (
            <Tooltip title='Remove Audio File' arrow>
              <IconButton
                size='small'
                color='error'
                onClick={() => onAudioRemove?.(index)}
                sx={{
                  bgcolor: 'action.hover',
                  '&:hover': { bgcolor: 'rgba(244, 67, 54, 0.15)' },
                }}
              >
                <DeleteIcon fontSize='small' />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {isAudioTranscoding && transcodeProgress !== null && (
        <Box sx={{ width: '100%', mt: 1.5 }}>
          <LinearProgress
            variant='determinate'
            value={transcodeProgress}
            sx={{ height: 6, borderRadius: 3 }}
          />
        </Box>
      )}
    </Paper>
  )
})
