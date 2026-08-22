'use client'

import { useState } from 'react'
import {
  Box,
  Paper,
  Typography,
  Stack,
  InputAdornment,
  Divider,
  Chip,
  IconButton,
  Switch,
  FormControlLabel,
} from '@mui/material'
import LockRoundedIcon from '@mui/icons-material/LockRounded'
import KeyRoundedIcon from '@mui/icons-material/KeyRounded'
import LanguageRoundedIcon from '@mui/icons-material/LanguageRounded'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded'
import AdminPanelSettingsRoundedIcon from '@mui/icons-material/AdminPanelSettingsRounded'
import AdminTextInput from '../common/AdminTextInput'

/**
 * Server and security credentials configuration card (Domain, Admin Lock, Clearance Code).
 */
export default function ServerSecurityCard({
  siteUrlInput = '',
  setSiteUrlInput,
  siteUrlInputRef,
  adminAccessInput = true,
  setAdminAccessInput,
  adminAccessInputRef,
  adminPasswordInput = '',
  setAdminPasswordInput,
  adminPasswordInputRef,
  privateAccessCodeInput = '',
  setPrivateAccessCodeInput,
  privateAccessCodeInputRef,
  dirtyFields,
  savedFields,
  markFieldDirty,
  executeSaveArtist,
}) {
  const [showAdminPassword, setShowAdminPassword] = useState(false)
  const [showCode, setShowCode] = useState(false)

  return (
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
        {/* 1. Canonical Site URL */}
        <Box>
          <AdminTextInput
            label='Canonical Site URL / Domain'
            fullWidth
            placeholder='e.g. https://yourdomain.com'
            value={siteUrlInput}
            onChange={(val) => {
              if (setSiteUrlInput) setSiteUrlInput(val)
              if (siteUrlInputRef) siteUrlInputRef.current = val
              markFieldDirty?.('siteUrl', executeSaveArtist)
            }}
            isDirty={dirtyFields?.has?.('siteUrl')}
            isSaved={savedFields?.has?.('siteUrl')}
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
            sx={{ color: 'text.secondary', display: 'block', mt: 1, lineHeight: 1.4 }}
          >
            Base domain for OpenGraph, Twitter previews, RSS feeds, and dynamic SEO metadata.
            Defaults to <code>localhost</code>.
          </Typography>
        </Box>

        <Divider sx={{ my: 0.5, borderColor: 'rgba(255, 255, 255, 0.12)' }} />

        {/* 2. Admin Access Switch */}
        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid',
            borderColor: dirtyFields?.has?.('adminAccess')
              ? 'warning.main'
              : savedFields?.has?.('adminAccess')
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
                    markFieldDirty?.('adminAccess', executeSaveArtist)
                  }}
                  color='primary'
                />
              }
              label={
                <Typography variant='body2' sx={{ fontWeight: 700 }}>
                  Admin Dashboard Portal
                </Typography>
              }
            />
            <Chip
              label={adminAccessInput ? 'ENABLED' : 'DISABLED'}
              color={adminAccessInput ? 'success' : 'error'}
              size='small'
              sx={{ fontWeight: 800, fontSize: '0.68rem', borderRadius: 1 }}
            />
          </Box>
          <Typography variant='caption' sx={{ color: 'text.secondary', lineHeight: 1.4 }}>
            When disabled, all <code>/_sys/_admin</code> routes return 404 to prevent unauthorized
            public access.
          </Typography>
        </Box>

        {/* 3. Admin Password Input */}
        <Box>
          <AdminTextInput
            label='Admin Portal Password'
            type={showAdminPassword ? 'text' : 'password'}
            fullWidth
            placeholder='Leave empty for no password lock'
            value={adminPasswordInput}
            onChange={(val) => {
              if (setAdminPasswordInput) setAdminPasswordInput(val)
              if (adminPasswordInputRef) adminPasswordInputRef.current = val
              markFieldDirty?.('adminPassword', executeSaveArtist)
            }}
            isDirty={dirtyFields?.has?.('adminPassword')}
            isSaved={savedFields?.has?.('adminPassword')}
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
                      onClick={() => setShowAdminPassword((p) => !p)}
                      sx={{ color: 'text.secondary' }}
                    >
                      {showAdminPassword ? <VisibilityOffRoundedIcon /> : <VisibilityRoundedIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
          <Typography
            variant='caption'
            sx={{ color: 'text.secondary', display: 'block', mt: 1, lineHeight: 1.4 }}
          >
            Protects the admin workspace when hosted on a network. Auto-saved immediately.
          </Typography>
        </Box>

        <Divider sx={{ my: 0.5, borderColor: 'rgba(255, 255, 255, 0.12)' }} />

        {/* 4. Private Gated Access Code Input */}
        <Box>
          <AdminTextInput
            label='Private Access Passcode'
            type={showCode ? 'text' : 'password'}
            fullWidth
            placeholder='e.g. VIP-ACCESS-2026'
            value={privateAccessCodeInput}
            onChange={(val) => {
              if (setPrivateAccessCodeInput) setPrivateAccessCodeInput(val)
              if (privateAccessCodeInputRef) privateAccessCodeInputRef.current = val
              markFieldDirty?.('privateAccessCode', executeSaveArtist)
            }}
            isDirty={dirtyFields?.has?.('privateAccessCode')}
            isSaved={savedFields?.has?.('privateAccessCode')}
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
                      onClick={() => setShowCode((p) => !p)}
                      sx={{ color: 'text.secondary' }}
                    >
                      {showCode ? <VisibilityOffRoundedIcon /> : <VisibilityRoundedIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
          <Typography
            variant='caption'
            sx={{ color: 'text.secondary', display: 'block', mt: 1, lineHeight: 1.4 }}
          >
            Visitors enter this passcode to unlock private catalog releases and uncleared audio
            streams.
          </Typography>
        </Box>
      </Stack>
    </Paper>
  )
}
