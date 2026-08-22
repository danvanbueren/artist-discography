'use client'

import { forwardRef } from 'react'
import { Box, Dialog, Slide } from '@mui/material'
import { useSwipeToDismiss } from './fullscreen/useSwipeToDismiss'
import FullScreenHeader from './fullscreen/FullScreenHeader'
import FullScreenArtwork from './fullscreen/FullScreenArtwork'
import FullScreenTrackMeta from './fullscreen/FullScreenTrackMeta'
import FullScreenTransportControls from './fullscreen/FullScreenTransportControls'
import FullScreenVolumeAndActions from './fullscreen/FullScreenVolumeAndActions'

const FullScreenSlideTransition = forwardRef(function FullScreenSlideTransition(props, ref) {
  return (
    <Slide
      direction='up'
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

/**
 * FullScreenPlayerModal
 * Responsive full-screen audio player dialog for immersive mobile & desktop listening.
 */
export default function FullScreenPlayerModal({
  open,
  onClose,
  playingTrack,
  coverArt,
  playerBgColor,
  isPlaying,
  currentTime,
  duration,
  formatTime,
  audioQualityLabel,
  isStuttering = false,
  isShuffle,
  repeatMode,
  isTouch,
  effectiveVolume,
  isMuted,
  copiedShare,
  manualQueue = [],
  autoplayTracks = [],
  onClosePlayer,
  onNavigateToCurrentTrack,
  onOpenQualityModal,
  onShareTrack,
  onOpenQueue,
  onToggleMute,
  onVolumeChange,
  onToggleShuffle,
  onSkipPrev,
  onSkipNext,
  onDirectTogglePlay,
  onCycleRepeat,
  onSeek,
  isPipActive = false,
  isCasting = false,
  isCastAvailable = true,
  castError = false,
  castType = 'remote',
  onTogglePip,
  onPromptCast,
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

  const { handleTouchStart, handleTouchMove, handleTouchEnd } = useSwipeToDismiss(onClose)

  const ambientCover =
    coverArt &&
      typeof coverArt === 'string' &&
      (coverArt.startsWith('/api/media') || coverArt.startsWith('/api/logo'))
      ? `${coverArt}${coverArt.includes('?') ? '&' : '?'}w=48&q=20&blur=8&fmt=webp`
      : coverArt

  return (
    <Dialog
      fullScreen
      keepMounted
      open={Boolean(open && playingTrack)}
      onClose={onClose}
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
          onTouchStart: handleTouchStart,
          onTouchMove: handleTouchMove,
          onTouchEnd: handleTouchEnd,
          sx: {
            bgcolor: playerBgColor,
            backgroundImage: 'none',
            color: 'text.primary',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            px: { xs: 2.5, sm: 4, md: 6, lg: 5, xl: 6 },
            py: { xs: 2.5, sm: 3, md: 3 },
            height: '100dvh',
            maxHeight: '100dvh',
            position: 'relative',
            overflow: 'hidden',
            boxSizing: 'border-box',
            overscrollBehavior: 'contain',
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
      {ambientCover && (
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${ambientCover})`,
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
        <FullScreenHeader
          playingTrack={playingTrack}
          onClose={onClose}
          onClosePlayer={onClosePlayer}
          onNavigateToCurrentTrack={onNavigateToCurrentTrack}
          isCasting={isCasting}
          castError={castError}
          castType={castType}
          onPromptCast={onPromptCast}
          isPipActive={isPipActive}
          isTouch={isTouch}
          onTogglePip={onTogglePip}
        />

        {/* Center Artwork */}
        <FullScreenArtwork coverArt={coverArt} trackName={playingTrack?.name} />

        {/* Bottom Control Area: Compact Stack for < lg */}
        <Box
          sx={{
            display: { xs: 'block', lg: 'none' },
            width: '100%',
            position: 'relative',
            zIndex: 1,
            pb: { xs: 2.5, sm: 3 },
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
              mb: { xs: 3, sm: 3.5 },
              gap: 1.5,
            }}
          >
            <FullScreenTrackMeta
              playingTrack={playingTrack}
              audioQualityLabel={audioQualityLabel}
              isStuttering={isStuttering}
              onOpenQualityModal={onOpenQualityModal}
              isDesktop={false}
            />

            <FullScreenVolumeAndActions
              copiedShare={copiedShare}
              onShareTrack={onShareTrack}
              onOpenQueue={onOpenQueue}
              manualQueue={manualQueue}
              isTouch={isTouch}
              effectiveVolume={effectiveVolume}
              isMuted={isMuted}
              onToggleMute={onToggleMute}
              onVolumeChange={onVolumeChange}
              VolumeIconComponent={VolumeIconComponent}
              isDesktop={false}
            />
          </Box>

          {/* Main Transport Controls */}
          <FullScreenTransportControls
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            formatTime={formatTime}
            isShuffle={isShuffle}
            repeatMode={repeatMode}
            onToggleShuffle={onToggleShuffle}
            onSkipPrev={handleSkipBackClick}
            onSkipNext={handleSkipForwardClick}
            onDirectTogglePlay={onDirectTogglePlay}
            onCycleRepeat={onCycleRepeat}
            onSeek={onSeek}
            isDesktop={false}
          />
        </Box>

        {/* Bottom Control Area: 3-Column Fluid Layout for lg+ */}
        <Box
          sx={{
            display: { xs: 'none', lg: 'grid' },
            gridTemplateColumns: 'minmax(0, 1fr) auto minmax(0, 1fr)',
            alignItems: 'center',
            width: '100%',
            columnGap: { lg: 3, xl: 4 },
            position: 'relative',
            zIndex: 1,
            pb: { lg: 1, xl: 1.5 },
            flexShrink: 0,
          }}
        >
          <FullScreenTrackMeta
            playingTrack={playingTrack}
            audioQualityLabel={audioQualityLabel}
            isStuttering={isStuttering}
            onOpenQualityModal={onOpenQualityModal}
            isDesktop
          />

          <FullScreenTransportControls
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            formatTime={formatTime}
            isShuffle={isShuffle}
            repeatMode={repeatMode}
            onToggleShuffle={onToggleShuffle}
            onSkipPrev={handleSkipBackClick}
            onSkipNext={handleSkipForwardClick}
            onDirectTogglePlay={onDirectTogglePlay}
            onCycleRepeat={onCycleRepeat}
            onSeek={onSeek}
            isDesktop
          />

          <FullScreenVolumeAndActions
            copiedShare={copiedShare}
            onShareTrack={onShareTrack}
            onOpenQueue={onOpenQueue}
            manualQueue={manualQueue}
            isTouch={isTouch}
            effectiveVolume={effectiveVolume}
            isMuted={isMuted}
            onToggleMute={onToggleMute}
            onVolumeChange={onVolumeChange}
            VolumeIconComponent={VolumeIconComponent}
            isDesktop
          />
        </Box>
      </Box>
    </Dialog>
  )
}
