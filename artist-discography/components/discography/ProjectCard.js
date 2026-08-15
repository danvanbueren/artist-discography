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
  onSelectTrackRow,
  onSelectTrackTitle,
  selectedPlatform,
}) {
  const cover = project?.cover ?? project?.image ?? ''
  const ambientCover = cover && typeof cover === 'string' && cover.startsWith('/api/media')
    ? `${cover}${cover.includes('?') ? '&' : '?'}w=48&q=20&blur=8`
    : cover

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
      {ambientCover && (
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${ambientCover})`,
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
          onSelectTrackRow={onSelectTrackRow}
          onSelectTrackTitle={onSelectTrackTitle}
          selectedPlatform={selectedPlatform}
        />
      </Box>
    </Paper>
  )
}
