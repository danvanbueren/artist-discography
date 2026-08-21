'use client'

import { memo } from 'react'
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  Tooltip,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded'
import StopRoundedIcon from '@mui/icons-material/StopRounded'
import Replay10RoundedIcon from '@mui/icons-material/Replay10Rounded'
import Forward10RoundedIcon from '@mui/icons-material/Forward10Rounded'
import AudioFileIcon from '@mui/icons-material/AudioFile'
import ImageIcon from '@mui/icons-material/Image'
import { formatProjectDate } from '../../../lib/dateUtils'
import { getMediaThumbnailUrl } from '../../admin/adminUtils'

const STANDARD_PLATFORMS = [
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

// ----------------------------------------------------
// Memoized Platform Icon Link Sub-Component
// ----------------------------------------------------
const PlatformLinkIcon = memo(function PlatformLinkIcon({ pKey, linkUrl = '', iconSize = 22 }) {
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

// ----------------------------------------------------
// Memoized Tracklisting Row Sub-Component
// ----------------------------------------------------
const AuditTrackRow = memo(function AuditTrackRow({
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

      {/* Reserved-Width Zero-Shift Audio Preview Controls */}
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
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 0.5,
              width: '100%',
            }}
          >
            {/* Skip Behind (-10s) */}
            <Tooltip title='Skip back 10s' arrow>
              <span>
                <IconButton
                  size='small'
                  disabled={!isPlaying}
                  onClick={() => onSeekRelative?.(-10)}
                  aria-label='Skip back 10 seconds'
                  sx={{
                    p: 0.5,
                    visibility: isPlaying ? 'visible' : 'hidden',
                    color: 'text.secondary',
                    '&:hover': { color: 'primary.main' },
                  }}
                >
                  <Replay10RoundedIcon sx={{ fontSize: 20 }} />
                </IconButton>
              </span>
            </Tooltip>

            {/* Play / Stop Button */}
            <Tooltip title={isPlaying ? 'Stop playback (restart)' : 'Preview track audio'} arrow>
              <IconButton
                size='small'
                color={isPlaying ? 'error' : 'primary'}
                onClick={() => onToggleAudio?.(trkAudio)}
                aria-label={isPlaying ? 'Stop audio' : 'Play audio'}
                sx={{
                  p: 0.5,
                  backgroundColor: isPlaying
                    ? 'rgba(244, 67, 54, 0.15)'
                    : 'rgba(144, 202, 249, 0.1)',
                  border: '1px solid',
                  borderColor: isPlaying ? 'rgba(244, 67, 54, 0.4)' : 'rgba(144, 202, 249, 0.25)',
                  '&:hover': {
                    backgroundColor: isPlaying
                      ? 'rgba(244, 67, 54, 0.25)'
                      : 'rgba(144, 202, 249, 0.2)',
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

            {/* Skip Ahead (+10s) */}
            <Tooltip title='Skip forward 10s' arrow>
              <span>
                <IconButton
                  size='small'
                  disabled={!isPlaying}
                  onClick={() => onSeekRelative?.(10)}
                  aria-label='Skip forward 10 seconds'
                  sx={{
                    p: 0.5,
                    visibility: isPlaying ? 'visible' : 'hidden',
                    color: 'text.secondary',
                    '&:hover': { color: 'primary.main' },
                  }}
                >
                  <Forward10RoundedIcon sx={{ fontSize: 20 }} />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        ) : (
          <Typography variant='caption' sx={{ color: 'text.disabled' }}>
            -
          </Typography>
        )}
      </TableCell>
    </TableRow>
  )
})

// ----------------------------------------------------
// Main Project Audit Accordion Card Component
// ----------------------------------------------------
const ProjectAuditAccordion = memo(function ProjectAuditAccordion({
  proj = {},
  idx = 0,
  artistName = '',
  isExpanded = false,
  onToggle,
  density = {},
  viewDensity = 'cozy',
  playingAudioUrl = null,
  handleToggleAudio,
  handleSeekRelative,
}) {
  const projName = proj.name || 'Untitled Project'
  const projType = proj.type || 'Project'
  const projDate = proj.date ? formatProjectDate(proj.date) : 'Date Unset'
  const trks = proj.tracks ?? []
  const hasCover = Boolean(proj.cover || proj.hasCover)

  // Count track audio coverage & determine health color (Red = 0 audio, Yellow = partial audio, Green = all audio)
  const audioCount = trks.filter((t) => Boolean(t.audioUrl || t.hasAudio || t.audio)).length
  const audioHealthColor =
    audioCount === 0
      ? 'error'
      : trks.length > 0 && audioCount === trks.length
        ? 'success'
        : 'warning'

  return (
    <Accordion
      expanded={isExpanded}
      onChange={() => onToggle?.(idx)}
      slotProps={{ transition: { timeout: 150, unmountOnExit: true } }}
      sx={{
        backgroundColor: 'rgba(22, 22, 32, 0.75)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '12px !important',
        overflow: 'hidden',
        '&:before': { display: 'none' },
        transition: 'border-color 0.15s ease, background-color 0.15s ease',
        '&:hover': {
          borderColor: 'rgba(255, 255, 255, 0.18)',
        },
        contentVisibility: 'auto',
        containIntrinsicSize: 'auto 72px',
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          px: density.cardPadding,
          py: viewDensity === 'compact' ? 0.8 : 1.5,
          minHeight: viewDensity === 'compact' ? 48 : 64,
          '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.02)' },
          '& .MuiAccordionSummary-expandIconWrapper': {
            ml: 1.5,
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            flexWrap: 'wrap',
            gap: density.headerGap,
          }}
        >
          {/* Left: Thumbnail & Project Meta */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              flex: '1 1 auto',
              minWidth: { xs: '100%', md: 240 },
            }}
          >
            {hasCover && proj.cover ? (
              <Box
                component='img'
                src={getMediaThumbnailUrl(proj.cover, density.coverSize * 2 || 120, 75)}
                alt={projName}
                loading='lazy'
                decoding='async'
                sx={{
                  width: density.coverSize,
                  height: density.coverSize,
                  borderRadius: 1.5,
                  objectFit: 'cover',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              />
            ) : (
              <Box
                sx={{
                  width: density.coverSize,
                  height: density.coverSize,
                  borderRadius: 1.5,
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ImageIcon
                  color='action'
                  fontSize={viewDensity === 'compact' ? 'small' : 'medium'}
                />
              </Box>
            )}

            <Box>
              <Typography variant={density.titleVariant} sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                {projName}
              </Typography>
              <Typography
                variant='caption'
                sx={{
                  color: 'text.secondary',
                  fontSize: viewDensity === 'compact' ? '0.72rem' : '0.78rem',
                }}
              >
                By {proj.artist || artistName} • Released {projDate}
              </Typography>
            </Box>
          </Box>

          {/* Right: Badges aligned in neat columns with natural compact pill sizing */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(auto-fit, minmax(75px, auto))',
                sm: '84px 92px 106px',
              },
              alignItems: 'center',
              justifyItems: 'center',
              gap: { xs: 1, sm: 1.5 },
              mr: { xs: 1, sm: 2 },
              flexShrink: 0,
            }}
          >
            <Chip
              label={projType}
              color='info'
              size={density.chipSize}
              sx={{
                fontWeight: 700,
                width: { xs: 'auto', sm: 84 },
                justifyContent: 'center',
              }}
            />
            <Chip
              label={hasCover ? 'Cover OK' : 'No Cover'}
              color={hasCover ? 'success' : 'error'}
              variant='outlined'
              size={density.chipSize}
              sx={{
                fontWeight: 700,
                width: { xs: 'auto', sm: 92 },
                justifyContent: 'center',
              }}
            />
            <Chip
              label={`${audioCount}/${trks.length} Audio`}
              color={audioHealthColor}
              variant='outlined'
              size={density.chipSize}
              sx={{
                fontWeight: 700,
                width: { xs: 'auto', sm: 106 },
                justifyContent: 'center',
              }}
            />
          </Box>
        </Box>
      </AccordionSummary>

      <AccordionDetails sx={{ px: density.cardPadding, pb: density.cardPadding, pt: 1 }}>
        <Divider sx={{ mb: 2 }} />

        <Typography
          variant='subtitle2'
          sx={{
            fontWeight: 700,
            mb: 1.5,
            fontSize: viewDensity === 'compact' ? '0.8rem' : '0.9rem',
          }}
        >
          Tracklisting ({trks.length})
        </Typography>

        <TableContainer
          component={Paper}
          variant='outlined'
          sx={{ backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 2 }}
        >
          <Table size={viewDensity === 'compact' ? 'small' : 'medium'}>
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    fontWeight: 700,
                    padding: density.tablePadding,
                    fontSize: density.tableFontSize,
                    width: '1%',
                    whiteSpace: 'nowrap',
                  }}
                >
                  #
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 700,
                    padding: density.tablePadding,
                    fontSize: density.tableFontSize,
                    width: '100%',
                  }}
                >
                  Track Title
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 700,
                    padding: density.tablePadding,
                    fontSize: density.tableFontSize,
                    width: '1%',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Audio File Status
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 700,
                    padding: density.tablePadding,
                    fontSize: density.tableFontSize,
                    width: '1%',
                    minWidth: { xs: 340, sm: 390 },
                    whiteSpace: 'nowrap',
                  }}
                >
                  Streaming Links
                </TableCell>
                <TableCell
                  align='right'
                  sx={{
                    fontWeight: 700,
                    padding: density.tablePadding,
                    fontSize: density.tableFontSize,
                    width: 140,
                    minWidth: 140,
                    maxWidth: 140,
                    whiteSpace: 'nowrap',
                  }}
                >
                  Preview
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {trks.map((trk, tIdx) => {
                const trkAudio = trk.audioUrl || trk.audio
                const isPlaying = Boolean(
                  playingAudioUrl && trkAudio && playingAudioUrl === trkAudio,
                )

                return (
                  <AuditTrackRow
                    key={trk.id || tIdx}
                    trk={trk}
                    tIdx={tIdx}
                    density={density}
                    viewDensity={viewDensity}
                    isPlaying={isPlaying}
                    onToggleAudio={handleToggleAudio}
                    onSeekRelative={handleSeekRelative}
                  />
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </AccordionDetails>
    </Accordion>
  )
})

export default ProjectAuditAccordion
