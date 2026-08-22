'use client'

import { Box, Typography, IconButton, Stack, Tooltip } from '@mui/material'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded'
import CastRoundedIcon from '@mui/icons-material/CastRounded'
import CastConnectedRoundedIcon from '@mui/icons-material/CastConnectedRounded'
import PictureInPictureAltRoundedIcon from '@mui/icons-material/PictureInPictureAltRounded'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'

/**
 * Top header bar for FullScreenPlayerModal.
 *
 * @param {Object} props
 * @param {Object} props.playingTrack - Currently playing track
 * @param {Function} [props.onClose] - Minimize/close modal
 * @param {Function} [props.onClosePlayer] - Completely terminate audio player
 * @param {Function} [props.onNavigateToCurrentTrack] - Scroll/navigate to track in catalog
 * @param {boolean} [props.isCasting=false] - Active cast status
 * @param {boolean} [props.castError=false] - Error state for casting
 * @param {string} [props.castType='remote'] - 'remote' | 'airplay' | 'none'
 * @param {Function} [props.onPromptCast] - Trigger cast picker
 * @param {boolean} [props.isPipActive=false] - Picture-in-Picture status
 * @param {boolean} [props.isTouch=false] - Touch device detection
 * @param {Function} [props.onTogglePip] - Toggle PiP
 */
