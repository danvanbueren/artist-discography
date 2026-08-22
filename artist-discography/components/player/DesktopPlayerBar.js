'use client'

import { Box } from '@mui/material'
import DesktopPlayerLeftInfo from './desktop/DesktopPlayerLeftInfo'
import DesktopPlayerTransport from './desktop/DesktopPlayerTransport'
import DesktopPlayerRightControls from './desktop/DesktopPlayerRightControls'

/**
 * DesktopPlayerBar
 * 3-Column full playback controls bar for tablet and desktop viewports (sm+).
 */
export default function DesktopPlayerBar({
  playingTrack,
  coverArt,
  isPlaying,
  currentTime,
  duration,
  formatTime,
  audioQualityLabel,
  isStuttering = false,
  isShuffle,
  repeatMode,
  effectiveVolume,
  isMuted,
  copiedShare,
  manualQueue = [],
  autoplayTracks = [],
  onNavigateToCurrentTrack,
  onOpenQualityModal,
  onToggleShuffle,
  onSkipPrev,
  onSkipNext,
  onDirectTogglePlay,
  onCycleRepeat,
  onSeek,
  onShareTrack,
  onOpenQueue,
  onOpenFullScreen,
  onClosePlayer,
  onToggleMute,
  onVolumeChange,
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

  return (
    <Box
      sx={{
        display: { xs: 'none', sm: 'grid' },
        gridTemplateColumns: 'minmax(0, 1fr) auto minmax(0, 1fr)',
        alignItems: 'center',
        width: '100%',
        columnGap: { sm: 2, md: 3 },
      }}
    >
      {/* === LEFT COLUMN: TRACK INFO & COVER ART === */}
      <DesktopPlayerLeftInfo
        playingTrack={playingTrack}
        coverArt={coverArt}
        onNavigateToCurrentTrack={onNavigateToCurrentTrack}
        audioQualityLabel={audioQualityLabel}
        isStuttering={isStuttering}
        onOpenQualityModal={onOpenQualityModal}
      />

      {/* === CENTER COLUMN: TRANSPORT & PROGRESS === */}
      <DesktopPlayerTransport
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
      />

      {/* === RIGHT COLUMN: SECONDARY ACTIONS & VOLUME === */}
      <DesktopPlayerRightControls
        copiedShare={copiedShare}
        onShareTrack={onShareTrack}
        onOpenQueue={onOpenQueue}
        manualQueue={manualQueue}
        onOpenFullScreen={onOpenFullScreen}
        onClosePlayer={onClosePlayer}
        effectiveVolume={effectiveVolume}
        isMuted={isMuted}
        onToggleMute={onToggleMute}
        onVolumeChange={onVolumeChange}
        VolumeIconComponent={VolumeIconComponent}
      />
    </Box>
  )
}
