'use client'

import { memo } from 'react'
import { Box, Typography, Chip, ListItemButton, ListItemIcon, ListItemText } from '@mui/material'
import AlbumIcon from '@mui/icons-material/Album'
import { getMediaThumbnailUrl } from '../adminUtils'

/**
 * Individual project item row in the admin sidebar.
 */
export const ProjectSidebarItem = memo(function ProjectSidebarItem({
  project: p,
  index: idx,
  isSelected,
  onSelectProject,
}) {
  const hasCover = Boolean(p.cover || p.hasCover)
  const trks = p.tracks ?? []
  const audioCount = trks.filter((t) => Boolean(t.audioUrl || t.hasAudio || t.audio)).length
  const hasAllAudio = trks.length > 0 && audioCount === trks.length
  const linkCount = trks.reduce(
    (acc, t) =>
      acc +
      Object.values(t.links ?? {}).filter((l) => l && typeof l === 'string' && l.trim() !== '')
        .length,
    0,
  )
  const hasLinks = linkCount > 0
  const isComplete = hasCover && hasAllAudio && hasLinks

  return (
    <ListItemButton
      selected={isSelected}
      data-selected={isSelected ? 'true' : 'false'}
      data-project-index={idx}
      onClick={() => onSelectProject(idx)}
      sx={{
        borderRadius: 2,
        mb: 1,
        border: '1px solid',
        borderColor: isSelected ? 'primary.main' : 'rgba(255,255,255,0.08)',
        backgroundColor: isSelected ? 'rgba(144, 202, 249, 0.08)' : 'transparent',
        py: 1.5,
      }}
    >
      <ListItemIcon
        sx={{
          minWidth: 44,
          mr: 1,
          alignSelf: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {p.cover ? (
          <Box
            component='img'
            src={getMediaThumbnailUrl(p.cover, 80)}
            alt={p.name || 'Cover'}
            sx={{
              width: 40,
              height: 40,
              aspectRatio: '1 / 1',
              borderRadius: 1.5,
              objectFit: 'cover',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              display: 'block',
            }}
          />
        ) : (
          <Box
            sx={{
              width: 40,
              height: 40,
              aspectRatio: '1 / 1',
              borderRadius: 1.5,
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AlbumIcon sx={{ fontSize: 24 }} color={isSelected ? 'primary' : 'action'} />
          </Box>
        )}
      </ListItemIcon>
      <ListItemText
        sx={{ minWidth: 0 }}
        slotProps={{
          primary: { component: 'div' },
          secondary: { component: 'div' },
        }}
        primary={
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1,
              minWidth: 0,
            }}
          >
            <Typography
              variant='body1'
              sx={{
                fontWeight: isSelected ? 700 : 500,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                minWidth: 0,
                flexGrow: 1,
              }}
            >
              {p.name || 'Untitled Project'}
            </Typography>
            {isComplete ? (
              <Chip
                label='Complete'
                color='success'
                size='small'
                sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700, flexShrink: 0 }}
              />
            ) : (
              <Chip
                label='Incomplete'
                color='warning'
                size='small'
                sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700, flexShrink: 0 }}
              />
            )}
          </Box>
        }
        secondary={
          <Box sx={{ mt: 0.5, display: 'flex', flexDirection: 'column', gap: 0.8 }}>
            <Typography variant='caption' sx={{ color: 'text.secondary' }}>
              {p.type || 'Single'} • {trks.length} track{trks.length === 1 ? '' : 's'}
            </Typography>
            {!isComplete && (
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {!hasCover && (
                  <Chip
                    label='No Art'
                    color='error'
                    variant='outlined'
                    size='small'
                    sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600 }}
                  />
                )}
                {!hasAllAudio && (
                  <Chip
                    label={audioCount === 0 ? 'No Audio' : `${audioCount}/${trks.length} Audio`}
                    color='warning'
                    variant='outlined'
                    size='small'
                    sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600 }}
                  />
                )}
                {!hasLinks && (
                  <Chip
                    label='No Links'
                    color='info'
                    variant='outlined'
                    size='small'
                    sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600 }}
                  />
                )}
              </Box>
            )}
            {(p.visibility === 'private' || p.copyright === 'uncleared') && (
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {p.visibility === 'private' && (
                  <Chip
                    label='Private'
                    color='secondary'
                    variant='outlined'
                    size='small'
                    sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }}
                  />
                )}
                {p.copyright === 'uncleared' && (
                  <Chip
                    label='Uncleared'
                    color='default'
                    variant='outlined'
                    size='small'
                    sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600 }}
                  />
                )}
              </Box>
            )}
          </Box>
        }
      />
    </ListItemButton>
  )
})
