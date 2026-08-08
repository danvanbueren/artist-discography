'use client'

import { Box, Stack, IconButton, Tooltip } from '@mui/material'
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
}

export default function ArtistHero({ artist }) {
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
        py: { xs: 2, sm: 3 },
      }}
    >
      <SubduedText
        value={name}
        placeholder="Artist Name"
        variant="h2"
        component="h1"
        sx={{
          fontWeight: 800,
          letterSpacing: '-0.02em',
          fontSize: { xs: '2rem', sm: '2.75rem', md: '3.5rem' },
          mb: 1.5,
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
          maxWidth: 680,
          mx: 'auto',
          fontSize: { xs: '0.95rem', sm: '1.05rem' },
          lineHeight: 1.6,
          color: 'text.secondary',
        }}
      />

      {activeLinks.length > 0 && (
        <Stack
          direction="row"
          spacing={1.5}
          justifyContent="center"
          alignItems="center"
          sx={{ mt: 2.5, flexWrap: 'wrap', gap: 1 }}
        >
          {activeLinks.map(({ key, url, icon }) => (
            <Tooltip key={key} title={key.toUpperCase()} arrow>
              <IconButton
                component="a"
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                size="small"
                sx={{
                  p: 0.75,
                  borderRadius: '50%',
                  bgcolor: 'rgba(255,255,255,0.05)',
                  backdropFilter: 'blur(4px)',
                  transition: 'transform 0.2s ease, bgcolor 0.2s ease',
                  '&:hover': {
                    transform: 'scale(1.15)',
                    bgcolor: 'rgba(255,255,255,0.15)',
                  },
                }}
              >
                <Box
                  component="img"
                  src={icon}
                  alt={key}
                  sx={{ width: 22, height: 22, objectFit: 'contain' }}
                />
              </IconButton>
            </Tooltip>
          ))}
        </Stack>
      )}
    </Box>
  )
}
