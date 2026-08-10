'use client'

import { Box, Stack, Typography, Divider } from '@mui/material'
import TrackRow from './TrackRow'
import SubduedText from './SubduedText'

export default function TrackList({
  project,
  tracks = [],
  projectArtist = '',
  onPlayTrack,
  onAddToQueue,
  onShowToast,
  playingTrack,
  isPlaying = false,
  highlightedTrackSlug,
  onSelectTrack,
  selectedPlatform,
}) {
  if (!tracks || tracks.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <SubduedText
          value=""
          placeholder="No tracks listed for this project."
          variant="body2"
        />
      </Box>
    )
  }

  return (
    <Stack spacing={0.5} sx={{ px: { xs: 2, sm: 2.5, md: 3 }, pt: { xs: 1.5, sm: 2 }, pb: 2.5 }}>
      <Divider sx={{ mt: 0.5, mb: 2, opacity: 0.15 }} />
      {tracks.map((track, idx) => {
        const trackSlug = track.name
          ? track.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-')
          : `track-${idx + 1}`
        const isHighlighted = highlightedTrackSlug === trackSlug
        const isPlayingThisTrack = playingTrack?.name === track.name
        const isPlayerActive = Boolean(playingTrack)

        return (
          <TrackRow
            key={idx}
            track={track}
            index={idx}
            project={project}
            projectArtist={projectArtist}
            onPlayTrack={onPlayTrack}
            onAddToQueue={onAddToQueue}
            onShowToast={onShowToast}
            isPlayingThisTrack={isPlayingThisTrack}
            isPlaying={isPlaying}
            isPlayerActive={isPlayerActive}
            isHighlighted={isHighlighted}
            onSelectTrack={onSelectTrack}
            selectedPlatform={selectedPlatform}
          />
        )
      })}
    </Stack>
  )
}
