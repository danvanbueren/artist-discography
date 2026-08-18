'use client'

import {
  Paper,
  Box,
  Typography,
  Chip,
  Button,
  Alert,
  Tabs,
  Tab,
} from '@mui/material'
import AlbumIcon from '@mui/icons-material/Album'
import HomeIcon from '@mui/icons-material/Home'
import LogoutIcon from '@mui/icons-material/Logout'
import PersonIcon from '@mui/icons-material/Person'
import SyncIcon from '@mui/icons-material/Sync'
import PendingIcon from '@mui/icons-material/Pending'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'

export default function AdminHeader({
  isAutoSaving,
  autoSaveActionText,
  dirtyFields,
  savedFields,
  lastSavedTime,
  loadedTime,
  hasPassword,
  handleLogout,
  statusMessage,
  setStatusMessage,
  errorMessage,
  setErrorMessage,
  activeTab,
  setActiveTab,
}) {
  return (
    <>
      {/* Top Header Bar */}
      <Paper
        elevation={3}
        sx={{
          p: 2,
          mb: 2,
          flexShrink: 0,
          borderRadius: 3,
          backgroundColor: 'rgba(25, 25, 35, 0.85)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <AlbumIcon sx={{ color: 'primary.main', fontSize: 36 }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
              Discography Control Center
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              All changes are automatically saved to disk following edits
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          {/* Live Auto-Save Status Badge */}
          {isAutoSaving ? (
            <Chip
              icon={(
                <SyncIcon
                  sx={{
                    animation: 'spin 1s infinite linear',
                    '@keyframes spin': {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(-360deg)' },
                    },
                  }}
                />
              )}
              label={autoSaveActionText}
              color="warning"
              variant="outlined"
              sx={{ fontWeight: 700, py: 0.5 }}
            />
          ) : dirtyFields.size > 0 ? (
            <Chip
              icon={<PendingIcon />}
              label={`Unsaved changes (${dirtyFields.size})...`}
              color="warning"
              sx={{ fontWeight: 700, py: 0.5 }}
            />
          ) : savedFields.size > 0 ? (
            <Chip
              icon={<CheckCircleIcon />}
              label="Saved to disk!"
              color="success"
              sx={{ fontWeight: 700, py: 0.5, animation: 'pulse 1s 1' }}
            />
          ) : lastSavedTime ? (
            <Chip
              icon={<CheckCircleIcon />}
              label={`Saved: ${lastSavedTime}`}
              color="default"
              variant="outlined"
              sx={{ color: 'text.secondary', py: 0.5 }}
            />
          ) : loadedTime ? (
            <Chip
              icon={<CheckCircleIcon />}
              label={`Loaded: ${loadedTime}`}
              color="default"
              variant="outlined"
              sx={{ color: 'text.secondary', py: 0.5 }}
            />
          ) : null}

          <Button
            variant="outlined"
            size="small"
            startIcon={<HomeIcon />}
            href="/"
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            View Site
          </Button>
          {hasPassword && (
            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
              sx={{ borderRadius: 2, textTransform: 'none' }}
            >
              Lock Panel
            </Button>
          )}
        </Box>
      </Paper>

      {/* Global Status Messages */}
      {statusMessage && (
        <Alert
          severity="success"
          onClose={() => setStatusMessage(null)}
          sx={{ mb: 2, flexShrink: 0, borderRadius: 2 }}
        >
          {statusMessage}
        </Alert>
      )}
      {errorMessage && (
        <Alert
          severity="error"
          onClose={() => setErrorMessage('')}
          sx={{ mb: 2, flexShrink: 0, borderRadius: 2 }}
        >
          {errorMessage}
        </Alert>
      )}

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(_, val) => setActiveTab(val)}
        indicatorColor="primary"
        textColor="primary"
        variant="fullWidth"
        sx={{
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          px: 2,
          pt: 1,
          flexShrink: 0,
        }}
      >
        <Tab
          icon={<PersonIcon />}
          iconPosition="start"
          label="Artist Profile"
          sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.95rem' }}
        />
        <Tab
          icon={<AlbumIcon />}
          iconPosition="start"
          label="Manage Projects"
          sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.95rem' }}
        />
      </Tabs>
    </>
  )
}
