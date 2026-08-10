'use client'

import { Box, Container, useTheme } from '@mui/material'
import HeaderLogo from './HeaderLogo'
import SubduedText from './SubduedText'

export const SOCIAL_ICONS = {
  spotify: '/platforms/spotify.webp',
  apple: '/platforms/apple.webp',
  youtube: '/platforms/youtube.webp',
  soundcloud: '/platforms/soundcloud.webp',
  instagram: '/platforms/instagram.webp',
  facebook: '/platforms/facebook.webp',
  x: '/platforms/x.webp',
  tiktok: '/platforms/tiktok.webp',
  discord: '/platforms/discord.webp',
  snapchat: '/platforms/snapchat.webp',
  bandcamp: '/platforms/bandcamp.webp',
  deezer: '/platforms/deezer.webp',
  tidal: '/platforms/tidal.webp',
  pandora: '/platforms/pandora.webp',
  amazon: '/platforms/amazon.webp',
  itunes: '/platforms/itunes.webp',
}

export const ARTIST_LINK_ORDER = [
  // Platforms
  'spotify',
  'apple',
  'bandcamp',
  'tidal',
  'youtube',
  'soundcloud',
  'pandora',
  'amazon',
  'deezer',
  'itunes',
  // Socials
  'instagram',
  'tiktok',
  'discord',
  'x',
  'snapchat',
  'facebook',
]

export function getSortedActiveLinks(artist) {
  const platforms = artist?.links?.platforms ?? {}
  const socials = artist?.links?.socials ?? {}
  const combinedLinks = { ...platforms, ...socials }

  const activeLinks = []
  for (const key of ARTIST_LINK_ORDER) {
    const url = combinedLinks[key]
    if (url && typeof url === 'string' && url.trim() !== '') {
      activeLinks.push({ key, url: url.trim(), icon: SOCIAL_ICONS[key] })
    }
  }

  for (const [key, url] of Object.entries(combinedLinks)) {
    if (url && typeof url === 'string' && url.trim() !== '' && !ARTIST_LINK_ORDER.includes(key)) {
      activeLinks.push({ key, url: url.trim(), icon: SOCIAL_ICONS[key] })
    }
  }

  return activeLinks
}

export default function ArtistHero({ artist, onLogoClick }) {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const name = artist?.name ?? ''
  const bio = artist?.bio ?? ''

  // Collect non-empty social and platform links in explicit order
  const activeLinks = getSortedActiveLinks(artist)

  return (
    <Container
      maxWidth="md"
      sx={{
        textAlign: 'center',
        px: { xs: 2, sm: 3 },
        py: { xs: 6, sm: 10, md: 14 },
        minHeight: { xs: '65vh', sm: '75vh' },
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <HeaderLogo onClick={onLogoClick} />

      <SubduedText
        value={name}
        placeholder="Artist Name"
        variant="h2"
        component="h1"
        sx={{
          fontWeight: 800,
          letterSpacing: '-0.02em',
          fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.5rem' },
          mb: 2,
          fontFamily: 'Roboto, sans-serif',
          background: isDark
            ? 'linear-gradient(135deg, #ffffff 0%, #a0a0b0 100%)'
            : 'linear-gradient(135deg, #111827 0%, #4b5563 100%)',
          WebkitBackgroundClip: name ? 'text' : 'none',
          WebkitTextFillColor: name ? 'transparent' : 'inherit',
        }}
      />

      <SubduedText
        value={bio}
        placeholder="Artist description and bio will appear here."
        variant="body1"
        sx={{
          maxWidth: 720,
          mx: 'auto',
          fontSize: { xs: '1.05rem', sm: '1.2rem' },
          lineHeight: 1.7,
          color: 'text.secondary',
        }}
      />

      {activeLinks.length > 0 && (
        <Box
          sx={{
            width: '100%',
            mx: 'auto',
            mt: { xs: 4, sm: 5 },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              alignItems: 'center',
              gap: { xs: 2, sm: 3 },
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
                  borderRadius: { xs: 2.5, sm: 3 },
                  transition: 'transform 0.25s ease, opacity 0.25s ease',
                  textDecoration: 'none',
                  '&:hover': {
                    transform: 'scale(1.12)',
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
                    width: { xs: 54, sm: 64, md: 72 },
                    height: { xs: 54, sm: 64, md: 72 },
                    objectFit: 'contain',
                    borderRadius: { xs: 2.5, sm: 3 },
                    boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
                    display: 'block',
                  }}
                />
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Container>
  )
}
