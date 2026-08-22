'use client'

import { Box, Stack, Typography, useTheme } from '@mui/material'
import {
  useLogoAnalysis,
  getLogoFilter,
  shouldApplyLogoGradient,
} from '@/lib/hooks/useLogoAnalysis'
import { useDynamicThemeGradients } from '@/lib/hooks/useDynamicThemeGradients'
import { useFitTextWidth } from '@/lib/hooks/useFitTextWidth'
import CompactHeaderActions from './header/CompactHeaderActions'

/**
 * CompactArtistHeader
 * Responsive top brand bar for Single Project views displaying responsive artist logo,
 * scalable artist title, and floating action button pills.
 */
export default function CompactArtistHeader({
  artist,
  onNavigateHome,
  darkMode,
  onToggleTheme,
  selectedPlatform,
  onOpenPlatformModal,
  ambientImage,
  hasAvailablePlatforms = true,
  audioQuality = '320k',
  isStuttering = false,
  onOpenQualityModal,
  isPrivateAuthenticated = false,
  onOpenPrivateAccessModal,
}) {
  const theme = useTheme()
  const isDarkMode = theme.palette.mode === 'dark'
  const logoAnalysis = useLogoAnalysis('/api/logo?w=96&fmt=webp')
  const coverSrc = ambientImage || '/api/logo?w=640&fmt=webp'
  const {
    primaryTextSx,
    logoGradientSx,
    getLogoFilter: getDynamicLogoFilter,
  } = useDynamicThemeGradients(coverSrc, isDarkMode)

  const name = artist?.name ?? ''
  const { containerRef, dimensions: computedDimensions } = useFitTextWidth({
    name,
    aspectRatio: logoAnalysis?.aspectRatio,
  })

  const isGradient = shouldApplyLogoGradient(logoAnalysis, isDarkMode)
  const baseShadow = isDarkMode
    ? 'drop-shadow(0px 4px 14px rgba(0,0,0,0.35))'
    : 'drop-shadow(0px 4px 14px rgba(0,0,0,0.15))'
  const dynamicFilter = getDynamicLogoFilter(
    isGradient ? baseShadow : getLogoFilter(logoAnalysis, isDarkMode, baseShadow),
  )

  return (
    <Stack
      spacing={3}
      sx={{
        alignItems: 'center',
        justifyContent: 'center',
        py: { xs: 2, sm: 3 },
        px: 0,
        width: '100%',
        textAlign: 'center',
      }}
    >
      {/* 1. Header Top Row: Centered Logo & Artist Name */}
      <Box
        ref={containerRef}
        sx={{
          position: 'relative',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: computedDimensions
            ? `${computedDimensions.logoHeight}px`
            : { xs: 80, sm: 110, md: 160 },
          mb: { xs: 0.5, sm: 1 },
          px: 0,
        }}
      >
        {/* Clickable Logo & Artist Name */}
        <Box
          onClick={onNavigateHome}
          role={onNavigateHome ? 'button' : undefined}
          tabIndex={onNavigateHome ? 0 : undefined}
          onKeyDown={
            onNavigateHome
              ? (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onNavigateHome()
                  }
                }
              : undefined
          }
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: computedDimensions ? `${computedDimensions.gap}px` : { xs: 1.5, sm: 2.5 },
            cursor: onNavigateHome ? 'pointer' : 'default',
            transition: 'transform 0.2s ease, opacity 0.2s ease',
            userSelect: 'none',
            maxWidth: '100%',
            width: computedDimensions?.isFullWidth ? '100%' : 'auto',
            '&:hover': onNavigateHome
              ? {
                  transform: 'scale(1.02)',
                  opacity: 0.9,
                }
              : {},
          }}
        >
          <Box
            aria-label='Artist Logo'
            sx={{
              height: computedDimensions
                ? `${computedDimensions.logoHeight}px`
                : { xs: 80, sm: 110, md: 160 },
              width: computedDimensions ? `${computedDimensions.logoWidth}px` : 'auto',
              maxHeight: { xs: 100, sm: 140, md: 190 },
              maxWidth: { xs: 150, sm: 200, md: 280 },
              aspectRatio: logoAnalysis?.aspectRatio ? `${logoAnalysis.aspectRatio}` : '1 / 1',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.2s ease, filter 0.3s ease',
              ...(isGradient
                ? {
                    ...logoGradientSx,
                    ...dynamicFilter,
                    animation:
                      'logoGradientShift 14s ease infinite alternate, logoGlowPulse 10s ease-in-out infinite alternate',
                  }
                : {
                    ...dynamicFilter,
                  }),
            }}
          >
            {!isGradient && (
              <Box
                component='img'
                src='/api/logo?w=320&fmt=webp'
                alt={name || 'Artist'}
                draggable={false}
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
            )}
          </Box>

          <Typography
            variant='h1'
            component='h1'
            sx={{
              fontWeight: 900,
              letterSpacing: '-0.03em',
              fontSize: computedDimensions
                ? `${computedDimensions.fontSize}px`
                : { xs: '2rem', sm: '3rem', md: '4.25rem' },
              lineHeight: 1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              flexShrink: 1,
              minWidth: 0,
              ...primaryTextSx,
            }}
          >
            {name || 'Artist'}
          </Typography>
        </Box>
      </Box>

      {/* 2. Floating Action Controls Pill Bar */}
      <CompactHeaderActions
        onNavigateHome={onNavigateHome}
        hasAvailablePlatforms={hasAvailablePlatforms}
        onOpenPlatformModal={onOpenPlatformModal}
        selectedPlatform={selectedPlatform}
        onOpenQualityModal={onOpenQualityModal}
        isStuttering={isStuttering}
        audioQuality={audioQuality}
        darkMode={darkMode}
        onToggleTheme={onToggleTheme}
        onOpenPrivateAccessModal={onOpenPrivateAccessModal}
        isPrivateAuthenticated={isPrivateAuthenticated}
      />
    </Stack>
  )
}
