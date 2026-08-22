'use client'

import { Box, Stack, Typography, IconButton, Slider } from '@mui/material'
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded'
import PauseRoundedIcon from '@mui/icons-material/PauseRounded'
import SkipNextRoundedIcon from '@mui/icons-material/SkipNextRounded'
import SkipPreviousRoundedIcon from '@mui/icons-material/SkipPreviousRounded'
import ShuffleRoundedIcon from '@mui/icons-material/ShuffleRounded'
import RepeatRoundedIcon from '@mui/icons-material/RepeatRounded'
import RepeatOneRoundedIcon from '@mui/icons-material/RepeatOneRounded'

/**
 * Transport controls (shuffle, prev, play/pause, next, repeat) and seek progress slider.
 *
 * @param {Object} props
 * @param {boolean} props.isPlaying - Playback state
 * @param {number} props.currentTime - Elapsed time in seconds
 * @param {number} props.duration - Track duration in seconds
 * @param {Function} props.formatTime - Formats seconds to mm:ss
 * @param {boolean} [props.isShuffle=false] - Shuffle state
 * @param {'off'|'all'|'one'} [props.repeatMode='off'] - Repeat mode
 * @param {Function} [props.onToggleShuffle] - Toggle shuffle
 * @param {Function} [props.onSkipPrev] - Skip to previous track or start
 * @param {Function} [props.onSkipNext] - Skip to next track
 * @param {Function} [props.onDirectTogglePlay] - Play/pause toggle
 * @param {Function} [props.onCycleRepeat] - Cycle repeat modes
 * @param {Function} [props.onSeek] - Seek time handler
 * @param {boolean} [props.isDesktop=false] - Desktop layout mode
 */
export default function FullScreenTransportControls({
  isPlaying,
  currentTime,
  duration,
  formatTime,
  isShuffle = false,
  repeatMode = 'off',
  onToggleShuffle,
  onSkipPrev,
  onSkipNext,
  onDirectTogglePlay,
  onCycleRepeat,
  onSeek,
  isDesktop = false,
}) {
  if (isDesktop) {
    return (
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
        {/* Desktop Controls Row */}
        <Stack
          direction='row'
          spacing={{ lg: 2.5, xl: 3 }}
          sx={{
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            pb: 0.5,
          }}
        >
          <IconButton
            onClick={onToggleShuffle}
            size='small'
            sx={{
              color: isShuffle ? 'primary.main' : 'text.secondary',
              p: 0.8,
              '@media (hover: hover)': {
                '&:hover': { color: isShuffle ? 'primary.main' : 'text.primary' },
              },
              '&:active': { transform: 'scale(0.92)' },
            }}
          >
            <ShuffleRoundedIcon sx={{ fontSize: 22 }} />
          </IconButton>

          <IconButton
            onClick={onSkipPrev}
            size='small'
            sx={{
              color: 'text.primary',
              p: 0.8,
              '&:hover': { transform: 'scale(1.08)' },
              transition: 'transform 0.15s ease',
            }}
          >
            <SkipPreviousRoundedIcon sx={{ fontSize: 32 }} />
          </IconButton>

          <IconButton
            color='primary'
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

          <IconButton
            onClick={onSkipNext}
            size='small'
            sx={{
              color: 'text.primary',
              p: 0.8,
              '&:hover': { transform: 'scale(1.08)' },
              transition: 'transform 0.15s ease',
            }}
          >
            <SkipNextRoundedIcon sx={{ fontSize: 32 }} />
          </IconButton>

          <IconButton
            onClick={onCycleRepeat}
            size='small'
            sx={{
              color: repeatMode !== 'off' ? 'primary.main' : 'text.secondary',
              p: 0.8,
              '@media (hover: hover)': {
                '&:hover': { color: repeatMode !== 'off' ? 'primary.main' : 'text.primary' },
              },
              '&:active': { transform: 'scale(0.92)' },
            }}
          >
            {repeatMode === 'one' ? (
              <RepeatOneRoundedIcon sx={{ fontSize: 22 }} />
            ) : (
              <RepeatRoundedIcon sx={{ fontSize: 22 }} />
            )}
          </IconButton>
        </Stack>

        {/* Desktop Scrubber Slider */}
        <Stack
          direction='row'
          spacing={1.25}
          sx={{
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Typography
            variant='caption'
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
              '& .MuiSlider-track': { border: 'none' },
              '& .MuiSlider-rail': { opacity: 0.25 },
            }}
          />

          <Typography
            variant='caption'
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
    )
  }

  // Mobile / Tablet Compact Stack
  return (
    <>
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
        <IconButton
          onClick={onToggleShuffle}
          size='medium'
          sx={{
            color: isShuffle ? 'primary.main' : 'text.secondary',
            p: { xs: 1.25, sm: 1.5 },
            '@media (hover: hover)': {
              '&:hover': { color: isShuffle ? 'primary.main' : 'text.primary' },
            },
            '&:active': { transform: 'scale(0.92)' },
          }}
        >
          <ShuffleRoundedIcon sx={{ fontSize: { xs: 26, sm: 30 } }} />
        </IconButton>

        <IconButton
          onClick={onSkipPrev}
          size='medium'
          sx={{
            color: 'text.primary',
            p: { xs: 1.25, sm: 1.5 },
            '&:hover': { transform: 'scale(1.08)' },
            transition: 'transform 0.15s ease',
          }}
        >
          <SkipPreviousRoundedIcon sx={{ fontSize: { xs: 36, sm: 42 } }} />
        </IconButton>

        <IconButton
          color='primary'
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

        <IconButton
          onClick={onSkipNext}
          size='medium'
          sx={{
            color: 'text.primary',
            p: { xs: 1.25, sm: 1.5 },
            '&:hover': { transform: 'scale(1.08)' },
            transition: 'transform 0.15s ease',
          }}
        >
          <SkipNextRoundedIcon sx={{ fontSize: { xs: 36, sm: 42 } }} />
        </IconButton>

        <IconButton
          onClick={onCycleRepeat}
          size='medium'
          sx={{
            color: repeatMode !== 'off' ? 'primary.main' : 'text.secondary',
            p: { xs: 1.25, sm: 1.5 },
            '@media (hover: hover)': {
              '&:hover': { color: repeatMode !== 'off' ? 'primary.main' : 'text.primary' },
            },
            '&:active': { transform: 'scale(0.92)' },
          }}
        >
          {repeatMode === 'one' ? (
            <RepeatOneRoundedIcon sx={{ fontSize: { xs: 26, sm: 30 } }} />
          ) : (
            <RepeatRoundedIcon sx={{ fontSize: { xs: 26, sm: 30 } }} />
          )}
        </IconButton>
      </Box>

      {/* Scrubber Slider */}
      <Stack
        direction='row'
        spacing={{ xs: 1.5, sm: 2 }}
        sx={{
          alignItems: 'center',
          width: '100%',
          px: { xs: 0.5, sm: 1 },
          pt: { xs: 0.5, sm: 1 },
        }}
      >
        <Typography
          variant='caption'
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
            '& .MuiSlider-track': { border: 'none' },
            '& .MuiSlider-rail': { opacity: 0.25 },
          }}
        />

        <Typography
          variant='caption'
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
    </>
  )
}
