'use client'

import { memo, useState } from 'react'
import {
  Paper,
  Box,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  Chip,
} from '@mui/material'
import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded'
import DataUsageRoundedIcon from '@mui/icons-material/DataUsageRounded'
import { formatBytes } from '@/lib/data/analyticsUtils'

/**
 * Interactive SVG Activity and Bandwidth Timeline Chart with Adaptive Fidelity
 */
export const AnalyticsTimelineChart = memo(function AnalyticsTimelineChart({
  timeline = [],
  fidelity = 'day',
  metricMode = 'activity',
  onMetricModeChange,
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null)

  const maxActivityVal = Math.max(
    ...timeline.map((d) => Math.max(d.streams || 0, d.pageViews || 0)),
    5,
  )

  const maxBandwidthVal = Math.max(
    ...timeline.map((d) => d.bandwidthBytes || 0),
    1024 * 1024,
  )

  const chartHeight = 180
  const svgPaddingTop = 20
  const svgPaddingBottom = 30
  const availableHeight = chartHeight - svgPaddingTop - svgPaddingBottom

  const activeFidelity = timeline[0]?.fidelity || fidelity || 'day'
  const fidelityText =
    activeFidelity === 'year'
      ? 'Yearly'
      : activeFidelity === 'month'
        ? 'Monthly'
        : activeFidelity === 'week'
          ? 'Weekly'
          : 'Daily'

  const hoveredItem = hoveredIndex !== null ? timeline[hoveredIndex] : null
  const count = timeline.length

  return (
    <Paper
      variant='outlined'
      sx={{
        p: 2.5,
        borderRadius: 2.5,
        backgroundColor: 'rgba(26, 26, 38, 0.75)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1.5,
          mb: 2,
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant='subtitle1' sx={{ fontWeight: 700 }}>
              {metricMode === 'activity'
                ? 'Streams & Page Views Over Time'
                : 'Bandwidth Transferred Over Time'}
            </Typography>
            <Chip
              label={fidelityText}
              size='small'
              sx={{
                fontWeight: 700,
                fontSize: '0.7rem',
                height: 20,
                bgcolor: 'rgba(255, 255, 255, 0.08)',
                color: 'text.secondary',
              }}
            />
          </Box>
          <Typography variant='caption' sx={{ color: 'text.secondary' }}>
            {metricMode === 'activity'
              ? `${fidelityText} playback streams and web visitor interactions`
              : `${fidelityText} audio streaming and media asset transfer volume`}
          </Typography>
        </Box>

        {/* Metric Selector & Legend */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          {metricMode === 'activity' ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    bgcolor: '#42a5f5',
                  }}
                />
                <Typography variant='caption' sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  Streams
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    bgcolor: '#ab47bc',
                  }}
                />
                <Typography variant='caption' sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  Views
                </Typography>
              </Box>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  bgcolor: '#4caf50',
                }}
              />
              <Typography variant='caption' sx={{ color: 'text.secondary', fontWeight: 600 }}>
                Bytes Transferred
              </Typography>
            </Box>
          )}

          <ToggleButtonGroup
            size='small'
            value={metricMode}
            exclusive
            onChange={(_, val) => val && onMetricModeChange(val)}
            sx={{
              height: 32,
              '& .MuiToggleButton-root': {
                px: 1.5,
                py: 0.25,
                textTransform: 'none',
                fontSize: '0.75rem',
                fontWeight: 600,
              },
            }}
          >
            <ToggleButton value='activity'>
              <BarChartRoundedIcon sx={{ fontSize: 16, mr: 0.5 }} /> Activity
            </ToggleButton>
            <ToggleButton value='bandwidth'>
              <DataUsageRoundedIcon sx={{ fontSize: 16, mr: 0.5 }} /> Bandwidth
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      {/* SVG Bar Chart Container - Constrained to 100% card width with zero horizontal scrolling */}
      {count === 0 ? (
        <Box
          sx={{
            height: chartHeight,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'text.secondary',
          }}
        >
          <Typography variant='caption'>No timeline metrics available for this timeframe</Typography>
        </Box>
      ) : (
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            height: chartHeight,
            pt: 1,
          }}
        >
          <svg
            width='100%'
            height={chartHeight}
            style={{ overflow: 'visible', display: 'block' }}
          >
            {/* Horizontal Grid lines */}
            {[0, 0.5, 1].map((ratio, i) => {
              const y = svgPaddingTop + (1 - ratio) * availableHeight
              return (
                <line
                  key={i}
                  x1='0'
                  y1={y}
                  x2='100%'
                  y2={y}
                  stroke='rgba(255, 255, 255, 0.06)'
                  strokeDasharray='4 4'
                  strokeWidth='1'
                />
              )
            })}

            {/* Bars */}
            {timeline.map((item, index) => {
              const slotWidth = 100 / count
              const xCenterPct = (index + 0.5) * slotWidth
              const isHovered = hoveredIndex === index

              const shouldShowLabel =
                count <= 14 ||
                index === 0 ||
                index === count - 1 ||
                index % Math.ceil(count / 8) === 0

              if (metricMode === 'activity') {
                const streamH = ((item.streams || 0) / maxActivityVal) * availableHeight
                const viewH = ((item.pageViews || 0) / maxActivityVal) * availableHeight
                const barWidth = Math.max(3, Math.min(14, Math.floor(180 / count)))

                return (
                  <g
                    key={item.date || index}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Hover Hit Area */}
                    <rect
                      x={`${index * slotWidth}%`}
                      y={0}
                      width={`${slotWidth}%`}
                      height={chartHeight}
                      fill={isHovered ? 'rgba(255, 255, 255, 0.04)' : 'transparent'}
                    />

                    {/* Stream Bar */}
                    {streamH > 0 && (
                      <rect
                        x={`calc(${xCenterPct}% - ${barWidth + 1}px)`}
                        y={svgPaddingTop + availableHeight - streamH}
                        width={barWidth}
                        height={streamH}
                        rx={2}
                        fill={isHovered ? '#64b5f6' : '#42a5f5'}
                      />
                    )}

                    {/* View Bar */}
                    {viewH > 0 && (
                      <rect
                        x={`calc(${xCenterPct}% + 1px)`}
                        y={svgPaddingTop + availableHeight - viewH}
                        width={barWidth}
                        height={viewH}
                        rx={2}
                        fill={isHovered ? '#ba68c8' : '#ab47bc'}
                      />
                    )}

                    {/* Date label */}
                    {shouldShowLabel && (
                      <text
                        x={`${xCenterPct}%`}
                        y={chartHeight - 8}
                        textAnchor='middle'
                        fill='rgba(255, 255, 255, 0.4)'
                        fontSize='10'
                        fontFamily='monospace'
                      >
                        {item.dayLabel}
                      </text>
                    )}
                  </g>
                )
              } else {
                const bH = ((item.bandwidthBytes || 0) / maxBandwidthVal) * availableHeight
                const barWidth = Math.max(4, Math.min(28, Math.floor(280 / count)))

                return (
                  <g
                    key={item.date || index}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    style={{ cursor: 'pointer' }}
                  >
                    <rect
                      x={`${index * slotWidth}%`}
                      y={0}
                      width={`${slotWidth}%`}
                      height={chartHeight}
                      fill={isHovered ? 'rgba(255, 255, 255, 0.04)' : 'transparent'}
                    />

                    {bH > 0 && (
                      <rect
                        x={`calc(${xCenterPct}% - ${barWidth / 2}px)`}
                        y={svgPaddingTop + availableHeight - bH}
                        width={barWidth}
                        height={bH}
                        rx={3}
                        fill={isHovered ? '#81c784' : '#4caf50'}
                      />
                    )}

                    {shouldShowLabel && (
                      <text
                        x={`${xCenterPct}%`}
                        y={chartHeight - 8}
                        textAnchor='middle'
                        fill='rgba(255, 255, 255, 0.4)'
                        fontSize='10'
                        fontFamily='monospace'
                      >
                        {item.dayLabel}
                      </text>
                    )}
                  </g>
                )
              }
            })}
          </svg>
        </Box>
      )}

      {/* Dynamic Hover Details Bar */}
      <Box
        sx={{
          mt: 1.5,
          pt: 1.5,
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1,
          minHeight: 28,
        }}
      >
        {hoveredItem ? (
          <>
            <Typography variant='caption' sx={{ fontWeight: 700, color: 'text.primary' }}>
              {hoveredItem.label || hoveredItem.date}:
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Typography variant='caption' sx={{ color: '#42a5f5', fontWeight: 600 }}>
                🎵 {hoveredItem.streams || 0} Streams
              </Typography>
              <Typography variant='caption' sx={{ color: '#ab47bc', fontWeight: 600 }}>
                👁️ {hoveredItem.pageViews || 0} Page Views
              </Typography>
              <Typography variant='caption' sx={{ color: '#4caf50', fontWeight: 600 }}>
                💾 {formatBytes(hoveredItem.bandwidthBytes || 0)}
              </Typography>
            </Box>
          </>
        ) : (
          <Typography variant='caption' sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
            Hover over any {activeFidelity === 'year' ? 'year' : activeFidelity === 'month' ? 'month' : activeFidelity === 'week' ? 'week' : 'day'} bar to view detailed metrics
          </Typography>
        )}
      </Box>
    </Paper>
  )
})
