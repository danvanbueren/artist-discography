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
  Button,
} from '@mui/material'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import RadioButtonUncheckedRoundedIcon from '@mui/icons-material/RadioButtonUncheckedRounded'
import GraphicEqRoundedIcon from '@mui/icons-material/GraphicEqRounded'
import HighQualityRoundedIcon from '@mui/icons-material/HighQualityRounded'
import DataSaverOnRoundedIcon from '@mui/icons-material/DataSaverOnRounded'
import PriorityHighRoundedIcon from '@mui/icons-material/PriorityHighRounded'
import { QUALITY_TIER_CONFIG } from '../../lib/networkProbe'

const QUALITY_OPTIONS = [
  {
    id: 'lossless',
    title: 'Lossless FLAC',
    tag: 'Studio Master',
    tagColor: 'secondary',
    desc: 'Bit-perfect uncompressed audio fidelity. Recommended for high-speed Wi-Fi / broadband.',
    icon: GraphicEqRoundedIcon,
  },
  {
    id: '320k',
    title: 'High Quality (320 kbps)',
    tag: 'Recommended',
    tagColor: 'primary',
    desc: 'Crystal-clear perceptual fidelity with instant buffering and fast seek times.',
    icon: HighQualityRoundedIcon,
  },
  {
    id: '128k',
    title: 'Compressed (128 kbps)',
    tag: 'Low Data',
    tagColor: 'default',
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
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: { xs: 3, sm: 4 },
            p: { xs: 1, sm: 1.5 },
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.45)',
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1,
          pt: 1.5,
          px: 2,
        }}
      >
        <Stack spacing={0.25}>
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.15rem' }}>
            Audio Playback Quality
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Select your preferred streaming audio quality
          </Typography>
        </Stack>
        <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary' }}>
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: { xs: 1.5, sm: 2 }, py: 1.5 }}>
        {isStuttering && (
          <Box
            sx={{
              p: 1.5,
              mb: 1.5,
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
                width: 20,
                height: 20,
                borderRadius: '50%',
                bgcolor: (theme) =>
                  theme.palette.mode === 'dark' ? '#fbbf24' : '#d97706',
                color: (theme) =>
                  theme.palette.mode === 'dark' ? '#1a1400' : '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <PriorityHighRoundedIcon sx={{ fontSize: 13, color: 'inherit' }} />
            </Box>
            <Typography
              variant="caption"
              sx={{
                color: (theme) =>
                  theme.palette.mode === 'dark' ? '#fbbf24' : '#b45309',
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
                elevation={isSelected ? 3 : 0}
                sx={{
                  p: 2,
                  borderRadius: 3,
                  cursor: 'pointer',
                  border: '2px solid',
                  borderColor: isSelected ? 'primary.main' : 'divider',
                  bgcolor: isSelected
                    ? (theme) => theme.palette.mode === 'dark' ? 'rgba(144, 202, 249, 0.12)' : 'rgba(25, 118, 210, 0.08)'
                    : 'background.paper',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: isSelected ? 'primary.main' : 'text.secondary',
                    bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                    transform: 'translateY(-1px)',
                  },
                }}
              >
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
                  <Box
                    sx={{
                      p: 1,
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
                    <IconComponent sx={{ fontSize: 22 }} />
                  </Box>

                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        lineHeight: 1,
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
                          py: 0.15,
                          borderRadius: 9999,
                          bgcolor: isSelected ? 'primary.main' : 'action.selected',
                          color: isSelected ? 'primary.contrastText' : 'text.secondary',
                          mb: 1.2,
                          whiteSpace: 'nowrap',
                          width: 'fit-content',
                        }}
                      >
                        {opt.tag}
                      </Box>
                    )}

                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        display: 'block',
                        lineHeight: 1.35,
                      }}
                    >
                      {opt.desc}
                    </Typography>
                  </Box>

                  <Box sx={{ flexShrink: 0, mt: 0.25 }}>
                    {isSelected ? (
                      <CheckCircleRoundedIcon color="primary" sx={{ fontSize: 22 }} />
                    ) : (
                      <RadioButtonUncheckedRoundedIcon sx={{ fontSize: 22, color: 'text.disabled' }} />
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
