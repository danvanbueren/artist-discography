'use client'

import { memo } from 'react'
import { Grid } from '@mui/material'
import { AnalyticsProjectStreamsCard } from './AnalyticsProjectStreamsCard'
import { AnalyticsTopRankingsCard } from './AnalyticsTopRankingsCard'
import { AnalyticsRecentActivityCard } from './AnalyticsRecentActivityCard'

/**
 * 3-Column Analytics Breakdown Section:
 * 1. Streams by Project
 * 2. Top Tracks / Pages
 * 3. Recent Activity Log
 */
export const AnalyticsBreakdownCards = memo(function AnalyticsBreakdownCards({
  projectBreakdown = [],
  trackBreakdown = [],
  pageBreakdown = [],
  recentEvents = [],
}) {
  return (
    <Grid container spacing={2}>
      {/* 1. Project Streams Breakdown */}
      <Grid size={{ xs: 12, md: 4 }}>
        <AnalyticsProjectStreamsCard projectBreakdown={projectBreakdown} />
      </Grid>

      {/* 2. Top Streamed Tracks & Top Visited Pages */}
      <Grid size={{ xs: 12, md: 4 }}>
        <AnalyticsTopRankingsCard trackBreakdown={trackBreakdown} pageBreakdown={pageBreakdown} />
      </Grid>

      {/* 3. Recent Activity Log */}
      <Grid size={{ xs: 12, md: 4 }}>
        <AnalyticsRecentActivityCard recentEvents={recentEvents} />
      </Grid>
    </Grid>
  )
})
