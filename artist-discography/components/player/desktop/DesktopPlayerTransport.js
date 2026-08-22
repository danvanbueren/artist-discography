'use client'

import { Stack, IconButton, Typography, Slider } from '@mui/material'
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded'
import PauseRoundedIcon from '@mui/icons-material/PauseRounded'
import SkipNextRoundedIcon from '@mui/icons-material/SkipNextRounded'
import SkipPreviousRoundedIcon from '@mui/icons-material/SkipPreviousRounded'
import ShuffleRoundedIcon from '@mui/icons-material/ShuffleRounded'
import RepeatRoundedIcon from '@mui/icons-material/RepeatRounded'
import RepeatOneRoundedIcon from '@mui/icons-material/RepeatOneRounded'

/**
 * Center Column of DesktopPlayerBar: Transport buttons and progress scrubber slider.
 *
 * @param {Object} props
 * @param {boolean} props.isPlaying - Playback state
 * @param {number} props.currentTime - Current time in seconds
 * @param {number} props.duration - Duration in seconds
 * @param {Function} props.formatTime - Formats seconds to mm:ss
 * @param {boolean} [props.isShuffle=false] - Shuffle state
 * @param {'off'|'all'|'one'} [props.repeatMode='off'] - Repeat mode
 * @param {Function} [props.onToggleShuffle] - Toggle shuffle
 * @param {Function} [props.onSkipPrev] - Skip previous
 * @param {Function} [props.onSkipNext] - Skip next
 * @param {Function} [props.onDirectTogglePlay] - Play/pause toggle
 * @param {Function} [props.onCycleRepeat] - Cycle repeat mode
 * @param {Function} [props.onSeek] - Seek progress handler
 */
export default function DesktopPlayerTransport({
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
}) {
  return (
    <Stack
      spacing={0.8}
      sx={{
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        minWidth: { sm: 230, md: 320 },
        maxWidth: { sm: 380, md: 480, lg: 560 },
        mx: 'auto',
      }}
    >
      {/* Top Controls Row */}
      <Stack
        direction='row'
        spacing={{ sm: 1.5, md: 2 }}
        sx={{
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Shuffle */}
        <IconButton
          onClick={onToggleShuffle}
          size='small'
          sx={{
            color: isShuffle ? 'primary.main' : 'text.secondary',
            p: 0.75,
            '@media (hover: hover)': {
              '&:hover': { color: isShuffle ? 'primary.main' : 'text.primary' },
            },
            '&:active': { transform: 'scale(0.92)' },
          }}
        >
          <ShuffleRoundedIcon sx={{ fontSize: 24 }} />
        </IconButton>

        {/* Skip Prev */}
        <IconButton
          onClick={onSkipPrev}
          size='small'
          sx={{
            color: 'text.primary',
            p: 0.75,
            '&:hover': { transform: 'scale(1.08)' },
            transition: 'transform 0.15s ease',
          }}
        >
          <SkipPreviousRoundedIcon sx={{ fontSize: 24 }} />
        </IconButton>

        {/* Play / Pause */}
        <IconButton
          color='primary'
          onClick={onDirectTogglePlay}
          sx={{
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            p: { sm: 0.9, md: 1.1 },
            boxShadow: '0 4px 14px rgba(144, 202, 249, 0.4)',
            '&:hover': {
              bgcolor: 'primary.dark',
              transform: 'scale(1.06)',
            },
            transition: 'all 0.15s ease',
          }}
        >
          {isPlaying ? (
            <PauseRoundedIcon sx={{ fontSize: { sm: 22, md: 26 } }} />
          ) : (
            <PlayArrowRoundedIcon sx={{ fontSize: { sm: 22, md: 26 } }} />
          )}
        </IconButton>

        {/* Skip Next */}
        <IconButton
          onClick={onSkipNext}
          size='small'
          sx={{
            color: 'text.primary',
            p: 0.75,
            '&:hover': { transform: 'scale(1.08)' },
            transition: 'transform 0.15s ease',
          }}
        >
          <SkipNextRoundedIcon sx={{ fontSize: 24 }} />
        </IconButton>

        {/* Repeat */}
        <IconButton
          onClick={onCycleRepeat}
          size='small'
          sx={{
            color: repeatMode !== 'off' ? 'primary.main' : 'text.secondary',
            p: 0.75,
            '@media (hover: hover)': {
              '&:hover': { color: repeatMode !== 'off' ? 'primary.main' : 'text.primary' },
            },
            '&:active': { transform: 'scale(0.92)' },
          }}
        >
          {repeatMode === 'one' ? (
            <RepeatOneRoundedIcon sx={{ fontSize: 24 }} />
          ) : (
            <RepeatRoundedIcon sx={{ fontSize: 24 }} />
          )}
        </IconButton>
      </Stack>

      {/* Progress Bar & Timers */}
      <Stack
        direction='row'
        spacing={1}
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
            fontSize: '0.725rem',
            minWidth: 36,
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
            mx: 0.5,
            height: 4,
            flexGrow: 1,
            '& .MuiSlider-thumb': {
              width: 10,
              height: 10,
              '&:hover, &.Mui-focused, &.Mui-active': {
                boxShadow: '0 0 0 6px rgba(144, 202, 249, 0.2)',
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
            fontSize: '0.725rem',
            minWidth: 36,
            textAlign: 'left',
          }}
        >
          {formatTime(duration)}
        </Typography>
      </Stack>
    </Stack>
  )
}
