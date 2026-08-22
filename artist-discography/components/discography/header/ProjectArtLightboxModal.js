'use client'

import { useState, useEffect } from 'react'
import { Box, Dialog, IconButton, Skeleton, CircularProgress } from '@mui/material'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import { isHighResCached, markHighResCached } from '@/lib/media/mediaPreloader'

/**
 * Fullscreen lightbox modal for high-res project artwork zoom and examination.
 *
 * @param {Object} props
 * @param {boolean} props.open - Modal visibility
 * @param {Function} props.onClose - Modal close handler
 * @param {string} props.cover - Base cover art URL
 * @param {string} props.name - Project name for alt text
 */
export default function ProjectArtLightboxModal({ open, onClose, cover, name }) {
  const isApiMedia = typeof cover === 'string' && cover.startsWith('/api/media')
  const previewUrl = isApiMedia
    ? cover.includes('?')
      ? `${cover}&w=600&q=85&fmt=webp`
      : `${cover}?w=600&q=85&fmt=webp`
    : cover || ''
  const masterHighResUrl = isApiMedia
    ? cover.includes('?')
      ? `${cover}&fmt=original`
      : `${cover}?fmt=original`
    : cover || ''

  const [isMasterLoaded, setIsMasterLoaded] = useState(false)

  // Asynchronously upgrade to the highest quality original media when modal opens
  useEffect(() => {
    if (!open || !cover) return

    if (isHighResCached(masterHighResUrl)) {
      setIsMasterLoaded(true)
      return
    }

    setIsMasterLoaded(false)

    let isCurrent = true
    const masterImg = new Image()
    masterImg.src = masterHighResUrl
    masterImg.onload = () => {
      if (isCurrent) {
        markHighResCached(masterHighResUrl)
        setIsMasterLoaded(true)
      }
    }
    masterImg.onerror = () => {
      if (isCurrent) {
        setIsMasterLoaded(true)
      }
    }

    return () => {
      isCurrent = false
    }
  }, [open, cover, masterHighResUrl])

  if (!cover) return null

  return (
    <Dialog
      open={open}
      onClose={onClose}
      slotProps={{
        backdrop: {
          sx: {
            backdropFilter: 'blur(12px)',
            bgcolor: 'rgba(0, 0, 0, 0.85)',
          },
        },
        paper: {
          sx: {
            borderRadius: 4,
            bgcolor: 'transparent',
            backgroundImage: 'none',
            boxShadow: 'none',
            overflow: 'visible',
            position: 'relative',
            maxWidth: 'none',
            maxHeight: 'none',
            m: { xs: 1.5, sm: 2 },
          },
        },
      }}
    >
      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <IconButton
          aria-label='close album art view'
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: { xs: -12, sm: -16 },
            right: { xs: -12, sm: -16 },
            bgcolor: 'rgba(30, 30, 40, 0.9)',
            color: 'common.white',
            zIndex: 10,
            boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.15)',
            backdropFilter: 'blur(8px)',
            '&:hover': {
              bgcolor: 'rgba(50, 50, 65, 0.95)',
              transform: 'scale(1.1)',
            },
          }}
        >
          <CloseRoundedIcon />
        </IconButton>

        {/* 1:1 Aspect Ratio Album Art Frame */}
        <Box
          sx={{
            position: 'relative',
            width: 'min(85vw, 82vh, 800px)',
            height: 'min(85vw, 82vh, 800px)',
            aspectRatio: '1 / 1',
            borderRadius: 4,
            overflow: 'hidden',
            boxShadow: '0 32px 64px rgba(0,0,0,0.75)',
            border: '1px solid rgba(255,255,255,0.1)',
            bgcolor: 'rgba(20, 20, 28, 0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* 1. Base Skeleton Wave Background */}
          <Skeleton
            variant='rectangular'
            animation='wave'
            sx={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              bgcolor: 'rgba(255, 255, 255, 0.08)',
              zIndex: 1,
            }}
          />

          {/* 2. Fast Preview Image Layer */}
          {previewUrl && (
            <Box
              component='img'
              src={previewUrl}
              alt={name || 'Project Cover Preview'}
              draggable={false}
              sx={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                zIndex: 2,
              }}
            />
          )}

          {/* 3. Ultra High-Res Master Image Layer */}
          {masterHighResUrl && (
            <Box
              component='img'
              src={masterHighResUrl}
              alt={name || 'Project Cover Art'}
              draggable={false}
              onLoad={() => {
                markHighResCached(masterHighResUrl)
                setIsMasterLoaded(true)
              }}
              onError={() => {
                setIsMasterLoaded(true)
              }}
              sx={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: isMasterLoaded ? 1 : 0,
                transition: isMasterLoaded ? 'opacity 0.3s ease-in-out' : 'none',
                zIndex: 3,
              }}
            />
          )}

          {/* 4. Animated Loading Spinner */}
          <Box
            sx={{
              position: 'absolute',
              bottom: { xs: 14, sm: 18 },
              right: { xs: 14, sm: 18 },
              zIndex: 5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: { xs: 36, sm: 40 },
              height: { xs: 36, sm: 40 },
              borderRadius: '50%',
              bgcolor: 'rgba(15, 15, 25, 0.78)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.55)',
              pointerEvents: 'none',
              transition: 'opacity 0.35s ease, transform 0.35s ease',
              opacity: isMasterLoaded ? 0 : 1,
              transform: isMasterLoaded ? 'scale(0.7)' : 'scale(1)',
            }}
          >
            <CircularProgress size={20} thickness={4.5} sx={{ color: '#90caf9' }} />
          </Box>
        </Box>
      </Box>
    </Dialog>
  )
}
