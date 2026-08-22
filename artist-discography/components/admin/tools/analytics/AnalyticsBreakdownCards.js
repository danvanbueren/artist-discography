'use client'

import { memo, useState } from 'react'
import {
  Grid,
  Paper,
  Box,
  Typography,
  LinearProgress,
  Tabs,
  Tab,
  Chip,
  List,
  ListItem,
  ListItemText,
} from '@mui/material'
import AlbumRoundedIcon from '@mui/icons-material/AlbumRounded'
import MusicNoteRoundedIcon from '@mui/icons-material/MusicNoteRounded'
import LanguageRoundedIcon from '@mui/icons-material/LanguageRounded'

/**
 * Project Stream Distribution & Top Tracks / Pages Breakdown Cards
 */
export const AnalyticsBreakdownCards = memo(function AnalyticsBreakdownCards({
  projectBreakdown = [],
  trackBreakdown = [],
  pageBreakdown = [],
}) {
  const [topListTab, setTopListTab] = useState('tracks') // 'tracks' | 'pages'

  return (
    <Grid container spacing={2}>
      {/* 1. Project Streams & Bandwidth Breakdown */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Paper
          variant='outlined'
          sx={{
            p: 2.5,
            height: '100%',
            borderRadius: 2.5,
            backgroundColor: 'rgba(26, 26, 38, 0.75)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AlbumRoundedIcon color='primary' sx={{ fontSize: 20 }} />
              <Typography variant='subtitle1' sx={{ fontWeight: 700 }}>
                Streams by Project
              </Typography>
            </Box>
            <Chip
              label={`${projectBreakdown.length} active`}
              size='small'
              sx={{ fontWeight: 600, fontSize: '0.75rem' }}
            />
          </Box>

          {projectBreakdown.length === 0 ? (
            <Box
              sx={{
                py: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'text.secondary',
              }}
            >
              <Typography variant='caption'>No project stream activity recorded yet</Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
              {projectBreakdown.map((item, idx) => (
                <Box key={item.slug || idx}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 0.5,
                    }}
                  >
                    <Typography
                      variant='body2'
                      sx={{ fontWeight: 600, color: 'text.primary' }}
                      noWrap
                    >
                      {item.name || item.slug}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography
                        variant='caption'
                        sx={{ color: 'text.secondary', fontFamily: 'monospace' }}
                      >
                        {item.bandwidthFormatted}
                      </Typography>
                      <Typography variant='caption' sx={{ fontWeight: 700, color: '#42a5f5' }}>
                        {item.streams} stream{item.streams === 1 ? '' : 's'} ({item.percentage}%)
                      </Typography>
                    </Box>
                  </Box>
                  <LinearProgress
                    variant='determinate'
                    value={item.percentage || 0}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: '#42a5f5',
                        borderRadius: 3,
                      },
                    }}
                  />
                </Box>
              ))}
            </Box>
          )}
        </Paper>
      </Grid>

      {/* 2. Top Streamed Tracks & Top Visited Pages */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Paper
          variant='outlined'
          sx={{
            p: 2.5,
            height: '100%',
            borderRadius: 2.5,
            backgroundColor: 'rgba(26, 26, 38, 0.75)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 1.5,
            }}
          >
            <Tabs
              value={topListTab}
              onChange={(_, val) => setTopListTab(val)}
              sx={{
                minHeight: 32,
                '& .MuiTab-root': {
                  minHeight: 32,
                  py: 0.25,
                  px: 1.5,
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  textTransform: 'none',
                },
              }}
            >
              <Tab
                value='tracks'
                label='Top Tracks'
                icon={<MusicNoteRoundedIcon sx={{ fontSize: 16 }} />}
                iconPosition='start'
              />
              <Tab
                value='pages'
                label='Top Pages'
                icon={<LanguageRoundedIcon sx={{ fontSize: 16 }} />}
                iconPosition='start'
              />
            </Tabs>
          </Box>

          {topListTab === 'tracks' ? (
            trackBreakdown.length === 0 ? (
              <Box
                sx={{
                  py: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'text.secondary',
                }}
              >
                <Typography variant='caption'>No track streams recorded yet</Typography>
              </Box>
            ) : (
              <List dense disablePadding sx={{ maxHeight: 260, overflowY: 'auto' }}>
                {trackBreakdown.map((trk, i) => (
                  <ListItem
                    key={trk.name || i}
                    disableGutters
                    sx={{
                      py: 0.75,
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                    }}
                  >
                    <Box
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: 1,
                        bgcolor: i < 3 ? 'primary.main' : 'rgba(255, 255, 255, 0.06)',
                        color: i < 3 ? '#000' : 'text.secondary',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '0.75rem',
                        mr: 1.5,
                        flexShrink: 0,
                      }}
                    >
                      {i + 1}
                    </Box>
                    <ListItemText
                      primary={trk.name}
                      slotProps={{
                        primary: {
                          variant: 'body2',
                          fontWeight: 600,
                          noWrap: true,
                        },
                      }}
                    />
                    <Chip
                      size='small'
                      label={`${trk.streams} play${trk.streams === 1 ? '' : 's'}`}
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        bgcolor: 'rgba(66, 165, 245, 0.12)',
                        color: '#64b5f6',
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            )
          ) : pageBreakdown.length === 0 ? (
            <Box
              sx={{
                py: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'text.secondary',
              }}
            >
              <Typography variant='caption'>No page views recorded yet</Typography>
            </Box>
          ) : (
            <List dense disablePadding sx={{ maxHeight: 260, overflowY: 'auto' }}>
              {pageBreakdown.map((p, i) => (
                <ListItem
                  key={p.path || i}
                  disableGutters
                  sx={{
                    py: 0.75,
                    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                  }}
                >
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: 1,
                      bgcolor: 'rgba(255, 255, 255, 0.06)',
                      color: 'text.secondary',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      mr: 1.5,
                      flexShrink: 0,
                    }}
                  >
                    {i + 1}
                  </Box>
                  <ListItemText
                    primary={p.path}
                    slotProps={{
                      primary: {
                        variant: 'body2',
                        fontFamily: 'monospace',
                        color: 'text.primary',
                        noWrap: true,
                      },
                    }}
                  />
                  <Chip
                    size='small'
                    label={`${p.visits} view${p.visits === 1 ? '' : 's'}`}
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      bgcolor: 'rgba(171, 71, 188, 0.12)',
                      color: '#ba68c8',
                    }}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
      </Grid>
    </Grid>
  )
})
