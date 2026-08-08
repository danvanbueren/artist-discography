'use client'

import { Box, useTheme } from '@mui/material'
import { useLogoAnalysis, getLogoFilter } from '../lib/useLogoAnalysis'

export default function HeaderLogo({ onClick }) {
  const theme = useTheme()
  const isDarkMode = theme.palette.mode === 'dark'
  const analysis = useLogoAnalysis('/api/logo')
  const logoFilter = getLogoFilter(analysis, isDarkMode, 'drop-shadow(0px 6px 16px rgba(0,0,0,0.3))')
  const hoverLogoFilter = getLogoFilter(analysis, isDarkMode, 'drop-shadow(0px 8px 24px rgba(0,0,0,0.45))')

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
          filter: logoFilter,
          '&:hover': onClick
            ? {
                transform: 'scale(1.04)',
                filter: hoverLogoFilter,
              }
            : {},
        }}
      />
    </Box>
  )
}
