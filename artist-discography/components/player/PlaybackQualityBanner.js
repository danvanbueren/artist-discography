'use client'

import { useState, useEffect, useRef } from 'react'
import { Box, Button, IconButton, Paper, Slide, Typography, useTheme } from '@mui/material'
import NetworkCheckRoundedIcon from '@mui/icons-material/NetworkCheckRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'

const COOLDOWN_MS = 24 * 60 * 60 * 1000 // 24 hours cooldown

export default function PlaybackQualityBanner({
  isStuttering = false,
  onOpenQualityModal,
  isPlayerOpen = false,
}) {
  const theme = useTheme()
  const [visible, setVisible] = useState(false)
  const [isRecovered, setIsRecovered] = useState(false)
  const stutterTimerRef = useRef(null)
  const autoDismissTimerRef = useRef(null)

  useEffect(() => {
    if (isStuttering) {
      setIsRecovered(false)
      if (!visible && !stutterTimerRef.current) {
        stutterTimerRef.current = setTimeout(() => {
          try {
            const lastDismissed = localStorage.getItem('last_quality_banner_dismissed_at')
            if (lastDismissed && Date.now() - Number(lastDismissed) < COOLDOWN_MS) {
              return
            }
          } catch {}

          setVisible(true)
        }, 10000) // 10 seconds continuous stuttering threshold
      }
    } else {
      if (stutterTimerRef.current) {
        clearTimeout(stutterTimerRef.current)
        stutterTimerRef.current = null
      }

      if (visible) {
        setIsRecovered(true)
        if (!autoDismissTimerRef.current) {
          autoDismissTimerRef.current = setTimeout(() => {
            handleDismiss()
          }, 6000)
        }
      }
    }

    return () => {
      if (stutterTimerRef.current) {
        clearTimeout(stutterTimerRef.current)
      }
    }
  }, [isStuttering, visible])

  const handleDismiss = () => {
    setVisible(false)
    if (autoDismissTimerRef.current) {
      clearTimeout(autoDismissTimerRef.current)
      autoDismissTimerRef.current = null
    }
    try {
      localStorage.setItem('last_quality_banner_dismissed_at', Date.now().toString())
    } catch {}
  }

  const handleOpen = () => {
    handleDismiss()
    if (onOpenQualityModal) {
      onOpenQualityModal()
    }
  }

  return (
    <Slide direction='up' in={visible} mountOnEnter unmountOnExit>
      <Paper
        elevation={10}
        sx={{
          position: 'fixed',
          bottom: isPlayerOpen ? { xs: 84, sm: 104 } : { xs: 16, sm: 24 },
          left: '50%',
          transform: 'translateX(-50%) !important',
          zIndex: 1160,
          maxWidth: 'min(92vw, 540px)',
          width: '100%',
          borderRadius: 3.5,
          p: { xs: 1.5, sm: 2 },
          bgcolor: theme.palette.mode === 'dark' ? '#1c1c28' : '#ffffff',
          border: '1px solid',
          borderColor: isRecovered ? 'success.main' : 'warning.main',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          transition: 'bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.3s ease',
        }}
      >
        {isRecovered ? (
          <CheckCircleRoundedIcon
            color='success'
            sx={{ fontSize: { xs: 26, sm: 30 }, flexShrink: 0 }}
          />
        ) : (
          <NetworkCheckRoundedIcon
            color='warning'
            sx={{ fontSize: { xs: 26, sm: 30 }, flexShrink: 0 }}
          />
        )}
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant='subtitle2' sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            {isRecovered ? 'Audio Playback Stabilized' : 'Buffering Detected'}
          </Typography>
          <Typography
            variant='caption'
            color='text.secondary'
            noWrap
            sx={{ display: 'block', mt: 0.25 }}
          >
            {isRecovered
              ? 'Playback is smooth. Tap anytime to adjust quality.'
              : 'Lower audio stream quality to prevent buffering.'}
          </Typography>
        </Box>
        <Button
          size='small'
          variant='contained'
          color={isRecovered ? 'primary' : 'warning'}
          onClick={handleOpen}
          sx={{
            borderRadius: 2,
            flexShrink: 0,
            textTransform: 'none',
            fontWeight: 700,
            px: 2,
          }}
        >
          {isRecovered ? 'Quality' : 'Adjust'}
        </Button>
        <IconButton
          size='small'
          onClick={handleDismiss}
          sx={{ color: 'text.secondary', p: 0.5 }}
          aria-label='Dismiss audio quality guidance'
        >
          <CloseRoundedIcon fontSize='small' />
        </IconButton>
      </Paper>
    </Slide>
  )
}
