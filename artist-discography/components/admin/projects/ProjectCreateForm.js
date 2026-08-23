'use client'

import { Stack, Paper, Typography, Grid, Box, Button } from '@mui/material'
import AddCircleOutlineRoundedIcon from '@mui/icons-material/AddCircleOutlineRounded'
import MusicNoteIcon from '@mui/icons-material/MusicNote'
import AddIcon from '@mui/icons-material/Add'
import TrackCreateCard from '../tracks/TrackCreateCard'
import ProjectMetadataFields from '../project/ProjectMetadataFields'
import ProjectCoverUploader from '../project/ProjectCoverUploader'
import { createEmptyTrack } from '../adminUtils'

/**
 * ProjectCreateForm
 * Form view for creating a brand new project release with artwork and tracklist.
 */
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
  visibility = 'public',
  setVisibility,
  visibilityRef,
  copyright = 'cleared',
  setCopyright,
  copyrightRef,
  coverFile,
  setCoverFile,
  coverFileRef,
  coverPreview,
  tracks = [],
  setTracks,
  tracksRef,
  projectsList = [],
  artistNameInput,
  defaultArtistName,
  isNewNameDuplicate,
  newNameValidationError,
  newDupTrackIndexes,
  dirtyFields,
  savedFields,
  getFieldSx,
  markFieldDirty,
  executeCreateProject,
  handleUpdateCreateTrackName,
  handleUpdateCreateTrackArtist,
  handleUpdateCreateTrackLink,
  handleCreateTrackAudioUpload,
  handleCreateTrackAudioRemove,
  handleMoveCreateTrackUp,
  handleMoveCreateTrackDown,
  handleDeleteCreateTrack,
}) {
  return (
    <Stack spacing={3}>
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
            <AddCircleOutlineRoundedIcon color='primary' /> Create New Project
          </Typography>
        </Box>

        <Grid container spacing={2.5}>
          <ProjectMetadataFields
            prefix='new'
            name={name}
            setName={setName}
            nameRef={nameRef}
            type={type}
            setType={setType}
            typeRef={typeRef}
            artist={artist}
            setArtist={setArtist}
            artistRef={artistRef}
            date={date}
            setDate={setDate}
            dateRef={dateRef}
            visibility={visibility}
            setVisibility={setVisibility}
            visibilityRef={visibilityRef}
            copyright={copyright}
            setCopyright={setCopyright}
            copyrightRef={copyrightRef}
            defaultArtistName={defaultArtistName}
            artistNameInput={artistNameInput}
            isNameDuplicate={isNewNameDuplicate}
            nameValidationError={newNameValidationError}
            dirtyFields={dirtyFields}
            savedFields={savedFields}
            getFieldSx={getFieldSx}
            markFieldDirty={markFieldDirty}
            onTriggerSave={executeCreateProject}
          />

          <ProjectCoverUploader
            coverFile={coverFile}
            coverPreview={coverPreview}
            onCoverChange={(file) => {
              setCoverFile(file)
              if (coverFileRef) coverFileRef.current = file
              markFieldDirty('new_cover', executeCreateProject)
            }}
            onCoverRemove={() => {
              setCoverFile(null)
              if (coverFileRef) coverFileRef.current = null
              setCoverPreview(null)
            }}
            isEditing={false}
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
            <MusicNoteIcon color='primary' /> Tracks ({tracks.length})
          </Typography>
          <Button
            variant='contained'
            size='small'
            startIcon={<AddIcon />}
            onClick={() => {
              const newTracks = [...tracks, createEmptyTrack()]
              setTracks(newTracks)
              if (tracksRef) tracksRef.current = newTracks
              markFieldDirty('new_add_track', executeCreateProject)
            }}
            sx={{ borderRadius: 2 }}
          >
            Add Track
          </Button>
        </Box>

        <Stack spacing={2}>
          {tracks.map((track, idx) => {
            const isDup = newDupTrackIndexes?.has?.(idx) || false

            return (
              <TrackCreateCard
                key={idx}
                track={track}
                index={idx}
                totalTracks={tracks.length}
                defaultArtist={artist?.trim() || artistNameInput?.trim() || defaultArtistName}
                projectName={name}
                allProjects={projectsList}
                currentTracks={tracks}
                isDuplicate={isDup}
                isDirtyTitle={dirtyFields.has(`new_track_${idx}_title`)}
                isSavedTitle={savedFields.has(`new_track_${idx}_title`)}
                isDirtyArtist={dirtyFields.has(`new_track_${idx}_artist`)}
                isSavedArtist={savedFields.has(`new_track_${idx}_artist`)}
                isDirtyLink={(key) => dirtyFields.has(`new_track_${idx}_${key}`)}
                isSavedLink={(key) => savedFields.has(`new_track_${idx}_${key}`)}
                onUpdateTrackName={(tIdx, val) =>
                  handleUpdateCreateTrackName(tIdx, val, () =>
                    markFieldDirty(`new_track_${tIdx}_title`, executeCreateProject),
                  )
                }
                onUpdateTrackArtist={(tIdx, val) =>
                  handleUpdateCreateTrackArtist(tIdx, val, () =>
                    markFieldDirty(`new_track_${tIdx}_artist`, executeCreateProject),
                  )
                }
                onUpdateTrackLink={(tIdx, key, val) =>
                  handleUpdateCreateTrackLink(tIdx, key, val, () =>
                    markFieldDirty(`new_track_${tIdx}_${key}`, executeCreateProject),
                  )
                }
                onAudioUpload={(tIdx, file) =>
                  handleCreateTrackAudioUpload(tIdx, file, () =>
                    markFieldDirty(`new_track_${tIdx}_audio`, executeCreateProject),
                  )
                }
                onAudioRemove={(tIdx) => {
                  handleCreateTrackAudioRemove(tIdx)
                  markFieldDirty(`new_track_${tIdx}_audio_remove`, executeCreateProject)
                }}
                onMoveUp={(tIdx) => handleMoveCreateTrackUp(tIdx)}
                onMoveDown={(tIdx) => handleMoveCreateTrackDown(tIdx)}
                onDeleteTrack={handleDeleteCreateTrack}
              />
            )
          })}
        </Stack>
      </Box>
    </Stack>
  )
}
