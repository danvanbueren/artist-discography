'use client'

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
  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 4, lg: 3 }}>
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

      <Grid size={{ xs: 12, md: 8, lg: 9 }}>
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
