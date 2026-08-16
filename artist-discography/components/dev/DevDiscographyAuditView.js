'use client'

import { useState, memo } from 'react'
import {
  Box,
  Paper,
  Typography,
  Chip,
  Button,
  IconButton,
  Divider,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Stack,
} from '@mui/material'

import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import PauseIcon from '@mui/icons-material/Pause'
import AudioFileIcon from '@mui/icons-material/AudioFile'
import ImageIcon from '@mui/icons-material/Image'
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import ViewComfyIcon from '@mui/icons-material/ViewComfy'
import ViewStreamIcon from '@mui/icons-material/ViewStream'
import ViewHeadlineIcon from '@mui/icons-material/ViewHeadline'
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore'
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess'

import { formatProjectDate } from '../../lib/dateUtils'

const DENSITY_SETTINGS = {
  comfortable: {
    cardPadding: 3,
    headerGap: 2.5,
    coverSize: 56,
    titleVariant: 'h6',
    tablePadding: '12px 16px',
    tableFontSize: '0.9rem',
    chipSize: 'medium',
    spacing: 3,
    label: 'Comfortable',
  },
  cozy: {
    cardPadding: 2,
    headerGap: 2,
    coverSize: 44,
    titleVariant: 'subtitle1',
    tablePadding: '8px 12px',
    tableFontSize: '0.85rem',
    chipSize: 'small',
    spacing: 2,
    label: 'Cozy',
  },
  compact: {
    cardPadding: 1.2,
    headerGap: 1.5,
    coverSize: 34,
    titleVariant: 'body1',
    tablePadding: '4px 8px',
    tableFontSize: '0.78rem',
    chipSize: 'small',
    spacing: 1.2,
    label: 'Compact',
  },
}

