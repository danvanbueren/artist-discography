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
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ImageIcon from '@mui/icons-material/Image'
import AlbumIcon from '@mui/icons-material/Album'
import MusicNoteIcon from '@mui/icons-material/MusicNote'
import AddIcon from '@mui/icons-material/Add'
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh'
import AdminTextInput from '../common/AdminTextInput'
import AdminDateInput from '../common/AdminDateInput'
import TrackEditCard from '../tracks/TrackEditCard'
import { PROJECT_TYPES } from '../adminConstants'
import { formatMediaPath, createEmptyTrack, getMediaThumbnailUrl } from '../adminUtils'
import { slugify } from '../../../lib/slugs'

export default function ProjectEditForm({
  editName,
  setEditName,
  editNameRef,
  editType,
  setEditType,
  editTypeRef,
  editArtist,
  setEditArtist,
  editArtistRef,
  editDate,
  setEditDate,
  editDateRef,
  editVisibility = 'public',
  setEditVisibility,
  editVisibilityRef,
  editCopyright = 'cleared',
  setEditCopyright,
  editCopyrightRef,
  editCoverFile,
  setEditCoverFile,
  editCoverFileRef,
  editCoverPreview,
  editTracks = [],
  setEditTracks,
  editTracksRef,
  selectedProjIndex,
  projectsList = [],
  artistNameInput,
  defaultArtistName,
  isEditNameDuplicate,
  editDupTrackIndexes,
  dirtyFields,
  savedFields,
  getFieldSx,
  markFieldDirty,
  executeUpdateProject,
  setDeleteConfirmOpen,
  mediaJobs,
  handleUpdateEditTrackName,
  handleUpdateEditTrackArtist,
  handleUpdateEditTrackLink,
  handleEditTrackAudioUpload,
  handleEditTrackAudioRemove,
  handleMoveEditTrackUp,
  handleMoveEditTrackDown,
  handleDeleteEditTrack,
  handleCopyEditTrack,
}) {
  const currentProject = projectsList[selectedProjIndex] || {}
  const projectSlug = slugify(editName || currentProject.name || '')
  const coverJob = mediaJobs?.getJobForCover?.({
    projectSlug,
    fileName: editCoverFile?.name || 'art.jpg',
  }) || mediaJobs?.getJobForFile?.(editCoverFile?.name) || null

  return (
    <Stack spacing={3}>
      {/* Project Metadata & Artwork */}
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
            <EditIcon color="primary" /> Editing: {editName || 'Project'}
          </Typography>
          <Button
            variant="outlined"
            color="error"
            size="small"
            startIcon={<DeleteIcon />}
            onClick={() => setDeleteConfirmOpen(true)}
            sx={{ borderRadius: 2 }}
          >
            Delete Project
          </Button>
        </Box>

        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, sm: 8 }}>
            <AdminTextInput
              label="Project Title"
              fullWidth
              required
              value={editName}
              onChange={(val) => {
                setEditName(val)
                if (editNameRef) editNameRef.current = val
                markFieldDirty('edit_name', executeUpdateProject)
              }}
              error={isEditNameDuplicate}
              helperText={isEditNameDuplicate ? 'A project with this title / URL slug already exists.' : null}
              isDirty={dirtyFields.has('edit_name')}
              isSaved={savedFields.has('edit_name')}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <FormControl
              fullWidth
              size="small"
              required
              sx={getFieldSx('edit_type')}
            >
              <InputLabel id="edit-type-label">Release Type</InputLabel>
              <Select
                labelId="edit-type-label"
                label="Release Type"
                value={editType}
                onChange={(e) => {
                  const val = e.target.value
                  setEditType(val)
                  if (editTypeRef) editTypeRef.current = val
                  markFieldDirty('edit_type', executeUpdateProject)
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
              value={editArtist}
              onChange={(val) => {
                setEditArtist(val)
                if (editArtistRef) editArtistRef.current = val
                markFieldDirty('edit_artist', executeUpdateProject)
              }}
              isDirty={dirtyFields.has('edit_artist')}
              isSaved={savedFields.has('edit_artist')}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <AdminDateInput
              label="Release Date"
              fullWidth
              required
              value={editDate}
              onChange={(val) => {
                setEditDate(val)
                if (editDateRef) editDateRef.current = val
                markFieldDirty('edit_date', executeUpdateProject)
              }}
              isDirty={dirtyFields.has('edit_date')}
              isSaved={savedFields.has('edit_date')}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth size="small" sx={getFieldSx('edit_visibility')}>
              <InputLabel id="edit-visibility-label">Visibility</InputLabel>
              <Select
                labelId="edit-visibility-label"
                label="Visibility"
                value={editVisibility}
                onChange={(e) => {
                  const val = e.target.value
                  if (setEditVisibility) setEditVisibility(val)
                  if (editVisibilityRef) editVisibilityRef.current = val
                  markFieldDirty('edit_visibility', executeUpdateProject)
                }}
              >
                <MenuItem value="public">Public (Visible to All)</MenuItem>
                <MenuItem value="private">Private (Requires Access Code)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth size="small" sx={getFieldSx('edit_copyright')}>
              <InputLabel id="edit-copyright-label">Copyright Playback Status</InputLabel>
              <Select
                labelId="edit-copyright-label"
                label="Copyright Playback Status"
                value={editCopyright}
                onChange={(e) => {
                  const val = e.target.value
                  if (setEditCopyright) setEditCopyright(val)
                  if (editCopyrightRef) editCopyrightRef.current = val
                  markFieldDirty('edit_copyright', executeUpdateProject)
                }}
              >
                <MenuItem value="cleared">Cleared (Full In-Site Audio Playback)</MenuItem>
                <MenuItem value="uncleared">Uncleared (Links Only, In-Site Audio Gated)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2.5 }} />

        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
          Cover Artwork
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          {editCoverPreview ? (
            <Box
              component="img"
              src={getMediaThumbnailUrl(editCoverPreview, 160)}
              alt="Cover preview"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
                const fallbackEl = document.getElementById(`cover-fallback-${projectSlug}`)
                if (fallbackEl) fallbackEl.style.display = 'flex'
              }}
              sx={{
                width: 64,
                height: 64,
                aspectRatio: '1 / 1',
                borderRadius: 1.5,
                objectFit: 'cover',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                display: 'block',
              }}
            />
          ) : null}
          <Box
            id={`cover-fallback-${projectSlug}`}
            sx={{
              width: 64,
              height: 64,
              aspectRatio: '1 / 1',
              borderRadius: 1.5,
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: editCoverPreview ? 'none' : 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AlbumIcon sx={{ fontSize: 32, color: 'text.secondary' }} />
          </Box>
          <Button
            variant="outlined"
            component="label"
            startIcon={<CloudUploadIcon />}
            size="small"
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            {editCoverPreview || editCoverFile ? 'Replace Cover Image' : 'Upload Cover Image File (.jpg, .png)'}
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  const file = e.target.files[0]
                  setEditCoverFile(file)
                  if (editCoverFileRef) editCoverFileRef.current = file
                  markFieldDirty('edit_cover', executeUpdateProject, 100)
                }
              }}
            />
          </Button>
          {editCoverFile ? (
            <Chip
              icon={<CheckCircleIcon />}
              label={`New: ${editCoverFile.name}`}
              color="success"
              size="small"
              onDelete={() => {
                setEditCoverFile(null)
                if (editCoverFileRef) editCoverFileRef.current = null
              }}
            />
          ) : editCoverPreview ? (
            <Chip
              icon={<CheckCircleIcon />}
              label={`Cover art attached (${formatMediaPath(editCoverPreview, projectSlug, 'media')})`}
              color="success"
              variant="outlined"
              size="small"
              sx={{ fontWeight: 600 }}
            />
          ) : (
            <Chip
              icon={<ImageIcon />}
              label="No cover image attached"
              color="warning"
              variant="outlined"
              size="small"
              sx={{ fontWeight: 600 }}
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
            ) : editCoverFile ? (
              <Chip
                label="Staged (Pending Save)"
                color="warning"
                size="small"
                variant="outlined"
                sx={{ height: 22, fontSize: '0.72rem', fontWeight: 700 }}
              />
            ) : editCoverPreview ? (
              <Chip
                label="Active & Pre-Cached"
                color="success"
                size="small"
                sx={{ height: 22, fontSize: '0.72rem', fontWeight: 700 }}
              />
            ) : (
              <Chip
                label="No Artwork"
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
            {editCoverFile ? (
              <Typography
                variant="caption"
                sx={{
                  fontFamily: 'monospace',
                  color: 'warning.light',
                  fontSize: '0.72rem',
                  wordBreak: 'break-all',
                }}
              >
                <strong>Staged Source:</strong> {editCoverFile.name}
              </Typography>
            ) : editCoverPreview ? (
              <>
                <Typography
                  variant="caption"
                  sx={{
                    fontFamily: 'monospace',
                    color: 'primary.light',
                    fontSize: '0.72rem',
                    wordBreak: 'break-all',
                  }}
                >
                  <strong>Base Artwork:</strong> {formatMediaPath(editCoverPreview, projectSlug, 'media')}
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
                  <strong>Cached Tiers:</strong> data/cache/images/ (*.webp &amp; *.avif @ 1920w, 1080w, 640w, 320w + 32w blur)
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
                  <strong>Media Endpoint:</strong> {editCoverPreview.startsWith('/api/media/') ? editCoverPreview : `/api/media/projects/${projectSlug}/${editCoverPreview}`}
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
                No artwork cached on disk.
              </Typography>
            )}
          </Box>

          <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.4 }}>
            {editCoverFile
              ? `Staged file "${editCoverFile.name}" will be automatically converted to responsive WebP/AVIF variants (320w, 640w, 1080w, 1920w) and cached with HTTP 304 ETags.`
              : editCoverPreview
              ? 'Optimized responsive WebP & AVIF tiers (320w, 640w, 1080w, 1920w) generated. Client LRU in-memory preloading and 1-day browser HTTP caching active.'
              : 'No cover image file uploaded. The site will display the default vinyl disc placeholder.'}
          </Typography>
        </Box>
      </Paper>

      {/* Edit Tracks */}
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
            <MusicNoteIcon color="primary" /> Edit Tracks ({editTracks.length})
          </Typography>
          <Button
            variant="contained"
            color="secondary"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => {
              const n = [...editTracks, createEmptyTrack()]
              setEditTracks(n)
              if (editTracksRef) editTracksRef.current = n
              markFieldDirty('edit_add_track', () => executeUpdateProject(n), 100)
            }}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Add Track
          </Button>
        </Box>

        <Stack spacing={2}>
          {editTracks.map((track, index) => (
            <TrackEditCard
              key={track.id}
              track={track}
              index={index}
              totalTracks={editTracks.length}
              defaultArtist={editArtist.trim() || artistNameInput?.trim() || defaultArtistName}
              projectName={editName || currentProject.name || ''}
              allProjects={projectsList}
              currentTracks={editTracks}
              currentProjectIndex={selectedProjIndex}
              isDuplicate={editDupTrackIndexes?.has(index)}
              isDirtyTitle={dirtyFields.has(`edit_track_${index}_title`)}
              isSavedTitle={savedFields.has(`edit_track_${index}_title`)}
              isDirtyArtist={dirtyFields.has(`edit_track_${index}_artist`)}
              isSavedArtist={savedFields.has(`edit_track_${index}_artist`)}
              dirtyFields={dirtyFields}
              savedFields={savedFields}
              projectSlug={projectSlug}
              processingJob={mediaJobs?.getJobForTrack?.({
                projectSlug,
                trackSlug: slugify(track.name || track.originalName || ''),
                trackName: track.name || track.originalName,
                fileName: track.audioFileName,
              }) || mediaJobs?.getJobForFile?.(track.audioFileName)}
              onUpdateName={handleUpdateEditTrackName}
              onUpdateArtist={handleUpdateEditTrackArtist}
              onUpdateLink={handleUpdateEditTrackLink}
              onAudioUpload={handleEditTrackAudioUpload}
              onAudioRemove={handleEditTrackAudioRemove}
              onMoveUp={handleMoveEditTrackUp}
              onMoveDown={handleMoveEditTrackDown}
              onDelete={handleDeleteEditTrack}
              onCopy={handleCopyEditTrack}
            />
          ))}
        </Stack>
      </Paper>
    </Stack>
  )
}
