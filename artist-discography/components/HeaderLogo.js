'use client'

import { Box, useTheme } from '@mui/material'
import { useLogoAnalysis, getLogoFilter } from '../lib/useLogoAnalysis'

export default function HeaderLogo({ onClick }) {
  const theme = useTheme()
  const isDarkMode = theme.palette.mode === 'dark'
  const analysis = useLogoAnalysis('/api/logo')

  const baseShadow = isDarkMode
    ? 'drop-shadow(0px 6px 16px rgba(0,0,0,0.35))'
    : 'drop-shadow(0px 6px 16px rgba(0,0,0,0.15))'

  const logoFilter = getLogoFilter(analysis, isDarkMode, baseShadow)

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
          maxWidth: { xs: 200, sm: 280, md: 340 },
          objectFit: 'contain',
          cursor: onClick ? 'pointer' : 'default',
          transition: 'transform 0.25s ease-in-out, filter 0.25s ease-in-out',
          filter: logoFilter,
          '&:hover': onClick
            ? {
                transform: 'scale(1.04)',
                filter: `${logoFilter} brightness(1.1)`,
              }
            : {},
        }}
      />
    </Box>
  )
}
