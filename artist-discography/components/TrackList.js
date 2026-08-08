'use client'

import { Box, Stack, Typography, Divider } from '@mui/material'
import TrackRow from './TrackRow'
import SubduedText from './SubduedText'

export default function TrackList({
  tracks = [],
  projectArtist = '',
  onPlayTrack,
  playingTrack,
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
    <Stack spacing={0.5} sx={{ px: { xs: 1, sm: 2 }, pb: 2 }}>
      <Divider sx={{ mb: 1, opacity: 0.15 }} />
      {tracks.map((track, idx) => {
        const trackSlug = track.name
          ? track.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-')
          : `track-${idx + 1}`
        const isHighlighted = highlightedTrackSlug === trackSlug
        const isPlayingThisTrack = playingTrack?.name === track.name

        return (
          <TrackRow
            key={idx}
            track={track}
            index={idx}
            projectArtist={projectArtist}
            onPlayTrack={onPlayTrack}
            isPlayingThisTrack={isPlayingThisTrack}
            isHighlighted={isHighlighted}
            onSelectTrack={onSelectTrack}
            selectedPlatform={selectedPlatform}
          />
        )
      })}
    </Stack>
  )
}
