'use client'

import {
  Box,
  Typography,
  IconButton,
  Stack,
  useTheme,
} from '@mui/material'
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded'
import PauseRoundedIcon from '@mui/icons-material/PauseRounded'
import ShareRoundedIcon from '@mui/icons-material/ShareRounded'
import MusicNoteRoundedIcon from '@mui/icons-material/MusicNoteRounded'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import ProgressiveImage from '../common/ProgressiveImage'
import AudioQualityPill from './AudioQualityPill'

/**
 * MobileMiniPlayer
 * Single compact row rendered on small screens (xs).
 * Tapping opens the full-screen modal player.
 */
export default function MobileMiniPlayer({
  playingTrack,
  coverArt,
  isPlaying,
  copiedShare,
  currentTime,
  duration,
  audioQualityLabel,
  isStuttering = false,
  onOpenFullScreen,
  onShareTrack,
  onDirectTogglePlay,
}) {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const progressPercent = Math.min(100, Math.max(0, (currentTime / (duration || 1)) * 100))

  return (
    <>
      <Box
        onClick={onOpenFullScreen}
        sx={{
          display: { xs: 'flex', sm: 'none' },
          alignItems: 'center',
          width: '100%',
          pb: 0.5,
          cursor: 'pointer',
        }}
      >
        {/* 1. Album Art Thumbnail */}
        <Box
          sx={{
            width: 44,
            height: 44,
            aspectRatio: '1 / 1',
            borderRadius: 2,
            bgcolor: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'primary.contrastText',
            flexShrink: 0,
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
          }}
        >
          {coverArt ? (
            <ProgressiveImage
              src={coverArt}
              alt={playingTrack?.name || 'Cover'}
              targetWidth={100}
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

        {/* 2. Track Name and Artist Stacked */}
        <Stack
          spacing={0.25}
          sx={{
            ml: 1.25,
            minWidth: 0,
            flexShrink: 1,
            justifyContent: 'center',
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 700,
              fontSize: '0.875rem',
              lineHeight: 1.2,
              color: 'text.primary',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {playingTrack?.name || 'Untitled Track'}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              fontSize: '0.75rem',
              lineHeight: 1.2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {playingTrack?.artist || 'Artist'}
          </Typography>
          {/* Audio Quality Pill */}
          <AudioQualityPill
            label={audioQualityLabel}
            size="small"
            isStuttering={isStuttering}
          />
        </Stack>

        {/* 3. Auto-filled gap to push controls to the right */}
        <Box sx={{ flexGrow: 1 }} />

        {/* 4. Copy track link share button */}
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation()
            if (onShareTrack) onShareTrack(e)
          }}
          sx={{
            color: copiedShare ? 'success.main' : 'text.secondary',
            transition: 'color 0.2s ease',
            p: 0.9,
            flexShrink: 0,
          }}
        >
          {copiedShare ? (
            <CheckRoundedIcon fontSize="small" />
          ) : (
            <ShareRoundedIcon fontSize="small" />
          )}
        </IconButton>

        {/* 5. Play / Pause Button */}
        <IconButton
          color="primary"
          onClick={(e) => {
            e.stopPropagation()
            if (onDirectTogglePlay) onDirectTogglePlay()
          }}
          sx={{
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            p: 0.9,
            ml: 0.5,
            flexShrink: 0,
            boxShadow: '0 4px 12px rgba(144, 202, 249, 0.35)',
            '&:hover': { bgcolor: 'primary.dark' },
          }}
        >
          {isPlaying ? (
            <PauseRoundedIcon fontSize="small" />
          ) : (
            <PlayArrowRoundedIcon fontSize="small" />
          )}
        </IconButton>
      </Box>

      {/* Read-Only Bottom Progress Line for Mobile */}
      <Box
        sx={{
          display: { xs: 'block', sm: 'none' },
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 3,
          bgcolor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
        }}
      >
        <Box
          sx={{
            height: '100%',
            width: `${progressPercent}%`,
            bgcolor: 'primary.main',
            transition: 'width 0.15s linear',
          }}
        />
      </Box>
    </>
  )
}
