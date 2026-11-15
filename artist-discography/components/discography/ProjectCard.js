'use client'

import { memo } from 'react'
import { Paper, Box } from '@mui/material'
import { withMediaQuery } from '@/lib/media/mediaUrl'
import { usePerformanceMode } from '@/lib/performance/PerformanceModeContext'
import ProjectHeader from './ProjectHeader'
import TrackList from './TrackList'

const ProjectCard = memo(function ProjectCard({
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
  isPrivateAuthenticated = false,
}) {
  const { isLiteMode } = usePerformanceMode()
  const cover = project?.cover ?? project?.image ?? ''
  const isApiMedia = typeof cover === 'string' && cover.startsWith('/api/media')
  const ambientCover = isApiMedia
    ? isLiteMode
      ? withMediaQuery(cover, { w: 64, q: 25, blur: 20, fmt: 'webp' })
      : withMediaQuery(cover, { w: 48, q: 20, blur: 8, fmt: 'webp' })
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
      {/* Ambient album art glow behind project card */}
      {ambientCover && (
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${ambientCover})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: isLiteMode ? 'none' : 'blur(40px) saturate(1.4)',
            transform: isLiteMode ? 'none' : 'scale(1.15)',
            opacity: isLiteMode ? 0.1 : 0.08,
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
          isPrivateAuthenticated={isPrivateAuthenticated}
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
})

export default ProjectCard
