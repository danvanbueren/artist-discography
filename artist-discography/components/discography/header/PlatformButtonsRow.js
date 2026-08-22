'use client'

import { Box, Paper, IconButton } from '@mui/material'
import LaunchRoundedIcon from '@mui/icons-material/LaunchRounded'
import { useDragScroll } from '@/lib/hooks/useDragScroll'

export const PLATFORM_ICONS = {
  spotify: '/platforms/spotify.webp',
  apple: '/platforms/apple.webp',
  youtube: '/platforms/youtube.webp',
  soundcloud: '/platforms/soundcloud.webp',
  bandcamp: '/platforms/bandcamp.webp',
  deezer: '/platforms/deezer.webp',
  tidal: '/platforms/tidal.webp',
  pandora: '/platforms/pandora.webp',
  amazon: '/platforms/amazon.webp',
  itunes: '/platforms/itunes.webp',
}

/**
 * Horizontally drag-scrollable row of platform link buttons for a project.
 *
 * @param {Object} props
 * @param {Object} [props.links={}] - Project links dictionary { platformId: url }
 * @param {string} [props.selectedPlatform] - Preferred music platform ID
 * @param {boolean} [props.isDarkMode=true] - Active theme mode
 */
export default function PlatformButtonsRow({ links = {}, selectedPlatform, isDarkMode = true }) {
  const platformDrag = useDragScroll()

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

  if (availablePlatforms.length === 0) return null

  return (
    <Paper
      elevation={1}
      sx={{
        mt: 1.25,
        maxWidth: '100%',
        borderRadius: 3.5,
        p: { xs: 0.5, sm: 0.75 },
        backdropFilter: 'blur(16px)',
        bgcolor: isDarkMode ? 'rgba(18, 18, 26, 0.75)' : 'rgba(255, 255, 255, 0.75)',
        border: '1px solid',
        borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
        boxShadow: isDarkMode ? '0 4px 20px rgba(0, 0, 0, 0.35)' : '0 4px 16px rgba(0, 0, 0, 0.06)',
        display: 'flex',
        alignItems: 'center',
        alignSelf: { xs: 'center', sm: 'flex-start' },
        transition: 'background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
      }}
    >
      <Box
        ref={platformDrag.ref}
        {...platformDrag.bind}
        sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          flexWrap: 'nowrap',
          gap: 1,
          overflowX: 'auto',
          maxWidth: '100%',
          py: 0.25,
          px: 0.5,
          cursor: platformDrag.isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        {availablePlatforms.map(({ key, url, icon }) => {
          const isPreferred =
            selectedPlatform && selectedPlatform.toLowerCase() === key.toLowerCase()
          return (
            <IconButton
              key={key}
              component='a'
              href={url}
              target='_blank'
              rel='noopener noreferrer'
              onClick={(e) => {
                if (platformDrag.hasDraggedRef.current) {
                  e.preventDefault()
                }
              }}
              size='medium'
              sx={{
                p: 0.75,
                flexShrink: 0,
                borderRadius: 2,
                border: '1.5px solid',
                borderColor: isPreferred
                  ? 'primary.main'
                  : isDarkMode
                    ? 'rgba(255,255,255,0.12)'
                    : 'rgba(0,0,0,0.1)',
                bgcolor: isPreferred
                  ? 'rgba(144, 202, 249, 0.18)'
                  : isDarkMode
                    ? 'rgba(255,255,255,0.04)'
                    : 'rgba(0,0,0,0.03)',
                transition: 'transform 0.2s ease, border-color 0.2s ease, bgcolor 0.2s ease',
                '&:hover': {
                  transform: 'scale(1.15)',
                  borderColor: 'primary.light',
                  bgcolor: isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
                },
              }}
            >
              {icon ? (
                <Box
                  component='img'
                  src={icon}
                  alt={key}
                  draggable={false}
                  loading='eager'
                  decoding='async'
                  sx={{ width: 28, height: 28, objectFit: 'contain', borderRadius: 2 }}
                />
              ) : (
                <LaunchRoundedIcon sx={{ fontSize: 22 }} />
              )}
            </IconButton>
          )
        })}
      </Box>
    </Paper>
  )
}
