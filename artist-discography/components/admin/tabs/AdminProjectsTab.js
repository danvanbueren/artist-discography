'use client'

import { useRef, useEffect } from 'react'
import { Grid } from '@mui/material'
import ProjectSidebarList from '../projects/ProjectSidebarList'
import ProjectCreateForm from '../projects/ProjectCreateForm'
import ProjectEditForm from '../projects/ProjectEditForm'

/**
 * Projects Tab view containing left catalog sidebar and right form editor.
 */
export default function AdminProjectsTab({
  projects,
  profile,
  defaultArtistName,
  autoSave,
  mediaJobs,
  handleSaveCreateProject,
  handleSaveUpdateProject,
}) {
  const editColumnRef = useRef(null)

  // Reset scroll position to top whenever a new project is selected or created
  useEffect(() => {
    if (editColumnRef.current) {
      editColumnRef.current.scrollTop = 0
    }
  }, [projects.selectedProjIndex, projects.isCreatingNew])

  return (
    <Grid
      container
      spacing={3}
      sx={{
        height: { xs: 'auto', md: '100%' },
        minHeight: 0,
        flexGrow: 1,
      }}
    >
      <Grid
        size={{ xs: 12, md: 5, lg: 4.5, xl: 4 }}
        sx={{
          height: { xs: 'auto', md: '100%' },
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <ProjectSidebarList
          projectsList={projects.projectsList}
          selectedProjIndex={projects.selectedProjIndex}
          isCreatingNew={projects.isCreatingNew}
          dirtyFields={autoSave.dirtyFields}
          handleStartCreateNewProject={projects.handleStartCreateNewProject}
          handleSelectProject={projects.handleSelectProject}
          name={projects.name}
          type={projects.type}
          tracks={projects.tracks}
          coverPreview={projects.coverPreview}
        />
      </Grid>

      <Grid
        ref={editColumnRef}
        size={{ xs: 12, md: 7, lg: 7.5, xl: 8 }}
        sx={{
          height: { xs: 'auto', md: '100%' },
          minHeight: 0,
          overflowY: { xs: 'visible', md: 'auto' },
          pr: { xs: 0, md: 1 },
        }}
      >
        {projects.isCreatingNew ? (
          <ProjectCreateForm
            name={projects.name}
            setName={projects.setName}
            nameRef={projects.nameRef}
            type={projects.type}
            setType={projects.setType}
            typeRef={projects.typeRef}
            artist={projects.artist}
            setArtist={projects.setArtist}
            artistRef={projects.artistRef}
            date={projects.date}
            setDate={projects.setDate}
            dateRef={projects.dateRef}
            visibility={projects.visibility}
            setVisibility={projects.setVisibility}
            visibilityRef={projects.visibilityRef}
            copyright={projects.copyright}
            setCopyright={projects.setCopyright}
            copyrightRef={projects.copyrightRef}
            coverFile={projects.coverFile}
            setCoverFile={projects.setCoverFile}
            coverFileRef={projects.coverFileRef}
            coverPreview={projects.coverPreview}
            tracks={projects.tracks}
            setTracks={projects.setTracks}
            tracksRef={projects.tracksRef}
            projectsList={projects.projectsList}
            artistNameInput={profile.artistNameInput}
            defaultArtistName={defaultArtistName}
            isNewNameDuplicate={projects.isNewNameDuplicate}
            newNameValidationError={projects.newNameValidationError}
            newDupTrackIndexes={projects.newDupTrackIndexes}
            dirtyFields={autoSave.dirtyFields}
            savedFields={autoSave.savedFields}
            getFieldSx={autoSave.getFieldSx}
            markFieldDirty={autoSave.markFieldDirty}
            executeCreateProject={handleSaveCreateProject}
            handleUpdateCreateTrackName={projects.handleUpdateCreateTrackName}
            handleUpdateCreateTrackArtist={projects.handleUpdateCreateTrackArtist}
            handleUpdateCreateTrackLink={projects.handleUpdateCreateTrackLink}
            handleCreateTrackAudioUpload={projects.handleCreateTrackAudioUpload}
            handleCreateTrackAudioRemove={projects.handleCreateTrackAudioRemove}
            handleMoveCreateTrackUp={projects.handleMoveCreateTrackUp}
            handleMoveCreateTrackDown={projects.handleMoveCreateTrackDown}
            handleDeleteCreateTrack={projects.handleDeleteCreateTrack}
          />
        ) : (
          <ProjectEditForm
            isPending={projects.isPendingProjectSwitch}
            editName={projects.editName}
            setEditName={projects.setEditName}
            editNameRef={projects.editNameRef}
            editType={projects.editType}
            setEditType={projects.setEditType}
            editTypeRef={projects.editTypeRef}
            editArtist={projects.editArtist}
            setEditArtist={projects.setEditArtist}
            editArtistRef={projects.editArtistRef}
            editDate={projects.editDate}
            setDate={projects.setEditDate}
            editDateRef={projects.editDateRef}
            editVisibility={projects.editVisibility}
            setVisibility={projects.setEditVisibility}
            editVisibilityRef={projects.editVisibilityRef}
            editCopyright={projects.editCopyright}
            setCopyright={projects.setEditCopyright}
            editCopyrightRef={projects.editCopyrightRef}
            editCoverFile={projects.editCoverFile}
            setEditCoverFile={projects.setEditCoverFile}
            editCoverFileRef={projects.editCoverFileRef}
            editCoverPreview={projects.editCoverPreview}
            editTracks={projects.editTracks}
            setEditTracks={projects.setEditTracks}
            editTracksRef={projects.editTracksRef}
            selectedProjIndex={projects.selectedProjIndex}
            projectsList={projects.projectsList}
            artistNameInput={profile.artistNameInput}
            defaultArtistName={defaultArtistName}
            isEditNameDuplicate={projects.isEditNameDuplicate}
            editNameValidationError={projects.editNameValidationError}
            editDupTrackIndexes={projects.editDupTrackIndexes}
            dirtyFields={autoSave.dirtyFields}
            savedFields={autoSave.savedFields}
            getFieldSx={autoSave.getFieldSx}
            markFieldDirty={autoSave.markFieldDirty}
            executeUpdateProject={handleSaveUpdateProject}
            setDeleteConfirmOpen={projects.setDeleteConfirmOpen}
            mediaJobs={mediaJobs}
            handleUpdateEditTrackName={projects.handleUpdateEditTrackName}
            handleUpdateEditTrackArtist={projects.handleUpdateEditTrackArtist}
            handleUpdateEditTrackLink={projects.handleUpdateEditTrackLink}
            handleEditTrackAudioUpload={projects.handleEditTrackAudioUpload}
            handleEditTrackAudioRemove={projects.handleEditTrackAudioRemove}
            handleMoveEditTrackUp={projects.handleMoveEditTrackUp}
            handleMoveEditTrackDown={projects.handleMoveEditTrackDown}
            handleDeleteEditTrack={projects.handleDeleteEditTrack}
            handleCopyEditTrack={projects.handleCopyEditTrack}
          />
        )}
      </Grid>
    </Grid>
  )
}
