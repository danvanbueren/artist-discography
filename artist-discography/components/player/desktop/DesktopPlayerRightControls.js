'use client'

import { Box, Stack, IconButton, Slider, Badge } from '@mui/material'
import QueueMusicRoundedIcon from '@mui/icons-material/QueueMusicRounded'
import ShareRoundedIcon from '@mui/icons-material/ShareRounded'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import FullscreenRoundedIcon from '@mui/icons-material/FullscreenRounded'

/**
 * Right Column of DesktopPlayerBar: Action buttons (Queue, Share, Fullscreen, Close)
 * and volume slider controls stacked below.
 *
 * @param {Object} props
 * @param {boolean} [props.copiedShare=false] - Share copied status
 * @param {Function} [props.onShareTrack] - Share track handler
 * @param {Function} [props.onOpenQueue] - Queue dialog trigger
 * @param {Array} [props.manualQueue=[]] - Queue items
 * @param {Function} [props.onOpenFullScreen] - Full screen modal trigger
 * @param {Function} [props.onClosePlayer] - Close player handler
 * @param {number} props.effectiveVolume - Active volume level (0-100)
 * @param {boolean} props.isMuted - Mute state
 * @param {Function} props.onToggleMute - Mute toggle
 * @param {Function} props.onVolumeChange - Volume slider handler
 * @param {React.ComponentType<any>} props.VolumeIconComponent - Dynamic volume icon
 */
export default function DesktopPlayerRightControls({
  copiedShare = false,
  onShareTrack,
  onOpenQueue,
  manualQueue = [],
  onOpenFullScreen,
  onClosePlayer,
  effectiveVolume,
  isMuted,
  onToggleMute,
  onVolumeChange,
  VolumeIconComponent,
}) {
  return (
    <Stack
      spacing={1}
      sx={{
        display: 'flex',
        alignItems: 'flex-end',
      }}
    >
      <Box sx={{}}>
        {/* Top Row: Action Buttons */}
        <Stack
          direction='row'
          spacing={{ sm: 0.5, md: 0.75 }}
          sx={{
            alignItems: 'center',
            justifyContent: 'flex-end',
          }}
        >
          {/* Share Track Button */}
          <IconButton
            size='small'
            onClick={onShareTrack}
            sx={{
              color: copiedShare ? 'success.main' : 'text.secondary',
              p: 0.75,
              '&:hover': { color: 'text.primary' },
            }}
            title={copiedShare ? 'Copied link!' : 'Share Track'}
          >
            {copiedShare ? (
              <CheckRoundedIcon sx={{ fontSize: 18 }} />
            ) : (
              <ShareRoundedIcon sx={{ fontSize: 18 }} />
            )}
          </IconButton>

          {/* Queue Button */}
          <IconButton
            size='small'
            onClick={onOpenQueue}
            sx={{
              color: 'text.secondary',
              p: 0.75,
              '&:hover': { color: 'text.primary' },
            }}
            title='Queue'
          >
            <Badge
              badgeContent={manualQueue.length > 0 ? manualQueue.length : null}
              color='primary'
              sx={{
                '& .MuiBadge-badge': {
                  fontSize: '0.7rem',
                  height: 16,
                  minWidth: 16,
                  top: 2,
                  right: 2,
                },
              }}
            >
              <QueueMusicRoundedIcon sx={{ fontSize: 20 }} />
            </Badge>
          </IconButton>

          {/* Fullscreen Player Modal Button */}
          <IconButton
            size='small'
            onClick={onOpenFullScreen}
            sx={{
              color: 'text.secondary',
              p: 0.75,
              '&:hover': { color: 'text.primary' },
            }}
            title='Open Full-Screen Player'
          >
            <FullscreenRoundedIcon sx={{ fontSize: 22 }} />
          </IconButton>

          {/* Close Player Bar Button */}
          <IconButton
            size='small'
            onClick={onClosePlayer}
            sx={{
              color: 'text.secondary',
              p: 0.75,
              '&:hover': { color: 'text.primary' },
            }}
            title='Close Player'
          >
            <CloseRoundedIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Stack>

        {/* Bottom Row: Volume Controls */}
        <Stack
          direction='row'
          spacing={0}
          sx={{
            alignItems: 'center',
            justifyContent: 'flex-end',
          }}
        >
          <IconButton
            size='small'
            onClick={onToggleMute}
            sx={{
              zIndex: 1000,
              color: isMuted ? 'error.main' : 'text.secondary',
              mr: 1.2,
              '&:hover': { color: 'text.primary' },
            }}
          >
            {VolumeIconComponent && <VolumeIconComponent sx={{ fontSize: 24 }} />}
          </IconButton>

          <Slider
            value={effectiveVolume}
            onChange={onVolumeChange}
            min={0}
            max={100}
            sx={{
              zIndex: 900,
              mr: 1.3,
              color: isMuted && 'text.secondary',
              '& .MuiSlider-thumb': {
                width: 10,
                height: 10,
                '&:hover, &.Mui-focused, &.Mui-active': {
                  boxShadow: '0 0 0 6px rgba(144, 202, 249, 0.2)',
                },
              },
              '& .MuiSlider-track': { border: 'none' },
              '& .MuiSlider-rail': { opacity: 0.25 },
            }}
          />
        </Stack>
      </Box>
    </Stack>
  )
}
