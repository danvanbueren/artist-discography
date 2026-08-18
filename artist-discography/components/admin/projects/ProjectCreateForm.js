'use client'

import {
  Stack,
  Paper,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Box,
  Button,
  Chip,
  LinearProgress,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import MusicNoteIcon from '@mui/icons-material/MusicNote'
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh'
import AdminTextInput from '../common/AdminTextInput'
import TrackCreateCard from '../tracks/TrackCreateCard'
import { PROJECT_TYPES } from '../adminConstants'
import { createEmptyTrack } from '../adminUtils'

export default function ProjectCreateForm({
  name,
  setName,
  nameRef,
  type,
  setType,
  typeRef,
  artist,
  setArtist,
  artistRef,
  date,
  setDate,
  dateRef,
  coverFile,
  setCoverFile,
  coverFileRef,
  coverPreview,
  tracks,
  setTracks,
  artistNameInput,
  defaultArtistName,
  isNewNameDuplicate,
  newDupTrackIndexes,
  dirtyFields,
  savedFields,
  getFieldSx,
  markFieldDirty,
  executeCreateProject,
  mediaJobs,
  handleUpdateCreateTrackName,
  handleUpdateCreateTrackArtist,
  handleUpdateCreateTrackLink,
  handleCreateTrackAudioUpload,
  handleCreateTrackAudioRemove,
  handleMoveCreateTrackUp,
  handleMoveCreateTrackDown,
  handleDeleteCreateTrack,
}) {
  const coverJob = mediaJobs?.getJobForFile?.(coverFile?.name || `${name} (Cover Art)`) || null
  return (
    <Stack spacing={3}>
      <Paper
        variant="outlined"
        sx={{
          p: 3,
          borderRadius: 2.5,
          backgroundColor: 'rgba(28, 28, 38, 0.6)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            mb: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <AddIcon color="secondary" /> Create New Project
        </Typography>

        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, sm: 8 }}>
            <AdminTextInput
              label="Project Title"
              placeholder="e.g. Post Mortem, Sugar Water"
              fullWidth
              required
              value={name}
              onChange={(val) => {
                setName(val)
                if (nameRef) nameRef.current = val
                markFieldDirty('new_name', executeCreateProject)
              }}
              error={isNewNameDuplicate}
              helperText={isNewNameDuplicate ? 'A project with this title / URL slug already exists.' : null}
              isDirty={dirtyFields.has('new_name')}
              isSaved={savedFields.has('new_name')}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <FormControl
              fullWidth
              size="small"
              required
              sx={getFieldSx('new_type')}
            >
              <InputLabel id="new-type-label">Release Type</InputLabel>
              <Select
                labelId="new-type-label"
                label="Release Type"
                value={type}
                onChange={(e) => {
                  const val = e.target.value
                  setType(val)
                  if (typeRef) typeRef.current = val
                  markFieldDirty('new_type', executeCreateProject)
                }}
              >
                {PROJECT_TYPES.map((t) => (
                  <MenuItem key={t} value={t}>{t}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <AdminTextInput
              label="Artist Name (Optional Override)"
              placeholder={`Defaults to "${artistNameInput?.trim() || defaultArtistName}"`}
              fullWidth
              value={artist}
              onChange={(val) => {
                setArtist(val)
                if (artistRef) artistRef.current = val
                markFieldDirty('new_artist', executeCreateProject)
              }}
              isDirty={dirtyFields.has('new_artist')}
              isSaved={savedFields.has('new_artist')}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <AdminTextInput
              label="Release Date"
              type="date"
              fullWidth
              required
              value={date}
              onChange={(val) => {
                setDate(val)
                if (dateRef) dateRef.current = val
                markFieldDirty('new_date', executeCreateProject)
              }}
              slotProps={{ inputLabel: { shrink: true } }}
              isDirty={dirtyFields.has('new_date')}
              isSaved={savedFields.has('new_date')}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 2.5 }} />

        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
          Cover Artwork
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          {coverPreview && (
            <Box
              component="img"
              src={coverPreview}
              alt="Cover preview"
              sx={{ width: 64, height: 64, borderRadius: 1.5, objectFit: 'cover' }}
            />
          )}
          <Button
            variant="contained"
            component="label"
            startIcon={<CloudUploadIcon />}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            {coverPreview || coverFile ? 'Replace Cover Image' : 'Upload Cover Image File (.jpg, .png)'}
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  const file = e.target.files[0]
                  setCoverFile(file)
                  if (coverFileRef) coverFileRef.current = file
                  markFieldDirty('new_cover', executeCreateProject)
                }
              }}
            />
          </Button>
          {coverFile && (
            <Chip
              icon={<CheckCircleIcon />}
              label={`New: ${coverFile.name}`}
              color="success"
              onDelete={() => {
                setCoverFile(null)
                if (coverFileRef) coverFileRef.current = null
              }}
              size="small"
            />
          )}
        </Box>

        <Box
          sx={{
            mt: 2,
            p: 1.5,
            borderRadius: 1.5,
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
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
              Artwork Cache & Optimization State
            </Typography>
            {coverJob && (coverJob.status === 'processing' || coverJob.status === 'queued') ? (
              <Chip
                icon={<AutoFixHighIcon sx={{ fontSize: '14px !important' }} />}
                label={`Sharp Optimizing (${coverJob.progress || 0}%)...`}
                color="warning"
                size="small"
                sx={{ height: 22, fontSize: '0.72rem', fontWeight: 700 }}
              />
            ) : coverFile ? (
              <Chip
                label="Staged for Project Creation"
                color="warning"
                size="small"
                variant="outlined"
                sx={{ height: 22, fontSize: '0.72rem', fontWeight: 700 }}
              />
            ) : (
              <Chip
                label="No Artwork Staged"
                color="default"
                size="small"
                variant="outlined"
                sx={{ height: 22, fontSize: '0.72rem' }}
              />
            )}
          </Box>

          {/* Inline Real-Time Sharp Progress Bar */}
          {coverJob && (coverJob.status === 'processing' || coverJob.status === 'queued') && (
            <Box
              sx={{
                p: 1.2,
                borderRadius: 1.5,
                backgroundColor: 'rgba(2, 136, 209, 0.12)',
                border: '1px solid rgba(41, 182, 246, 0.3)',
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
                  variant="caption"
                  sx={{ color: '#81d4fa', fontWeight: 700, fontSize: '0.75rem' }}
                >
                  {coverJob.currentStep || 'Sharp generating responsive WebP & AVIF tiers...'}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: '#81d4fa', fontWeight: 800, fontSize: '0.75rem' }}
                >
                  {coverJob.progress || 0}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={coverJob.progress || 0}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 3,
                    background: 'linear-gradient(90deg, #29b6f6 0%, #0288d1 100%)',
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
            {coverFile ? (
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
                  <strong>Staged Source:</strong> {coverFile.name}
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
                  <strong>Target Cache Path:</strong> data/cache/images/ (*.webp &amp; *.avif multi-res tiers)
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
                No cover image staged for caching.
              </Typography>
            )}
          </Box>

          <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.4 }}>
            {coverFile
              ? `Cover image "${coverFile.name}" is staged. It will be pre-compressed into WebP/AVIF multi-resolution variants upon project creation.`
              : 'No cover image file staged. The project will use the default artwork placeholder until uploaded.'}
          </Typography>
        </Box>
      </Paper>

      {/* Track Builder */}
      <Paper
        variant="outlined"
        sx={{
          p: 3,
          borderRadius: 2.5,
          backgroundColor: 'rgba(28, 28, 38, 0.6)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <MusicNoteIcon color="primary" /> Track List ({tracks.length})
          </Typography>
          <Button
            variant="contained"
            color="secondary"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => {
              setTracks((prev) => [...prev, createEmptyTrack()])
              markFieldDirty('new_add_track', executeCreateProject)
            }}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Add Track
          </Button>
        </Box>

        <Stack spacing={2}>
          {tracks.map((track, index) => (
            <TrackCreateCard
              key={track.id}
              track={track}
              index={index}
              totalTracks={tracks.length}
              defaultArtist={artist.trim() || artistNameInput?.trim() || defaultArtistName}
              isDuplicate={newDupTrackIndexes?.has(index)}
              isDirtyTitle={dirtyFields.has(`new_track_${index}_title`)}
              isSavedTitle={savedFields.has(`new_track_${index}_title`)}
              isDirtyArtist={dirtyFields.has(`new_track_${index}_artist`)}
              isSavedArtist={savedFields.has(`new_track_${index}_artist`)}
              dirtyFields={dirtyFields}
              savedFields={savedFields}
              processingJob={mediaJobs?.getJobForFile?.(track.name || track.audioFileName)}
              onUpdateName={handleUpdateCreateTrackName}
              onUpdateArtist={handleUpdateCreateTrackArtist}
              onUpdateLink={handleUpdateCreateTrackLink}
              onAudioUpload={handleCreateTrackAudioUpload}
              onAudioRemove={handleCreateTrackAudioRemove}
              onMoveUp={handleMoveCreateTrackUp}
              onMoveDown={handleMoveCreateTrackDown}
              onDelete={handleDeleteCreateTrack}
            />
          ))}
        </Stack>
      </Paper>
    </Stack>
  )
}
