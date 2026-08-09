'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Box,
  Container,
  Paper,
  Typography,
  IconButton,
  Slider,
  Stack,
  Badge,
  useTheme,
  Collapse,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded'
import PauseRoundedIcon from '@mui/icons-material/PauseRounded'
import SkipNextRoundedIcon from '@mui/icons-material/SkipNextRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import MusicNoteRoundedIcon from '@mui/icons-material/MusicNoteRounded'

export default function AudioPlayerBar({
  playingTrack,
  isPlaying,
  onTogglePlay,
  onClosePlayer,
  queueCount = 0,
  onSkipNext,
}) {
  const theme = useTheme()
  const [progress, setProgress] = useState(0)
  const timerRef = useRef(null)

  const bgDefault = theme.palette.background.default
  const bgTransparent = alpha(bgDefault, 0)

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            if (onSkipNext && queueCount > 0) {
              onSkipNext()
            }
            return 0
          }
          return prev + 1
        })
      }, 300)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isPlaying, onSkipNext, queueCount])

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
          pb: { xs: 1.5, sm: 2 },
          pt: { xs: 1.5, sm: 2 },
          pointerEvents: 'none',
        }}
      >
        {/* Solid mask below and behind audio player bar to prevent any content from peeking out below */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            top: { xs: 1.5, sm: 2 },
            bgcolor: bgDefault,
            zIndex: -1,
            transition: 'background-color 0.3s ease',
          }}
        />

        {/* Smooth gradient opacity fade extending above audio player bar */}
        <Box
          sx={{
            position: 'absolute',
            bottom: '100%',
            left: 0,
            right: 0,
            height: { xs: 48, sm: 64 },
            background: `linear-gradient(to top, ${bgDefault} 0%, ${bgTransparent} 100%)`,
            zIndex: -1,
            pointerEvents: 'none',
            transition: 'background 0.3s ease',
          }}
        />

        <Container maxWidth="md" sx={{ pointerEvents: 'auto', px: { xs: 2, sm: 3 } }}>
          <Paper
            elevation={6}
            sx={{
              borderRadius: 4,
              py: 1.5,
              px: { xs: 2, sm: 3 },
              minHeight: 64,
              bgcolor: theme.palette.mode === 'dark'
                ? 'rgba(24, 24, 34, 0.95)'
                : 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid',
              borderColor: theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.12)'
                : 'rgba(0, 0, 0, 0.12)',
              boxShadow: '0 12px 36px rgba(0,0,0,0.35)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Stack
              direction="row"
              spacing={2}
              sx={{ alignItems: 'center', justifyContent: 'space-between' }}
            >
              {/* Track Info */}
              <Stack direction="row" spacing={1.5} sx={{ minWidth: 0, flex: 1, alignItems: 'center' }}>
                <Box
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: 2,
                    bgcolor: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
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
                    sx={{ fontSize: '0.9rem' }}
                  >
                    {playingTrack.name || 'Untitled Track'}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    noWrap
                    sx={{ fontSize: '0.775rem' }}
                  >
                    Now Playing • {playingTrack.artist || 'Artist'}
                  </Typography>
                </Box>
              </Stack>

              {/* Audio Playback Controls */}
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <IconButton
                  color="primary"
                  onClick={onTogglePlay}
                  sx={{
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    p: 0.85,
                    '&:hover': { bgcolor: 'primary.dark' },
                  }}
                >
                  {isPlaying ? (
                    <PauseRoundedIcon fontSize="small" />
                  ) : (
                    <PlayArrowRoundedIcon fontSize="small" />
                  )}
                </IconButton>

                {queueCount > 0 && (
                  <IconButton
                    size="small"
                    onClick={onSkipNext}
                    sx={{ color: 'primary.main' }}
                  >
                    <Badge badgeContent={queueCount} color="primary">
                      <SkipNextRoundedIcon fontSize="small" />
                    </Badge>
                  </IconButton>
                )}

                <IconButton
                  size="small"
                  onClick={onClosePlayer}
                  sx={{ color: 'text.secondary' }}
                >
                  <CloseRoundedIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Stack>

            {/* Audio Progress Slider */}
            <Slider
              size="small"
              value={progress}
              onChange={(_, val) => setProgress(val)}
              sx={{
                py: 0,
                mt: 0.75,
                height: 3,
                '& .MuiSlider-thumb': {
                  width: 10,
                  height: 10,
                  '&:hover, &.Mui-focused, &.Mui-active': {
                    boxShadow: 'none',
                  },
                },
              }}
            />
          </Paper>
        </Container>
      </Box>
    </Collapse>
  )
}
