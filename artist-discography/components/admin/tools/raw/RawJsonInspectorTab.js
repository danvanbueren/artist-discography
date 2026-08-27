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
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import SettingsIcon from '@mui/icons-material/Settings'
import AlbumIcon from '@mui/icons-material/Album'
import LayersIcon from '@mui/icons-material/Layers'
import CodeRoundedIcon from '@mui/icons-material/CodeRounded'

export default function RawJsonInspectorTab({
  dataState,
  jsonData,
  expanded: propsExpanded,
  onToggle,
}) {
  const activeDataState = useMemo(() => dataState || jsonData || {}, [dataState, jsonData])
  const [localExpanded, setLocalExpanded] = useState(false)
  const isExpanded = propsExpanded !== undefined ? propsExpanded : localExpanded
  const handleAccordionChange = onToggle || ((_, exp) => setLocalExpanded(exp))
  const [copiedJson, setCopiedJson] = useState(false)
  const [viewMode, setViewMode] = useState('config') // 'config' | 'project' | 'unified'
  const [selectedProjectIndex, setSelectedProjectIndex] = useState(0)

  const projects = useMemo(() => {
    return Array.isArray(activeDataState?.projects) ? activeDataState.projects : []
  }, [activeDataState])

  const configJson = useMemo(() => {
    const { projects: _p, ...configFields } = activeDataState || {}
    return configFields
  }, [activeDataState])

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
    return activeDataState
  }, [viewMode, configJson, currentProjectJson, activeDataState])

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

  const handleCopyJson = (e) => {
    if (e?.stopPropagation) e.stopPropagation()
    try {
      navigator.clipboard.writeText(JSON.stringify(displayedContent, null, 2))
      setCopiedJson(true)
      setTimeout(() => setCopiedJson(false), 2000)
    } catch (err) {}
  }

  return (
    <Accordion
      expanded={isExpanded}
      onChange={handleAccordionChange}
      disableGutters
      slotProps={{
        transition: {
          timeout: 0,
        },
      }}
      sx={{
        borderRadius: 2.5,
        backgroundColor: 'rgba(26, 26, 38, 0.75)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        '&:before': { display: 'none' },
        ...(isExpanded
          ? {
              flexGrow: 1,
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
              overflow: 'hidden',
              '& .MuiCollapse-root, & .MuiCollapse-wrapper, & .MuiCollapse-wrapperInner, & .MuiAccordion-region':
                {
                  flexGrow: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 0,
                },
            }
          : {
              flexShrink: 0,
            }),
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          px: 2.5,
          minHeight: 56,
          flexShrink: 0,
          '& .MuiAccordionSummary-content': {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pr: 1,
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CodeRoundedIcon color='primary' sx={{ fontSize: 22 }} />
          <Box>
            <Typography variant='subtitle1' sx={{ fontWeight: 700 }}>
              Database Inspector
            </Typography>
            <Typography variant='caption' sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>
              {currentFilePath}
            </Typography>
          </Box>
        </Box>
      </AccordionSummary>

      <AccordionDetails
        sx={{
          px: 2.5,
          pt: 0,
          pb: 2.5,
          flexGrow: 1,
          height: '100%',
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            flexGrow: 1,
            height: '100%',
            minHeight: 0,
            gap: 2,
          }}
        >
          {/* Header Action & Tabs Row */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2,
              flexShrink: 0,
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

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
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

              <Button
                variant='outlined'
                size='small'
                startIcon={<ContentCopyIcon />}
                onClick={handleCopyJson}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
              >
                {copiedJson ? 'Copied to Clipboard!' : 'Copy JSON'}
              </Button>
            </Box>
          </Box>

          <Paper
            variant='outlined'
            sx={{
              p: 2.5,
              backgroundColor: '#0d0d12',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: 2.5,
              flexGrow: 1,
              height: '100%',
              minHeight: 0,
              overflow: 'auto',
              userSelect: 'text',
              WebkitUserSelect: 'text',
              cursor: 'text',
            }}
          >
            <Typography
              component='pre'
              sx={{
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                color: '#81d4fa',
                margin: 0,
                whiteSpace: 'pre',
                userSelect: 'text',
                WebkitUserSelect: 'text',
                cursor: 'text',
              }}
            >
              {JSON.stringify(displayedContent, null, 2)}
            </Typography>
          </Paper>
        </Box>
      </AccordionDetails>
    </Accordion>
  )
}
