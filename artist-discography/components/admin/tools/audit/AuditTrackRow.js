'use client'

import { memo } from 'react'
import { Box, Typography, Chip, IconButton, TableCell, TableRow, Tooltip } from '@mui/material'
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded'
import StopRoundedIcon from '@mui/icons-material/StopRounded'
import Replay10RoundedIcon from '@mui/icons-material/Replay10Rounded'
import Forward10RoundedIcon from '@mui/icons-material/Forward10Rounded'
import AudioFileIcon from '@mui/icons-material/AudioFile'

export const STANDARD_PLATFORMS = [
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

/**
 * Memoized Platform Icon Link Sub-Component
 */
export const PlatformLinkIcon = memo(function PlatformLinkIcon({
  pKey,
  linkUrl = '',
  iconSize = 22,
}) {
  const hasLink = Boolean(linkUrl && typeof linkUrl === 'string' && linkUrl.trim() !== '')
  const iconPath = `/platforms/${pKey.toLowerCase()}.webp`
  const platformName = pKey.charAt(0).toUpperCase() + pKey.slice(1)

  const tooltipText = hasLink
    ? `${platformName}: Configured (${linkUrl})`
    : `${platformName}: Unconfigured / Missing Link`

  return (
    <IconButton
      size='small'
      component={hasLink ? 'a' : 'div'}
      href={hasLink ? linkUrl : undefined}
      target={hasLink ? '_blank' : undefined}
      rel={hasLink ? 'noopener noreferrer' : undefined}
      disabled={!hasLink}
      title={tooltipText}
      sx={{
        p: 0.5,
        borderRadius: 1.5,
        backgroundColor: hasLink ? 'rgba(46, 125, 50, 0.3)' : 'rgba(211, 47, 47, 0.22)',
        border: hasLink ? '1px solid rgba(76, 175, 80, 0.6)' : '1px solid rgba(244, 67, 54, 0.5)',
        boxShadow: hasLink ? '0 0 6px rgba(76, 175, 80, 0.25)' : 'none',
        opacity: hasLink ? 1 : 0.6,
        transition: 'transform 0.15s ease, background-color 0.15s ease',
        '&:hover': hasLink
          ? {
              backgroundColor: 'rgba(46, 125, 50, 0.5)',
              borderColor: '#4caf50',
              transform: 'scale(1.15)',
            }
          : {
              backgroundColor: 'rgba(211, 47, 47, 0.35)',
            },
      }}
    >
      <Box
        component='img'
        src={iconPath}
        alt={platformName}
        loading='lazy'
        decoding='async'
        onError={(e) => {
          e.target.style.display = 'none'
        }}
        sx={{
          width: iconSize,
          height: iconSize,
          borderRadius: 0.8,
          objectFit: 'contain',
          filter: hasLink ? 'none' : 'grayscale(40%)',
        }}
      />
    </IconButton>
  )
})

/**
 * Memoized Track Row in Catalog Audit view.
 */
export const AuditTrackRow = memo(function AuditTrackRow({
  trk = {},
  tIdx = 0,
  density = {},
  viewDensity = 'cozy',
  isPlaying = false,
  onToggleAudio,
  onSeekRelative,
}) {
  const trkAudio = trk.audioUrl || trk.audio
  const hasAudio = Boolean(trkAudio || trk.hasAudio)
  const trackLinks = trk.links ?? {}
  const customKeys = Object.keys(trackLinks).filter(
    (k) => !STANDARD_PLATFORMS.includes(k.toLowerCase()) && Boolean(trackLinks[k]?.trim()),
  )
  const allAuditKeys = [...STANDARD_PLATFORMS, ...customKeys]
  const iconSize = viewDensity === 'compact' ? 18 : viewDensity === 'cozy' ? 22 : 26

  return (
    <TableRow hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
      <TableCell
        sx={{
          color: 'text.secondary',
          padding: density.tablePadding,
          fontSize: density.tableFontSize,
          width: '1%',
          whiteSpace: 'nowrap',
        }}
      >
        {tIdx + 1}
      </TableCell>

      <TableCell
        sx={{
          fontWeight: 600,
          padding: density.tablePadding,
          fontSize: density.tableFontSize,
          width: '100%',
        }}
      >
        {trk.name || 'Untitled'}
      </TableCell>

      <TableCell
        sx={{
          padding: density.tablePadding,
          width: '1%',
          whiteSpace: 'nowrap',
        }}
      >
        <Chip
          icon={<AudioFileIcon fontSize='small' />}
          label={hasAudio ? 'Audio Available' : 'Missing Audio'}
          color={hasAudio ? 'success' : 'default'}
          variant={hasAudio ? 'filled' : 'outlined'}
          size='small'
          sx={{ height: viewDensity === 'compact' ? 22 : 24, fontSize: '0.72rem', fontWeight: 700 }}
        />
      </TableCell>

      <TableCell
        sx={{
          padding: density.tablePadding,
          width: '1%',
          minWidth: { xs: 340, sm: 390 },
          whiteSpace: 'nowrap',
        }}
      >
        <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'nowrap', alignItems: 'center' }}>
          {allAuditKeys.map((pKey) => (
            <PlatformLinkIcon
              key={pKey}
              pKey={pKey}
              linkUrl={trackLinks[pKey]}
              iconSize={iconSize}
            />
          ))}
        </Box>
      </TableCell>

      {/* Reserved-Width Audio Preview Controls */}
      <TableCell
        align='right'
        sx={{
          padding: density.tablePadding,
          width: 140,
          minWidth: 140,
          maxWidth: 140,
          whiteSpace: 'nowrap',
        }}
      >
        {hasAudio && trkAudio ? (
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
            <Tooltip title='Rewind 10 seconds'>
              <span>
                <IconButton
                  size='small'
                  disabled={!isPlaying}
                  onClick={() => onSeekRelative?.(-10)}
                  sx={{
                    color: isPlaying ? 'text.secondary' : 'action.disabled',
                    p: 0.5,
                  }}
                >
                  <Replay10RoundedIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </span>
            </Tooltip>

            <Tooltip title={isPlaying ? 'Stop Preview' : 'Play Audio'}>
              <IconButton
                size='small'
                color={isPlaying ? 'secondary' : 'primary'}
                onClick={() => onToggleAudio?.(trkAudio)}
                sx={{
                  p: 0.5,
                  backgroundColor: isPlaying ? 'secondary.main' : 'action.hover',
                  color: isPlaying ? '#000' : 'inherit',
                  '&:hover': {
                    backgroundColor: isPlaying ? 'secondary.light' : 'action.selected',
                  },
                }}
              >
                {isPlaying ? (
                  <StopRoundedIcon sx={{ fontSize: 20 }} />
                ) : (
                  <PlayArrowRoundedIcon sx={{ fontSize: 20 }} />
                )}
              </IconButton>
            </Tooltip>

            <Tooltip title='Forward 10 seconds'>
              <span>
                <IconButton
                  size='small'
                  disabled={!isPlaying}
                  onClick={() => onSeekRelative?.(10)}
                  sx={{
                    color: isPlaying ? 'text.secondary' : 'action.disabled',
                    p: 0.5,
                  }}
                >
                  <Forward10RoundedIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        ) : (
          <Typography variant='caption' sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
            No stream
          </Typography>
        )}
      </TableCell>
    </TableRow>
  )
})
