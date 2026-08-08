'use client'

import { Paper } from '@mui/material'
import ProjectHeader from './ProjectHeader'
import TrackList from './TrackList'

export default function ProjectCard({
  project,
  artistName,
  onSelectProject,
  onBackToAll,
  isSingleView = false,
  onPlayTrack,
  playingTrack,
  highlightedTrackSlug,
  onSelectTrack,
  selectedPlatform,
}) {
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
        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
        '&:hover': !isSingleView
          ? {
              boxShadow: '0 12px 32px rgba(0,0,0,0.25)',
            }
          : {},
      }}
    >

      <ProjectHeader
        project={project}
        artistName={artistName}
        onSelectProject={onSelectProject}
        selectedPlatform={selectedPlatform}
        isSingleView={isSingleView}
      />

      <TrackList
        tracks={project?.tracks ?? []}
        projectArtist={project?.artist || artistName}
        onPlayTrack={onPlayTrack}
        playingTrack={playingTrack}
        highlightedTrackSlug={highlightedTrackSlug}
        onSelectTrack={onSelectTrack}
        selectedPlatform={selectedPlatform}
      />
    </Paper>
  )
}
