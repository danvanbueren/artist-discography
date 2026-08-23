'use client'

import { Paper, Typography, Grid, Box, InputAdornment, IconButton, Tooltip } from '@mui/material'
import LinkIcon from '@mui/icons-material/Link'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import AdminTextInput from '../common/AdminTextInput'
import { PLATFORM_KEYS, SOCIAL_KEYS } from '../adminConstants'
import { SOCIAL_ICONS } from '@/components/discography/ArtistHero'
import { buildPlatformSearchUrl, openExternalLink } from '../adminUtils'

/**
 * Streaming platforms and social media link profile cards.
 */
export default function ArtistSocialsCard({
  artistPlatforms = {},
  setArtistPlatforms,
  artistPlatformsRef,
  artistSocials = {},
  setArtistSocials,
  artistSocialsRef,
  artistName = '',
  dirtyFields,
  savedFields,
  markFieldDirty,
  executeSaveArtist,
}) {
  return (
    <>
      {/* Streaming Platforms */}
      <Paper
        variant='outlined'
        sx={{
          p: { xs: 3, md: 3.5 },
          borderRadius: 2.5,
          backgroundColor: 'rgba(28, 28, 38, 0.6)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
        }}
      >
        <Typography
          variant='h6'
          sx={{
            fontWeight: 700,
            mb: 0.75,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <LinkIcon color='primary' /> Streaming Platforms
        </Typography>
        <Typography
          variant='caption'
          sx={{ color: 'text.secondary', display: 'block', mb: 2.5, lineHeight: 1.4 }}
        >
          Direct links to artist discography profiles across digital music streaming platforms and
          digital stores.
        </Typography>

        <Grid container spacing={2}>
          {PLATFORM_KEYS.map(({ key, label }) => {
            const iconSrc = SOCIAL_ICONS[key]
            const fieldKey = `platform_${key}`
            const linkVal = artistPlatforms[key] || ''
            return (
              <Grid key={key} size={{ xs: 12, sm: 6 }}>
                <AdminTextInput
                  label={label}
                  size='small'
                  fullWidth
                  value={linkVal}
                  onChange={(val) => {
                    setArtistPlatforms((prev) => {
                      const next = { ...prev, [key]: val }
                      if (artistPlatformsRef) artistPlatformsRef.current = next
                      return next
                    })
                    markFieldDirty?.(fieldKey, executeSaveArtist)
                  }}
                  isDirty={dirtyFields?.has?.(fieldKey)}
                  isSaved={savedFields?.has?.(fieldKey)}
                  slotProps={{
                    input: {
                      startAdornment: iconSrc ? (
                        <InputAdornment position='start'>
                          <Box
                            component='img'
                            src={iconSrc}
                            alt=''
                            sx={{
                              width: 20,
                              height: 20,
                              borderRadius: '4px',
                              objectFit: 'contain',
                              flexShrink: 0,
                            }}
                          />
                        </InputAdornment>
                      ) : null,
                      endAdornment: (
                        <InputAdornment position='end'>
                          {linkVal.trim() ? (
                            <Tooltip title={`Open ${label} in new tab`} arrow>
                              <IconButton
                                size='small'
                                onClick={() => openExternalLink(linkVal)}
                                sx={{
                                  color: 'text.secondary',
                                  p: 0.5,
                                  '&:hover': { color: 'primary.main' },
                                }}
                                aria-label={`Open ${label}`}
                              >
                                <OpenInNewIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <Tooltip title={`Search for artist on ${label} (or Google)`} arrow>
                              <IconButton
                                size='small'
                                onClick={() => {
                                  const searchUrl = buildPlatformSearchUrl(key, artistName, '', '')
                                  window.open(searchUrl, '_blank', 'noopener,noreferrer')
                                }}
                                sx={{
                                  color: 'text.secondary',
                                  p: 0.5,
                                  '&:hover': { color: 'secondary.main' },
                                }}
                                aria-label={`Search ${label}`}
                              >
                                <AutoAwesomeIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Grid>
            )
          })}
        </Grid>
      </Paper>

      {/* Social Platforms */}
      <Paper
        variant='outlined'
        sx={{
          p: { xs: 3, md: 3.5 },
          borderRadius: 2.5,
          backgroundColor: 'rgba(28, 28, 38, 0.6)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
        }}
      >
        <Typography
          variant='h6'
          sx={{
            fontWeight: 700,
            mb: 0.75,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <LinkIcon color='primary' /> Social Platforms
        </Typography>
        <Typography
          variant='caption'
          sx={{ color: 'text.secondary', display: 'block', mb: 2.5, lineHeight: 1.4 }}
        >
          Connect official artist social profiles and community channels displayed in the header
          banner.
        </Typography>

        <Grid container spacing={2}>
          {SOCIAL_KEYS.map(({ key, label }) => {
            const iconSrc = SOCIAL_ICONS[key]
            const fieldKey = `social_${key}`
            const linkVal = artistSocials[key] || ''
            return (
              <Grid key={key} size={{ xs: 12, sm: 6 }}>
                <AdminTextInput
                  label={label}
                  size='small'
                  fullWidth
                  value={linkVal}
                  onChange={(val) => {
                    setArtistSocials((prev) => {
                      const next = { ...prev, [key]: val }
                      if (artistSocialsRef) artistSocialsRef.current = next
                      return next
                    })
                    markFieldDirty?.(fieldKey, executeSaveArtist)
                  }}
                  isDirty={dirtyFields?.has?.(fieldKey)}
                  isSaved={savedFields?.has?.(fieldKey)}
                  slotProps={{
                    input: {
                      startAdornment: iconSrc ? (
                        <InputAdornment position='start'>
                          <Box
                            component='img'
                            src={iconSrc}
                            alt=''
                            sx={{
                              width: 20,
                              height: 20,
                              borderRadius: '4px',
                              objectFit: 'contain',
                              flexShrink: 0,
                            }}
                          />
                        </InputAdornment>
                      ) : null,
                      endAdornment: (
                        <InputAdornment position='end'>
                          {linkVal.trim() ? (
                            <Tooltip title={`Open ${label} in new tab`} arrow>
                              <IconButton
                                size='small'
                                onClick={() => openExternalLink(linkVal)}
                                sx={{
                                  color: 'text.secondary',
                                  p: 0.5,
                                  '&:hover': { color: 'primary.main' },
                                }}
                                aria-label={`Open ${label}`}
                              >
                                <OpenInNewIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <Tooltip title={`Search for artist on ${label} (or Google)`} arrow>
                              <IconButton
                                size='small'
                                onClick={() => {
                                  const searchUrl = buildPlatformSearchUrl(key, artistName, '', '')
                                  window.open(searchUrl, '_blank', 'noopener,noreferrer')
                                }}
                                sx={{
                                  color: 'text.secondary',
                                  p: 0.5,
                                  '&:hover': { color: 'secondary.main' },
                                }}
                                aria-label={`Search ${label}`}
                              >
                                <AutoAwesomeIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Grid>
            )
          })}
        </Grid>
      </Paper>
    </>
  )
}
