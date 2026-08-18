'use client'

import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Button,
  Divider,
  Chip,
  LinearProgress,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep'
import WhatshotIcon from '@mui/icons-material/Whatshot'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import MediaJobCard from './MediaJobCard'

export default function MediaProcessingDrawer({
  open,
  onClose,
  activeJobs = [],
  completedJobs = [],
  overallProgress = 0,
  isProcessing = false,
  onTriggerWarmAll,
  onClearCompleted,
  isTriggeringWarm = false,
  adminPassword = '',
}) {
  const hasActive = activeJobs.length > 0
  const hasCompleted = completedJobs.length > 0

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100%', sm: 460 },
            maxWidth: '100vw',
            backgroundColor: '#12131c',
            backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.0))',
            color: 'text.primary',
            borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
            p: 0,
            display: 'flex',
            flexDirection: 'column',
          },
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2.5,
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: 'rgba(20, 22, 32, 0.95)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Media Processing Center
            </Typography>
            {hasActive && (
              <Chip
                size="small"
                label={`${activeJobs.length} active`}
                color="warning"
                sx={{ fontWeight: 700, height: 22 }}
              />
            )}
          </Box>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              color: 'text.secondary',
              '&:hover': { color: 'text.primary', backgroundColor: 'rgba(255, 255, 255, 0.08)' },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Global Progress Bar (if processing) */}
        {hasActive && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                Total Active Progress
              </Typography>
              <Typography variant="caption" sx={{ color: 'primary.light', fontWeight: 700 }}>
                {overallProgress}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={overallProgress}
              sx={{
                height: 6,
                borderRadius: 3,
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 3,
                  background: 'linear-gradient(90deg, #29b6f6 0%, #ab47bc 100%)',
                },
              }}
            />
          </Box>
        )}

        {/* Actions Bar */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pt: 0.5 }}>
          <Button
            size="small"
            variant="outlined"
            color="primary"
            startIcon={<WhatshotIcon />}
            disabled={isTriggeringWarm || isProcessing}
            onClick={() => onTriggerWarmAll?.(adminPassword)}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.8rem',
              flexGrow: 1,
            }}
          >
            {isTriggeringWarm ? 'Starting...' : 'Warm All Media'}
          </Button>

          {hasCompleted && (
            <Button
              size="small"
              variant="outlined"
              color="inherit"
              startIcon={<DeleteSweepIcon />}
              onClick={() => onClearCompleted?.(adminPassword)}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                color: 'text.secondary',
                fontSize: '0.8rem',
              }}
            >
              Clear Finished
            </Button>
          )}
        </Box>
      </Box>

      {/* Main Content Area */}
      <Box
        sx={{
          p: 2.5,
          flexGrow: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 2.5,
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255, 255, 255, 0.3) transparent',
          '&::-webkit-scrollbar': { width: 6 },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(255, 255, 255, 0.3)',
            borderRadius: 3,
          },
        }}
      >
        {/* Active Jobs Section */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Typography
            variant="overline"
            sx={{
              fontWeight: 800,
              letterSpacing: 1.2,
              color: hasActive ? 'warning.light' : 'text.disabled',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            Active Jobs ({activeJobs.length})
          </Typography>

          {hasActive ? (
            activeJobs.map((job) => <MediaJobCard key={job.id} job={job} />)
          ) : (
            <Box
              sx={{
                p: 3,
                borderRadius: 2.5,
                border: '1px dashed rgba(255, 255, 255, 0.12)',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <CheckCircleIcon sx={{ color: 'text.disabled', fontSize: 32 }} />
              <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                No media jobs running
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.disabled', maxWidth: 300 }}>
                Uploading track audio, cover images, or site logo will display live Sharp and FFmpeg progress here.
              </Typography>
            </Box>
          )}
        </Box>

        {/* Completed / History Section */}
        {hasCompleted && (
          <>
            <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.08)' }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Typography
                variant="overline"
                sx={{
                  fontWeight: 800,
                  letterSpacing: 1.2,
                  color: 'text.secondary',
                }}
              >
                Recent History ({completedJobs.length})
              </Typography>
              {completedJobs.map((job) => (
                <MediaJobCard key={job.id} job={job} />
              ))}
            </Box>
          </>
        )}
      </Box>
    </Drawer>
  )
}
