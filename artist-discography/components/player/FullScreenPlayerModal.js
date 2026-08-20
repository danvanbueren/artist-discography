'use client'

import { forwardRef, useRef } from 'react'
import {
  Box,
  Typography,
  IconButton,
  Slider,
  Stack,
  Badge,
  Dialog,
  Slide,
  Tooltip,
} from '@mui/material'
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded'
import PauseRoundedIcon from '@mui/icons-material/PauseRounded'
import SkipNextRoundedIcon from '@mui/icons-material/SkipNextRounded'
import SkipPreviousRoundedIcon from '@mui/icons-material/SkipPreviousRounded'
import ShuffleRoundedIcon from '@mui/icons-material/ShuffleRounded'
import RepeatRoundedIcon from '@mui/icons-material/RepeatRounded'
import RepeatOneRoundedIcon from '@mui/icons-material/RepeatOneRounded'
import QueueMusicRoundedIcon from '@mui/icons-material/QueueMusicRounded'
import ShareRoundedIcon from '@mui/icons-material/ShareRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import MusicNoteRoundedIcon from '@mui/icons-material/MusicNoteRounded'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded'
import CastRoundedIcon from '@mui/icons-material/CastRounded'
import CastConnectedRoundedIcon from '@mui/icons-material/CastConnectedRounded'
import PictureInPictureAltRoundedIcon from '@mui/icons-material/PictureInPictureAltRounded'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import ProgressiveImage from '../common/ProgressiveImage'
import AudioQualityPill from './AudioQualityPill'

const FullScreenSlideTransition = forwardRef(function FullScreenSlideTransition(props, ref) {
  return (
    <Slide
      direction="up"
      ref={ref}
      {...props}
      timeout={{ enter: 460, exit: 225 }}
      easing={{
        enter: 'cubic-bezier(0.22, 1, 0.36, 1)',
        exit: 'cubic-bezier(0.4, 0, 0.6, 1)',
      }}
    />
  )
})

/**
 * FullScreenPlayerModal
 * Responsive full-screen audio player dialog for immersive mobile & desktop listening.
 */
