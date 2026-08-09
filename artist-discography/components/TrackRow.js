'use client'

import { useState } from 'react'
import { Box, Stack, Typography, IconButton } from '@mui/material'
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded'
import PauseRoundedIcon from '@mui/icons-material/PauseRounded'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import QueueMusicRoundedIcon from '@mui/icons-material/QueueMusicRounded'
import ShareRoundedIcon from '@mui/icons-material/ShareRounded'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import SubduedText from './SubduedText'
import { slugify } from '../lib/slugs'

const TRACK_PLATFORM_ICONS = {
  spotify: '/spotify.webp',
  apple: '/apple.webp',
  youtube: '/youtube.webp',
  soundcloud: '/soundcloud.webp',
  bandcamp: '/bandcamp.webp',
  deezer: '/deezer.webp',
  tidal: '/tidal.webp',
  pandora: '/pandora.webp',
  amazon: '/amazon.webp',
  itunes: '/itunes.webp',
}

const POPULAR_PLATFORM_FALLBACKS = [
  'spotify',
  'apple',
  'youtube',
  'soundcloud',
  'bandcamp',
  'deezer',
  'tidal',
  'pandora',
  'amazon',
  'itunes',
]

function getResolvedTrackLink(links = {}, selectedPlatform = '') {
  if (!links || typeof links !== 'object') return null

  const cleanLinks = {}
  for (const [key, url] of Object.entries(links)) {
    if (url && typeof url === 'string' && url.trim() !== '') {
      const k = key.toLowerCase()
      cleanLinks[k] = {
        key,
        url: url.trim(),
        icon: TRACK_PLATFORM_ICONS[k],
      }
    }
  }

  const cleanKeys = Object.keys(cleanLinks)
  if (cleanKeys.length === 0) return null

  if (selectedPlatform) {
    const selKey = selectedPlatform.toLowerCase()
    if (cleanLinks[selKey]) {
      return cleanLinks[selKey]
    }
  }

  for (const popKey of POPULAR_PLATFORM_FALLBACKS) {
    if (cleanLinks[popKey]) {
      return cleanLinks[popKey]
    }
  }

  return cleanLinks[cleanKeys[0]]
}

