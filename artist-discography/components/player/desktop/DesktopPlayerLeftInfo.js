'use client'

import { Box, Stack, Typography } from '@mui/material'
import MusicNoteRoundedIcon from '@mui/icons-material/MusicNoteRounded'
import ProgressiveImage from '@/components/ui/ProgressiveImage'
import AudioQualityPill from '../AudioQualityPill'

/**
 * Left Column of DesktopPlayerBar: Cover art thumbnail, track title, artist/project, and quality pill.
 *
 * @param {Object} props
 * @param {Object} props.playingTrack - Currently playing track
 * @param {string|null} props.coverArt - Cover artwork URL
 * @param {Function} [props.onNavigateToCurrentTrack] - Scroll/navigate trigger
 * @param {string} [props.audioQualityLabel] - Active audio quality label
 * @param {boolean} [props.isStuttering=false] - Stutter warning state
 * @param {Function} [props.onOpenQualityModal] - Quality modal trigger
 */
export default function DesktopPlayerLeftInfo({
  playingTrack,
  coverArt,
  onNavigateToCurrentTrack,
  audioQualityLabel,
  isStuttering = false,
  onOpenQualityModal,
}) {
  return (
    <Stack
      direction='row'
      spacing={1.25}
      sx={{
        alignItems: 'center',
        minWidth: 0,
        width: '100%',
      }}
    >
      <Box
        onClick={onNavigateToCurrentTrack}
        sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 1.25,
          minWidth: 0,
          cursor: 'pointer',
          borderRadius: 2,
          p: 0.5,
          m: -0.5,
          transition: 'background-color 0.15s ease',
          '&:hover .desktop-track-name': {
            color: 'primary.main',
            textDecoration: 'underline',
          },
        }}
      >
        {/* Cover Art Thumbnail */}
        <Box
          sx={{
            width: 60,
            height: 60,
            aspectRatio: '1 / 1',
            borderRadius: 1.5,
            bgcolor: 'rgba(255, 255, 255, 0.08)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          {coverArt ? (
            <ProgressiveImage
              src={coverArt}
              alt={playingTrack?.name || 'Cover'}
              targetWidth={120}
              placeholderWidth={32}
              quality={75}
              sx={{
                width: '100%',
                height: '100%',
              }}
            />
          ) : (
            <MusicNoteRoundedIcon sx={{ fontSize: 24, color: 'text.secondary' }} />
          )}
        </Box>

        {/* Track Title & Artist with Quality Pill */}
        <Box sx={{ minWidth: 0 }}>
          <Typography
            className='desktop-track-name'
            variant='subtitle2'
            sx={{
              fontWeight: 700,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              color: 'text.primary',
              fontSize: { sm: '0.875rem', md: '0.95rem' },
              lineHeight: 1.2,
              transition: 'color 0.15s ease',
            }}
          >
            {playingTrack?.name || 'Untitled Track'}
          </Typography>

          <Stack
            direction='row'
            spacing={0.75}
            sx={{
              alignItems: 'center',
              minWidth: 0,
              mt: 0.25,
            }}
          >
            <Typography
              variant='caption'
              sx={{
                color: 'text.secondary',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontSize: { sm: '0.75rem', md: '0.8rem' },
                lineHeight: 1.2,
                m: 0,
                p: 0,
              }}
            >
              {playingTrack?.artist || 'Artist'}
              {playingTrack?.project && ` • ${playingTrack.project}`}
            </Typography>
          </Stack>

          {audioQualityLabel && (
            <AudioQualityPill
              label={audioQualityLabel}
              isStuttering={isStuttering}
              onClick={onOpenQualityModal}
            />
          )}

        </Box>
      </Box>
    </Stack>
  )
}
