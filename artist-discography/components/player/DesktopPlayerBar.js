'use client'

import {
  Box,
  Typography,
  IconButton,
  Slider,
  Stack,
  Badge,
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
import FullscreenRoundedIcon from '@mui/icons-material/FullscreenRounded'
import ProgressiveImage from '../common/ProgressiveImage'
import AudioQualityPill from './AudioQualityPill'

/**
 * DesktopPlayerBar
 * 3-Column full playback controls bar for tablet and desktop viewports (sm+).
 */
export default function DesktopPlayerBar({
  playingTrack,
  coverArt,
  isPlaying,
  currentTime,
  duration,
  formatTime,
  audioQualityLabel,
  isStuttering = false,
  isShuffle,
  repeatMode,
  effectiveVolume,
  isMuted,
  copiedShare,
  manualQueue = [],
  autoplayTracks = [],
  onNavigateToCurrentTrack,
  onOpenQualityModal,
  onToggleShuffle,
  onSkipPrev,
  onSkipNext,
  onDirectTogglePlay,
  onCycleRepeat,
  onSeek,
  onShareTrack,
  onOpenQueue,
  onOpenFullScreen,
  onClosePlayer,
  onToggleMute,
  onVolumeChange,
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
    <Box
      sx={{
        display: { xs: 'none', sm: 'grid' },
        gridTemplateColumns: 'minmax(0, 1fr) auto minmax(0, 1fr)',
        alignItems: 'center',
        width: '100%',
        columnGap: { sm: 2, md: 3 },
      }}
    >
      {/* === LEFT GROUP === */}
      {/* Unified Cover Art + Title + Artist Clickable Area */}
      <Stack
        direction="row"
        spacing={1.25}
        sx={{
          alignItems: 'center',
          minWidth: 0,
          width: '100%',
        }}
      >
        <Box
          onClick={onNavigateToCurrentTrack}
          sx={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 1.25,
            minWidth: 0,
            flexGrow: 1,
            cursor: 'pointer',
            py: 0.5,
            px: 0.5,
            borderRadius: 2,
            transition: 'background-color 0.15s ease',
            '&:hover .cover-art-box': {
              transform: 'scale(1.05)',
              boxShadow: '0 6px 18px rgba(0,0,0,0.4)',
            },
            '&:hover .track-title-text': {
              color: 'primary.main',
              textDecoration: 'underline',
            },
            '&:hover .track-artist-text': {
              color: 'text.primary',
            },
          }}
        >
          {/* Cover Art Box */}
          <Box
            className="cover-art-box"
            sx={{
              width: { xs: 52, sm: 58 },
              height: { xs: 52, sm: 58 },
              aspectRatio: '1 / 1',
              borderRadius: 2.5,
              bgcolor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'primary.contrastText',
              flexShrink: 0,
              overflow: 'hidden',
              boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }}
          >
            {coverArt ? (
              <ProgressiveImage
                src={coverArt}
                alt={playingTrack?.name || 'Cover'}
                targetWidth={120}
                placeholderWidth={32}
                priority
                sx={{
                  width: '100%',
                  height: '100%',
                }}
              />
            ) : (
              <MusicNoteRoundedIcon fontSize="small" />
            )}
          </Box>

          {/* Title & Artist Stack */}
          <Stack
            spacing={0.5}
            sx={{
              minWidth: 0,
              flexGrow: 1,
              justifyContent: 'center',
            }}
          >
            <Typography
              className="track-title-text"
              variant="subtitle1"
              fontWeight={700}
              sx={{
                fontSize: { xs: '0.95rem', sm: '1.05rem' },
                lineHeight: 1.2,
                color: 'text.primary',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                minWidth: 0,
                transition: 'color 0.15s ease',
              }}
            >
              {playingTrack?.name || 'Untitled Track'}
            </Typography>

            <Typography
              className="track-artist-text"
              variant="caption"
              color="text.secondary"
              sx={{
                fontSize: { xs: '0.775rem', sm: '0.85rem' },
                lineHeight: 1.2,
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                minWidth: 0,
                transition: 'color 0.15s ease',
              }}
            >
              {playingTrack?.artist || 'Artist'}
            </Typography>

            {/* Audio Quality Pill */}
            <AudioQualityPill
              label={audioQualityLabel}
              size="medium"
              isStuttering={isStuttering}
              onClick={onOpenQualityModal}
            />
          </Stack>
        </Box>
      </Stack>

      {/* === MIDDLE GROUP === */}
      {/* Row 1 (top): Controls | Row 2 (bottom): Scrubber Slider */}
      <Stack
        spacing={0.5}
        sx={{
          width: { sm: 230, md: 280, lg: 320 },
          mx: 'auto',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {/* Row 1: Controls (Height: 40px) */}
        <Stack
          direction="row"
          spacing={{ xs: 1, sm: 1.5 }}
          sx={{
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: 40,
          }}
        >
          {/* Shuffle */}
          <IconButton
            size="small"
            onClick={onToggleShuffle}
            sx={{
              color: isShuffle ? 'primary.main' : 'text.primary',
              p: 0.8,
            }}
          >
            <ShuffleRoundedIcon fontSize="small" />
          </IconButton>

          {/* Skip Back */}
          <IconButton
            size="small"
            onClick={handleSkipBackClick}
            sx={{
              color: 'text.primary',
              p: 0.8,
            }}
          >
            <SkipPreviousRoundedIcon fontSize="small" />
          </IconButton>

          {/* Play/Pause */}
          <IconButton
            color="primary"
            onClick={onDirectTogglePlay}
            sx={{
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              p: 1.1,
              boxShadow: '0 4px 14px rgba(144, 202, 249, 0.4)',
              '&:hover': {
                bgcolor: 'primary.dark',
                transform: 'scale(1.05)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            {isPlaying ? (
              <PauseRoundedIcon fontSize="medium" />
            ) : (
              <PlayArrowRoundedIcon fontSize="medium" />
            )}
          </IconButton>

          {/* Skip Forward */}
          <IconButton
            size="small"
            onClick={handleSkipForwardClick}
            sx={{
              color: 'text.primary',
              p: 0.8,
            }}
          >
            <SkipNextRoundedIcon fontSize="small" />
          </IconButton>

          {/* Repeat */}
          <IconButton
            size="small"
            onClick={onCycleRepeat}
            sx={{
              color: repeatMode !== 'off' ? 'primary.main' : 'text.primary',
              p: 0.8,
            }}
          >
            {repeatMode === 'one' ? (
              <RepeatOneRoundedIcon fontSize="small" />
            ) : (
              <RepeatRoundedIcon fontSize="small" />
            )}
          </IconButton>
        </Stack>

        {/* Row 2: Playback Scrubber Bar (Height: 24px) */}
        <Stack
          direction="row"
          spacing={1}
          sx={{
            width: '100%',
            alignItems: 'center',
            height: 24,
          }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              fontSize: '0.725rem',
              fontFamily: 'monospace',
              minWidth: 36,
              textAlign: 'right',
              px: 0.75,
              lineHeight: 1,
            }}
          >
            {formatTime(currentTime)}
          </Typography>

          <Slider
            size="small"
            value={currentTime}
            min={0}
            max={duration}
            onChange={(_, val) => {
              if (onSeek) onSeek(val)
            }}
            sx={{
              py: 0,
              flexGrow: 1,
              height: 4,
              '& .MuiSlider-thumb': {
                width: 12,
                height: 12,
                '&:hover, &.Mui-focused, &.Mui-active': {
                  boxShadow: '0 0 0 8px rgba(144, 202, 249, 0.16)',
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
            color="text.secondary"
            sx={{
              fontSize: '0.725rem',
              fontFamily: 'monospace',
              minWidth: 36,
              px: 0.75,
              lineHeight: 1,
            }}
          >
            {formatTime(duration)}
          </Typography>
        </Stack>
      </Stack>

      {/* === RIGHT GROUP === */}
      {/* Row 1 (top): Action Icons | Row 2 (bottom): Volume */}
      <Stack
        spacing={0.5}
        sx={{
          alignItems: 'flex-end',
          justifyContent: 'center',
          minWidth: 0,
          width: '100%',
          pr: 0.5,
        }}
      >
        {/* Row 1: Action Icons */}
        <Stack
          direction="row"
          spacing={0.5}
          sx={{
            alignItems: 'center',
            justifyContent: 'flex-end',
            height: 40,
            width: '100%',
          }}
        >
          {/* Share track */}
          <IconButton
            size="small"
            onClick={onShareTrack}
            sx={{
              color: copiedShare ? 'success.main' : 'text.secondary',
              transition: 'color 0.2s ease',
              p: 0.8,
              '&:hover': {
                color: 'text.primary',
              },
            }}
          >
            {copiedShare ? (
              <CheckRoundedIcon fontSize="small" />
            ) : (
              <ShareRoundedIcon fontSize="small" />
            )}
          </IconButton>

          {/* View Queue */}
          <IconButton
            size="small"
            onClick={onOpenQueue}
            sx={{
              color: 'text.secondary',
              p: 0.8,
              '&:hover': {
                color: 'text.primary',
              },
            }}
          >
            <Badge
              badgeContent={manualQueue.length > 0 ? manualQueue.length : null}
              color="primary"
            >
              <QueueMusicRoundedIcon fontSize="small" />
            </Badge>
          </IconButton>

          {/* Fullscreen Button */}
          <IconButton
            size="small"
            onClick={onOpenFullScreen}
            sx={{
              color: 'text.secondary',
              p: 0.8,
              '&:hover': {
                color: 'text.primary',
              },
            }}
          >
            <FullscreenRoundedIcon fontSize="small" />
          </IconButton>

          {/* Close Player */}
          <IconButton
            size="small"
            onClick={onClosePlayer}
            sx={{
              color: 'text.secondary',
              p: 0.8,
              '&:hover': {
                color: 'error.main',
              },
            }}
          >
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </Stack>

        {/* Row 2: Volume Icon + Slider */}
        <Stack
          direction="row"
          spacing={0.75}
          sx={{
            alignItems: 'center',
            justifyContent: 'flex-end',
            height: 24,
            width: '100%',
          }}
        >
          <IconButton
            size="small"
            onClick={onToggleMute}
            sx={{
              color: isMuted ? 'error.main' : 'text.secondary',
              p: 0.8,
              position: 'relative',
              zIndex: 2,
              '&:hover': {
                color: 'text.primary',
              },
            }}
          >
            <VolumeIconComponent fontSize="small" />
          </IconButton>

          <Box
            sx={{
              width: { sm: 95, md: 102 },
              display: 'flex',
              alignItems: 'center',
              px: 0.75,
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
                height: 4,
                color: isMuted ? 'text.disabled' : 'primary.main',
                '& .MuiSlider-thumb': {
                  width: 10,
                  height: 10,
                  zIndex: 1,
                  '&:hover, &.Mui-focused, &.Mui-active': {
                    boxShadow: 'none',
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
          </Box>
        </Stack>
      </Stack>
    </Box>
  )
}
