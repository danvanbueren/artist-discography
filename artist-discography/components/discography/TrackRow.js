'use client'

import { memo, useState } from 'react'
import { Box, Stack, Typography, IconButton } from '@mui/material'
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded'
import PauseRoundedIcon from '@mui/icons-material/PauseRounded'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import QueueMusicRoundedIcon from '@mui/icons-material/QueueMusicRounded'
import ShareRoundedIcon from '@mui/icons-material/ShareRounded'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import SubduedText from '@/components/ui/SubduedText'
import { slugify } from '@/lib/data/slugs'
import { useTouchDevice } from '@/lib/hooks/useTouchDevice'

const TRACK_PLATFORM_ICONS = {
  spotify: '/platforms/spotify.webp',
  apple: '/platforms/apple.webp',
  youtube: '/platforms/youtube.webp',
  soundcloud: '/platforms/soundcloud.webp',
  bandcamp: '/platforms/bandcamp.webp',
  deezer: '/platforms/deezer.webp',
  tidal: '/platforms/tidal.webp',
  pandora: '/platforms/pandora.webp',
  amazon: '/platforms/amazon.webp',
  itunes: '/platforms/itunes.webp',
}

const POPULAR_PLATFORM_FALLBACKS = [
  'youtube',
  'soundcloud',
  'spotify',
  'apple',
  'bandcamp',
  'tidal',
  'deezer',
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

const TrackRow = memo(function TrackRow({
  track,
  index,
  project,
  projectArtist,
  onPlayTrack,
  onAddToQueue,
  onShowToast,
  isPlayingThisTrack,
  isPlaying = false,
  isPlayerActive = false,
  isHighlighted,
  onSelectTrack,
  onSelectTrackRow,
  onSelectTrackTitle,
  selectedPlatform,
}) {
  const [copied, setCopied] = useState(false)
  const isTouch = useTouchDevice()

  const name = track?.name ?? ''
  const artist = track?.artist || projectArtist || ''
  const links = track?.links ?? {}

  const resolvedLink = getResolvedTrackLink(links, selectedPlatform)

  const handleTitleClick = (e) => {
    e.stopPropagation()
    if (isTouch) {
      if (track?.hasAudio) {
        if (onPlayTrack) {
          onPlayTrack(track, project, { touchMode: true })
        }
      } else {
        if (onSelectTrackTitle) {
          onSelectTrackTitle(track, project)
        } else if (onSelectTrack) {
          onSelectTrack(track, project)
        }
      }
    } else {
      if (onSelectTrackTitle) {
        onSelectTrackTitle(track, project)
      } else if (onSelectTrack) {
        onSelectTrack(track, project)
      }
    }
  }

  const handleRowClick = () => {
    if (isTouch) {
      if (track?.hasAudio) {
        if (onPlayTrack) {
          onPlayTrack(track, project, { touchMode: true })
        }
      } else {
        if (onSelectTrackRow) {
          onSelectTrackRow(track, project)
        } else if (onSelectTrack) {
          onSelectTrack(track, project)
        }
      }
    } else {
      if (onSelectTrackRow) {
        onSelectTrackRow(track, project)
      } else if (onSelectTrack) {
        onSelectTrack(track, project)
      }
    }
  }

  const isActivelyPlaying = isPlaying && isPlayingThisTrack
  const alwaysShowPlayButton = isPlayingThisTrack || isTouch
  const rowHighlightBg = isHighlighted
    ? 'rgba(144, 202, 249, 0.14)'
    : isPlayingThisTrack
      ? 'rgba(144, 202, 249, 0.08)'
      : 'transparent'

  return (
    <Box
      onClick={handleRowClick}
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'auto 1fr auto', sm: 'auto 1fr auto' },
        alignItems: 'center',
        py: 1.5,
        px: { xs: 1.5, sm: 2 },
        borderRadius: 2,
        cursor:
          (isTouch && track?.hasAudio) || onSelectTrackRow || onSelectTrack ? 'pointer' : 'default',
        bgcolor: rowHighlightBg,
        borderLeft: isHighlighted ? '3px solid' : '3px solid transparent',
        borderColor: isHighlighted ? 'primary.main' : 'transparent',
        transition: 'background-color 0.2s ease, border-color 0.2s ease',
        '& .track-hover-play': {
          display: 'none',
        },
        '& .track-row-action': {
          opacity: 0.65,
        },
        '& .track-row-link-action': {
          opacity: 0.8,
        },
        '&:hover': {
          bgcolor:
            rowHighlightBg === 'transparent' ? 'action.hover' : rowHighlightBg,
          '& .track-hover-play': {
            display: 'inline-flex',
          },
          '& .track-index-num': {
            display: 'none',
          },
          '& .track-row-action': {
            opacity: 1,
          },
          '& .track-row-link-action': {
            opacity: 1,
          },
        },
      }}
    >
      {/* Col 1: Track Number / Play Indicator & Queue Button */}
      <Stack direction='row' spacing={0.25} sx={{ alignItems: 'center' }}>
        <Box sx={{ width: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {track?.hasAudio && isActivelyPlaying ? (
            <IconButton
              size='small'
              color='primary'
              onClick={(e) => {
                e.stopPropagation()
                if (isTouch) {
                  if (onPlayTrack) onPlayTrack(track, project, { touchMode: true })
                } else {
                  if (onPlayTrack) onPlayTrack(track, project)
                }
              }}
              sx={{
                p: 0.85,
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
          ) : track?.hasAudio ? (
            <>
              <IconButton
                size='small'
                color={isPlayingThisTrack ? 'primary' : 'default'}
                className={alwaysShowPlayButton ? undefined : 'track-hover-play'}
                onClick={(e) => {
                  e.stopPropagation()
                  if (isTouch) {
                    if (onPlayTrack) onPlayTrack(track, project, { touchMode: true })
                  } else {
                    if (onPlayTrack) onPlayTrack(track, project)
                  }
                }}
                sx={{
                  p: 0.85,
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
              {!alwaysShowPlayButton && (
                <Typography
                  variant='body2'
                  className='track-index-num'
                  sx={{
                    fontWeight: isHighlighted ? 700 : 500,
                    color: isHighlighted ? 'primary.main' : 'text.secondary',
                    fontSize: '0.9rem',
                    opacity: 1,
                  }}
                >
                  {index + 1}
                </Typography>
              )}
            </>
          ) : (
            <Typography
              variant='body2'
              sx={{
                fontWeight: isHighlighted ? 700 : 500,
                color: isHighlighted ? 'primary.main' : 'text.secondary',
                fontSize: '0.9rem',
                opacity: 0.6,
              }}
            >
              {index + 1}
            </Typography>
          )}
        </Box>

        {/* Add to Queue Button (Only rendered if track has audio AND audio player is active) */}
        {track?.hasAudio && isPlayerActive && (
          <IconButton
            size='small'
            className='track-row-action'
            onClick={(e) => {
              e.stopPropagation()
              if (onAddToQueue) onAddToQueue(track, project)
            }}
            sx={{
              p: 0.85,
              borderRadius: 1.5,
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
        )}
      </Stack>

      {/* Col 2: Track Name & Artist Stack (Only part that navigates to project/track page) */}
      <Stack
        spacing={0.25}
        onClick={handleTitleClick}
        sx={{
          minWidth: 0,
          px: 1,
          cursor: onSelectTrackTitle || onSelectTrack ? 'pointer' : 'default',
          width: 'fit-content',
          maxWidth: '100%',
          borderRadius: 1,
          '&:hover':
            onSelectTrackTitle || onSelectTrack
              ? {
                  opacity: 0.9,
                }
              : {},
        }}
      >
        <SubduedText
          value={name}
          placeholder='Untitled Track'
          variant='body1'
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
          placeholder='Artist'
          variant='caption'
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
      <Stack direction='row' spacing={0.5} sx={{ alignItems: 'center' }}>
        <IconButton
          component={resolvedLink ? 'a' : 'button'}
          href={resolvedLink?.url || undefined}
          target={resolvedLink ? '_blank' : undefined}
          rel={resolvedLink ? 'noopener noreferrer' : undefined}
          disabled={!resolvedLink}
          size='small'
          className={resolvedLink ? 'track-row-link-action' : undefined}
          onClick={(e) => e.stopPropagation()}
          sx={{
            p: 0.85,
            px: resolvedLink?.icon ? 1 : 0.85,
            borderRadius: 1.5,
            border: resolvedLink ? '1px solid' : '1px solid transparent',
            borderColor: resolvedLink ? 'rgba(255,255,255,0.12)' : 'transparent',
            bgcolor: 'transparent',
            ...(resolvedLink ? {} : { opacity: 0.3 }),
            transition:
              'transform 0.18s ease, opacity 0.18s ease, background-color 0.18s ease, border-color 0.18s ease',
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
          <Stack direction='row' spacing={0.5} sx={{ alignItems: 'center' }}>
            {resolvedLink?.icon && (
              <Box
                component='img'
                src={resolvedLink.icon}
                alt={resolvedLink.key}
                draggable={false}
                loading='eager'
                decoding='async'
                sx={{ width: 18, height: 18, objectFit: 'contain', borderRadius: 1 }}
              />
            )}
            <OpenInNewIcon sx={{ fontSize: 16 }} />
          </Stack>
        </IconButton>

        {/* Share Track Link Button */}
        <IconButton
          size='small'
          className={copied ? undefined : 'track-row-action'}
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
            p: 0.85,
            borderRadius: 1.5,
            ...(copied ? { opacity: 1 } : {}),
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
          {copied ? (
            <CheckRoundedIcon sx={{ fontSize: 20 }} />
          ) : (
            <ShareRoundedIcon sx={{ fontSize: 19 }} />
          )}
        </IconButton>
      </Stack>
    </Box>
  )
})

export default TrackRow
