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
import EditIcon from '@mui/icons-material/Edit'
import AddIcon from '@mui/icons-material/Add'
import ImageIcon from '@mui/icons-material/Image'
import { formatProjectDate } from '@/lib/data/dateUtils'
import { getMediaThumbnailUrl } from '@/components/admin/adminUtils'
import { AuditTrackRow, PlatformLinkIcon, STANDARD_PLATFORMS } from './AuditTrackRow'

/**
 * ProjectAuditAccordion
 * Expandable project release health accordion detailing artwork presence,
 * project-level streaming links, track audio availability, and per-track links.
 */
const ProjectAuditAccordion = memo(function ProjectAuditAccordion({
  project = {},
  pIdx = 0,
  isExpanded = false,
  onToggleExpand,
  onSelectProject,
  onAddTrackToProject,
  density = {},
  viewDensity = 'cozy',
  playingTrackUrl = null,
  onToggleAudio,
  onSeekRelative,
}) {
  const tracks = project.tracks ?? []
  const hasCover = Boolean(project.cover || project.hasCover)
  const tracksWithAudio = tracks.filter((t) => Boolean(t.audioUrl || t.audio || t.hasAudio)).length
  const allTracksHaveAudio = tracks.length > 0 && tracksWithAudio === tracks.length

  const projectLinks = project.links ?? {}
  const customProjectKeys = Object.keys(projectLinks).filter(
    (k) => !STANDARD_PLATFORMS.includes(k.toLowerCase()) && Boolean(projectLinks[k]?.trim()),
  )
  const allProjectAuditKeys = [...STANDARD_PLATFORMS, ...customProjectKeys]
  const iconSize = viewDensity === 'compact' ? 18 : viewDensity === 'cozy' ? 22 : 26

  return (
    <Accordion
      expanded={isExpanded}
      onChange={() => onToggleExpand?.(pIdx)}
      sx={{
        borderRadius: '12px !important',
        mb: 2,
        backgroundColor: 'rgba(28, 28, 38, 0.6)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        '&:before': { display: 'none' },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          py: density.py,
          px: { xs: 1.5, sm: 2.5 },
          '& .MuiAccordionSummary-content': { my: 0.5 },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            flexWrap: 'wrap',
            gap: 1.5,
            pr: 1,
          }}
        >
          {/* Project Cover & Basic Info */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                aspectRatio: '1 / 1',
                borderRadius: 2,
                overflow: 'hidden',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {project.cover ? (
                <Box
                  component='img'
                  src={getMediaThumbnailUrl(project.cover, 80)}
                  alt={project.name || 'Cover'}
                  sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <ImageIcon sx={{ color: 'text.disabled', fontSize: 24 }} />
              )}
            </Box>

            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant='subtitle1'
                sx={{
                  fontWeight: 700,
                  fontSize: density.titleSize,
                  lineHeight: 1.2,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {project.name || 'Untitled Project'}
              </Typography>
              <Typography
                variant='caption'
                sx={{ color: 'text.secondary', display: 'block', mt: 0.25 }}
              >
                {project.type || 'Single'} • {formatProjectDate(project.date)} • {tracks.length}{' '}
                track
                {tracks.length === 1 ? '' : 's'}
              </Typography>
            </Box>
          </Box>

          {/* Checklist Badges & Action Buttons */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              flexWrap: 'wrap',
              ml: { xs: 0, sm: 'auto' },
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Chip
              label={hasCover ? 'Artwork Ready' : 'Missing Artwork'}
              color={hasCover ? 'success' : 'error'}
              size='small'
              sx={{ fontWeight: 700, fontSize: '0.72rem' }}
            />
            <Chip
              label={
                allTracksHaveAudio
                  ? 'All Audio Ready'
                  : `${tracksWithAudio}/${tracks.length} Audio Ready`
              }
              color={allTracksHaveAudio ? 'success' : tracksWithAudio > 0 ? 'warning' : 'error'}
              size='small'
              sx={{ fontWeight: 700, fontSize: '0.72rem' }}
            />

            <Tooltip title='Edit Project in Projects Tab'>
              <IconButton
                size='small'
                onClick={() => onSelectProject?.(pIdx)}
                sx={{
                  color: 'primary.main',
                  backgroundColor: 'rgba(144, 202, 249, 0.1)',
                  '&:hover': { backgroundColor: 'rgba(144, 202, 249, 0.2)' },
                }}
              >
                <EditIcon fontSize='small' />
              </IconButton>
            </Tooltip>

            <Tooltip title='Add Track to this Project'>
              <IconButton
                size='small'
                onClick={() => onAddTrackToProject?.(pIdx)}
                sx={{
                  color: 'secondary.main',
                  backgroundColor: 'rgba(244, 143, 177, 0.1)',
                  '&:hover': { backgroundColor: 'rgba(244, 143, 177, 0.2)' },
                }}
              >
                <AddIcon fontSize='small' />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </AccordionSummary>

      <AccordionDetails sx={{ px: { xs: 1.5, sm: 3 }, pb: 3, pt: 0 }}>
        <Divider sx={{ my: 1.5, borderColor: 'rgba(255, 255, 255, 0.08)' }} />

        {/* Project-Level External Streaming Links */}
        <Box sx={{ mb: 2.5 }}>
          <Typography
            variant='caption'
            sx={{ color: 'text.secondary', fontWeight: 700, display: 'block', mb: 1 }}
          >
            PROJECT-LEVEL STREAMING LINKS:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            {allProjectAuditKeys.map((pKey) => (
              <PlatformLinkIcon
                key={pKey}
                pKey={pKey}
                linkUrl={projectLinks[pKey]}
                iconSize={iconSize}
              />
            ))}
          </Box>
        </Box>

        {/* Tracklisting Table */}
        <Typography
          variant='caption'
          sx={{ color: 'text.secondary', fontWeight: 700, display: 'block', mb: 1 }}
        >
          TRACKLISTING AUDIT ({tracks.length} TRACKS):
        </Typography>

        <TableContainer
          component={Paper}
          variant='outlined'
          sx={{
            borderRadius: 2,
            backgroundColor: 'rgba(15, 15, 22, 0.6)',
            borderColor: 'rgba(255, 255, 255, 0.08)',
          }}
        >
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 700, width: '1%' }}>
                  #
                </TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>Title</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 700, width: '1%' }}>
                  Audio
                </TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>
                  Platform Links
                </TableCell>
                <TableCell
                  align='right'
                  sx={{ color: 'text.secondary', fontWeight: 700, width: 140 }}
                >
                  Preview
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tracks.map((trk, tIdx) => {
                const trkAudio = trk.audioUrl || trk.audio
                const isPlaying = Boolean(
                  playingTrackUrl && trkAudio && playingTrackUrl === trkAudio,
                )

                return (
                  <AuditTrackRow
                    key={trk.id || tIdx}
                    trk={trk}
                    tIdx={tIdx}
                    density={density}
                    viewDensity={viewDensity}
                    isPlaying={isPlaying}
                    onToggleAudio={onToggleAudio}
                    onSeekRelative={onSeekRelative}
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
