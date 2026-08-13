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
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import { slugify } from '../lib/slugs'
import { getCookie, setCookie } from '../lib/cookies'
import PlaybackQueueDialog from './PlaybackQueueDialog'

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
  isShuffle = false,
  onToggleShuffle,
}) {
  const theme = useTheme()
  const [currentTime, setCurrentTime] = useState(0)
  const [repeatMode, setRepeatMode] = useState('off') // 'off' | 'all' | 'one'
  const [volume, setVolume] = useState(100)
  const [prevVolume, setPrevVolume] = useState(100)
  const [isMuted, setIsMuted] = useState(false)
  const [copiedShare, setCopiedShare] = useState(false)
  const [queueOpen, setQueueOpen] = useState(false)
  const audioRef = useRef(null)
  const [realDuration, setRealDuration] = useState(0)

  // Load volume & mute preference from cookie/localStorage on mount
  useEffect(() => {
    try {
      const savedVol = getCookie('audio_playback_volume') || localStorage.getItem('audio_playback_volume')
      const savedMuted = getCookie('audio_playback_muted') || localStorage.getItem('audio_playback_muted')
      const savedPrevVol = getCookie('audio_playback_prev_volume') || localStorage.getItem('audio_playback_prev_volume')

      let v = 100
      if (savedVol !== null && !isNaN(Number(savedVol))) {
        v = Math.min(100, Math.max(0, Number(savedVol)))
      }

      let pV = 80
      if (savedPrevVol !== null && !isNaN(Number(savedPrevVol)) && Number(savedPrevVol) >= 30) {
        pV = Math.min(100, Math.max(30, Number(savedPrevVol)))
      } else if (v >= 30) {
        pV = v
      }

      const muted = savedMuted === 'true' || (savedMuted === null && v === 0)

      setVolume(v)
      setPrevVolume(pV)
      setIsMuted(muted)
    } catch {}
  }, [])

  const bgDefault = theme.palette.background.default
  const bgTransparent = alpha(bgDefault, 0)

  // Track duration in seconds
  const duration = realDuration || playingTrack?.durationSeconds || playingTrack?.duration || 215

  // Reset current time ONLY when playing track actually changes
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
      if (audioRef.current.paused) {
        const playPromise = audioRef.current.play()
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn('Audio playback interrupted:', err)
            if (onTogglePlay) onTogglePlay()
            if (onShowToast) onShowToast('Audio stream unavailable')
          })
        }
      }
    } else {
      if (!audioRef.current.paused) {
        audioRef.current.pause()
      }
    }
  }, [isPlaying, playingTrack?.audioUrl, onTogglePlay, onShowToast])

  // Keep ref for onTogglePlay to avoid re-subscribing keydown listener on render
  const onTogglePlayRef = useRef(onTogglePlay)
  onTogglePlayRef.current = onTogglePlay

  // Direct synchronous toggle for zero-latency audio playback response
  const handleDirectTogglePlay = () => {
    if (audioRef.current) {
      if (audioRef.current.paused) {
        const playPromise = audioRef.current.play()
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn('Audio playback interrupted:', err)
          })
        }
      } else {
        audioRef.current.pause()
      }
    }
    if (onTogglePlayRef.current) {
      onTogglePlayRef.current()
    }
  }

  // Sync volume with audio element
  useEffect(() => {
    if (audioRef.current) {
      const volVal = isMuted ? 0 : volume
      audioRef.current.volume = Math.min(1, Math.max(0, volVal / 100))
      audioRef.current.muted = isMuted
    }
  }, [volume, isMuted])

  // Global spacebar listener to toggle play/pause when audio player is active
  useEffect(() => {
    if (!playingTrack) return

    const handleKeyDown = (e) => {
      if (e.code === 'Space' || e.key === ' ' || e.key === 'Spacebar' || e.keyCode === 32) {
        const target = e.target || document.activeElement
        let isTextEditField = false

        if (target) {
          if (target.isContentEditable) {
            isTextEditField = true
          } else {
            const tagName = target.tagName
            if (tagName === 'TEXTAREA') {
              isTextEditField = true
            } else if (tagName === 'INPUT') {
              const type = (target.type || 'text').toLowerCase()
              const nonTextTypes = ['range', 'checkbox', 'radio', 'button', 'submit', 'reset', 'color', 'file', 'image']
              if (!nonTextTypes.includes(type)) {
                isTextEditField = true
              }
            }
          }
        }

        if (!isTextEditField) {
          e.preventDefault()
          e.stopPropagation()
          handleDirectTogglePlay()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [Boolean(playingTrack)])

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

  const MIN_LISTENABLE_VOLUME = 30
  const DEFAULT_UNMUTE_VOLUME = 80

  // Handle Volume Icon click (toggle mute)
  const handleToggleMute = () => {
    if (isMuted || volume === 0) {
      let targetVol = prevVolume
      if (!targetVol || isNaN(targetVol) || targetVol < MIN_LISTENABLE_VOLUME) {
        targetVol = DEFAULT_UNMUTE_VOLUME
      }
      setIsMuted(false)
      setVolume(targetVol)
      setPrevVolume(targetVol)
      try {
        setCookie('audio_playback_volume', targetVol.toString())
        localStorage.setItem('audio_playback_volume', targetVol.toString())
        setCookie('audio_playback_muted', 'false')
        localStorage.setItem('audio_playback_muted', 'false')
        setCookie('audio_playback_prev_volume', targetVol.toString())
        localStorage.setItem('audio_playback_prev_volume', targetVol.toString())
      } catch {}
    } else {
      const volToSave = Math.max(volume, MIN_LISTENABLE_VOLUME)
      setPrevVolume(volToSave)
      setIsMuted(true)
      try {
        setCookie('audio_playback_prev_volume', volToSave.toString())
        localStorage.setItem('audio_playback_prev_volume', volToSave.toString())
        setCookie('audio_playback_muted', 'true')
        localStorage.setItem('audio_playback_muted', 'true')
      } catch {}
    }
  }

  // Handle Volume Slider change
  const handleVolumeChange = (_, val) => {
    setVolume(val)
    if (val >= MIN_LISTENABLE_VOLUME) {
      setPrevVolume(val)
      if (isMuted) setIsMuted(false)
    } else if (val > 0) {
      if (isMuted) setIsMuted(false)
    } else if (val === 0 && !isMuted) {
      setIsMuted(true)
    }
    try {
      setCookie('audio_playback_volume', val.toString())
      localStorage.setItem('audio_playback_volume', val.toString())
      setCookie('audio_playback_muted', val === 0 ? 'true' : 'false')
      localStorage.setItem('audio_playback_muted', val === 0 ? 'true' : 'false')
      if (val >= MIN_LISTENABLE_VOLUME) {
        setCookie('audio_playback_prev_volume', val.toString())
        localStorage.setItem('audio_playback_prev_volume', val.toString())
      }
    } catch {}
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

        <Container maxWidth="md" sx={{ pointerEvents: 'auto', px: { xs: 2, sm: 3 } }}>
          <Paper
            elevation={6}
            sx={{
              borderRadius: 4,
              py: 1.5,
              pr: 1.5,
              pl: { xs: 1.5, sm: 1.75 },
              minHeight: { xs: 72, sm: 84 },
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
              {/* Col 1: Unified Cover Art + Title + Artist Clickable & Hover Area | Col 2: Centered Share Button */}
              <Stack
                direction="row"
                spacing={1.25}
                sx={{
                  alignItems: 'center',
                  minWidth: 0,
                  width: { xs: '100%', sm: 'auto' },
                  maxWidth: { sm: 290, md: 330 },
                  flexShrink: 0,
                }}
              >
                {/* Unified Clickable & Hover Container for Cover Art + Title + Artist */}
                <Tooltip title="Go to track page" arrow>
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

                    {/* Title & Artist Stack */}
                    <Stack
                      spacing={0.5}
                      sx={{
                        minWidth: 0,
                        flexGrow: 1,
                        overflow: 'hidden',
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
                        {playingTrack.name || 'Untitled Track'}
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
                        {playingTrack.artist || 'Artist'}
                      </Typography>
                    </Stack>
                  </Box>
                </Tooltip>

                {/* Share Button vertically centered after title/artist group */}
                <Tooltip title="Share track link" arrow>
                  <IconButton
                    size="small"
                    onClick={handleShareTrack}
                    sx={{
                      color: copiedShare ? 'success.main' : 'text.secondary',
                      transition: 'color 0.2s ease',
                      flexShrink: 0,
                      p: 0.8,
                      ml: 0.1,
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
                      onClick={onToggleShuffle}
                      sx={{
                        color: isShuffle ? 'primary.main' : 'text.primary',
                        opacity: 1,
                        p: 0.9,
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
                      sx={{ color: 'text.primary', p: 0.9 }}
                    >
                      <SkipPreviousRoundedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>

                  {/* Play/Pause */}
                  <IconButton
                    color="primary"
                    onClick={handleDirectTogglePlay}
                    sx={{
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      p: 1.1,
                      boxShadow: '0 4px 14px rgba(144, 202, 249, 0.4)',
                      '&:hover': { bgcolor: 'primary.dark', transform: 'scale(1.05)' },
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
                      sx={{ color: 'text.primary', p: 0.9 }}
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
                        color: repeatMode !== 'off' ? 'primary.main' : 'text.primary',
                        opacity: 1,
                        p: 0.9,
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
                    sx={{ color: queueOpen ? 'primary.main' : 'text.secondary', p: 0.9 }}
                  >
                    <Badge badgeContent={manualQueue.length > 0 ? manualQueue.length : null} color="primary">
                      <QueueMusicRoundedIcon fontSize="small" />
                    </Badge>
                  </IconButton>
                </Tooltip>

                <PlaybackQueueDialog
                  open={queueOpen}
                  onClose={() => setQueueOpen(false)}
                  manualQueue={manualQueue}
                  autoplayTracks={autoplayTracks}
                  onQueueDragDrop={onQueueDragDrop}
                  onRemoveFromManualQueue={onRemoveFromManualQueue}
                  onRemoveFromAutoplay={onRemoveFromAutoplay}
                  onPlayQueuedTrack={onPlayQueuedTrack}
                />

                {/* Col 2: Dynamic Volume Icon */}
                <Tooltip title={isMuted ? 'Unmute' : 'Mute'} arrow>
                  <IconButton
                    size="small"
                    onClick={handleToggleMute}
                    sx={{
                      color: isMuted ? 'error.main' : 'text.secondary',
                      p: 0.9,
                      position: 'relative',
                      zIndex: 2,
                    }}
                  >
                    <VolumeIconComponent fontSize="small" />
                  </IconButton>
                </Tooltip>

                {/* Col 3: Volume Scrubber Input */}
                <Box sx={{ width: { xs: 60, sm: 70, md: 90 }, display: 'flex', alignItems: 'center', px: 0.5, ml: 0.25, position: 'relative', zIndex: 1 }}>
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
                    sx={{ color: 'text.secondary', ml: 0.25, p: 0.9 }}
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
              onPlay={(e) => {
                const volVal = isMuted ? 0 : volume
                e.currentTarget.volume = Math.min(1, Math.max(0, volVal / 100))
                e.currentTarget.muted = isMuted
              }}
              onLoadedMetadata={(e) => {
                const d = e.currentTarget.duration
                if (d && !isNaN(d)) setRealDuration(d)
                const volVal = isMuted ? 0 : volume
                e.currentTarget.volume = Math.min(1, Math.max(0, volVal / 100))
                e.currentTarget.muted = isMuted
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
                } else if (repeatMode === 'all' || manualQueue.length > 0 || autoplayTracks.length > 0) {
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
