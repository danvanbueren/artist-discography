'use client'

import { memo, useMemo, useDeferredValue } from 'react'
import {
  Card,
  CardContent,
  Box,
  Chip,
  IconButton,
  Grid,
  Paper,
  Typography,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  InputAdornment,
  Tooltip,
} from '@mui/material'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import DeleteIcon from '@mui/icons-material/Delete'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import MusicNoteIcon from '@mui/icons-material/MusicNote'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import LinkIcon from '@mui/icons-material/Link'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import GraphicEqIcon from '@mui/icons-material/GraphicEq'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import AdminTextInput from '../common/AdminTextInput'
import { PLATFORM_KEYS } from '../adminConstants'
import {
  formatMediaPath,
  buildPlatformSearchUrl,
  findDuplicateStreamingLink,
  isAlbumLevelUrl,
  analyzeYouTubeUrl,
  analyzeSpotifyUrl,
} from '../adminUtils'
import { SOCIAL_ICONS } from '../../artist/ArtistHero'

const TrackStreamingPlatformInput = memo(function TrackStreamingPlatformInput({
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
  currentTracks = [],
  currentTrackLinks = {},
  allProjects = [],
  onUpdateLink,
}) {
  // De-prioritize validation calculations so input DOM renders immediately
  const deferredLinkVal = useDeferredValue(linkVal)

  const dupInfo = useMemo(() => {
    if (!deferredLinkVal || !deferredLinkVal.trim()) return null
    return findDuplicateStreamingLink(
      deferredLinkVal,
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
    deferredLinkVal,
    currentProjectIndex,
    index,
    platformKey,
    currentTracks,
    currentTrackLinks,
    allProjects,
  ])

  const isAlbumLink = useMemo(() => {
    if (!deferredLinkVal || !deferredLinkVal.trim()) return false
    return isAlbumLevelUrl(deferredLinkVal)
  }, [deferredLinkVal])

  const ytAnalysis = useMemo(() => {
    if (platformKey !== 'youtube' || !deferredLinkVal || !deferredLinkVal.trim()) {
      return { hasPlaylist: false, cleanedUrl: deferredLinkVal }
    }
    return analyzeYouTubeUrl(deferredLinkVal)
  }, [platformKey, deferredLinkVal])

  const spotifyAnalysis = useMemo(() => {
    if (platformKey !== 'spotify' || !deferredLinkVal || !deferredLinkVal.trim()) {
      return { hasTrackingParams: false, cleanedUrl: deferredLinkVal }
    }
    return analyzeSpotifyUrl(deferredLinkVal)
  }, [platformKey, deferredLinkVal])

  const isWarning = Boolean(
    dupInfo || isAlbumLink || ytAnalysis.hasPlaylist || spotifyAnalysis.hasTrackingParams,
  )

  let helperMsg = null
  if (dupInfo) {
    helperMsg = dupInfo.message
  } else if (isAlbumLink) {
    helperMsg = '⚠️ Detected album-level link. A direct track/song link is strongly recommended.'
  } else if (ytAnalysis.hasPlaylist) {
    helperMsg = '⚠️ YouTube playlist link detected. Direct video link is preferred.'
  } else if (spotifyAnalysis.hasTrackingParams) {
    helperMsg = '⚠️ Spotify tracking parameter (?si=...) detected.'
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
              </InputAdornment>
            ),
          },
        }}
      />
    </Grid>
  )
})

