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
  useTheme,
  useMediaQuery,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import AlbumIcon from '@mui/icons-material/Album'
import ArrowDownwardRoundedIcon from '@mui/icons-material/ArrowDownwardRounded'
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded'
import UnfoldMoreRoundedIcon from '@mui/icons-material/UnfoldMoreRounded'
import UnfoldLessRoundedIcon from '@mui/icons-material/UnfoldLessRounded'
import { ProjectSidebarItem } from '../sidebar/ProjectSidebarItem'
import { getMediaThumbnailUrl } from '../adminUtils'
import { formatProjectDate } from '@/lib/data/dateUtils'

/**
 * ProjectSidebarList
 * Left navigation sidebar displaying sorted and filterable projects catalog,
 * complete/incomplete checklist badges, and the Create New button.
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
    const indexed = projectsList.map((project, originalIndex) => ({
      project,
      originalIndex,
    }))

    return indexed.sort((a, b) => {
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
  }, [projectsList, sidebarSortBy, sidebarSortAsc])

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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant='h6' sx={{ fontWeight: 700 }}>
          Projects ({projectsList.length})
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

      {/* Sort Controls Bar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: 2,
          pb: 1.5,
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <Typography variant='caption' sx={{ color: 'text.secondary', fontWeight: 600 }}>
          Sort:
        </Typography>
        <Select
          size='small'
          value={sidebarSortBy}
          onChange={(e) => setSidebarSortBy(e.target.value)}
          sx={{
            flexGrow: 1,
            height: 28,
            fontSize: '0.78rem',
            '& .MuiSelect-select': { py: 0.5 },
          }}
        >
          <MenuItem value='date' sx={{ fontSize: '0.8rem' }}>
            Release Date
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
        <Tooltip title={sidebarSortAsc ? 'Ascending (Oldest / A-Z)' : 'Descending (Newest / Z-A)'}>
          <IconButton
            size='small'
            onClick={() => setSidebarSortAsc((prev) => !prev)}
            sx={{ p: 0.5, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 1 }}
          >
            {sidebarSortAsc ? (
              <ArrowUpwardRoundedIcon sx={{ fontSize: 16 }} />
            ) : (
              <ArrowDownwardRoundedIcon sx={{ fontSize: 16 }} />
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
