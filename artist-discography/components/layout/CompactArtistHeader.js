'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { Box, Stack, Typography, Button, Paper, useTheme } from '@mui/material'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import LinkIcon from '@mui/icons-material/Link'
import HomeRoundedIcon from '@mui/icons-material/HomeRounded'
import GraphicEqRoundedIcon from '@mui/icons-material/GraphicEqRounded'
import HighQualityRoundedIcon from '@mui/icons-material/HighQualityRounded'
import DataSaverOnRoundedIcon from '@mui/icons-material/DataSaverOnRounded'
import PriorityHighRoundedIcon from '@mui/icons-material/PriorityHighRounded'
import LockRoundedIcon from '@mui/icons-material/LockRounded'
import LockOpenRoundedIcon from '@mui/icons-material/LockOpenRounded'
import { SOCIAL_ICONS } from '../artist/ArtistHero'
import { useLogoAnalysis, getLogoFilter } from '../../lib/hooks/useLogoAnalysis'
import { useDynamicThemeGradients } from '../../lib/hooks/useDynamicThemeGradients'
import { useDragScroll } from '../../lib/hooks/useDragScroll'

function getTextWidthAt100px(text) {
  if (typeof window === 'undefined' || !text) return (text?.length || 0) * 58
  try {
    if (!getTextWidthAt100px.canvas) {
      getTextWidthAt100px.canvas = document.createElement('canvas')
    }
    const ctx = getTextWidthAt100px.canvas.getContext('2d')
    if (!ctx) return text.length * 58
    ctx.font = '800 100px Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    return ctx.measureText(text).width || text.length * 58
  } catch {
    return (text?.length || 0) * 58
  }
}

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
  const {
    ref: headerDragRef,
    bind: headerDragBind,
    isDragging: isHeaderDragging,
    hasDraggedRef,
  } = useDragScroll()

  const containerRef = useRef(null)
  const [containerWidth, setContainerWidth] = useState(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    let rafId = null

    const updateWidth = () => {
      const w = el.clientWidth || 0
      if (w > 0) {
        setContainerWidth((prev) => (prev === w ? prev : w))
      }
    }

    const handleResize = () => {
      if (rafId !== null) return
      rafId = window.requestAnimationFrame(() => {
        rafId = null
        updateWidth()
      })
    }

    updateWidth()

    let resizeObserver = null
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(handleResize)
      resizeObserver.observe(el)
    }

    window.addEventListener('resize', handleResize, { passive: true })

    return () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId)
      }
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  const computedDimensions = useMemo(() => {
    if (!containerWidth || containerWidth <= 0) return null

    const W = containerWidth
    const ar =
      logoAnalysis?.aspectRatio && !isNaN(logoAnalysis.aspectRatio) && logoAnalysis.aspectRatio > 0
        ? logoAnalysis.aspectRatio
        : 1.0

    const text = name || 'Artist'
    const textWidthAt100 = getTextWidthAt100px(text)
    const textRatio = textWidthAt100 / 100

    // Proportion constants
    const kf = 0.6 // font size to logo height ratio
    const kg = 0.14 // gap to logo height ratio

    // Breakpoint-specific bounds
    let hMax, hMin, fMax, fMin, gapMax, gapMin
    if (W >= 800) {
      // Desktop
      hMax = 180
      hMin = 64
      fMax = 100
      fMin = 30
      gapMax = 28
      gapMin = 14
    } else if (W >= 540) {
      // Tablet
      hMax = 130
      hMin = 50
      fMax = 72
      fMin = 24
      gapMax = 20
      gapMin = 10
    } else {
      // Mobile
      hMax = 95
      hMin = 40
      fMax = 54
      fMin = 19
      gapMax = 14
      gapMin = 8
    }

    // Solve for target height: W = H * ar + H * kg + (H * kf) * textRatio = H * (ar + kg + kf * textRatio)
    const divisor = Math.max(0.5, ar + kg + kf * textRatio)
    const hTarget = W / divisor

    // Clamp height and font size
    const logoHeight = Math.round(Math.max(hMin, Math.min(hMax, hTarget)))
    const logoWidth = Math.round(logoHeight * ar)
    const rawFontSize = Math.round(logoHeight * kf)
    const fontSize = Math.round(Math.max(fMin, Math.min(fMax, rawFontSize)))
    const rawGap = Math.round(logoHeight * kg)
    const gap = Math.round(Math.max(gapMin, Math.min(gapMax, rawGap)))

    // Estimated total content width at calculated scale
    const estimatedTotalWidth = logoWidth + gap + Math.round(fontSize * textRatio)
    const isFullWidth = estimatedTotalWidth >= W - 10

    return {
      logoHeight,
      logoWidth,
      fontSize,
      gap,
      isFullWidth,
    }
  }, [containerWidth, logoAnalysis?.aspectRatio, name])

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
              maxWidth: '100%',
              aspectRatio: logoAnalysis?.aspectRatio ? `${logoAnalysis.aspectRatio}` : 'auto',
              flexShrink: 0,
              ...logoGradientSx,
              ...getDynamicLogoFilter(
                isDarkMode
                  ? 'drop-shadow(0px 4px 12px rgba(0,0,0,0.3))'
                  : 'drop-shadow(0px 4px 12px rgba(0,0,0,0.12))',
              ),
            }}
          />
          <Typography
            variant='h2'
            component='h1'
            sx={{
              fontWeight: 800,
              fontSize: computedDimensions
                ? `${computedDimensions.fontSize}px`
                : { xs: '2.5rem', sm: '3.75rem', md: '5rem' },
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              fontFamily: 'Roboto, sans-serif',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flexShrink: 1,
              minWidth: 0,
              textAlign: 'center',
              ...primaryTextSx,
            }}
          >
            {name || 'Artist'}
          </Typography>
        </Box>
      </Box>

      {/* 2. Controls: Home, Platform, Quality, Theme, and Private Access (Drag-Scrollable Paper Card) */}
      <Paper
        elevation={4}
        sx={{
          height: { xs: 54, sm: 60 },
          minHeight: { xs: 54, sm: 60 },
          maxHeight: { xs: 54, sm: 60 },
          borderRadius: 4,
          py: 0,
          px: { xs: 1.5, sm: 2.5 },
          backdropFilter: 'blur(16px)',
          bgcolor:
            theme.palette.mode === 'dark' ? 'rgba(18, 18, 26, 0.88)' : 'rgba(255, 255, 255, 0.88)',
          border: '1px solid',
          borderColor:
            theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
          boxShadow:
            theme.palette.mode === 'dark'
              ? '0 8px 32px rgba(0,0,0,0.35)'
              : '0 8px 32px rgba(0,0,0,0.1)',
          transition: 'background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          maxWidth: '100%',
          width: { xs: '100%', sm: 'fit-content' },
          mx: { xs: 0, sm: 'auto' },
        }}
      >
        <Box
          ref={headerDragRef}
          {...headerDragBind}
          sx={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'nowrap',
            gap: { xs: 0.75, sm: 1.5 },
            overflowX: 'auto',
            minWidth: 0,
            maxWidth: '100%',
            width: '100%',
            justifyContent: { xs: 'flex-start', sm: 'center' },
            py: 0.5,
            px: 0.5,
            cursor: isHeaderDragging ? 'grabbing' : 'grab',
            userSelect: 'none',
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          {onNavigateHome && (
            <Button
              size='medium'
              variant='text'
              onClick={() => {
                if (hasDraggedRef.current) return
                onNavigateHome()
              }}
              startIcon={<HomeRoundedIcon />}
              sx={{
                flexShrink: 0,
                whiteSpace: 'nowrap',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: { xs: '0.85rem', sm: '0.92rem' },
                borderRadius: 3,
                px: { xs: 1.25, sm: 2 },
                py: 0.85,
                minWidth: 0,
                color: 'text.primary',
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
            >
              Home
            </Button>
          )}

          <Button
            size='medium'
            variant='text'
            disabled={!hasAvailablePlatforms}
            onClick={() => {
              if (hasDraggedRef.current) return
              if (onOpenPlatformModal) onOpenPlatformModal()
            }}
            startIcon={
              selectedPlatform && SOCIAL_ICONS[selectedPlatform] ? (
                <Box
                  component='img'
                  src={SOCIAL_ICONS[selectedPlatform]}
                  alt={selectedPlatform || 'Platform'}
                  draggable={false}
                  sx={{
                    width: 18,
                    height: 18,
                    objectFit: 'contain',
                    borderRadius: 0.5,
                  }}
                />
              ) : (
                <LinkIcon />
              )
            }
            sx={{
              flexShrink: 0,
              whiteSpace: 'nowrap',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: { xs: '0.85rem', sm: '0.92rem' },
              borderRadius: 3,
              px: { xs: 1.25, sm: 2 },
              py: 0.85,
              minWidth: 0,
              color: 'text.primary',
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
          >
            Platform
          </Button>

          <Button
            size='medium'
            variant='text'
            onClick={() => {
              if (hasDraggedRef.current) return
              if (onOpenQualityModal) onOpenQualityModal()
            }}
            startIcon={
              isStuttering ? (
                <Box
                  component='span'
                  sx={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#fbbf24' : '#d97706'),
                    color: (theme) => (theme.palette.mode === 'dark' ? '#1a1400' : '#ffffff'),
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <PriorityHighRoundedIcon sx={{ fontSize: 12, color: 'inherit' }} />
                </Box>
              ) : audioQuality === 'lossless' ? (
                <GraphicEqRoundedIcon />
              ) : audioQuality === '128k' ? (
                <DataSaverOnRoundedIcon />
              ) : (
                <HighQualityRoundedIcon />
              )
            }
            sx={{
              flexShrink: 0,
              whiteSpace: 'nowrap',
              textTransform: 'none',
              fontWeight: isStuttering ? 700 : 600,
              fontSize: { xs: '0.85rem', sm: '0.92rem' },
              borderRadius: 3,
              px: { xs: 1.25, sm: 2 },
              py: 0.85,
              minWidth: 0,
              color: isStuttering
                ? (theme) => (theme.palette.mode === 'dark' ? '#fbbf24' : '#d97706')
                : 'text.primary',
              bgcolor: isStuttering
                ? (theme) =>
                    theme.palette.mode === 'dark'
                      ? 'rgba(245, 158, 11, 0.14)'
                      : 'rgba(245, 158, 11, 0.1)'
                : 'transparent',
              boxShadow: isStuttering
                ? (theme) =>
                    theme.palette.mode === 'dark'
                      ? '0 0 8px rgba(245, 158, 11, 0.3)'
                      : '0 0 6px rgba(217, 119, 6, 0.2)'
                : 'none',
              '&:hover': {
                bgcolor: isStuttering
                  ? (theme) =>
                      theme.palette.mode === 'dark'
                        ? 'rgba(245, 158, 11, 0.24)'
                        : 'rgba(245, 158, 11, 0.18)'
                  : 'action.hover',
              },
            }}
          >
            Quality
          </Button>

          <Button
            size='medium'
            variant='text'
            onClick={() => {
              if (hasDraggedRef.current) return
              if (onToggleTheme) onToggleTheme()
            }}
            startIcon={darkMode ? <DarkModeIcon /> : <LightModeIcon />}
            sx={{
              flexShrink: 0,
              whiteSpace: 'nowrap',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: { xs: '0.85rem', sm: '0.92rem' },
              borderRadius: 3,
              px: { xs: 1.25, sm: 2 },
              py: 0.85,
              minWidth: 0,
              color: 'text.primary',
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
          >
            Theme
          </Button>

          <Button
            size='medium'
            variant='text'
            onClick={() => {
              if (hasDraggedRef.current) return
              if (onOpenPrivateAccessModal) onOpenPrivateAccessModal()
            }}
            startIcon={isPrivateAuthenticated ? <LockOpenRoundedIcon /> : <LockRoundedIcon />}
            sx={{
              flexShrink: 0,
              whiteSpace: 'nowrap',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: { xs: '0.85rem', sm: '0.92rem' },
              borderRadius: 3,
              px: { xs: 1.25, sm: 2 },
              py: 0.85,
              minWidth: 0,
              color: isPrivateAuthenticated ? 'success.main' : 'text.primary',
              '&:hover': {
                bgcolor: isPrivateAuthenticated
                  ? isDarkMode
                    ? 'rgba(102, 187, 106, 0.12)'
                    : 'rgba(46, 125, 50, 0.08)'
                  : 'action.hover',
              },
            }}
          >
            {isPrivateAuthenticated ? 'Unlocked' : 'Locked'}
          </Button>
        </Box>
      </Paper>
    </Stack>
  )
}
