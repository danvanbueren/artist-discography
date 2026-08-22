'use client'

import { useState, useMemo } from 'react'
import {
  Stack,
  Box,
  Typography,
  Button,
  Paper,
  Tabs,
  Tab,
  FormControl,
  Select,
  MenuItem,
} from '@mui/material'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import SettingsIcon from '@mui/icons-material/Settings'
import AlbumIcon from '@mui/icons-material/Album'
import LayersIcon from '@mui/icons-material/Layers'

export default function RawJsonInspectorTab({ dataState }) {
  const [copiedJson, setCopiedJson] = useState(false)
  const [viewMode, setViewMode] = useState('config') // 'config' | 'project' | 'unified'
  const [selectedProjectIndex, setSelectedProjectIndex] = useState(0)

  const projects = useMemo(() => {
    return Array.isArray(dataState?.projects) ? dataState.projects : []
  }, [dataState])

  const configJson = useMemo(() => {
    const { projects: _p, ...configFields } = dataState || {}
    return configFields
  }, [dataState])

  const currentProjectJson = useMemo(() => {
    if (projects.length === 0) return {}
    const idx = Math.max(0, Math.min(selectedProjectIndex, projects.length - 1))
    const proj = projects[idx] || {}
    // Clean resolved runtime URLs to show the true file representation
    const cleanTracks = (proj.tracks || []).map((t) => {
      const cleanT = {
        name: t.name || '',
        artist: t.artist || '',
        links: t.links || {},
      }
      if (t.cover && typeof t.cover === 'string' && !t.cover.startsWith('/api/media')) {
        cleanT.cover = t.cover
      }
      return cleanT
    })
    return {
      name: proj.name || '',
      type: proj.type || 'Single',
      artist: proj.artist || '',
      date: proj.date || '',
      visibility: proj.visibility || 'public',
      copyright: proj.copyright || 'cleared',
      cover:
        typeof proj.cover === 'string' && proj.cover.startsWith('/api/media/')
          ? proj.cover.split('?')[0].split('/').pop() || 'art.jpg'
          : proj.cover || 'art.jpg',
      tracks: cleanTracks,
    }
  }, [projects, selectedProjectIndex])

  const displayedContent = useMemo(() => {
    if (viewMode === 'config') return configJson
    if (viewMode === 'project') return currentProjectJson
    return dataState
  }, [viewMode, configJson, currentProjectJson, dataState])

  const currentFilePath = useMemo(() => {
    if (viewMode === 'config') return 'data/config.json'
    if (viewMode === 'project') {
      const proj = projects[selectedProjectIndex]
      const slug = proj?.name
        ? proj.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
        : 'project'
      return `data/projects/${slug}/project.json`
    }
    return 'Combined Assembled State'
  }, [viewMode, projects, selectedProjectIndex])

  const handleCopyJson = () => {
    try {
      navigator.clipboard.writeText(JSON.stringify(displayedContent, null, 2))
      setCopiedJson(true)
      setTimeout(() => setCopiedJson(false), 2000)
    } catch (err) {}
  }

  return (
    <Stack spacing={3}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Typography variant='h6' sx={{ fontWeight: 700 }}>
            Raw Configuration &amp; Projects Inspector
          </Typography>
          <Typography variant='caption' sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>
            Inspecting: {currentFilePath}
          </Typography>
        </Box>

        <Button
          variant='outlined'
          size='small'
          startIcon={<ContentCopyIcon />}
          onClick={handleCopyJson}
          sx={{ borderRadius: 2 }}
        >
          {copiedJson ? 'Copied to Clipboard!' : 'Copy JSON'}
        </Button>
      </Box>

      {/* View Selector Tabs */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Tabs
          value={viewMode}
          onChange={(_, val) => setViewMode(val)}
          sx={{
            minHeight: 38,
            '& .MuiTab-root': {
              minHeight: 38,
              py: 0.5,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.85rem',
            },
          }}
        >
          <Tab
            value='config'
            label='data/config.json'
            icon={<SettingsIcon sx={{ fontSize: 16 }} />}
            iconPosition='start'
          />
          <Tab
            value='project'
            label='data/projects/<slug>/project.json'
            icon={<AlbumIcon sx={{ fontSize: 16 }} />}
            iconPosition='start'
          />
          <Tab
            value='unified'
            label='Assembled State'
            icon={<LayersIcon sx={{ fontSize: 16 }} />}
            iconPosition='start'
          />
        </Tabs>

        {viewMode === 'project' && projects.length > 0 && (
          <FormControl size='small' sx={{ minWidth: 220 }}>
            <Select
              value={selectedProjectIndex}
              onChange={(e) => setSelectedProjectIndex(Number(e.target.value))}
              slotProps={{
                paper: {
                  sx: {
                    maxHeight: 350,
                    backgroundColor: '#16161f',
                  },
                },
              }}
              sx={{
                borderRadius: 2,
                fontSize: '0.85rem',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
              }}
            >
              {projects.map((p, idx) => (
                <MenuItem key={idx} value={idx} sx={{ fontSize: '0.85rem' }}>
                  {p.name || `Project #${idx + 1}`} ({p.type || 'Single'})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Box>

      <Paper
        variant='outlined'
        sx={{
          p: 2.5,
          backgroundColor: '#0d0d12',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: 2.5,
          maxHeight: 550,
          overflowY: 'auto',
        }}
      >
        <Typography
          component='pre'
          sx={{
            fontFamily: 'monospace',
            fontSize: '0.85rem',
            color: '#81d4fa',
            margin: 0,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {JSON.stringify(displayedContent, null, 2)}
        </Typography>
      </Paper>
    </Stack>
  )
}
