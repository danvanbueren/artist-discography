'use client'

import { Box, Stack, Typography, Button, Tooltip, useTheme } from '@mui/material'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import LinkIcon from '@mui/icons-material/Link'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import SubduedText from '../ui/SubduedText'
import { SOCIAL_ICONS, getSortedActiveLinks } from '../artist/ArtistHero'
import { useLogoAnalysis, getLogoFilter } from '../../lib/hooks/useLogoAnalysis'
import { useDynamicThemeGradients } from '../../lib/hooks/useDynamicThemeGradients'

export default function CompactArtistHeader({
  artist,
  onNavigateHome,
  darkMode,
  onToggleTheme,
  selectedPlatform,
  onOpenPlatformModal,
  ambientImage,
  hasAvailablePlatforms = true,
}) {
  const theme = useTheme()
  const isDarkMode = theme.palette.mode === 'dark'
  const logoAnalysis = useLogoAnalysis('/api/logo?w=96&fmt=webp')
  const coverSrc = ambientImage || '/api/logo?w=640&fmt=webp'
  const { primaryTextSx, secondaryTextSx, logoGradientSx, getLogoFilter: getDynamicLogoFilter } = useDynamicThemeGradients(coverSrc, isDarkMode)

  const name = artist?.name ?? ''
  const bio = artist?.bio ?? ''
  const activeLinks = getSortedActiveLinks(artist)

  return (
    <Stack
      spacing={2.5}
      sx={{
        alignItems: 'center',
        justifyContent: 'center',
        py: { xs: 2, sm: 3 },
        px: { xs: 2, sm: 3 },
        width: '100%',
        textAlign: 'center',
      }}
    >
      {/* 1. Horizontal Logo & Artist Name Button with Back-To-Home Affordance */}
      <Stack
        direction="row"
        spacing={{ xs: 1.5, sm: 2.5 }}
        onClick={onNavigateHome}
        sx={{
          alignItems: 'center',
          justifyContent: 'center',
          cursor: onNavigateHome ? 'pointer' : 'default',
          px: { xs: 2.5, sm: 4, md: 5 },
          py: { xs: 1.5, sm: 2, md: 2.5 },
          borderRadius: 5,
          bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
          border: '1px solid',
          borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
          transition: 'all 0.25s ease',
          '&:hover': onNavigateHome
            ? {
                bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.09)' : 'rgba(0, 0, 0, 0.07)',
                borderColor: 'primary.main',
                transform: 'scale(1.02)',
                boxShadow: isDarkMode ? '0 8px 24px rgba(0, 0, 0, 0.4)' : '0 8px 24px rgba(0, 0, 0, 0.08)',
              }
            : {},
        }}
      >
        {onNavigateHome && (
          <Tooltip title="Return to All Projects" arrow>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: { xs: 32, sm: 40 },
                height: { xs: 32, sm: 40 },
                borderRadius: '50%',
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(144, 202, 249, 0.35)',
                transition: 'transform 0.2s ease',
                '&:hover': {
                  transform: 'translateX(-2px)',
                },
              }}
            >
              <ArrowBackRoundedIcon sx={{ fontSize: { xs: 18, sm: 22 } }} />
            </Box>
          </Tooltip>
        )}

        <Box
          aria-label="Artist Logo"
          sx={{
            height: { xs: 60, sm: 90, md: 120 },
            maxWidth: { xs: 180, sm: 260, md: 340 },
            aspectRatio: logoAnalysis?.aspectRatio ? `${logoAnalysis.aspectRatio}` : 'auto',
            flexShrink: 0,
            ...logoGradientSx,
            ...getDynamicLogoFilter(isDarkMode ? 'drop-shadow(0px 4px 12px rgba(0,0,0,0.3))' : 'drop-shadow(0px 4px 12px rgba(0,0,0,0.12))'),
          }}
        />
        <Typography
          variant="h2"
          component="h1"
          sx={{
            fontWeight: 800,
            fontSize: { xs: '2rem', sm: '2.75rem', md: '3.5rem' },
            letterSpacing: '-0.02em',
            fontFamily: 'Roboto, sans-serif',
            ...primaryTextSx,
          }}
        >
          {name || 'Artist'}
        </Typography>
      </Stack>

      {/* 2. Artist Description / Bio */}
      {bio && (
        <SubduedText
          value={bio}
          placeholder=""
          variant="body2"
          sx={{
            maxWidth: 620,
            mx: 'auto',
            fontSize: { xs: '0.9rem', sm: '1rem' },
            lineHeight: 1.6,
            ...secondaryTextSx,
          }}
        />
      )}

      {/* 3. Small Social & Platform Links */}
      {activeLinks.length > 0 && (
        <Stack
          direction="row"
          spacing={1.5}
          sx={{
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: 1,
          }}
        >
          {activeLinks.map(({ key, url, icon }) => (
            <Box
              key={key}
              component="a"
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 2,
                transition: 'transform 0.2s ease, opacity 0.2s ease',
                textDecoration: 'none',
                '&:hover': {
                  transform: 'scale(1.15)',
                },
              }}
            >
              <Box
                component="img"
                src={icon}
                alt={key}
                draggable={false}
                loading="eager"
                decoding="async"
                sx={{
                  width: { xs: 28, sm: 32 },
                  height: { xs: 28, sm: 32 },
                  objectFit: 'contain',
                  borderRadius: 2,
                  boxShadow: '0 3px 10px rgba(0,0,0,0.25)',
                  display: 'block',
                }}
              />
            </Box>
          ))}
        </Stack>
      )}

      {/* 4. Controls: Change Preferred Platform & Theme Buttons */}
      <Stack
        direction="row"
        spacing={1.5}
        sx={{
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: 1,
          pt: 0.5,
        }}
      >
        <Button
          size="small"
          variant="outlined"
          disabled={!hasAvailablePlatforms}
          onClick={onOpenPlatformModal}
          startIcon={
            selectedPlatform && SOCIAL_ICONS[selectedPlatform] ? (
              <Box
                component="img"
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
              <LinkIcon fontSize="small" />
            )
          }
          sx={{
            borderRadius: 3,
            textTransform: 'none',
            fontWeight: 600,
            fontSize: { xs: '0.8rem', sm: '0.875rem' },
            py: 0.75,
            px: 2,
            borderColor: isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
            color: 'text.primary',
            '&:hover': {
              borderColor: 'primary.main',
              bgcolor: isDarkMode ? 'rgba(144, 202, 249, 0.08)' : 'rgba(25, 118, 210, 0.08)',
            },
          }}
        >
          Platform
        </Button>

        <Button
          size="small"
          variant="outlined"
          onClick={onToggleTheme}
          startIcon={
            darkMode ? (
              <LightModeIcon fontSize="small" />
            ) : (
              <DarkModeIcon fontSize="small" />
            )
          }
          sx={{
            borderRadius: 3,
            textTransform: 'none',
            fontWeight: 600,
            fontSize: { xs: '0.8rem', sm: '0.875rem' },
            py: 0.75,
            px: 2,
            borderColor: isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
            color: 'text.primary',
            '&:hover': {
              borderColor: 'primary.main',
              bgcolor: isDarkMode ? 'rgba(144, 202, 249, 0.08)' : 'rgba(25, 118, 210, 0.08)',
            },
          }}
        >
          {darkMode ? 'Light Theme' : 'Dark Theme'}
        </Button>
      </Stack>
    </Stack>
  )
}
