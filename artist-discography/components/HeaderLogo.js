'use client'

import { Box, useTheme } from '@mui/material'
import { useLogoAnalysis } from '../lib/useLogoAnalysis'
import { useDynamicThemeGradients } from '../lib/gradientStyles'

export default function HeaderLogo({ onClick, ambientImage }) {
  const theme = useTheme()
  const isDarkMode = theme.palette.mode === 'dark'
  const analysis = useLogoAnalysis('/api/logo')
  const coverSrc = ambientImage || '/api/logo'
  const { logoGradientSx, getLogoFilter: getDynamicLogoFilter } = useDynamicThemeGradients(coverSrc, isDarkMode)

  const baseShadow = isDarkMode
    ? 'drop-shadow(0px 6px 16px rgba(0,0,0,0.35))'
    : 'drop-shadow(0px 6px 16px rgba(0,0,0,0.15))'

  const animatedFilterStyles = getDynamicLogoFilter(baseShadow)

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
        aria-label="Artist Logo"
        onClick={onClick}
        sx={{
          height: { xs: 160, sm: 220, md: 280 },
          maxWidth: { xs: 340, sm: 480, md: 620 },
          aspectRatio: analysis?.aspectRatio ? `${analysis.aspectRatio}` : 'auto',
          cursor: onClick ? 'pointer' : 'default',
          transition: 'transform 0.25s ease-in-out',
          ...logoGradientSx,
          ...animatedFilterStyles,
          '&:hover': onClick
            ? {
                transform: 'scale(1.04)',
              }
            : {},
        }}
      />
    </Box>
  )
}
