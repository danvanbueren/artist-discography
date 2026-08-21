'use client'

import { Grid, Paper, Box, Typography, LinearProgress, Chip } from '@mui/material'
import AlbumIcon from '@mui/icons-material/Album'
import MusicNoteIcon from '@mui/icons-material/MusicNote'
import LinkIcon from '@mui/icons-material/Link'
import SecurityIcon from '@mui/icons-material/Security'

export default function DevMetricsCards({
  projects = [],
  totalTracksCount = 0,
  coverCoveragePct = 0,
  audioCoveragePct = 0,
  totalPlatformLinksCount = 0,
  adminAccess = false,
}) {
  return (
    <Grid container spacing={2.5}>
      {/* Total Projects Card */}
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Paper
          elevation={2}
          sx={{
            p: 2.5,
            height: '100%',
            borderRadius: 3,
            backgroundColor: 'rgba(25, 25, 35, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}
          >
            <Typography variant='subtitle2' sx={{ color: 'text.secondary', fontWeight: 600 }}>
              Total Projects
            </Typography>
            <AlbumIcon color='primary' />
          </Box>
          <Typography variant='h4' sx={{ fontWeight: 800, my: 0.5 }}>
            {projects.length}
          </Typography>
          <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <LinearProgress
              variant='determinate'
              value={coverCoveragePct}
              sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
            />
            <Typography variant='caption' sx={{ color: 'text.secondary' }}>
              {coverCoveragePct}% covers
            </Typography>
          </Box>
        </Paper>
      </Grid>

      {/* Total Tracks Card */}
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Paper
          elevation={2}
          sx={{
            p: 2.5,
            height: '100%',
            borderRadius: 3,
            backgroundColor: 'rgba(25, 25, 35, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}
          >
            <Typography variant='subtitle2' sx={{ color: 'text.secondary', fontWeight: 600 }}>
              Total Tracks
            </Typography>
            <MusicNoteIcon color='secondary' />
          </Box>
          <Typography variant='h4' sx={{ fontWeight: 800, my: 0.5 }}>
            {totalTracksCount}
          </Typography>
          <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <LinearProgress
              variant='determinate'
              color='secondary'
              value={audioCoveragePct}
              sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
            />
            <Typography variant='caption' sx={{ color: 'text.secondary' }}>
              {audioCoveragePct}% audio
            </Typography>
          </Box>
        </Paper>
      </Grid>

      {/* Streaming Links Card */}
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Paper
          elevation={2}
          sx={{
            p: 2.5,
            height: '100%',
            borderRadius: 3,
            backgroundColor: 'rgba(25, 25, 35, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}
          >
            <Typography variant='subtitle2' sx={{ color: 'text.secondary', fontWeight: 600 }}>
              Streaming Links
            </Typography>
            <LinkIcon color='info' />
          </Box>
          <Typography variant='h4' sx={{ fontWeight: 800, my: 0.5 }}>
            {totalPlatformLinksCount}
          </Typography>
          <Typography variant='caption' sx={{ color: 'text.secondary', display: 'block', mt: 1 }}>
            Active platform URLs configured
          </Typography>
        </Paper>
      </Grid>

      {/* System Access Card */}
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Paper
          elevation={2}
          sx={{
            p: 2.5,
            height: '100%',
            borderRadius: 3,
            backgroundColor: 'rgba(25, 25, 35, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}
          >
            <Typography variant='subtitle2' sx={{ color: 'text.secondary', fontWeight: 600 }}>
              System Access
            </Typography>
            <SecurityIcon color={adminAccess ? 'warning' : 'success'} />
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', my: 0.5 }}>
            <Chip
              label={`Admin: ${adminAccess ? 'OPEN' : 'LOCKED'}`}
              color={adminAccess ? 'error' : 'default'}
              size='small'
              sx={{ fontWeight: 700 }}
            />
          </Box>
          <Typography variant='caption' sx={{ color: 'text.secondary', display: 'block', mt: 1 }}>
            Access status in config.json
          </Typography>
        </Paper>
      </Grid>
    </Grid>
  )
}
