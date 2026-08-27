'use client'

import React, { useState, useMemo, useEffect } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import ToggleButton from '@mui/material/ToggleButton'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import SearchIcon from '@mui/icons-material/Search'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import CheckIcon from '@mui/icons-material/Check'
import ViewListIcon from '@mui/icons-material/ViewList'
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import ShareProjectCard from './ShareProjectCard'
import TemplateEditor from './TemplateEditor'
import TemplatePreviewCard from './TemplatePreviewCard'
import { DEFAULT_TEMPLATE, renderAllProjectsWithTemplate } from '@/lib/data/templateEngine'

const LOCAL_STORAGE_TEMPLATE_KEY = 'discography_instagram_template'
const LOCAL_STORAGE_PRESETS_KEY = 'discography_instagram_presets'

/**
 * FormatShareProjectsSection
 * Collapsible section inside Admin Utilities for formatting and sharing project announcements.
 */
export default function FormatShareProjectsSection({
  projects = [],
  siteArtist = 'Artist',
  siteUrl = '',
  expanded = false,
  onToggle,
}) {
  const [activeTab, setActiveTab] = useState(0) // 0: Generated Output, 1: Template Builder
  const [viewMode, setViewMode] = useState('all') // 'all' (raw text) or 'cards' (list)
  const [chronological, setChronological] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedAll, setCopiedAll] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastOpen, setToastOpen] = useState(false)

  // Template state
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE)
  const [customPresets, setCustomPresets] = useState([])

  useEffect(() => {
    try {
      const savedTemplate = localStorage.getItem(LOCAL_STORAGE_TEMPLATE_KEY)
      if (savedTemplate && typeof savedTemplate === 'string') {
        setTemplate(savedTemplate)
      }
      const savedPresets = localStorage.getItem(LOCAL_STORAGE_PRESETS_KEY)
      if (savedPresets) {
        const parsed = JSON.parse(savedPresets)
        if (Array.isArray(parsed)) {
          setCustomPresets(parsed)
        }
      }
    } catch {}
  }, [])

  const handleTemplateChange = (newTemplate) => {
    setTemplate(newTemplate)
    try {
      localStorage.setItem(LOCAL_STORAGE_TEMPLATE_KEY, newTemplate)
    } catch {}
  }

  const handleSavePreset = (newPreset) => {
    const updated = [...customPresets.filter((p) => p.id !== newPreset.id), newPreset]
    setCustomPresets(updated)
    try {
      localStorage.setItem(LOCAL_STORAGE_PRESETS_KEY, JSON.stringify(updated))
    } catch {}
    setToastMessage(`Saved preset "${newPreset.name}"!`)
    setToastOpen(true)
  }

  const handleDeletePreset = (presetId) => {
    const updated = customPresets.filter((p) => p.id !== presetId)
    setCustomPresets(updated)
    try {
      localStorage.setItem(LOCAL_STORAGE_PRESETS_KEY, JSON.stringify(updated))
    } catch {}
    setToastMessage('Preset deleted.')
    setToastOpen(true)
  }

  const handleResetDefault = () => {
    handleTemplateChange(DEFAULT_TEMPLATE)
    setToastMessage('Reset template to default format.')
    setToastOpen(true)
  }

  const { posts, fullText } = useMemo(() => {
    return renderAllProjectsWithTemplate(template, projects, siteArtist, siteUrl, { chronological })
  }, [template, projects, siteArtist, siteUrl, chronological])

  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim()) return posts
    const query = searchQuery.toLowerCase().trim()
    return posts.filter(
      (p) =>
        p.project.name.toLowerCase().includes(query) ||
        (p.project.artist && p.project.artist.toLowerCase().includes(query)) ||
        (p.project.type && p.project.type.toLowerCase().includes(query)) ||
        (p.project.date && p.project.date.toLowerCase().includes(query)),
    )
  }, [posts, searchQuery])

  const currentFullText = useMemo(() => {
    if (!searchQuery.trim()) return fullText
    return filteredPosts.map((p) => p.text).join('\n\n')
  }, [fullText, filteredPosts, searchQuery])

  const handleCopyAll = () => {
    navigator.clipboard.writeText(currentFullText)
    setCopiedAll(true)
    setToastMessage(`Copied ${filteredPosts.length} post descriptions to clipboard!`)
    setToastOpen(true)
    setTimeout(() => setCopiedAll(false), 2500)
  }

  const handleIndividualCopy = (text, projectName) => {
    navigator.clipboard.writeText(text)
    setToastMessage(`Copied description for "${projectName}"!`)
    setToastOpen(true)
  }

  return (
    <Accordion
      expanded={expanded}
      onChange={onToggle}
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
        ...(expanded
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
          <AutoAwesomeIcon sx={{ color: 'primary.main', fontSize: 22 }} />
          <Box>
            <Typography variant='subtitle1' sx={{ fontWeight: 700 }}>
              Format &amp; Share Projects
            </Typography>
            <Typography variant='caption' sx={{ color: 'text.secondary' }}>
              Customizable post templates and release announcements for social media
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
          {/* Tabs Bar */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              pb: 1,
              gap: 1.5,
              flexShrink: 0,
            }}
          >
            <Tabs
              value={activeTab}
              onChange={(_, val) => setActiveTab(val)}
              textColor='primary'
              indicatorColor='primary'
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
                icon={<FormatAlignLeftIcon sx={{ fontSize: 16 }} />}
                iconPosition='start'
                label='Generated Output'
              />
              <Tab
                icon={<AutoAwesomeIcon sx={{ fontSize: 16 }} />}
                iconPosition='start'
                label='Custom Template Builder'
              />
            </Tabs>

            <Button
              variant='contained'
              color='primary'
              size='small'
              startIcon={
                copiedAll ? <CheckIcon fontSize='small' /> : <ContentCopyIcon fontSize='small' />
              }
              onClick={handleCopyAll}
              sx={{
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: 1.5,
                px: 2,
              }}
            >
              {copiedAll ? 'All Copied!' : 'Copy All Posts'}
            </Button>
          </Box>

          {/* TAB 0: GENERATED OUTPUT */}
          {activeTab === 0 && (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                flexGrow: 1,
                minHeight: 0,
                gap: 2,
              }}
            >
              {/* Controls Bar */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 1.5,
                  flexShrink: 0,
                }}
              >
                <TextField
                  size='small'
                  placeholder='Search project or artist...'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position='start'>
                          <SearchIcon sx={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: 18 }} />
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={{
                    minWidth: 240,
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#0a0a0f',
                      borderRadius: 1.5,
                      fontSize: '0.85rem',
                    },
                  }}
                />

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                  <ToggleButtonGroup
                    size='small'
                    value={chronological ? 'oldest' : 'newest'}
                    exclusive
                    onChange={(_, val) => {
                      if (val !== null) setChronological(val === 'oldest')
                    }}
                    sx={{ backgroundColor: '#0a0a0f', borderRadius: 1.5 }}
                  >
                    <ToggleButton
                      value='oldest'
                      sx={{ textTransform: 'none', px: 1.5, fontSize: '0.75rem' }}
                    >
                      <ArrowUpwardIcon sx={{ fontSize: 14, mr: 0.5 }} />
                      Oldest First
                    </ToggleButton>
                    <ToggleButton
                      value='newest'
                      sx={{ textTransform: 'none', px: 1.5, fontSize: '0.75rem' }}
                    >
                      <ArrowDownwardIcon sx={{ fontSize: 14, mr: 0.5 }} />
                      Newest First
                    </ToggleButton>
                  </ToggleButtonGroup>

                  <ToggleButtonGroup
                    size='small'
                    value={viewMode}
                    exclusive
                    onChange={(_, val) => {
                      if (val !== null) setViewMode(val)
                    }}
                    sx={{ backgroundColor: '#0a0a0f', borderRadius: 1.5 }}
                  >
                    <ToggleButton
                      value='all'
                      sx={{ textTransform: 'none', px: 1.5, fontSize: '0.75rem' }}
                    >
                      <FormatAlignLeftIcon sx={{ fontSize: 14, mr: 0.5 }} />
                      Raw Text
                    </ToggleButton>
                    <ToggleButton
                      value='cards'
                      sx={{ textTransform: 'none', px: 1.5, fontSize: '0.75rem' }}
                    >
                      <ViewListIcon sx={{ fontSize: 14, mr: 0.5 }} />
                      Cards
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Box>
              </Box>

              {/* View Output */}
              {viewMode === 'all' ? (
                <Box
                  component='textarea'
                  readOnly
                  value={currentFullText}
                  sx={{
                    width: '100%',
                    flexGrow: 1,
                    minHeight: 250,
                    backgroundColor: '#0a0a0f',
                    color: '#eceff1',
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                    fontSize: '0.875rem',
                    lineHeight: 1.6,
                    p: 2,
                    borderRadius: 1.5,
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    outline: 'none',
                    resize: 'none',
                    boxSizing: 'border-box',
                    whiteSpace: 'pre',
                    userSelect: 'text',
                    '&:focus': {
                      borderColor: '#90caf9',
                    },
                  }}
                />
              ) : (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.5,
                    overflowY: 'auto',
                    pr: 0.5,
                    flexGrow: 1,
                  }}
                >
                  {filteredPosts.map(({ project, text }, idx) => (
                    <ShareProjectCard
                      key={project.name + idx}
                      project={project}
                      postText={text}
                      index={idx}
                      onCopy={handleIndividualCopy}
                    />
                  ))}
                </Box>
              )}
            </Box>
          )}

          {/* TAB 1: TEMPLATE BUILDER */}
          {activeTab === 1 && (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', lg: '1.1fr 0.9fr' },
                gap: 2,
                alignItems: 'start',
                overflowY: 'auto',
                flexGrow: 1,
                pr: 0.5,
              }}
            >
              <TemplateEditor
                template={template}
                onChange={handleTemplateChange}
                customPresets={customPresets}
                onSavePreset={handleSavePreset}
                onDeletePreset={handleDeletePreset}
                onResetDefault={handleResetDefault}
              />

              <TemplatePreviewCard
                template={template}
                projects={projects}
                siteArtist={siteArtist}
                siteUrl={siteUrl}
              />
            </Box>
          )}

          {/* Toast Notification */}
          <Snackbar
            open={toastOpen}
            autoHideDuration={3000}
            onClose={() => setToastOpen(false)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert
              onClose={() => setToastOpen(false)}
              severity='success'
              variant='filled'
              sx={{
                borderRadius: 2,
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              }}
            >
              {toastMessage}
            </Alert>
          </Snackbar>
        </Box>
      </AccordionDetails>
    </Accordion>
  )
}
