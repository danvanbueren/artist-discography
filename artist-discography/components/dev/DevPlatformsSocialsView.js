'use client'

import { useState } from 'react'
import {
  Box,
  Paper,
  Typography,
  Chip,
  Button,
  Grid,
  Card,
  CardContent,
  Tooltip,
  IconButton,
  LinearProgress,
  Divider,
  Stack,
} from '@mui/material'

import LaunchIcon from '@mui/icons-material/Launch'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import LinkIcon from '@mui/icons-material/Link'
import ShareIcon from '@mui/icons-material/Share'
import MusicNoteIcon from '@mui/icons-material/MusicNote'

const BRAND_CONFIG = {
  spotify: { name: 'Spotify', color: '#1DB954', bg: 'rgba(29, 185, 84, 0.12)', border: 'rgba(29, 185, 84, 0.3)', category: 'Streaming Platform' },
  apple: { name: 'Apple Music', color: '#FA243C', bg: 'rgba(250, 36, 60, 0.12)', border: 'rgba(250, 36, 60, 0.3)', category: 'Streaming Platform' },
  bandcamp: { name: 'Bandcamp', color: '#1DA0C3', bg: 'rgba(29, 160, 195, 0.12)', border: 'rgba(29, 160, 195, 0.3)', category: 'Streaming Platform' },
  amazon: { name: 'Amazon Music', color: '#FF9900', bg: 'rgba(255, 153, 0, 0.12)', border: 'rgba(255, 153, 0, 0.3)', category: 'Streaming Platform' },
  youtube: { name: 'YouTube', color: '#FF0000', bg: 'rgba(255, 0, 0, 0.12)', border: 'rgba(255, 0, 0, 0.3)', category: 'Video & Streaming' },
  soundcloud: { name: 'SoundCloud', color: '#FF5500', bg: 'rgba(255, 85, 0, 0.12)', border: 'rgba(255, 85, 0, 0.3)', category: 'Streaming Platform' },
  tidal: { name: 'Tidal', color: '#00FFFF', bg: 'rgba(0, 255, 255, 0.12)', border: 'rgba(0, 255, 255, 0.3)', category: 'Streaming Platform' },
  deezer: { name: 'Deezer', color: '#A238FF', bg: 'rgba(162, 56, 255, 0.12)', border: 'rgba(162, 56, 255, 0.3)', category: 'Streaming Platform' },
  pandora: { name: 'Pandora', color: '#2240D5', bg: 'rgba(34, 64, 213, 0.12)', border: 'rgba(34, 64, 213, 0.3)', category: 'Streaming Platform' },
  itunes: { name: 'iTunes', color: '#EA4CC0', bg: 'rgba(234, 76, 192, 0.12)', border: 'rgba(234, 76, 192, 0.3)', category: 'Digital Store' },
  instagram: { name: 'Instagram', color: '#E4405F', bg: 'rgba(228, 64, 95, 0.12)', border: 'rgba(228, 64, 95, 0.3)', category: 'Social Account' },
  x: { name: 'X (Twitter)', color: '#1DA1F2', bg: 'rgba(29, 161, 242, 0.12)', border: 'rgba(29, 161, 242, 0.3)', category: 'Social Account' },
  tiktok: { name: 'TikTok', color: '#00F2FE', bg: 'rgba(0, 242, 254, 0.12)', border: 'rgba(0, 242, 254, 0.3)', category: 'Social Account' },
  facebook: { name: 'Facebook', color: '#1877F2', bg: 'rgba(24, 119, 242, 0.12)', border: 'rgba(24, 119, 242, 0.3)', category: 'Social Account' },
  discord: { name: 'Discord', color: '#5865F2', bg: 'rgba(88, 101, 242, 0.12)', border: 'rgba(88, 101, 242, 0.3)', category: 'Community Hub' },
  snapchat: { name: 'Snapchat', color: '#FFFC00', bg: 'rgba(255, 252, 0, 0.12)', border: 'rgba(255, 252, 0, 0.3)', category: 'Social Account' },
}

