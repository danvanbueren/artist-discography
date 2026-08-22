'use client'

import { Stack, Paper, Typography, Grid, Divider, Box, Button, LinearProgress } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import MusicNoteIcon from '@mui/icons-material/MusicNote'
import AddIcon from '@mui/icons-material/Add'
import TrackEditCard from '../tracks/TrackEditCard'
import ProjectMetadataFields from '../project/ProjectMetadataFields'
import ProjectCoverUploader from '../project/ProjectCoverUploader'
import { createEmptyTrack } from '../adminUtils'
import { slugify } from '@/lib/data/slugs'

/**
 * ProjectEditForm
 * Form view for modifying an existing project's metadata, cover artwork, and tracklist.
 */
export default function ProjectEditForm({
  isPending = false,
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
  editNameValidationError,
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
  const coverJob =
    mediaJobs?.getJobForCover?.({
      projectSlug,
      fileName: editCoverFile?.name || 'art.jpg',
    }) ||
    mediaJobs?.getJobForFile?.(editCoverFile?.name) ||
    null

  return (
    <Stack
      spacing={3}
      sx={{
        position: 'relative',
        opacity: isPending ? 0.65 : 1,
        pointerEvents: isPending ? 'none' : 'auto',
        transition: 'opacity 0.15s ease',
      }}
    >
      {isPending && (
        <LinearProgress
          color='secondary'
          sx={{
            borderRadius: 1,
            height: 3,
            mb: -2,
          }}
        />
      )}

      {/* Project Metadata & Artwork Card */}
      <Paper
        variant='outlined'
        sx={{
          p: 3,
          borderRadius: 2.5,
          backgroundColor: 'rgba(28, 28, 38, 0.6)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography
            variant='h6'
            sx={{
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <EditIcon color='primary' /> Editing: {editName || 'Project'}
          </Typography>
          <Button
            variant='outlined'
            color='error'
            size='small'
            startIcon={<DeleteIcon />}
            onClick={() => setDeleteConfirmOpen(true)}
            sx={{ borderRadius: 2 }}
          >
            Delete Project
          </Button>
        </Box>

        <Grid container spacing={2.5}>
          <ProjectMetadataFields
            prefix='edit'
            name={editName}
            setName={setEditName}
            nameRef={editNameRef}
            type={editType}
            setType={setEditType}
            typeRef={editTypeRef}
            artist={editArtist}
            setArtist={setEditArtist}
            artistRef={editArtistRef}
            date={editDate}
            setDate={setEditDate}
            dateRef={editDateRef}
            visibility={editVisibility}
            setVisibility={setEditVisibility}
            visibilityRef={editVisibilityRef}
            copyright={editCopyright}
            setCopyright={setEditCopyright}
            copyrightRef={editCopyrightRef}
            defaultArtistName={defaultArtistName}
            artistNameInput={artistNameInput}
            isNameDuplicate={isEditNameDuplicate}
            nameValidationError={editNameValidationError}
            dirtyFields={dirtyFields}
            savedFields={savedFields}
            getFieldSx={getFieldSx}
            markFieldDirty={markFieldDirty}
            onTriggerSave={executeUpdateProject}
          />

          <ProjectCoverUploader
            coverFile={editCoverFile}
            coverPreview={editCoverPreview}
            existingCoverUrl={currentProject.cover}
            onCoverChange={(file) => {
              setEditCoverFile(file)
              if (editCoverFileRef) editCoverFileRef.current = file
              markFieldDirty('edit_cover', executeUpdateProject)
            }}
            coverJob={coverJob}
            isEditing
          />
        </Grid>
      </Paper>

      {/* Tracks Section */}
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography
            variant='h6'
            sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <MusicNoteIcon color='primary' /> Tracks ({editTracks.length})
          </Typography>
          <Button
            variant='contained'
            size='small'
            startIcon={<AddIcon />}
            onClick={() => {
              const newTracks = [...editTracks, createEmptyTrack()]
              setEditTracks(newTracks)
              if (editTracksRef) editTracksRef.current = newTracks
              markFieldDirty('edit_add_track', executeUpdateProject)
            }}
            sx={{ borderRadius: 2 }}
          >
            Add Track
          </Button>
        </Box>

        <Stack spacing={2}>
          {editTracks.map((track, idx) => {
            const isDup = editDupTrackIndexes?.has?.(idx) || false
            const audioJob =
              mediaJobs?.getJobForAudio?.({
                projectSlug,
                trackName: track.name,
                fileName: track.audioFile?.name,
              }) || null

            return (
              <TrackEditCard
                key={track.id || idx}
                track={track}
                index={idx}
                totalTracks={editTracks.length}
                defaultArtist={artistNameInput?.trim() || defaultArtistName}
                projectName={editName || currentProject.name}
                allProjects={projectsList}
                currentTracks={editTracks}
                currentProjectIndex={selectedProjIndex}
                isDuplicate={isDup}
                isDirtyTitle={dirtyFields.has(`edit_track_${idx}_title`)}
                isSavedTitle={savedFields.has(`edit_track_${idx}_title`)}
                isDirtyArtist={dirtyFields.has(`edit_track_${idx}_artist`)}
                isSavedArtist={savedFields.has(`edit_track_${idx}_artist`)}
                isDirtyLink={(key) => dirtyFields.has(`edit_track_${idx}_${key}`)}
                isSavedLink={(key) => savedFields.has(`edit_track_${idx}_${key}`)}
                isAudioTranscoding={Boolean(audioJob)}
                transcodeProgress={audioJob?.progress ?? null}
                transcodePhase={audioJob?.phase ?? null}
                onUpdateTrackName={(tIdx, val) =>
                  handleUpdateEditTrackName(tIdx, val, () =>
                    markFieldDirty(`edit_track_${tIdx}_title`, executeUpdateProject),
                  )
                }
                onUpdateTrackArtist={(tIdx, val) =>
                  handleUpdateEditTrackArtist(tIdx, val, () =>
                    markFieldDirty(`edit_track_${tIdx}_artist`, executeUpdateProject),
                  )
                }
                onUpdateTrackLink={(tIdx, key, val) =>
                  handleUpdateEditTrackLink(tIdx, key, val, () =>
                    markFieldDirty(`edit_track_${tIdx}_${key}`, executeUpdateProject),
                  )
                }
                onAudioUpload={(tIdx, file) =>
                  handleEditTrackAudioUpload(tIdx, file, () =>
                    markFieldDirty(`edit_track_${tIdx}_audio`, executeUpdateProject),
                  )
                }
                onAudioRemove={(tIdx) => {
                  handleEditTrackAudioRemove(tIdx)
                  markFieldDirty(`edit_track_${tIdx}_audio_remove`, executeUpdateProject)
                }}
                onMoveUp={(tIdx) =>
                  handleMoveEditTrackUp(tIdx, (key, newTracksList) =>
                    markFieldDirty(key, (pwd) => executeUpdateProject(pwd, newTracksList)),
                  )
                }
                onMoveDown={(tIdx) =>
                  handleMoveEditTrackDown(tIdx, (key, newTracksList) =>
                    markFieldDirty(key, (pwd) => executeUpdateProject(pwd, newTracksList)),
                  )
                }
                onDeleteTrack={handleDeleteEditTrack}
                onCopyTrack={handleCopyEditTrack}
              />
            )
          })}
        </Stack>
      </Box>
    </Stack>
  )
}
