'use client'

import { memo, useMemo } from 'react'
import { Grid, Box, Button, InputAdornment, Tooltip, IconButton } from '@mui/material'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import AdminTextInput from '../common/AdminTextInput'
import {
  buildPlatformSearchUrl,
  findDuplicateStreamingLink,
  isAlbumLevelUrl,
  analyzeYouTubeUrl,
  analyzeSpotifyUrl,
  analyzeAppleMusicUrl,
  openExternalLink,
} from '../adminUtils'

/**
 * Individual streaming platform URL input with live link validation,
 * duplicate detection, auto-cleanup actions, and direct platform search.
 */
export const TrackStreamingPlatformInput = memo(function TrackStreamingPlatformInput({
  platformKey,
  label,
  iconSrc,
  index,
  linkVal = '',
  isDirty,
  isSaved,
  trackArtist = '',
  trackName = '',
  defaultArtist = '',
  projectName = '',
  currentProjectIndex = -1,
  isPending = false,
  currentTracks = [],
  currentTrackLinks = {},
  allProjects = [],
  onUpdateLink,
}) {
  const dupInfo = useMemo(() => {
    if (isPending || !linkVal || !linkVal.trim()) return null
    return findDuplicateStreamingLink(
      linkVal,
      {
        currentProjectIndex,
        currentTrackIndex: index,
        platformKey,
        currentTracks,
        currentTrackLinks,
      },
      allProjects,
    )
  }, [
    isPending,
    linkVal,
    currentProjectIndex,
    index,
    platformKey,
    currentTracks,
    currentTrackLinks,
    allProjects,
  ])

  const isAlbumLink = useMemo(() => {
    if (isPending || !linkVal || !linkVal.trim()) return false
    return isAlbumLevelUrl(linkVal)
  }, [isPending, linkVal])

  const ytAnalysis = useMemo(() => {
    if (isPending || platformKey !== 'youtube' || !linkVal || !linkVal.trim()) {
      return { hasPlaylist: false, cleanedUrl: linkVal }
    }
    return analyzeYouTubeUrl(linkVal)
  }, [isPending, platformKey, linkVal])

  const spotifyAnalysis = useMemo(() => {
    if (isPending || platformKey !== 'spotify' || !linkVal || !linkVal.trim()) {
      return { hasTrackingParams: false, cleanedUrl: linkVal }
    }
    return analyzeSpotifyUrl(linkVal)
  }, [isPending, platformKey, linkVal])

  const appleAnalysis = useMemo(() => {
    if (isPending || platformKey !== 'apple' || !linkVal || !linkVal.trim()) {
      return { isAlbumWithTrack: false, directSongUrl: null }
    }
    return analyzeAppleMusicUrl(linkVal)
  }, [isPending, platformKey, linkVal])

  const isWarning = Boolean(
    !isPending &&
    (dupInfo ||
      isAlbumLink ||
      ytAnalysis.hasPlaylist ||
      spotifyAnalysis.hasTrackingParams ||
      appleAnalysis.isAlbumWithTrack),
  )

  let helperMsg = null
  if (!isPending) {
    if (dupInfo) {
      helperMsg = dupInfo.message
    } else if (appleAnalysis.isAlbumWithTrack) {
      helperMsg = '⚠️ Detected Apple Music album link with track parameter (?i=...).'
    } else if (isAlbumLink) {
      helperMsg = '⚠️ Detected album-level link. A direct track/song link is strongly recommended.'
    } else if (ytAnalysis.hasPlaylist) {
      helperMsg = '⚠️ YouTube playlist link detected. Direct video link is preferred.'
    } else if (spotifyAnalysis.hasTrackingParams) {
      helperMsg = '⚠️ Spotify tracking parameter (?si=...) detected.'
    }
  }

  return (
    <Grid size={{ xs: 12, sm: 6 }}>
      <AdminTextInput
        label={label}
        size='small'
        fullWidth
        value={linkVal}
        onChange={(val) => onUpdateLink?.(index, platformKey, val)}
        isDirty={isDirty}
        isSaved={isSaved}
        warning={isWarning}
        helperText={
          isWarning ? (
            <Box
              component='span'
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                mt: 0.25,
                flexWrap: 'wrap',
                gap: 0.5,
              }}
            >
              <span>{helperMsg}</span>
              {appleAnalysis.isAlbumWithTrack && (
                <Button
                  size='small'
                  variant='text'
                  onClick={() => onUpdateLink?.(index, 'apple', appleAnalysis.directSongUrl)}
                  sx={{
                    color: '#fbbf24',
                    p: 0,
                    minWidth: 0,
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'none',
                    textDecoration: 'underline',
                    '&:hover': { textDecoration: 'none', color: '#f59e0b' },
                  }}
                >
                  Convert to Song URL
                </Button>
              )}
              {ytAnalysis.hasPlaylist && (
                <Button
                  size='small'
                  variant='text'
                  onClick={() => onUpdateLink?.(index, 'youtube', ytAnalysis.cleanedUrl)}
                  sx={{
                    color: '#fbbf24',
                    p: 0,
                    minWidth: 0,
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'none',
                    textDecoration: 'underline',
                    '&:hover': { textDecoration: 'none', color: '#f59e0b' },
                  }}
                >
                  Clean URL
                </Button>
              )}
              {spotifyAnalysis.hasTrackingParams && (
                <Button
                  size='small'
                  variant='text'
                  onClick={() => onUpdateLink?.(index, 'spotify', spotifyAnalysis.cleanedUrl)}
                  sx={{
                    color: '#fbbf24',
                    p: 0,
                    minWidth: 0,
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'none',
                    textDecoration: 'underline',
                    '&:hover': { textDecoration: 'none', color: '#f59e0b' },
                  }}
                >
                  Clean URL
                </Button>
              )}
            </Box>
          ) : undefined
        }
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
                {linkVal && linkVal.trim() ? (
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
                  <Tooltip title={`Search for this track on ${label} (or Google)`} arrow>
                    <IconButton
                      size='small'
                      onClick={() => {
                        const searchUrl = buildPlatformSearchUrl(
                          platformKey,
                          trackArtist || defaultArtist,
                          trackName,
                          projectName,
                        )
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
})
