'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Button,
  IconButton,
  Paper,
  Slide,
  Typography,
  useTheme,
} from '@mui/material'
import HeadphonesRoundedIcon from '@mui/icons-material/HeadphonesRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'

export default function OnboardingPlatformBanner({
  onOpenPlatformModal,
  isPlayerOpen = false,
  onDismiss,
}) {
  const theme = useTheme()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem('has_dismissed_platform_onboarding') === 'true'
      if (!dismissed) {
        const timer = setTimeout(() => setVisible(true), 1500)
        return () => clearTimeout(timer)
      } else if (onDismiss) {
        onDismiss()
      }
    } catch {}
  }, [onDismiss])

  const handleDismiss = () => {
    setVisible(false)
    try {
      localStorage.setItem('has_dismissed_platform_onboarding', 'true')
    } catch {}
    if (onDismiss) {
      onDismiss()
    }
  }

  const handleOpen = () => {
    handleDismiss()
    if (onOpenPlatformModal) {
      onOpenPlatformModal()
    }
  }

  return (
    <Slide direction="up" in={visible} mountOnEnter unmountOnExit>
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
        <HeadphonesRoundedIcon
          color="primary"
          sx={{ fontSize: { xs: 26, sm: 30 }, flexShrink: 0 }}
        />
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 700, lineHeight: 1.2 }}
          >
            Choose Preferred Platform
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            noWrap
            sx={{ display: 'block', mt: 0.25 }}
          >
            Quickly open music on your favorite streaming service.
          </Typography>
        </Box>
        <Button
          size="small"
          variant="contained"
          onClick={handleOpen}
          sx={{
            borderRadius: 2,
            flexShrink: 0,
            textTransform: 'none',
            fontWeight: 700,
            px: 2,
          }}
        >
          Choose
        </Button>
        <IconButton
          size="small"
          onClick={handleDismiss}
          sx={{ color: 'text.secondary', p: 0.5 }}
          aria-label="Dismiss platform onboarding"
        >
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </Paper>
    </Slide>
  )
}
