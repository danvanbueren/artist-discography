'use client'

import {
  Grid,
  Paper,
  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  LinearProgress,
} from '@mui/material'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import ImageIcon from '@mui/icons-material/Image'
import AlbumIcon from '@mui/icons-material/Album'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import DeleteIcon from '@mui/icons-material/Delete'
import { formatMediaPath, getMediaThumbnailUrl } from '../adminUtils'

/**
 * Square artwork upload zone and status preview card for project forms.
 */
export default function ProjectCoverUploader({
  coverFile,
  coverPreview,
  existingCoverUrl,
  onCoverChange,
  onCoverRemove,
  coverJob = null,
  isEditing = false,
}) {
  const hasUploadedCover = Boolean(coverFile)
  const hasExistingCover = Boolean(existingCoverUrl || coverPreview)
  const hasAnyCover = hasUploadedCover || hasExistingCover
  const isCoverOptimizing = Boolean(
    coverJob && (coverJob.status === 'processing' || coverJob.status === 'queued'),
  )

  const isGreen = isCoverOptimizing || hasUploadedCover
  const isBlue = hasExistingCover && !isGreen
  const isYellow = !hasAnyCover && !isCoverOptimizing

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      onCoverChange?.(file)
    }
  }

  const thumbUrl = coverPreview
    ? coverPreview.startsWith('blob:')
      ? coverPreview
      : getMediaThumbnailUrl(coverPreview, 160)
    : null

  return (
    <Grid size={{ xs: 12 }}>
      <Paper
        variant='outlined'
        sx={{
          p: 2,
          borderRadius: 2,
          bgcolor: isGreen
            ? 'rgba(102, 187, 106, 0.08)'
            : isBlue
              ? 'rgba(144, 202, 249, 0.08)'
              : 'rgba(255, 179, 0, 0.08)',
          borderColor: isGreen ? 'success.main' : isBlue ? 'primary.main' : 'warning.main',
          transition: 'all 0.2s ease',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'nowrap',
            gap: 2,
          }}
        >
          {/* Thumbnail preview */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0, flexGrow: 1 }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                aspectRatio: '1 / 1',
                borderRadius: 2,
                bgcolor: isGreen
                  ? 'rgba(102, 187, 106, 0.12)'
                  : isBlue
                    ? 'rgba(255, 255, 255, 0.06)'
                    : 'rgba(255, 179, 0, 0.12)',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                border: '1px solid',
                borderColor: isGreen
                  ? 'success.main'
                  : isBlue
                    ? 'rgba(255, 255, 255, 0.15)'
                    : 'warning.main',
              }}
            >
              {thumbUrl ? (
                <Box
                  component='img'
                  src={thumbUrl}
                  alt='Cover'
                  sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <AlbumIcon
                  sx={{ fontSize: 36, color: isGreen ? 'success.main' : 'warning.main' }}
                />
              )}
            </Box>

            <Box sx={{ minWidth: 0, flexGrow: 1, overflow: 'hidden' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25, minWidth: 0 }}>
                <Typography
                  variant='body2'
                  sx={{
                    fontWeight: 700,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    minWidth: 0,
                    color: isGreen ? 'success.main' : isBlue ? 'primary.main' : 'warning.main',
                  }}
                >
                  {isCoverOptimizing
                    ? `Optimizing: ${coverJob?.fileName || coverJob?.target || coverFile?.name || formatMediaPath(existingCoverUrl || 'art.jpg')}`
                    : hasUploadedCover
                      ? `Staged Cover: ${coverFile.name}`
                      : isBlue
                        ? `Active Cover: ${formatMediaPath(existingCoverUrl || 'art.jpg')}`
                        : 'No Album Artwork Uploaded'}
                </Typography>
                {isCoverOptimizing && (
                  <Chip
                    label='Optimizing'
                    size='small'
                    color='success'
                    sx={{ height: 20, fontSize: '0.7rem', fontWeight: 800, flexShrink: 0 }}
                  />
                )}
                {!isCoverOptimizing && hasUploadedCover && (
                  <Chip
                    label='Staged'
                    size='small'
                    color='success'
                    sx={{ height: 20, fontSize: '0.7rem', fontWeight: 800, flexShrink: 0 }}
                  />
                )}
                {isYellow && (
                  <Chip
                    label='Missing Artwork'
                    size='small'
                    color='warning'
                    variant='outlined'
                    sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700, flexShrink: 0 }}
                  />
                )}
              </Box>

              <Typography
                variant='caption'
                sx={{
                  color: isYellow ? 'warning.light' : 'text.secondary',
                  display: 'block',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {isCoverOptimizing
                  ? `Optimizing responsive sizes: ${coverJob.currentStep || coverJob.phase || 'Generating thumbnails...'}`
                  : hasUploadedCover
                    ? 'Artwork staged for upload on save.'
                    : 'Square 1:1 format recommended (JPG, PNG, WebP). Scaled automatically.'}
              </Typography>
            </Box>
          </Box>

          {/* Action Buttons: Upload / Replace and Delete */}
          <Box sx={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 1 }}>
            <input
              type='file'
              accept='image/*'
              id={`project-cover-input-${isEditing ? 'edit' : 'create'}`}
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <label htmlFor={`project-cover-input-${isEditing ? 'edit' : 'create'}`}>
              <Tooltip
                title={
                  hasUploadedCover || hasExistingCover
                    ? 'Replace Cover Artwork'
                    : 'Upload Cover Artwork'
                }
                arrow
              >
                <IconButton
                  component='span'
                  size='medium'
                  sx={{
                    color: isGreen ? 'success.main' : isBlue ? '#ffffff' : 'warning.main',
                    bgcolor: 'action.hover',
                    '&:hover': { bgcolor: 'action.selected' },
                  }}
                >
                  <CloudUploadIcon />
                </IconButton>
              </Tooltip>
            </label>

            {(hasUploadedCover || hasExistingCover) && (
              <Tooltip title='Remove Cover Artwork' arrow>
                <IconButton
                  size='medium'
                  color='error'
                  onClick={() => onCoverRemove?.()}
                  sx={{
                    bgcolor: 'action.hover',
                    '&:hover': { bgcolor: 'rgba(244, 67, 54, 0.15)' },
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        {isCoverOptimizing && coverJob?.progress !== null && (
          <Box sx={{ width: '100%', mt: 1.5 }}>
            <LinearProgress
              variant='determinate'
              color='success'
              value={coverJob.progress}
              sx={{ height: 6, borderRadius: 3 }}
            />
          </Box>
        )}
      </Paper>
    </Grid>
  )
}
