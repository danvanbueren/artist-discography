'use client'

import { useState, useRef, useMemo, useCallback } from 'react'
import { Box, Container, Paper, useTheme, Collapse } from '@mui/material'
import { slugify } from '@/lib/data/slugs'
import { mediaPreloader } from '@/lib/media/mediaPreloader'
import { useVibrantColors } from '@/lib/hooks/useVibrantColors'
import { useTouchDevice } from '@/lib/hooks/useTouchDevice'
import { usePlaybackStutterDetector } from '@/lib/hooks/usePlaybackStutterDetector'
import { useMediaSession } from '@/lib/hooks/useMediaSession'
import { useMediaCastAndPip } from '@/lib/hooks/useMediaCastAndPip'
import { useAudioVolume } from './hooks/useAudioVolume'
import { useAudioElementEngine, getOptimizedAudioSrc } from './hooks/useAudioElementEngine'
import PlaybackQueueDialog from './PlaybackQueueDialog'
import MobileMiniPlayer from './MobileMiniPlayer'
import DesktopPlayerBar from './DesktopPlayerBar'
import FullScreenPlayerModal from './FullScreenPlayerModal'

export { getOptimizedAudioSrc }

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
  const [localRepeatMode, setLocalRepeatMode] = useState('off') // 'off' | 'all' | 'one'
  const repeatMode = propsRepeatMode !== undefined ? propsRepeatMode : localRepeatMode
  const [copiedShare, setCopiedShare] = useState(false)
  const [queueOpen, setQueueOpen] = useState(false)
  const [mobileFullScreenOpen, setMobileFullScreenOpen] = useState(false)

  const activeTier = audioQuality || '320k'
  const trackKey = playingTrack?.audioUrl || playingTrack?.name || ''

  // 1. Stutter detection hook
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

  // 2. Volume and mute persistence hook
  const {
    volume,
    isMuted,
    effectiveVolume,
    handleVolumeChange,
    handleToggleMute,
    VolumeIconComponent,
  } = useAudioVolume({ isTouch })

  // 3. Audio element and stream engine hook
  const {
    audioRef,
    activeAudioSrc,
    audioQualityLabel,
    currentTime,
    duration,
    handleTimeUpdate,
    handleLoadedMetadata,
    handleCanPlayOrPlaying,
    handleSeek,
    handleDirectTogglePlay,
    setCurrentTime,
  } = useAudioElementEngine({
    playingTrack,
    isPlaying,
    audioQuality: activeTier,
    effectiveVolume,
    restartCount,
    onTogglePlay,
    onShowToast,
    manualQueue,
    autoplayTracks,
  })

  // Dynamic palette calculation for player bar background
  const coverArt = playingTrack?.cover || playingTrack?.image || playingTrack?.projectCover || ''
  const { colors, isLoaded: isPaletteLoaded } = useVibrantColors(coverArt)

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

  // Share track URL generator
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
  }, [audioRef, onClosePlayer])

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

  // 4. OS Media Session integration
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

  // 5. Picture-in-Picture and Remote Playback (Cast / AirPlay) hook
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

  const formatTime = useCallback((secs) => {
    const totalSecs = Math.max(0, Math.floor(secs || 0))
    const m = Math.floor(totalSecs / 60)
    const s = totalSecs % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }, [])

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
                onStalled={handleStutterStalled}
                onSeeking={handleStutterSeeking}
                onSeeked={handleStutterSeeked}
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handleTimeUpdate}
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
                    if (onShowToast) {
                      onShowToast(`Failed to load audio for "${playingTrack?.name || 'track'}"`)
                    }
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
