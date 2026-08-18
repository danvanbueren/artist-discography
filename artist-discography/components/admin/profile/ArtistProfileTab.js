'use client'

import {
  Box,
  Grid,
  Paper,
  Typography,
  Stack,
  InputAdornment,
  Divider,
  Button,
  Chip,
  CircularProgress,
} from '@mui/material'
import PersonIcon from '@mui/icons-material/Person'
import LinkIcon from '@mui/icons-material/Link'
import ShareIcon from '@mui/icons-material/Share'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ImageIcon from '@mui/icons-material/Image'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
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
  logoInfo,
  logoPreview,
  isUploadingLogo,
  isResettingLogo,
  onUploadLogo,
  onResetLogo,
}) {
  return (
    <Box
      sx={{
        flexGrow: 1,
        overflowY: 'auto',
        pr: 0.5,
      }}
    >
      <Grid container spacing={3}>
        {/* Left Column: Artist Bio, Details & Logo */}
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

              <Divider sx={{ my: 1 }} />

              {/* Artist Logo Upload & Management */}
              <Box>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 1.5,
                    flexWrap: 'wrap',
                    gap: 1,
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.75,
                    }}
                  >
                    <ImageIcon color="primary" sx={{ fontSize: 20 }} /> Artist Logo
                  </Typography>

                  {logoInfo?.isCustom ? (
                    <Chip
                      icon={<CheckCircleIcon />}
                      label={`Custom Logo (data/${logoInfo?.filename || 'logo.png'})`}
                      color="success"
                      size="small"
                      sx={{ fontWeight: 600, height: 24 }}
                    />
                  ) : (
                    <Chip
                      icon={<ImageIcon />}
                      label={`Default Logo (public/${logoInfo?.filename || 'logo.png'})`}
                      color="default"
                      variant="outlined"
                      size="small"
                      sx={{ fontWeight: 600, height: 24 }}
                    />
                  )}
                </Box>

                {/* Logo Preview Container */}
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: 'rgba(10, 10, 16, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1.5,
                    minHeight: 110,
                  }}
                >
                  {logoPreview && (
                    <Box
                      component="img"
                      src={logoPreview}
                      alt="Artist Logo Preview"
                      sx={{
                        height: '9rem',
                        maxWidth: '100%',
                        objectFit: 'contain',
                        filter: 'drop-shadow(0px 4px 12px rgba(0,0,0,0.5))',
                      }}
                    />
                  )}

                  {/* Actions Bar */}
                  <Box
                    sx={{
                      display: 'flex',
                      gap: 1,
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      justifyContent: 'center',
                      width: '100%',
                    }}
                  >
                    <Button
                      variant="outlined"
                      component="label"
                      size="small"
                      disabled={isUploadingLogo || isResettingLogo}
                      startIcon={
                        isUploadingLogo ? (
                          <CircularProgress size={16} color="inherit" />
                        ) : (
                          <CloudUploadIcon />
                        )
                      }
                      sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        fontSize: '0.8rem',
                      }}
                    >
                      {logoInfo?.isCustom ? 'Replace Logo' : 'Upload Logo'}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif,image/avif,image/x-icon"
                        hidden
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            onUploadLogo?.(file)
                            e.target.value = ''
                          }
                        }}
                      />
                    </Button>

                    {logoInfo?.isCustom && (
                      <Button
                        variant="text"
                        color="error"
                        size="small"
                        disabled={isUploadingLogo || isResettingLogo}
                        startIcon={
                          isResettingLogo ? (
                            <CircularProgress size={16} color="inherit" />
                          ) : (
                            <RestartAltIcon />
                          )
                        }
                        onClick={() => onResetLogo?.()}
                        sx={{
                          borderRadius: 2,
                          textTransform: 'none',
                          fontSize: '0.8rem',
                        }}
                      >
                        Remove Logo
                      </Button>
                    )}
                  </Box>
                </Box>

                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    display: 'block',
                    mt: 1,
                    lineHeight: 1.4,
                  }}
                >
                  Custom logos saved to <code>data/logo.*</code> automatically override the default logo in navigation headers, dynamic theme gradient filters, and share metadata.
                </Typography>
              </Box>
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
