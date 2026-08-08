'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Box,
  Container,
  Typography,
  IconButton,
  Slider,
  Stack,
  useTheme,
  Collapse,
} from '@mui/material'
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded'
import PauseRoundedIcon from '@mui/icons-material/PauseRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import MusicNoteRoundedIcon from '@mui/icons-material/MusicNoteRounded'

export default function AudioPlayerBar({
  playingTrack,
  isPlaying,
  onTogglePlay,
  onClosePlayer,
}) {
  const theme = useTheme()
  const [progress, setProgress] = useState(0)
  const timerRef = useRef(null)

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setProgress(prev => (prev >= 100 ? 0 : prev + 1))
      }, 300)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isPlaying])

  if (!playingTrack) return null

  return (
    <Collapse in={Boolean(playingTrack)} unmountOnExit>
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1200,
          bgcolor: theme.palette.mode === 'dark'
            ? 'rgba(24, 24, 32, 0.95)'
            : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid',
          borderColor: theme.palette.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.12)'
            : 'rgba(0, 0, 0, 0.12)',
          boxShadow: '0 -6px 24px rgba(0,0,0,0.3)',
          py: 1,
          px: { xs: 2, sm: 3 },
        }}
      >
        <Container maxWidth="md" disableGutters>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={2}
          >
            {/* Track Info */}
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0, flex: 1 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 1.5,
                  bgcolor: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'center',
                  color: 'primary.contrastText',
                  flexShrink: 0,
                }}
              >
                <MusicNoteRoundedIcon fontSize="small" />
              </Box>
              <Box sx={{ minWidth: 0, overflow: 'hidden' }}>
                <Typography
                  variant="body2"
                  fontWeight={700}
                  noWrap
                  sx={{ fontSize: '0.875rem' }}
                >
                  {playingTrack.name || 'Untitled Track'}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  noWrap
                  sx={{ fontSize: '0.75rem' }}
                >
                  Now Playing • {playingTrack.artist || 'Artist'}
                </Typography>
              </Box>
            </Stack>

            {/* Audio Controls */}
            <Stack direction="row" spacing={1} alignItems="center">
              <IconButton
                color="primary"
                onClick={onTogglePlay}
                sx={{
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  p: 0.75,
                  '&:hover': { bgcolor: 'primary.dark' },
                }}
              >
                {isPlaying ? (
                  <PauseRoundedIcon fontSize="small" />
                ) : (
                  <PlayArrowRoundedIcon fontSize="small" />
                )}
              </IconButton>

              <IconButton
                size="small"
                onClick={onClosePlayer}
                sx={{ color: 'text.secondary' }}
              >
                <CloseRoundedIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Stack>

          {/* Progress Bar */}
          <Slider
            size="small"
            value={progress}
            onChange={(_, val) => setProgress(val)}
            sx={{
              py: 0,
              mt: 0.5,
              height: 3,
              '& .MuiSlider-thumb': {
                width: 8,
                height: 8,
                '&:hover, &.Mui-focused, &.Mui-active': {
                  boxShadow: 'none',
                },
              },
            }}
          />
        </Container>
      </Box>
    </Collapse>
  )
}
