'use client'

import { Box, Grid, Paper, Typography, Stack } from '@mui/material'
import PersonIcon from '@mui/icons-material/Person'
import ServerSecurityCard from './ServerSecurityCard'
import ArtistLogoCard from './ArtistLogoCard'
import ArtistBioCard from './ArtistBioCard'
import ArtistSocialsCard from './ArtistSocialsCard'

/**
 * ArtistProfileTab
 * Settings tab view for server/security credentials, branding logo, bio,
 * and streaming platform/social media links.
 */
export default function ArtistProfileTab({
  artistNameInput,
  setArtistNameInput,
  artistNameInputRef,
  artistBioInput,
  setArtistBioInput,
  artistBioInputRef,
  artistPlatforms,
  setArtistPlatforms,
  artistPlatformsRef,
  artistSocials,
  setArtistSocials,
  artistSocialsRef,
  adminAccessInput = true,
  setAdminAccessInput,
  adminAccessInputRef,
  adminPasswordInput = '',
  setAdminPasswordInput,
  adminPasswordInputRef,
  privateAccessCodeInput = '',
  setPrivateAccessCodeInput,
  privateAccessCodeInputRef,
  siteUrlInput = '',
  setSiteUrlInput,
  siteUrlInputRef,
  dirtyFields,
  savedFields,
  markFieldDirty,
  executeSaveArtist,
  logoInfo,
  logoPreview,
  isUploadingLogo,
  isResettingLogo,
  onUploadLogo,
  onResetLogo,
  mediaJobs,
}) {
  const logoJob = mediaJobs?.getJobForFile?.('logo') || null

  return (
    <Box
      sx={{
        flexGrow: 1,
        overflowY: 'auto',
        pr: 0.5,
      }}
    >
      <Grid container spacing={3}>
        {/* Left Column: Server & Security Settings */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Stack spacing={3}>
            <ServerSecurityCard
              siteUrlInput={siteUrlInput}
              setSiteUrlInput={setSiteUrlInput}
              siteUrlInputRef={siteUrlInputRef}
              adminAccessInput={adminAccessInput}
              setAdminAccessInput={setAdminAccessInput}
              adminAccessInputRef={adminAccessInputRef}
              adminPasswordInput={adminPasswordInput}
              setAdminPasswordInput={setAdminPasswordInput}
              adminPasswordInputRef={adminPasswordInputRef}
              privateAccessCodeInput={privateAccessCodeInput}
              setPrivateAccessCodeInput={setPrivateAccessCodeInput}
              privateAccessCodeInputRef={privateAccessCodeInputRef}
              dirtyFields={dirtyFields}
              savedFields={savedFields}
              markFieldDirty={markFieldDirty}
              executeSaveArtist={executeSaveArtist}
            />
          </Stack>
        </Grid>

        {/* Right Column: Artist Identity & Social Links */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Stack spacing={3}>
            {/* Artist Profile Card: Logo on Left, Bio on Right */}
            <Paper
              variant='outlined'
              sx={{
                p: { xs: 3, md: 3.5 },
                borderRadius: 2.5,
                backgroundColor: 'rgba(28, 28, 38, 0.6)',
                borderColor: 'rgba(255, 255, 255, 0.1)',
              }}
            >
              <Typography
                variant='h6'
                sx={{
                  fontWeight: 700,
                  mb: 0.75,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <PersonIcon color='primary' /> Artist Profile
              </Typography>
              <Typography
                variant='caption'
                sx={{
                  color: 'text.secondary',
                  display: 'block',
                  mb: 3,
                  lineHeight: 1.4,
                }}
              >
                Manage primary artist identity, biography narrative, and official branding mark.
              </Typography>

              <Grid container spacing={3} sx={{ alignItems: 'stretch' }}>
                <Grid
                  size={{ xs: 12, sm: 5 }}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    pr: { sm: 3 },
                    borderRight: { sm: '1px solid rgba(255, 255, 255, 0.12)' },
                  }}
                >
                  <ArtistLogoCard
                    logoInfo={logoInfo}
                    logoPreview={logoPreview}
                    isUploadingLogo={isUploadingLogo}
                    isResettingLogo={isResettingLogo}
                    onUploadLogo={onUploadLogo}
                    onResetLogo={onResetLogo}
                    logoJob={logoJob}
                  />
                </Grid>

                <Grid
                  size={{ xs: 12, sm: 7 }}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    pl: { sm: 1 },
                  }}
                >
                  <ArtistBioCard
                    artistNameInput={artistNameInput}
                    setArtistNameInput={setArtistNameInput}
                    artistNameInputRef={artistNameInputRef}
                    artistBioInput={artistBioInput}
                    setArtistBioInput={setArtistBioInput}
                    artistBioInputRef={artistBioInputRef}
                    dirtyFields={dirtyFields}
                    savedFields={savedFields}
                    markFieldDirty={markFieldDirty}
                    executeSaveArtist={executeSaveArtist}
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Streaming & Social Links */}
            <ArtistSocialsCard
              artistPlatforms={artistPlatforms}
              setArtistPlatforms={setArtistPlatforms}
              artistPlatformsRef={artistPlatformsRef}
              artistSocials={artistSocials}
              setArtistSocials={setArtistSocials}
              artistSocialsRef={artistSocialsRef}
              artistName={artistNameInput}
              dirtyFields={dirtyFields}
              savedFields={savedFields}
              markFieldDirty={markFieldDirty}
              executeSaveArtist={executeSaveArtist}
            />
          </Stack>
        </Grid>
      </Grid>
    </Box>
  )
}