export default function FullScreenPlayerModal({
  open,
  onClose,
  playingTrack,
  coverArt,
  playerBgColor,
  isPlaying,
  currentTime,
  duration,
  formatTime,
  audioQualityLabel,
  isStuttering = false,
  isShuffle,
  repeatMode,
  isTouch,
  effectiveVolume,
  isMuted,
  copiedShare,
  manualQueue = [],
  autoplayTracks = [],
  onClosePlayer,
  onNavigateToCurrentTrack,
  onOpenQualityModal,
  onShareTrack,
  onOpenQueue,
  onToggleMute,
  onVolumeChange,
  onToggleShuffle,
  onSkipPrev,
  onSkipNext,
  onDirectTogglePlay,
  onCycleRepeat,
  onSeek,
  isPipActive = false,
  isCasting = false,
  isCastAvailable = true,
  castError = false,
  onTogglePip,
  onPromptCast,
  VolumeIconComponent,
}) {
  const hasNextTrack = manualQueue.length > 0 || autoplayTracks.length > 0 || repeatMode === 'all'

  const handleSkipBackClick = () => {
    if (currentTime > 3) {
      if (onSeek) onSeek(0)
    } else if (onSkipPrev) {
      onSkipPrev()
    }
  }

  const handleSkipForwardClick = () => {
    if (!hasNextTrack) {
      if (onSeek) onSeek(0)
    }
    if (onSkipNext) {
      onSkipNext()
    }
  }

  const touchStartY = useRef(0)
  const touchStartX = useRef(0)
  const isSwiping = useRef(false)

  const handleTouchStart = (e) => {
    if (e.touches && e.touches.length === 1) {
      if (e.target && e.target.closest && e.target.closest('.MuiSlider-root')) {
        isSwiping.current = false
        return
      }
      touchStartY.current = e.touches[0].clientY
      touchStartX.current = e.touches[0].clientX
      isSwiping.current = true
    }
  }

  const handleTouchMove = (e) => {
    if (!isSwiping.current || !e.touches || e.touches.length !== 1) return
  }

  const handleTouchEnd = (e) => {
    if (!isSwiping.current) return
    isSwiping.current = false

    if (e.changedTouches && e.changedTouches.length === 1) {
      const endY = e.changedTouches[0].clientY
      const endX = e.changedTouches[0].clientX
      const deltaY = endY - touchStartY.current
      const deltaX = endX - touchStartX.current
      const swipeDistance = Math.hypot(deltaX, deltaY)

      // Omnidirectional swipe of 75px or larger in any direction minimizes modal cleanly
      if (swipeDistance > 75) {
        if (onClose) onClose()
      }
    }
  }

  const ambientCover = coverArt && typeof coverArt === 'string' && (coverArt.startsWith('/api/media') || coverArt.startsWith('/api/logo'))
    ? `${coverArt}${coverArt.includes('?') ? '&' : '?'}w=48&q=20&blur=8&fmt=webp`
    : coverArt

  return (
    <Dialog
      fullScreen
      keepMounted
      open={Boolean(open && playingTrack)}
      onClose={onClose}
      slots={{ transition: FullScreenSlideTransition }}
      sx={{
        overflow: 'hidden',
        touchAction: 'manipulation',
        '& .MuiDialog-container': {
          overflow: 'hidden',
          height: '100dvh',
          maxHeight: '100dvh',
        },
      }}
      slotProps={{
        backdrop: {
          sx: {
            bgcolor: 'rgba(0, 0, 0, 0.7)',
            transition: 'opacity 225ms cubic-bezier(0.4, 0, 0.2, 1) !important',
          },
        },
        paper: {
          onTouchStart: handleTouchStart,
          onTouchMove: handleTouchMove,
          onTouchEnd: handleTouchEnd,
          sx: {
            bgcolor: playerBgColor,
            backgroundImage: 'none',
            color: 'text.primary',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            px: { xs: 2.5, sm: 4, md: 6, lg: 5, xl: 6 },
            py: { xs: 2.5, sm: 3, md: 3 },
            height: '100dvh',
            maxHeight: '100dvh',
            position: 'relative',
            overflow: 'hidden',
            boxSizing: 'border-box',
            overscrollBehavior: 'contain',
            touchAction: 'manipulation',
            transform: 'translateZ(0)',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            willChange: 'transform',
          },
        },
      }}
    >
      {/* Ambient background glow matching artwork */}
      {ambientCover && (
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${ambientCover})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(40px)',
            opacity: 0.18,
            transform: 'translateZ(0) scale(1.2)',
            pointerEvents: 'none',
            zIndex: 0,
            willChange: 'opacity',
          }}
        />
      )}

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          height: '100%',
          width: '100%',
          maxWidth: { xs: 720, lg: '100%' },
          mx: 'auto',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Top Header Bar */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            pt: { xs: 2, sm: 1.5, md: 1 },
            pb: { xs: 1, sm: 0.5 },
            position: 'relative',
            zIndex: 1,
            flexShrink: 0,
          }}
        >
          {/* Left: Close player & stop playback */}
          <IconButton
            onClick={() => {
              if (onClose) onClose()
              if (onClosePlayer) onClosePlayer()
            }}
            size="small"
            sx={{
              color: 'text.secondary',
              p: { xs: 0.75, sm: 1 },
              position: 'relative',
              zIndex: 2,
              '&:hover': {
                color: 'text.primary',
              },
            }}
          >
            <CloseRoundedIcon sx={{ fontSize: { xs: 22, sm: 26 } }} />
          </IconButton>

          {/* Center: Track Context Button (Absolute 50% screen center) */}
          <Box
            sx={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              maxWidth: { xs: 'calc(100% - 130px)', sm: 'calc(100% - 190px)', md: 'calc(100% - 250px)' },
              zIndex: 1,
              pointerEvents: 'auto',
            }}
          >
            <Stack
              component="button"
              type="button"
              onClick={() => {
                if (onClose) onClose()
                if (onNavigateToCurrentTrack) onNavigateToCurrentTrack()
              }}
              spacing={0.25}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                textAlign: 'center',
                minWidth: 0,
                width: 'fit-content',
                maxWidth: '100%',
                px: { xs: 1.25, sm: 1.5 },
                py: 0.4,
                bgcolor: 'transparent',
                border: 'none',
                borderRadius: 2,
                cursor: 'pointer',
                userSelect: 'none',
                transition: 'background-color 0.15s ease, transform 0.15s ease',
                '&:hover': {
                  bgcolor: (theme) =>
                    theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'rgba(0, 0, 0, 0.05)',
                  transform: 'scale(1.02)',
                },
                '&:hover .top-project-title': {
                  color: 'primary.main',
                  textDecoration: 'underline',
                },
                '&:hover .top-project-artist': {
                  color: 'text.primary',
                },
                '&:active': {
                  transform: 'scale(0.98)',
                },
              }}
            >
              <Typography
                className="top-project-title"
                variant="subtitle2"
                sx={{
                  fontWeight: 700,
                  color: 'text.primary',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: { xs: 180, sm: 280, md: 420, lg: 560 },
                  fontSize: { xs: '0.875rem', sm: '0.95rem' },
                  lineHeight: 1.2,
                  transition: 'color 0.15s ease',
                }}
              >
                {playingTrack?.project || 'Discography'}
              </Typography>

              <Typography
                className="top-project-artist"
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  fontWeight: 500,
                  fontSize: { xs: '0.725rem', sm: '0.8rem' },
                  lineHeight: 1.2,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: { xs: 180, sm: 280, md: 420, lg: 560 },
                  transition: 'color 0.15s ease',
                }}
              >
                {playingTrack?.projectArtist || playingTrack?.artist || 'Artist'}
              </Typography>
            </Stack>
          </Box>

          {/* Right: Cast, PiP & Down chevron collapse/minimize modal buttons */}
          <Stack
            direction="row"
            spacing={{ xs: 0.5, sm: 1 }}
            sx={{
              alignItems: 'center',
              flexShrink: 0,
              position: 'relative',
              zIndex: 2,
            }}
          >
            {/* Cast / Remote Playback */}
            {onPromptCast && (
              <Tooltip
                title={
                  castError
                    ? 'Casting Unavailable / Failed'
                    : isCasting
                    ? 'Connected to Cast Device'
                    : 'Cast to Device'
                }
                arrow
              >
                <IconButton
                  onClick={onPromptCast}
                  size="small"
                  sx={{
                    color: castError
                      ? 'error.main'
                      : isCasting
                      ? 'primary.main'
                      : 'text.secondary',
                    p: { xs: 0.75, sm: 1 },
                    animation: castError ? 'castShakeError 0.45s ease-in-out' : 'none',
                    '@keyframes castShakeError': {
                      '0%, 100%': { transform: 'translateX(0)' },
                      '25%': { transform: 'translateX(-4px)' },
                      '50%': { transform: 'translateX(4px)' },
                      '75%': { transform: 'translateX(-2px)' },
                    },
                    filter: castError ? 'drop-shadow(0 0 6px rgba(244, 67, 54, 0.75))' : 'none',
                    transition: 'color 0.2s ease, filter 0.2s ease',
                    '&:hover': {
                      color: castError
                        ? 'error.dark'
                        : isCasting
                        ? 'primary.main'
                        : 'text.primary',
                    },
                  }}
                  aria-label="Cast audio"
                >
                  {castError ? (
                    <WarningAmberRoundedIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
                  ) : isCasting ? (
                    <CastConnectedRoundedIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
                  ) : (
                    <CastRoundedIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
                  )}
                </IconButton>
              </Tooltip>
            )}

            {/* Picture in Picture (Desktop viewports only) */}
            {onTogglePip && !isTouch && (
              <Tooltip title={isPipActive ? 'Exit Picture in Picture' : 'Picture in Picture Mini-Player'} arrow>
                <IconButton
                  onClick={onTogglePip}
                  size="small"
                  sx={{
                    display: { xs: 'none', md: 'inline-flex' },
                    color: isPipActive ? 'primary.main' : 'text.secondary',
                    p: { xs: 0.75, sm: 1 },
                    '&:hover': {
                      color: isPipActive ? 'primary.main' : 'text.primary',
                    },
                  }}
                  aria-label="Picture in Picture"
                >
                  <PictureInPictureAltRoundedIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
                </IconButton>
              </Tooltip>
            )}

            {/* Down chevron collapse/minimize modal button */}
            <IconButton
              onClick={onClose}
              size="small"
              sx={{
                color: 'text.primary',
                p: { xs: 0.75, sm: 1 },
                '&:hover': {
                  color: 'primary.main',
                },
              }}
            >
              <KeyboardArrowDownRoundedIcon sx={{ fontSize: { xs: 24, sm: 28 } }} />
            </IconButton>
          </Stack>
        </Box>

        {/* Center Artwork Hero */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            py: { xs: 1, sm: 2 },
            my: 'auto',
            width: '100%',
            position: 'relative',
            zIndex: 1,
            flexShrink: 1,
            minHeight: 0,
          }}
        >
          <Box
            sx={{
              width: {
                xs: 'min(68dvw, calc(100dvh - 340px))',
                sm: 'min(68dvw, calc(100dvh - 350px))',
                md: 'min(70dvw, calc(100dvh - 360px), 480px)',
                lg: 'min(70dvw, calc(100dvh - 270px), 520px)',
                xl: 'min(70dvw, calc(100dvh - 270px), 580px)',
              },
              height: {
                xs: 'min(68dvw, calc(100dvh - 340px))',
                sm: 'min(68dvw, calc(100dvh - 350px))',
                md: 'min(70dvw, calc(100dvh - 360px), 480px)',
                lg: 'min(70dvw, calc(100dvh - 270px), 520px)',
                xl: 'min(70dvw, calc(100dvh - 270px), 580px)',
              },
              aspectRatio: '1 / 1',
              borderRadius: { xs: 3, sm: 4, lg: 5 },
              overflow: 'hidden',
              boxShadow: '0 20px 52px rgba(0,0,0,0.65)',
              bgcolor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'primary.contrastText',
              flexShrink: 0,
            }}
          >
            {coverArt ? (
              <ProgressiveImage
                src={coverArt}
                alt={playingTrack?.name || 'Cover'}
                targetWidth={800}
                placeholderWidth={48}
                quality={85}
                priority
                sx={{
                  width: '100%',
                  height: '100%',
                }}
              />
            ) : (
              <MusicNoteRoundedIcon sx={{ fontSize: { xs: 44, sm: 64, lg: 80 } }} />
            )}
          </Box>
        </Box>

        {/* Bottom Control Area: Compact Stack for < lg */}
        <Box
          sx={{
            display: { xs: 'block', lg: 'none' },
            width: '100%',
            position: 'relative',
            zIndex: 1,
            pb: { xs: 2.5, sm: 3 },
            flexShrink: 0,
          }}
        >
          {/* Track Info & Actions Row */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              mb: { xs: 3, sm: 3.5 },
              gap: 1.5,
            }}
          >
            <Box sx={{ minWidth: 0, flexGrow: 1 }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 800,
                  color: 'text.primary',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontSize: { xs: '1.35rem', sm: '1.55rem', md: '1.75rem' },
                  lineHeight: 1.2,
                  pb: 0.5,
                }}
              >
                {playingTrack?.name || 'Untitled Track'}
              </Typography>

              <Stack
                direction="row"
                spacing={1.25}
                sx={{
                  alignItems: 'center',
                  minWidth: 0,
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{
                    color: 'text.secondary',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontWeight: 500,
                    fontSize: { xs: '0.95rem', sm: '1.05rem' },
                    lineHeight: 1.2,
                  }}
                >
                  {playingTrack?.artist || 'Artist'}
                </Typography>

                <AudioQualityPill
                  label={audioQualityLabel}
                  size="large"
                  isStuttering={isStuttering}
                  onClick={onOpenQualityModal}
                />
              </Stack>
            </Box>

            {/* Right Action Icons (Share & Queue) */}
            <Stack
              direction="row"
              spacing={{ xs: 1.5, sm: 2 }}
              sx={{
                alignItems: 'center',
                flexShrink: 0,
              }}
            >
              {/* Share track */}
              <IconButton
                onClick={onShareTrack}
                size="medium"
                sx={{
                  color: copiedShare ? 'success.main' : 'text.secondary',
                  p: { xs: 1.25, sm: 1.5 },
                  '&:hover': {
                    color: 'text.primary',
                  },
                }}
              >
                {copiedShare ? (
                  <CheckRoundedIcon sx={{ fontSize: { xs: 26, sm: 28 } }} />
                ) : (
                  <ShareRoundedIcon sx={{ fontSize: { xs: 26, sm: 28 } }} />
                )}
              </IconButton>

              {/* Queue button */}
              <IconButton
                size="medium"
                onClick={onOpenQueue}
                sx={{
                  color: 'text.secondary',
                  p: { xs: 1.25, sm: 1.5 },
                  '&:hover': {
                    color: 'text.primary',
                  },
                }}
              >
                <Badge
                  badgeContent={manualQueue.length > 0 ? manualQueue.length : null}
                  color="primary"
                  sx={{
                    '& .MuiBadge-badge': {
                      fontSize: '0.75rem',
                      height: 18,
                      minWidth: 18,
                      top: 4,
                      right: 4,
                    },
                  }}
                >
                  <QueueMusicRoundedIcon sx={{ fontSize: { xs: 26, sm: 28 } }} />
                </Badge>
              </IconButton>

              {/* Contained Volume when mouse detected */}
              {!isTouch && (
                <Stack
                  direction="row"
                  spacing={0.75}
                  sx={{
                    alignItems: 'center',
                    ml: { xs: 0.5, sm: 1 },
                  }}
                >
                  <IconButton
                    size="small"
                    onClick={onToggleMute}
                    sx={{
                      color: isMuted ? 'error.main' : 'text.secondary',
                      p: { xs: 0.5, sm: 0.75 },
                      position: 'relative',
                      zIndex: 2,
                      '&:hover': {
                        color: 'text.primary',
                      },
                    }}
                  >
                    <VolumeIconComponent sx={{ fontSize: { xs: 18, sm: 20 } }} />
                  </IconButton>
                  <Box
                    sx={{
                      width: { xs: 65, sm: 80, md: 95 },
                      display: 'flex',
                      alignItems: 'center',
                      px: 0.5,
                      position: 'relative',
                      zIndex: 1,
                    }}
                  >
                    <Slider
                      size="small"
                      value={effectiveVolume}
                      min={0}
                      max={100}
                      onChange={onVolumeChange}
                      sx={{
                        py: 0,
                        height: 3,
                        color: isMuted ? 'text.disabled' : 'primary.main',
                        '& .MuiSlider-thumb': {
                          width: 10,
                          height: 10,
                          zIndex: 1,
                        },
                      }}
                    />
                  </Box>
                </Stack>
              )}
            </Stack>
          </Box>

          {/* Main Playback Controls */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              maxWidth: { xs: '100%', sm: 480, md: 520 },
              mx: 'auto',
              px: { xs: 1, sm: 2 },
              mb: { xs: 3, sm: 3.5 },
            }}
          >
            {/* Shuffle */}
            <IconButton
              onClick={onToggleShuffle}
              size="medium"
              sx={{
                color: isShuffle ? 'primary.main' : 'text.secondary',
                p: { xs: 1.25, sm: 1.5 },
                '@media (hover: hover)': {
                  '&:hover': { color: isShuffle ? 'primary.main' : 'text.primary' },
                },
                '&:active': {
                  transform: 'scale(0.92)',
                },
              }}
            >
              <ShuffleRoundedIcon sx={{ fontSize: { xs: 26, sm: 30 } }} />
            </IconButton>

            {/* Skip Prev */}
            <IconButton
              onClick={handleSkipBackClick}
              size="medium"
              sx={{
                color: 'text.primary',
                p: { xs: 1.25, sm: 1.5 },
                '&:hover': { transform: 'scale(1.08)' },
                transition: 'transform 0.15s ease',
              }}
            >
              <SkipPreviousRoundedIcon sx={{ fontSize: { xs: 36, sm: 42 } }} />
            </IconButton>

            {/* Play / Pause */}
            <IconButton
              color="primary"
              onClick={onDirectTogglePlay}
              sx={{
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                p: { xs: 1.75, sm: 2.25 },
                boxShadow: '0 8px 24px rgba(144, 202, 249, 0.45)',
                '&:hover': {
                  bgcolor: 'primary.dark',
                  transform: 'scale(1.06)',
                },
                transition: 'all 0.2s ease',
              }}
            >
              {isPlaying ? (
                <PauseRoundedIcon sx={{ fontSize: { xs: 36, sm: 44 } }} />
              ) : (
                <PlayArrowRoundedIcon sx={{ fontSize: { xs: 36, sm: 44 } }} />
              )}
            </IconButton>

            {/* Skip Next */}
            <IconButton
              onClick={handleSkipForwardClick}
              size="medium"
              sx={{
                color: 'text.primary',
                p: { xs: 1.25, sm: 1.5 },
                '&:hover': { transform: 'scale(1.08)' },
                transition: 'transform 0.15s ease',
              }}
            >
              <SkipNextRoundedIcon sx={{ fontSize: { xs: 36, sm: 42 } }} />
            </IconButton>

            {/* Repeat */}
            <IconButton
              onClick={onCycleRepeat}
              size="medium"
              sx={{
                color: repeatMode !== 'off' ? 'primary.main' : 'text.secondary',
                p: { xs: 1.25, sm: 1.5 },
                '@media (hover: hover)': {
                  '&:hover': { color: repeatMode !== 'off' ? 'primary.main' : 'text.primary' },
                },
                '&:active': {
                  transform: 'scale(0.92)',
                },
              }}
            >
              {repeatMode === 'one' ? (
                <RepeatOneRoundedIcon sx={{ fontSize: { xs: 26, sm: 30 } }} />
              ) : (
                <RepeatRoundedIcon sx={{ fontSize: { xs: 26, sm: 30 } }} />
              )}
            </IconButton>
          </Box>

          {/* Scrubber Slider & Timers */}
          <Stack
            direction="row"
            spacing={{ xs: 1.5, sm: 2 }}
            sx={{
              alignItems: 'center',
              width: '100%',
              px: { xs: 0.5, sm: 1 },
              pt: { xs: 0.5, sm: 1 },
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                fontFamily: 'monospace',
                fontSize: { xs: '0.725rem', sm: '0.8rem' },
                minWidth: { xs: 36, sm: 40 },
                textAlign: 'right',
              }}
            >
              {formatTime(currentTime)}
            </Typography>

            <Slider
              value={currentTime}
              min={0}
              max={duration}
              onChange={(_, val) => {
                if (onSeek) onSeek(val)
              }}
              sx={{
                py: { xs: 1.25, sm: 1.5 },
                mx: { xs: 0.5, sm: 0.75 },
                height: 4,
                flexGrow: 1,
                '& .MuiSlider-thumb': {
                  width: { xs: 14, sm: 16 },
                  height: { xs: 14, sm: 16 },
                  '&:hover, &.Mui-focused, &.Mui-active': {
                    boxShadow: '0 0 0 8px rgba(144, 202, 249, 0.2)',
                  },
                },
                '& .MuiSlider-track': {
                  border: 'none',
                },
                '& .MuiSlider-rail': {
                  opacity: 0.25,
                },
              }}
            />

            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                fontFamily: 'monospace',
                fontSize: { xs: '0.725rem', sm: '0.8rem' },
                minWidth: { xs: 36, sm: 40 },
                textAlign: 'left',
              }}
            >
              {formatTime(duration)}
            </Typography>
          </Stack>
        </Box>

        {/* Bottom Control Area: 3-Column Fluid Layout for lg+ */}
        <Box
          sx={{
            display: { xs: 'none', lg: 'grid' },
            gridTemplateColumns: 'minmax(0, 1fr) auto minmax(0, 1fr)',
            alignItems: 'center',
            width: '100%',
            columnGap: { lg: 3, xl: 4 },
            position: 'relative',
            zIndex: 1,
            pb: { lg: 1, xl: 1.5 },
            flexShrink: 0,
          }}
        >
          {/* Left Column: Track Name, Artist & Quality Pill */}
          <Box
            sx={{
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                color: 'text.primary',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontSize: { lg: '1.35rem', xl: '1.55rem' },
                lineHeight: 1.2,
                pb: 0.5,
              }}
            >
              {playingTrack?.name || 'Untitled Track'}
            </Typography>

            <Stack
              direction="row"
              spacing={1}
              sx={{
                alignItems: 'center',
                minWidth: 0,
              }}
            >
              <Typography
                variant="subtitle1"
                sx={{
                  color: 'text.secondary',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontWeight: 500,
                  fontSize: { lg: '0.95rem', xl: '1.025rem' },
                  lineHeight: 1.2,
                }}
              >
                {playingTrack?.artist || 'Artist'}
              </Typography>

              <AudioQualityPill
                label={audioQualityLabel}
                size="large"
                isStuttering={isStuttering}
                onClick={onOpenQualityModal}
              />
            </Stack>
          </Box>

          {/* Middle Column: Centered Fixed Width Playback Controls & Scrubber */}
          <Stack
            spacing={{ lg: 1.25, xl: 1.75 }}
            sx={{
              alignItems: 'center',
              justifyContent: 'center',
              width: {
                lg: 'min(70dvw, calc(100dvh - 270px), 520px)',
                xl: 'min(70dvw, calc(100dvh - 270px), 600px)',
              },
              maxWidth: '100%',
              mx: 'auto',
            }}
          >
            {/* Playback Controls Row */}
            <Stack
              direction="row"
              spacing={{ lg: 2.5, xl: 3 }}
              sx={{
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                pb: 0.5,
              }}
            >
              {/* Shuffle */}
              <IconButton
                onClick={onToggleShuffle}
                size="small"
                sx={{
                  color: isShuffle ? 'primary.main' : 'text.secondary',
                  p: 0.8,
                  '@media (hover: hover)': {
                    '&:hover': { color: isShuffle ? 'primary.main' : 'text.primary' },
                  },
                  '&:active': {
                    transform: 'scale(0.92)',
                  },
                }}
              >
                <ShuffleRoundedIcon sx={{ fontSize: 22 }} />
              </IconButton>

              {/* Skip Prev */}
              <IconButton
                onClick={handleSkipBackClick}
                size="small"
                sx={{
                  color: 'text.primary',
                  p: 0.8,
                  '&:hover': { transform: 'scale(1.08)' },
                  transition: 'transform 0.15s ease',
                }}
              >
                <SkipPreviousRoundedIcon sx={{ fontSize: 32 }} />
              </IconButton>

              {/* Play / Pause */}
              <IconButton
                color="primary"
                onClick={onDirectTogglePlay}
                sx={{
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  p: 1.4,
                  boxShadow: '0 6px 20px rgba(144, 202, 249, 0.45)',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                    transform: 'scale(1.05)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                {isPlaying ? (
                  <PauseRoundedIcon sx={{ fontSize: 32 }} />
                ) : (
                  <PlayArrowRoundedIcon sx={{ fontSize: 32 }} />
                )}
              </IconButton>

              {/* Skip Next */}
              <IconButton
                onClick={handleSkipForwardClick}
                size="small"
                sx={{
                  color: 'text.primary',
                  p: 0.8,
                  '&:hover': { transform: 'scale(1.08)' },
                  transition: 'transform 0.15s ease',
                }}
              >
                <SkipNextRoundedIcon sx={{ fontSize: 32 }} />
              </IconButton>

              {/* Repeat */}
              <IconButton
                onClick={onCycleRepeat}
                size="small"
                sx={{
                  color: repeatMode !== 'off' ? 'primary.main' : 'text.secondary',
                  p: 0.8,
                  '@media (hover: hover)': {
                    '&:hover': { color: repeatMode !== 'off' ? 'primary.main' : 'text.primary' },
                  },
                  '&:active': {
                    transform: 'scale(0.92)',
                  },
                }}
              >
                {repeatMode === 'one' ? (
                  <RepeatOneRoundedIcon sx={{ fontSize: 22 }} />
                ) : (
                  <RepeatRoundedIcon sx={{ fontSize: 22 }} />
                )}
              </IconButton>
            </Stack>

            {/* Scrubber Slider & Timers */}
            <Stack
              direction="row"
              spacing={1.25}
              sx={{
                alignItems: 'center',
                width: '100%',
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  minWidth: 40,
                  textAlign: 'right',
                }}
              >
                {formatTime(currentTime)}
              </Typography>

              <Slider
                value={currentTime}
                min={0}
                max={duration}
                onChange={(_, val) => {
                  if (onSeek) onSeek(val)
                }}
                sx={{
                  py: 0.5,
                  mx: 1,
                  height: 4,
                  flexGrow: 1,
                  '& .MuiSlider-thumb': {
                    width: 12,
                    height: 12,
                    '&:hover, &.Mui-focused, &.Mui-active': {
                      boxShadow: '0 0 0 8px rgba(144, 202, 249, 0.2)',
                    },
                  },
                  '& .MuiSlider-track': {
                    border: 'none',
                  },
                  '& .MuiSlider-rail': {
                    opacity: 0.25,
                  },
                }}
              />

              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  minWidth: 40,
                  textAlign: 'left',
                }}
              >
                {formatTime(duration)}
              </Typography>
            </Stack>
          </Stack>

          {/* Right Column: Share, Queue, Volume */}
          <Stack
            direction="row"
            spacing={1}
            sx={{
              alignItems: 'center',
              justifyContent: 'flex-end',
              minWidth: 0,
            }}
          >
            {/* Share track button */}
            <IconButton
              onClick={onShareTrack}
              size="small"
              sx={{
                color: copiedShare ? 'success.main' : 'text.secondary',
                p: 1,
                '&:hover': {
                  color: 'text.primary',
                },
              }}
            >
              {copiedShare ? (
                <CheckRoundedIcon sx={{ fontSize: 22 }} />
              ) : (
                <ShareRoundedIcon sx={{ fontSize: 22 }} />
              )}
            </IconButton>

            {/* Queue button */}
            <IconButton
              size="small"
              onClick={onOpenQueue}
              sx={{
                color: 'text.secondary',
                p: 1,
                '&:hover': {
                  color: 'text.primary',
                },
              }}
            >
              <Badge
                badgeContent={manualQueue.length > 0 ? manualQueue.length : null}
                color="primary"
              >
                <QueueMusicRoundedIcon sx={{ fontSize: 22 }} />
              </Badge>
            </IconButton>

            {/* Contained Volume when mouse detected */}
            {!isTouch && (
              <Stack
                direction="row"
                spacing={0.75}
                sx={{
                  alignItems: 'center',
                  ml: 1,
                }}
              >
                <IconButton
                  size="small"
                  onClick={onToggleMute}
                  sx={{
                    color: isMuted ? 'error.main' : 'text.secondary',
                    p: 0.75,
                    position: 'relative',
                    zIndex: 2,
                    '&:hover': {
                      color: 'text.primary',
                    },
                  }}
                >
                  <VolumeIconComponent sx={{ fontSize: 20 }} />
                </IconButton>
                <Box
                  sx={{
                    width: 100,
                    display: 'flex',
                    alignItems: 'center',
                    px: 0.5,
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  <Slider
                    size="small"
                    value={effectiveVolume}
                    min={0}
                    max={100}
                    onChange={onVolumeChange}
                    sx={{
                      py: 0,
                      height: 3,
                      color: isMuted ? 'text.disabled' : 'primary.main',
                      '& .MuiSlider-thumb': {
                        width: 10,
                        height: 10,
                        zIndex: 1,
                      },
                    }}
                  />
                </Box>
              </Stack>
            )}
          </Stack>
        </Box>
      </Box>
    </Dialog>
  )
}
