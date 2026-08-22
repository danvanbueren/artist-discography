'use client'

import { Box } from '@mui/material'
import ArtistProfileTab from '../profile/ArtistProfileTab'
import AdminProjectsTab from '../tabs/AdminProjectsTab'
import CatalogAuditTab from '../tools/audit/CatalogAuditTab'
import SystemOverviewTab from '../tools/overview/SystemOverviewTab'
import ApiExplorerTab from '../tools/apiExplorer/ApiExplorerTab'
import RawJsonInspectorTab from '../tools/raw/RawJsonInspectorTab'

/**
 * Tab switcher content panel for Admin Dashboard.
 */
export default function AdminDashboardTabs({
  activeTab,
  profile,
  projects,
  autoSave,
  mediaJobs,
  defaultArtistName,
  handleSaveArtist,
  handleUploadLogo,
  handleResetLogo,
  handleSaveCreateProject,
  handleSaveUpdateProject,
  audioPreview,
  seeder,
  totalTracksCount,
  tracksWithAudioCount,
  projectsWithCoverCount,
  totalPlatformLinksCount,
  coverCoveragePct,
  audioCoveragePct,
  currentJsonSnapshot,
}) {
  return (
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
        <AdminProjectsTab
          projects={projects}
          profile={profile}
          defaultArtistName={defaultArtistName}
          autoSave={autoSave}
          mediaJobs={mediaJobs}
          handleSaveCreateProject={handleSaveCreateProject}
          handleSaveUpdateProject={handleSaveUpdateProject}
        />
      )}

      {/* TAB 2: AUDIT / HEALTH CHECK */}
      {activeTab === 2 && (
        <CatalogAuditTab
          projects={projects.projectsList}
          artistPlatforms={profile.artistPlatforms}
          artistSocials={profile.artistSocials}
          artistName={profile.artistNameInput || defaultArtistName}
          artistLogoInfo={profile.logoInfo}
          onSelectProject={(idx) => {
            projects.handleSelectProject(idx)
          }}
          onAddTrackToProject={(projIdx) => {
            projects.handleSelectProject(projIdx)
          }}
        />
      )}

      {/* TAB 3: SYSTEM OVERVIEW & TOOLS */}
      {activeTab === 3 && (
        <SystemOverviewTab
          projectsList={projects.projectsList}
          totalTracksCount={totalTracksCount}
          tracksWithAudioCount={tracksWithAudioCount}
          projectsWithCoverCount={projectsWithCoverCount}
          totalPlatformLinksCount={totalPlatformLinksCount}
          coverCoveragePct={coverCoveragePct}
          audioCoveragePct={audioCoveragePct}
          audioPreview={audioPreview}
          seeder={seeder}
        />
      )}

      {/* TAB 4: API EXPLORER */}
      {activeTab === 4 && <ApiExplorerTab />}

      {/* TAB 5: RAW JSON INSPECTOR */}
      {activeTab === 5 && <RawJsonInspectorTab jsonData={currentJsonSnapshot} />}
    </Box>
  )
}
