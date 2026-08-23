'use client'

import { memo } from 'react'
import {
  Paper,
  Box,
  Typography,
  Chip,
  List,
  ListItem,
} from '@mui/material'
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded'
import HeadphonesRoundedIcon from '@mui/icons-material/HeadphonesRounded'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import { formatEventRelativeTime } from '@/lib/data/analyticsUtils'

/**
 * AnalyticsRecentActivityCard
 * Displays a live, scrollable feed of the latest stream and page-view events.
 */
export const AnalyticsRecentActivityCard = memo(function AnalyticsRecentActivityCard({
  recentEvents = [],
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
      {/* Header */}
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
          <HistoryRoundedIcon color='primary' sx={{ fontSize: 20 }} />
          <Typography variant='subtitle1' sx={{ fontWeight: 700 }}>
            Recent Activity
          </Typography>
        </Box>
        <Chip
          label={`${recentEvents.length} recent`}
          size='small'
          sx={{ fontWeight: 600, fontSize: '0.75rem' }}
        />
      </Box>

      {/* Events Feed List */}
      {recentEvents.length === 0 ? (
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
          <Typography variant='caption'>No recent activity recorded yet</Typography>
        </Box>
      ) : (
        <List
          dense
          disablePadding
          sx={{ maxHeight: 280, overflowY: 'auto', pr: 0.5 }}
        >
          {recentEvents.map((evt) => {
            const isStream = evt.type === 'stream'
            return (
              <ListItem
                key={evt.id || `${evt.timestamp}-${evt.track || evt.path}`}
                disableGutters
                sx={{
                  py: 0.75,
                  borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 1,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: 1.5,
                      bgcolor: isStream ? 'rgba(66, 165, 245, 0.15)' : 'rgba(171, 71, 188, 0.15)',
                      color: isStream ? '#42a5f5' : '#ab47bc',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {isStream ? (
                      <HeadphonesRoundedIcon sx={{ fontSize: 16 }} />
                    ) : (
                      <VisibilityRoundedIcon sx={{ fontSize: 16 }} />
                    )}
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      variant='body2'
                      sx={{ fontWeight: 600, color: 'text.primary' }}
                      noWrap
                    >
                      {isStream
                        ? `Streamed "${evt.track || 'Track'}"`
                        : `Viewed page "${evt.path || '/'}"`}
                    </Typography>
                    <Typography
                      variant='caption'
                      sx={{ color: 'text.secondary' }}
                      noWrap
                      display='block'
                    >
                      {isStream
                        ? `Project: ${evt.project || evt.projectSlug || 'Catalog'}`
                        : `Referrer: ${evt.referrer || 'direct'}`}
                    </Typography>
                  </Box>
                </Box>

                <Typography
                  variant='caption'
                  sx={{
                    color: 'text.secondary',
                    fontFamily: 'monospace',
                    fontSize: '0.7rem',
                    flexShrink: 0,
                    ml: 1,
                  }}
                >
                  {formatEventRelativeTime(evt.timestamp)}
                </Typography>
              </ListItem>
            )
          })}
        </List>
      )}
    </Paper>
  )
})