export default function TrackRow({
  track,
  index,
  project,
  projectArtist,
  onPlayTrack,
  onAddToQueue,
  onShowToast,
  isPlayingThisTrack,
  isHighlighted,
  onSelectTrack,
  selectedPlatform,
}) {
  const [hovered, setHovered] = useState(false)
  const [copied, setCopied] = useState(false)

  const name = track?.name ?? ''
  const artist = track?.artist || projectArtist || ''
  const links = track?.links ?? {}

  const resolvedLink = getResolvedTrackLink(links, selectedPlatform)

  const handleRowClick = (e) => {
    if (e.target.closest('a')) {
      return
    }
    if (onSelectTrack) {
      onSelectTrack(track)
    }
  }

  return (
    <Box
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleRowClick}
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'auto 1fr auto', sm: 'auto 1fr auto' },
        alignItems: 'center',
        py: 1.5,
        px: { xs: 1.5, sm: 2 },
        borderRadius: 2,
        cursor: 'pointer',
        bgcolor: isHighlighted
          ? 'rgba(144, 202, 249, 0.14)'
          : isPlayingThisTrack
          ? 'rgba(144, 202, 249, 0.08)'
          : hovered
          ? 'action.hover'
          : 'transparent',
        borderLeft: isHighlighted ? '3px solid' : '3px solid transparent',
        borderColor: isHighlighted ? 'primary.main' : 'transparent',
        transition: 'background-color 0.2s ease, border-color 0.2s ease',
      }}
    >
      {/* Col 1: Track Number / Play Indicator & Queue Button */}
      <Stack direction="row" spacing={0.25} sx={{ alignItems: 'center' }}>
        <Box sx={{ width: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isPlayingThisTrack ? (
            <IconButton
              size="small"
              color="primary"
              onClick={(e) => {
                e.stopPropagation()
                if (onPlayTrack) onPlayTrack(track, project)
              }}
              sx={{
                p: 0.6,
                borderRadius: 1.5,
                transition: 'transform 0.18s ease, opacity 0.18s ease',
                '&:hover': {
                  transform: 'scale(1.18)',
                  bgcolor: 'rgba(255,255,255,0.12)',
                  color: 'primary.main',
                },
              }}
            >
              <PauseRoundedIcon sx={{ fontSize: 20 }} />
            </IconButton>
          ) : hovered ? (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation()
                if (onPlayTrack) onPlayTrack(track, project)
              }}
              sx={{
                p: 0.6,
                borderRadius: 1.5,
                transition: 'transform 0.18s ease, opacity 0.18s ease',
                '&:hover': {
                  transform: 'scale(1.18)',
                  bgcolor: 'rgba(255,255,255,0.12)',
                  color: 'primary.main',
                },
              }}
            >
              <PlayArrowRoundedIcon sx={{ fontSize: 20 }} />
            </IconButton>
          ) : (
            <Typography
              variant="body2"
              sx={{
                fontWeight: isHighlighted ? 700 : 500,
                color: isHighlighted ? 'primary.main' : 'text.secondary',
                fontSize: '0.9rem',
              }}
            >
              {index + 1}
            </Typography>
          )}
        </Box>

        {/* Add to Queue Button */}
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation()
            if (onAddToQueue) onAddToQueue(track, project)
          }}
          sx={{
            p: 0.6,
            borderRadius: 1.5,
            opacity: hovered ? 1 : 0.65,
            transition: 'transform 0.18s ease, opacity 0.18s ease',
            '&:hover': {
              transform: 'scale(1.18)',
              opacity: 1,
              bgcolor: 'rgba(255,255,255,0.12)',
              color: 'primary.main',
            },
          }}
        >
          <QueueMusicRoundedIcon sx={{ fontSize: 20 }} />
        </IconButton>
      </Stack>

      {/* Col 2: Track Name & Artist Stack */}
      <Stack spacing={0.25} sx={{ minWidth: 0, px: 1 }}>
        <SubduedText
          value={name}
          placeholder="Untitled Track"
          variant="body1"
          sx={{
            fontWeight: isHighlighted ? 700 : 600,
            fontSize: { xs: '0.95rem', sm: '1rem' },
            color: isHighlighted ? 'primary.main' : 'text.primary',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        />

        <SubduedText
          value={artist}
          placeholder="Artist"
          variant="caption"
          sx={{
            fontSize: '0.825rem',
            color: 'text.secondary',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        />
      </Stack>

      {/* Col 3: Actions & Streaming Link */}
      <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
        <IconButton
          component={resolvedLink ? 'a' : 'button'}
          href={resolvedLink?.url || undefined}
          target={resolvedLink ? '_blank' : undefined}
          rel={resolvedLink ? 'noopener noreferrer' : undefined}
          disabled={!resolvedLink}
          size="small"
          onClick={(e) => e.stopPropagation()}
          sx={{
            p: 0.6,
            px: resolvedLink?.icon ? 0.8 : 0.6,
            borderRadius: 1.5,
            border: resolvedLink ? '1px solid' : '1px solid transparent',
            borderColor: resolvedLink ? 'rgba(255,255,255,0.12)' : 'transparent',
            bgcolor: 'transparent',
            opacity: resolvedLink ? (hovered ? 1 : 0.8) : 0.3,
            transition: 'transform 0.18s ease, opacity 0.18s ease, background-color 0.18s ease, border-color 0.18s ease',
            '&:hover': resolvedLink
              ? {
                  transform: 'scale(1.08)',
                  opacity: 1,
                  bgcolor: 'rgba(255,255,255,0.12)',
                  borderColor: 'primary.main',
                }
              : {},
          }}
        >
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
            {resolvedLink?.icon && (
              <Box
                component="img"
                src={resolvedLink.icon}
                alt={resolvedLink.key}
                loading="eager"
                decoding="async"
                sx={{ width: 18, height: 18, objectFit: 'contain', borderRadius: 1 }}
              />
            )}
            <OpenInNewIcon sx={{ fontSize: 16 }} />
          </Stack>
        </IconButton>

        {/* Share Track Link Button */}
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation()
            const pSlug = slugify(project?.name || '')
            const tSlug = slugify(track?.name || '')
            const shareUrl = `${window.location.origin}/${pSlug}/${tSlug}`
            navigator.clipboard.writeText(shareUrl)
            setCopied(true)
            if (onShowToast) onShowToast(`Link copied for "${track?.name || 'track'}"`)
            setTimeout(() => setCopied(false), 2000)
          }}
          sx={{
            p: 0.6,
            borderRadius: 1.5,
            opacity: copied || hovered ? 1 : 0.65,
            color: copied ? 'success.main' : 'inherit',
            transition: 'transform 0.18s ease, opacity 0.18s ease',
            '&:hover': {
              transform: 'scale(1.18)',
              opacity: 1,
              bgcolor: 'rgba(255,255,255,0.12)',
              color: copied ? 'success.main' : 'primary.main',
            },
          }}
        >
          {copied ? <CheckRoundedIcon sx={{ fontSize: 20 }} /> : <ShareRoundedIcon sx={{ fontSize: 19 }} />}
        </IconButton>
      </Stack>
    </Box>
  )
}
