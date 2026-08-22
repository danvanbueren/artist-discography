'use client'

import { memo, useState } from 'react'
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Typography,
  Chip,
  List,
  ListItem,
  ListItemText,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded'
import HeadphonesRoundedIcon from '@mui/icons-material/HeadphonesRounded'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'

function formatEventRelativeTime(timestamp) {
  if (!timestamp) return ''
  const diffSec = Math.max(0, Math.floor((Date.now() - timestamp) / 1000))
  if (diffSec < 60) return 'Just now'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDays = Math.floor(diffHr / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  const d = new Date(timestamp)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
}

/**
 * Collapsible Live / Recent Activity Stream Feed Component
 */
export const AnalyticsRecentFeed = memo(function AnalyticsRecentFeed({ recentEvents = [] }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <Accordion
      expanded={expanded}
      onChange={(_, isExp) => setExpanded(isExp)}
      sx={{
        borderRadius: 2.5,
        backgroundColor: 'rgba(26, 26, 38, 0.75)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        '&:before': { display: 'none' },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          px: 2.5,
          minHeight: 56,
          '& .MuiAccordionSummary-content': {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pr: 1,
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <HistoryRoundedIcon color='primary' sx={{ fontSize: 20 }} />
          <Typography variant='subtitle1' sx={{ fontWeight: 700 }}>
            Recent Activity Log
          </Typography>
        </Box>
        <Chip
          label={`${recentEvents.length} recent events`}
          size='small'
          sx={{ fontWeight: 600, fontSize: '0.75rem' }}
        />
      </AccordionSummary>

      <AccordionDetails sx={{ px: 2.5, pt: 0, pb: 2.5 }}>
        {recentEvents.length === 0 ? (
          <Box sx={{ py: 3, textAlign: 'center', color: 'text.secondary' }}>
            <Typography variant='caption'>No recent activity recorded yet</Typography>
          </Box>
        ) : (
          <List dense disablePadding sx={{ maxHeight: 320, overflowY: 'auto' }}>
            {recentEvents.map((evt) => {
              const isStream = evt.type === 'stream'
              return (
                <ListItem
                  key={evt.id}
                  disableGutters
                  sx={{
                    py: 0.75,
                    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
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
                      <Typography variant='caption' sx={{ color: 'text.secondary' }} noWrap>
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
                      flexShrink: 0,
                      ml: 2,
                    }}
                  >
                    {formatEventRelativeTime(evt.timestamp)}
                  </Typography>
                </ListItem>
              )
            })}
          </List>
        )}
      </AccordionDetails>
    </Accordion>
  )
})
