'use client'

import { Box, Stack, Typography } from '@mui/material'
import AudioQualityPill from '../AudioQualityPill'

/**
 * Track title, artist, and audio quality pill for FullScreenPlayerModal.
 *
 * @param {Object} props
 * @param {Object} props.playingTrack - Currently playing track
 * @param {string} props.audioQualityLabel - Quality label for pill
 * @param {boolean} [props.isStuttering=false] - Stutter warning indicator
 * @param {Function} [props.onOpenQualityModal] - Quality modal open trigger
 * @param {boolean} [props.isDesktop=false] - Desktop grid mode styling
 */
export default function FullScreenTrackMeta({
  playingTrack,
  audioQualityLabel,
  isStuttering = false,
  onOpenQualityModal,
  isDesktop = false,
}) {
  return (
    <Box
      sx={{
        minWidth: 0,
        flexGrow: isDesktop ? 0 : 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <Typography
        variant='h5'
        sx={{
          fontWeight: 800,
          color: 'text.primary',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontSize: isDesktop
            ? { lg: '1.35rem', xl: '1.55rem' }
            : { xs: '1.35rem', sm: '1.55rem', md: '1.75rem' },
          lineHeight: 1.2,
          pb: 0.5,
        }}
      >
        {playingTrack?.name || 'Untitled Track'}
      </Typography>

      <Stack
        direction='row'
        spacing={isDesktop ? 1 : 1.25}
        sx={{
          alignItems: 'center',
          minWidth: 0,
        }}
      >
        <Typography
          variant='subtitle1'
          sx={{
            color: 'text.secondary',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontWeight: 500,
            fontSize: isDesktop
              ? { lg: '0.95rem', xl: '1.025rem' }
              : { xs: '0.95rem', sm: '1.05rem' },
            lineHeight: 1.2,
          }}
        >
          {playingTrack?.artist || 'Artist'}
        </Typography>

        <AudioQualityPill
          label={audioQualityLabel}
          size='large'
          isStuttering={isStuttering}
          onClick={onOpenQualityModal}
        />
      </Stack>
    </Box>
  )
}
