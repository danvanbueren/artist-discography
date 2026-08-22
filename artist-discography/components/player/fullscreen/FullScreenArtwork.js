'use client'

import { Box } from '@mui/material'
import MusicNoteRoundedIcon from '@mui/icons-material/MusicNoteRounded'
import ProgressiveImage from '@/components/ui/ProgressiveImage'

/**
 * Centered responsive artwork container with aspect ratio constraint.
 *
 * @param {Object} props
 * @param {string|null} props.coverArt - Cover image URL
 * @param {string} [props.trackName] - Track name for alt text
 */
export default function FullScreenArtwork({ coverArt, trackName = 'Cover' }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: { xs: 1, sm: 2 },
        my: 'auto',
        width: '100%',
        position: 'relative',
        zIndex: 1,
        flexShrink: 1,
        minHeight: 0,
      }}
    >
      <Box
        sx={{
          width: {
            xs: 'min(68dvw, calc(100dvh - 340px))',
            sm: 'min(68dvw, calc(100dvh - 350px))',
            md: 'min(70dvw, calc(100dvh - 360px), 480px)',
            lg: 'min(70dvw, calc(100dvh - 270px), 520px)',
            xl: 'min(70dvw, calc(100dvh - 270px), 580px)',
          },
          height: {
            xs: 'min(68dvw, calc(100dvh - 340px))',
            sm: 'min(68dvw, calc(100dvh - 350px))',
            md: 'min(70dvw, calc(100dvh - 360px), 480px)',
            lg: 'min(70dvw, calc(100dvh - 270px), 520px)',
            xl: 'min(70dvw, calc(100dvh - 270px), 580px)',
          },
          aspectRatio: '1 / 1',
          borderRadius: { xs: 3, sm: 4, lg: 5 },
          overflow: 'hidden',
          boxShadow: '0 20px 52px rgba(0,0,0,0.65)',
          bgcolor: 'primary.main',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'primary.contrastText',
          flexShrink: 0,
        }}
      >
        {coverArt ? (
          <ProgressiveImage
            src={coverArt}
            alt={trackName}
            targetWidth={800}
            placeholderWidth={48}
            quality={85}
            priority
            sx={{
              width: '100%',
              height: '100%',
            }}
          />
        ) : (
          <MusicNoteRoundedIcon sx={{ fontSize: { xs: 44, sm: 64, lg: 80 } }} />
        )}
      </Box>
    </Box>
  )
}
