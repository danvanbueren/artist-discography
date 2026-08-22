'use client'

import { memo } from 'react'
import { Grid, Paper, Box, Typography, LinearProgress } from '@mui/material'
import AlbumIcon from '@mui/icons-material/Album'
import MusicNoteIcon from '@mui/icons-material/MusicNote'
import GraphicEqIcon from '@mui/icons-material/GraphicEq'
import ImageIcon from '@mui/icons-material/Image'

export const AuditMetricsCards = memo(function AuditMetricsCards({
  projectsCount = 0,
  totalTracksCount = 0,
  tracksWithAudioCount = 0,
  projectsWithCoverCount = 0,
  audioCoveragePct = 0,
  coverCoveragePct = 0,
}) {
  return (
    <Grid container spacing={2}>
      {/* 1. Total Projects */}
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
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}
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
              Total Projects
            </Typography>
            <AlbumIcon color='primary' sx={{ fontSize: 20 }} />
          </Box>
          <Typography variant='h4' sx={{ fontWeight: 800, my: 0.5 }}>
            {projectsCount}
          </Typography>
          <Typography variant='caption' sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
            {projectsCount === 1 ? '1 release in catalog' : `${projectsCount} releases in catalog`}
          </Typography>
        </Paper>
      </Grid>

      {/* 2. Total Tracks */}
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
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}
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
              Total Tracks
            </Typography>
            <MusicNoteIcon color='secondary' sx={{ fontSize: 20 }} />
          </Box>
          <Typography variant='h4' sx={{ fontWeight: 800, my: 0.5 }}>
            {totalTracksCount}
          </Typography>
          <Typography variant='caption' sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
            {projectsCount > 0
              ? `${(totalTracksCount / projectsCount).toFixed(1)} avg tracks / release`
              : '0 tracks configured'}
          </Typography>
        </Paper>
      </Grid>

      {/* 3. Audio Files Ready */}
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
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}
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
              Audio Files Ready
            </Typography>
            <GraphicEqIcon sx={{ color: '#4caf50', fontSize: 20 }} />
          </Box>
          <Typography variant='h4' sx={{ fontWeight: 800, my: 0.5 }}>
            {tracksWithAudioCount} / {totalTracksCount}
          </Typography>
          <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
            <LinearProgress
              variant='determinate'
              value={audioCoveragePct}
              sx={{
                flexGrow: 1,
                height: 6,
                borderRadius: 3,
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: '#4caf50',
                  borderRadius: 3,
                },
              }}
            />
            <Typography
              variant='caption'
              sx={{ color: 'text.secondary', fontWeight: 700, minWidth: 32 }}
            >
              {audioCoveragePct}%
            </Typography>
          </Box>
        </Paper>
      </Grid>

      {/* 4. Artwork Ready */}
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
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}
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
              Artwork Ready
            </Typography>
            <ImageIcon color='info' sx={{ fontSize: 20 }} />
          </Box>
          <Typography variant='h4' sx={{ fontWeight: 800, my: 0.5 }}>
            {projectsWithCoverCount} / {projectsCount}
          </Typography>
          <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
            <LinearProgress
              variant='determinate'
              value={coverCoveragePct}
              color='info'
              sx={{
                flexGrow: 1,
                height: 6,
                borderRadius: 3,
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
              }}
            />
            <Typography
              variant='caption'
              sx={{ color: 'text.secondary', fontWeight: 700, minWidth: 32 }}
            >
              {coverCoveragePct}%
            </Typography>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  )
})
