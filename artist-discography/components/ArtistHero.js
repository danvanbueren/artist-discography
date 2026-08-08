'use client'

import { Box, Stack, IconButton } from '@mui/material'
import HeaderLogo from './HeaderLogo'
import SubduedText from './SubduedText'

const SOCIAL_ICONS = {
  spotify: '/spotify.webp',
  apple: '/apple.webp',
  youtube: '/youtube.webp',
  soundcloud: '/soundcloud.webp',
  instagram: '/instagram.webp',
  facebook: '/facebook.webp',
  x: '/x.webp',
  tiktok: '/tiktok.webp',
  discord: '/discord.webp',
  snapchat: '/snapchat.webp',
  bandcamp: '/bandcamp.webp',
  deezer: '/deezer.webp',
  tidal: '/tidal.webp',
  pandora: '/pandora.webp',
  amazon: '/amazon.webp',
  itunes: '/itunes.webp',
}

export default function ArtistHero({ artist, onLogoClick }) {
  const name = artist?.name ?? ''
  const bio = artist?.bio ?? ''
  const platforms = artist?.links?.platforms ?? {}
  const socials = artist?.links?.socials ?? {}

  // Collect non-empty social and platform links
  const activeLinks = []
  const combinedLinks = { ...platforms, ...socials }

  for (const [key, url] of Object.entries(combinedLinks)) {
    if (url && typeof url === 'string' && url.trim() !== '') {
      activeLinks.push({ key, url, icon: SOCIAL_ICONS[key] })
    }
  }

  return (
    <Box
      sx={{
        textAlign: 'center',
        px: { xs: 2, sm: 4 },
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
          background: 'linear-gradient(135deg, #ffffff 0%, #a0a0b0 100%)',
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
            maxWidth: 'md',
            width: '100%',
            mx: 'auto',
            mt: { xs: 4, sm: 5 },
            px: 2,
          }}
        >
          <Stack
            direction="row"
            spacing={2}
            sx={{
              flexWrap: 'wrap',
              gap: { xs: 1.5, sm: 2.5 },
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {activeLinks.map(({ key, url, icon }) => (
              <IconButton
                key={key}
                component="a"
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  p: 0.5,
                  transition: 'transform 0.25s ease',
                  '&:hover': {
                    transform: 'scale(1.15)',
                    bgcolor: 'transparent',
                  },
                }}
              >
                <Box
                  component="img"
                  src={icon}
                  alt={key}
                  sx={{
                    width: { xs: 54, sm: 64, md: 72 },
                    height: { xs: 54, sm: 64, md: 72 },
                    objectFit: 'contain',
                    borderRadius: { xs: 2.5, sm: 3 },
                    boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
                  }}
                />
              </IconButton>
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  )
}
