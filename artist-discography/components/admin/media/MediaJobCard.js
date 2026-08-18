'use client'

import {
  Box,
  Paper,
  Typography,
  Chip,
  LinearProgress,
} from '@mui/material'
import ImageIcon from '@mui/icons-material/Image'
import GraphicEqIcon from '@mui/icons-material/GraphicEq'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty'

export default function MediaJobCard({ job }) {
  if (!job) return null

  const isAudio = job.type === 'audio'
  const isCompleted = job.status === 'completed'
  const isFailed = job.status === 'failed'
  const isProcessing = job.status === 'processing' || job.status === 'queued'

  const progressValue = typeof job.progress === 'number' ? job.progress : (isCompleted ? 100 : 0)

  // Color scheme based on type
  const typeLabel = isAudio ? 'FFmpeg Audio' : 'Sharp Image'
  const primaryColor = isAudio ? '#9c27b0' : '#0288d1'
  const progressGradient = isAudio
    ? 'linear-gradient(90deg, #ba68c8 0%, #ab47bc 100%)'
    : 'linear-gradient(90deg, #29b6f6 0%, #0288d1 100%)'

  const durationText = job.durationMs
    ? `${(job.durationMs / 1000).toFixed(1)}s`
    : job.startTime
    ? `${Math.max(1, Math.round((Date.now() - job.startTime) / 1000))}s`
    : null

  return (
    <Paper
      elevation={1}
      sx={{
        p: 2,
        borderRadius: 2.5,
        backgroundColor: isProcessing
          ? 'rgba(30, 32, 48, 0.95)'
          : isFailed
          ? 'rgba(45, 20, 25, 0.85)'
          : 'rgba(24, 25, 35, 0.85)',
        border: '1px solid',
        borderColor: isProcessing
          ? isAudio
            ? 'rgba(186, 104, 200, 0.4)'
            : 'rgba(41, 182, 246, 0.4)'
          : isFailed
          ? 'rgba(244, 67, 54, 0.3)'
          : 'rgba(255, 255, 255, 0.08)',
        boxShadow: isProcessing
          ? `0 0 16px ${isAudio ? 'rgba(186, 104, 200, 0.15)' : 'rgba(41, 182, 246, 0.15)'}`
          : 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: 1.2,
      }}
    >
      {/* Top Header: Icon, Target Name, and Type Badge */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.2,
            minWidth: 0,
            flexGrow: 1,
          }}
        >
          <Box
            sx={{
              p: 0.8,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isAudio
                ? 'rgba(186, 104, 200, 0.18)'
                : 'rgba(41, 182, 246, 0.18)',
              color: isAudio ? '#ce93d8' : '#81d4fa',
              flexShrink: 0,
            }}
          >
            {isAudio ? <GraphicEqIcon fontSize="small" /> : <ImageIcon fontSize="small" />}
          </Box>
          <Box sx={{ minWidth: 0, flexGrow: 1 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                color: 'text.primary',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                lineHeight: 1.2,
              }}
            >
              {job.target || job.file || 'Media Processing'}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              File: {job.file || 'source file'}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
          <Chip
            size="small"
            label={typeLabel}
            sx={{
              fontWeight: 700,
              fontSize: '0.72rem',
              height: 22,
              backgroundColor: isAudio
                ? 'rgba(156, 39, 176, 0.25)'
                : 'rgba(2, 136, 209, 0.25)',
              color: isAudio ? '#e1bee7' : '#b3e5fc',
              border: '1px solid',
              borderColor: isAudio
                ? 'rgba(186, 104, 200, 0.4)'
                : 'rgba(41, 182, 246, 0.4)',
            }}
          />

          {isCompleted && (
            <Chip
              size="small"
              icon={<CheckCircleIcon sx={{ fontSize: '14px !important' }} />}
              label="Done"
              color="success"
              sx={{ fontWeight: 700, fontSize: '0.72rem', height: 22 }}
            />
          )}

          {isFailed && (
            <Chip
              size="small"
              icon={<ErrorIcon sx={{ fontSize: '14px !important' }} />}
              label="Failed"
              color="error"
              sx={{ fontWeight: 700, fontSize: '0.72rem', height: 22 }}
            />
          )}

          {isProcessing && (
            <Chip
              size="small"
              icon={<HourglassEmptyIcon sx={{ fontSize: '14px !important' }} />}
              label={`${progressValue}%`}
              color="warning"
              sx={{ fontWeight: 700, fontSize: '0.72rem', height: 22 }}
            />
          )}
        </Box>
      </Box>

      {/* Real-time Progress Bar */}
      <Box sx={{ width: '100%' }}>
        <LinearProgress
          variant={isProcessing ? 'determinate' : 'determinate'}
          value={progressValue}
          sx={{
            height: 8,
            borderRadius: 4,
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            '& .MuiLinearProgress-bar': {
              borderRadius: 4,
              background: isFailed
                ? '#f44336'
                : isCompleted
                ? 'linear-gradient(90deg, #4caf50 0%, #66bb6a 100%)'
                : progressGradient,
              transition: 'transform 0.25s ease-out',
            },
          }}
        />
      </Box>

      {/* Step Description & Status Details */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: isFailed ? 'error.light' : 'text.secondary',
            fontWeight: 500,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flexGrow: 1,
            minWidth: 0,
          }}
        >
          {job.currentStep || (isCompleted ? 'Finished successfully' : 'Processing...')}
        </Typography>

        {durationText && (
          <Typography
            variant="caption"
            sx={{
              color: 'text.disabled',
              fontSize: '0.7rem',
              flexShrink: 0,
            }}
          >
            {durationText}
          </Typography>
        )}
      </Box>
    </Paper>
  )
}
