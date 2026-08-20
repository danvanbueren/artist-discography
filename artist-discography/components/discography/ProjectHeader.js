'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Stack,
  Typography,
  IconButton,
  Chip,
  Dialog,
  Tooltip,
  Skeleton,
  CircularProgress,
  useTheme,
} from '@mui/material'
import AlbumRoundedIcon from '@mui/icons-material/AlbumRounded'
import LaunchRoundedIcon from '@mui/icons-material/LaunchRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import ZoomInRoundedIcon from '@mui/icons-material/ZoomInRounded'
import LockOpenRoundedIcon from '@mui/icons-material/LockOpenRounded'
import ProgressiveImage from '../common/ProgressiveImage'
import { isHighResCached, markHighResCached } from '../../lib/mediaPreloader'
import SubduedText from '../ui/SubduedText'
import { useDynamicThemeGradients } from '../../lib/hooks/useDynamicThemeGradients'
import { formatProjectDate } from '../../lib/dateUtils'
import { useTouchDevice } from '../../lib/hooks/useTouchDevice'

const PLATFORM_ICONS = {
  spotify: '/platforms/spotify.webp',
  apple: '/platforms/apple.webp',
  youtube: '/platforms/youtube.webp',
  soundcloud: '/platforms/soundcloud.webp',
  bandcamp: '/platforms/bandcamp.webp',
  deezer: '/platforms/deezer.webp',
  tidal: '/platforms/tidal.webp',
  pandora: '/platforms/pandora.webp',
  amazon: '/platforms/amazon.webp',
  itunes: '/platforms/itunes.webp',
}

