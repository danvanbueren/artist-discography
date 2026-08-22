'use client'

import { Box, Stack, Paper, Typography, Tooltip, IconButton } from '@mui/material'
import LockOpenIcon from '@mui/icons-material/LockOpen'
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded'
import ArtistHero from '../ArtistHero'

/**
 * Top hero and admin status banner section for the main discography view.
 *
 * @param {Object} props
 * @param {Object} props.artist - Artist configuration
 * @param {string|null} props.ambientImage - Ambient background image URL
 * @param {boolean} [props.hasAdminAccess=false] - True if admin routes are enabled
 * @param {boolean} [props.isSingleView=false] - Hide hero if in single project view
 */
export default function DiscographyHeaderSection({
  artist,
  ambientImage,
  hasAdminAccess = false,
  isSingleView = false,
}) {
  return (
    <>
      {/* Floating Admin Alert Banner (Top Left) */}
      {hasAdminAccess && (
        <Stack
          spacing={1}
          sx={{
            position: 'fixed',
            top: { xs: 12, sm: 16 },
            left: { xs: 12, sm: 16 },
            zIndex: 3000,
            pointerEvents: 'none',
            maxWidth: { xs: 'calc(100vw - 24px)', sm: 420 },
          }}
        >
          <Paper
            elevation={6}
            sx={{
              pointerEvents: 'auto',
              borderRadius: 3,
              px: { xs: 1, sm: 2 },
              py: { xs: 0.75, sm: 1.25 },
              bgcolor: '#b71c1c',
              color: '#ffffff',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              boxShadow: '0 8px 24px rgba(183, 28, 28, 0.45)',
              display: 'flex',
              alignItems: 'center',
              gap: { xs: 0.75, sm: 1.5 },
              animation: 'pulseAdminAlert 2s infinite ease-in-out',
              '@keyframes pulseAdminAlert': {
                '0%': {
                  backgroundColor: '#b71c1c',
                  boxShadow: '0 6px 18px rgba(183, 28, 28, 0.4)',
                },
                '50%': {
                  backgroundColor: '#d32f2f',
                  boxShadow: '0 10px 28px rgba(211, 47, 47, 0.65)',
                },
                '100%': {
                  backgroundColor: '#b71c1c',
                  boxShadow: '0 6px 18px rgba(183, 28, 28, 0.4)',
                },
              },
            }}
          >
            <LockOpenIcon sx={{ fontSize: { xs: 18, sm: 20 }, color: '#ffffff', flexShrink: 0 }} />
            <Box sx={{ display: { xs: 'none', sm: 'block' }, minWidth: 0, flexGrow: 1 }}>
              <Typography
                variant='caption'
                sx={{
                  fontWeight: 800,
                  color: '#ffffff',
                  display: 'block',
                  lineHeight: 1.25,
                  fontSize: '0.775rem',
                }}
              >
                Admin Dashboard
              </Typography>
              <Typography
                variant='caption'
                sx={{
                  color: 'rgba(255, 255, 255, 0.85)',
                  display: 'block',
                  fontSize: '0.7rem',
                  lineHeight: 1.25,
                }}
              >
                The admin dashboard is currently accessible. Ensure it is disabled before deploying
                to a production environment.
              </Typography>
            </Box>
            <Tooltip title='Open Admin Portal' arrow>
              <IconButton
                component='a'
                href='/_sys/_admin'
                target='_blank'
                rel='noopener noreferrer'
                size='small'
                sx={{
                  color: '#ffffff',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  p: { xs: 0.5, sm: 0.75 },
                  ml: 'auto',
                  flexShrink: 0,
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.35)',
                    transform: 'scale(1.08)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                <OpenInNewRoundedIcon fontSize='small' />
              </IconButton>
            </Tooltip>
          </Paper>
        </Stack>
      )}

      {/* Screen-Height Hero Section */}
      <Box sx={{ display: isSingleView ? 'none' : 'block' }}>
        <ArtistHero artist={artist} onLogoClick={undefined} ambientImage={ambientImage} />
      </Box>
    </>
  )
}
