'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
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
  TextField,
  InputAdornment,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import AlbumIcon from '@mui/icons-material/Album'
import SearchIcon from '@mui/icons-material/Search'
import ClearIcon from '@mui/icons-material/Clear'
import SortIcon from '@mui/icons-material/Sort'
import ArrowDownwardRoundedIcon from '@mui/icons-material/ArrowDownwardRounded'
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded'
import UnfoldMoreRoundedIcon from '@mui/icons-material/UnfoldMoreRounded'
import UnfoldLessRoundedIcon from '@mui/icons-material/UnfoldLessRounded'
import { ProjectSidebarItem } from '../sidebar/ProjectSidebarItem'
import { getMediaThumbnailUrl } from '../adminUtils'
import { formatProjectDate } from '@/lib/data/dateUtils'

function isProjectComplete(project) {
  if (!project) return false
  const hasCover = Boolean(project.cover || project.hasCover)
  const trks = project.tracks ?? []
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
  return Boolean(hasCover && hasAllAudio && hasLinks)
}

/**
 * ProjectSidebarList
 * Left navigation sidebar displaying sorted and filterable projects catalog,
 * complete/incomplete checklist badges, search filtering, and the Create New button.
 * On small screens, collapses to a compact single-project view that expands on click
 * and auto-minimizes upon selecting a project.
 */
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
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [mobileExpanded, setMobileExpanded] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sidebarSortBy, setSidebarSortBy] = useState('date')
  const [sidebarSortAsc, setSidebarSortAsc] = useState(false)
  const listContainerRef = useRef(null)

  // Auto-scroll list when selected project changes or when starting new project
  useEffect(() => {
    if (!listContainerRef.current) return
    if (isCreatingNew) {
      listContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (selectedProjIndex !== null && selectedProjIndex >= 0) {
      const selectedEl = listContainerRef.current.querySelector(
        `[data-project-index="${selectedProjIndex}"]`,
      )
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    }
  }, [selectedProjIndex, isCreatingNew])

  const selectedProject =
    !isCreatingNew && selectedProjIndex !== null && selectedProjIndex >= 0
      ? projectsList[selectedProjIndex]
      : null

  const activeTitle = isCreatingNew
    ? name || 'New Project Draft'
    : selectedProject?.name || 'Untitled Project'

  const activeCover = isCreatingNew
    ? coverPreview
    : selectedProject?.cover
      ? getMediaThumbnailUrl(selectedProject.cover, 80)
      : null

  const activeSubtitle = isCreatingNew
    ? `${type || 'Single'} • ${tracks.length} track${tracks.length === 1 ? '' : 's'}`
    : selectedProject
      ? `${selectedProject.type || 'Single'} • ${formatProjectDate(selectedProject.date)} • ${
          selectedProject.tracks?.length || 0
        } track${(selectedProject.tracks?.length || 0) === 1 ? '' : 's'}`
      : 'No project selected'

  const sortedProjectsWithIndex = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    const indexed = projectsList.map((project, originalIndex) => ({
      project,
      originalIndex,
    }))

    const filtered = query
      ? indexed.filter(({ project }) => {
          const complete = isProjectComplete(project)
          const statusMatch =
            (complete && (query === 'complete' || query === 'done')) ||
            (!complete && (query === 'incomplete' || query === 'issue' || query === 'issues'))
          const nameMatch = (project?.name || '').toLowerCase().includes(query)
          const artistMatch = (project?.artist || '').toLowerCase().includes(query)
          const typeMatch = (project?.type || '').toLowerCase().includes(query)
          const dateMatch = (project?.date || '').toLowerCase().includes(query)
          const trackMatch = (project?.tracks || []).some(
            (t) =>
              (t?.name || '').toLowerCase().includes(query) ||
              (t?.artist || '').toLowerCase().includes(query),
          )
          return statusMatch || nameMatch || artistMatch || typeMatch || dateMatch || trackMatch
        })
      : indexed

    return filtered.sort((a, b) => {
      if (sidebarSortBy === 'status') {
        const completeA = isProjectComplete(a.project) ? 1 : 0
        const completeB = isProjectComplete(b.project) ? 1 : 0
        if (completeA !== completeB) {
          return sidebarSortAsc ? completeA - completeB : completeB - completeA
        }
        // Tie-breaker: release date descending
        const dateA = a.project?.date ? new Date(a.project.date).getTime() || 0 : 0
        const dateB = b.project?.date ? new Date(b.project.date).getTime() || 0 : 0
        return dateB - dateA
      }

      if (sidebarSortBy === 'json') {
        return sidebarSortAsc
          ? a.originalIndex - b.originalIndex
          : b.originalIndex - a.originalIndex
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
  }, [projectsList, searchQuery, sidebarSortBy, sidebarSortAsc])

  // ----------------------------------------------------
  // Small Screen Minimized Bar
  // ----------------------------------------------------
  if (isMobile && !mobileExpanded) {
    return (
      <Paper
        variant='outlined'
        sx={{
          p: 1.5,
          borderRadius: 2.5,
          backgroundColor: 'rgba(28, 28, 38, 0.75)',
          borderColor: 'rgba(255, 255, 255, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1.5,
          mb: 1,
        }}
      >
        {/* Active Project Info */}
        <Box
          onClick={() => setMobileExpanded(true)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            minWidth: 0,
            flexGrow: 1,
            cursor: 'pointer',
          }}
        >
          <Box
            sx={{
              width: 42,
              height: 42,
              aspectRatio: '1 / 1',
              borderRadius: 1.5,
              overflow: 'hidden',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {activeCover ? (
              <Box
                component='img'
                src={activeCover}
                alt={activeTitle}
                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <AlbumIcon sx={{ fontSize: 24, color: 'primary.main' }} />
            )}
          </Box>

          <Box sx={{ minWidth: 0, flexGrow: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
              <Typography
                variant='body2'
                sx={{
                  fontWeight: 700,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  minWidth: 0,
                }}
              >
                {activeTitle}
              </Typography>
              <Chip
                label={isCreatingNew ? 'Draft' : 'Selected'}
                color='primary'
                size='small'
                sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, flexShrink: 0 }}
              />
            </Box>
            <Typography
              variant='caption'
              sx={{
                color: 'text.secondary',
                display: 'block',
                mt: 0.25,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {activeSubtitle}
            </Typography>
          </Box>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
          <Button
            variant='outlined'
            size='small'
            endIcon={<UnfoldMoreRoundedIcon />}
            onClick={() => setMobileExpanded(true)}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontSize: '0.78rem',
              fontWeight: 600,
              px: 1.25,
              py: 0.5,
            }}
          >
            Switch
          </Button>
          <Button
            variant='contained'
            color='primary'
            size='small'
            startIcon={<AddIcon />}
            onClick={() => {
              handleStartCreateNewProject()
              setMobileExpanded(false)
            }}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontSize: '0.78rem',
              fontWeight: 600,
              px: 1.25,
              py: 0.5,
            }}
          >
            Add Project
          </Button>
        </Box>
      </Paper>
    )
  }

  // ----------------------------------------------------
  // Full / Expanded Project Sidebar List
  // ----------------------------------------------------
  return (
    <Paper
      variant='outlined'
      sx={{
        p: 2,
        borderRadius: 2.5,
        backgroundColor: 'rgba(28, 28, 38, 0.6)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        height: { xs: 'auto', md: '100%' },
        maxHeight: { xs: 460, md: 'none' },
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        mb: { xs: 2, md: 0 },
      }}
    >
      {/* Header & Create Button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Typography variant='h6' sx={{ fontWeight: 700 }}>
          Projects (
          {searchQuery.trim()
            ? `${sortedProjectsWithIndex.length} of ${projectsList.length}`
            : projectsList.length}
          )
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {isMobile && (
            <Button
              variant='text'
              color='inherit'
              size='small'
              startIcon={<UnfoldLessRoundedIcon />}
              onClick={() => setMobileExpanded(false)}
              sx={{ borderRadius: 2, textTransform: 'none', fontSize: '0.78rem' }}
            >
              Minimize
            </Button>
          )}
          <Button
            variant='contained'
            color='primary'
            size='small'
            startIcon={<AddIcon />}
            onClick={() => {
              handleStartCreateNewProject()
              if (isMobile) setMobileExpanded(false)
            }}
            sx={{ borderRadius: 2 }}
          >
            Add Project
          </Button>
        </Box>
      </Box>

      {/* Search Input Bar */}
      <TextField
        fullWidth
        size='small'
        placeholder='Search projects or tracks...'
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position='start'>
                <SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
              </InputAdornment>
            ),
            endAdornment: searchQuery ? (
              <InputAdornment position='end'>
                <IconButton
                  size='small'
                  onClick={() => setSearchQuery('')}
                  sx={{ p: 0.25, color: 'text.secondary' }}
                >
                  <ClearIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </InputAdornment>
            ) : null,
          },
        }}
        sx={{
          mb: 1.5,
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            fontSize: '0.82rem',
            height: 34,
            '& fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.1)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.2)',
            },
            '&.Mui-focused fieldset': {
              borderColor: 'primary.main',
            },
          },
        }}
      />

      {/* Sort Controls Bar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: 1.5,
          pb: 1.5,
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <Select
          size='small'
          value={sidebarSortBy}
          onChange={(e) => setSidebarSortBy(e.target.value)}
          startAdornment={
            <InputAdornment position='start' sx={{ mr: 0.5 }}>
              <SortIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
            </InputAdornment>
          }
          sx={{
            flexGrow: 1,
            height: 34,
            borderRadius: 2,
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            fontSize: '0.82rem',
            '& fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.1)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.2)',
            },
            '&.Mui-focused fieldset': {
              borderColor: 'primary.main',
            },
            '& .MuiSelect-select': {
              py: 0.75,
              display: 'flex',
              alignItems: 'center',
            },
          }}
        >
          <MenuItem value='date' sx={{ fontSize: '0.8rem' }}>
            Release Date
          </MenuItem>
          <MenuItem value='status' sx={{ fontSize: '0.8rem' }}>
            Status (Complete / Issues)
          </MenuItem>
          <MenuItem value='title' sx={{ fontSize: '0.8rem' }}>
            Title (A-Z)
          </MenuItem>
          <MenuItem value='type' sx={{ fontSize: '0.8rem' }}>
            Release Type
          </MenuItem>
          <MenuItem value='tracks' sx={{ fontSize: '0.8rem' }}>
            Track Count
          </MenuItem>
          <MenuItem value='json' sx={{ fontSize: '0.8rem' }}>
            Discography Order
          </MenuItem>
        </Select>

        <Tooltip
          title={
            sidebarSortBy === 'status'
              ? sidebarSortAsc
                ? 'Ascending (Incomplete / Issues First)'
                : 'Descending (Complete First)'
              : sidebarSortBy === 'date'
                ? sidebarSortAsc
                  ? 'Ascending (Oldest First)'
                  : 'Descending (Newest First)'
                : sidebarSortBy === 'title'
                  ? sidebarSortAsc
                    ? 'Ascending (A-Z)'
                    : 'Descending (Z-A)'
                  : sidebarSortBy === 'tracks'
                    ? sidebarSortAsc
                      ? 'Ascending (Fewest Tracks)'
                      : 'Descending (Most Tracks)'
                    : sidebarSortAsc
                      ? 'Ascending'
                      : 'Descending'
          }
        >
          <IconButton
            size='small'
            onClick={() => setSidebarSortAsc((prev) => !prev)}
            sx={{
              width: 34,
              height: 34,
              borderRadius: 2,
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'text.secondary',
              flexShrink: 0,
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                borderColor: 'rgba(255, 255, 255, 0.2)',
                color: 'text.primary',
              },
            }}
          >
            {sidebarSortAsc ? (
              <ArrowUpwardRoundedIcon sx={{ fontSize: 18 }} />
            ) : (
              <ArrowDownwardRoundedIcon sx={{ fontSize: 18 }} />
            )}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Projects List Container */}
      <List
        ref={listContainerRef}
        sx={{
          overflowY: 'auto',
          flexGrow: 1,
          p: 0,
          pr: 1.5,
          minHeight: 0,
          maxHeight: { xs: 320, sm: 360, md: 'none' },
        }}
      >
        {/* If creating new, show staging draft item at top */}
        {isCreatingNew && (
          <ListItemButton
            selected
            sx={{
              borderRadius: 2,
              mb: 1,
              border: '1px dashed',
              borderColor: 'primary.main',
              backgroundColor: 'rgba(144, 202, 249, 0.08)',
              py: 1.5,
            }}
          >
            <ListItemIcon sx={{ minWidth: 44, mr: 1, alignSelf: 'center' }}>
              {coverPreview ? (
                <Box
                  component='img'
                  src={coverPreview}
                  alt='Cover'
                  sx={{
                    width: 40,
                    height: 40,
                    aspectRatio: '1 / 1',
                    borderRadius: 1.5,
                    objectFit: 'cover',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
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
                    border: '1px dashed rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AlbumIcon sx={{ fontSize: 24 }} color='primary' />
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
                      fontWeight: 700,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      minWidth: 0,
                      flexGrow: 1,
                    }}
                  >
                    {name || 'New Project Draft'}
                  </Typography>
                  <Chip
                    label='Creating'
                    color='primary'
                    size='small'
                    sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700, flexShrink: 0 }}
                  />
                </Box>
              }
              secondary={
                <Typography
                  variant='caption'
                  sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}
                >
                  {type || 'Single'} • {tracks.length} track{tracks.length === 1 ? '' : 's'}
                </Typography>
              }
            />
          </ListItemButton>
        )}

        {/* Empty Search Feedback */}
        {sortedProjectsWithIndex.length === 0 && !isCreatingNew && (
          <Box
            sx={{
              p: 3,
              textAlign: 'center',
              borderRadius: 2,
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              border: '1px dashed rgba(255, 255, 255, 0.1)',
              my: 1,
            }}
          >
            <Typography variant='body2' sx={{ color: 'text.secondary', fontWeight: 600, mb: 0.5 }}>
              No matching projects
            </Typography>
            <Typography variant='caption' sx={{ color: 'text.disabled', display: 'block' }}>
              No projects or tracks match &ldquo;{searchQuery}&rdquo;
            </Typography>
          </Box>
        )}

        {/* Existing Projects */}
        {sortedProjectsWithIndex.map(({ project, originalIndex }) => (
          <ProjectSidebarItem
            key={project.slug || originalIndex}
            project={project}
            index={originalIndex}
            isSelected={!isCreatingNew && selectedProjIndex === originalIndex}
            onSelectProject={(idx) => {
              handleSelectProject(idx)
              if (isMobile) setMobileExpanded(false)
            }}
          />
        ))}
      </List>
    </Paper>
  )
}
