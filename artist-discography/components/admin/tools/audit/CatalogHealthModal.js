'use client'

import { memo } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Chip,
  Button,
  IconButton,
  Divider,
  Alert,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import StorageRoundedIcon from '@mui/icons-material/StorageRounded'
import LibraryMusicRoundedIcon from '@mui/icons-material/LibraryMusicRounded'

export const CatalogHealthModal = memo(function CatalogHealthModal({
  open = false,
  onClose,
  health = {},
  projects = [],
}) {
  const fileIssues = Array.isArray(health?.issues) ? health.issues : []

  // Check project-level asset issues
  const projectAssetIssues = []
  projects.forEach((proj) => {
    const projName = proj.name || 'Untitled Project'
    if (!proj.cover && !proj.hasCover) {
      projectAssetIssues.push(`Project "${projName}": Missing cover artwork.`)
    }
    const trks = proj.tracks || []
    const missingAudio = trks.filter((t) => !t.hasAudio && !t.audioUrl && !t.audio).length
    if (missingAudio > 0) {
      projectAssetIssues.push(
        `Project "${projName}": ${missingAudio} of ${trks.length} track(s) missing audio master.`,
      )
    }
  })

  const totalIssuesCount = fileIssues.length + projectAssetIssues.length
  const isHealthy = Boolean((health?.isHealthy ?? true) && totalIssuesCount === 0)

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth='sm'
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
            backgroundColor: 'rgba(20, 20, 30, 0.95)',
            backgroundImage: 'none',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 16px 48px rgba(0, 0, 0, 0.7)',
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1.5,
          pt: 2.5,
          px: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant='h6' sx={{ fontWeight: 800 }}>
            Data File &amp; Catalog Health
          </Typography>
          <Chip
            icon={isHealthy ? <CheckCircleOutlineRoundedIcon /> : <WarningAmberRoundedIcon />}
            label={
              isHealthy
                ? 'Valid & Healthy'
                : `${totalIssuesCount} Warning${totalIssuesCount === 1 ? '' : 's'}`
            }
            color={isHealthy ? 'success' : 'warning'}
            size='small'
            sx={{ fontWeight: 700 }}
          />
        </Box>
        <IconButton
          size='small'
          onClick={onClose}
          sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
        >
          <CloseIcon fontSize='small' />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 3, py: 1.5 }}>
        {/* Status Summary Banner */}
        {isHealthy ? (
          <Alert
            severity='success'
            icon={<CheckCircleOutlineRoundedIcon />}
            sx={{ borderRadius: 2, mb: 3 }}
          >
            All configuration files, project metadata, artwork files, and audio tracks are verified
            with zero integrity issues.
          </Alert>
        ) : (
          <Alert
            severity='warning'
            icon={<WarningAmberRoundedIcon />}
            sx={{ borderRadius: 2, mb: 3 }}
          >
            Found {totalIssuesCount} item{totalIssuesCount === 1 ? '' : 's'} requiring attention in
            your discography files.
          </Alert>
        )}

        {/* Section 1: Data File Health Log */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <StorageRoundedIcon color='primary' sx={{ fontSize: 20 }} />
            <Typography variant='subtitle2' sx={{ fontWeight: 700 }}>
              Data File &amp; System Integrity Log
            </Typography>
          </Box>
          {fileIssues.length > 0 ? (
            <Box
              component='ul'
              sx={{
                m: 0,
                pl: 2.5,
                display: 'flex',
                flexDirection: 'column',
                gap: 0.75,
                backgroundColor: 'rgba(0, 0, 0, 0.25)',
                p: 2,
                borderRadius: 2,
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              {fileIssues.map((issue, idx) => (
                <li key={idx}>
                  <Typography variant='body2' sx={{ color: 'text.primary', lineHeight: 1.5 }}>
                    {issue}
                  </Typography>
                </li>
              ))}
            </Box>
          ) : (
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                backgroundColor: 'rgba(46, 125, 50, 0.08)',
                border: '1px solid rgba(76, 175, 80, 0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <CheckCircleOutlineRoundedIcon color='success' sx={{ fontSize: 18 }} />
              <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                <code>data/config.json</code> and all project files have valid JSON syntax and
                schema.
              </Typography>
            </Box>
          )}
        </Box>

        <Divider sx={{ my: 2.5, borderColor: 'rgba(255, 255, 255, 0.08)' }} />

        {/* Section 2: Catalog Media & Asset Warnings */}
        <Box sx={{ mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <LibraryMusicRoundedIcon color='secondary' sx={{ fontSize: 20 }} />
            <Typography variant='subtitle2' sx={{ fontWeight: 700 }}>
              Catalog Asset Coverage &amp; Media Warnings
            </Typography>
          </Box>
          {projectAssetIssues.length > 0 ? (
            <Box
              component='ul'
              sx={{
                m: 0,
                pl: 2.5,
                display: 'flex',
                flexDirection: 'column',
                gap: 0.75,
                backgroundColor: 'rgba(0, 0, 0, 0.25)',
                p: 2,
                borderRadius: 2,
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              {projectAssetIssues.map((issue, idx) => (
                <li key={idx}>
                  <Typography variant='body2' sx={{ color: 'text.primary', lineHeight: 1.5 }}>
                    {issue}
                  </Typography>
                </li>
              ))}
            </Box>
          ) : (
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                backgroundColor: 'rgba(46, 125, 50, 0.08)',
                border: '1px solid rgba(76, 175, 80, 0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <CheckCircleOutlineRoundedIcon color='success' sx={{ fontSize: 18 }} />
              <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                All {projects.length} releases have cover artwork and all tracks have audio files.
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
        <Button
          variant='contained'
          onClick={onClose}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, px: 3 }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
})
