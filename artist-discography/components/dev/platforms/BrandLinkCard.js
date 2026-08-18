'use client'

import { memo } from 'react'
import {
  Grid,
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  Button,
  IconButton,
  Tooltip,
} from '@mui/material'
import LaunchIcon from '@mui/icons-material/Launch'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import { BRAND_CONFIG } from '../devConstants'

const BrandLinkCard = memo(function BrandLinkCard({
  brandKey,
  url,
  defaultCategory = 'Streaming Platform',
  copiedKey,
  onCopyLink,
}) {
  const brand = BRAND_CONFIG[brandKey.toLowerCase()] || {
    name: brandKey.charAt(0).toUpperCase() + brandKey.slice(1),
    color: '#90caf9',
    bg: 'rgba(144, 202, 249, 0.1)',
    border: 'rgba(144, 202, 249, 0.25)',
    category: defaultCategory,
  }

  const hasUrl = Boolean(url && typeof url === 'string' && url.trim() !== '')
  const iconPath = `/platforms/${brandKey.toLowerCase()}.webp`

  const cardBg = hasUrl ? 'rgba(46, 125, 50, 0.2)' : 'rgba(211, 47, 47, 0.16)'
  const cardBorder = hasUrl ? '1px solid rgba(76, 175, 80, 0.55)' : '1px solid rgba(244, 67, 54, 0.45)'
  const dotColor = hasUrl ? '#4caf50' : '#f44336'
  const shadowColor = hasUrl ? 'rgba(76, 175, 80, 0.35)' : 'rgba(244, 67, 54, 0.35)'

  return (
    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
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

          {/* URL Display Area */}
          <Box
            sx={{
              p: 1.5,
              borderRadius: 1.5,
              backgroundColor: 'rgba(0, 0, 0, 0.35)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              mb: 2,
              minHeight: 48,
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
                  color: 'text.primary',
                  wordBreak: 'break-all',
                  lineHeight: 1.4,
                }}
              >
                {url}
              </Typography>
            ) : (
              <Typography
                variant="caption"
                sx={{
                  color: 'text.disabled',
                  fontStyle: 'italic',
                }}
              >
                No URL configured in data/artist-data.json
              </Typography>
            )}
          </Box>

          {/* Actions: Copy & External Open */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            {hasUrl && (
              <>
                <Tooltip title={copiedKey === brandKey ? 'Copied!' : 'Copy URL'}>
                  <IconButton
                    size="small"
                    onClick={() => onCopyLink?.(url, brandKey)}
                    sx={{
                      backgroundColor: 'rgba(255, 255, 255, 0.06)',
                      '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.15)' },
                    }}
                  >
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Button
                  size="small"
                  variant="outlined"
                  color="primary"
                  endIcon={<LaunchIcon />}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    borderRadius: 1.5,
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    py: 0.4,
                  }}
                >
                  Visit
                </Button>
              </>
            )}
          </Box>
        </CardContent>
      </Card>
    </Grid>
  )
})

export default BrandLinkCard
