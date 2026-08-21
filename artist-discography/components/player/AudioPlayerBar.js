'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Box, Container, Paper, useTheme, Collapse } from '@mui/material'
import VolumeUpRoundedIcon from '@mui/icons-material/VolumeUpRounded'
import VolumeDownRoundedIcon from '@mui/icons-material/VolumeDownRounded'
import VolumeOffRoundedIcon from '@mui/icons-material/VolumeOffRounded'
import { slugify } from '../../lib/slugs'
import { getCookie, setCookie } from '../../lib/cookies'
import { mediaPreloader } from '../../lib/mediaPreloader'
import { useVibrantColors } from '../../lib/hooks/useVibrantColors'
import { useTouchDevice } from '../../lib/hooks/useTouchDevice'
import { usePlaybackStutterDetector } from '../../lib/hooks/usePlaybackStutterDetector'
import { useMediaSession } from '../../lib/hooks/useMediaSession'
import { useMediaCastAndPip } from '../../lib/hooks/useMediaCastAndPip'
import PlaybackQueueDialog from './PlaybackQueueDialog'
import MobileMiniPlayer from './MobileMiniPlayer'
import DesktopPlayerBar from './DesktopPlayerBar'
import FullScreenPlayerModal from './FullScreenPlayerModal'

const MIN_LISTENABLE_VOLUME = 10
const DEFAULT_UNMUTE_VOLUME = 100

function getOptimizedAudioSrc(rawUrl, tier = '320k') {
  if (!rawUrl) return undefined
  const sep = rawUrl.includes('?') ? '&' : '?'
  if (tier === 'lossless') return `${rawUrl}${sep}q=lossless`
  if (tier === '320k') return `${rawUrl}${sep}b=320k`
  return `${rawUrl}${sep}b=${tier}`
}

