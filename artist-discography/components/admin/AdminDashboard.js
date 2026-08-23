'use client'

import { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import { Box, Container, Paper, CircularProgress, Typography } from '@mui/material'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'

import { adminTheme } from './adminTheme'
import { useAdminAuth } from './hooks/useAdminAuth'
import { useAutoSave } from './hooks/useAutoSave'
import { useArtistProfile } from './hooks/useArtistProfile'
import { useProjectsManager } from './hooks/useProjectsManager'
import { useMediaJobs } from './hooks/useMediaJobs'
import { useDevAudioPreview } from './tools/hooks/useDevAudioPreview'
import { useAdminRouting } from './hooks/useAdminRouting'

import AdminAccessDisabled from './auth/AdminAccessDisabled'
import AdminLoginView from './auth/AdminLoginView'
import AdminHeader from './layout/AdminHeader'
import AdminDashboardTabs from './layout/AdminDashboardTabs'
import DeleteProjectDialog from './dialogs/DeleteProjectDialog'
import DeleteTrackDialog from './dialogs/DeleteTrackDialog'
import CopyTrackDialog from './dialogs/CopyTrackDialog'
import MediaProcessingDrawer from './media/MediaProcessingDrawer'

/**
 * AdminDashboard
 * Master administrator interface for metadata, releases catalog, audio/art transcoding,
 * catalog health audits, and API documentation.
 */
export default function AdminDashboard({
  adminAccess = true,
  defaultArtistName = 'Artist',
  initialData = {},
  initialSlug = [],
}) {
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

  // 6. Admin URL routing & history management hook
  const hasArtistName = Boolean(initialData?.artist?.name && initialData?.artist?.name.trim())
  const routing = useAdminRouting({
    initialSlug,
    projectsList: initialData?.projects ?? [],
    hasArtistName,
  })

  // 7. Projects & releases manager hook
  const projects = useProjectsManager({
    initialData,
    defaultArtistName,
    artistData: profile.artistData,
    artistNameInputRef: profile.artistNameInputRef,
    initialSelectedProjIndex: routing.selectedProjIndex,
    initialIsCreatingNew: routing.isCreatingNew,
    onNavigateToProject: routing.navigateToProject,
    onNavigateToNewProject: routing.navigateToNewProject,
    onProjectRenamed: routing.replaceProjectSlug,
    onProjectDeleted: routing.replaceDeletedProject,
    markFieldDirty: autoSave.markFieldDirty,
    flushPendingAutoSave: autoSave.flushPendingAutoSave,
    clearPendingAutoSave: autoSave.clearPendingAutoSave,
    setErrorMessage: autoSave.setErrorMessage,
    setStatusMessage: autoSave.setStatusMessage,
  })

  // 8. Dev Audio Preview Hook
  const audioPreview = useDevAudioPreview()

  // 8. Computed Metrics & Stats for Health Overview
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

  // Sync document title across all tabs on the admin dashboard
  useEffect(() => {
    const artistName =
      (profile?.artistNameInput || defaultArtistName || 'Artist').trim() || 'Artist'
    document.title = `${artistName} | Admin Dashboard`
  }, [profile?.artistNameInput, defaultArtistName])

  // Save callbacks
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

  // ----------------------------------------------------
  // Guard Views: Disabled Access, Loading, Login Screen
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
            activeTab={routing.activeTab}
            setActiveTab={routing.setActiveTab}
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
            <AdminDashboardTabs
              activeTab={routing.activeTab}
              profile={profile}
              projects={projects}
              autoSave={autoSave}
              mediaJobs={mediaJobs}
              defaultArtistName={defaultArtistName}
              handleSaveArtist={handleSaveArtist}
              handleUploadLogo={handleUploadLogo}
              handleResetLogo={handleResetLogo}
              handleSaveCreateProject={handleSaveCreateProject}
              handleSaveUpdateProject={handleSaveUpdateProject}
              audioPreview={audioPreview}
              totalTracksCount={totalTracksCount}
              tracksWithAudioCount={tracksWithAudioCount}
              projectsWithCoverCount={projectsWithCoverCount}
              totalPlatformLinksCount={totalPlatformLinksCount}
              coverCoveragePct={coverCoveragePct}
              audioCoveragePct={audioCoveragePct}
              currentJsonSnapshot={currentJsonSnapshot}
              health={initialData?.health}
              adminPassword={auth.password}
            />
          </Paper>
        </Container>

        {/* Dialogs */}
        <DeleteProjectDialog
          open={projects.deleteConfirmOpen}
          projectName={projects.projectsList[projects.selectedProjIndex]?.name || 'this project'}
          onClose={() => projects.setDeleteConfirmOpen(false)}
          onConfirm={() => projects.handleDeleteProject(auth.password)}
        />

        <DeleteTrackDialog
          open={Boolean(projects.trackToDelete)}
          trackName={projects.trackToDelete?.trackName || 'this track'}
          onClose={() => projects.setTrackToDelete(null)}
          onConfirm={() =>
            projects.confirmDeleteTrack((key, newTracksList) => {
              if (projects.trackToDelete?.isEditing) {
                autoSave.markFieldDirty(key, (pwd) =>
                  projects.executeUpdateProject(pwd, newTracksList),
                )
              } else {
                autoSave.markFieldDirty(key, projects.executeCreateProject)
              }
            })
          }
        />

        <CopyTrackDialog
          open={Boolean(projects.trackToCopy)}
          trackToCopy={projects.trackToCopy}
          trackName={projects.trackToCopy?.track?.name || 'this track'}
          sourceProjectName={
            projects.projectsList[projects.trackToCopy?.sourceProjectIndex]?.name ||
            'Source Project'
          }
          projectsList={projects.projectsList}
          copyTargetProjectIndex={projects.copyTargetProjectIndex}
          selectedTargetIndex={projects.copyTargetProjectIndex}
          onChangeTargetProjectIndex={projects.setCopyTargetProjectIndex}
          onChangeTargetIndex={projects.setCopyTargetProjectIndex}
          isCopyingTrack={projects.isCopyingTrack}
          isCopying={projects.isCopyingTrack}
          onClose={() => projects.setTrackToCopy(null)}
          onConfirmCopy={() => projects.handleCopyTrack(auth.password)}
          onConfirm={() => projects.handleCopyTrack(auth.password)}
        />

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
      </Box>
    </ThemeProvider>
  )
}
