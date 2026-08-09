'use client'

import { Box, useTheme } from '@mui/material'
import { useLogoAnalysis, shouldApplyLogoGradient } from '../lib/useLogoAnalysis'

export default function HeaderLogo({ onClick }) {
  const theme = useTheme()
  const isDarkMode = theme.palette.mode === 'dark'
  const analysis = useLogoAnalysis('/api/logo')
  const applyGradient = shouldApplyLogoGradient(analysis, isDarkMode)

  const heroGradient = isDarkMode
    ? 'linear-gradient(135deg, #ffffff 0%, #a0a0b0 100%)'
    : 'linear-gradient(135deg, #111827 0%, #4b5563 100%)'

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        mb: { xs: 2.5, sm: 3.5, md: 4.5 },
      }}
    >
      <Box
        onClick={onClick}
        sx={{
          width: '100%',
          maxWidth: { xs: 200, sm: 280, md: 340 },
          height: { xs: 80, sm: 110, md: 140 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: onClick ? 'pointer' : 'default',
          transition: 'transform 0.25s ease-in-out, filter 0.25s ease-in-out',
          filter: 'drop-shadow(0px 6px 16px rgba(0,0,0,0.25))',
          '&:hover': onClick
            ? {
                transform: 'scale(1.04)',
                filter: 'drop-shadow(0px 8px 24px rgba(0,0,0,0.35))',
              }
            : {},
        }}
      >
        {applyGradient ? (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              WebkitMaskImage: 'url("/api/logo")',
              maskImage: 'url("/api/logo")',
              WebkitMaskSize: 'contain',
              maskSize: 'contain',
              WebkitMaskRepeat: 'no-repeat',
              maskRepeat: 'no-repeat',
              WebkitMaskPosition: 'center',
              maskPosition: 'center',
              background: heroGradient,
            }}
          />
        ) : (
          <Box
            component="img"
            src="/api/logo"
            alt="Artist Logo"
            sx={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              filter: isDarkMode ? 'none' : 'brightness(0.2)',
            }}
          />
        )}
      </Box>
    </Box>
  )
}