/**
 * AudioPlayerBar
 * Master audio playback orchestrator component managing HTML5 audio stream,
 * volume/repeat preferences, keyboard shortcuts, background preloading, and UI subcomponents.
 */
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
  onStutterChange,
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

  const trackKey = playingTrack?.audioUrl || playingTrack?.name || ''
  const {
    isStuttering,
    onWaiting: handleStutterWaiting,
    onStalled: handleStutterStalled,
    onPlaying: handleStutterPlaying,
    onCanPlay: handleStutterCanPlay,
    onSeeking: handleStutterSeeking,
    onSeeked: handleStutterSeeked,
  } = usePlaybackStutterDetector({
    isPlaying,
    audioQuality: activeTier,
    trackKey,
  })

  // Notify parent of stutter status changes
  useEffect(() => {
    if (onStutterChange) {
      onStutterChange(isStuttering)
    }
  }, [isStuttering, onStutterChange])

  const pendingResumeTimeRef = useRef(null)
  const shouldResumeAfterQualitySwitchRef = useRef(false)
  const audioRef = useRef(null)

  const rawAudioUrl = playingTrack?.audioUrl

  // Compute audio source URL based on active quality tier
  const activeAudioSrc = useMemo(() => {
    return getOptimizedAudioSrc(rawAudioUrl, activeTier)
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
      return theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'
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

  // Handle restart count trigger (restarts current track from beginning only when restartCount changes)
  const prevRestartCountRef = useRef(restartCount)
  useEffect(() => {
    if (restartCount !== prevRestartCountRef.current) {
      prevRestartCountRef.current = restartCount
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
    }
  }, [restartCount, isPlaying])

  // Load volume & mute preference from cookie/localStorage on mount
  useEffect(() => {
    try {
      const savedVol =
        getCookie('audio_playback_volume') || localStorage.getItem('audio_playback_volume')
      const savedMuted =
        getCookie('audio_playback_muted') || localStorage.getItem('audio_playback_muted')
      const savedPrevVol =
        getCookie('audio_playback_prev_volume') ||
        localStorage.getItem('audio_playback_prev_volume')

      let v = 100
      if (savedVol !== null && !isNaN(Number(savedVol))) {
        v = Math.min(100, Math.max(0, Number(savedVol)))
      }

      let pV = 100
      if (
        savedPrevVol !== null &&
        !isNaN(Number(savedPrevVol)) &&
        Number(savedPrevVol) >= MIN_LISTENABLE_VOLUME
      ) {
        pV = Math.min(100, Math.max(MIN_LISTENABLE_VOLUME, Number(savedPrevVol)))
      } else if (v >= MIN_LISTENABLE_VOLUME) {
        pV = v
      }

      const muted = savedMuted === 'true' || (savedMuted === null && v === 0)

      setVolume(v)
      setPrevVolume(pV)
      setIsMuted(muted)
    } catch {}
  }, [])

  // When touch input is detected, volume is always maxed and unmuted in the app
  useEffect(() => {
    if (isTouch) {
      setVolume(100)
      setIsMuted(false)
    }
  }, [isTouch])

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
      } catch {}
      if (shouldResumeAfterQualitySwitchRef.current) {
        audioRef.current.play().catch((err) => {
          if (err.name !== 'AbortError') console.warn('Resume play error:', err)
        })
      }
    }
  }, [])

  // Clean up media resources on unmount
  useEffect(() => {
    return () => {
      mediaPreloader.clearAudioPreload()
      if (audioRef.current) {
        try {
          audioRef.current.pause()
          audioRef.current.removeAttribute('src')
          audioRef.current.load()
        } catch {}
      }
    }
  }, [])

  // Reset player state when playing track changes
  useEffect(() => {
    setRealDuration(0)
    pendingResumeTimeRef.current = null
  }, [rawAudioUrl, playingTrack?.name])

  // Pre-buffer initial audio bytes for the immediate upcoming track and artwork for upcoming queue tracks
  useEffect(() => {
    const upcoming = [...(manualQueue || []), ...(autoplayTracks || [])]
    const nextItem = upcoming[0]
    const nextTrackObj = nextItem?.track || nextItem

    if (nextTrackObj?.audioUrl && nextTrackObj.audioUrl !== rawAudioUrl) {
      const nextAudioSrc = getOptimizedAudioSrc(nextTrackObj.audioUrl, activeTier)
      if (nextAudioSrc) {
        mediaPreloader.preloadAudioChunk(nextAudioSrc)
      }
    } else if (!nextItem) {
      mediaPreloader.clearAudioPreload()
    }

    for (const item of upcoming.slice(0, 3)) {
      const trackObj = item?.track || item
      const coverUrl =
        item?.project?.cover || item?.track?.cover || trackObj?.projectCover || trackObj?.cover
      if (coverUrl && typeof coverUrl === 'string' && coverUrl.startsWith('/api/media')) {
        mediaPreloader.preloadImage(
          `${coverUrl}${coverUrl.includes('?') ? '&' : '?'}w=120&q=75&fmt=webp`,
        )
      }
    }
  }, [manualQueue, autoplayTracks, rawAudioUrl, activeTier])

  const handleClosePlayer = useCallback(() => {
    mediaPreloader.clearAudioPreload()
    if (typeof document !== 'undefined' && document.pictureInPictureElement) {
      document.exitPictureInPicture().catch(() => {})
    }
    if (audioRef.current) {
      try {
        audioRef.current.pause()
        audioRef.current.removeAttribute('src')
        audioRef.current.load()
      } catch {}
    }
    if (onClosePlayer) onClosePlayer()
  }, [onClosePlayer])

  // Sync playback state with audio element
  useEffect(() => {
    if (!audioRef.current) return
    if (isPlaying && activeAudioSrc) {
      if (audioRef.current.paused) {
        const playPromise = audioRef.current.play()
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            if (err.name === 'AbortError') {
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
  const handleDirectTogglePlay = useCallback(() => {
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
  }, [])

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
              const nonTextTypes = [
                'range',
                'checkbox',
                'radio',
                'button',
                'submit',
                'reset',
                'color',
                'file',
                'image',
              ]
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
  }, [Boolean(playingTrack), handleDirectTogglePlay])

  // Time formatter MM:SS
  const formatTime = useCallback((secs) => {
    const totalSecs = Math.max(0, Math.floor(secs || 0))
    const m = Math.floor(totalSecs / 60)
    const s = totalSecs % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }, [])

  // Handle Share button click
  const handleShareTrack = useCallback(
    (e) => {
      if (e && e.stopPropagation) e.stopPropagation()
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
    },
    [playingTrack, onShowToast],
  )

  // Handle Volume Icon click (toggle mute)
  const handleToggleMute = useCallback(() => {
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
  }, [isMuted, volume, prevVolume])

  // Handle Volume Slider change
  const handleVolumeChange = useCallback(
    (_, val) => {
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
    },
    [isMuted],
  )

  // Cycle repeat mode: off -> all -> one -> off
  const handleCycleRepeat = useCallback(() => {
    if (onCycleRepeatMode) {
      onCycleRepeatMode()
    } else {
      setLocalRepeatMode((prev) => {
        if (prev === 'off') return 'all'
        if (prev === 'all') return 'one'
        return 'off'
      })
    }
  }, [onCycleRepeatMode])

  // Handle Seek
  const handleSeek = useCallback((val) => {
    setCurrentTime(val)
    if (audioRef.current) {
      audioRef.current.currentTime = val
    }
  }, [])

  // Synchronize playback state, metadata, timeline scrubber, and actions with OS Media Session
  useMediaSession({
    playingTrack,
    isPlaying,
    currentTime,
    duration,
    onTogglePlay: handleDirectTogglePlay,
    onSkipNext,
    onSkipPrev,
    onSeek: handleSeek,
  })

  // Picture-in-Picture (Canvas Stream Video) & Remote Playback (Chrome Cast / AirPlay) Engine
  const {
    isPipActive,
    isCasting,
    isCastAvailable,
    castError,
    castType,
    handleTogglePip,
    handlePromptCast,
  } = useMediaCastAndPip({
    audioRef,
    playingTrack,
    isPlaying,
    coverArt,
    onShowToast,
  })

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
          sx={{
            pb: { xs: 1.5, sm: 2 },
            pt: { xs: 1.5, sm: 2 },
            pointerEvents: 'none',
            width: '100%',
            pr: { xs: 0, sm: '8px' },
          }}
        >
          <Container maxWidth='md' sx={{ pointerEvents: 'auto', px: { xs: 2, sm: 3 } }}>
            <Paper
              elevation={6}
              sx={{
                borderRadius: { xs: 3, sm: 4 },
                py: { xs: 1, sm: 1.5 },
                px: { xs: 1.5, sm: 2 },
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
              {/* Mobile Mini Player Row */}
              <MobileMiniPlayer
                playingTrack={playingTrack}
                coverArt={coverArt}
                isPlaying={isPlaying}
                copiedShare={copiedShare}
                currentTime={currentTime}
                duration={duration}
                audioQualityLabel={audioQualityLabel}
                isStuttering={isStuttering}
                onOpenFullScreen={() => setMobileFullScreenOpen(true)}
                onShareTrack={handleShareTrack}
                onDirectTogglePlay={handleDirectTogglePlay}
              />

              {/* Desktop / Tablet Player Bar */}
              <DesktopPlayerBar
                playingTrack={playingTrack}
                coverArt={coverArt}
                isPlaying={isPlaying}
                currentTime={currentTime}
                duration={duration}
                formatTime={formatTime}
                audioQualityLabel={audioQualityLabel}
                isStuttering={isStuttering}
                isShuffle={isShuffle}
                repeatMode={repeatMode}
                effectiveVolume={effectiveVolume}
                isMuted={isMuted}
                copiedShare={copiedShare}
                manualQueue={manualQueue}
                autoplayTracks={autoplayTracks}
                onNavigateToCurrentTrack={onNavigateToCurrentTrack}
                onOpenQualityModal={onOpenQualityModal}
                onToggleShuffle={onToggleShuffle}
                onSkipPrev={onSkipPrev}
                onSkipNext={onSkipNext}
                onDirectTogglePlay={handleDirectTogglePlay}
                onCycleRepeat={handleCycleRepeat}
                onSeek={handleSeek}
                onShareTrack={handleShareTrack}
                onOpenQueue={() => setQueueOpen(true)}
                onOpenFullScreen={() => setMobileFullScreenOpen(true)}
                onClosePlayer={handleClosePlayer}
                onToggleMute={handleToggleMute}
                onVolumeChange={handleVolumeChange}
                VolumeIconComponent={VolumeIconComponent}
              />

              {/* Hidden HTML5 Audio Element */}
              <audio
                ref={audioRef}
                src={activeAudioSrc || undefined}
                preload='auto'
                crossOrigin='anonymous'
                playsInline
                onPlay={(e) => {
                  const volVal = isMuted ? 0 : volume
                  e.currentTarget.volume = Math.min(1, Math.max(0, volVal / 100))
                  e.currentTarget.muted = isMuted
                  mediaPreloader.setAudioBuffering(false)
                }}
                onPlaying={() => {
                  handleCanPlayOrPlaying()
                  handleStutterPlaying()
                }}
                onCanPlay={() => {
                  handleCanPlayOrPlaying()
                  handleStutterCanPlay()
                }}
                onWaiting={() => {
                  mediaPreloader.setAudioBuffering(true)
                  handleStutterWaiting()
                }}
                onStalled={() => {
                  handleStutterStalled()
                }}
                onSeeking={() => {
                  handleStutterSeeking()
                }}
                onSeeked={() => {
                  handleStutterSeeked()
                }}
                onLoadedMetadata={(e) => {
                  const d = e.currentTarget.duration
                  if (d && !isNaN(d)) setRealDuration(d)
                  const volVal = isMuted ? 0 : volume
                  e.currentTarget.volume = Math.min(1, Math.max(0, volVal / 100))
                  e.currentTarget.muted = isMuted
                  handleCanPlayOrPlaying()
                  handleStutterCanPlay()
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
                      audioRef.current.play().catch(() => {})
                    }
                  } else if (
                    repeatMode === 'all' ||
                    manualQueue.length > 0 ||
                    autoplayTracks.length > 0
                  ) {
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
                    if (onShowToast)
                      onShowToast(`Failed to load audio for "${playingTrack?.name || 'track'}"`)
                    if (onTogglePlay) onTogglePlay()
                  }
                }}
              />
            </Paper>
          </Container>
        </Box>
      </Collapse>

      {/* Playback Queue Dialog */}
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

      {/* Full-Screen Audio Player Modal */}
      <FullScreenPlayerModal
        open={Boolean(mobileFullScreenOpen && playingTrack)}
        onClose={() => setMobileFullScreenOpen(false)}
        playingTrack={playingTrack}
        coverArt={coverArt}
        playerBgColor={playerBgColor}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        formatTime={formatTime}
        audioQualityLabel={audioQualityLabel}
        isStuttering={isStuttering}
        isShuffle={isShuffle}
        repeatMode={repeatMode}
        isTouch={isTouch}
        effectiveVolume={effectiveVolume}
        isMuted={isMuted}
        copiedShare={copiedShare}
        manualQueue={manualQueue}
        autoplayTracks={autoplayTracks}
        onClosePlayer={handleClosePlayer}
        onNavigateToCurrentTrack={onNavigateToCurrentTrack}
        onOpenQualityModal={onOpenQualityModal}
        onShareTrack={handleShareTrack}
        onOpenQueue={() => setQueueOpen(true)}
        onToggleMute={handleToggleMute}
        onVolumeChange={handleVolumeChange}
        onToggleShuffle={onToggleShuffle}
        onSkipPrev={onSkipPrev}
        onSkipNext={onSkipNext}
        onDirectTogglePlay={handleDirectTogglePlay}
        onCycleRepeat={handleCycleRepeat}
        onSeek={handleSeek}
        isPipActive={isPipActive}
        isCasting={isCasting}
        isCastAvailable={isCastAvailable}
        castError={castError}
        castType={castType}
        onTogglePip={handleTogglePip}
        onPromptCast={handlePromptCast}
        VolumeIconComponent={VolumeIconComponent}
      />
    </>
  )
}
