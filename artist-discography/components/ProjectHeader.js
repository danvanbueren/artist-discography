'use client'

import { Box, Stack, Typography, IconButton, Tooltip, Chip } from '@mui/material'
import AlbumRoundedIcon from '@mui/icons-material/AlbumRounded'
import LaunchRoundedIcon from '@mui/icons-material/LaunchRounded'
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
  itunes: '/apple.webp',
}

export default function ProjectHeader({
  project,
  artistName,
  onSelectProject,
  selectedPlatform,
  isSingleView = false,
}) {
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
    // Prevent triggering single view if user clicked a direct external link button
    if (e.target.closest('a') || e.target.closest('button')) {
      return
    }
    if (onSelectProject) {
      onSelectProject(project)
    }
  }

  return (
    <Box
      onClick={handleHeaderClick}
      sx={{
        p: { xs: 2, sm: 3 },
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'flex-start', sm: 'center' },
        gap: { xs: 2, sm: 3 },
        cursor: onSelectProject && !isSingleView ? 'pointer' : 'default',
        borderRadius: 3,
        transition: 'background-color 0.25s ease',
        '&:hover': onSelectProject && !isSingleView
          ? {
              bgcolor: 'action.hover',
            }
          : {},
      }}
    >
      {/* Left: Album Cover Art */}
      <Box
        sx={{
          width: { xs: 90, sm: 110, md: 130 },
          height: { xs: 90, sm: 110, md: 130 },
          borderRadius: 2.5,
          overflow: 'hidden',
          flexShrink: 0,
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          bgcolor: 'rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, rgba(60,60,80,0.8) 0%, rgba(30,30,45,0.9) 100%)',
        }}
      >
        {cover ? (
          <Box
            component="img"
            src={cover}
            alt={name || 'Project Cover'}
            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <AlbumRoundedIcon
            sx={{
              fontSize: { xs: 48, sm: 60 },
              color: 'rgba(255,255,255,0.3)',
            }}
          />
        )}
      </Box>

      {/* Right: Metadata Stack */}
      <Stack spacing={0.75} sx={{ flexGrow: 1, minWidth: 0, width: '100%' }}>
        {/* Type Badge & Date */}
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          {type ? (
            <Chip
              label={type.toUpperCase()}
              size="small"
              sx={{
                height: 20,
                fontSize: '0.675rem',
                fontWeight: 700,
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
                height: 20,
                fontSize: '0.675rem',
                fontWeight: 500,
                fontStyle: 'italic',
                opacity: 0.6,
                bgcolor: 'action.disabledBackground',
                borderRadius: 1,
              }}
            />
          )}

          <SubduedText
            value={date}
            placeholder="Release Date"
            variant="caption"
            sx={{ fontSize: '0.8rem' }}
          />
        </Stack>

        {/* Project Title */}
        <SubduedText
          value={name}
          placeholder="Untitled Project"
          variant="h5"
          component="h2"
          sx={{
            fontWeight: 800,
            fontSize: { xs: '1.25rem', sm: '1.6rem' },
            lineHeight: 1.2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        />

        {/* Artist Name */}
        <SubduedText
          value={pArtist}
          placeholder="Artist"
          variant="subtitle1"
          sx={{
            fontWeight: 500,
            fontSize: { xs: '0.9rem', sm: '1rem' },
            color: 'text.secondary',
          }}
        />

        {/* Streaming Service Icons Stack */}
        {availablePlatforms.length > 0 && (
          <Stack
            direction="row"
            spacing={1}
            sx={{ pt: 0.75, flexWrap: 'wrap', gap: 0.75, alignItems: 'center' }}
          >
            {availablePlatforms.map(({ key, url, icon }) => {
              const isPreferred = selectedPlatform && selectedPlatform.toLowerCase() === key.toLowerCase()
              return (
                <Tooltip key={key} title={`Open on ${key.toUpperCase()}`} arrow>
                  <IconButton
                    component="a"
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    size="small"
                    sx={{
                      p: 0.5,
                      borderRadius: 1.5,
                      border: '1px solid',
                      borderColor: isPreferred ? 'primary.main' : 'rgba(255,255,255,0.1)',
                      bgcolor: isPreferred ? 'rgba(144, 202, 249, 0.15)' : 'rgba(255,255,255,0.03)',
                      transition: 'transform 0.2s ease, border-color 0.2s ease',
                      '&:hover': {
                        transform: 'scale(1.12)',
                        borderColor: 'primary.light',
                        bgcolor: 'rgba(255,255,255,0.1)',
                      },
                    }}
                  >
                    {icon ? (
                      <Box
                        component="img"
                        src={icon}
                        alt={key}
                        sx={{ width: 18, height: 18, objectFit: 'contain' }}
                      />
                    ) : (
                      <LaunchRoundedIcon sx={{ fontSize: 16 }} />
                    )}
                  </IconButton>
                </Tooltip>
              )
            })}
          </Stack>
        )}
      </Stack>
    </Box>
  )
}
