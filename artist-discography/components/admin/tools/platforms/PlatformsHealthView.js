'use client'

import { useState } from 'react'
import {
  Box,
  Paper,
  Typography,
  Chip,
  Button,
  Grid,
  LinearProgress,
  Divider,
  Stack,
} from '@mui/material'
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import LinkIcon from '@mui/icons-material/Link'
import ShareIcon from '@mui/icons-material/Share'
import MusicNoteIcon from '@mui/icons-material/MusicNote'
import TuneIcon from '@mui/icons-material/Tune'
import BrandLinkCard from './BrandLinkCard'

export default function PlatformsHealthView({ platforms = {}, socials = {}, onSwitchTab }) {
  const [copiedKey, setCopiedKey] = useState(null)

  const handleCopyLink = (url, key) => {
    if (!url) return
    try {
      navigator.clipboard.writeText(url)
      setCopiedKey(key)
      setTimeout(() => setCopiedKey(null), 2000)
    } catch (e) {}
  }

  const platformEntries = Object.entries(platforms)
  const socialEntries = Object.entries(socials)

  const activePlatformsCount = platformEntries.filter(([_, u]) =>
    Boolean(u && typeof u === 'string' && u.trim() !== ''),
  ).length
  const activeSocialsCount = socialEntries.filter(([_, u]) =>
    Boolean(u && typeof u === 'string' && u.trim() !== ''),
  ).length

  const totalLinksCount = platformEntries.length + socialEntries.length
  const totalActiveCount = activePlatformsCount + activeSocialsCount
  const overallCoveragePct =
    totalLinksCount > 0 ? Math.round((totalActiveCount / totalLinksCount) * 100) : 0

  return (
    <Stack spacing={4}>
      {/* Top Banner / Summary Card */}
      <Paper
        elevation={2}
        sx={{
          p: 3,
          backgroundColor: 'rgba(26, 26, 38, 0.75)',
          borderRadius: 3,
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
            mb: 2.5,
          }}
        >
          <Box>
            <Typography variant='h6' sx={{ fontWeight: 800 }}>
              Artist Platforms &amp; Social Links Verification
            </Typography>
            <Typography variant='body2' sx={{ color: 'text.secondary', mt: 0.5 }}>
              Audits all 10 streaming platforms and 6 social channels defined in{' '}
              <code>data/config.json</code>
            </Typography>
          </Box>

          {onSwitchTab ? (
            <Button
              variant='contained'
              color='primary'
              startIcon={<TuneIcon />}
              onClick={() => onSwitchTab(0)}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
            >
              Edit Links in Profile &amp; Settings
            </Button>
          ) : (
            <Button
              variant='contained'
              color='primary'
              startIcon={<AdminPanelSettingsIcon />}
              href='/_sys/_admin'
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
            >
              Manage Links in Admin Portal
            </Button>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Metric Badges */}
        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                backgroundColor: 'rgba(0, 0, 0, 0.25)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              <Typography variant='caption' sx={{ color: 'text.secondary', fontWeight: 600 }}>
                Streaming Platforms
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mt: 0.5,
                }}
              >
                <Typography variant='h6' sx={{ fontWeight: 800 }}>
                  {activePlatformsCount} / {platformEntries.length} Active
                </Typography>
                <Chip
                  icon={<MusicNoteIcon fontSize='small' />}
                  label={`${Math.round((activePlatformsCount / (platformEntries.length || 1)) * 100)}%`}
                  color={activePlatformsCount === platformEntries.length ? 'success' : 'warning'}
                  size='small'
                  sx={{ fontWeight: 700 }}
                />
              </Box>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                backgroundColor: 'rgba(0, 0, 0, 0.25)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              <Typography variant='caption' sx={{ color: 'text.secondary', fontWeight: 600 }}>
                Social Channels
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mt: 0.5,
                }}
              >
                <Typography variant='h6' sx={{ fontWeight: 800 }}>
                  {activeSocialsCount} / {socialEntries.length} Active
                </Typography>
                <Chip
                  icon={<ShareIcon fontSize='small' />}
                  label={`${Math.round((activeSocialsCount / (socialEntries.length || 1)) * 100)}%`}
                  color={activeSocialsCount === socialEntries.length ? 'success' : 'warning'}
                  size='small'
                  sx={{ fontWeight: 700 }}
                />
              </Box>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                backgroundColor: 'rgba(0, 0, 0, 0.25)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              <Typography variant='caption' sx={{ color: 'text.secondary', fontWeight: 600 }}>
                Overall Link Coverage
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mt: 0.5,
                }}
              >
                <Typography variant='h6' sx={{ fontWeight: 800 }}>
                  {overallCoveragePct}% Configured
                </Typography>
                <Chip
                  icon={
                    overallCoveragePct === 100 ? (
                      <CheckCircleOutlineRoundedIcon fontSize='small' />
                    ) : (
                      <WarningAmberRoundedIcon fontSize='small' />
                    )
                  }
                  label={
                    overallCoveragePct === 100
                      ? 'Complete'
                      : `${totalLinksCount - totalActiveCount} Missing`
                  }
                  color={overallCoveragePct === 100 ? 'success' : 'error'}
                  size='small'
                  sx={{ fontWeight: 700 }}
                />
              </Box>
            </Box>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Box sx={{ mt: 1 }}>
              <LinearProgress
                variant='determinate'
                value={overallCoveragePct}
                color={
                  overallCoveragePct === 100
                    ? 'success'
                    : overallCoveragePct > 50
                      ? 'primary'
                      : 'warning'
                }
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Section 1: Streaming Platforms */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
          <LinkIcon color='primary' sx={{ fontSize: 28 }} />
          <Typography variant='h6' sx={{ fontWeight: 800 }}>
            Streaming &amp; Distribution Platforms ({activePlatformsCount}/{platformEntries.length})
          </Typography>
        </Box>

        <Grid container spacing={2.5}>
          {platformEntries.map(([key, url]) => (
            <BrandLinkCard
              key={key}
              brandKey={key}
              url={url}
              defaultCategory='Streaming Platform'
              copiedKey={copiedKey}
              onCopyLink={handleCopyLink}
            />
          ))}
        </Grid>
      </Box>

      {/* Section 2: Social Media & Channels */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
          <ShareIcon color='secondary' sx={{ fontSize: 28 }} />
          <Typography variant='h6' sx={{ fontWeight: 800 }}>
            Social Media &amp; Community Accounts ({activeSocialsCount}/{socialEntries.length})
          </Typography>
        </Box>

        <Grid container spacing={2.5}>
          {socialEntries.map(([key, url]) => (
            <BrandLinkCard
              key={key}
              brandKey={key}
              url={url}
              defaultCategory='Social Account'
              copiedKey={copiedKey}
              onCopyLink={handleCopyLink}
            />
          ))}
        </Grid>
      </Box>
    </Stack>
  )
}
