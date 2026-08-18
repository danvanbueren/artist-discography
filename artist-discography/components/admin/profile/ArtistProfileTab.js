'use client'

import {
  Box,
  Grid,
  Paper,
  Typography,
  Stack,
  InputAdornment,
} from '@mui/material'
import PersonIcon from '@mui/icons-material/Person'
import LinkIcon from '@mui/icons-material/Link'
import ShareIcon from '@mui/icons-material/Share'
import AdminTextInput from '../common/AdminTextInput'
import { PLATFORM_KEYS, SOCIAL_KEYS } from '../adminConstants'
import { SOCIAL_ICONS } from '../../artist/ArtistHero'

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
  dirtyFields,
  savedFields,
  markFieldDirty,
  executeSaveArtist,
}) {
  return (
    <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 0.5 }}>
      <Grid container spacing={3}>
        {/* Left Column: Artist Bio & Details */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper
            variant="outlined"
            sx={{
              p: 3,
              borderRadius: 2.5,
              backgroundColor: 'rgba(28, 28, 38, 0.6)',
              borderColor: 'rgba(255, 255, 255, 0.1)',
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <PersonIcon color="primary" /> Artist Profile Information
            </Typography>
            <Stack spacing={2.5}>
              <AdminTextInput
                label="Artist Name"
                required
                fullWidth
                value={artistNameInput}
                onChange={(val) => {
                  setArtistNameInput(val)
                  if (artistNameInputRef) artistNameInputRef.current = val
                  markFieldDirty('artistName', executeSaveArtist)
                }}
                isDirty={dirtyFields.has('artistName')}
                isSaved={savedFields.has('artistName')}
              />
              <AdminTextInput
                label="Artist Bio / Description"
                multiline
                rows={6}
                fullWidth
                placeholder="Write a bio describing the artist project..."
                value={artistBioInput}
                onChange={(val) => {
                  setArtistBioInput(val)
                  if (artistBioInputRef) artistBioInputRef.current = val
                  markFieldDirty('artistBio', executeSaveArtist)
                }}
                isDirty={dirtyFields.has('artistBio')}
                isSaved={savedFields.has('artistBio')}
              />
            </Stack>
          </Paper>
        </Grid>

        {/* Right Column: Platform Links & Social Accounts */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Stack spacing={3}>
            {/* Platforms */}
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                borderRadius: 2.5,
                backgroundColor: 'rgba(28, 28, 38, 0.6)',
                borderColor: 'rgba(255, 255, 255, 0.1)',
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <LinkIcon color="primary" /> Artist Streaming Platform URLs
              </Typography>
              <Grid container spacing={2}>
                {PLATFORM_KEYS.map(({ key, label }) => {
                  const iconSrc = SOCIAL_ICONS[key]
                  const fieldKey = `platform_${key}`
                  return (
                    <Grid key={key} size={{ xs: 12, sm: 6 }}>
                      <AdminTextInput
                        label={label}
                        size="small"
                        fullWidth
                        value={artistPlatforms[key] || ''}
                        onChange={(val) => {
                          setArtistPlatforms((prev) => {
                            const next = { ...prev, [key]: val }
                            if (artistPlatformsRef) artistPlatformsRef.current = next
                            return next
                          })
                          markFieldDirty(fieldKey, executeSaveArtist)
                        }}
                        isDirty={dirtyFields.has(fieldKey)}
                        isSaved={savedFields.has(fieldKey)}
                        slotProps={{
                          input: {
                            startAdornment: iconSrc ? (
                              <InputAdornment position="start">
                                <Box
                                  component="img"
                                  src={iconSrc}
                                  alt=""
                                  sx={{
                                    width: 20,
                                    height: 20,
                                    borderRadius: '4px',
                                    objectFit: 'contain',
                                    flexShrink: 0,
                                  }}
                                />
                              </InputAdornment>
                            ) : null,
                          },
                        }}
                      />
                    </Grid>
                  )
                })}
              </Grid>
            </Paper>

            {/* Socials */}
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                borderRadius: 2.5,
                backgroundColor: 'rgba(28, 28, 38, 0.6)',
                borderColor: 'rgba(255, 255, 255, 0.1)',
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <ShareIcon color="primary" /> Social Media Accounts
              </Typography>
              <Grid container spacing={2}>
                {SOCIAL_KEYS.map(({ key, label }) => {
                  const iconSrc = SOCIAL_ICONS[key]
                  const fieldKey = `social_${key}`
                  return (
                    <Grid key={key} size={{ xs: 12, sm: 6 }}>
                      <AdminTextInput
                        label={label}
                        size="small"
                        fullWidth
                        value={artistSocials[key] || ''}
                        onChange={(val) => {
                          setArtistSocials((prev) => {
                            const next = { ...prev, [key]: val }
                            if (artistSocialsRef) artistSocialsRef.current = next
                            return next
                          })
                          markFieldDirty(fieldKey, executeSaveArtist)
                        }}
                        isDirty={dirtyFields.has(fieldKey)}
                        isSaved={savedFields.has(fieldKey)}
                        slotProps={{
                          input: {
                            startAdornment: iconSrc ? (
                              <InputAdornment position="start">
                                <Box
                                  component="img"
                                  src={iconSrc}
                                  alt=""
                                  sx={{
                                    width: 20,
                                    height: 20,
                                    borderRadius: '4px',
                                    objectFit: 'contain',
                                    flexShrink: 0,
                                  }}
                                />
                              </InputAdornment>
                            ) : null,
                          },
                        }}
                      />
                    </Grid>
                  )
                })}
              </Grid>
            </Paper>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  )
}
