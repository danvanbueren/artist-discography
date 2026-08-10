'use client'

import { Box, Stack, Typography, Button, useTheme } from '@mui/material'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import LinkIcon from '@mui/icons-material/Link'
import SubduedText from './SubduedText'
import { SOCIAL_ICONS, getSortedActiveLinks } from './ArtistHero'
import { useLogoAnalysis, getLogoFilter } from '../lib/useLogoAnalysis'

export default function CompactArtistHeader({
  artist,
  onNavigateHome,
  darkMode,
  onToggleTheme,
  selectedPlatform,
  onOpenPlatformModal,
}) {
  const theme = useTheme()
  const isDarkMode = theme.palette.mode === 'dark'
  const logoAnalysis = useLogoAnalysis('/api/logo')

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
      {/* 1. Horizontal Logo & Artist Name Button */}
      <Stack
        direction="row"
        spacing={{ xs: 2, sm: 3 }}
        onClick={onNavigateHome}
        sx={{
          alignItems: 'center',
          justifyContent: 'center',
          cursor: onNavigateHome ? 'pointer' : 'default',
          px: { xs: 3, sm: 4.5, md: 6 },
          py: { xs: 1.75, sm: 2.5, md: 3 },
          borderRadius: 5,
          opacity: 0.88,
          bgcolor: 'transparent',
          border: '1px solid transparent',
          borderColor: 'transparent',
          transition: 'transform 0.25s ease, opacity 0.25s ease, background-color 0.25s ease, border-color 0.25s ease',
          '&:hover': onNavigateHome
            ? {
                opacity: 1,
                transform: 'scale(1.04)',
                bgcolor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                borderColor: 'primary.main',
                backdropFilter: 'blur(8px)',
              }
            : {},
        }}
      >
        <Box
          component="img"
          src="/api/logo"
          alt="Artist Logo"
          draggable={false}
          sx={{
            height: { xs: 110, sm: 150, md: 180 },
            maxWidth: { xs: 240, sm: 360, md: 450 },
            objectFit: 'contain',
            filter: getLogoFilter(logoAnalysis, isDarkMode, 'none'),
          }}
        />
        <Typography
          variant="h2"
          component="h1"
          sx={{
            fontWeight: 800,
            fontSize: { xs: '3rem', sm: '4rem', md: '4.75rem' },
            letterSpacing: '-0.02em',
            fontFamily: 'Roboto, sans-serif',
            background: isDarkMode
              ? 'linear-gradient(135deg, #ffffff 0%, #a0a0b0 100%)'
              : 'linear-gradient(135deg, #111827 0%, #4b5563 100%)',
            WebkitBackgroundClip: name ? 'text' : 'none',
            WebkitTextFillColor: name ? 'transparent' : 'inherit',
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
            color: 'text.secondary',
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
          onClick={onOpenPlatformModal}
          startIcon={
            SOCIAL_ICONS[selectedPlatform] ? (
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
