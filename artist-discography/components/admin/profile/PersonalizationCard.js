'use client'

import { Box, Paper, Typography, Chip, Button, Stack } from '@mui/material'
import PaletteRoundedIcon from '@mui/icons-material/PaletteRounded'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ImageIcon from '@mui/icons-material/Image'
import RestartAltIcon from '@mui/icons-material/RestartAlt'

/**
 * PersonalizationCard
 * Custom ambient background upload and default release fallback management.
 *
 * @param {Object} props
 * @param {Object} props.backgroundInfo - Background details object
 * @param {string} props.backgroundPreview - Background preview image URL
 * @param {boolean} [props.isUploadingBackground=false] - Upload in progress
 * @param {boolean} [props.isResettingBackground=false] - Reset in progress
 * @param {Function} props.onUploadBackground - Upload handler (file) => void
 * @param {Function} props.onResetBackground - Reset handler () => void
 * @param {string|null} [props.newestProjectCover=null] - Cover art of newest project for fallback preview
 */
export default function PersonalizationCard({
  backgroundInfo,
  backgroundPreview,
  isUploadingBackground = false,
  isResettingBackground = false,
  onUploadBackground,
  onResetBackground,
  newestProjectCover = null,
}) {
  const hasCustomBg = Boolean(backgroundInfo?.exists)

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file && onUploadBackground) {
      onUploadBackground(file)
    }
  }

  return (
    <Paper
      variant='outlined'
      sx={{
        p: { xs: 3, md: 3.5 },
        borderRadius: 2.5,
        backgroundColor: 'rgba(28, 28, 38, 0.6)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 1,
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Typography
          variant='h6'
          sx={{
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <PaletteRoundedIcon color='primary' /> Personalization
        </Typography>

        {hasCustomBg ? (
          <Chip
            icon={<CheckCircleIcon />}
            label='Custom Background'
            color='success'
            size='small'
            sx={{ fontWeight: 600, height: 24 }}
          />
        ) : (
          <Chip
            icon={<ImageIcon />}
            label='Default (Newest Release)'
            color='default'
            variant='outlined'
            size='small'
            sx={{ fontWeight: 600, height: 24 }}
          />
        )}
      </Box>

      <Typography
        variant='caption'
        sx={{
          color: 'text.secondary',
          display: 'block',
          mb: 2.5,
          lineHeight: 1.4,
        }}
      >
        Configure the default image feeding into the dynamic blurred ambient backdrop when the
        player is idle.
      </Typography>

      <Stack spacing={2}>
        {/* Background Preview Container */}
        <Box
          sx={{
            borderRadius: 2,
            backgroundColor: 'rgba(10, 10, 16, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 140,
            maxHeight: 160,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {hasCustomBg && backgroundPreview ? (
            <Box
              component='img'
              src={backgroundPreview}
              alt='Custom Background'
              sx={{
                width: '100%',
                height: '100%',
                maxHeight: 160,
                objectFit: 'cover',
                display: 'block',
              }}
            />
          ) : newestProjectCover ? (
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                height: '100%',
                minHeight: 140,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Box
                component='img'
                src={newestProjectCover}
                alt='Newest Release Fallback'
                sx={{
                  width: '100%',
                  height: '100%',
                  maxHeight: 160,
                  objectFit: 'cover',
                  filter: 'brightness(0.65)',
                  display: 'block',
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(0, 0, 0, 0.35)',
                  px: 2,
                  textAlign: 'center',
                }}
              >
                <Chip
                  icon={<ImageIcon sx={{ fontSize: '16px !important' }} />}
                  label='Fallback: Newest Release Art'
                  size='small'
                  sx={{
                    backgroundColor: 'rgba(20, 20, 30, 0.85)',
                    backdropFilter: 'blur(8px)',
                    color: 'text.secondary',
                    fontWeight: 600,
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                  }}
                />
              </Box>
            </Box>
          ) : (
            <Typography variant='caption' sx={{ color: 'text.secondary' }}>
              No Background or Release Artwork Available
            </Typography>
          )}
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <input
            type='file'
            accept='image/png,image/jpeg,image/webp,image/avif'
            id='personalization-background-input'
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <label htmlFor='personalization-background-input' style={{ width: '100%' }}>
            <Button
              component='span'
              variant='outlined'
              color='primary'
              fullWidth
              size='small'
              disabled={isUploadingBackground || isResettingBackground}
              startIcon={<CloudUploadIcon />}
              sx={{ borderRadius: 2 }}
            >
              {isUploadingBackground ? 'Uploading Background...' : 'Upload Background'}
            </Button>
          </label>

          {hasCustomBg && (
            <Button
              variant='text'
              color='secondary'
              size='small'
              disabled={isUploadingBackground || isResettingBackground}
              startIcon={<RestartAltIcon />}
              onClick={onResetBackground}
              sx={{ borderRadius: 2, fontSize: '0.75rem' }}
            >
              {isResettingBackground ? 'Resetting...' : 'Reset to Default Artwork'}
            </Button>
          )}
        </Box>

        <Typography
          variant='caption'
          sx={{
            color: 'text.secondary',
            display: 'block',
            lineHeight: 1.4,
          }}
        >
          When audio is idle, this image drives the dynamic blurred background. Playing tracks will
          still dynamically display their own album artwork.
        </Typography>
      </Stack>
    </Paper>
  )
}