const TrackEditCard = memo(function TrackEditCard({
  track,
  index,
  totalTracks,
  defaultArtist,
  projectName = '',
  allProjects = [],
  currentTracks = [],
  currentProjectIndex = -1,
  isDuplicate,
  isDirtyTitle,
  isSavedTitle,
  isDirtyArtist,
  isSavedArtist,
  dirtyFields,
  savedFields,
  projectSlug = '',
  processingJob = null,
  onUpdateName,
  onUpdateArtist,
  onUpdateLink,
  onAudioUpload,
  onAudioRemove,
  onMoveUp,
  onMoveDown,
  onDelete,
  onCopy,
}) {
  const detectedAudioPath = formatMediaPath(track.audioUrl || track.audio, projectSlug, 'audio')

  return (
    <Card
      variant='outlined'
      sx={{
        backgroundColor: 'rgba(20, 20, 28, 0.8)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 2,
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 1.5,
          }}
        >
          <Chip
            label={`Track #${index + 1}`}
            size='small'
            color='primary'
            sx={{ fontWeight: 700 }}
          />
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title='Copy Track Data'>
              <IconButton size='small' onClick={() => onCopy?.(track, index)}>
                <ContentCopyIcon fontSize='small' />
              </IconButton>
            </Tooltip>
            <IconButton size='small' disabled={index === 0} onClick={() => onMoveUp?.(index)}>
              <ArrowUpwardIcon fontSize='small' />
            </IconButton>
            <IconButton
              size='small'
              disabled={index === totalTracks - 1}
              onClick={() => onMoveDown?.(index)}
            >
              <ArrowDownwardIcon fontSize='small' />
            </IconButton>
            <IconButton
              size='small'
              color='error'
              disabled={totalTracks <= 1}
              onClick={() => onDelete?.(track, index)}
            >
              <DeleteIcon fontSize='small' />
            </IconButton>
          </Box>
        </Box>

        <Grid container spacing={1.5}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <AdminTextInput
              label='Track Title'
              required
              fullWidth
              size='small'
              value={track.name}
              onChange={(val) => onUpdateName?.(index, val)}
              error={isDuplicate}
              helperText={isDuplicate ? 'Track titles in a project must be unique.' : null}
              isDirty={isDirtyTitle}
              isSaved={isSavedTitle}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <AdminTextInput
              label='Track Artist (Optional Override)'
              placeholder={`Defaults to "${defaultArtist}"`}
              fullWidth
              size='small'
              value={track.artist}
              onChange={(val) => onUpdateArtist?.(index, val)}
              isDirty={isDirtyArtist}
              isSaved={isSavedArtist}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Paper
              variant='outlined'
              sx={{
                p: 2,
                backgroundColor: 'rgba(0,0,0,0.25)',
                borderRadius: 2,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  gap: 1.5,
                  alignItems: 'center',
                  flexWrap: 'wrap',
                }}
              >
                <Button
                  variant='outlined'
                  component='label'
                  size='small'
                  startIcon={<CloudUploadIcon />}
                  sx={{ borderRadius: 1.5, textTransform: 'none' }}
                >
                  {track.audioFile || track.audioUrl || track.audio
                    ? 'Replace Audio File'
                    : 'Upload Audio File'}
                  <input
                    type='file'
                    accept='audio/*'
                    hidden
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        onAudioUpload?.(index, e.target.files[0])
                      }
                    }}
                  />
                </Button>
                {track.audioFile ? (
                  <Chip
                    icon={<CheckCircleIcon />}
                    label={`New: ${track.audioFile.name}`}
                    color='success'
                    size='small'
                    onDelete={() => onAudioRemove?.(index)}
                  />
                ) : track.audioUrl || track.audio ? (
                  <Chip
                    icon={<CheckCircleIcon />}
                    label={`Audio attached (${detectedAudioPath})`}
                    color='success'
                    variant='outlined'
                    size='small'
                    sx={{ fontWeight: 600 }}
                  />
                ) : (
                  <Chip
                    icon={<MusicNoteIcon />}
                    label='No audio file attached'
                    color='warning'
                    variant='outlined'
                    size='small'
                    sx={{ fontWeight: 600 }}
                  />
                )}
              </Box>

              <Box
                sx={{
                  mt: 1.5,
                  pt: 1.5,
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.75,
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 1,
                  }}
                >
                  <Typography
                    variant='caption'
                    sx={{
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: 'text.secondary',
                      letterSpacing: 0.5,
                    }}
                  >
                    Audio Cache & Streaming State
                  </Typography>
                  {processingJob &&
                  (processingJob.status === 'processing' || processingJob.status === 'queued') ? (
                    <Chip
                      icon={<GraphicEqIcon sx={{ fontSize: '14px !important' }} />}
                      label={`FFmpeg Transcoding (${processingJob.progress || 0}%)...`}
                      color='warning'
                      size='small'
                      sx={{ height: 22, fontSize: '0.72rem', fontWeight: 700 }}
                    />
                  ) : track.audioFile ? (
                    <Chip
                      label='Staged (Pending Save)'
                      color='warning'
                      size='small'
                      variant='outlined'
                      sx={{ height: 22, fontSize: '0.72rem', fontWeight: 700 }}
                    />
                  ) : track.audioUrl || track.audio ? (
                    <Chip
                      label='Active & Pre-Cached'
                      color='success'
                      size='small'
                      sx={{ height: 22, fontSize: '0.72rem', fontWeight: 700 }}
                    />
                  ) : (
                    <Chip
                      label='No Audio'
                      color='default'
                      size='small'
                      variant='outlined'
                      sx={{ height: 22, fontSize: '0.72rem' }}
                    />
                  )}
                </Box>

                {/* Inline Real-Time FFmpeg Progress Bar */}
                {processingJob &&
                  (processingJob.status === 'processing' || processingJob.status === 'queued') && (
                    <Box
                      sx={{
                        p: 1.2,
                        borderRadius: 1.5,
                        backgroundColor: 'rgba(156, 39, 176, 0.12)',
                        border: '1px solid rgba(186, 104, 200, 0.3)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 0.75,
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Typography
                          variant='caption'
                          sx={{ color: '#e1bee7', fontWeight: 700, fontSize: '0.75rem' }}
                        >
                          {processingJob.currentStep || 'FFmpeg Transcoding audio streams...'}
                        </Typography>
                        <Typography
                          variant='caption'
                          sx={{ color: '#e1bee7', fontWeight: 800, fontSize: '0.75rem' }}
                        >
                          {processingJob.progress || 0}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant='determinate'
                        value={processingJob.progress || 0}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 3,
                            background: 'linear-gradient(90deg, #ba68c8 0%, #ab47bc 100%)',
                          },
                        }}
                      />
                    </Box>
                  )}

                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.5,
                    p: 1,
                    borderRadius: 1,
                    backgroundColor: 'rgba(0, 0, 0, 0.35)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                  }}
                >
                  {track.audioFile ? (
                    <Typography
                      variant='caption'
                      sx={{
                        fontFamily: 'monospace',
                        color: 'warning.light',
                        fontSize: '0.72rem',
                        wordBreak: 'break-all',
                      }}
                    >
                      <strong>Staged Source:</strong> {track.audioFile.name}
                    </Typography>
                  ) : track.audioUrl || track.audio ? (
                    <>
                      <Typography
                        variant='caption'
                        sx={{
                          fontFamily: 'monospace',
                          color: 'primary.light',
                          fontSize: '0.72rem',
                          wordBreak: 'break-all',
                        }}
                      >
                        <strong>Base Track:</strong> {detectedAudioPath}
                      </Typography>
                      <Typography
                        variant='caption'
                        sx={{
                          fontFamily: 'monospace',
                          color: 'text.secondary',
                          fontSize: '0.7rem',
                          wordBreak: 'break-all',
                        }}
                      >
                        <strong>Transcoded Tiers:</strong> data/cache/audio/ (*.flac lossless, *.mp3
                        stream)
                      </Typography>
                      <Typography
                        variant='caption'
                        sx={{
                          fontFamily: 'monospace',
                          color: 'text.secondary',
                          fontSize: '0.7rem',
                          wordBreak: 'break-all',
                        }}
                      >
                        <strong>Stream Endpoint:</strong> /api/audio/projects/{projectSlug}/
                        {track.audioUrl || track.audio}
                      </Typography>
                    </>
                  ) : (
                    <Typography
                      variant='caption'
                      sx={{
                        fontFamily: 'monospace',
                        color: 'text.disabled',
                        fontSize: '0.72rem',
                      }}
                    >
                      No audio cached on disk.
                    </Typography>
                  )}
                </Box>

                <Typography variant='caption' sx={{ color: 'text.secondary', lineHeight: 1.4 }}>
                  {track.audioFile
                    ? `Staged file "${track.audioFile.name}" will be automatically transcoded to FLAC Lossless and MP3 streaming tiers upon saving.`
                    : track.audioUrl || track.audio
                      ? 'Lossless FLAC and progressive MP3 tiers pre-cached. In-browser audio streaming with HTTP 206 Byte Ranges is enabled.'
                      : 'No audio source file uploaded. Listeners will only be able to play this track if external streaming links are provided.'}
                </Typography>
              </Box>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Accordion
              defaultExpanded
              elevation={0}
              slotProps={{ transition: { unmountOnExit: true } }}
              sx={{
                backgroundColor: 'rgba(0,0,0,0.2)',
                borderRadius: '8px !important',
                '&:before': { display: 'none' },
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography
                  variant='body2'
                  sx={{
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <LinkIcon fontSize='small' color='action' /> Streaming Links (
                  {Object.values(track.links || {}).filter(Boolean).length})
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={1.5}>
                  {PLATFORM_KEYS.map(({ key, label }) => {
                    const iconSrc = SOCIAL_ICONS[key]
                    const fieldKey = `edit_track_${index}_${key}`
                    const linkVal = track.links?.[key] || ''

                    return (
                      <TrackStreamingPlatformInput
                        key={key}
                        platformKey={key}
                        label={label}
                        iconSrc={iconSrc}
                        index={index}
                        linkVal={linkVal}
                        isDirty={dirtyFields?.has?.(fieldKey)}
                        isSaved={savedFields?.has?.(fieldKey)}
                        trackArtist={track.artist}
                        trackName={track.name}
                        defaultArtist={defaultArtist}
                        projectName={projectName}
                        currentProjectIndex={currentProjectIndex}
                        currentTracks={currentTracks}
                        currentTrackLinks={track.links}
                        allProjects={allProjects}
                        onUpdateLink={onUpdateLink}
                      />
                    )
                  })}
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
})

export default TrackEditCard
