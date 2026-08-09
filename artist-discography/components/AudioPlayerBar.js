'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Box,
  Container,
  Paper,
  Typography,
  IconButton,
  Slider,
  Stack,
  Badge,
  Popover,
  List,
  ListItem,
  ListItemText,
  Tooltip,
  useTheme,
  Collapse,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded'
import PauseRoundedIcon from '@mui/icons-material/PauseRounded'
import SkipNextRoundedIcon from '@mui/icons-material/SkipNextRounded'
import SkipPreviousRoundedIcon from '@mui/icons-material/SkipPreviousRounded'
import ShuffleRoundedIcon from '@mui/icons-material/ShuffleRounded'
import RepeatRoundedIcon from '@mui/icons-material/RepeatRounded'
import RepeatOneRoundedIcon from '@mui/icons-material/RepeatOneRounded'
import VolumeUpRoundedIcon from '@mui/icons-material/VolumeUpRounded'
import VolumeDownRoundedIcon from '@mui/icons-material/VolumeDownRounded'
import VolumeOffRoundedIcon from '@mui/icons-material/VolumeOffRounded'
import QueueMusicRoundedIcon from '@mui/icons-material/QueueMusicRounded'
import ShareRoundedIcon from '@mui/icons-material/ShareRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import MusicNoteRoundedIcon from '@mui/icons-material/MusicNoteRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import { slugify } from '../lib/slugs'