export default function FullScreenHeader({
  playingTrack,
  onClose,
  onClosePlayer,
  onNavigateToCurrentTrack,
  isCasting = false,
  castError = false,
  castType = 'remote',
  onPromptCast,
  isPipActive = false,
  isTouch = false,
  onTogglePip,
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        pt: { xs: 2, sm: 1.5, md: 1 },
        pb: { xs: 1, sm: 0.5 },
        position: 'relative',
        zIndex: 1,
        flexShrink: 0,
      }}
    >
      {/* Left: Close player & stop playback */}
      <IconButton
        onClick={() => {
          if (onClose) onClose()
          if (onClosePlayer) onClosePlayer()
        }}
        size='small'
        sx={{
          color: 'text.secondary',
          p: { xs: 0.75, sm: 1 },
          position: 'relative',
          zIndex: 2,
          '&:hover': {
            color: 'text.primary',
          },
        }}
      >
        <CloseRoundedIcon sx={{ fontSize: { xs: 22, sm: 26 } }} />
      </IconButton>

      {/* Center: Track Context Button (Absolute 50% screen center) */}
      <Box
        sx={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          maxWidth: {
            xs: 'calc(100% - 130px)',
            sm: 'calc(100% - 190px)',
            md: 'calc(100% - 250px)',
          },
          zIndex: 1,
          pointerEvents: 'auto',
        }}
      >
        <Stack
          component='button'
          type='button'
          onClick={() => {
            if (onClose) onClose()
            if (onNavigateToCurrentTrack) onNavigateToCurrentTrack()
          }}
          spacing={0.25}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            textAlign: 'center',
            minWidth: 0,
            width: 'fit-content',
            maxWidth: '100%',
            px: { xs: 1.25, sm: 1.5 },
            py: 1,
            bgcolor: 'transparent',
            border: 'none',
            borderRadius: 2,
            cursor: 'pointer',
            userSelect: 'none',
            transition: 'background-color 0.15s ease, transform 0.15s ease',
            '&:hover': {
              bgcolor: (theme) =>
                theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
              transform: 'scale(1.02)',
            },
            '&:hover .top-project-title': {
              color: 'primary.main',
              textDecoration: 'underline',
            },
            '&:hover .top-project-artist': {
              color: 'text.primary',
            },
            '&:active': {
              transform: 'scale(0.98)',
            },
          }}
        >
          <Typography
            className='top-project-title'
            variant='subtitle2'
            sx={{
              fontWeight: 700,
              color: 'text.primary',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: { xs: 180, sm: 280, md: 420, lg: 560 },
              fontSize: { xs: '0.875rem', sm: '0.95rem' },
              lineHeight: 1.2,
              transition: 'color 0.15s ease',
            }}
          >
            {playingTrack?.project || 'Discography'}
          </Typography>

          <Typography
            className='top-project-artist'
            variant='caption'
            sx={{
              color: 'text.secondary',
              fontWeight: 500,
              fontSize: { xs: '0.725rem', sm: '0.8rem' },
              lineHeight: 1.2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: { xs: 180, sm: 280, md: 420, lg: 560 },
              transition: 'color 0.15s ease',
            }}
          >
            {playingTrack?.projectArtist || playingTrack?.artist || 'Artist'}
          </Typography>
        </Stack>
      </Box>

      {/* Right: Cast, PiP & Down chevron collapse/minimize modal buttons */}
      <Stack
        direction='row'
        spacing={{ xs: 0.5, sm: 1 }}
        sx={{
          alignItems: 'center',
          flexShrink: 0,
          position: 'relative',
          zIndex: 2,
        }}
      >
        {/* Cast / Remote Playback / AirPlay */}
        {onPromptCast && (
          <Tooltip
            title={
              castError
                ? 'Casting Unavailable / Failed'
                : isCasting
                  ? 'Connected to Cast Device'
                  : castType === 'airplay'
                    ? 'AirPlay to Speaker / TV'
                    : 'Cast to Device'
            }
            arrow
          >
            <IconButton
              onClick={onPromptCast}
              size='small'
              sx={{
                color: castError ? 'error.main' : isCasting ? 'primary.main' : 'text.secondary',
                p: { xs: 0.75, sm: 1 },
                animation: castError ? 'castShakeError 0.45s ease-in-out' : 'none',
                '@keyframes castShakeError': {
                  '0%, 100%': { transform: 'translateX(0)' },
                  '25%': { transform: 'translateX(-4px)' },
                  '50%': { transform: 'translateX(4px)' },
                  '75%': { transform: 'translateX(-2px)' },
                },
                filter: castError ? 'drop-shadow(0 0 6px rgba(244, 67, 54, 0.75))' : 'none',
                transition: 'color 0.2s ease, filter 0.2s ease',
                '&:hover': {
                  color: castError ? 'error.dark' : isCasting ? 'primary.main' : 'text.primary',
                },
              }}
              aria-label={castType === 'airplay' ? 'AirPlay audio' : 'Cast audio'}
            >
              {castError ? (
                <WarningAmberRoundedIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
              ) : isCasting ? (
                <CastConnectedRoundedIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
              ) : (
                <CastRoundedIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
              )}
            </IconButton>
          </Tooltip>
        )}

        {/* Picture in Picture (Desktop viewports only) */}
        {onTogglePip && !isTouch && (
          <Tooltip title={isPipActive ? 'Exit Picture in Picture' : 'Picture in Picture'} arrow>
            <IconButton
              onClick={onTogglePip}
              size='small'
              sx={{
                display: { md: 'inline-flex' },
                color: isPipActive ? 'primary.main' : 'text.secondary',
                p: { xs: 0.75, sm: 1 },
                '&:hover': {
                  color: isPipActive ? 'primary.main' : 'text.primary',
                },
              }}
              aria-label='Picture in Picture'
            >
              <PictureInPictureAltRoundedIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
            </IconButton>
          </Tooltip>
        )}

        {/* Down chevron collapse/minimize modal button */}
        <IconButton
          onClick={onClose}
          size='small'
          sx={{
            color: 'text.secondary',
            p: { xs: 0.75, sm: 1 },
            '&:hover': {
              color: 'text.primary',
            },
          }}
          aria-label='Minimize player'
        >
          <KeyboardArrowDownRoundedIcon sx={{ fontSize: { xs: 24, sm: 28 } }} />
        </IconButton>
      </Stack>
    </Box>
  )
}
