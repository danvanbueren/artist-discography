'use client'

import { memo } from 'react'
import {
  Stack,
  Box,
  Typography,
  Button,
  ButtonGroup,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'

import { useAdminAnalytics } from './hooks/useAdminAnalytics'
import { AnalyticsMetricsCards } from './AnalyticsMetricsCards'
import { AnalyticsTimelineChart } from './AnalyticsTimelineChart'
import { AnalyticsBreakdownCards } from './AnalyticsBreakdownCards'

/**
 * AnalyticsDashboardSection
 * Collapsible analytics visualization panel embedded inside the Admin Utilities tab.
 */
export const AnalyticsDashboardSection = memo(function AnalyticsDashboardSection({
  adminPassword = '',
  expanded = true,
  onToggle,
}) {
  const {
    range,
    setRange,
    metricMode,
    setMetricMode,
    analyticsData,
    isLoading,
    isRefreshing,
    error,
    clearDialogOpen,
    setClearDialogOpen,
    isClearing,
    fetchAnalytics,
    handleClearAnalytics,
  } = useAdminAnalytics({ adminPassword })

  const summary = analyticsData?.summary || {}

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
          <InsightsRoundedIcon sx={{ color: 'primary.main', fontSize: 24 }} />
          <Box>
            <Typography variant='subtitle1' sx={{ fontWeight: 700 }}>
              Server Analytics
            </Typography>
            <Typography variant='caption' sx={{ color: 'text.secondary' }}>
              Simple JSON-backed metrics on project streams, page visits, and bandwidth usage
            </Typography>
          </Box>
        </Box>

        {analyticsData && (
          <Chip
            label={`${(summary.totalStreams || 0).toLocaleString()} streams • ${summary.totalBandwidthFormatted || '0 B'}`}
            size='small'
            sx={{
              fontWeight: 600,
              fontSize: '0.75rem',
              display: { xs: 'none', sm: 'inline-flex' },
              bgcolor: 'rgba(66, 165, 245, 0.12)',
              color: '#64b5f6',
            }}
          />
        )}
      </AccordionSummary>

      <AccordionDetails
        sx={{ px: 2.5, pt: 0, pb: 2.5, flexGrow: 1, minHeight: 0, overflowY: 'auto' }}
      >
        <Stack spacing={2.5}>
          {/* Header Action Controls */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2,
              pt: 0.5,
            }}
          >
            <Typography variant='caption' sx={{ color: 'text.secondary', fontWeight: 600 }}>
              Timeframe:{' '}
              {range === '7d' ? 'Past 7 Days' : range === 'all' ? 'All Time' : 'Past 30 Days'}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
              {/* Time Range Pills */}
              <ButtonGroup
                size='small'
                variant='outlined'
                sx={{
                  '& .MuiButton-root': {
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    px: 1.5,
                  },
                }}
              >
                <Button
                  variant={range === '7d' ? 'contained' : 'outlined'}
                  onClick={() => setRange('7d')}
                >
                  7 Days
                </Button>
                <Button
                  variant={range === '30d' ? 'contained' : 'outlined'}
                  onClick={() => setRange('30d')}
                >
                  30 Days
                </Button>
                <Button
                  variant={range === 'all' ? 'contained' : 'outlined'}
                  onClick={() => setRange('all')}
                >
                  All Time
                </Button>
              </ButtonGroup>

              {/* Refresh Action */}
              <Tooltip title='Refresh analytics' arrow>
                <span>
                  <IconButton
                    size='small'
                    onClick={fetchAnalytics}
                    disabled={isLoading || isRefreshing}
                    sx={{
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: 2,
                    }}
                  >
                    <RefreshRoundedIcon
                      sx={{
                        fontSize: 20,
                        animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
                        '@keyframes spin': {
                          '0%': { transform: 'rotate(0deg)' },
                          '100%': { transform: 'rotate(360deg)' },
                        },
                      }}
                    />
                  </IconButton>
                </span>
              </Tooltip>

              {/* Reset / Clear Data Action */}
              <Button
                size='small'
                color='error'
                variant='outlined'
                startIcon={<DeleteOutlineRoundedIcon />}
                onClick={() => setClearDialogOpen(true)}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                }}
              >
                Reset Data
              </Button>
            </Box>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert severity='error' sx={{ borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {/* Loading Skeleton / Progress */}
          {isLoading && !analyticsData ? (
            <Box
              sx={{
                py: 6,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
              }}
            >
              <CircularProgress size={32} />
              <Typography variant='caption' sx={{ color: 'text.secondary', fontWeight: 600 }}>
                Loading analytics data from disk…
              </Typography>
            </Box>
          ) : (
            analyticsData && (
              <>
                {/* 1. Key Metrics Cards */}
                <AnalyticsMetricsCards summary={analyticsData.summary} range={range} />

                {/* 2. Activity & Bandwidth Timeline Chart */}
                <AnalyticsTimelineChart
                  timeline={analyticsData.timeline || []}
                  fidelity={analyticsData.fidelity || 'day'}
                  range={range}
                  metricMode={metricMode}
                  onMetricModeChange={setMetricMode}
                />

                {/* 3. Breakdowns & Live Activity Grid */}
                <AnalyticsBreakdownCards
                  projectBreakdown={analyticsData.projectBreakdown || []}
                  trackBreakdown={analyticsData.trackBreakdown || []}
                  pageBreakdown={analyticsData.pageBreakdown || []}
                  recentEvents={analyticsData.recentEvents || []}
                />
              </>
            )
          )}

          {/* Clear Data Confirmation Dialog */}
          <Dialog
            open={clearDialogOpen}
            onClose={() => !isClearing && setClearDialogOpen(false)}
            slotProps={{
              paper: {
                sx: {
                  borderRadius: 3,
                  backgroundColor: '#161622',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  maxWidth: 440,
                },
              },
            }}
          >
            <DialogTitle sx={{ fontWeight: 800 }}>Reset Analytics Data?</DialogTitle>
            <DialogContent>
              <DialogContentText sx={{ color: 'text.secondary' }}>
                This will archive your existing metrics in a timestamped backup file in{' '}
                <code>data/backups/</code> and reset stream, page visit, and bandwidth counters.
              </DialogContentText>
            </DialogContent>
            <DialogActions sx={{ p: 2.5, pt: 1 }}>
              <Button
                onClick={() => setClearDialogOpen(false)}
                disabled={isClearing}
                sx={{ textTransform: 'none', color: 'text.secondary' }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleClearAnalytics}
                disabled={isClearing}
                color='error'
                variant='contained'
                sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
              >
                {isClearing ? 'Resetting…' : 'Confirm Reset'}
              </Button>
            </DialogActions>
          </Dialog>
        </Stack>
      </AccordionDetails>
    </Accordion>
  )
})
