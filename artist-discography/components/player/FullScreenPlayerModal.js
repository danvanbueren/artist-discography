'use client'

import { forwardRef } from 'react'
import {
  Box,
  Typography,
  IconButton,
  Slider,
  Stack,
  Badge,
  Dialog,
  Slide,
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
  isShuffle,
  repeatMode,
  isTouch,
  effectiveVolume,
  isMuted,
  copiedShare,
  manualQueue = [],
  autoplayTracks = [],
  onClosePlayer,
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
          sx: {
            bgcolor: playerBgColor,
            backgroundImage: 'none',
            color: 'text.primary',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            px: { xs: 2, sm: 4, md: 6, lg: 5, xl: 6 },
            py: { xs: 2, sm: 2.5, md: 3 },
            height: '100dvh',
            maxHeight: '100dvh',
            position: 'relative',
            overflow: 'hidden',
            boxSizing: 'border-box',
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
      {coverArt && (
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${coverArt})`,
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
            pt: { xs: 0.25, sm: 0.5 },
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
              '&:hover': {
                color: 'text.primary',
              },
            }}
          >
            <CloseRoundedIcon sx={{ fontSize: { xs: 22, sm: 26 } }} />
          </IconButton>

          {/* Center: Track Context Stack */}
          <Stack
            spacing={0.25}
            sx={{
              alignItems: 'center',
              textAlign: 'center',
              minWidth: 0,
              px: 1,
              flexGrow: 1,
            }}
          >
            <Typography
              variant="subtitle2"
              fontWeight={700}
              sx={{
                color: 'text.primary',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: { xs: 200, sm: 300, md: 450, lg: 600 },
                fontSize: { xs: '0.875rem', sm: '0.95rem' },
                lineHeight: 1.2,
              }}
            >
              {playingTrack?.project || 'Discography'}
            </Typography>

            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                fontWeight: 500,
                fontSize: { xs: '0.725rem', sm: '0.8rem' },
                lineHeight: 1.2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: { xs: 200, sm: 300, md: 450, lg: 600 },
              }}
            >
              {playingTrack?.projectArtist || playingTrack?.artist || 'Artist'}
            </Typography>
          </Stack>

          {/* Right: Down chevron collapse/minimize modal button */}
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
                xs: 'min(70dvw, calc(100dvh - 300px))',
                sm: 'min(70dvw, calc(100dvh - 310px))',
                md: 'min(70dvw, calc(100dvh - 320px), 480px)',
                lg: 'min(70dvw, calc(100dvh - 270px), 520px)',
                xl: 'min(70dvw, calc(100dvh - 270px), 580px)',
              },
              height: {
                xs: 'min(70dvw, calc(100dvh - 300px))',
                sm: 'min(70dvw, calc(100dvh - 310px))',
                md: 'min(70dvw, calc(100dvh - 320px), 480px)',
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
            pb: { xs: 1.5, sm: 2 },
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
              mb: { xs: 2, sm: 2.5 },
              gap: 1.5,
            }}
          >
            <Box sx={{ minWidth: 0, flexGrow: 1 }}>
              <Typography
                variant="h5"
                fontWeight={800}
                sx={{
                  color: 'text.primary',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontSize: { xs: '1.25rem', sm: '1.45rem', md: '1.65rem' },
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
                    fontSize: { xs: '0.9rem', sm: '1.025rem' },
                    lineHeight: 1.2,
                  }}
                >
                  {playingTrack?.artist || 'Artist'}
                </Typography>

                <AudioQualityPill
                  label={audioQualityLabel}
                  size="large"
                  onClick={onOpenQualityModal}
                />
              </Stack>
            </Box>

            {/* Right Action Icons */}
            <Stack
              direction="row"
              spacing={{ xs: 0.5, sm: 1 }}
              sx={{
                alignItems: 'center',
                flexShrink: 0,
              }}
            >
              {/* Share track */}
              <IconButton
                onClick={onShareTrack}
                size="small"
                sx={{
                  color: copiedShare ? 'success.main' : 'text.secondary',
                  p: { xs: 0.75, sm: 1 },
                  '&:hover': {
                    color: 'text.primary',
                  },
                }}
              >
                {copiedShare ? (
                  <CheckRoundedIcon sx={{ fontSize: { xs: 20, sm: 22 } }} />
                ) : (
                  <ShareRoundedIcon sx={{ fontSize: { xs: 20, sm: 22 } }} />
                )}
              </IconButton>

              {/* Queue button */}
              <IconButton
                size="small"
                onClick={onOpenQueue}
                sx={{
                  color: 'text.secondary',
                  p: { xs: 0.75, sm: 1 },
                  '&:hover': {
                    color: 'text.primary',
                  },
                }}
              >
                <Badge
                  badgeContent={manualQueue.length > 0 ? manualQueue.length : null}
                  color="primary"
                >
                  <QueueMusicRoundedIcon sx={{ fontSize: { xs: 20, sm: 22 } }} />
                </Badge>
              </IconButton>

              {/* Contained Volume when mouse detected */}
              {!isTouch && (
                <Stack
                  direction="row"
                  spacing={0.5}
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
              justifyContent: 'center',
              width: '100%',
              maxWidth: { xs: 320, sm: 400, md: 460 },
              mx: 'auto',
              px: { xs: 0, sm: 2 },
              gap: { xs: 1.5, sm: 2.5, md: 3 },
              mb: { xs: 2, sm: 2.5 },
            }}
          >
            {/* Shuffle */}
            <IconButton
              onClick={onToggleShuffle}
              size="small"
              sx={{
                color: isShuffle ? 'primary.main' : 'text.secondary',
                p: { xs: 0.6, sm: 1 },
                '&:hover': { color: 'text.primary' },
              }}
            >
              <ShuffleRoundedIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
            </IconButton>

            {/* Skip Prev */}
            <IconButton
              onClick={handleSkipBackClick}
              size="small"
              sx={{
                color: 'text.primary',
                p: { xs: 0.6, sm: 1 },
                '&:hover': { transform: 'scale(1.08)' },
                transition: 'transform 0.15s ease',
              }}
            >
              <SkipPreviousRoundedIcon sx={{ fontSize: { xs: 28, sm: 36 } }} />
            </IconButton>

            {/* Play / Pause */}
            <IconButton
              color="primary"
              onClick={onDirectTogglePlay}
              sx={{
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                p: { xs: 1.25, sm: 1.75 },
                boxShadow: '0 6px 20px rgba(144, 202, 249, 0.45)',
                '&:hover': {
                  bgcolor: 'primary.dark',
                  transform: 'scale(1.05)',
                },
                transition: 'all 0.2s ease',
              }}
            >
              {isPlaying ? (
                <PauseRoundedIcon sx={{ fontSize: { xs: 28, sm: 38 } }} />
              ) : (
                <PlayArrowRoundedIcon sx={{ fontSize: { xs: 28, sm: 38 } }} />
              )}
            </IconButton>

            {/* Skip Next */}
            <IconButton
              onClick={handleSkipForwardClick}
              size="small"
              sx={{
                color: 'text.primary',
                p: { xs: 0.6, sm: 1 },
                '&:hover': { transform: 'scale(1.08)' },
                transition: 'transform 0.15s ease',
              }}
            >
              <SkipNextRoundedIcon sx={{ fontSize: { xs: 28, sm: 36 } }} />
            </IconButton>

            {/* Repeat */}
            <IconButton
              onClick={onCycleRepeat}
              size="small"
              sx={{
                color: repeatMode !== 'off' ? 'primary.main' : 'text.secondary',
                p: { xs: 0.6, sm: 1 },
                '&:hover': { color: 'text.primary' },
              }}
            >
              {repeatMode === 'one' ? (
                <RepeatOneRoundedIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
              ) : (
                <RepeatRoundedIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
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
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                fontFamily: 'monospace',
                fontSize: { xs: '0.675rem', sm: '0.75rem' },
                minWidth: { xs: 34, sm: 38 },
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
                py: { xs: 0.75, sm: 1 },
                mx: { xs: 0.5, sm: 0.75 },
                height: 3,
                flexGrow: 1,
                '& .MuiSlider-thumb': {
                  width: { xs: 12, sm: 14 },
                  height: { xs: 12, sm: 14 },
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
                fontSize: { xs: '0.675rem', sm: '0.75rem' },
                minWidth: { xs: 34, sm: 38 },
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
              fontWeight={800}
              sx={{
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
                  '&:hover': { color: 'text.primary' },
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
                  '&:hover': { color: 'text.primary' },
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
                spacing={0.5}
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
