'use client'

import { memo } from 'react'
import { Grid, Paper, Box, Typography } from '@mui/material'
import HeadphonesRoundedIcon from '@mui/icons-material/HeadphonesRounded'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import DataUsageRoundedIcon from '@mui/icons-material/DataUsageRounded'
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded'

/**
 * Key Metrics Summary Cards for the Analytics Dashboard
 */
export const AnalyticsMetricsCards = memo(function AnalyticsMetricsCards({
  summary = {},
  range = '30d',
}) {
  const rangeLabel = range === '7d' ? 'Last 7 Days' : range === 'all' ? 'All Time' : 'Last 30 Days'

  return (
    <Grid container spacing={2}>
      {/* 1. Total Streams */}
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Paper
          variant='outlined'
          sx={{
            p: 2,
            height: '100%',
            borderRadius: 2.5,
            backgroundColor: 'rgba(26, 26, 38, 0.75)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 0.5,
            }}
          >
            <Typography
              variant='caption'
              sx={{
                color: 'text.secondary',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Total Streams
            </Typography>
            <HeadphonesRoundedIcon color='primary' sx={{ fontSize: 20 }} />
          </Box>
          <Typography variant='h4' sx={{ fontWeight: 800, my: 0.5 }}>
            {Number(summary.totalStreams || 0).toLocaleString()}
          </Typography>
          <Typography variant='caption' sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
            {summary.topTrackName && summary.topTrackName !== 'None'
              ? `Top: "${summary.topTrackName}" (${summary.topTrackStreams || 0})`
              : rangeLabel}
          </Typography>
        </Paper>
      </Grid>

      {/* 2. Total Page Views */}
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Paper
          variant='outlined'
          sx={{
            p: 2,
            height: '100%',
            borderRadius: 2.5,
            backgroundColor: 'rgba(26, 26, 38, 0.75)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 0.5,
            }}
          >
            <Typography
              variant='caption'
              sx={{
                color: 'text.secondary',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Page Views
            </Typography>
            <VisibilityRoundedIcon color='secondary' sx={{ fontSize: 20 }} />
          </Box>
          <Typography variant='h4' sx={{ fontWeight: 800, my: 0.5 }}>
            {Number(summary.totalPageViews || 0).toLocaleString()}
          </Typography>
          <Typography variant='caption' sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
            Total visits ({rangeLabel})
          </Typography>
        </Paper>
      </Grid>

      {/* 3. Bandwidth Usage */}
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Paper
          variant='outlined'
          sx={{
            p: 2,
            height: '100%',
            borderRadius: 2.5,
            backgroundColor: 'rgba(26, 26, 38, 0.75)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 0.5,
            }}
          >
            <Typography
              variant='caption'
              sx={{
                color: 'text.secondary',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Bandwidth
            </Typography>
            <DataUsageRoundedIcon sx={{ color: '#4caf50', fontSize: 20 }} />
          </Box>
          <Typography variant='h4' sx={{ fontWeight: 800, my: 0.5 }}>
            {summary.totalBandwidthFormatted || '0 B'}
          </Typography>
          <Typography variant='caption' sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
            Audio: {summary.audioBandwidthFormatted || '0 B'} • Media:{' '}
            {summary.mediaBandwidthFormatted || '0 B'}
          </Typography>
        </Paper>
      </Grid>

      {/* 4. Top Project */}
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Paper
          variant='outlined'
          sx={{
            p: 2,
            height: '100%',
            borderRadius: 2.5,
            backgroundColor: 'rgba(26, 26, 38, 0.75)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 0.5,
            }}
          >
            <Typography
              variant='caption'
              sx={{
                color: 'text.secondary',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Top Project
            </Typography>
            <EmojiEventsRoundedIcon color='info' sx={{ fontSize: 20 }} />
          </Box>
          <Typography
            variant='h6'
            noWrap
            title={summary.topProjectName || 'None'}
            sx={{ fontWeight: 800, my: 0.5 }}
          >
            {summary.topProjectName || 'None'}
          </Typography>
          <Typography variant='caption' sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
            {summary.topProjectStreams > 0
              ? `${summary.topProjectStreams} stream${summary.topProjectStreams === 1 ? '' : 's'}`
              : 'No streams yet'}
          </Typography>
        </Paper>
      </Grid>
    </Grid>
  )
})
