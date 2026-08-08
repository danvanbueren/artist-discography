'use client'

import { Paper, Box, Button } from '@mui/material'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
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
      {isSingleView && onBackToAll && (
        <Box sx={{ pt: 2, px: 3 }}>
          <Button
            size="small"
            startIcon={<ArrowBackRoundedIcon />}
            onClick={onBackToAll}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: 2,
            }}
          >
            Back to All Releases
          </Button>
        </Box>
      )}

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