function DevDiscographyAuditView({
  projects = [],
  artistName = '',
  health = {},
  mounted = false,
  playingAudioUrl = null,
  handleToggleAudio = () => {},
}) {
  const [viewDensity, setViewDensity] = useState('cozy')
  // Track open state for each project index (default to all expanded)
  const [expandedProjects, setExpandedProjects] = useState({})

  const density = DENSITY_SETTINGS[viewDensity] || DENSITY_SETTINGS.cozy

  const handleAccordionToggle = (idx) => {
    setExpandedProjects((prev) => {
      const isCurrentlyExpanded = prev[idx] !== false
      return {
        ...prev,
        [idx]: !isCurrentlyExpanded,
      }
    })
  }

  const handleExpandAll = () => {
    const allOpen = {}
    projects.forEach((_, idx) => {
      allOpen[idx] = true
    })
    setExpandedProjects(allOpen)
  }

  const handleCollapseAll = () => {
    const allClosed = {}
    projects.forEach((_, idx) => {
      allClosed[idx] = false
    })
    setExpandedProjects(allClosed)
  }

  return (
    <Stack spacing={density.spacing}>
      {/* Top Header & View Controls Bar */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
          p: density.cardPadding,
          backgroundColor: 'rgba(26, 26, 38, 0.75)',
          borderRadius: 2.5,
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Projects & Tracks Media Audit ({projects.length} Releases)
          </Typography>
          <Chip
            icon={mounted && health?.isHealthy ? <CheckCircleOutlineRoundedIcon /> : undefined}
            label={health?.isHealthy ? 'JSON File: Valid' : 'Health Warnings'}
            color={health?.isHealthy ? 'success' : 'warning'}
            variant="outlined"
            size="small"
            sx={{ fontWeight: 700 }}
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          {/* Expand / Collapse All Controls */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<UnfoldMoreIcon />}
              onClick={handleExpandAll}
              sx={{ borderRadius: 2, textTransform: 'none', fontSize: '0.8rem' }}
            >
              Expand All
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<UnfoldLessIcon />}
              onClick={handleCollapseAll}
              sx={{ borderRadius: 2, textTransform: 'none', fontSize: '0.8rem' }}
            >
              Collapse All
            </Button>
          </Box>

          {/* Density Switcher Buttons */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
              Layout Density:
            </Typography>
            <ToggleButtonGroup
              value={viewDensity}
              exclusive
              onChange={(_, newDensity) => {
                if (newDensity) setViewDensity(newDensity)
              }}
              size="small"
              aria-label="layout view density"
              sx={{
                backgroundColor: 'rgba(0,0,0,0.3)',
                borderRadius: 2,
                '& .MuiToggleButton-root': {
                  px: 1.5,
                  py: 0.5,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.78rem',
                  color: 'text.secondary',
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText',
                    fontWeight: 800,
                    '&:hover': { backgroundColor: 'primary.dark' },
                  },
                },
              }}
            >
              <ToggleButton value="comfortable" aria-label="comfortable layout">
                <Tooltip title="Generous spacing & larger thumbnails">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <ViewComfyIcon fontSize="small" />
                    Comfortable
                  </Box>
                </Tooltip>
              </ToggleButton>

              <ToggleButton value="cozy" aria-label="cozy layout">
                <Tooltip title="Balanced, standard spacing">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <ViewStreamIcon fontSize="small" />
                    Cozy
                  </Box>
                </Tooltip>
              </ToggleButton>

              <ToggleButton value="compact" aria-label="compact layout">
                <Tooltip title="Space-saving dense layout">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <ViewHeadlineIcon fontSize="small" />
                    Compact
                  </Box>
                </Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>
      </Box>

      {/* Projects List Accordion Cards */}
      {projects.length === 0 ? (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          No projects found in artist-data.json.
        </Alert>
      ) : (
        projects.map((proj, idx) => {
          const projName = proj.name || 'Untitled Project'
          const projType = proj.type || 'Project'
          const projDate = proj.date ? formatProjectDate(proj.date) : 'Date Unset'
          const trks = proj.tracks ?? []
          const hasCover = Boolean(proj.cover || proj.hasCover)
          const isExpanded = expandedProjects[idx] !== false

          // Count track audio coverage
          const audioCount = trks.filter((t) => Boolean(t.audioUrl || t.hasAudio || t.audio)).length

          return (
            <Accordion
              key={idx}
              expanded={isExpanded}
              onChange={() => handleAccordionToggle(idx)}
              slotProps={{ transition: { unmountOnExit: true } }}
              sx={{
                backgroundColor: 'rgba(22, 22, 32, 0.75)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px !important',
                overflow: 'hidden',
                '&:before': { display: 'none' },
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  borderColor: 'rgba(255, 255, 255, 0.18)',
                },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  px: density.cardPadding,
                  py: viewDensity === 'compact' ? 0.8 : 1.5,
                  minHeight: viewDensity === 'compact' ? 48 : 64,
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.02)' },
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: density.headerGap }}>
                  {/* Left: Thumbnail & Project Meta */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {hasCover && proj.cover ? (
                      <Box
                        component="img"
                        src={proj.cover}
                        alt={projName}
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
                        <ImageIcon color="action" fontSize={viewDensity === 'compact' ? 'small' : 'medium'} />
                      </Box>
                    )}

                    <Box>
                      <Typography variant={density.titleVariant} sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                        {projName}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: viewDensity === 'compact' ? '0.72rem' : '0.78rem' }}>
                        By {proj.artist || artistName} • Released {projDate}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Right: Badges */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label={projType} color="info" size={density.chipSize} sx={{ fontWeight: 700 }} />
                    <Chip
                      icon={hasCover ? <ImageIcon fontSize="small" /> : undefined}
                      label={hasCover ? 'Cover OK' : 'No Cover'}
                      color={hasCover ? 'success' : 'error'}
                      variant="outlined"
                      size={density.chipSize}
                    />
                    <Chip
                      label={`${trks.length} Tracks (${audioCount} Audio)`}
                      variant="outlined"
                      size={density.chipSize}
                      sx={{ color: 'text.secondary', fontWeight: 600 }}
                    />
                  </Box>
                </Box>
              </AccordionSummary>

              <AccordionDetails sx={{ px: density.cardPadding, pb: density.cardPadding, pt: 1 }}>
                <Divider sx={{ mb: 2 }} />

                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, fontSize: viewDensity === 'compact' ? '0.8rem' : '0.9rem' }}>
                  Tracklisting ({trks.length})
                </Typography>

                <TableContainer component={Paper} variant="outlined" sx={{ backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 2 }}>
                  <Table size={viewDensity === 'compact' ? 'small' : 'medium'}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, padding: density.tablePadding, fontSize: density.tableFontSize, width: '1%', whiteSpace: 'nowrap' }}>#</TableCell>
                        <TableCell sx={{ fontWeight: 700, padding: density.tablePadding, fontSize: density.tableFontSize, width: '100%' }}>Track Title</TableCell>
                        <TableCell sx={{ fontWeight: 700, padding: density.tablePadding, fontSize: density.tableFontSize, width: '1%', whiteSpace: 'nowrap' }}>Audio File Status</TableCell>
                        <TableCell sx={{ fontWeight: 700, padding: density.tablePadding, fontSize: density.tableFontSize, width: '1%', minWidth: { xs: 340, sm: 390 }, whiteSpace: 'nowrap' }}>Streaming Links</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, padding: density.tablePadding, fontSize: density.tableFontSize, width: '1%', whiteSpace: 'nowrap' }}>Preview</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {trks.map((trk, tIdx) => {
                        const trkAudio = trk.audioUrl || trk.audio
                        const hasAudio = Boolean(trkAudio || trk.hasAudio)
                        const activeLinks = Object.entries(trk.links ?? {}).filter(
                          ([_, u]) => u && typeof u === 'string' && u.trim() !== ''
                        )

                        return (
                          <TableRow key={tIdx} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                            <TableCell sx={{ color: 'text.secondary', padding: density.tablePadding, fontSize: density.tableFontSize, width: '1%', whiteSpace: 'nowrap' }}>
                              {tIdx + 1}
                            </TableCell>

                            <TableCell sx={{ fontWeight: 600, padding: density.tablePadding, fontSize: density.tableFontSize, width: '100%' }}>
                              {trk.name || 'Untitled'}
                            </TableCell>

                            <TableCell sx={{ padding: density.tablePadding, width: '1%', whiteSpace: 'nowrap' }}>
                              <Chip
                                icon={<AudioFileIcon fontSize="small" />}
                                label={hasAudio ? 'Audio Available' : 'Missing Audio'}
                                color={hasAudio ? 'success' : 'default'}
                                variant={hasAudio ? 'filled' : 'outlined'}
                                size="small"
                                sx={{ height: viewDensity === 'compact' ? 22 : 24, fontSize: '0.72rem' }}
                              />
                            </TableCell>

                            <TableCell sx={{ padding: density.tablePadding, width: '1%', minWidth: { xs: 340, sm: 390 }, whiteSpace: 'nowrap' }}>
                              <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'nowrap', alignItems: 'center' }}>
                                {(() => {
                                  const trackLinks = trk.links ?? {}
                                  const standardKeys = [
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
                                  const customKeys = Object.keys(trackLinks).filter(
                                    (k) => !standardKeys.includes(k.toLowerCase()) && Boolean(trackLinks[k]?.trim())
                                  )
                                  const allAuditKeys = [...standardKeys, ...customKeys]

                                  return allAuditKeys.map((pKey) => {
                                    const linkUrl = trackLinks[pKey] || ''
                                    const hasLink = Boolean(linkUrl && typeof linkUrl === 'string' && linkUrl.trim() !== '')
                                    const iconPath = `/platforms/${pKey.toLowerCase()}.webp`
                                    const iconSize = viewDensity === 'compact' ? 18 : viewDensity === 'cozy' ? 22 : 26
                                    const platformName = pKey.charAt(0).toUpperCase() + pKey.slice(1)

                                    const tooltipText = hasLink
                                      ? `${platformName}: Configured (${linkUrl})`
                                      : `${platformName}: Unconfigured / Missing Link`

                                    return (
                                      <IconButton
                                        key={pKey}
                                        size="small"
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
                                          transition: 'all 0.15s ease-in-out',
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
                                          component="img"
                                          src={iconPath}
                                          alt={platformName}
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
                                })()}
                              </Box>
                            </TableCell>

                            <TableCell align="right" sx={{ padding: density.tablePadding, width: '1%', whiteSpace: 'nowrap' }}>
                              {hasAudio && trkAudio ? (
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => handleToggleAudio(trkAudio)}
                                >
                                  {playingAudioUrl === trkAudio ? <PauseIcon fontSize="small" /> : <PlayArrowIcon fontSize="small" />}
                                </IconButton>
                              ) : (
                                <Typography variant="caption" sx={{ color: 'text.disabled' }}>-</Typography>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </AccordionDetails>
            </Accordion>
          )
        })
      )}
    </Stack>
  )
}

export default memo(DevDiscographyAuditView)