export default function ProjectHeader({
  project,
  artistName,
  onSelectProject,
  selectedPlatform,
  isSingleView = false,
  isPrivateAuthenticated = false,
}) {
  const theme = useTheme()
  const isDarkMode = theme.palette.mode === 'dark'
  const isTouch = useTouchDevice()
  const [artModalOpen, setArtModalOpen] = useState(false)

  const name = project?.name ?? ''
  const pArtist = project?.artist || artistName || ''
  const type = project?.type ?? ''
  const date = formatProjectDate(project?.date ?? '')
  const cover = project?.cover ?? project?.image ?? ''
  const { primaryTextSx, secondaryTextSx } = useDynamicThemeGradients(cover, isDarkMode)
  const links = project?.links ?? {}

  // Filter out non-empty streaming links
  const availablePlatforms = []
  for (const [key, url] of Object.entries(links)) {
    if (url && typeof url === 'string' && url.trim() !== '') {
      availablePlatforms.push({
        key,
        url,
        icon: PLATFORM_ICONS[key],
      })
    }
  }

  const handleHeaderClick = (e) => {
    if (e.target.closest('a') || e.target.closest('button')) {
      return
    }
    if (onSelectProject) {
      onSelectProject(project)
    }
  }

  const isApiMedia = typeof cover === 'string' && cover.startsWith('/api/media')
  const previewUrl = isApiMedia
    ? (cover.includes('?') ? `${cover}&w=600&q=85&fmt=webp` : `${cover}?w=600&q=85&fmt=webp`)
    : (cover || '')
  const masterHighResUrl = isApiMedia
    ? (cover.includes('?') ? `${cover}&fmt=original` : `${cover}?fmt=original`)
    : (cover || '')

  const [isMasterLoaded, setIsMasterLoaded] = useState(false)

  // Asynchronously upgrade to the highest quality original media when the modal opens
  useEffect(() => {
    if (!artModalOpen || !cover) return

    if (isHighResCached(masterHighResUrl)) {
      setIsMasterLoaded(true)
      return
    }

    setIsMasterLoaded(false)

    // Load full uncompressed master in background
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
  }, [artModalOpen, cover, masterHighResUrl])

  const canOpenModal = Boolean(cover && (isSingleView || !isTouch))

  const handleCoverClick = (e) => {
    if (!isSingleView && isTouch) {
      if (onSelectProject) {
        onSelectProject(project)
      }
      return
    }
    if (cover) {
      e.stopPropagation()
      setArtModalOpen(true)
    }
  }

  return (
    <>
      <Box
        onClick={handleHeaderClick}
        sx={{
          p: { xs: 2, sm: 3 },
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: 'center',
          gap: { xs: 2.5, sm: 3 },
          cursor: onSelectProject ? 'pointer' : 'default',
          borderRadius: 3,
          transition: 'background-color 0.25s ease',
          '&:hover': onSelectProject
            ? {
                bgcolor: 'action.hover',
              }
            : {},
        }}
      >
        {/* Left: Album Cover Art (Larger on Mobile) */}
        <Tooltip
          title={canOpenModal ? 'Click to view full album art' : ''}
          arrow
          disableHoverListener={!canOpenModal}
          disableTouchListener={!canOpenModal}
        >
          <Box
            onClick={handleCoverClick}
            sx={{
              position: 'relative',
              width: { xs: 200, sm: 130, md: 150 },
              height: { xs: 200, sm: 130, md: 150 },
              borderRadius: 3.5,
              overflow: 'hidden',
              flexShrink: 0,
              boxShadow: '0 8px 28px rgba(0,0,0,0.35)',
              bgcolor: 'rgba(255,255,255,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, rgba(60,60,80,0.8) 0%, rgba(30,30,45,0.9) 100%)',
              cursor: cover ? 'pointer' : 'default',
              transition: 'transform 0.22s ease, box-shadow 0.22s ease',
              '&:hover': cover
                ? {
                    transform: canOpenModal ? 'scale(1.04)' : undefined,
                    boxShadow: canOpenModal ? '0 12px 36px rgba(0,0,0,0.5)' : undefined,
                    '& .cover-zoom-icon': {
                      opacity: 1,
                    },
                  }
                : {},
            }}
          >
            {cover ? (
              <>
                <ProgressiveImage
                  src={cover}
                  alt={name || 'Project Cover'}
                  targetWidth={400}
                  placeholderWidth={40}
                  priority
                  sx={{ width: '100%', height: '100%' }}
                />
                {canOpenModal && (
                  <Box
                    className="cover-zoom-icon"
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      bgcolor: 'rgba(0, 0, 0, 0.35)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: 0,
                      transition: 'opacity 0.2s ease',
                    }}
                  >
                    <ZoomInRoundedIcon sx={{ color: 'common.white', fontSize: 32 }} />
                  </Box>
                )}
              </>
            ) : (
              <AlbumRoundedIcon
                sx={{
                  fontSize: { xs: 72, sm: 72 },
                  color: 'rgba(255,255,255,0.35)',
                }}
              />
            )}
          </Box>
        </Tooltip>

        {/* Right: Metadata Stack (Centered on Mobile) */}
        <Stack
          spacing={1}
          sx={{
            flexGrow: 1,
            minWidth: 0,
            width: '100%',
            alignItems: { xs: 'center', sm: 'flex-start' },
            textAlign: { xs: 'center', sm: 'left' },
          }}
        >
          {/* Type Badge & Unlocked Status */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: { xs: 'center', sm: 'flex-start' }, width: '100%' }}>
            {type ? (
              <Chip
                label={type.toUpperCase()}
                size="small"
                sx={{
                  height: 22,
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  borderRadius: 1,
                }}
              />
            ) : (
              <Chip
                label="PROJECT"
                size="small"
                sx={{
                  height: 22,
                  fontSize: '0.7rem',
                  fontWeight: 500,
                  fontStyle: 'italic',
                  opacity: 0.6,
                  bgcolor: 'action.disabledBackground',
                  borderRadius: 1,
                }}
              />
            )}

            {isPrivateAuthenticated && (project?.visibility === 'private' || project?.copyright === 'uncleared') && (
              <Chip
                icon={<LockOpenRoundedIcon sx={{ fontSize: '13px !important' }} />}
                label={project?.visibility === 'private' ? 'PRIVATE • UNLOCKED' : 'UNLOCKED'}
                size="small"
                color="success"
                variant="outlined"
                sx={{
                  height: 22,
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  borderRadius: 1,
                }}
              />
            )}
          </Box>

          {/* Project Title */}
          <SubduedText
            value={name}
            placeholder="Untitled Project"
            variant="h5"
            component="h2"
            sx={{
              fontWeight: 800,
              fontSize: { xs: '1.35rem', sm: '1.75rem' },
              lineHeight: 1.25,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              textAlign: { xs: 'center', sm: 'left' },
              width: '100%',
              ...primaryTextSx,
            }}
          />

          {/* Artist Name & Release Date on SAME HORIZONTAL LINE */}
          <Stack
            direction="row"
            spacing={1}
            sx={{
              alignItems: 'center',
              justifyContent: { xs: 'center', sm: 'flex-start' },
              flexWrap: 'wrap',
              width: '100%',
            }}
          >
            <SubduedText
              value={pArtist}
              placeholder="Artist"
              variant="subtitle1"
              sx={{
                fontWeight: 600,
                fontSize: { xs: '0.95rem', sm: '1.05rem' },
                ...secondaryTextSx,
              }}
            />

            {pArtist && date && (
              <Typography variant="body2" sx={{ color: 'text.disabled', mx: 0.5 }}>
                •
              </Typography>
            )}

            <SubduedText
              value={date}
              placeholder="Release Date"
              variant="caption"
              sx={{ fontSize: '0.9rem', color: 'text.secondary' }}
            />
          </Stack>

          {/* Platform Streaming Icons */}
          {availablePlatforms.length > 0 && (
            <Stack
              direction="row"
              spacing={1.25}
              sx={{
                pt: 1,
                flexWrap: 'wrap',
                gap: 1,
                alignItems: 'center',
                justifyContent: { xs: 'center', sm: 'flex-start' },
                width: '100%',
              }}
            >
              {availablePlatforms.map(({ key, url, icon }) => {
                const isPreferred = selectedPlatform && selectedPlatform.toLowerCase() === key.toLowerCase()
                return (
                  <IconButton
                    key={key}
                    component="a"
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    size="medium"
                    sx={{
                      p: 0.75,
                      borderRadius: 2,
                      border: '1.5px solid',
                      borderColor: isPreferred ? 'primary.main' : 'rgba(255,255,255,0.12)',
                      bgcolor: isPreferred ? 'rgba(144, 202, 249, 0.18)' : 'rgba(255,255,255,0.04)',
                      transition: 'transform 0.2s ease, border-color 0.2s ease, bgcolor 0.2s ease',
                      '&:hover': {
                        transform: 'scale(1.18)',
                        borderColor: 'primary.light',
                        bgcolor: 'rgba(255,255,255,0.15)',
                      },
                    }}
                  >
                    {icon ? (
                      <Box
                        component="img"
                        src={icon}
                        alt={key}
                        draggable={false}
                        loading="eager"
                        decoding="async"
                        sx={{ width: 28, height: 28, objectFit: 'contain', borderRadius: 2 }}
                      />
                    ) : (
                      <LaunchRoundedIcon sx={{ fontSize: 22 }} />
                    )}
                  </IconButton>
                )
              })}
            </Stack>
          )}
        </Stack>
      </Box>

      {/* Full View Album Art Dialog */}
      {cover && (
        <Dialog
          open={artModalOpen}
          onClose={() => setArtModalOpen(false)}
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
              aria-label="close album art view"
              onClick={() => setArtModalOpen(false)}
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

            {/* Consistent Sized Album Art Frame */}
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
                variant="rectangular"
                animation="wave"
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
                  component="img"
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
                  component="img"
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

              {/* 4. Animated Loading Indicator in Bottom Right */}
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
                <CircularProgress
                  size={20}
                  thickness={4.5}
                  sx={{ color: '#90caf9' }}
                />
              </Box>
            </Box>
          </Box>
        </Dialog>
      )}
    </>
  )
}
