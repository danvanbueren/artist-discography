'use client'

import React, { useState, useMemo } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import FormControl from '@mui/material/FormControl'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import CheckIcon from '@mui/icons-material/Check'
import VisibilityIcon from '@mui/icons-material/Visibility'
import { renderTemplate } from '@/lib/data/templateEngine'

/**
 * Live preview card for testing template rendering against any project.
 *
 * @param {Object} props
 * @param {string} props.template - Active template string
 * @param {Array<Object>} props.projects - List of available projects
 * @param {string} props.siteArtist - Artist name
 * @param {string} props.siteUrl - Base URL
 */
export default function TemplatePreviewCard({
  template,
  projects = [],
  siteArtist = 'Artist',
  siteUrl = '',
}) {
  const [selectedSlug, setSelectedSlug] = useState('')
  const [copied, setCopied] = useState(false)

  // Default to first project if none selected
  const activeProject = useMemo(() => {
    if (!projects || projects.length === 0) return null
    if (selectedSlug) {
      const found = projects.find((p) => p.name === selectedSlug || p.slug === selectedSlug)
      if (found) return found
    }
    return projects[0]
  }, [projects, selectedSlug])

  const renderedPreview = useMemo(() => {
    if (!activeProject) return 'No projects available to preview.'
    return renderTemplate(template, activeProject, siteArtist, siteUrl)
  }, [template, activeProject, siteArtist, siteUrl])

  const handleCopy = () => {
    navigator.clipboard.writeText(renderedPreview)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const coverUrl = activeProject?.cover
    ? activeProject.cover.startsWith('http')
      ? activeProject.cover
      : `${activeProject.cover}?w=160&q=80`
    : null

  return (
    <Box
      sx={{
        backgroundColor: '#13131c',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 2,
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <VisibilityIcon sx={{ color: '#90caf9', fontSize: 18 }} />
          <Typography variant='subtitle2' sx={{ fontWeight: 600, color: '#fff' }}>
            Live Preview
          </Typography>
        </Box>

        {/* Project Selector Dropdown */}
        <FormControl size='small' sx={{ minWidth: 180 }}>
          <Select
            value={activeProject?.name || ''}
            onChange={(e) => setSelectedSlug(e.target.value)}
            slotProps={{
              paper: {
                sx: {
                  backgroundColor: '#13131c',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  maxHeight: 320,
                },
              },
            }}
            sx={{
              backgroundColor: '#0a0a0f',
              borderRadius: 1.5,
              fontSize: '0.8rem',
              color: '#fff',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255, 255, 255, 0.15)',
              },
            }}
          >
            {projects.map((p, idx) => (
              <MenuItem key={p.name + idx} value={p.name} sx={{ fontSize: '0.8rem' }}>
                {p.name} ({p.type || 'Single'})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Selected Project Info Pill */}
      {activeProject && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            p: 1.25,
            backgroundColor: '#0a0a0f',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: 1.5,
          }}
        >
          {coverUrl ? (
            <Box
              component='img'
              src={coverUrl}
              alt={activeProject.name}
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1,
                objectFit: 'cover',
                aspectRatio: '1 / 1',
              }}
            />
          ) : (
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1,
                backgroundColor: 'rgba(255,255,255,0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
              }}
            >
              💽
            </Box>
          )}

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant='body2'
              sx={{ fontWeight: 600, color: '#fff', noWrap: true, fontSize: '0.8rem' }}
            >
              {activeProject.name}
            </Typography>
            <Typography
              variant='caption'
              sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.7rem' }}
            >
              {activeProject.artist || siteArtist} • {activeProject.date || 'No date'}
            </Typography>
          </Box>

          <Chip
            label={activeProject.type || 'Single'}
            size='small'
            sx={{
              height: 18,
              fontSize: '0.65rem',
              backgroundColor: 'rgba(144, 202, 249, 0.12)',
              color: '#90caf9',
            }}
          />
        </Box>
      )}

      {/* Rendered Output Pre */}
      <Box
        component='pre'
        sx={{
          m: 0,
          p: 1.5,
          minHeight: 100,
          backgroundColor: '#0a0a0f',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 1.5,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          fontSize: '0.85rem',
          lineHeight: 1.5,
          color: '#eceff1',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          userSelect: 'text',
        }}
      >
        {renderedPreview}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          size='small'
          variant={copied ? 'contained' : 'outlined'}
          color={copied ? 'success' : 'primary'}
          startIcon={copied ? <CheckIcon fontSize='small' /> : <ContentCopyIcon fontSize='small' />}
          onClick={handleCopy}
          sx={{
            textTransform: 'none',
            borderRadius: 1.5,
            fontSize: '0.75rem',
            px: 1.5,
          }}
        >
          {copied ? 'Preview Copied' : 'Copy Preview'}
        </Button>
      </Box>
    </Box>
  )
}
