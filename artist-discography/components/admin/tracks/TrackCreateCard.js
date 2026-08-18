'use client'

import { memo } from 'react'
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
  InputAdornment,
} from '@mui/material'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import DeleteIcon from '@mui/icons-material/Delete'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import MusicNoteIcon from '@mui/icons-material/MusicNote'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import LinkIcon from '@mui/icons-material/Link'
import AdminTextInput from '../common/AdminTextInput'
import { PLATFORM_KEYS } from '../adminConstants'
import { SOCIAL_ICONS } from '../../artist/ArtistHero'

const TrackCreateCard = memo(function TrackCreateCard({
  track,
  index,
  totalTracks,
  defaultArtist,
  isDuplicate,
  isDirtyTitle,
  isSavedTitle,
  isDirtyArtist,
  isSavedArtist,
  dirtyFields,
  savedFields,
  onUpdateName,
  onUpdateArtist,
  onUpdateLink,
  onAudioUpload,
  onAudioRemove,
  onMoveUp,
  onMoveDown,
  onDelete,
}) {
  return (
    <Card
      variant="outlined"
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
            size="small"
            color="primary"
            sx={{ fontWeight: 700 }}
          />
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton
              size="small"
              disabled={index === 0}
              onClick={() => onMoveUp(index)}
            >
              <ArrowUpwardIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              disabled={index === totalTracks - 1}
              onClick={() => onMoveDown(index)}
            >
              <ArrowDownwardIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              color="error"
              disabled={totalTracks <= 1}
              onClick={() => onDelete(track, index)}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        <Grid container spacing={1.5}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <AdminTextInput
              label="Track Title"
              required
              fullWidth
              size="small"
              value={track.name}
              onChange={(val) => onUpdateName(index, val)}
              error={isDuplicate}
              helperText={isDuplicate ? 'Track titles in a project must be unique.' : null}
              isDirty={isDirtyTitle}
              isSaved={isSavedTitle}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <AdminTextInput
              label="Track Artist (Optional Override)"
              placeholder={`Defaults to "${defaultArtist}"`}
              fullWidth
              size="small"
              value={track.artist}
              onChange={(val) => onUpdateArtist(index, val)}
              isDirty={isDirtyArtist}
              isSaved={isSavedArtist}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Paper
              variant="outlined"
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
                  variant="contained"
                  component="label"
                  size="small"
                  startIcon={<CloudUploadIcon />}
                  sx={{ borderRadius: 1.5, textTransform: 'none' }}
                >
                  {track.audioFileName || track.audioFile ? 'Replace Audio File' : 'Upload Audio File'}
                  <input
                    type="file"
                    accept="audio/*"
                    hidden
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        onAudioUpload(index, e.target.files[0])
                      }
                    }}
                  />
                </Button>
                {track.audioFileName ? (
                  <Chip
                    icon={<CheckCircleIcon />}
                    label={track.audioFileName}
                    color="success"
                    size="small"
                    onDelete={() => onAudioRemove(index)}
                  />
                ) : (
                  <Chip
                    icon={<MusicNoteIcon />}
                    label="No audio file attached"
                    color="warning"
                    variant="outlined"
                    size="small"
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
                    variant="caption"
                    sx={{
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: 'text.secondary',
                      letterSpacing: 0.5,
                    }}
                  >
                    Audio Cache & Streaming State
                  </Typography>
                  {track.audioFileName || track.audioFile ? (
                    <Chip
                      label="Staged for Project Creation"
                      color="warning"
                      size="small"
                      variant="outlined"
                      sx={{ height: 22, fontSize: '0.72rem', fontWeight: 700 }}
                    />
                  ) : (
                    <Chip
                      label="No Audio Staged"
                      color="default"
                      size="small"
                      variant="outlined"
                      sx={{ height: 22, fontSize: '0.72rem' }}
                    />
                  )}
                </Box>

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
                  {track.audioFileName || track.audioFile ? (
                    <>
                      <Typography
                        variant="caption"
                        sx={{
                          fontFamily: 'monospace',
                          color: 'warning.light',
                          fontSize: '0.72rem',
                          wordBreak: 'break-all',
                        }}
                      >
                        <strong>Staged Source:</strong> {track.audioFileName || track.audioFile?.name}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          fontFamily: 'monospace',
                          color: 'text.secondary',
                          fontSize: '0.7rem',
                          wordBreak: 'break-all',
                        }}
                      >
                        <strong>Target Transcode:</strong> data/cache/audio/ (*.flac lossless & *.mp3 stream)
                      </Typography>
                    </>
                  ) : (
                    <Typography
                      variant="caption"
                      sx={{
                        fontFamily: 'monospace',
                        color: 'text.disabled',
                        fontSize: '0.72rem',
                      }}
                    >
                      No audio file staged for caching.
                    </Typography>
                  )}
                </Box>

                <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.4 }}>
                  {track.audioFileName || track.audioFile
                    ? `Staged file "${track.audioFileName || track.audioFile?.name}" will be uploaded and transcoded into Lossless FLAC & adaptive MP3 tiers upon project creation.`
                    : 'No audio source file selected. Listeners will only be able to play this track if external streaming links are provided.'}
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
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <LinkIcon fontSize="small" color="action" /> Streaming Links ({Object.values(track.links || {}).filter(Boolean).length})
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={1.5}>
                  {PLATFORM_KEYS.map(({ key, label }) => {
                    const iconSrc = SOCIAL_ICONS[key]
                    const fieldKey = `new_track_${index}_${key}`
                    return (
                      <Grid key={key} size={{ xs: 12, sm: 6 }}>
                        <AdminTextInput
                          label={label}
                          size="small"
                          fullWidth
                          value={track.links?.[key] || ''}
                          onChange={(val) => onUpdateLink(index, key, val)}
                          isDirty={dirtyFields.has(fieldKey)}
                          isSaved={savedFields.has(fieldKey)}
                          slotProps={{
                            input: {
                              startAdornment: iconSrc ? (
                                <InputAdornment position="start">
                                  <Box
                                    component="img"
                                    src={iconSrc}
                                    alt=""
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
                            },
                          }}
                        />
                      </Grid>
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

export default TrackCreateCard
