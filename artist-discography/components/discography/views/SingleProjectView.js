'use client'

import { Box, Stack } from '@mui/material'
import CompactArtistHeader from '@/components/layout/CompactArtistHeader'
import ProjectCard from '../ProjectCard'

/**
 * SingleProjectView
 * Dedicated layout for displaying a single project in full detail with tracklist.
 *
 * @param {Object} props
 * @param {Object} props.selectedProject - Currently active project
 * @param {Object} props.artist - Artist configuration
 * @param {boolean} props.darkMode - Active theme mode
 * @param {Function} props.onToggleTheme - Theme toggle handler
 * @param {string} props.selectedPlatform - Preferred music platform ID
 * @param {Function} props.onOpenPlatformModal - Platform selector trigger
 * @param {string|null} props.ambientImage - Ambient background image URL
 * @param {boolean} props.hasAvailablePlatforms - Whether any streaming platforms are available
 * @param {string} props.audioQuality - Active audio quality tier
 * @param {boolean} props.isStuttering - Stutter indicator
 * @param {Function} props.onOpenQualityModal - Quality modal trigger
 * @param {boolean} props.isPrivateAuthenticated - Whether private code is validated
 * @param {Function} props.onOpenPrivateAccessModal - Private access modal trigger
 * @param {Function} props.onNavigateHome - Navigate back to all projects
 * @param {Function} props.onPlayTrack - Play track trigger
 * @param {Function} props.onAddToQueue - Add track to queue trigger
 * @param {Function} props.onShowToast - Toast message trigger
 * @param {Object|null} props.playingTrack - Currently playing track
 * @param {boolean} props.isPlaying - Active playback status
 * @param {string|null} props.highlightedTrackSlug - Selected track slug
 * @param {Function} props.onSelectTrackRow - Track row select handler
 * @param {Function} props.onSelectTrackTitle - Track title select handler
 */
export default function SingleProjectView({
  selectedProject,
  artist,
  darkMode,
  onToggleTheme,
  selectedPlatform,
  onOpenPlatformModal,
  ambientImage,
  hasAvailablePlatforms,
  audioQuality,
  isStuttering,
  onOpenQualityModal,
  isPrivateAuthenticated,
  onOpenPrivateAccessModal,
  onNavigateHome,
  onPlayTrack,
  onAddToQueue,
  onShowToast,
  playingTrack,
  isPlaying,
  highlightedTrackSlug,
  onSelectTrackRow,
  onSelectTrackTitle,
}) {
  if (!selectedProject) return null

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        flexGrow: 1,
        width: '100%',
        py: { xs: 2, sm: 3 },
      }}
    >
      {/* Top flexible spacer */}
      <Box sx={{ flexGrow: 1, flexBasis: 0, minHeight: 0 }} />

      <Stack
        spacing={3}
        sx={{
          width: '100%',
          flexShrink: 0,
        }}
      >
        <CompactArtistHeader
          artist={artist}
          onNavigateHome={onNavigateHome ? () => onNavigateHome(selectedProject) : undefined}
          darkMode={darkMode}
          onToggleTheme={onToggleTheme}
          selectedPlatform={selectedPlatform}
          onOpenPlatformModal={onOpenPlatformModal}
          ambientImage={ambientImage}
          hasAvailablePlatforms={hasAvailablePlatforms}
          audioQuality={audioQuality}
          isStuttering={isStuttering}
          onOpenQualityModal={onOpenQualityModal}
          isPrivateAuthenticated={isPrivateAuthenticated}
          onOpenPrivateAccessModal={onOpenPrivateAccessModal}
        />

        <ProjectCard
          project={selectedProject}
          artistName={artist?.name || 'Artist'}
          isSingleView={true}
          onPlayTrack={onPlayTrack}
          onAddToQueue={onAddToQueue}
          onShowToast={onShowToast}
          playingTrack={playingTrack}
          isPlaying={isPlaying}
          highlightedTrackSlug={highlightedTrackSlug}
          onSelectTrackRow={(track) => onSelectTrackRow(track, selectedProject)}
          onSelectTrackTitle={(track) => onSelectTrackTitle(track, selectedProject)}
          selectedPlatform={selectedPlatform}
          isPrivateAuthenticated={isPrivateAuthenticated}
        />
      </Stack>

      {/* Bottom flexible spacer */}
      <Box sx={{ flexGrow: 1.5, flexBasis: 0, minHeight: 0 }} />
    </Box>
  )
}
