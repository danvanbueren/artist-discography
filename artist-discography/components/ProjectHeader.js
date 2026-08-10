'use client'

import { useState } from 'react'
import { Box, Stack, Typography, IconButton, Chip, Dialog, Tooltip } from '@mui/material'
import AlbumRoundedIcon from '@mui/icons-material/AlbumRounded'
import LaunchRoundedIcon from '@mui/icons-material/LaunchRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import ZoomInRoundedIcon from '@mui/icons-material/ZoomInRounded'
import SubduedText from './SubduedText'

const PLATFORM_ICONS = {
  spotify: '/spotify.webp',
  apple: '/apple.webp',
  youtube: '/youtube.webp',
  soundcloud: '/soundcloud.webp',
  bandcamp: '/bandcamp.webp',
  deezer: '/deezer.webp',
  tidal: '/tidal.webp',
  pandora: '/pandora.webp',
  amazon: '/amazon.webp',
  itunes: '/itunes.webp',
}

export default function ProjectHeader({
  project,
  artistName,
  onSelectProject,
  selectedPlatform,
  isSingleView = false,
}) {
  const [artModalOpen, setArtModalOpen] = useState(false)

  const name = project?.name ?? ''
  const pArtist = project?.artist || artistName || ''
  const type = project?.type ?? ''
  const date = project?.date ?? ''
  const cover = project?.cover ?? project?.image ?? ''
  const links = project?.links ?? {}

  // Filter out non-empty streaming links
  const availablePlatforms = []
  for (const [key, url] of Object.entries(links)) {
    if (url && typeof url === 'string' && url.trim() !== '') {
      availablePlatforms.push({
        key,
        url,
        icon: PLATFORM_ICONS[key],
      })
    }
  }

  const handleHeaderClick = (e) => {
    if (e.target.closest('a') || e.target.closest('button')) {
      return
    }
    if (onSelectProject) {
      onSelectProject(project)
    }
  }

  const handleCoverClick = (e) => {
    if (cover) {
      e.stopPropagation()
      setArtModalOpen(true)
    }
  }

  return (
    <>
      <Box
        onClick={handleHeaderClick}
        sx={{
          p: { xs: 2, sm: 3 },
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: { xs: 2, sm: 3 },
          cursor: onSelectProject ? 'pointer' : 'default',
          borderRadius: 3,
          transition: 'background-color 0.25s ease',
          '&:hover': onSelectProject
            ? {
                bgcolor: 'action.hover',
              }
            : {},
        }}
      >
        {/* Left: Album Cover Art */}
        <Tooltip title={cover ? 'Click to view full album art' : ''} arrow disableHoverListener={!cover}>
          <Box
            onClick={handleCoverClick}
            sx={{
              position: 'relative',
              width: { xs: 100, sm: 130, md: 150 },
              height: { xs: 100, sm: 130, md: 150 },
              borderRadius: 3,
              overflow: 'hidden',
              flexShrink: 0,
              boxShadow: '0 8px 28px rgba(0,0,0,0.35)',
              bgcolor: 'rgba(255,255,255,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, rgba(60,60,80,0.8) 0%, rgba(30,30,45,0.9) 100%)',
              cursor: cover ? 'pointer' : 'default',
              transition: 'transform 0.22s ease, box-shadow 0.22s ease',
              '&:hover': cover
                ? {
                    transform: 'scale(1.04)',
                    boxShadow: '0 12px 36px rgba(0,0,0,0.5)',
                    '& .cover-zoom-icon': {
                      opacity: 1,
                    },
                  }
                : {},
            }}
          >
            {cover ? (
              <>
                <Box
                  component="img"
                  src={cover}
                  alt={name || 'Project Cover'}
                  draggable={false}
                  sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <Box
                  className="cover-zoom-icon"
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    bgcolor: 'rgba(0, 0, 0, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0,
                    transition: 'opacity 0.2s ease',
                  }}
                >
                  <ZoomInRoundedIcon sx={{ color: 'common.white', fontSize: 32 }} />
                </Box>
              </>
            ) : (
              <AlbumRoundedIcon
                sx={{
                  fontSize: { xs: 56, sm: 72 },
                  color: 'rgba(255,255,255,0.35)',
                }}
              />
            )}
          </Box>
        </Tooltip>

        {/* Right: Metadata Stack */}
        <Stack spacing={1} sx={{ flexGrow: 1, minWidth: 0, width: '100%' }}>
          {/* Type Badge */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {type ? (
              <Chip
                label={type.toUpperCase()}
                size="small"
                sx={{
                  height: 22,
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  borderRadius: 1,
                }}
              />
            ) : (
              <Chip
                label="PROJECT"
                size="small"
                sx={{
                  height: 22,
                  fontSize: '0.7rem',
                  fontWeight: 500,
                  fontStyle: 'italic',
                  opacity: 0.6,
                  bgcolor: 'action.disabledBackground',
                  borderRadius: 1,
                }}
              />
            )}
          </Box>

          {/* Project Title */}
          <SubduedText
            value={name}
            placeholder="Untitled Project"
            variant="h5"
            component="h2"
            sx={{
              fontWeight: 800,
              fontSize: { xs: '1.35rem', sm: '1.75rem' },
              lineHeight: 1.25,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          />

          {/* Artist Name & Release Date on SAME HORIZONTAL LINE */}
          <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: 'center', flexWrap: 'wrap' }}
          >
            <SubduedText
              value={pArtist}
              placeholder="Artist"
              variant="subtitle1"
              sx={{
                fontWeight: 600,
                fontSize: { xs: '0.95rem', sm: '1.05rem' },
                color: 'text.secondary',
              }}
            />

            {pArtist && date && (
              <Typography variant="body2" sx={{ color: 'text.disabled', mx: 0.5 }}>
                •
              </Typography>
            )}

            <SubduedText
              value={date}
              placeholder="Release Date"
              variant="caption"
              sx={{ fontSize: '0.9rem', color: 'text.secondary' }}
            />
          </Stack>

          {/* Platform Streaming Icons (LARGER 28px) */}
          {availablePlatforms.length > 0 && (
            <Stack
              direction="row"
              spacing={1.25}
              sx={{ pt: 1, flexWrap: 'wrap', gap: 1, alignItems: 'center' }}
            >
              {availablePlatforms.map(({ key, url, icon }) => {
                const isPreferred = selectedPlatform && selectedPlatform.toLowerCase() === key.toLowerCase()
                return (
                  <IconButton
                    key={key}
                    component="a"
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    size="medium"
                    sx={{
                      p: 0.75,
                      borderRadius: 2,
                      border: '1.5px solid',
                      borderColor: isPreferred ? 'primary.main' : 'rgba(255,255,255,0.12)',
                      bgcolor: isPreferred ? 'rgba(144, 202, 249, 0.18)' : 'rgba(255,255,255,0.04)',
                      transition: 'transform 0.2s ease, border-color 0.2s ease, bgcolor 0.2s ease',
                      '&:hover': {
                        transform: 'scale(1.18)',
                        borderColor: 'primary.light',
                        bgcolor: 'rgba(255,255,255,0.15)',
                      },
                    }}
                  >
                    {icon ? (
                      <Box
                        component="img"
                        src={icon}
                        alt={key}
                        draggable={false}
                        loading="eager"
                        decoding="async"
                        sx={{ width: 28, height: 28, objectFit: 'contain', borderRadius: 2 }}
                      />
                    ) : (
                      <LaunchRoundedIcon sx={{ fontSize: 22 }} />
                    )}
                  </IconButton>
                )
              })}
            </Stack>
          )}
        </Stack>
      </Box>

      {/* Full View Album Art Dialog */}
      {cover && (
        <Dialog
          open={artModalOpen}
          onClose={() => setArtModalOpen(false)}
          maxWidth="md"
          slotProps={{
            backdrop: {
              sx: {
                backdropFilter: 'blur(12px)',
                bgcolor: 'rgba(0, 0, 0, 0.85)',
              },
            },
            paper: {
              sx: {
                borderRadius: 4,
                bgcolor: 'transparent',
                backgroundImage: 'none',
                boxShadow: 'none',
                overflow: 'visible',
                position: 'relative',
                maxWidth: '90vw',
                maxHeight: '90vh',
                m: 1,
              },
            },
          }}
        >
          <Box
            sx={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconButton
              aria-label="close album art view"
              onClick={() => setArtModalOpen(false)}
              sx={{
                position: 'absolute',
                top: -16,
                right: -16,
                bgcolor: 'rgba(30, 30, 40, 0.9)',
                color: 'common.white',
                zIndex: 10,
                boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
                border: '1px solid rgba(255,255,255,0.15)',
                backdropFilter: 'blur(8px)',
                '&:hover': {
                  bgcolor: 'rgba(50, 50, 65, 0.95)',
                  transform: 'scale(1.1)',
                },
              }}
            >
              <CloseRoundedIcon />
            </IconButton>
            <Box
              component="img"
              src={cover}
              alt={name || 'Project Cover Art'}
              draggable={false}
              sx={{
                maxWidth: '85vw',
                maxHeight: '82vh',
                width: 'auto',
                height: 'auto',
                objectFit: 'contain',
                borderRadius: 4,
                boxShadow: '0 32px 64px rgba(0,0,0,0.75)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            />
          </Box>
        </Dialog>
      )}
    </>
  )
}
