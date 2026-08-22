'use client'

import { Box, Typography, Chip, Button, LinearProgress } from '@mui/material'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ImageIcon from '@mui/icons-material/Image'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh'

/**
 * Brand logo management card with image upload, default reset, and responsive favicon suite progress.
 */
export default function ArtistLogoCard({
  logoInfo,
  logoPreview,
  isUploadingLogo = false,
  isResettingLogo = false,
  onUploadLogo,
  onResetLogo,
  logoJob = null,
}) {
  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file && onUploadLogo) {
      onUploadLogo(file)
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 1.5,
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Typography
          variant='subtitle2'
          sx={{
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
          }}
        >
          <ImageIcon color='primary' sx={{ fontSize: 20 }} /> Artist Logo
        </Typography>

        {logoInfo?.isCustom ? (
          <Chip
            icon={<CheckCircleIcon />}
            label='Custom Logo'
            color='success'
            size='small'
            sx={{ fontWeight: 600, height: 24 }}
          />
        ) : (
          <Chip
            icon={<ImageIcon />}
            label='Default Logo'
            color='default'
            variant='outlined'
            size='small'
            sx={{ fontWeight: 600, height: 24 }}
          />
        )}
      </Box>

      {/* Logo Preview Container */}
      <Box
        sx={{
          p: 2,
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
          flexGrow: 1,
        }}
      >
        {logoPreview ? (
          <Box
            component='img'
            src={logoPreview}
            alt='Artist Logo'
            sx={{
              maxWidth: '100%',
              maxHeight: 120,
              objectFit: 'contain',
              display: 'block',
            }}
          />
        ) : (
          <Typography variant='caption' sx={{ color: 'text.secondary' }}>
            No Logo Found
          </Typography>
        )}
      </Box>

      {/* Upload and Reset Buttons */}
      <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <input
          type='file'
          accept='image/svg+xml,image/png,image/jpeg,image/webp'
          id='artist-logo-input'
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <label htmlFor='artist-logo-input' style={{ width: '100%' }}>
          <Button
            component='span'
            variant='outlined'
            color='primary'
            fullWidth
            size='small'
            disabled={isUploadingLogo || isResettingLogo}
            startIcon={<CloudUploadIcon />}
            sx={{ borderRadius: 2 }}
          >
            {isUploadingLogo ? 'Uploading Logo...' : 'Upload New Logo'}
          </Button>
        </label>

        {logoInfo?.isCustom && (
          <Button
            variant='text'
            color='secondary'
            size='small'
            disabled={isUploadingLogo || isResettingLogo}
            startIcon={<RestartAltIcon />}
            onClick={onResetLogo}
            sx={{ borderRadius: 2, fontSize: '0.75rem' }}
          >
            {isResettingLogo ? 'Resetting...' : 'Reset to Default Logo'}
          </Button>
        )}
      </Box>

      {logoJob && (
        <Box sx={{ mt: 1.5, width: '100%' }}>
          <Typography
            variant='caption'
            sx={{
              color: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              fontWeight: 600,
              mb: 0.5,
            }}
          >
            <AutoFixHighIcon sx={{ fontSize: 14 }} />
            {logoJob.phase || 'Generating favicons & app icons...'}
          </Typography>
          <LinearProgress
            variant='determinate'
            value={logoJob.progress || 0}
            sx={{ height: 4, borderRadius: 2 }}
          />
        </Box>
      )}
    </Box>
  )
}
