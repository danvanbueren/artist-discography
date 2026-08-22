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
import { ProjectSidebarItem } from '../sidebar/ProjectSidebarItem'

/**
 * ProjectSidebarList
 * Left navigation sidebar displaying sorted and filterable projects catalog,
 * complete/incomplete checklist badges, and the Create New button.
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
  const [sidebarSortBy, setSidebarSortBy] = useState('date')
  const [sidebarSortAsc, setSidebarSortAsc] = useState(false)

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

  return (
    <Paper
      variant='outlined'
      sx={{
        p: 2,
        borderRadius: 2.5,
        backgroundColor: 'rgba(28, 28, 38, 0.6)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header & Create Button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant='h6' sx={{ fontWeight: 700 }}>
          Projects ({projectsList.length})
        </Typography>
        <Button
          variant={isCreatingNew ? 'contained' : 'outlined'}
          color='primary'
          size='small'
          startIcon={<AddIcon />}
          onClick={handleStartCreateNewProject}
          sx={{ borderRadius: 2 }}
        >
          New
        </Button>
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
      <List sx={{ overflowY: 'auto', flexGrow: 1, p: 0, minHeight: 0 }}>
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
              slotProps={{
                primary: { component: 'div' },
                secondary: { component: 'div' },
              }}
              primary={
                <Box
                  sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <Typography variant='body1' sx={{ fontWeight: 700 }}>
                    {name || 'New Project Draft'}
                  </Typography>
                  <Chip
                    label='Creating'
                    color='primary'
                    size='small'
                    sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700 }}
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
            onSelectProject={handleSelectProject}
          />
        ))}
      </List>
    </Paper>
  )
}
