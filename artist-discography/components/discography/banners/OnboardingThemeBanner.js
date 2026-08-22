'use client'

import { useState, useEffect, useRef } from 'react'
import { Box, Button, IconButton, Paper, Slide, Typography, useTheme } from '@mui/material'
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded'
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'

export default function OnboardingThemeBanner({
  darkMode = false,
  onToggleTheme,
  isPlayerOpen = false,
  readyToShow = false,
}) {
  const theme = useTheme()
  const [visible, setVisible] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    if (!readyToShow) return

    try {
      const dismissed = localStorage.getItem('has_dismissed_theme_onboarding') === 'true'
      if (!dismissed) {
        timerRef.current = setTimeout(() => {
          setVisible(true)
        }, 2200) // 2.2 seconds after platform onboarding finishes
      }
    } catch {}

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [readyToShow])

  const handleDismiss = () => {
    setVisible(false)
    try {
      localStorage.setItem('has_dismissed_theme_onboarding', 'true')
    } catch {}
  }

  const handleToggle = () => {
    if (onToggleTheme) {
      onToggleTheme()
    }
    handleDismiss()
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
          zIndex: 1150,
          maxWidth: 'min(92vw, 540px)',
          width: '100%',
          borderRadius: 3.5,
          p: { xs: 1.5, sm: 2 },
          bgcolor: theme.palette.mode === 'dark' ? '#1c1c28' : '#ffffff',
          border: '1px solid',
          borderColor: 'primary.main',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          transition: 'bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {darkMode ? (
          <LightModeRoundedIcon
            color='primary'
            sx={{ fontSize: { xs: 26, sm: 30 }, flexShrink: 0 }}
          />
        ) : (
          <DarkModeRoundedIcon
            color='primary'
            sx={{ fontSize: { xs: 26, sm: 30 }, flexShrink: 0 }}
          />
        )}
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant='subtitle2' sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            Choose Your Theme
          </Typography>
          <Typography
            variant='caption'
            color='text.secondary'
            noWrap
            sx={{ display: 'block', mt: 0.25 }}
          >
            {darkMode
              ? 'Currently in Dark Mode. Prefer Light Mode aesthetic?'
              : 'Currently in Light Mode. Prefer Dark Mode aesthetic?'}
          </Typography>
        </Box>
        <Button
          size='small'
          variant='contained'
          onClick={handleToggle}
          sx={{
            borderRadius: 2,
            flexShrink: 0,
            textTransform: 'none',
            fontWeight: 700,
            px: 2,
          }}
        >
          {darkMode ? 'Light Mode' : 'Dark Mode'}
        </Button>
        <IconButton
          size='small'
          onClick={handleDismiss}
          sx={{ color: 'text.secondary', p: 0.5 }}
          aria-label='Dismiss theme onboarding'
        >
          <CloseRoundedIcon fontSize='small' />
        </IconButton>
      </Paper>
    </Slide>
  )
}
