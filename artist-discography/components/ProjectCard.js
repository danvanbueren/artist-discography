'use client'

import { Paper, Box } from '@mui/material'
import ProjectHeader from './ProjectHeader'
import TrackList from './TrackList'

export default function ProjectCard({
  project,
  artistName,
  onSelectProject,
  onBackToAll,
  isSingleView = false,
  onPlayTrack,
  onAddToQueue,
  onShowToast,
  playingTrack,
  isPlaying = false,
  highlightedTrackSlug,
  onSelectTrack,
  selectedPlatform,
}) {
  const cover = project?.cover ?? project?.image ?? ''

  return (
    <Paper
      elevation={2}
      sx={{
        borderRadius: 3,
        overflow: 'hidden',
        bgcolor: 'background.paper',
        backgroundImage: 'none',
        border: '1px solid',
        borderColor: 'divider',
        position: 'relative',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
        '&:hover': !isSingleView
          ? {
              boxShadow: '0 12px 32px rgba(0,0,0,0.25)',
            }
          : {},
      }}
    >
      {/* Blurred album art ambient background */}
      {cover && (
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${cover})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(40px) saturate(1.4)',
            opacity: 0.08,
            transform: 'scale(1.15)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
      )}

      {/* Content sits above the ambient background */}
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <ProjectHeader
          project={project}
          artistName={artistName}
          onSelectProject={onSelectProject}
          selectedPlatform={selectedPlatform}
          isSingleView={isSingleView}
        />

        <TrackList
          project={project}
          tracks={project?.tracks ?? []}
          projectArtist={project?.artist || artistName}
          onPlayTrack={onPlayTrack}
          onAddToQueue={onAddToQueue}
          onShowToast={onShowToast}
          playingTrack={playingTrack}
          isPlaying={isPlaying}
          highlightedTrackSlug={highlightedTrackSlug}
          onSelectTrack={onSelectTrack}
          selectedPlatform={selectedPlatform}
        />
      </Box>
    </Paper>
  )
}
