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
  Dialog,
  DialogTitle,
  DialogContent,
  Divider,
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
import DragIndicatorRoundedIcon from '@mui/icons-material/DragIndicatorRounded'
import { slugify } from '../lib/slugs'
import { getCookie, setCookie } from '../lib/cookies'

export default function AudioPlayerBar({
  playingTrack,
  isPlaying,
  onTogglePlay,
  onClosePlayer,
  queueCount = 0,
  manualQueue = [],
  autoplayTracks = [],
  onQueueDragDrop,
  onRemoveFromManualQueue,
  onRemoveFromAutoplay,
  onPlayQueuedTrack,
  onSkipNext,
  onSkipPrev,
  onShowToast,
  onNavigateToCurrentTrack,
}) {
  const theme = useTheme()
  const [currentTime, setCurrentTime] = useState(0)
  const [isShuffle, setIsShuffle] = useState(false)
  const [repeatMode, setRepeatMode] = useState('off') // 'off' | 'all' | 'one'
  const [volume, setVolume] = useState(100)
  const [prevVolume, setPrevVolume] = useState(100)
  const [isMuted, setIsMuted] = useState(false)
  const [copiedShare, setCopiedShare] = useState(false)
  const [queueOpen, setQueueOpen] = useState(false)
  const [draggedItem, setDraggedItem] = useState(null) // { listType: 'queue' | 'autoplay', index: number }
  const [dragOverItem, setDragOverItem] = useState(null) // { listType: 'queue' | 'autoplay', index: number }
  const audioRef = useRef(null)
  const [realDuration, setRealDuration] = useState(0)

  const handleDragStart = (e, listType, index) => {
    e.stopPropagation()
    setDraggedItem({ listType, index })
    e.dataTransfer.effectAllowed = 'move'
    try {
      e.dataTransfer.setData('text/plain', JSON.stringify({ listType, index }))
    } catch {}
  }

  const handleDragOver = (e, listType, index) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'move'
    if (!dragOverItem || dragOverItem.listType !== listType || dragOverItem.index !== index) {
      setDragOverItem({ listType, index })
    }
  }

  const handleDragLeave = (e, listType, index) => {
    e.stopPropagation()
    if (dragOverItem && dragOverItem.listType === listType && dragOverItem.index === index) {
      setDragOverItem(null)
    }
  }

  const handleDrop = (e, targetListType, targetIndex) => {
    e.preventDefault()
    e.stopPropagation()
    if (draggedItem && onQueueDragDrop) {
      onQueueDragDrop({
        fromList: draggedItem.listType,
        fromIndex: draggedItem.index,
        toList: targetListType,
        toIndex: targetIndex,
      })
    }
    setDraggedItem(null)
    setDragOverItem(null)
  }

  const handleDragEnd = (e) => {
    if (e && e.stopPropagation) e.stopPropagation()
    setDraggedItem(null)
    setDragOverItem(null)
  }

  // Load volume preference from cookie/localStorage on mount
  useEffect(() => {
    try {
      const savedVol = getCookie('audio_playback_volume') || localStorage.getItem('audio_playback_volume')
      if (savedVol !== null && !isNaN(Number(savedVol))) {
        const v = Math.min(100, Math.max(0, Number(savedVol)))
        setVolume(v)
        if (v > 0) setPrevVolume(v)
      } else {
        setVolume(100)
        setCookie('audio_playback_volume', '100')
        localStorage.setItem('audio_playback_volume', '100')
      }
    } catch {}
  }, [])

  const bgDefault = theme.palette.background.default
  const bgTransparent = alpha(bgDefault, 0)

  // Track duration in seconds
  const duration = realDuration || playingTrack?.durationSeconds || playingTrack?.duration || 215

  // Reset current time when track changes
  useEffect(() => {
    setCurrentTime(0)
    setRealDuration(0)
    if (audioRef.current) {
      audioRef.current.currentTime = 0
    }
  }, [playingTrack?.audioUrl, playingTrack?.name])

  // Sync playback state with audio element
  useEffect(() => {
    if (!audioRef.current) return
    if (isPlaying && playingTrack?.audioUrl) {
      const playPromise = audioRef.current.play()
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Audio playback interrupted:', err)
          if (onTogglePlay) onTogglePlay()
          if (onShowToast) onShowToast('Audio stream unavailable')
        })
      }
    } else {
      audioRef.current.pause()
    }
  }, [isPlaying, playingTrack?.audioUrl, onTogglePlay, onShowToast])

  // Sync volume with audio element
  useEffect(() => {
    if (audioRef.current) {
      const volVal = isMuted ? 0 : volume
      audioRef.current.volume = Math.min(1, Math.max(0, volVal / 100))
      audioRef.current.muted = isMuted
    }
  }, [volume, isMuted])

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
      const targetVol = prevVolume > 0 ? prevVolume : 100
      setVolume(targetVol)
      try {
        setCookie('audio_playback_volume', targetVol.toString())
        localStorage.setItem('audio_playback_volume', targetVol.toString())
      } catch {}
    } else {
      setPrevVolume(volume)
      setVolume(0)
      setIsMuted(true)
      try {
        setCookie('audio_playback_volume', '0')
        localStorage.setItem('audio_playback_volume', '0')
      } catch {}
    }
  }

  // Handle Volume Slider change
  const handleVolumeChange = (_, val) => {
    setVolume(val)
    try {
      setCookie('audio_playback_volume', val.toString())
      localStorage.setItem('audio_playback_volume', val.toString())
    } catch {}
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
                  width: { xs: '100%', sm: 'auto' },
                  maxWidth: { sm: 260, md: 300 },
                  flexShrink: 0,
                }}
              >
                {/* Col 1: Album Art */}
                <Tooltip title="Go to track page" arrow>
                  <Box
                    onClick={onNavigateToCurrentTrack}
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
                      cursor: 'pointer',
                      transition: 'transform 0.2s ease',
                      '&:hover': { transform: 'scale(1.06)' },
                    }}
                  >
                    {coverArt ? (
                      <Box
                        component="img"
                        src={coverArt}
                        alt={playingTrack.name || 'Cover'}
                        draggable={false}
                        sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <MusicNoteRoundedIcon fontSize="small" />
                    )}
                  </Box>
                </Tooltip>

                {/* Col 2: Track Name & Track Artist */}
                <Tooltip title="Go to track page" arrow>
                  <Box
                    onClick={onNavigateToCurrentTrack}
                    sx={{
                      minWidth: 0,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      '&:hover .track-title-text': { color: 'primary.main', textDecoration: 'underline' },
                    }}
                  >
                    <Typography
                      className="track-title-text"
                      variant="body2"
                      fontWeight={700}
                      noWrap
                      sx={{ fontSize: { xs: '0.85rem', sm: '0.9rem' }, transition: 'color 0.15s ease' }}
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
                </Tooltip>

                {/* Col 3: Share Button */}
                <Tooltip title="Share track link" arrow>
                  <IconButton
                    size="small"
                    onClick={handleShareTrack}
                    sx={{
                      color: copiedShare ? 'success.main' : 'text.secondary',
                      transition: 'color 0.2s ease',
                      flexShrink: 0,
                      p: 0.5,
                      ml: 0.5,
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
                  width: '100%',
                  px: { xs: 0, sm: 1.5, md: 2.5 },
                }}
              >
                {/* Row 1: Controls */}
                <Stack direction="row" spacing={{ xs: 1, sm: 1.5 }} sx={{ alignItems: 'center', justifyContent: 'center', width: '100%' }}>
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
                        const activeTime = audioRef.current ? audioRef.current.currentTime : currentTime
                        if (audioRef.current) {
                          audioRef.current.currentTime = 0
                        }
                        setCurrentTime(0)
                        if (activeTime <= 3 && onSkipPrev) {
                          onSkipPrev()
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
                      onClick={() => {
                        if (audioRef.current) {
                          audioRef.current.currentTime = 0
                        }
                        setCurrentTime(0)
                        if (onSkipNext) {
                          onSkipNext()
                        }
                      }}
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
                    sx={{ fontSize: '0.725rem', fontFamily: 'monospace', minWidth: 36, textAlign: 'right', px: 0.75 }}
                  >
                    {formatTime(currentTime)}
                  </Typography>

                  <Slider
                    size="small"
                    value={currentTime}
                    min={0}
                    max={duration}
                    onChange={(_, val) => {
                      setCurrentTime(val)
                      if (audioRef.current) {
                        audioRef.current.currentTime = val
                      }
                    }}
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
                    sx={{ fontSize: '0.725rem', fontFamily: 'monospace', minWidth: 36, px: 0.75 }}
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
                  width: { xs: '100%', sm: 'auto' },
                  justifyContent: 'flex-end',
                  flexShrink: 0,
                }}
              >
                {/* Col 1: View Queue */}
                <Tooltip title={manualQueue.length > 0 ? `Queue (${manualQueue.length} manual)` : 'View Queue (Autoplay active)'} arrow>
                  <IconButton
                    size="small"
                    onClick={() => setQueueOpen(true)}
                    sx={{ color: queueOpen ? 'primary.main' : 'text.secondary' }}
                  >
                    <Badge badgeContent={manualQueue.length > 0 ? manualQueue.length : null} color="primary">
                      <QueueMusicRoundedIcon fontSize="small" />
                    </Badge>
                  </IconButton>
                </Tooltip>

                {/* Queue Centered Modal */}
                <Dialog
                  open={queueOpen}
                  onClose={() => setQueueOpen(false)}
                  maxWidth="sm"
                  fullWidth
                  slotProps={{
                    paper: {
                      sx: {
                        borderRadius: 4,
                        p: 1,
                        bgcolor: 'background.paper',
                        backgroundImage: 'none',
                        boxShadow: '0 24px 48px rgba(0, 0, 0, 0.4)',
                        border: '1px solid',
                        borderColor: 'divider',
                      },
                    },
                  }}
                >
                  <DialogTitle
                    sx={{
                      m: 0,
                      p: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                      <QueueMusicRoundedIcon color="primary" />
                      <Typography variant="h6" fontWeight={800}>
                        Playback Queue
                      </Typography>
                    </Stack>
                    <IconButton
                      aria-label="close"
                      onClick={() => setQueueOpen(false)}
                      sx={{ color: 'text.secondary' }}
                    >
                      <CloseRoundedIcon />
                    </IconButton>
                  </DialogTitle>

                  <DialogContent dividers sx={{ p: 2, maxHeight: '60vh' }}>
                    {/* SECTION 1: QUEUE */}
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" fontWeight={700} color="primary.main" sx={{ mb: 1 }}>
                        Queue ({manualQueue.length})
                      </Typography>

                      {manualQueue.length === 0 ? (
                        <Paper
                          variant="outlined"
                          onDragOver={(e) => { e.preventDefault(); setDragOverItem({ listType: 'queue', index: 0 }); }}
                          onDrop={(e) => handleDrop(e, 'queue', 0)}
                          sx={{
                            p: 3,
                            textAlign: 'center',
                            borderRadius: 2,
                            bgcolor: 'action.hover',
                            borderStyle: dragOverItem?.listType === 'queue' ? 'dashed' : 'solid',
                            borderColor: dragOverItem?.listType === 'queue' ? 'primary.main' : 'divider',
                          }}
                        >
                          <Typography variant="body2" color="text.secondary" fontStyle="italic">
                            No tracks in queue. Click "+ Queue" on any track or drag a track here.
                          </Typography>
                        </Paper>
                      ) : (
                        <List disablePadding sx={{ maxHeight: 220, overflowY: 'auto' }}>
                          {manualQueue.map((item, idx) => (
                            <ListItem
                              key={idx}
                              draggable={true}
                              onDragStart={(e) => handleDragStart(e, 'queue', idx)}
                              onDragOver={(e) => handleDragOver(e, 'queue', idx)}
                              onDragLeave={(e) => handleDragLeave(e, 'queue', idx)}
                              onDrop={(e) => handleDrop(e, 'queue', idx)}
                              onDragEnd={handleDragEnd}
                              sx={{
                                borderRadius: 2,
                                mb: 1,
                                py: 1,
                                px: 1.5,
                                cursor: 'grab',
                                WebkitUserDrag: 'element',
                                userSelect: 'none',
                                transition: 'all 0.15s ease',
                                opacity: draggedItem?.listType === 'queue' && draggedItem?.index === idx ? 0.4 : 1,
                                bgcolor: dragOverItem?.listType === 'queue' && dragOverItem?.index === idx ? alpha(theme.palette.primary.main, 0.15) : 'action.hover',
                                border: dragOverItem?.listType === 'queue' && dragOverItem?.index === idx ? `1px dashed ${theme.palette.primary.main}` : '1px solid transparent',
                                '&:hover': { bgcolor: 'action.selected' },
                                '&:active': { cursor: 'grabbing' },
                              }}
                              secondaryAction={
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    if (onRemoveFromManualQueue) onRemoveFromManualQueue(idx)
                                  }}
                                >
                                  <DeleteOutlineRoundedIcon fontSize="small" />
                                </IconButton>
                              }
                            >
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  mr: 1.5,
                                  color: 'text.secondary',
                                  cursor: 'grab',
                                  userSelect: 'none',
                                }}
                              >
                                <DragIndicatorRoundedIcon />
                              </Box>
                              <ListItemText
                                primary={item.track?.name || `Track ${idx + 1}`}
                                secondary={item.project?.name || item.track?.artist || 'Artist'}
                                slotProps={{
                                  primary: { variant: 'body1', fontWeight: 600, noWrap: true },
                                  secondary: { variant: 'caption', noWrap: true },
                                }}
                                onClick={() => {
                                  if (onPlayQueuedTrack) onPlayQueuedTrack(item, idx, true)
                                  setQueueOpen(false)
                                }}
                                sx={{ cursor: 'pointer' }}
                              />
                            </ListItem>
                          ))}
                        </List>
                      )}
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    {/* SECTION 2: AUTOPLAY */}
                    <Box>
                      <Typography variant="subtitle1" fontWeight={700} color="text.secondary" sx={{ mb: 1 }}>
                        Autoplay
                      </Typography>

                      {autoplayTracks.length === 0 ? (
                        <Paper
                          variant="outlined"
                          onDragOver={(e) => { e.preventDefault(); setDragOverItem({ listType: 'autoplay', index: 0 }); }}
                          onDrop={(e) => handleDrop(e, 'autoplay', 0)}
                          sx={{
                            p: 2,
                            textAlign: 'center',
                            borderRadius: 2,
                            bgcolor: 'action.hover',
                            borderStyle: dragOverItem?.listType === 'autoplay' ? 'dashed' : 'solid',
                            borderColor: dragOverItem?.listType === 'autoplay' ? 'primary.main' : 'divider',
                          }}
                        >
                          <Typography variant="body2" color="text.secondary" fontStyle="italic">
                            No upcoming autoplay tracks. Drag a track here.
                          </Typography>
                        </Paper>
                      ) : (
                        <List disablePadding sx={{ maxHeight: 220, overflowY: 'auto' }}>
                          {autoplayTracks.map((item, idx) => (
                            <ListItem
                              key={idx}
                              draggable={true}
                              onDragStart={(e) => handleDragStart(e, 'autoplay', idx)}
                              onDragOver={(e) => handleDragOver(e, 'autoplay', idx)}
                              onDragLeave={(e) => handleDragLeave(e, 'autoplay', idx)}
                              onDrop={(e) => handleDrop(e, 'autoplay', idx)}
                              onDragEnd={handleDragEnd}
                              sx={{
                                borderRadius: 2,
                                mb: 0.75,
                                py: 0.75,
                                px: 1.5,
                                cursor: 'grab',
                                WebkitUserDrag: 'element',
                                userSelect: 'none',
                                transition: 'all 0.15s ease',
                                opacity: draggedItem?.listType === 'autoplay' && draggedItem?.index === idx ? 0.4 : 1,
                                bgcolor: dragOverItem?.listType === 'autoplay' && dragOverItem?.index === idx ? alpha(theme.palette.primary.main, 0.15) : 'action.hover',
                                border: dragOverItem?.listType === 'autoplay' && dragOverItem?.index === idx ? `1px dashed ${theme.palette.primary.main}` : '1px solid transparent',
                                '&:hover': { bgcolor: 'action.selected' },
                                '&:active': { cursor: 'grabbing' },
                              }}
                              secondaryAction={
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    if (onRemoveFromAutoplay) onRemoveFromAutoplay(idx)
                                  }}
                                >
                                  <DeleteOutlineRoundedIcon fontSize="small" />
                                </IconButton>
                              }
                            >
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  mr: 1.5,
                                  color: 'text.secondary',
                                  cursor: 'grab',
                                  userSelect: 'none',
                                }}
                              >
                                <DragIndicatorRoundedIcon />
                              </Box>
                              <ListItemText
                                primary={item.track?.name || `Track ${idx + 1}`}
                                secondary={item.project?.name || item.track?.artist || 'Artist'}
                                slotProps={{
                                  primary: { variant: 'body1', fontWeight: 600, noWrap: true },
                                  secondary: { variant: 'caption', noWrap: true },
                                }}
                                onClick={() => {
                                  if (onPlayQueuedTrack) onPlayQueuedTrack(item, idx, false)
                                  setQueueOpen(false)
                                }}
                                sx={{ cursor: 'pointer' }}
                              />
                            </ListItem>
                          ))}
                        </List>
                      )}
                    </Box>
                  </DialogContent>
                </Dialog>

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

            {/* Hidden HTML5 Audio Element */}
            <audio
              ref={audioRef}
              src={playingTrack?.audioUrl || undefined}
              preload="auto"
              onLoadedMetadata={(e) => {
                const d = e.currentTarget.duration
                if (d && !isNaN(d)) setRealDuration(d)
              }}
              onTimeUpdate={(e) => {
                setCurrentTime(e.currentTarget.currentTime)
              }}
              onEnded={() => {
                if (repeatMode === 'one') {
                  if (audioRef.current) {
                    audioRef.current.currentTime = 0
                    audioRef.current.play()
                  }
                } else if (repeatMode === 'all' || queueCount > 0) {
                  if (onSkipNext) onSkipNext()
                } else {
                  if (audioRef.current) {
                    audioRef.current.currentTime = 0
                  }
                  setCurrentTime(0)
                  if (onTogglePlay) onTogglePlay()
                }
              }}
              onError={() => {
                if (isPlaying && onShowToast) {
                  onShowToast(`Failed to load audio for "${playingTrack?.name || 'track'}"`)
                }
                if (onTogglePlay) onTogglePlay()
              }}
            />
          </Paper>
        </Container>
      </Box>
    </Collapse>
  )
}