export default function AudioPlayerBar({
  playingTrack,
  isPlaying,
  onTogglePlay,
  onClosePlayer,
  queueCount = 0,
  audioQueue = [],
  onRemoveFromQueue,
  onPlayQueuedTrack,
  onSkipNext,
  onSkipPrev,
  onShowToast,
}) {
  const theme = useTheme()
  const [currentTime, setCurrentTime] = useState(0)
  const [isShuffle, setIsShuffle] = useState(false)
  const [repeatMode, setRepeatMode] = useState('off') // 'off' | 'all' | 'one'
  const [volume, setVolume] = useState(85)
  const [prevVolume, setPrevVolume] = useState(85)
  const [isMuted, setIsMuted] = useState(false)
  const [copiedShare, setCopiedShare] = useState(false)
  const [queueAnchorEl, setQueueAnchorEl] = useState(null)

  const timerRef = useRef(null)

  const bgDefault = theme.palette.background.default
  const bgTransparent = alpha(bgDefault, 0)

  // Track duration in seconds (defaults to 215s / 3:35 if not supplied)
  const duration = playingTrack?.durationSeconds || playingTrack?.duration || 215

  // Reset current time when track changes
  useEffect(() => {
    setCurrentTime(0)
  }, [playingTrack?.name])

  // Playback timer ticker
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= duration) {
            if (repeatMode === 'one') {
              return 0
            } else if (repeatMode === 'all' || queueCount > 0) {
              if (onSkipNext) onSkipNext()
              return 0
            } else {
              if (onTogglePlay) onTogglePlay()
              return 0
            }
          }
          return prev + 1
        })
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isPlaying, duration, repeatMode, queueCount, onSkipNext, onTogglePlay])

  if (!playingTrack) return null

  // Time formatter MM:SS
  const formatTime = (secs) => {
    const totalSecs = Math.max(0, Math.floor(secs || 0))
    const m = Math.floor(totalSecs / 60)
    const s = totalSecs % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  // Handle Share button click
  const handleShareTrack = (e) => {
    e.stopPropagation()
    if (typeof window !== 'undefined' && playingTrack) {
      const projectSlug = slugify(playingTrack.project || '')
      const trackSlug = slugify(playingTrack.name || '')
      const shareUrl = `${window.location.origin}${projectSlug ? `/${projectSlug}` : ''}${trackSlug ? `/${trackSlug}` : ''}`
      try {
        navigator.clipboard.writeText(shareUrl)
        setCopiedShare(true)
        setTimeout(() => setCopiedShare(false), 2000)
        if (onShowToast) {
          onShowToast(`Copied share link to "${playingTrack.name || 'track'}"`)
        }
      } catch (err) {
        console.error('Failed to copy share URL:', err)
      }
    }
  }

  // Handle Volume Icon click (toggle mute)
  const handleToggleMute = () => {
    if (isMuted || volume === 0) {
      setIsMuted(false)
      const targetVol = prevVolume > 0 ? prevVolume : 85
      setVolume(targetVol)
    } else {
      setPrevVolume(volume)
      setVolume(0)
      setIsMuted(true)
    }
  }

  // Handle Volume Slider change
  const handleVolumeChange = (_, val) => {
    setVolume(val)
    if (val > 0 && isMuted) {
      setIsMuted(false)
    } else if (val === 0 && !isMuted) {
      setIsMuted(true)
    }
  }

  // Cycle repeat mode: off -> all -> one -> off
  const handleCycleRepeat = () => {
    setRepeatMode(prev => {
      if (prev === 'off') return 'all'
      if (prev === 'all') return 'one'
      return 'off'
    })
  }

  // Dynamic Volume Icon
  const effectiveVolume = isMuted ? 0 : volume
  let VolumeIconComponent = VolumeUpRoundedIcon
  if (effectiveVolume === 0) {
    VolumeIconComponent = VolumeOffRoundedIcon
  } else if (effectiveVolume < 50) {
    VolumeIconComponent = VolumeDownRoundedIcon
  }

  const coverArt = playingTrack.cover || playingTrack.image || playingTrack.projectCover

  return (
    <Collapse in={Boolean(playingTrack)} unmountOnExit>
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1200,
          pb: { xs: 1.5, sm: 2 },
          pt: { xs: 1.5, sm: 2 },
          pointerEvents: 'none',
        }}
      >
        {/* Single seamless backdrop mask: solid below & behind audio player, smoothly fading above */}
        <Box
          sx={{
            position: 'absolute',
            top: { xs: -48, sm: -64 },
            left: 0,
            right: 0,
            bottom: 0,
            background: {
              xs: `linear-gradient(to top, ${bgDefault} 0%, ${bgDefault} calc(100% - 48px), ${bgTransparent} 100%)`,
              sm: `linear-gradient(to top, ${bgDefault} 0%, ${bgDefault} calc(100% - 64px), ${bgTransparent} 100%)`,
            },
            zIndex: -1,
            pointerEvents: 'none',
            transition: 'background 0.3s ease',
          }}
        />

        <Container maxWidth="md" sx={{ pointerEvents: 'auto', px: { xs: 2, sm: 3 } }}>
          <Paper
            elevation={6}
            sx={{
              borderRadius: 4,
              py: { xs: 1.25, sm: 1.5 },
              px: { xs: 2, sm: 3 },
              minHeight: { xs: 72, sm: 80 },
              bgcolor: theme.palette.mode === 'dark'
                ? 'rgba(24, 24, 34, 0.95)'
                : 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid',
              borderColor: theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.12)'
                : 'rgba(0, 0, 0, 0.12)',
              boxShadow: '0 12px 36px rgba(0,0,0,0.35)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={{ xs: 1, sm: 2 }}
              sx={{ width: '100%', alignItems: 'center', justifyContent: 'space-between' }}
            >
              {/* === LEFT GROUP === */}
              {/* Col 1: Album Art | Col 2: Track Name & Artist | Col 3: Share Button */}
              <Stack
                direction="row"
                spacing={1.5}
                sx={{
                  alignItems: 'center',
                  minWidth: 0,
                  width: { xs: '100%', sm: 230, md: 270 },
                  justifyContent: 'space-between',
                }}
              >
                <Stack direction="row" spacing={1.5} sx={{ minWidth: 0, alignItems: 'center', flexGrow: 1 }}>
                  {/* Col 1: Album Art */}
                  <Box
                    sx={{
                      width: { xs: 40, sm: 46 },
                      height: { xs: 40, sm: 46 },
                      borderRadius: 2,
                      bgcolor: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'primary.contrastText',
                      flexShrink: 0,
                      overflow: 'hidden',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                    }}
                  >
                    {coverArt ? (
                      <Box
                        component="img"
                        src={coverArt}
                        alt={playingTrack.name || 'Cover'}
                        sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <MusicNoteRoundedIcon fontSize="small" />
                    )}
                  </Box>

                  {/* Col 2: Track Name & Track Artist */}
                  <Box sx={{ minWidth: 0, overflow: 'hidden' }}>
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      noWrap
                      sx={{ fontSize: { xs: '0.85rem', sm: '0.9rem' } }}
                    >
                      {playingTrack.name || 'Untitled Track'}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      noWrap
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.775rem' }, display: 'block' }}
                    >
                      {playingTrack.artist || 'Artist'}
                    </Typography>
                  </Box>
                </Stack>

                {/* Col 3: Share Button */}
                <Tooltip title="Share track link" arrow>
                  <IconButton
                    size="small"
                    onClick={handleShareTrack}
                    sx={{
                      color: copiedShare ? 'success.main' : 'text.secondary',
                      transition: 'color 0.2s ease',
                      flexShrink: 0,
                    }}
                  >
                    {copiedShare ? <CheckRoundedIcon fontSize="small" /> : <ShareRoundedIcon fontSize="small" />}
                  </IconButton>
                </Tooltip>
              </Stack>

              {/* === MIDDLE GROUP === */}
              {/* Row 1 (top): Shuffle, Skip Back, Play/Pause, Skip Forward, Repeat */}
              {/* Row 2 (bottom): Current Time, Scrubber Slider, Total Time */}
              <Stack
                spacing={0.5}
                sx={{
                  flexGrow: 1,
                  minWidth: 0,
                  width: { xs: '100%', sm: 'auto' },
                  maxWidth: { sm: 360, md: 420 },
                  alignItems: 'center',
                }}
              >
                {/* Row 1: Controls */}
                <Stack direction="row" spacing={{ xs: 1, sm: 1.5 }} sx={{ alignItems: 'center' }}>
                  {/* Shuffle */}
                  <Tooltip title={isShuffle ? 'Shuffle On' : 'Shuffle Off'} arrow>
                    <IconButton
                      size="small"
                      onClick={() => setIsShuffle(prev => !prev)}
                      sx={{
                        color: isShuffle ? 'primary.main' : 'text.secondary',
                        opacity: isShuffle ? 1 : 0.65,
                      }}
                    >
                      <ShuffleRoundedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>

                  {/* Skip Back */}
                  <Tooltip title="Previous" arrow>
                    <IconButton
                      size="small"
                      onClick={() => {
                        if (currentTime > 3) {
                          setCurrentTime(0)
                        } else if (onSkipPrev) {
                          onSkipPrev()
                        } else {
                          setCurrentTime(0)
                        }
                      }}
                      sx={{ color: 'text.primary' }}
                    >
                      <SkipPreviousRoundedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>

                  {/* Play/Pause */}
                  <IconButton
                    color="primary"
                    onClick={onTogglePlay}
                    sx={{
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      p: 0.9,
                      boxShadow: '0 4px 14px rgba(144, 202, 249, 0.4)',
                      '&:hover': { bgcolor: 'primary.dark', transform: 'scale(1.05)' },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {isPlaying ? (
                      <PauseRoundedIcon fontSize="small" />
                    ) : (
                      <PlayArrowRoundedIcon fontSize="small" />
                    )}
                  </IconButton>

                  {/* Skip Forward */}
                  <Tooltip title="Next" arrow>
                    <IconButton
                      size="small"
                      onClick={onSkipNext}
                      sx={{ color: 'text.primary' }}
                    >
                      <SkipNextRoundedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>

                  {/* Repeat */}
                  <Tooltip
                    title={
                      repeatMode === 'one'
                        ? 'Repeat One'
                        : repeatMode === 'all'
                        ? 'Repeat All'
                        : 'Repeat Off'
                    }
                    arrow
                  >
                    <IconButton
                      size="small"
                      onClick={handleCycleRepeat}
                      sx={{
                        color: repeatMode !== 'off' ? 'primary.main' : 'text.secondary',
                        opacity: repeatMode !== 'off' ? 1 : 0.65,
                      }}
                    >
                      {repeatMode === 'one' ? (
                        <RepeatOneRoundedIcon fontSize="small" />
                      ) : (
                        <RepeatRoundedIcon fontSize="small" />
                      )}
                    </IconButton>
                  </Tooltip>
                </Stack>

                {/* Row 2: Playback Scrubber Bar */}
                <Stack direction="row" spacing={1} sx={{ width: '100%', alignItems: 'center' }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontSize: '0.725rem', fontFamily: 'monospace', minWidth: 32, textAlign: 'right' }}
                  >
                    {formatTime(currentTime)}
                  </Typography>

                  <Slider
                    size="small"
                    value={currentTime}
                    min={0}
                    max={duration}
                    onChange={(_, val) => setCurrentTime(val)}
                    sx={{
                      py: 0.75,
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
                    sx={{ fontSize: '0.725rem', fontFamily: 'monospace', minWidth: 32 }}
                  >
                    {formatTime(duration)}
                  </Typography>
                </Stack>
              </Stack>

              {/* === RIGHT GROUP === */}
              {/* Col 1: View Queue | Col 2: Dynamic Volume Icon | Col 3: Volume Scrubber | Col 4: Exit */}
              <Stack
                direction="row"
                spacing={0.5}
                sx={{
                  alignItems: 'center',
                  width: { xs: '100%', sm: 220, md: 260 },
                  justifyContent: 'flex-end',
                }}
              >
                {/* Col 1: View Queue */}
                <Tooltip title="View Queue" arrow>
                  <IconButton
                    size="small"
                    onClick={(e) => setQueueAnchorEl(e.currentTarget)}
                    sx={{ color: queueAnchorEl ? 'primary.main' : 'text.secondary' }}
                  >
                    <Badge badgeContent={queueCount} color="primary">
                      <QueueMusicRoundedIcon fontSize="small" />
                    </Badge>
                  </IconButton>
                </Tooltip>

                {/* Queue Popover */}
                <Popover
                  open={Boolean(queueAnchorEl)}
                  anchorEl={queueAnchorEl}
                  onClose={() => setQueueAnchorEl(null)}
                  anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                  transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                  slotProps={{
                    paper: {
                      sx: {
                        width: 280,
                        maxHeight: 320,
                        p: 1.5,
                        borderRadius: 3,
                        bgcolor: 'background.paper',
                        boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
                      },
                    },
                  }}
                >
                  <Typography variant="subtitle2" fontWeight={700} sx={{ px: 1, pb: 1 }}>
                    Up Next ({audioQueue.length})
                  </Typography>
                  {audioQueue.length === 0 ? (
                    <Typography variant="caption" color="text.secondary" sx={{ px: 1, display: 'block' }}>
                      Queue is empty. Click "+ Queue" on any track to add it here.
                    </Typography>
                  ) : (
                    <List size="small" disablePadding sx={{ maxHeight: 240, overflowY: 'auto' }}>
                      {audioQueue.map((item, idx) => (
                        <ListItem
                          key={idx}
                          sx={{
                            borderRadius: 1.5,
                            mb: 0.5,
                            py: 0.5,
                            px: 1,
                            '&:hover': { bgcolor: 'action.hover' },
                          }}
                          secondaryAction={
                            <IconButton
                              size="small"
                              onClick={() => {
                                if (onRemoveFromQueue) onRemoveFromQueue(idx)
                              }}
                            >
                              <DeleteOutlineRoundedIcon fontSize="small" />
                            </IconButton>
                          }
                        >
                          <ListItemText
                            primary={item.track?.name || `Track ${idx + 1}`}
                            secondary={item.project?.name || item.track?.artist || 'Artist'}
                            slotProps={{
                              primary: { variant: 'body2', fontWeight: 600, noWrap: true },
                              secondary: { variant: 'caption', noWrap: true },
                            }}
                            onClick={() => {
                              if (onPlayQueuedTrack) onPlayQueuedTrack(item, idx)
                              setQueueAnchorEl(null)
                            }}
                            sx={{ cursor: 'pointer' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Popover>

                {/* Col 2: Dynamic Volume Icon */}
                <Tooltip title={isMuted ? 'Unmute' : 'Mute'} arrow>
                  <IconButton
                    size="small"
                    onClick={handleToggleMute}
                    sx={{ color: isMuted ? 'error.main' : 'text.secondary' }}
                  >
                    <VolumeIconComponent fontSize="small" />
                  </IconButton>
                </Tooltip>

                {/* Col 3: Volume Scrubber Input */}
                <Box sx={{ width: { xs: 60, sm: 70, md: 90 }, display: 'flex', alignItems: 'center', px: 0.5 }}>
                  <Slider
                    size="small"
                    value={effectiveVolume}
                    min={0}
                    max={100}
                    onChange={handleVolumeChange}
                    sx={{
                      py: 0.75,
                      height: 4,
                      color: isMuted ? 'text.disabled' : 'primary.main',
                      '& .MuiSlider-thumb': {
                        width: 10,
                        height: 10,
                        '&:hover, &.Mui-focused, &.Mui-active': {
                          boxShadow: 'none',
                        },
                      },
                    }}
                  />
                </Box>

                {/* Col 4: Exit / Stop Playback */}
                <Tooltip title="Close Player" arrow>
                  <IconButton
                    size="small"
                    onClick={onClosePlayer}
                    sx={{ color: 'text.secondary', ml: 0.5 }}
                  >
                    <CloseRoundedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>
          </Paper>
        </Container>
      </Box>
    </Collapse>
  )
}
