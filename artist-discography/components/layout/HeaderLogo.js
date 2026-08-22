'use client'

import { Box, useTheme } from '@mui/material'
import { useLogoAnalysis } from '@/lib/hooks/useLogoAnalysis'
import { useDynamicThemeGradients } from '@/lib/hooks/useDynamicThemeGradients'

export default function HeaderLogo({ onClick, ambientImage }) {
  const theme = useTheme()
  const isDarkMode = theme.palette.mode === 'dark'
  const analysis = useLogoAnalysis('/api/logo?w=96&fmt=webp')
  const coverSrc = ambientImage || '/api/logo?w=640&fmt=webp'
  const { logoGradientSx, getLogoFilter: getDynamicLogoFilter } = useDynamicThemeGradients(
    coverSrc,
    isDarkMode,
  )

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
        flexShrink: 0,
        mb: { xs: 2.5, sm: 3.5, md: 4.5 },
      }}
    >
      <Box
        aria-label='Artist Logo'
        onClick={onClick}
        sx={{
          height: { xs: 'max(140px, 18dvh)', sm: 'max(180px, 22dvh)', md: 'max(220px, 26dvh)' },
          minHeight: { xs: 120, sm: 160, md: 200 },
          maxHeight: { xs: 200, sm: 260, md: 320 },
          maxWidth: { xs: 340, sm: 480, md: 620 },
          aspectRatio: analysis?.aspectRatio ? `${analysis.aspectRatio}` : 'auto',
          cursor: onClick ? 'pointer' : 'default',
          flexShrink: 0,
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
