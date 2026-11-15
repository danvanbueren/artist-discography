'use client'

import { Box, useTheme } from '@mui/material'
import {
  useLogoAnalysis,
  getLogoFilter,
  shouldApplyLogoGradient,
} from '@/lib/hooks/useLogoAnalysis'
import { useDynamicThemeGradients } from '@/lib/hooks/useDynamicThemeGradients'
import { usePerformanceMode } from '@/lib/performance/PerformanceModeContext'
import { withMediaQuery } from '@/lib/media/mediaUrl'

export default function HeaderLogo({
  onClick,
  ambientImage,
  logoUrl = '/api/logo',
  artistName = 'Artist',
}) {
  const theme = useTheme()
  const isDarkMode = theme.palette.mode === 'dark'
  const { isLiteMode } = usePerformanceMode()
  const analysisUrl = withMediaQuery(logoUrl || '/api/logo', { w: 96, fmt: 'webp' })
  const renderLogoUrl = withMediaQuery(logoUrl || '/api/logo', { w: 640, fmt: 'webp' })
  const analysis = useLogoAnalysis(analysisUrl)
  const coverSrc = ambientImage || renderLogoUrl
  const { logoGradientSx, getLogoFilter: getDynamicLogoFilter } = useDynamicThemeGradients(
    coverSrc,
    isDarkMode,
    logoUrl,
  )

  const isGradient = shouldApplyLogoGradient(analysis, isDarkMode)
  const baseShadow = isDarkMode
    ? 'drop-shadow(0px 6px 16px rgba(0,0,0,0.35))'
    : 'drop-shadow(0px 6px 16px rgba(0,0,0,0.15))'

  const isLowContrast = Boolean(
    analysis?.isMonochrome &&
    ((isDarkMode && analysis?.isDark) || (!isDarkMode && analysis?.isLight)),
  )
  const logoFilterStyles = getDynamicLogoFilter(
    isGradient ? baseShadow : getLogoFilter(analysis, isDarkMode, baseShadow),
    { isLowContrast },
  )

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
      {isGradient ? (
        <Box
          aria-label={`${artistName || 'Artist'} Logo`}
          onClick={onClick}
          sx={{
            height: { xs: 'max(140px, 18dvh)', sm: 'max(180px, 22dvh)', md: 'max(220px, 26dvh)' },
            minHeight: { xs: 120, sm: 160, md: 200 },
            maxHeight: { xs: 200, sm: 260, md: 320 },
            maxWidth: { xs: 340, sm: 480, md: 620 },
            aspectRatio: analysis?.aspectRatio ? `${analysis.aspectRatio}` : '1 / 1',
            cursor: onClick ? 'pointer' : 'default',
            flexShrink: 0,
            ...logoGradientSx,
            ...logoFilterStyles,
            ...(isLiteMode
              ? {}
              : {
                  animation:
                    'logoGradientShift 14s ease infinite alternate, logoGlowPulse 10s ease-in-out infinite alternate',
                }),
            transition: 'transform 0.25s ease-in-out, opacity 0.3s ease',
            '&:hover': onClick
              ? {
                  transform: 'scale(1.04)',
                }
              : {},
          }}
        />
      ) : (
        <Box
          component='img'
          src={renderLogoUrl}
          alt={`${artistName || 'Artist'} Logo`}
          draggable={false}
          onClick={onClick}
          sx={{
            height: { xs: 'max(140px, 18dvh)', sm: 'max(180px, 22dvh)', md: 'max(220px, 26dvh)' },
            minHeight: { xs: 120, sm: 160, md: 200 },
            maxHeight: { xs: 200, sm: 260, md: 320 },
            maxWidth: { xs: 340, sm: 480, md: 620 },
            width: 'auto',
            objectFit: 'contain',
            display: 'block',
            cursor: onClick ? 'pointer' : 'default',
            flexShrink: 0,
            ...logoFilterStyles,
            transition: 'transform 0.25s ease-in-out, opacity 0.3s ease',
            '&:hover': onClick
              ? {
                  transform: 'scale(1.04)',
                }
              : {},
          }}
        />
      )}
    </Box>
  )
}
