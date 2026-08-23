'use client'

import { Box, Paper, Typography, Chip, LinearProgress } from '@mui/material'
import ImageIcon from '@mui/icons-material/Image'
import GraphicEqIcon from '@mui/icons-material/GraphicEq'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty'
import FactCheckIcon from '@mui/icons-material/FactCheck'
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep'

export default function MediaJobCard({ job }) {
  if (!job) return null

  const isAudio = job.type === 'audio'
  const isValidation = job.type === 'validation'
  const isCleanup = job.type === 'cleanup'
  const isCompleted = job.status === 'completed'
  const isFailed = job.status === 'failed'
  const isProcessing = job.status === 'processing' || job.status === 'queued'

  const progressValue = typeof job.progress === 'number' ? job.progress : isCompleted ? 100 : 0

  // Color scheme based on type
  const typeLabel = isValidation
    ? 'Media Cache Audit'
    : isCleanup
      ? 'Cache Cleanup'
      : isAudio
        ? 'FFmpeg Audio'
        : 'Sharp Image'

  const progressGradient = isValidation
    ? 'linear-gradient(90deg, #00b4d8 0%, #0077b6 100%)'
    : isCleanup
      ? 'linear-gradient(90deg, #ffb74d 0%, #f57c00 100%)'
      : isAudio
        ? 'linear-gradient(90deg, #ba68c8 0%, #ab47bc 100%)'
        : 'linear-gradient(90deg, #29b6f6 0%, #0288d1 100%)'

  const iconBgColor = isValidation
    ? 'rgba(0, 180, 216, 0.18)'
    : isCleanup
      ? 'rgba(255, 152, 0, 0.18)'
      : isAudio
        ? 'rgba(186, 104, 200, 0.18)'
        : 'rgba(41, 182, 246, 0.18)'

  const iconColor = isValidation
    ? '#90e0ef'
    : isCleanup
      ? '#ffe082'
      : isAudio
        ? '#ce93d8'
        : '#81d4fa'

  const chipBgColor = isValidation
    ? 'rgba(0, 180, 216, 0.25)'
    : isCleanup
      ? 'rgba(255, 152, 0, 0.25)'
      : isAudio
        ? 'rgba(156, 39, 176, 0.25)'
        : 'rgba(2, 136, 209, 0.25)'

  const chipTextColor = isValidation
    ? '#90e0ef'
    : isCleanup
      ? '#ffe082'
      : isAudio
        ? '#e1bee7'
        : '#b3e5fc'

  const chipBorderColor = isValidation
    ? 'rgba(0, 180, 216, 0.4)'
    : isCleanup
      ? 'rgba(255, 152, 0, 0.4)'
      : isAudio
        ? 'rgba(186, 104, 200, 0.4)'
        : 'rgba(41, 182, 246, 0.4)'

  const cardBorderColor = isProcessing
    ? isValidation
      ? 'rgba(0, 180, 216, 0.4)'
      : isCleanup
        ? 'rgba(255, 152, 0, 0.4)'
        : isAudio
          ? 'rgba(186, 104, 200, 0.4)'
          : 'rgba(41, 182, 246, 0.4)'
    : isFailed
      ? 'rgba(244, 67, 54, 0.3)'
      : 'rgba(255, 255, 255, 0.08)'

  const cardBoxShadow = isProcessing
    ? `0 0 16px ${
        isValidation
          ? 'rgba(0, 180, 216, 0.15)'
          : isCleanup
            ? 'rgba(255, 152, 0, 0.15)'
            : isAudio
              ? 'rgba(186, 104, 200, 0.15)'
              : 'rgba(41, 182, 246, 0.15)'
      }`
    : 'none'

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
        borderColor: cardBorderColor,
        boxShadow: cardBoxShadow,
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
              backgroundColor: iconBgColor,
              color: iconColor,
              flexShrink: 0,
            }}
          >
            {isValidation ? (
              <FactCheckIcon fontSize='small' />
            ) : isCleanup ? (
              <DeleteSweepIcon fontSize='small' />
            ) : isAudio ? (
              <GraphicEqIcon fontSize='small' />
            ) : (
              <ImageIcon fontSize='small' />
            )}
          </Box>
          <Box sx={{ minWidth: 0, flexGrow: 1 }}>
            <Typography
              variant='subtitle2'
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
              variant='caption'
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
            size='small'
            label={typeLabel}
            sx={{
              fontWeight: 700,
              fontSize: '0.72rem',
              height: 22,
              backgroundColor: chipBgColor,
              color: chipTextColor,
              border: '1px solid',
              borderColor: chipBorderColor,
            }}
          />

          {isCompleted && (
            <Chip
              size='small'
              icon={<CheckCircleIcon sx={{ fontSize: '14px !important' }} />}
              label='Done'
              color='success'
              sx={{ fontWeight: 700, fontSize: '0.72rem', height: 22 }}
            />
          )}

          {isFailed && (
            <Chip
              size='small'
              icon={<ErrorIcon sx={{ fontSize: '14px !important' }} />}
              label='Failed'
              color='error'
              sx={{ fontWeight: 700, fontSize: '0.72rem', height: 22 }}
            />
          )}

          {isProcessing && (
            <Chip
              size='small'
              icon={<HourglassEmptyIcon sx={{ fontSize: '14px !important' }} />}
              label={`${progressValue}%`}
              color='warning'
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
          variant='caption'
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
            variant='caption'
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

      {/* Error Details Box if Job Failed */}
      {(job.error ||
        (Array.isArray(job.details?.errors) && job.details.errors.length > 0)) && (
        <Box
          sx={{
            mt: 0.5,
            p: 1.25,
            borderRadius: 2,
            backgroundColor: 'rgba(244, 67, 54, 0.15)',
            border: '1px solid rgba(244, 67, 54, 0.35)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 1,
          }}
        >
          <ErrorIcon sx={{ fontSize: 16, color: 'error.light', mt: 0.2, flexShrink: 0 }} />
          <Box sx={{ minWidth: 0, flexGrow: 1 }}>
            <Typography
              variant='caption'
              sx={{
                color: 'error.light',
                fontWeight: 700,
                display: 'block',
                fontSize: '0.72rem',
                mb: 0.25,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              Error Details:
            </Typography>
            <Typography
              variant='caption'
              sx={{
                color: '#ffcdd2',
                fontSize: '0.72rem',
                fontFamily: 'monospace',
                lineHeight: 1.4,
                wordBreak: 'break-word',
                display: 'block',
              }}
            >
              {job.error || job.details?.errors?.join('; ')}
            </Typography>
          </Box>
        </Box>
      )}

      {/* Warnings Banner if Job Encountered Non-Fatal Issues */}
      {job.details?.warnings && !job.error && (
        <Box
          sx={{
            mt: 0.5,
            p: 1.25,
            borderRadius: 2,
            backgroundColor: 'rgba(255, 152, 0, 0.12)',
            border: '1px solid rgba(255, 152, 0, 0.35)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 1,
          }}
        >
          <WarningAmberRoundedIcon
            sx={{ fontSize: 16, color: 'warning.light', mt: 0.2, flexShrink: 0 }}
          />
          <Box sx={{ minWidth: 0, flexGrow: 1 }}>
            <Typography
              variant='caption'
              sx={{
                color: 'warning.light',
                fontWeight: 700,
                display: 'block',
                fontSize: '0.72rem',
                mb: 0.25,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              Processing Warnings:
            </Typography>
            <Typography
              variant='caption'
              sx={{
                color: '#ffe082',
                fontSize: '0.72rem',
                fontFamily: 'monospace',
                lineHeight: 1.4,
                wordBreak: 'break-word',
                display: 'block',
              }}
            >
              {Array.isArray(job.details.warnings)
                ? job.details.warnings.join('; ')
                : String(job.details.warnings)}
            </Typography>
          </Box>
        </Box>
      )}

      {/* Detailed Filesystem Actions List if available */}
      {Array.isArray(job.details?.actions) && job.details.actions.length > 0 && (
        <Box
          sx={{
            mt: 0.5,
            p: 1.25,
            borderRadius: 2,
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            display: 'flex',
            flexDirection: 'column',
            gap: 0.6,
            maxHeight: 180,
            overflowY: 'auto',
            scrollbarWidth: 'thin',
          }}
        >
          <Typography
            variant='caption'
            sx={{
              fontWeight: 700,
              color: 'text.secondary',
              display: 'block',
              letterSpacing: 0.5,
              textTransform: 'uppercase',
              fontSize: '0.68rem',
            }}
          >
            Actions Taken ({job.details.actions.length}):
          </Typography>
          {job.details.actions.map((actionText, actIdx) => {
            const isWarnAction = actionText.startsWith('Warning:')
            const isNoticeAction = actionText.startsWith('Notice:')
            const actionColor = isWarnAction
              ? '#ff8a80'
              : isNoticeAction
                ? '#ffe082'
                : isValidation
                  ? '#90e0ef'
                  : '#ffe082'

            return (
              <Box
                key={actIdx}
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 0.75,
                }}
              >
                <Typography
                  variant='caption'
                  sx={{
                    color: actionColor,
                    fontSize: '0.72rem',
                    fontFamily: 'monospace',
                    lineHeight: 1.35,
                    wordBreak: 'break-all',
                    fontWeight: isWarnAction ? 600 : 400,
                  }}
                >
                  • {actionText}
                </Typography>
              </Box>
            )
          })}
        </Box>
      )}
    </Paper>
  )
}
