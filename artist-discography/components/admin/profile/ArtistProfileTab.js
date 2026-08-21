'use client'

import { useState } from 'react'
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
  LinearProgress,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
} from '@mui/material'
import PersonIcon from '@mui/icons-material/Person'
import LinkIcon from '@mui/icons-material/Link'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ImageIcon from '@mui/icons-material/Image'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import LockRoundedIcon from '@mui/icons-material/LockRounded'
import KeyRoundedIcon from '@mui/icons-material/KeyRounded'
import LanguageRoundedIcon from '@mui/icons-material/LanguageRounded'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded'
import AdminPanelSettingsRoundedIcon from '@mui/icons-material/AdminPanelSettingsRounded'
import AdminTextInput from '../common/AdminTextInput'
import { PLATFORM_KEYS, SOCIAL_KEYS } from '../adminConstants'
import { SOCIAL_ICONS } from '../../artist/ArtistHero'
import { getMediaThumbnailUrl, buildPlatformSearchUrl } from '../adminUtils'

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
  siteUrlInput = 'localhost',
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
  const [showCode, setShowCode] = useState(false)
  const [showAdminPassword, setShowAdminPassword] = useState(false)
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
            {/* Server & Security Settings Card */}
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
                  mb: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <AdminPanelSettingsRoundedIcon color='primary' /> Server &amp; Security
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
                Configure operator credentials, system route locks, clearance codes, and base domain
                routing.
              </Typography>

              <Stack spacing={3.5}>
                {/* 1. Canonical Site URL (Top) */}
                <Box>
                  <AdminTextInput
                    label='Canonical Site URL / Domain'
                    fullWidth
                    placeholder='e.g. https://yourdomain.com or localhost'
                    value={siteUrlInput}
                    onChange={(val) => {
                      if (setSiteUrlInput) setSiteUrlInput(val)
                      if (siteUrlInputRef) siteUrlInputRef.current = val
                      markFieldDirty('siteUrl', executeSaveArtist)
                    }}
                    isDirty={dirtyFields.has('siteUrl')}
                    isSaved={savedFields.has('siteUrl')}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position='start'>
                            <LanguageRoundedIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                  <Typography
                    variant='caption'
                    sx={{
                      color: 'text.secondary',
                      display: 'block',
                      mt: 1,
                      lineHeight: 1.4,
                    }}
                  >
                    Base domain for OpenGraph, Twitter previews, RSS feeds, and dynamic SEO
                    metadata. Defaults to <code>localhost</code>.
                  </Typography>
                </Box>

                {/* Horizontal Divider between Canonical Site URL and Admin Portal Access */}
                <Divider sx={{ my: 0.5, borderColor: 'rgba(255, 255, 255, 0.12)' }} />

                {/* 2. Admin Access Switch */}
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid',
                    borderColor: dirtyFields.has('adminAccess')
                      ? 'warning.main'
                      : savedFields.has('adminAccess')
                        ? 'success.main'
                        : 'rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                    transition: 'border-color 0.2s ease',
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 1,
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Switch
                          checked={Boolean(adminAccessInput)}
                          onChange={(e) => {
                            const checked = e.target.checked
                            if (setAdminAccessInput) setAdminAccessInput(checked)
                            if (adminAccessInputRef) adminAccessInputRef.current = checked
                            markFieldDirty('adminAccess', executeSaveArtist)
                          }}
                          color='primary'
                        />
                      }
                      label={
                        <Typography variant='subtitle2' sx={{ fontWeight: 700 }}>
                          Admin Portal Access
                        </Typography>
                      }
                      sx={{ m: 0 }}
                    />
                    <Chip
                      label={adminAccessInput ? 'OPEN (/_sys/_admin)' : 'LOCKED'}
                      color={adminAccessInput ? 'primary' : 'default'}
                      variant={adminAccessInput ? 'filled' : 'outlined'}
                      size='small'
                      sx={{ fontWeight: 700, height: 24, fontSize: '0.75rem' }}
                    />
                  </Box>
                  <Typography
                    variant='caption'
                    sx={{
                      color: 'text.secondary',
                      lineHeight: 1.4,
                    }}
                  >
                    When disabled (<code>false</code>), direct visits to <code>/_sys/_admin</code>{' '}
                    are blocked and visitors are redirected to the homepage.
                  </Typography>
                </Box>

                {/* 3. Admin Password */}
                <Box>
                  <AdminTextInput
                    label='Admin Password'
                    type={showAdminPassword ? 'text' : 'password'}
                    fullWidth
                    placeholder='Leave blank for passwordless local access'
                    value={adminPasswordInput}
                    onChange={(val) => {
                      if (setAdminPasswordInput) setAdminPasswordInput(val)
                      if (adminPasswordInputRef) adminPasswordInputRef.current = val
                      markFieldDirty('adminPassword', executeSaveArtist)
                    }}
                    isDirty={dirtyFields.has('adminPassword')}
                    isSaved={savedFields.has('adminPassword')}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position='start'>
                            <KeyRoundedIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position='end'>
                            <IconButton
                              size='small'
                              onClick={() => setShowAdminPassword((prev) => !prev)}
                              edge='end'
                              sx={{ color: 'text.secondary' }}
                              aria-label='Toggle admin password visibility'
                            >
                              {showAdminPassword ? (
                                <VisibilityOffRoundedIcon fontSize='small' />
                              ) : (
                                <VisibilityRoundedIcon fontSize='small' />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                  <Typography
                    variant='caption'
                    sx={{
                      color: 'text.secondary',
                      display: 'block',
                      mt: 1,
                      lineHeight: 1.4,
                    }}
                  >
                    Passphrase required to log in to the admin panel. Active session updates
                    automatically upon saving.
                  </Typography>
                </Box>

                {/* Horizontal Divider between Admin Password and Private Access Code */}
                <Divider sx={{ my: 0.5, borderColor: 'rgba(255, 255, 255, 0.12)' }} />

                {/* 4. Private Access Code */}
                <Box>
                  <AdminTextInput
                    label='Private Release Access Code'
                    type={showCode ? 'text' : 'password'}
                    fullWidth
                    placeholder='e.g. access123'
                    value={privateAccessCodeInput}
                    onChange={(val) => {
                      if (setPrivateAccessCodeInput) setPrivateAccessCodeInput(val)
                      if (privateAccessCodeInputRef) privateAccessCodeInputRef.current = val
                      markFieldDirty('privateAccessCode', executeSaveArtist)
                    }}
                    isDirty={dirtyFields.has('privateAccessCode')}
                    isSaved={savedFields.has('privateAccessCode')}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position='start'>
                            <LockRoundedIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position='end'>
                            <IconButton
                              size='small'
                              onClick={() => setShowCode((prev) => !prev)}
                              edge='end'
                              sx={{ color: 'text.secondary' }}
                              aria-label='Toggle private access code visibility'
                            >
                              {showCode ? (
                                <VisibilityOffRoundedIcon fontSize='small' />
                              ) : (
                                <VisibilityRoundedIcon fontSize='small' />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                  <Typography
                    variant='caption'
                    sx={{
                      color: 'text.secondary',
                      display: 'block',
                      mt: 1,
                      lineHeight: 1.4,
                    }}
                  >
                    Visitors entering this code from Navbar &rarr; Settings unlock private tracks
                    and audio streaming for uncleared releases.
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Stack>
        </Grid>

        {/* Right Column: Artist Profile Information, Streaming Platforms & Socials */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Stack spacing={3}>
            {/* Card 1: Artist Profile Information (2 Inner Columns: Logo on Left, Name/Bio on Right) */}
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
                {/* Left Side: Artist Logo */}
                <Grid
                  size={{ xs: 12, sm: 5 }}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    pr: { sm: 3 },
                    borderRight: { sm: '1px solid rgba(255, 255, 255, 0.12)' },
                  }}
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
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
                        variant='subtitle2'
                        sx={{
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.75,
                        }}
                      >
                        <ImageIcon color='primary' sx={{ fontSize: 20 }} /> Artist Logo
                      </Typography>

                      {logoInfo?.isCustom ? (
                        <Chip
                          icon={<CheckCircleIcon />}
                          label='Custom Logo'
                          color='success'
                          size='small'
                          sx={{ fontWeight: 600, height: 24 }}
                        />
                      ) : (
                        <Chip
                          icon={<ImageIcon />}
                          label='Default Logo'
                          color='default'
                          variant='outlined'
                          size='small'
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
                        flexGrow: 1,
                        minHeight: 180,
                      }}
                    >
                      {logoPreview && (
                        <Box
                          component='img'
                          src={getMediaThumbnailUrl(logoPreview, 400)}
                          alt='Artist Logo Preview'
                          sx={{
                            height: '7rem',
                            maxWidth: '100%',
                            objectFit: 'contain',
                            filter: 'drop-shadow(0px 4px 12px rgba(0,0,0,0.5))',
                          }}
                        />
                      )}

                      {/* Inline Sharp Logo Optimization Progress Bar */}
                      {logoJob &&
                        (logoJob.status === 'processing' || logoJob.status === 'queued') && (
                          <Box
                            sx={{
                              width: '100%',
                              p: 1.2,
                              borderRadius: 1.5,
                              backgroundColor: 'rgba(2, 136, 209, 0.12)',
                              border: '1px solid rgba(41, 182, 246, 0.3)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 0.75,
                            }}
                          >
                            <Box
                              sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                              }}
                            >
                              <Typography
                                variant='caption'
                                sx={{ color: '#81d4fa', fontWeight: 700, fontSize: '0.75rem' }}
                              >
                                {logoJob.currentStep || 'Sharp optimizing responsive logo...'}
                              </Typography>
                              <Typography
                                variant='caption'
                                sx={{ color: '#81d4fa', fontWeight: 800, fontSize: '0.75rem' }}
                              >
                                {logoJob.progress || 0}%
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant='determinate'
                              value={logoJob.progress || 0}
                              sx={{
                                height: 6,
                                borderRadius: 3,
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                '& .MuiLinearProgress-bar': {
                                  borderRadius: 3,
                                  background: 'linear-gradient(90deg, #29b6f6 0%, #0288d1 100%)',
                                },
                              }}
                            />
                          </Box>
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
                          mt: 'auto',
                        }}
                      >
                        <Button
                          variant='outlined'
                          component='label'
                          size='small'
                          disabled={isUploadingLogo || isResettingLogo}
                          startIcon={<CloudUploadIcon />}
                          sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            fontSize: '0.8rem',
                          }}
                        >
                          {logoInfo?.isCustom ? 'Replace Logo' : 'Upload Logo'}
                          <input
                            type='file'
                            accept='image/png,image/jpeg,image/webp,image/svg+xml,image/gif,image/avif,image/x-icon'
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
                            variant='text'
                            color='error'
                            size='small'
                            disabled={isUploadingLogo || isResettingLogo}
                            startIcon={<RestartAltIcon />}
                            onClick={() => onResetLogo?.()}
                            sx={{
                              borderRadius: 2,
                              textTransform: 'none',
                              fontSize: '0.8rem',
                            }}
                          >
                            Remove
                          </Button>
                        )}
                      </Box>
                    </Box>

                    <Typography
                      variant='caption'
                      sx={{
                        color: 'text.secondary',
                        display: 'block',
                        mt: 1,
                        lineHeight: 1.4,
                      }}
                    >
                      Custom logos saved to <code>data/logo.*</code> automatically override default
                      branding.
                    </Typography>
                  </Box>
                </Grid>

                {/* Right Side: Name & Bio */}
                <Grid
                  size={{ xs: 12, sm: 7 }}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    pl: { sm: 1 },
                  }}
                >
                  <Stack
                    spacing={2.5}
                    sx={{
                      flexGrow: 1,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <AdminTextInput
                      label='Artist Name'
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
                      label='Artist Bio / Description'
                      multiline
                      fullWidth
                      placeholder='Write a bio describing the artist project...'
                      value={artistBioInput}
                      onChange={(val) => {
                        setArtistBioInput(val)
                        if (artistBioInputRef) artistBioInputRef.current = val
                        markFieldDirty('artistBio', executeSaveArtist)
                      }}
                      isDirty={dirtyFields.has('artistBio')}
                      isSaved={savedFields.has('artistBio')}
                      sx={{
                        flexGrow: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        '& .MuiInputBase-root': {
                          flexGrow: 1,
                          height: '100%',
                          alignItems: 'flex-start',
                        },
                        '& .MuiInputBase-input': {
                          height: '100% !important',
                          overflowY: 'auto !important',
                        },
                      }}
                    />
                  </Stack>
                </Grid>
              </Grid>
            </Paper>

            {/* Platforms */}
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
                <LinkIcon color='primary' /> Streaming Platforms
              </Typography>
              <Typography
                variant='caption'
                sx={{
                  color: 'text.secondary',
                  display: 'block',
                  mb: 2.5,
                  lineHeight: 1.4,
                }}
              >
                Direct links to artist discography profiles across digital music streaming platforms
                and digital stores.
              </Typography>
              <Grid container spacing={2}>
                {PLATFORM_KEYS.map(({ key, label }) => {
                  const iconSrc = SOCIAL_ICONS[key]
                  const fieldKey = `platform_${key}`
                  return (
                    <Grid key={key} size={{ xs: 12, sm: 6 }}>
                      <AdminTextInput
                        label={label}
                        size='small'
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
                              <InputAdornment position='start'>
                                <Box
                                  component='img'
                                  src={iconSrc}
                                  alt=''
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
                            endAdornment: (
                              <InputAdornment position='end'>
                                <Tooltip title={`Search for artist on ${label} (or Google)`} arrow>
                                  <IconButton
                                    size='small'
                                    onClick={() => {
                                      const searchUrl = buildPlatformSearchUrl(
                                        key,
                                        artistNameInput,
                                        '',
                                        '',
                                      )
                                      window.open(searchUrl, '_blank', 'noopener,noreferrer')
                                    }}
                                    sx={{
                                      color: 'text.secondary',
                                      p: 0.5,
                                      '&:hover': { color: 'secondary.main' },
                                    }}
                                    aria-label={`Search ${label}`}
                                  >
                                    <AutoAwesomeIcon sx={{ fontSize: 16 }} />
                                  </IconButton>
                                </Tooltip>
                              </InputAdornment>
                            ),
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
                <LinkIcon color='primary' /> Social Platforms
              </Typography>
              <Typography
                variant='caption'
                sx={{
                  color: 'text.secondary',
                  display: 'block',
                  mb: 2.5,
                  lineHeight: 1.4,
                }}
              >
                Connect official artist social profiles and community channels displayed in the
                header banner.
              </Typography>
              <Grid container spacing={2}>
                {SOCIAL_KEYS.map(({ key, label }) => {
                  const iconSrc = SOCIAL_ICONS[key]
                  const fieldKey = `social_${key}`
                  return (
                    <Grid key={key} size={{ xs: 12, sm: 6 }}>
                      <AdminTextInput
                        label={label}
                        size='small'
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
                              <InputAdornment position='start'>
                                <Box
                                  component='img'
                                  src={iconSrc}
                                  alt=''
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
