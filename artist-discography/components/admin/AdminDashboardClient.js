'use client'

import { useState, useCallback, useRef } from 'react'
import {
  Box,
  Container,
  Paper,
  Grid,
} from '@mui/material'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'

import { adminTheme } from './adminTheme'
import { useAdminAuth } from './hooks/useAdminAuth'
import { useAutoSave } from './hooks/useAutoSave'
import { useArtistProfile } from './hooks/useArtistProfile'
import { useProjectsManager } from './hooks/useProjectsManager'

import AdminAccessDisabled from './auth/AdminAccessDisabled'
import AdminLoginView from './auth/AdminLoginView'
import AdminHeader from './layout/AdminHeader'
import ArtistProfileTab from './profile/ArtistProfileTab'
import ProjectSidebarList from './projects/ProjectSidebarList'
import ProjectCreateForm from './projects/ProjectCreateForm'
import ProjectEditForm from './projects/ProjectEditForm'
import DeleteProjectDialog from './dialogs/DeleteProjectDialog'
import DeleteTrackDialog from './dialogs/DeleteTrackDialog'
import CopyTrackDialog from './dialogs/CopyTrackDialog'

export default function AdminDashboardClient({
  adminAccess = true,
  defaultArtistName = 'Artist',
  initialData = {},
}) {
  // Tabs: 0 = Artist Profile, 1 = Manage Projects
  const [activeTab, setActiveTab] = useState(() => {
    const existingName = initialData?.artist?.name
    return Boolean(existingName && existingName.trim()) ? 1 : 0
  })

  // 1. Authentication hook
  const auth = useAdminAuth(initialData)

  // 2. Ref to editName for dynamic action labeling in useAutoSave
  const editNameBridgeRef = useRef('')

  // 3. Auto-save engine hook
  const autoSave = useAutoSave(editNameBridgeRef)

  // 4. Artist profile state hook
  const profile = useArtistProfile(initialData, defaultArtistName, autoSave.setErrorMessage)

  // 5. Projects & releases manager hook
  const projects = useProjectsManager({
    initialData,
    defaultArtistName,
    artistData: profile.artistData,
    artistNameInputRef: profile.artistNameInputRef,
    markFieldDirty: autoSave.markFieldDirty,
    clearPendingAutoSave: autoSave.clearPendingAutoSave,
    setErrorMessage: autoSave.setErrorMessage,
    setStatusMessage: autoSave.setStatusMessage,
  })

  // Keep bridge ref in sync with projects.editName
  editNameBridgeRef.current = projects.editName

  // Auto-save save callbacks binding authentication password
  const handleSaveArtist = useCallback(() => {
    return profile.executeSaveArtist(auth.password)
  }, [profile, auth.password])

  const handleSaveCreateProject = useCallback(() => {
    return projects.executeCreateProject(auth.password)
  }, [projects, auth.password])

  const handleSaveUpdateProject = useCallback((overrideTracks = null) => {
    return projects.executeUpdateProject(auth.password, overrideTracks)
  }, [projects, auth.password])

  // Track modification trigger helpers for create and edit forms
  const handleTriggerCreateSave = useCallback((fieldKey) => {
    autoSave.markFieldDirty(fieldKey, handleSaveCreateProject)
  }, [autoSave, handleSaveCreateProject])

  const handleTriggerEditSave = useCallback((fieldKey, overrideTracks = null, delayMs = 1000) => {
    autoSave.markFieldDirty(fieldKey, () => handleSaveUpdateProject(overrideTracks), delayMs)
  }, [autoSave, handleSaveUpdateProject])

  // ----------------------------------------------------
  // Early Returns: Access Disabled / Unauthenticated
  // ----------------------------------------------------
  if (!adminAccess) {
    return (
      <ThemeProvider theme={adminTheme}>
        <CssBaseline />
        <AdminAccessDisabled />
      </ThemeProvider>
    )
  }

  if (!auth.isAuthenticated && initialData?.adminPassword !== '') {
    return (
      <ThemeProvider theme={adminTheme}>
        <CssBaseline />
        <AdminLoginView
          password={auth.password}
          setPassword={auth.setPassword}
          authError={auth.authError}
          setAuthError={auth.setAuthError}
          isAuthLoading={auth.isAuthLoading}
          handleLogin={auth.handleLogin}
        />
      </ThemeProvider>
    )
  }

  // ----------------------------------------------------
  // Full Admin Dashboard
  // ----------------------------------------------------
  return (
    <ThemeProvider theme={adminTheme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          height: { md: '100vh' },
          width: '100%',
          bgcolor: 'background.default',
          color: 'text.primary',
          display: 'flex',
          flexDirection: 'column',
          overflow: { xs: 'auto', md: 'hidden' },
          boxSizing: 'border-box',
        }}
      >
        <Container
          maxWidth="xl"
          sx={{
            py: { xs: 2, md: 2.5 },
            height: '100%',
            maxHeight: { md: '100vh' },
            display: 'flex',
            flexDirection: 'column',
            overflow: { xs: 'visible', md: 'hidden' },
            boxSizing: 'border-box',
          }}
        >
          {/* Header & Tabs */}
          <AdminHeader
            isAutoSaving={autoSave.isAutoSaving}
            autoSaveActionText={autoSave.autoSaveActionText}
            dirtyFields={autoSave.dirtyFields}
            savedFields={autoSave.savedFields}
            lastSavedTime={autoSave.lastSavedTime}
            loadedTime={autoSave.loadedTime}
            hasPassword={initialData?.adminPassword !== ''}
            handleLogout={auth.handleLogout}
            statusMessage={autoSave.statusMessage}
            setStatusMessage={autoSave.setStatusMessage}
            errorMessage={autoSave.errorMessage}
            setErrorMessage={autoSave.setErrorMessage}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />

          {/* Main Workspace Container */}
          <Paper
            elevation={2}
            sx={{
              borderRadius: 3,
              backgroundColor: 'rgba(20, 20, 28, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              flexGrow: 1,
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
              overflow: 'hidden',
              mt: 2,
            }}
          >
            <Box
              sx={{
                p: 2.5,
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
                overflow: 'hidden',
              }}
            >
              {/* TAB 0: ARTIST PROFILE */}
              {activeTab === 0 && (
                <ArtistProfileTab
                  artistNameInput={profile.artistNameInput}
                  setArtistNameInput={profile.setArtistNameInput}
                  artistNameInputRef={profile.artistNameInputRef}
                  artistBioInput={profile.artistBioInput}
                  setArtistBioInput={profile.setArtistBioInput}
                  artistBioInputRef={profile.artistBioInputRef}
                  artistPlatforms={profile.artistPlatforms}
                  setArtistPlatforms={profile.setArtistPlatforms}
                  artistPlatformsRef={profile.artistPlatformsRef}
                  artistSocials={profile.artistSocials}
                  setArtistSocials={profile.setArtistSocials}
                  artistSocialsRef={profile.artistSocialsRef}
                  dirtyFields={autoSave.dirtyFields}
                  savedFields={autoSave.savedFields}
                  markFieldDirty={autoSave.markFieldDirty}
                  executeSaveArtist={handleSaveArtist}
                />
              )}

              {/* TAB 1: MANAGE PROJECTS */}
              {activeTab === 1 && (
                <Grid
                  container
                  spacing={3}
                  sx={{
                    flexGrow: 1,
                    height: { md: '100%' },
                    minHeight: 0,
                  }}
                >
                  {/* Left Sidebar: Projects List & Add Button */}
                  <Grid
                    size={{ xs: 12, md: 4 }}
                    sx={{
                      height: { md: '100%' },
                      display: 'flex',
                      flexDirection: 'column',
                      minHeight: 0,
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

                  {/* Right Main Column: Create OR Edit Form */}
                  <Grid
                    size={{ xs: 12, md: 8 }}
                    sx={{
                      height: { md: '100%' },
                      minHeight: 0,
                    }}
                  >
                    <Box
                      sx={{
                        height: { md: '100%' },
                        overflowY: { md: 'auto' },
                        pr: { md: 1 },
                        scrollbarWidth: 'thin',
                        scrollbarColor: 'rgba(255, 255, 255, 0.45) transparent',
                        '&::-webkit-scrollbar': { width: 6 },
                        '&::-webkit-scrollbar-track': { background: 'transparent' },
                        '&::-webkit-scrollbar-thumb': {
                          bgcolor: 'rgba(255, 255, 255, 0.45)',
                          borderRadius: 3,
                          '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.75)' },
                        },
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
                          coverFile={projects.coverFile}
                          setCoverFile={projects.setCoverFile}
                          coverFileRef={projects.coverFileRef}
                          coverPreview={projects.coverPreview}
                          tracks={projects.tracks}
                          setTracks={projects.setTracks}
                          artistNameInput={profile.artistNameInput}
                          defaultArtistName={defaultArtistName}
                          isNewNameDuplicate={projects.isNewNameDuplicate}
                          newDupTrackIndexes={projects.newDupTrackIndexes}
                          dirtyFields={autoSave.dirtyFields}
                          savedFields={autoSave.savedFields}
                          getFieldSx={autoSave.getFieldSx}
                          markFieldDirty={autoSave.markFieldDirty}
                          executeCreateProject={handleSaveCreateProject}
                          handleUpdateCreateTrackName={(idx, val) => projects.handleUpdateCreateTrackName(idx, val, handleTriggerCreateSave)}
                          handleUpdateCreateTrackArtist={(idx, val) => projects.handleUpdateCreateTrackArtist(idx, val, handleTriggerCreateSave)}
                          handleUpdateCreateTrackLink={(idx, key, val) => projects.handleUpdateCreateTrackLink(idx, key, val, handleTriggerCreateSave)}
                          handleCreateTrackAudioUpload={(idx, file) => projects.handleCreateTrackAudioUpload(idx, file, handleTriggerCreateSave)}
                          handleCreateTrackAudioRemove={projects.handleCreateTrackAudioRemove}
                          handleMoveCreateTrackUp={projects.handleMoveCreateTrackUp}
                          handleMoveCreateTrackDown={projects.handleMoveCreateTrackDown}
                          handleDeleteCreateTrack={projects.handleDeleteCreateTrack}
                        />
                      ) : projects.selectedProjIndex >= 0 && projects.selectedProjIndex < projects.projectsList.length ? (
                        <ProjectEditForm
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
                          setEditDate={projects.setEditDate}
                          editDateRef={projects.editDateRef}
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
                          editDupTrackIndexes={projects.editDupTrackIndexes}
                          dirtyFields={autoSave.dirtyFields}
                          savedFields={autoSave.savedFields}
                          getFieldSx={autoSave.getFieldSx}
                          markFieldDirty={autoSave.markFieldDirty}
                          executeUpdateProject={handleSaveUpdateProject}
                          setDeleteConfirmOpen={projects.setDeleteConfirmOpen}
                          handleUpdateEditTrackName={(idx, val) => projects.handleUpdateEditTrackName(idx, val, handleTriggerEditSave)}
                          handleUpdateEditTrackArtist={(idx, val) => projects.handleUpdateEditTrackArtist(idx, val, handleTriggerEditSave)}
                          handleUpdateEditTrackLink={(idx, key, val) => projects.handleUpdateEditTrackLink(idx, key, val, handleTriggerEditSave)}
                          handleEditTrackAudioUpload={(idx, file) => projects.handleEditTrackAudioUpload(idx, file, (k) => handleTriggerEditSave(k, null, 100))}
                          handleEditTrackAudioRemove={projects.handleEditTrackAudioRemove}
                          handleMoveEditTrackUp={(idx) => projects.handleMoveEditTrackUp(idx, (k, n) => handleTriggerEditSave(k, n, 100))}
                          handleMoveEditTrackDown={(idx) => projects.handleMoveEditTrackDown(idx, (k, n) => handleTriggerEditSave(k, n, 100))}
                          handleDeleteEditTrack={projects.handleDeleteEditTrack}
                          handleCopyEditTrack={projects.handleCopyEditTrack}
                        />
                      ) : null}
                    </Box>
                  </Grid>
                </Grid>
              )}
            </Box>
          </Paper>

          {/* Delete Project Dialog */}
          <DeleteProjectDialog
            open={projects.deleteConfirmOpen}
            onClose={() => projects.setDeleteConfirmOpen(false)}
            projectName={projects.editName}
            onConfirmDelete={() => projects.handleDeleteProject(auth.password)}
          />

          {/* Delete Track Dialog */}
          <DeleteTrackDialog
            open={Boolean(projects.trackToDelete)}
            onClose={() => projects.setTrackToDelete(null)}
            trackName={projects.trackToDelete?.trackName}
            onConfirmDelete={() => projects.confirmDeleteTrack((k, n) => handleTriggerEditSave(k, n, 100))}
          />

          {/* Copy Track Dialog */}
          <CopyTrackDialog
            open={Boolean(projects.trackToCopy)}
            onClose={() => projects.setTrackToCopy(null)}
            trackToCopy={projects.trackToCopy}
            projectsList={projects.projectsList}
            copyTargetProjectIndex={projects.copyTargetProjectIndex}
            onChangeTargetProjectIndex={projects.setCopyTargetProjectIndex}
            onConfirmCopy={() => projects.handleCopyTrack(auth.password)}
            isCopyingTrack={projects.isCopyingTrack}
          />
        </Container>
      </Box>
    </ThemeProvider>
  )
}
