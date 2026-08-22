'use client'

import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Stack,
  Paper,
} from '@mui/material'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import RadioButtonUncheckedRoundedIcon from '@mui/icons-material/RadioButtonUncheckedRounded'
import GraphicEqRoundedIcon from '@mui/icons-material/GraphicEqRounded'
import HighQualityRoundedIcon from '@mui/icons-material/HighQualityRounded'
import DataSaverOnRoundedIcon from '@mui/icons-material/DataSaverOnRounded'
import PriorityHighRoundedIcon from '@mui/icons-material/PriorityHighRounded'

const QUALITY_OPTIONS = [
  {
    id: 'lossless',
    title: 'Lossless FLAC',
    tag: 'Studio Master',
    desc: 'Bit-perfect uncompressed audio fidelity. Recommended for high-speed Wi-Fi / broadband.',
    icon: GraphicEqRoundedIcon,
  },
  {
    id: '320k',
    title: 'High Quality (320 kbps)',
    tag: 'Recommended',
    desc: 'Crystal-clear perceptual fidelity with instant buffering and fast seek times.',
    icon: HighQualityRoundedIcon,
  },
  {
    id: '128k',
    title: 'Compressed (128 kbps)',
    tag: 'Low Data',
    desc: 'Lightweight audio stream. Saves mobile data on metered or slower cellular connections.',
    icon: DataSaverOnRoundedIcon,
  },
]

export default function AudioQualityModal({
  open,
  onClose,
  activeQuality = '320k',
  isStuttering = false,
  onSelectQuality,
}) {
  const handleSelect = (tierId) => {
    if (onSelectQuality) {
      onSelectQuality(tierId)
    }
    if (onClose) {
      onClose()
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth='xs'
      fullWidth
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
            <GraphicEqRoundedIcon fontSize='small' />
          </Box>
          <Typography variant='h6' sx={{ fontWeight: 800 }}>
            Audio Playback Quality
          </Typography>
        </Stack>
        <IconButton aria-label='close' onClick={onClose} sx={{ color: 'text.secondary', p: 0.5 }}>
          <CloseRoundedIcon fontSize='small' />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 1.5, pt: 1 }}>
        <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
          Select your preferred streaming audio quality. High bitrates offer studio fidelity while
          lower bitrates reduce data usage and buffering.
        </Typography>

        {isStuttering && (
          <Box
            sx={{
              p: 1.5,
              mb: 2,
              borderRadius: 2.5,
              bgcolor: (theme) =>
                theme.palette.mode === 'dark'
                  ? 'rgba(245, 158, 11, 0.16)'
                  : 'rgba(245, 158, 11, 0.12)',
              border: '1px solid',
              borderColor: (theme) =>
                theme.palette.mode === 'dark'
                  ? 'rgba(245, 158, 11, 0.4)'
                  : 'rgba(217, 119, 6, 0.35)',
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
            }}
          >
            <Box
              sx={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#fbbf24' : '#d97706'),
                color: (theme) => (theme.palette.mode === 'dark' ? '#1a1400' : '#ffffff'),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <PriorityHighRoundedIcon sx={{ fontSize: 14, color: 'inherit' }} />
            </Box>
            <Typography
              variant='caption'
              sx={{
                color: (theme) => (theme.palette.mode === 'dark' ? '#fbbf24' : '#b45309'),
                fontWeight: 600,
                lineHeight: 1.35,
              }}
            >
              Playback is struggling. Switching to a lower bitrate will reduce buffering delays.
            </Typography>
          </Box>
        )}

        <Stack spacing={1.5}>
          {QUALITY_OPTIONS.map((opt) => {
            const isSelected = activeQuality === opt.id
            const IconComponent = opt.icon

            return (
              <Paper
                key={opt.id}
                onClick={() => handleSelect(opt.id)}
                elevation={0}
                sx={{
                  p: 1.75,
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
                <Stack direction='row' spacing={1.5} sx={{ alignItems: 'flex-start' }}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 2,
                      bgcolor: isSelected ? 'primary.main' : 'action.hover',
                      color: isSelected ? 'primary.contrastText' : 'text.secondary',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      mt: 0.25,
                    }}
                  >
                    <IconComponent sx={{ fontSize: 20 }} />
                  </Box>

                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Stack
                      direction='row'
                      spacing={1}
                      sx={{ alignItems: 'center', mb: 0.5, flexWrap: 'wrap' }}
                    >
                      <Typography
                        variant='subtitle2'
                        sx={{
                          fontWeight: 700,
                          fontSize: '0.95rem',
                          lineHeight: 1.2,
                          color: isSelected ? 'primary.main' : 'text.primary',
                        }}
                      >
                        {opt.title}
                      </Typography>

                      {opt.tag && (
                        <Box
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            fontSize: '0.625rem',
                            fontWeight: 700,
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase',
                            px: 0.75,
                            py: 0.2,
                            borderRadius: 1,
                            bgcolor: isSelected ? 'primary.main' : 'action.selected',
                            color: isSelected ? 'primary.contrastText' : 'text.secondary',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {opt.tag}
                        </Box>
                      )}
                    </Stack>

                    <Typography
                      variant='caption'
                      color='text.secondary'
                      sx={{
                        display: 'block',
                        lineHeight: 1.35,
                      }}
                    >
                      {opt.desc}
                    </Typography>
                  </Box>

                  <Box sx={{ flexShrink: 0, mt: 0.5 }}>
                    {isSelected ? (
                      <CheckCircleRoundedIcon color='primary' sx={{ fontSize: 22 }} />
                    ) : (
                      <RadioButtonUncheckedRoundedIcon
                        sx={{ fontSize: 22, color: 'text.disabled' }}
                      />
                    )}
                  </Box>
                </Stack>
              </Paper>
            )
          })}
        </Stack>
      </DialogContent>
    </Dialog>
  )
}
