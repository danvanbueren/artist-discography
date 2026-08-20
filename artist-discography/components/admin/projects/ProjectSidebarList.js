'use client'

import { useState, useMemo } from 'react'
import {
  Paper,
  Box,
  Typography,
  Button,
  Chip,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Stack,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import AlbumIcon from '@mui/icons-material/Album'
import SyncIcon from '@mui/icons-material/Sync'
import ArrowDownwardRoundedIcon from '@mui/icons-material/ArrowDownwardRounded'
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded'
import { getMediaThumbnailUrl } from '../adminUtils'

export default function ProjectSidebarList({
  projectsList = [],
  selectedProjIndex,
  isCreatingNew,
  dirtyFields,
  handleStartCreateNewProject,
  handleSelectProject,
  name,
  type,
  tracks = [],
  coverPreview,
}) {
  const [sidebarSortBy, setSidebarSortBy] = useState('date')
  const [sidebarSortAsc, setSidebarSortAsc] = useState(false)

  const sortedProjectsWithIndex = useMemo(() => {
    const indexed = projectsList.map((project, originalIndex) => ({
      project,
      originalIndex,
    }))

    return indexed.sort((a, b) => {
      if (sidebarSortBy === 'json') {
        return sidebarSortAsc ? a.originalIndex - b.originalIndex : b.originalIndex - a.originalIndex
      }

      if (sidebarSortBy === 'date') {
        const dateA = a.project?.date ? new Date(a.project.date).getTime() || 0 : 0
        const dateB = b.project?.date ? new Date(b.project.date).getTime() || 0 : 0
        return sidebarSortAsc ? dateA - dateB : dateB - dateA
      }

      if (sidebarSortBy === 'title') {
        const titleA = (a.project?.name || '').toLowerCase()
        const titleB = (b.project?.name || '').toLowerCase()
        return sidebarSortAsc ? titleA.localeCompare(titleB) : titleB.localeCompare(titleA)
      }

      if (sidebarSortBy === 'type') {
        const typeA = (a.project?.type || '').toLowerCase()
        const typeB = (b.project?.type || '').toLowerCase()
        return sidebarSortAsc ? typeA.localeCompare(typeB) : typeB.localeCompare(typeA)
      }

      if (sidebarSortBy === 'tracks') {
        const countA = a.project?.tracks?.length || 0
        const countB = b.project?.tracks?.length || 0
        return sidebarSortAsc ? countA - countB : countB - countA
      }

      return 0
    })
  }, [projectsList, sidebarSortBy, sidebarSortAsc])

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.5,
        borderRadius: 2.5,
        backgroundColor: 'rgba(28, 28, 38, 0.6)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        height: { md: '100%' },
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Button
        variant={isCreatingNew ? 'contained' : 'outlined'}
        color="secondary"
        size="large"
        fullWidth
        startIcon={<AddIcon />}
        onClick={handleStartCreateNewProject}
        sx={{
          mb: 2.5,
          py: 1.2,
          borderRadius: 2,
          textTransform: 'none',
          fontWeight: 700,
          fontSize: '0.95rem',
          flexShrink: 0,
        }}
      >
        Add New Project
      </Button>

      {/* Sidebar Header with Releases count, Sorting dropdown and Direction Toggle */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 1.5,
          px: 0.5,
          gap: 1,
          flexShrink: 0,
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{ fontWeight: 700, color: 'text.secondary', whiteSpace: 'nowrap' }}
        >
          Releases ({projectsList.length})
        </Typography>

        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
          <Select
            size="small"
            value={sidebarSortBy}
            onChange={(e) => setSidebarSortBy(e.target.value)}
            sx={{
              height: 28,
              fontSize: '0.75rem',
              borderRadius: 1.5,
              bgcolor: 'rgba(255, 255, 255, 0.05)',
              '& .MuiSelect-select': { py: 0.5, px: 1 },
            }}
          >
            <MenuItem value="date">Date</MenuItem>
            <MenuItem value="title">Title</MenuItem>
            <MenuItem value="type">Type</MenuItem>
            <MenuItem value="tracks">Tracks</MenuItem>
            <MenuItem value="json">Raw Order</MenuItem>
          </Select>

          <Tooltip title={sidebarSortAsc ? 'Ascending' : 'Descending'} arrow>
            <IconButton
              size="small"
              onClick={() => setSidebarSortAsc((prev) => !prev)}
              sx={{ p: 0.5, color: 'text.secondary' }}
              aria-label="Toggle sort direction"
            >
              {sidebarSortAsc ? (
                <ArrowUpwardRoundedIcon sx={{ fontSize: 18 }} />
              ) : (
                <ArrowDownwardRoundedIcon sx={{ fontSize: 18 }} />
              )}
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {dirtyFields?.size > 0 && !isCreatingNew && (
        <Box sx={{ mb: 1, px: 0.5 }}>
          <Typography
            variant="caption"
            sx={{
              color: 'warning.main',
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              fontWeight: 600,
            }}
          >
            <SyncIcon
              sx={{
                fontSize: 13,
                animation: 'spin 1s infinite linear',
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(-360deg)' },
                },
              }}
            />
            {' '}
            Saving changes…
          </Typography>
        </Box>
      )}

      <Box
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          pr: 0.5,
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255, 255, 255, 0.45) transparent',
          '&::-webkit-scrollbar': { width: 6 },
          '&::-webkit-scrollbar-track': { background: 'transparent' },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: 'rgba(255, 255, 255, 0.45)',
            borderRadius: 3,
            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.75)' },
          },
        }}
      >
        <List sx={{ p: 0 }}>
          {isCreatingNew && (
            <ListItemButton
              selected={true}
              sx={{
                borderRadius: 2,
                mb: 1,
                border: '1px dashed',
                borderColor: 'secondary.main',
                backgroundColor: 'rgba(206, 147, 216, 0.12)',
                py: 1.5,
              }}
            >
              <ListItemIcon sx={{ minWidth: 44, mr: 1, alignSelf: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {coverPreview ? (
                  <Box
                    component="img"
                    src={getMediaThumbnailUrl(coverPreview, 80)}
                    alt="Cover preview"
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
                      backgroundColor: 'rgba(206, 147, 216, 0.15)',
                      border: '1px dashed rgba(206, 147, 216, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <AlbumIcon sx={{ fontSize: 24 }} color="secondary" />
                  </Box>
                )}
              </ListItemIcon>
              <ListItemText
                slotProps={{
                  primary: { component: 'div' },
                  secondary: { component: 'div' },
                }}
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                    <Typography
                      variant="body1"
                      sx={{ fontWeight: 700, color: 'secondary.main' }}
                    >
                      {name.trim() || 'New Project'}
                    </Typography>
                    <Chip
                      label="Draft"
                      color="secondary"
                      size="small"
                      sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700 }}
                    />
                  </Box>
                }
                secondary={
                  <Typography
                    variant="caption"
                    sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}
                  >
                    {type || 'Single'} • {tracks.length} track{tracks.length === 1 ? '' : 's'}
                  </Typography>
                }
              />
            </ListItemButton>
          )}

          {sortedProjectsWithIndex.map(({ project: p, originalIndex: idx }) => {
            const hasCover = Boolean(p.cover || p.hasCover)
            const trks = p.tracks ?? []
            const audioCount = trks.filter((t) => Boolean(t.audioUrl || t.hasAudio || t.audio)).length
            const hasAllAudio = trks.length > 0 && audioCount === trks.length
            const linkCount = trks.reduce(
              (acc, t) => acc + Object.values(t.links ?? {}).filter((l) => l && typeof l === 'string' && l.trim() !== '').length,
              0
            )
            const hasLinks = linkCount > 0
            const isComplete = hasCover && hasAllAudio && hasLinks
            const isSelected = !isCreatingNew && selectedProjIndex === idx

            return (
              <ListItemButton
                key={idx}
                selected={isSelected}
                onClick={() => handleSelectProject(idx)}
                sx={{
                  borderRadius: 2,
                  mb: 1,
                  border: '1px solid',
                  borderColor: isSelected ? 'primary.main' : 'rgba(255,255,255,0.08)',
                  backgroundColor: isSelected ? 'rgba(144, 202, 249, 0.08)' : 'transparent',
                  py: 1.5,
                }}
              >
                <ListItemIcon sx={{ minWidth: 44, mr: 1, alignSelf: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {p.cover ? (
                    <Box
                      component="img"
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
                  slotProps={{
                    primary: { component: 'div' },
                    secondary: { component: 'div' },
                  }}
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                      <Typography
                        variant="body1"
                        sx={{ fontWeight: isSelected ? 700 : 500 }}
                      >
                        {p.name || 'Untitled Project'}
                      </Typography>
                      {isComplete ? (
                        <Chip
                          label="Complete"
                          color="success"
                          size="small"
                          sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700 }}
                        />
                      ) : (
                        <Chip
                          label="Incomplete"
                          color="warning"
                          size="small"
                          sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700 }}
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box sx={{ mt: 0.5, display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                      <Typography
                        variant="caption"
                        sx={{ color: 'text.secondary' }}
                      >
                        {p.type || 'Single'} • {trks.length} track{trks.length === 1 ? '' : 's'}
                      </Typography>
                      {!isComplete && (
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {!hasCover && (
                            <Chip
                              label="No Art"
                              color="error"
                              variant="outlined"
                              size="small"
                              sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600 }}
                            />
                          )}
                          {!hasAllAudio && (
                            <Chip
                              label={audioCount === 0 ? 'No Audio' : `${audioCount}/${trks.length} Audio`}
                              color="warning"
                              variant="outlined"
                              size="small"
                              sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600 }}
                            />
                          )}
                          {!hasLinks && (
                            <Chip
                              label="No Links"
                              color="info"
                              variant="outlined"
                              size="small"
                              sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600 }}
                            />
                          )}
                        </Box>
                      )}
                      {(p.visibility === 'private' || p.copyright === 'uncleared') && (
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {p.visibility === 'private' && (
                            <Chip
                              label="Private"
                              color="secondary"
                              variant="outlined"
                              size="small"
                              sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }}
                            />
                          )}
                          {p.copyright === 'uncleared' && (
                            <Chip
                              label="Uncleared"
                              color="default"
                              variant="outlined"
                              size="small"
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
          })}
        </List>
      </Box>
    </Paper>
  )
}
