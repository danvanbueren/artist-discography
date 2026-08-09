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
      {applyGradient ? (
        <Box
          onClick={onClick}
          sx={{
            width: { xs: 160, sm: 220, md: 260 },
            height: { xs: 90, sm: 120, md: 150 },
            cursor: onClick ? 'pointer' : 'default',
            transition: 'transform 0.25s ease-in-out, filter 0.25s ease-in-out',
            WebkitMaskImage: 'url("/api/logo")',
            maskImage: 'url("/api/logo")',
            WebkitMaskSize: 'contain',
            maskSize: 'contain',
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center',
            maskPosition: 'center',
            background: heroGradient,
            filter: 'drop-shadow(0px 6px 16px rgba(0,0,0,0.25))',
            '&:hover': onClick
              ? {
                  transform: 'scale(1.04)',
                  filter: 'drop-shadow(0px 8px 24px rgba(0,0,0,0.35))',
                }
              : {},
          }}
        />
      ) : (
        <Box
          component="img"
          src="/api/logo"
          alt="Artist Logo"
          onClick={onClick}
          sx={{
            maxHeight: { xs: 90, sm: 120, md: 150 },
            maxWidth: '85%',
            objectFit: 'contain',
            cursor: onClick ? 'pointer' : 'default',
            transition: 'transform 0.25s ease-in-out, filter 0.25s ease-in-out',
            filter: 'drop-shadow(0px 6px 16px rgba(0,0,0,0.3))',
            '&:hover': onClick
              ? {
                  transform: 'scale(1.04)',
                  filter: 'drop-shadow(0px 8px 24px rgba(0,0,0,0.45))',
                }
              : {},
          }}
        />
      )}
    </Box>
  )
}
