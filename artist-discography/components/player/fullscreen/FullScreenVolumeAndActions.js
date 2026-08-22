'use client'

import { Box, Stack, IconButton, Slider, Badge } from '@mui/material'
import ShareRoundedIcon from '@mui/icons-material/ShareRounded'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import QueueMusicRoundedIcon from '@mui/icons-material/QueueMusicRounded'

/**
 * Volume slider and secondary actions (Share, Queue) for FullScreenPlayerModal.
 *
 * @param {Object} props
 * @param {boolean} props.copiedShare - Share copied status
 * @param {Function} props.onShareTrack - Share trigger
 * @param {Function} props.onOpenQueue - Queue dialog trigger
 * @param {Array} [props.manualQueue=[]] - Queue items
 * @param {boolean} [props.isTouch=false] - Touch screen status
 * @param {number} props.effectiveVolume - Active volume level (0-100)
 * @param {boolean} props.isMuted - Mute status
 * @param {Function} props.onToggleMute - Mute toggle
 * @param {Function} props.onVolumeChange - Volume slider change handler
 * @param {React.ComponentType<any>} props.VolumeIconComponent - Dynamic volume icon
 * @param {boolean} [props.isDesktop=false] - Desktop grid mode styling
 */
export default function FullScreenVolumeAndActions({
  copiedShare,
  onShareTrack,
  onOpenQueue,
  manualQueue = [],
  isTouch = false,
  effectiveVolume,
  isMuted,
  onToggleMute,
  onVolumeChange,
  VolumeIconComponent,
  isDesktop = false,
}) {
  return (
    <Stack
      direction='row'
      spacing={isDesktop ? 1 : { xs: 1.5, sm: 2 }}
      sx={{
        alignItems: 'center',
        justifyContent: isDesktop ? 'flex-end' : 'flex-start',
        minWidth: 0,
        flexShrink: 0,
      }}
    >
      {/* Share track button */}
      <IconButton
        onClick={onShareTrack}
        size={isDesktop ? 'small' : 'medium'}
        sx={{
          color: copiedShare ? 'success.main' : 'text.secondary',
          p: isDesktop ? 1 : { xs: 1.25, sm: 1.5 },
          '&:hover': {
            color: 'text.primary',
          },
        }}
      >
        {copiedShare ? (
          <CheckRoundedIcon sx={{ fontSize: isDesktop ? 22 : { xs: 26, sm: 28 } }} />
        ) : (
          <ShareRoundedIcon sx={{ fontSize: isDesktop ? 22 : { xs: 26, sm: 28 } }} />
        )}
      </IconButton>

      {/* Queue button */}
      <IconButton
        size={isDesktop ? 'small' : 'medium'}
        onClick={onOpenQueue}
        sx={{
          color: 'text.secondary',
          p: isDesktop ? 1 : { xs: 1.25, sm: 1.5 },
          '&:hover': {
            color: 'text.primary',
          },
        }}
      >
        <Badge
          badgeContent={manualQueue.length > 0 ? manualQueue.length : null}
          color='primary'
          sx={{
            '& .MuiBadge-badge': {
              fontSize: '0.75rem',
              height: 18,
              minWidth: 18,
              top: isDesktop ? 0 : 4,
              right: isDesktop ? 0 : 4,
            },
          }}
        >
          <QueueMusicRoundedIcon sx={{ fontSize: isDesktop ? 22 : { xs: 26, sm: 28 } }} />
        </Badge>
      </IconButton>

      {/* Contained Volume when mouse detected */}
      {!isTouch && (
        <Stack
          direction='row'
          spacing={0.75}
          sx={{
            alignItems: 'center',
            ml: isDesktop ? 1 : { xs: 0.5, sm: 1 },
          }}
        >
          <IconButton
            size='small'
            onClick={onToggleMute}
            sx={{
              color: isMuted ? 'error.main' : 'text.secondary',
              p: isDesktop ? 0.75 : { xs: 0.5, sm: 0.75 },
              position: 'relative',
              zIndex: 2,
              '&:hover': {
                color: 'text.primary',
              },
            }}
          >
            {VolumeIconComponent && (
              <VolumeIconComponent sx={{ fontSize: isDesktop ? 20 : { xs: 18, sm: 20 } }} />
            )}
          </IconButton>
          <Box
            sx={{
              width: isDesktop ? 100 : { xs: 65, sm: 80, md: 95 },
              display: 'flex',
              alignItems: 'center',
              px: 0.5,
              position: 'relative',
              zIndex: 1,
            }}
          >
            <Slider
              size='small'
              value={effectiveVolume}
              min={0}
              max={100}
              onChange={onVolumeChange}
              sx={{
                py: 0,
                height: 3,
                color: isMuted ? 'text.disabled' : 'primary.main',
                '& .MuiSlider-thumb': {
                  width: 10,
                  height: 10,
                  zIndex: 1,
                },
              }}
            />
          </Box>
        </Stack>
      )}
    </Stack>
  )
}
