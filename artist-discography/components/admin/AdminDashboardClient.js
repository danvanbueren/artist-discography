'use client'

import { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import {
  Box,
  Container,
  Paper,
  Grid,
  Stack,
  Alert,
  Divider,
  CircularProgress,
  Typography,
} from '@mui/material'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'

import { adminTheme } from './adminTheme'
import { useAdminAuth } from './hooks/useAdminAuth'
import { useAutoSave } from './hooks/useAutoSave'
import { useArtistProfile } from './hooks/useArtistProfile'
import { useProjectsManager } from './hooks/useProjectsManager'
import { useMediaJobs } from './hooks/useMediaJobs'
import { useDevAudioPreview } from '../dev/hooks/useDevAudioPreview'
import { useDevDummySeeder } from '../dev/hooks/useDevDummySeeder'

import AdminAccessDisabled from './auth/AdminAccessDisabled'
import AdminLoginView from './auth/AdminLoginView'
import AdminHeader from './layout/AdminHeader'
import ArtistProfileTab from './profile/ArtistProfileTab'
import ProjectSidebarList from './projects/ProjectSidebarList'
import ProjectCreateForm from './projects/ProjectCreateForm'
import ProjectEditForm from './projects/ProjectEditForm'
import DevDiscographyAuditView from '../dev/DevDiscographyAuditView'
import DevApiExplorer from '../dev/DevApiExplorer'
import DevOverviewTab from '../dev/overview/DevOverviewTab'
import RawJsonInspectorTab from '../dev/raw/RawJsonInspectorTab'
import DeleteProjectDialog from './dialogs/DeleteProjectDialog'
import DeleteTrackDialog from './dialogs/DeleteTrackDialog'
import CopyTrackDialog from './dialogs/CopyTrackDialog'
import MediaProcessingDrawer from './media/MediaProcessingDrawer'

export default function AdminDashboardClient({
  adminAccess = true,
  defaultArtistName = 'Artist',
  initialData = {},
}) {
  // Tabs: 0 = Settings, 1 = Projects, 2 = Audit, 3 = Utilities, 4 = API
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

  // 4. Real-time media processing jobs hook
  const mediaJobs = useMediaJobs()

  // 5. Artist profile state hook
  const profile = useArtistProfile(
    initialData,
    defaultArtistName,
    autoSave.setErrorMessage,
    autoSave.setStatusMessage,
    auth.updateSessionPassword,
  )

  // 6. Projects & releases manager hook
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

  // 7. Dev Audio Preview Hook
  const audioPreview = useDevAudioPreview()

  // 8. Dev Dummy Seeder Hook
  const seeder = useDevDummySeeder((newData) => {
    if (newData?.projects) {
      projects.setProjectsList(newData.projects)
    }
    if (newData?.artist) {
      profile.setArtistData(newData.artist)
      profile.setArtistNameInput(newData.artist.name || defaultArtistName)
      profile.setArtistBioInput(newData.artist.bio || '')
      profile.setArtistPlatforms(newData.artist.links?.platforms || {})
      profile.setArtistSocials(newData.artist.links?.socials || {})
    }
  }, auth.password)

  // 9. Computed Metrics & Stats for Health Overview
  const totalTracksCount = useMemo(() => {
    return (projects.projectsList || []).reduce((acc, p) => acc + (p?.tracks?.length || 0), 0)
  }, [projects.projectsList])

  const tracksWithAudioCount = useMemo(() => {
    return (projects.projectsList || []).reduce((acc, p) => {
      return acc + (p?.tracks?.filter((t) => Boolean(t.hasAudio || t.audioUrl))?.length || 0)
    }, 0)
  }, [projects.projectsList])

  const projectsWithCoverCount = useMemo(() => {
    return (projects.projectsList || []).filter((p) => Boolean(p.hasCover || p.cover)).length
  }, [projects.projectsList])

  const totalPlatformLinksCount = useMemo(() => {
    const platforms = profile.artistPlatforms || {}
    const socials = profile.artistSocials || {}
    const countP = Object.values(platforms).filter(
      (v) => typeof v === 'string' && v.trim() !== '',
    ).length
    const countS = Object.values(socials).filter(
      (v) => typeof v === 'string' && v.trim() !== '',
    ).length
    return countP + countS
  }, [profile.artistPlatforms, profile.artistSocials])

  const coverCoveragePct =
    projects.projectsList.length > 0
      ? Math.round((projectsWithCoverCount / projects.projectsList.length) * 100)
      : 0

  const audioCoveragePct =
    totalTracksCount > 0 ? Math.round((tracksWithAudioCount / totalTracksCount) * 100) : 0

  const currentJsonSnapshot = useMemo(
    () => ({
      adminAccess: profile.adminAccessInput,
      adminPassword: profile.adminPasswordInput,
      privateAccessCode: profile.privateAccessCodeInput,
      siteUrl: profile.siteUrlInput,
      artist: {
        name: profile.artistNameInput,
        bio: profile.artistBioInput,
        links: {
          platforms: profile.artistPlatforms,
          socials: profile.artistSocials,
        },
      },
      projects: projects.projectsList,
    }),
    [
      profile.adminAccessInput,
      profile.adminPasswordInput,
      profile.privateAccessCodeInput,
      profile.siteUrlInput,
      profile.artistNameInput,
      profile.artistBioInput,
      profile.artistPlatforms,
      profile.artistSocials,
      projects.projectsList,
    ],
  )

  // Keep bridge ref in sync with projects.editName
  useEffect(() => {
    editNameBridgeRef.current = projects.editName
  }, [projects.editName])

  // Auto-save save callbacks binding authentication password
  const handleSaveArtist = useCallback(() => {
    return profile.executeSaveArtist(auth.password)
  }, [profile, auth.password])

  const handleUploadLogo = useCallback(
    (file) => {
      return profile.uploadLogoFile(file, auth.password)
    },
    [profile, auth.password],
  )

  const handleResetLogo = useCallback(() => {
    return profile.resetLogo(auth.password)
  }, [profile, auth.password])

  const handleSaveCreateProject = useCallback(() => {
    return projects.executeCreateProject(auth.password)
  }, [projects, auth.password])

  const handleSaveUpdateProject = useCallback(
    (overrideTracks = null) => {
      return projects.executeUpdateProject(auth.password, overrideTracks)
    },
    [projects, auth.password],
  )

  // Track modification trigger helpers for create and edit forms
  const handleTriggerCreateSave = useCallback(
    (fieldKey) => {
      autoSave.markFieldDirty(fieldKey, handleSaveCreateProject)
    },
    [autoSave.markFieldDirty, handleSaveCreateProject],
  )

  const handleTriggerEditSave = useCallback(
    (fieldKey, overrideTracks = null, delayMs = 1000) => {
      autoSave.markFieldDirty(fieldKey, () => handleSaveUpdateProject(overrideTracks), delayMs)
    },
    [autoSave.markFieldDirty, handleSaveUpdateProject],
  )

  // Stable track handlers for ProjectCreateForm
  const handleUpdateCreateTrackName = useCallback(
    (idx, val) => {
      projects.handleUpdateCreateTrackName(idx, val, handleTriggerCreateSave)
    },
    [projects.handleUpdateCreateTrackName, handleTriggerCreateSave],
  )

  const handleUpdateCreateTrackArtist = useCallback(
    (idx, val) => {
      projects.handleUpdateCreateTrackArtist(idx, val, handleTriggerCreateSave)
    },
    [projects.handleUpdateCreateTrackArtist, handleTriggerCreateSave],
  )

  const handleUpdateCreateTrackLink = useCallback(
    (idx, key, val) => {
      projects.handleUpdateCreateTrackLink(idx, key, val, handleTriggerCreateSave)
    },
    [projects.handleUpdateCreateTrackLink, handleTriggerCreateSave],
  )

  const handleCreateTrackAudioUpload = useCallback(
    (idx, file) => {
      projects.handleCreateTrackAudioUpload(idx, file, handleTriggerCreateSave)
    },
    [projects.handleCreateTrackAudioUpload, handleTriggerCreateSave],
  )

  // Stable track handlers for ProjectEditForm
  const handleUpdateEditTrackName = useCallback(
    (idx, val) => {
      projects.handleUpdateEditTrackName(idx, val, handleTriggerEditSave)
    },
    [projects.handleUpdateEditTrackName, handleTriggerEditSave],
  )

  const handleUpdateEditTrackArtist = useCallback(
    (idx, val) => {
      projects.handleUpdateEditTrackArtist(idx, val, handleTriggerEditSave)
    },
    [projects.handleUpdateEditTrackArtist, handleTriggerEditSave],
  )

  const handleUpdateEditTrackLink = useCallback(
    (idx, key, val) => {
      projects.handleUpdateEditTrackLink(idx, key, val, handleTriggerEditSave)
    },
    [projects.handleUpdateEditTrackLink, handleTriggerEditSave],
  )

  const handleEditTrackAudioUpload = useCallback(
    (idx, file) => {
      projects.handleEditTrackAudioUpload(idx, file, (k) => handleTriggerEditSave(k, null, 100))
    },
    [projects.handleEditTrackAudioUpload, handleTriggerEditSave],
  )

  const handleMoveEditTrackUp = useCallback(
    (idx) => {
      projects.handleMoveEditTrackUp(idx, (k, n) => handleTriggerEditSave(k, n, 100))
    },
    [projects.handleMoveEditTrackUp, handleTriggerEditSave],
  )

  const handleMoveEditTrackDown = useCallback(
    (idx) => {
      projects.handleMoveEditTrackDown(idx, (k, n) => handleTriggerEditSave(k, n, 100))
    },
    [projects.handleMoveEditTrackDown, handleTriggerEditSave],
  )

  // Teardown preview audio immediately whenever navigating away from the Audit tab
  useEffect(() => {
    if (activeTab !== 2 && audioPreview.playingAudioUrl) {
      audioPreview.stopAudio()
    }
  }, [activeTab, audioPreview])

  // ----------------------------------------------------
  // Early Returns: Access Disabled / Checking Auth / Unauthenticated
  // ----------------------------------------------------
  if (!adminAccess) {
    return (
      <ThemeProvider theme={adminTheme}>
        <CssBaseline />
        <AdminAccessDisabled />
      </ThemeProvider>
    )
  }

  if (auth.isCheckingAuth && initialData?.adminPassword !== '') {
    return (
      <ThemeProvider theme={adminTheme}>
        <CssBaseline />
        <Box
          sx={{
            minHeight: '100vh',
            width: '100%',
            bgcolor: 'background.default',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
          }}
        >
          <CircularProgress size={36} color='primary' />
          <Typography variant='body2' sx={{ color: 'text.secondary', fontWeight: 600 }}>
            Verifying session…
          </Typography>
        </Box>
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
          maxWidth='xl'
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
            mediaJobs={mediaJobs}
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
                p: activeTab === 1 ? 2.5 : { xs: 2, sm: 3 },
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
                overflowY: activeTab === 1 ? 'hidden' : 'auto',
              }}
            >
              {/* TAB 0: PROFILE & SETTINGS */}
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
                  adminAccessInput={profile.adminAccessInput}
                  setAdminAccessInput={profile.setAdminAccessInput}
                  adminAccessInputRef={profile.adminAccessInputRef}
                  adminPasswordInput={profile.adminPasswordInput}
                  setAdminPasswordInput={profile.setAdminPasswordInput}
                  adminPasswordInputRef={profile.adminPasswordInputRef}
                  privateAccessCodeInput={profile.privateAccessCodeInput}
                  setPrivateAccessCodeInput={profile.setPrivateAccessCodeInput}
                  privateAccessCodeInputRef={profile.privateAccessCodeInputRef}
                  siteUrlInput={profile.siteUrlInput}
                  setSiteUrlInput={profile.setSiteUrlInput}
                  siteUrlInputRef={profile.siteUrlInputRef}
                  dirtyFields={autoSave.dirtyFields}
                  savedFields={autoSave.savedFields}
                  markFieldDirty={autoSave.markFieldDirty}
                  executeSaveArtist={handleSaveArtist}
                  logoInfo={profile.logoInfo}
                  logoPreview={profile.logoPreview}
                  isUploadingLogo={profile.isUploadingLogo}
                  isResettingLogo={profile.isResettingLogo}
                  onUploadLogo={handleUploadLogo}
                  onResetLogo={handleResetLogo}
                  mediaJobs={mediaJobs}
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
                          mediaJobs={mediaJobs}
                          handleUpdateCreateTrackName={handleUpdateCreateTrackName}
                          handleUpdateCreateTrackArtist={handleUpdateCreateTrackArtist}
                          handleUpdateCreateTrackLink={handleUpdateCreateTrackLink}
                          handleCreateTrackAudioUpload={handleCreateTrackAudioUpload}
                          handleCreateTrackAudioRemove={projects.handleCreateTrackAudioRemove}
                          handleMoveCreateTrackUp={projects.handleMoveCreateTrackUp}
                          handleMoveCreateTrackDown={projects.handleMoveCreateTrackDown}
                          handleDeleteCreateTrack={projects.handleDeleteCreateTrack}
                        />
                      ) : projects.selectedProjIndex >= 0 &&
                        projects.selectedProjIndex < projects.projectsList.length ? (
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
                          setEditDate={projects.setEditDate}
                          editDateRef={projects.editDateRef}
                          editVisibility={projects.editVisibility}
                          setEditVisibility={projects.setEditVisibility}
                          editVisibilityRef={projects.editVisibilityRef}
                          editCopyright={projects.editCopyright}
                          setEditCopyright={projects.setEditCopyright}
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
                          handleUpdateEditTrackName={handleUpdateEditTrackName}
                          handleUpdateEditTrackArtist={handleUpdateEditTrackArtist}
                          handleUpdateEditTrackLink={handleUpdateEditTrackLink}
                          handleEditTrackAudioUpload={handleEditTrackAudioUpload}
                          handleEditTrackAudioRemove={projects.handleEditTrackAudioRemove}
                          handleMoveEditTrackUp={handleMoveEditTrackUp}
                          handleMoveEditTrackDown={handleMoveEditTrackDown}
                          handleDeleteEditTrack={projects.handleDeleteEditTrack}
                          handleCopyEditTrack={projects.handleCopyEditTrack}
                        />
                      ) : null}
                    </Box>
                  </Grid>
                </Grid>
              )}

              {/* TAB 2: AUDIT */}
              <Box sx={{ display: activeTab === 2 ? 'block' : 'none' }}>
                <DevDiscographyAuditView
                  projects={projects.projectsList}
                  artistName={profile.artistNameInput}
                  health={initialData?.health || {}}
                  mounted={true}
                  playingAudioUrl={audioPreview.playingAudioUrl}
                  handleToggleAudio={audioPreview.handleToggleAudio}
                  handleSeekRelative={audioPreview.handleSeekRelative}
                />
              </Box>

              {/* TAB 3: UTILITIES */}
              {activeTab === 3 && (
                <Stack spacing={3}>
                  {seeder.seedMessage && (
                    <Alert
                      severity='success'
                      onClose={() => seeder.setSeedMessage('')}
                      sx={{ borderRadius: 2 }}
                    >
                      {seeder.seedMessage}
                    </Alert>
                  )}
                  {seeder.seedError && (
                    <Alert
                      severity='error'
                      onClose={() => seeder.setSeedError('')}
                      sx={{ borderRadius: 2 }}
                    >
                      {seeder.seedError}
                    </Alert>
                  )}
                  <DevOverviewTab
                    isArtistNameEmpty={!profile.artistNameInput || !profile.artistNameInput.trim()}
                    health={initialData?.health || {}}
                    projects={projects.projectsList}
                    totalTracksCount={totalTracksCount}
                    coverCoveragePct={coverCoveragePct}
                    audioCoveragePct={audioCoveragePct}
                    totalPlatformLinksCount={totalPlatformLinksCount}
                    adminAccess={profile.adminAccessInput}
                    isGeneratingDummy={seeder.isGeneratingDummy}
                    handleGenerateDummyData={seeder.handleGenerateDummyData}
                  />
                  <Divider sx={{ my: 1, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                  <RawJsonInspectorTab dataState={currentJsonSnapshot} />
                </Stack>
              )}

              {/* TAB 4: API */}
              {activeTab === 4 && <DevApiExplorer adminPassword={auth.password} />}
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
            onConfirmDelete={() =>
              projects.confirmDeleteTrack((k, n) => handleTriggerEditSave(k, n, 100))
            }
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

          {/* Media Processing Center Drawer */}
          <MediaProcessingDrawer
            open={mediaJobs.isDrawerOpen}
            onClose={() => mediaJobs.setIsDrawerOpen(false)}
            activeJobs={mediaJobs.activeJobs}
            completedJobs={mediaJobs.completedJobs}
            overallProgress={mediaJobs.overallProgress}
            isProcessing={mediaJobs.isProcessing}
            onTriggerWarmAll={mediaJobs.triggerWarmAll}
            onClearCompleted={mediaJobs.clearCompleted}
            isTriggeringWarm={mediaJobs.isTriggeringWarm}
            adminPassword={auth.password}
          />
        </Container>
      </Box>
    </ThemeProvider>
  )
}