export default function DevPlatformsSocialsView({ platforms = {}, socials = {} }) {
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

  const activePlatformsCount = platformEntries.filter(([_, u]) => Boolean(u && typeof u === 'string' && u.trim() !== '')).length
  const activeSocialsCount = socialEntries.filter(([_, u]) => Boolean(u && typeof u === 'string' && u.trim() !== '')).length

  const totalLinksCount = platformEntries.length + socialEntries.length
  const totalActiveCount = activePlatformsCount + activeSocialsCount
  const overallCoveragePct = totalLinksCount > 0 ? Math.round((totalActiveCount / totalLinksCount) * 100) : 0

  const renderLinkCard = (key, url, defaultCategory) => {
    const brand = BRAND_CONFIG[key.toLowerCase()] || {
      name: key.charAt(0).toUpperCase() + key.slice(1),
      color: '#90caf9',
      bg: 'rgba(144, 202, 249, 0.1)',
      border: 'rgba(144, 202, 249, 0.25)',
      category: defaultCategory,
    }

    const hasUrl = Boolean(url && typeof url === 'string' && url.trim() !== '')
    const iconPath = `/platforms/${key.toLowerCase()}.webp`

    const cardBg = hasUrl ? 'rgba(46, 125, 50, 0.2)' : 'rgba(211, 47, 47, 0.16)'
    const cardBorder = hasUrl ? '1px solid rgba(76, 175, 80, 0.55)' : '1px solid rgba(244, 67, 54, 0.45)'
    const dotColor = hasUrl ? '#4caf50' : '#f44336'
    const shadowColor = hasUrl ? 'rgba(76, 175, 80, 0.35)' : 'rgba(244, 67, 54, 0.35)'

    return (
      <Grid key={key} size={{ xs: 12, sm: 6, md: 4 }}>
        <Card
          variant="outlined"
          sx={{
            height: '100%',
            backgroundColor: cardBg,
            border: cardBorder,
            borderRadius: 2.5,
            transition: 'all 0.2s ease-in-out',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            '&:hover': {
              borderColor: hasUrl ? '#4caf50' : '#f44336',
              transform: 'translateY(-2px)',
              boxShadow: `0 8px 24px -4px ${shadowColor}`,
            },
          }}
        >
          <CardContent sx={{ p: 2.5, flexGrow: 1 }}>
            {/* Header: Dot, Platform Icon & Name, Status Badge */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: dotColor,
                    boxShadow: `0 0 10px ${dotColor}`,
                    flexShrink: 0,
                  }}
                />
                <Box
                  component="img"
                  src={iconPath}
                  alt={brand.name}
                  onError={(e) => { e.target.style.display = 'none' }}
                  sx={{ width: 24, height: 24, borderRadius: 1, objectFit: 'contain' }}
                />
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                    {brand.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                    {brand.category}
                  </Typography>
                </Box>
              </Box>

              <Chip
                icon={hasUrl ? <CheckCircleOutlineRoundedIcon fontSize="small" /> : <WarningAmberRoundedIcon fontSize="small" />}
                label={hasUrl ? 'Active' : 'Missing'}
                color={hasUrl ? 'success' : 'error'}
                variant="filled"
                size="small"
                sx={{
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  height: 24,
                  backgroundColor: hasUrl ? 'rgba(76, 175, 80, 0.3)' : 'rgba(244, 67, 54, 0.3)',
                  borderColor: hasUrl ? 'rgba(76, 175, 80, 0.6)' : 'rgba(244, 67, 54, 0.6)',
                }}
              />
            </Box>

            {/* URL Text / Placeholder Display */}
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                backgroundColor: hasUrl ? 'rgba(27, 94, 32, 0.3)' : 'rgba(183, 28, 28, 0.25)',
                border: hasUrl ? '1px solid rgba(76, 175, 80, 0.4)' : '1px solid rgba(244, 67, 54, 0.35)',
                minHeight: 52,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {hasUrl ? (
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: '0.8rem',
                    color: '#a5d6a7',
                    wordBreak: 'break-all',
                    lineClamp: 2,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {url}
                </Typography>
              ) : (
                <Typography variant="caption" sx={{ color: '#ef9a9a', fontStyle: 'italic' }}>
                  No URL configured in artist-data.json
                </Typography>
              )}
            </Box>
          </CardContent>

          {/* Bottom Action Footer */}
          <Box
            sx={{
              px: 2.5,
              py: 1.5,
              borderTop: hasUrl ? '1px solid rgba(76, 175, 80, 0.25)' : '1px solid rgba(244, 67, 54, 0.25)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: hasUrl ? 'rgba(20, 50, 25, 0.4)' : 'rgba(50, 20, 25, 0.4)',
            }}
          >
            <Typography variant="caption" sx={{ color: hasUrl ? 'success.light' : 'error.light', fontWeight: 700 }}>
              {hasUrl ? 'Link Configured' : 'Unconfigured'}
            </Typography>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title={copiedKey === key ? 'Copied!' : 'Copy Link'}>
                <span>
                  <IconButton
                    size="small"
                    disabled={!hasUrl}
                    onClick={() => handleCopyLink(url, key)}
                    sx={{ color: copiedKey === key ? 'success.main' : 'text.secondary' }}
                  >
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>

              <Tooltip title={hasUrl ? 'Open Link' : 'Unconfigured'}>
                <span>
                  <IconButton
                    size="small"
                    component={hasUrl ? 'a' : 'button'}
                    href={hasUrl ? url : undefined}
                    target={hasUrl ? '_blank' : undefined}
                    rel={hasUrl ? 'noopener noreferrer' : undefined}
                    disabled={!hasUrl}
                    sx={{ color: hasUrl ? 'success.light' : 'text.disabled' }}
                  >
                    <LaunchIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          </Box>
        </Card>
      </Grid>
    )
  }

  return (
    <Stack spacing={4}>
      {/* Top Coverage Dashboard Summary */}
      <Paper
        elevation={3}
        sx={{
          p: 3,
          borderRadius: 3,
          backgroundColor: 'rgba(26, 26, 38, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Grid container spacing={3} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <LinkIcon color="primary" sx={{ fontSize: 28 }} />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  Platforms & Social Accounts Link Health
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Configuration audit across streaming services, digital stores, and social channels
                </Typography>
              </Box>
            </Box>

            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <LinearProgress
                variant="determinate"
                value={overallCoveragePct}
                sx={{
                  flexGrow: 1,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 5,
                    backgroundColor: overallCoveragePct > 70 ? '#4caf50' : overallCoveragePct > 40 ? '#ff9800' : '#f44336',
                  },
                }}
              />
              <Typography variant="subtitle2" sx={{ fontWeight: 800, minWidth: 90 }}>
                {overallCoveragePct}% Active
              </Typography>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, md: 5 }}>
            <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' }, alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
              <Chip
                icon={<MusicNoteIcon />}
                label={`${activePlatformsCount} / ${platformEntries.length} Platforms`}
                color="primary"
                variant="outlined"
                sx={{ fontWeight: 700 }}
              />
              <Chip
                icon={<ShareIcon />}
                label={`${activeSocialsCount} / ${socialEntries.length} Socials`}
                color="secondary"
                variant="outlined"
                sx={{ fontWeight: 700 }}
              />
              <Button
                variant="contained"
                color="secondary"
                size="small"
                startIcon={<AdminPanelSettingsIcon />}
                href="/sys/admin"
                target="_blank"
                rel="noopener noreferrer"
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
              >
                Edit in Admin
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* SECTION 1: Music Streaming Platforms & Stores */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
          <MusicNoteIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Streaming Platforms & Digital Stores ({activePlatformsCount} Configured)
          </Typography>
        </Box>

        <Grid container spacing={2.5}>
          {platformEntries.map(([key, url]) => renderLinkCard(key, url, 'Streaming Platform'))}
        </Grid>
      </Box>

      <Divider sx={{ my: 1 }} />

      {/* SECTION 2: Social Accounts & Community Hubs */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
          <ShareIcon color="secondary" />
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Social Media & Community Accounts ({activeSocialsCount} Configured)
          </Typography>
        </Box>

        <Grid container spacing={2.5}>
          {socialEntries.map(([key, url]) => renderLinkCard(key, url, 'Social Account'))}
        </Grid>
      </Box>
    </Stack>
  )
}
