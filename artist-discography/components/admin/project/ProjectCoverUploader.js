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

  const hasAnyCover = hasUploadedCover || hasExistingCover

  return (
    <Grid size={{ xs: 12 }}>
      <Paper
        variant='outlined'
        sx={{
          p: 2,
          borderRadius: 2,
          bgcolor: coverJob
            ? 'rgba(144, 202, 249, 0.08)'
            : hasUploadedCover
              ? 'rgba(102, 187, 106, 0.08)'
              : hasExistingCover
                ? 'rgba(144, 202, 249, 0.08)'
                : 'rgba(255, 179, 0, 0.08)',
          borderColor: coverJob
            ? 'primary.main'
            : hasUploadedCover
              ? 'success.main'
              : hasExistingCover
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
                bgcolor: hasAnyCover ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 179, 0, 0.12)',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                border: '1px solid',
                borderColor: hasAnyCover ? 'rgba(255, 255, 255, 0.15)' : 'warning.main',
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
                <AlbumIcon sx={{ fontSize: 36, color: 'warning.main' }} />
              )}
            </Box>

            <Box sx={{ minWidth: 0, flexGrow: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
                <Typography
                  variant='body2'
                  sx={{
                    fontWeight: 700,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: hasUploadedCover
                      ? 'success.main'
                      : hasExistingCover
                        ? 'primary.main'
                        : 'warning.main',
                  }}
                >
                  {hasUploadedCover
                    ? `Staged Cover: ${coverFile.name}`
                    : hasExistingCover
                      ? `Active Cover: ${formatMediaPath(existingCoverUrl || 'art.jpg')}`
                      : 'No Album Artwork Uploaded'}
                </Typography>
                {hasUploadedCover && (
                  <Chip
                    label='Staged'
                    size='small'
                    color='success'
                    sx={{ height: 20, fontSize: '0.7rem', fontWeight: 800 }}
                  />
                )}
                {!hasAnyCover && (
                  <Chip
                    label='Missing Artwork'
                    size='small'
                    color='warning'
                    variant='outlined'
                    sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }}
                  />
                )}
              </Box>

              <Typography
                variant='caption'
                sx={{ color: hasAnyCover ? 'text.secondary' : 'warning.light', display: 'block' }}
              >
                {coverJob
                  ? `Optimizing responsive sizes: ${coverJob.phase || 'Generating thumbnails...'}`
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
                    color: hasUploadedCover || hasExistingCover ? '#ffffff' : 'primary.main',
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

        {coverJob && coverJob.progress !== null && (
          <Box sx={{ width: '100%', mt: 1.5 }}>
            <LinearProgress
              variant='determinate'
              value={coverJob.progress}
              sx={{ height: 6, borderRadius: 3 }}
            />
          </Box>
        )}
      </Paper>
    </Grid>
  )
}
