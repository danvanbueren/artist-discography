'use client'

import { memo } from 'react'
import { Paper, Box, Typography, LinearProgress, Chip } from '@mui/material'
import AlbumRoundedIcon from '@mui/icons-material/AlbumRounded'

/**
 * AnalyticsProjectStreamsCard
 * Displays stream distribution, percentages, and bandwidth usage per project.
 */
export const AnalyticsProjectStreamsCard = memo(function AnalyticsProjectStreamsCard({
  projectBreakdown = [],
}) {
  return (
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
          minHeight: 32,
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
            flexGrow: 1,
          }}
        >
          <Typography variant='caption'>No project stream activity recorded yet</Typography>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            maxHeight: 280,
            overflowY: 'auto',
            pr: 0.5,
          }}
        >
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
  )
})
