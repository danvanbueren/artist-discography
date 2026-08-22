'use client'

import {
  Dialog,
  DialogTitle,
  DialogContent,
  Stack,
  Paper,
  Box,
  Typography,
  IconButton,
} from '@mui/material'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import RadioButtonUncheckedRoundedIcon from '@mui/icons-material/RadioButtonUncheckedRounded'
import HeadphonesRoundedIcon from '@mui/icons-material/HeadphonesRounded'

export const STREAMING_PLATFORMS = [
  { id: 'youtube', name: 'YouTube Music', icon: '/platforms/youtube.webp' },
  { id: 'soundcloud', name: 'SoundCloud', icon: '/platforms/soundcloud.webp' },
  { id: 'spotify', name: 'Spotify', icon: '/platforms/spotify.webp' },
  { id: 'apple', name: 'Apple Music', icon: '/platforms/apple.webp' },
  { id: 'bandcamp', name: 'Bandcamp', icon: '/platforms/bandcamp.webp' },
  { id: 'tidal', name: 'Tidal', icon: '/platforms/tidal.webp' },
  { id: 'deezer', name: 'Deezer', icon: '/platforms/deezer.webp' },
  { id: 'amazon', name: 'Amazon Music', icon: '/platforms/amazon.webp' },
  { id: 'pandora', name: 'Pandora', icon: '/platforms/pandora.webp' },
  { id: 'itunes', name: 'iTunes Store', icon: '/platforms/itunes.webp' },
]

export default function PlatformSelectorModal({
  open,
  onClose,
  selectedPlatform,
  onSelectPlatform,
  availablePlatforms = STREAMING_PLATFORMS,
}) {
  const handleSelect = (platformId) => {
    if (onSelectPlatform) {
      onSelectPlatform(platformId)
    }
    if (onClose) {
      onClose()
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth='xs'
      slotProps={{
        paper: {
          sx: {
            borderRadius: 4,
            p: { xs: 1.5, sm: 2 },
            bgcolor: 'background.paper',
            backgroundImage: 'none',
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 24px 48px rgba(0, 0, 0, 0.4)',
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          m: 0,
          p: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Stack direction='row' spacing={1.5} sx={{ alignItems: 'center' }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(144, 202, 249, 0.15)',
              color: 'primary.main',
            }}
          >
            <HeadphonesRoundedIcon fontSize='small' />
          </Box>
          <Typography variant='h6' sx={{ fontWeight: 800 }}>
            Streaming Platform
          </Typography>
        </Stack>
        <IconButton
          aria-label='close'
          onClick={onClose}
          sx={{ color: 'text.secondary', p: 0.5 }}
        >
          <CloseRoundedIcon fontSize='small' />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          p: 1.5,
          pt: 1,
          pb: 1.5,
          maxHeight: { xs: 380, sm: 440 },
          overflowY: 'auto',
        }}
      >
        <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
          Select your preferred music streaming service for direct track and project links.
        </Typography>

        {availablePlatforms.length === 0 ? (
          <Box sx={{ py: 4, px: 2, textAlign: 'center' }}>
            <Typography variant='body2' color='text.secondary'>
              No platform links available across tracks.
            </Typography>
          </Box>
        ) : (
          <Stack spacing={1}>
            {availablePlatforms.map((platform) => {
              const isSelected = selectedPlatform === platform.id
              return (
                <Paper
                  key={platform.id}
                  onClick={() => handleSelect(platform.id)}
                  elevation={0}
                  sx={{
                    p: 1.25,
                    px: 1.75,
                    borderRadius: 2.5,
                    cursor: 'pointer',
                    border: '1.5px solid',
                    borderColor: isSelected ? 'primary.main' : 'divider',
                    bgcolor: isSelected
                      ? (theme) =>
                          theme.palette.mode === 'dark'
                            ? 'rgba(144, 202, 249, 0.12)'
                            : 'rgba(25, 118, 210, 0.08)'
                      : 'background.paper',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: isSelected ? 'primary.main' : 'text.secondary',
                      bgcolor: (theme) =>
                        theme.palette.mode === 'dark'
                          ? 'rgba(255, 255, 255, 0.06)'
                          : 'rgba(0, 0, 0, 0.04)',
                      transform: 'translateY(-1px)',
                    },
                  }}
                >
                  <Stack direction='row' spacing={1.5} sx={{ alignItems: 'center' }}>
                    <Box
                      sx={{
                        width: 34,
                        height: 34,
                        borderRadius: 1.5,
                        bgcolor: 'action.hover',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        overflow: 'hidden',
                      }}
                    >
                      <Box
                        component='img'
                        src={platform.icon}
                        alt={platform.name}
                        draggable={false}
                        loading='eager'
                        decoding='async'
                        sx={{
                          width: 24,
                          height: 24,
                          objectFit: 'contain',
                        }}
                      />
                    </Box>
                    <Typography
                      variant='body2'
                      sx={{
                        fontWeight: isSelected ? 800 : 600,
                        fontSize: '0.925rem',
                        color: isSelected ? 'primary.main' : 'text.primary',
                      }}
                    >
                      {platform.name}
                    </Typography>
                  </Stack>

                  <Box sx={{ flexShrink: 0 }}>
                    {isSelected ? (
                      <CheckCircleRoundedIcon color='primary' sx={{ fontSize: 22 }} />
                    ) : (
                      <RadioButtonUncheckedRoundedIcon
                        sx={{ fontSize: 22, color: 'text.disabled' }}
                      />
                    )}
                  </Box>
                </Paper>
              )
            })}
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  )
}
