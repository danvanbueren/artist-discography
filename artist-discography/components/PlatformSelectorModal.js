'use client'

import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  IconButton,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'

export const STREAMING_PLATFORMS = [
  { id: 'spotify', name: 'Spotify', icon: '/spotify.webp' },
  { id: 'apple', name: 'Apple Music', icon: '/apple.webp' },
  { id: 'youtube', name: 'YouTube Music', icon: '/youtube.webp' },
  { id: 'bandcamp', name: 'Bandcamp', icon: '/bandcamp.webp' },
  { id: 'tidal', name: 'Tidal', icon: '/tidal.webp' },
  { id: 'deezer', name: 'Deezer', icon: '/deezer.webp' },
  { id: 'amazon', name: 'Amazon Music', icon: '/amazon.webp' },
  { id: 'soundcloud', name: 'SoundCloud', icon: '/soundcloud.webp' },
  { id: 'pandora', name: 'Pandora', icon: '/pandora.webp' },
  { id: 'itunes', name: 'iTunes Store', icon: '/itunes.webp' },
]

export default function PlatformSelectorModal({
  open,
  onClose,
  selectedPlatform,
  onSelectPlatform,
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
            bgcolor: 'background.paper',
            backgroundImage: 'none',
            boxShadow: '0px 12px 32px rgba(0,0,0,0.5)',
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          m: 0,
          p: 2.5,
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          fontWeight: 700,
        }}
      >
        <Typography variant="h6" component="div" sx={{ fontWeight: 700 }}>
          Select Preferred Platform
        </Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          size="small"
          sx={{ color: 'text.secondary' }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 1 }}>
        <List disablePadding>
          {STREAMING_PLATFORMS.map(platform => {
            const isSelected = selectedPlatform === platform.id
            return (
              <ListItemButton
                key={platform.id}
                onClick={() => {
                  onSelectPlatform(platform.id)
                  onClose()
                }}
                selected={isSelected}
                sx={{
                  py: 1.5,
                  px: 2,
                  borderRadius: 2,
                  mb: 0.5,
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    '&:hover': {
                      bgcolor: 'primary.dark',
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Box
                    component="img"
                    src={platform.icon}
                    alt={platform.name}
                    loading="eager"
                    decoding="async"
                    sx={{ width: 26, height: 26, objectFit: 'contain', borderRadius: 1.5 }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={platform.name}
                  slotProps={{
                    primary: {
                      fontWeight: isSelected ? 700 : 500,
                      fontSize: '0.95rem',
                    },
                  }}
                />
              </ListItemButton>
            )
          })}
        </List>
      </DialogContent>
    </Dialog>
  )
}
