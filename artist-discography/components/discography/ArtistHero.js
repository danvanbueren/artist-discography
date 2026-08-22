'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { Box, Container, useTheme } from '@mui/material'
import HeaderLogo from '@/components/layout/HeaderLogo'
import SubduedText from '@/components/ui/SubduedText'
import { useDynamicThemeGradients } from '@/lib/hooks/useDynamicThemeGradients'

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

function partitionEvenly(items, rowCount) {
  if (!items || items.length === 0) return []
  if (rowCount <= 1 || items.length <= 1) return [items]

  const total = items.length
  const actualRowCount = Math.min(rowCount, total)
  const baseCount = Math.floor(total / actualRowCount)
  const remainder = total % actualRowCount

  const rows = []
  let startIndex = 0

  for (let r = 0; r < actualRowCount; r++) {
    const count = r < remainder ? baseCount + 1 : baseCount
    if (count > 0) {
      rows.push(items.slice(startIndex, startIndex + count))
      startIndex += count
    }
  }
  return rows
}

export default function ArtistHero({ artist, onLogoClick, ambientImage }) {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const name = artist?.name ?? ''
  const bio = artist?.bio ?? ''
  const coverSrc = ambientImage || '/api/logo?w=640&fmt=webp'
  const { primaryTextSx, secondaryTextSx } = useDynamicThemeGradients(coverSrc, isDark)

  // Collect non-empty social and platform links in explicit order
  const activeLinks = useMemo(() => getSortedActiveLinks(artist), [artist])

  const containerRef = useRef(null)
  const [rowCount, setRowCount] = useState(1)
  const activeLinksCount = activeLinks.length

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    let rafId = null

    const calculateRowCount = () => {
      if (activeLinksCount <= 1) {
        setRowCount(1)
        return
      }

      const width = el.clientWidth || 0
      if (width <= 0) return

      let itemSize = 72
      let gap = 24

      if (typeof window !== 'undefined') {
        if (window.innerWidth < 600) {
          itemSize = 54
          gap = 16
        } else if (window.innerWidth < 900) {
          itemSize = 64
          gap = 24
        }
      }

      const maxItemsPerRow = Math.max(1, Math.floor((width + gap) / (itemSize + gap)))
      const nextRowCount = Math.max(1, Math.ceil(activeLinksCount / maxItemsPerRow))

      setRowCount((prev) => (prev === nextRowCount ? prev : nextRowCount))
    }

    const handleResize = () => {
      if (rafId !== null) return
      rafId = window.requestAnimationFrame(() => {
        rafId = null
        calculateRowCount()
      })
    }

    calculateRowCount()

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
  }, [activeLinksCount])

  const rows = useMemo(() => {
    return partitionEvenly(activeLinks, rowCount)
  }, [activeLinks, rowCount])

  return (
    <Container
      maxWidth='md'
      sx={{
        textAlign: 'center',
        px: { xs: 4, sm: 3 },
        py: { xs: 5, sm: 8, md: 10 },
        minHeight: { xs: 'max(460px, 60dvh)', sm: 'max(540px, 70dvh)', md: 'max(600px, 75dvh)' },
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0,
      }}
    >
      <HeaderLogo onClick={onLogoClick} ambientImage={coverSrc} />

      <SubduedText
        value={name}
        placeholder='Artist Name'
        variant='h2'
        component='h1'
        sx={{
          fontWeight: 800,
          letterSpacing: '-0.02em',
          fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.5rem' },
          mb: 2,
          fontFamily: 'Roboto, sans-serif',
          flexShrink: 0,
          ...primaryTextSx,
        }}
      />

      <SubduedText
        value={bio}
        placeholder='Artist description and bio will appear here.'
        variant='body1'
        sx={{
          maxWidth: 720,
          mx: 'auto',
          fontSize: { xs: '1.05rem', sm: '1.2rem' },
          lineHeight: 1.7,
          flexShrink: 0,
          ...secondaryTextSx,
        }}
      />

      {activeLinks.length > 0 && (
        <Box
          ref={containerRef}
          sx={{
            width: '100%',
            mx: 'auto',
            mt: { xs: 3.5, sm: 4.5, md: 5 },
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: { xs: 2, sm: 3 },
          }}
        >
          {rows.map((rowLinks, rowIdx) => (
            <Box
              key={rowIdx}
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                alignItems: 'center',
                gap: { xs: 2, sm: 3 },
                width: '100%',
                flexShrink: 0,
              }}
            >
              {rowLinks.map(({ key, url, icon }) => (
                <Box
                  key={key}
                  component='a'
                  href={url}
                  target='_blank'
                  rel='noopener noreferrer'
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: { xs: 2.5, sm: 3 },
                    transition: 'transform 0.25s ease, opacity 0.25s ease',
                    textDecoration: 'none',
                    flexShrink: 0,
                    '&:hover': {
                      transform: 'scale(1.12)',
                    },
                  }}
                >
                  <Box
                    component='img'
                    src={icon}
                    alt={key}
                    draggable={false}
                    loading='eager'
                    decoding='async'
                    sx={{
                      width: { xs: 54, sm: 64, md: 72 },
                      height: { xs: 54, sm: 64, md: 72 },
                      minWidth: { xs: 54, sm: 64, md: 72 },
                      minHeight: { xs: 54, sm: 64, md: 72 },
                      objectFit: 'contain',
                      borderRadius: { xs: 2.5, sm: 3 },
                      boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
                      display: 'block',
                      flexShrink: 0,
                    }}
                  />
                </Box>
              ))}
            </Box>
          ))}
        </Box>
      )}
    </Container>
  )
}
