'use client'

import { useState, useEffect, useRef, useMemo, useCallback, forwardRef } from 'react'
import {
  Box,
  Container,
  Paper,
  Typography,
  IconButton,
  Slider,
  Stack,
  Badge,
  useTheme,
  Collapse,
  Dialog,
  Slide,
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
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded'
import FullscreenRoundedIcon from '@mui/icons-material/FullscreenRounded'
import { slugify } from '../../lib/slugs'
import { getCookie, setCookie } from '../../lib/cookies'
import { mediaPreloader } from '../../lib/mediaPreloader'
import { useVibrantColors } from '../../lib/hooks/useVibrantColors'
import ProgressiveImage from '../common/ProgressiveImage'
import PlaybackQueueDialog from './PlaybackQueueDialog'
import { useTouchDevice } from '../../lib/hooks/useTouchDevice'

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

export default function AudioPlayerBar({
  playingTrack,
  isPlaying,
  onTogglePlay,
  onClosePlayer,
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
  repeatMode: propsRepeatMode,
  onCycleRepeatMode,
  restartCount = 0,
  audioQuality = '320k',
  onOpenQualityModal,
}) {
  const theme = useTheme()
  const isTouch = useTouchDevice()
  const [currentTime, setCurrentTime] = useState(0)
  const [localRepeatMode, setLocalRepeatMode] = useState('off') // 'off' | 'all' | 'one'
  const repeatMode = propsRepeatMode !== undefined ? propsRepeatMode : localRepeatMode
  const [volume, setVolume] = useState(100)
  const [prevVolume, setPrevVolume] = useState(100)
  const [isMuted, setIsMuted] = useState(false)
  const [copiedShare, setCopiedShare] = useState(false)
  const [queueOpen, setQueueOpen] = useState(false)
  const [mobileFullScreenOpen, setMobileFullScreenOpen] = useState(false)
  const [realDuration, setRealDuration] = useState(0)
  const activeTier = audioQuality || '320k'

  const pendingResumeTimeRef = useRef(null)
  const shouldResumeAfterQualitySwitchRef = useRef(false)
  const audioRef = useRef(null)

  const rawAudioUrl = playingTrack?.audioUrl

  // Compute audio source URL based on active quality tier
  const activeAudioSrc = useMemo(() => {
    if (!rawAudioUrl) return undefined
    const sep = rawAudioUrl.includes('?') ? '&' : '?'
    if (activeTier === 'lossless') return `${rawAudioUrl}${sep}q=lossless`
    if (activeTier === '320k') return `${rawAudioUrl}${sep}b=320k`
    return `${rawAudioUrl}${sep}b=${activeTier}`
  }, [rawAudioUrl, activeTier])

  // Dynamic Quality Label for Pill
  const audioQualityLabel = useMemo(() => {
    if (playingTrack?.quality) return playingTrack.quality
    if (activeTier === '128k') return '128 kbps'
    if (activeTier === '192k') return '192 kbps'
    if (activeTier === '320k') return '320 kbps'
    if (activeTier === 'lossless') return 'Lossless'
    return '320 kbps'
  }, [playingTrack?.quality, activeTier])

  // Seamlessly update audio stream when user explicitly changes quality in Settings
  const prevTierRef = useRef(activeTier)
  useEffect(() => {
    if (prevTierRef.current !== activeTier) {
      prevTierRef.current = activeTier
      if (audioRef.current && playingTrack) {
        const currentPos = audioRef.current.currentTime || currentTime
        const wasPlaying = isPlaying && !audioRef.current.paused
        pendingResumeTimeRef.current = currentPos
        shouldResumeAfterQualitySwitchRef.current = wasPlaying
      }
    }
  }, [activeTier, playingTrack, isPlaying, currentTime])
  const coverArt = playingTrack?.cover || playingTrack?.image || playingTrack?.projectCover || ''
  const { colors, isLoaded: isPaletteLoaded } = useVibrantColors(coverArt)

  // Single solid background color matching artwork palette
  const playerBgColor = useMemo(() => {
    if (!coverArt || !isPaletteLoaded || !colors || colors.length === 0) {
      return theme.palette.mode === 'dark' ? '#181822' : '#f8f9fa'
    }
    const match = colors[0].match(/hsl\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)/i)
    if (!match) {
      return theme.palette.mode === 'dark' ? '#181822' : '#f8f9fa'
    }
    const h = parseInt(match[1], 10)
    const s = parseInt(match[2], 10)
    if (theme.palette.mode === 'dark') {
      return `hsl(${h}, ${Math.min(50, Math.max(12, s))}%, 12%)`
    } else {
      return `hsl(${h}, ${Math.min(45, Math.max(10, s))}%, 94%)`
    }
  }, [coverArt, isPaletteLoaded, colors, theme.palette.mode])

  // Subtle single color border derived from palette
  const playerBorderColor = useMemo(() => {
    if (!coverArt || !isPaletteLoaded || !colors || colors.length === 0) {
      return theme.palette.mode === 'dark'
        ? 'rgba(255, 255, 255, 0.12)'
        : 'rgba(0, 0, 0, 0.12)'
    }
    const match = colors[0].match(/hsl\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)/i)
    if (!match) {
      return theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'
    }
    const h = parseInt(match[1], 10)
    const s = parseInt(match[2], 10)
    return theme.palette.mode === 'dark'
      ? `hsla(${h}, ${Math.min(50, Math.max(12, s))}%, 60%, 0.2)`
      : `hsla(${h}, ${Math.min(45, Math.max(10, s))}%, 30%, 0.15)`
  }, [coverArt, isPaletteLoaded, colors, theme.palette.mode])

  // Handle restart count trigger (restarts current track from beginning)
  const isFirstMountRef = useRef(true)
  useEffect(() => {
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false
      return
    }
    if (restartCount > 0 && audioRef.current) {
      audioRef.current.currentTime = 0
      setCurrentTime(0)
      if (isPlaying) {
        const p = audioRef.current.play()
        if (p !== undefined) {
          p.catch(console.warn)
        }
      }
    }
  }, [restartCount, isPlaying])

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
      if (savedPrevVol !== null && !isNaN(Number(savedPrevVol)) && Number(savedPrevVol) >= 10) {
        pV = Math.min(100, Math.max(10, Number(savedPrevVol)))
      } else if (v >= 10) {
        pV = v
      }

      const muted = savedMuted === 'true' || (savedMuted === null && v === 0)

      setVolume(v)
      setPrevVolume(pV)
      setIsMuted(muted)
    } catch { }
  }, [])

  // When touch input is detected, volume is always maxed and unmuted in the app
  useEffect(() => {
    if (isTouch) {
      setVolume(100)
      setIsMuted(false)
    }
  }, [isTouch])

  const bgDefault = theme.palette.background.default
  const bgTransparent = alpha(bgDefault, 0)

  // Track duration in seconds
  const duration = realDuration || playingTrack?.durationSeconds || playingTrack?.duration || 215

  // Ready / Playing Handler: Restores playback position after clean quality switch
  const handleCanPlayOrPlaying = useCallback(() => {
    mediaPreloader.setAudioBuffering(false)

    if (pendingResumeTimeRef.current !== null && audioRef.current) {
      const targetTime = pendingResumeTimeRef.current
      pendingResumeTimeRef.current = null
      try {
        audioRef.current.currentTime = targetTime
      } catch { }
      if (shouldResumeAfterQualitySwitchRef.current) {
        audioRef.current.play().catch((err) => {
          if (err.name !== 'AbortError') console.warn('Resume play error:', err)
        })
      }
    }
  }, [])

  // Reset player state when playing track changes
  useEffect(() => {
    setRealDuration(0)
    pendingResumeTimeRef.current = null
    if (rawAudioUrl) {
      mediaPreloader.preloadAudioChunk(rawAudioUrl)
    }
  }, [rawAudioUrl, playingTrack?.name])

  // Pre-buffer initial audio chunks and artwork for upcoming queue tracks during idle time
  useEffect(() => {
    const upcoming = [...(manualQueue || []), ...(autoplayTracks || [])].slice(0, 3)
    for (const item of upcoming) {
      const trackObj = item?.track || item
      if (trackObj?.audioUrl) {
        mediaPreloader.preloadAudioChunk(trackObj.audioUrl)
      }
      const coverUrl = item?.project?.cover || item?.track?.cover || trackObj?.projectCover || trackObj?.cover
      if (coverUrl && typeof coverUrl === 'string' && coverUrl.startsWith('/api/media')) {
        mediaPreloader.preloadImage(`${coverUrl}${coverUrl.includes('?') ? '&' : '?'}w=120&q=75&fmt=webp`)
      }
    }
  }, [manualQueue, autoplayTracks, rawAudioUrl])

  // Sync playback state with audio element
  useEffect(() => {
    if (!audioRef.current) return
    if (isPlaying && activeAudioSrc) {
      if (audioRef.current.paused) {
        const playPromise = audioRef.current.play()
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            if (err.name === 'AbortError') {
              // Expected browser event when audio source changes while play() is pending.
              return
            }
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
  }, [isPlaying, activeAudioSrc, onTogglePlay, onShowToast])

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
      const projectSlug = slugify(playingTrack?.project || '')
      const trackSlug = slugify(playingTrack?.name || '')
      const shareUrl = `${window.location.origin}${projectSlug ? `/${projectSlug}` : ''}${trackSlug ? `/${trackSlug}` : ''}`
      try {
        navigator.clipboard.writeText(shareUrl)
        setCopiedShare(true)
        setTimeout(() => setCopiedShare(false), 2000)
        if (onShowToast) {
          onShowToast(`Copied share link to "${playingTrack?.name || 'track'}"`)
        }
      } catch (err) {
        console.error('Failed to copy share URL:', err)
      }
    }
  }

  const MIN_LISTENABLE_VOLUME = 10
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
      } catch { }
    } else {
      const volToSave = Math.max(volume, MIN_LISTENABLE_VOLUME)
      setPrevVolume(volToSave)
      setIsMuted(true)
      try {
        setCookie('audio_playback_prev_volume', volToSave.toString())
        localStorage.setItem('audio_playback_prev_volume', volToSave.toString())
        setCookie('audio_playback_muted', 'true')
        localStorage.setItem('audio_playback_muted', 'true')
      } catch { }
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
    } catch { }
  }

  // Cycle repeat mode: off -> all -> one -> off
  const handleCycleRepeat = () => {
    if (onCycleRepeatMode) {
      onCycleRepeatMode()
    } else {
      setLocalRepeatMode(prev => {
        if (prev === 'off') return 'all'
        if (prev === 'all') return 'one'
        return 'off'
      })
    }
  }

  // Dynamic Volume Icon
  const effectiveVolume = isMuted ? 0 : volume
  let VolumeIconComponent = VolumeUpRoundedIcon
  if (effectiveVolume === 0) {
    VolumeIconComponent = VolumeOffRoundedIcon
  } else if (effectiveVolume < 50) {
    VolumeIconComponent = VolumeDownRoundedIcon
  }

  return (
    <>
      <Collapse
        in={Boolean(playingTrack)}
        unmountOnExit
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1200,
          width: '100%',
          pointerEvents: 'none',
        }}
      >
        <Box
          className="mui-fixed"
          sx={{
            pb: { xs: 1.5, sm: 2 },
            pt: { xs: 1.5, sm: 2 },
            pointerEvents: 'none',
            width: '100%',
          }}
        >
          <Container maxWidth="md" sx={{ pointerEvents: 'auto', px: { xs: 2, sm: 3 } }}>
            <Paper
              elevation={6}
              sx={{
                borderRadius: { xs: 3, sm: 4 },
                py: { xs: 1, sm: 1.5 },
                pr: { xs: 1.25, sm: 1.5 },
                pl: { xs: 1.25, sm: 1.75 },
                minHeight: { xs: 58, sm: 84 },
                bgcolor: playerBgColor,
                border: '1px solid',
                borderColor: playerBorderColor,
                boxShadow: '0 12px 36px rgba(0,0,0,0.35)',
                position: 'relative',
                overflow: 'hidden',
                transition: 'background-color 0.4s ease, border-color 0.4s ease',
              }}
            >
              {/* === MOBILE MINI-PLAYER (Single Compact Row) === */}
              <Box
                onClick={() => setMobileFullScreenOpen(true)}
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
                      sx={{ width: '100%', height: '100%' }}
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
                    fontWeight={700}
                    sx={{
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
                  <Box
                    component="span"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (onOpenQualityModal) onOpenQualityModal()
                    }}
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      px: 0.5,
                      py: 0.08,
                      borderRadius: 9999,
                      fontSize: '0.575rem',
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      lineHeight: 1.1,
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                      color: 'text.secondary',
                      border: '1px solid',
                      borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)',
                      width: 'fit-content',
                      userSelect: 'none',
                      mt: 0.1,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        transform: 'scale(1.04)',
                        borderColor: 'primary.main',
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)',
                      },
                    }}
                  >
                    {audioQualityLabel}
                  </Box>
                </Stack>

                {/* 3. Auto-filled gap to push remaining controls to the right */}
                <Box sx={{ flexGrow: 1 }} />

                {/* 4. Copy track link share button */}
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleShareTrack(e)
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
                    handleDirectTogglePlay()
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
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                }}
              >
                <Box
                  sx={{
                    height: '100%',
                    width: `${Math.min(100, Math.max(0, (currentTime / (duration || 1)) * 100))}%`,
                    bgcolor: 'primary.main',
                    transition: 'width 0.15s linear',
                  }}
                />
              </Box>

              {/* === DESKTOP / TABLET PLAYER (Full Controls) === */}
              <Box
                sx={{
                  display: { xs: 'none', sm: 'grid' },
                  gridTemplateColumns: '1fr auto 1fr',
                  alignItems: 'center',
                  width: '100%',
                  columnGap: { sm: 2, md: 3 },
                }}
              >
                {/* === LEFT GROUP === */}
                {/* Col 1: Unified Cover Art + Title + Artist Clickable & Hover Area | Col 2: Centered Share Button */}
                <Stack
                  direction="row"
                  spacing={1.25}
                  sx={{
                    alignItems: 'center',
                    minWidth: 0,
                    width: '100%',
                    overflow: 'hidden',
                  }}
                >
                  {/* Unified Clickable & Hover Container for Cover Art + Title + Artist */}
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
                        <ProgressiveImage
                          src={coverArt}
                          alt={playingTrack?.name || 'Cover'}
                          targetWidth={120}
                          placeholderWidth={32}
                          priority
                          sx={{ width: '100%', height: '100%' }}
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
                      <Box
                        component="span"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (onOpenQualityModal) onOpenQualityModal()
                        }}
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          px: 0.65,
                          py: 0.1,
                          borderRadius: 9999,
                          fontSize: '0.625rem',
                          fontWeight: 700,
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                          lineHeight: 1.1,
                          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                          color: 'text.secondary',
                          border: '1px solid',
                          borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)',
                          width: 'fit-content',
                          userSelect: 'none',
                          mt: 0.15,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          '&:hover': {
                            transform: 'scale(1.04)',
                            borderColor: 'primary.main',
                            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)',
                          },
                        }}
                      >
                        {audioQualityLabel}
                      </Box>
                    </Stack>
                  </Box>
                </Stack>

                {/* === MIDDLE GROUP === */}
                {/* Row 1 (top): Shuffle, Skip Back, Play/Pause, Skip Forward, Repeat */}
                {/* Row 2 (bottom): Current Time, Scrubber Slider, Total Time */}
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
                      onClick={() => {
                        const activeTime = audioRef.current ? audioRef.current.currentTime : currentTime
                        if (activeTime > 3) {
                          if (audioRef.current) {
                            audioRef.current.currentTime = 0
                          }
                          setCurrentTime(0)
                        } else if (onSkipPrev) {
                          onSkipPrev()
                        }
                      }}
                      sx={{ color: 'text.primary', p: 0.8 }}
                    >
                      <SkipPreviousRoundedIcon fontSize="small" />
                    </IconButton>

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
                    <IconButton
                      size="small"
                      onClick={() => {
                        const hasNext = manualQueue.length > 0 || autoplayTracks.length > 0 || repeatMode === 'all'
                        if (!hasNext) {
                          if (audioRef.current) {
                            audioRef.current.currentTime = 0
                          }
                          setCurrentTime(0)
                        }
                        if (onSkipNext) {
                          onSkipNext()
                        }
                      }}
                      sx={{ color: 'text.primary', p: 0.8 }}
                    >
                      <SkipNextRoundedIcon fontSize="small" />
                    </IconButton>

                    {/* Repeat */}
                    <IconButton
                      size="small"
                      onClick={handleCycleRepeat}
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
                        setCurrentTime(val)
                        if (audioRef.current) {
                          audioRef.current.currentTime = val
                        }
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

                {/* === RIGHT GROUP (Desktop / Tablet) === */}
                {/* Row 1 (top): Queue, Fullscreen Modal Link, Close / Stop Playback (Height: 40px) */}
                {/* Row 2 (bottom): Dynamic Volume Icon + Volume Scrubber (Height: 24px) */}
                <Stack
                  spacing={0.5}
                  sx={{
                    alignItems: 'flex-end',
                    justifyContent: 'center',
                    minWidth: 0,
                    width: '100%',
                  }}
                >
                  {/* Row 1: Action Icons (Share, Queue, Fullscreen, Close) */}
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
                    {/* 1. Share track link */}
                    <IconButton
                      size="small"
                      onClick={handleShareTrack}
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

                    {/* 2. View Queue */}
                    <IconButton
                      size="small"
                      onClick={() => setQueueOpen(true)}
                      sx={{
                        color: queueOpen ? 'primary.main' : 'text.secondary',
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

                    {/* 2. Fullscreen Button (links to fullscreen modal) */}
                    <IconButton
                      size="small"
                      onClick={() => setMobileFullScreenOpen(true)}
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

                    {/* 3. Close Player / Stop Playback */}
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
                    spacing={0.5}
                    sx={{
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      height: 24,
                      width: '100%',
                    }}
                  >
                    <IconButton
                      size="small"
                      onClick={handleToggleMute}
                      sx={{
                        color: isMuted ? 'error.main' : 'text.secondary',
                        p: 0.8,
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
                        mr: 0.8,
                        pl: 0.25,
                        pr: 1,
                      }}
                    >
                      <Slider
                        size="small"
                        value={effectiveVolume}
                        min={0}
                        max={100}
                        onChange={handleVolumeChange}
                        sx={{
                          py: 0,
                          height: 4,
                          color: isMuted ? 'text.disabled' : 'primary.main',
                          '& .MuiSlider-thumb': {
                            width: 10,
                            height: 10,
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

              {/* Hidden HTML5 Audio Element with Rock-Solid Streaming */}
              <audio
                ref={audioRef}
                src={activeAudioSrc || undefined}
                preload="auto"
                onPlay={(e) => {
                  const volVal = isMuted ? 0 : volume
                  e.currentTarget.volume = Math.min(1, Math.max(0, volVal / 100))
                  e.currentTarget.muted = isMuted
                  mediaPreloader.setAudioBuffering(false)
                }}
                onPlaying={handleCanPlayOrPlaying}
                onCanPlay={handleCanPlayOrPlaying}
                onWaiting={() => mediaPreloader.setAudioBuffering(true)}
                onLoadedMetadata={(e) => {
                  const d = e.currentTarget.duration
                  if (d && !isNaN(d)) setRealDuration(d)
                  const volVal = isMuted ? 0 : volume
                  e.currentTarget.volume = Math.min(1, Math.max(0, volVal / 100))
                  e.currentTarget.muted = isMuted
                  handleCanPlayOrPlaying()
                }}
                onTimeUpdate={(e) => {
                  if (pendingResumeTimeRef.current === null) {
                    setCurrentTime(e.currentTarget.currentTime)
                  }
                }}
                onEnded={() => {
                  mediaPreloader.setAudioBuffering(false)
                  if (repeatMode === 'one') {
                    if (audioRef.current) {
                      audioRef.current.currentTime = 0
                      audioRef.current.play().catch(() => { })
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
                  mediaPreloader.setAudioBuffering(false)
                  if (isPlaying) {
                    if (onShowToast) onShowToast(`Failed to load audio for "${playingTrack?.name || 'track'}"`)
                    if (onTogglePlay) onTogglePlay()
                  }
                }}
              />
            </Paper>
          </Container>
        </Box>
      </Collapse>

      {/* Full-Screen Mobile/Desktop Audio Player Modal */}
      <Dialog
        fullScreen
        keepMounted
        open={Boolean(mobileFullScreenOpen && playingTrack)}
        onClose={() => setMobileFullScreenOpen(false)}
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
            {/* Left: Close player & stop playback (Icon button without circle background) */}
            <IconButton
              onClick={() => {
                setMobileFullScreenOpen(false)
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

            {/* Center: Track Context Stack (Project Name, Artist below) */}
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
              onClick={() => setMobileFullScreenOpen(false)}
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

          {/* Center Artwork Hero (Maximum width 70dvw, dynamically scaled to available vertical space) */}
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
                  sx={{ width: '100%', height: '100%' }}
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

                  {/* Audio Quality Pill */}
                  <Box
                    component="span"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (onOpenQualityModal) onOpenQualityModal()
                    }}
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      px: 0.75,
                      py: 0.12,
                      borderRadius: 9999,
                      fontSize: '0.625rem',
                      fontWeight: 700,
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      lineHeight: 1.2,
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                      color: 'text.secondary',
                      border: '1px solid',
                      borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.12)',
                      width: 'fit-content',
                      userSelect: 'none',
                      flexShrink: 0,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        transform: 'scale(1.04)',
                        borderColor: 'primary.main',
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.18)' : 'rgba(0, 0, 0, 0.12)',
                      },
                    }}
                  >
                    {audioQualityLabel}
                  </Box>
                </Stack>
              </Box>

              {/* Right Action Icons (Share, Queue, Volume if mouse) */}
              <Stack
                direction="row"
                spacing={{ xs: 0.5, sm: 1 }}
                sx={{
                  alignItems: 'center',
                  flexShrink: 0,
                }}
              >
                {/* Share track button without circle background */}
                <IconButton
                  onClick={handleShareTrack}
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

                {/* Queue button without circle background */}
                <IconButton
                  size="small"
                  onClick={() => setQueueOpen(true)}
                  sx={{
                    color: queueOpen ? 'primary.main' : 'text.secondary',
                    p: { xs: 0.75, sm: 1 },
                    '&:hover': {
                      color: 'text.primary',
                    },
                  }}
                >
                  <Badge badgeContent={manualQueue.length > 0 ? manualQueue.length : null} color="primary">
                    <QueueMusicRoundedIcon sx={{ fontSize: { xs: 20, sm: 22 } }} />
                  </Badge>
                </IconButton>

                {/* Contained Volume when mouse detected (always in upper right position) */}
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
                      onClick={handleToggleMute}
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
                    <Box sx={{ width: { xs: 65, sm: 80, md: 95 }, display: 'flex', alignItems: 'center' }}>
                      <Slider
                        size="small"
                        value={effectiveVolume}
                        min={0}
                        max={100}
                        onChange={handleVolumeChange}
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

            {/* Main Playback Control Row (Grouped, comfortably centered, doesn't spread edge-to-edge) */}
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
                onClick={() => {
                  const activeTime = audioRef.current ? audioRef.current.currentTime : currentTime
                  if (activeTime > 3) {
                    if (audioRef.current) {
                      audioRef.current.currentTime = 0
                    }
                    setCurrentTime(0)
                  } else if (onSkipPrev) {
                    onSkipPrev()
                  }
                }}
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
                onClick={handleDirectTogglePlay}
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
                onClick={() => {
                  const hasNext = manualQueue.length > 0 || autoplayTracks.length > 0 || repeatMode === 'all'
                  if (!hasNext) {
                    if (audioRef.current) {
                      audioRef.current.currentTime = 0
                    }
                    setCurrentTime(0)
                  }
                  if (onSkipNext) {
                    onSkipNext()
                  }
                }}
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
                onClick={handleCycleRepeat}
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

            {/* Scrubber Slider & Timers (In line with timestamps with comfortable x-padding) */}
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
                  setCurrentTime(val)
                  if (audioRef.current) {
                    audioRef.current.currentTime = val
                  }
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
              gridTemplateColumns: '1fr auto 1fr',
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
            <Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
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

                {/* Audio Quality Pill */}
                <Box
                  component="span"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (onOpenQualityModal) onOpenQualityModal()
                  }}
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    px: 0.75,
                    py: 0.12,
                    borderRadius: 9999,
                    fontSize: '0.625rem',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    lineHeight: 1.2,
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                    color: 'text.secondary',
                    border: '1px solid',
                    borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.12)',
                    width: 'fit-content',
                    userSelect: 'none',
                    flexShrink: 0,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    '&:hover': {
                      transform: 'scale(1.04)',
                      borderColor: 'primary.main',
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.18)' : 'rgba(0, 0, 0, 0.12)',
                    },
                  }}
                >
                  {audioQualityLabel}
                </Box>
              </Stack>
            </Box>

            {/* Middle Column: Centered Fixed Width Playback Controls & Scrubber (Width matching Album Art) */}
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
                  onClick={() => {
                    const activeTime = audioRef.current ? audioRef.current.currentTime : currentTime
                    if (activeTime > 3) {
                      if (audioRef.current) {
                        audioRef.current.currentTime = 0
                      }
                      setCurrentTime(0)
                    } else if (onSkipPrev) {
                      onSkipPrev()
                    }
                  }}
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
                  onClick={handleDirectTogglePlay}
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
                  onClick={() => {
                    const hasNext = manualQueue.length > 0 || autoplayTracks.length > 0 || repeatMode === 'all'
                    if (!hasNext) {
                      if (audioRef.current) {
                        audioRef.current.currentTime = 0
                      }
                      setCurrentTime(0)
                    }
                    if (onSkipNext) {
                      onSkipNext()
                    }
                  }}
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
                  onClick={handleCycleRepeat}
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
                    setCurrentTime(val)
                    if (audioRef.current) {
                      audioRef.current.currentTime = val
                    }
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

            {/* Right Column: Share, Queue, Volume Flex Ending to the Far Right */}
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
                onClick={handleShareTrack}
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
                onClick={() => setQueueOpen(true)}
                sx={{
                  color: queueOpen ? 'primary.main' : 'text.secondary',
                  p: 1,
                  '&:hover': {
                    color: 'text.primary',
                  },
                }}
              >
                <Badge badgeContent={manualQueue.length > 0 ? manualQueue.length : null} color="primary">
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
                    onClick={handleToggleMute}
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
                  <Box sx={{ width: 100, display: 'flex', alignItems: 'center' }}>
                    <Slider
                      size="small"
                      value={effectiveVolume}
                      min={0}
                      max={100}
                      onChange={handleVolumeChange}
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
    </>
  )
}
