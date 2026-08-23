'use client'

import { useState } from 'react'
import {
  Paper,
  Box,
  Typography,
  Chip,
  Button,
  IconButton,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  Tooltip,
} from '@mui/material'
import useMediaQuery from '@mui/material/useMediaQuery'
import SettingsIcon from '@mui/icons-material/Settings'
import AlbumIcon from '@mui/icons-material/Album'
import HomeIcon from '@mui/icons-material/Home'
import LogoutIcon from '@mui/icons-material/Logout'
import TuneIcon from '@mui/icons-material/Tune'
import SyncIcon from '@mui/icons-material/Sync'
import PendingIcon from '@mui/icons-material/Pending'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import FactCheckIcon from '@mui/icons-material/FactCheck'
import CodeIcon from '@mui/icons-material/Code'
import DashboardIcon from '@mui/icons-material/Dashboard'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'

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
  mediaJobs,
}) {
  const isCompact = useMediaQuery((theme) => theme.breakpoints.down('md'))
  const [isErrorCopied, setIsErrorCopied] = useState(false)

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
          <SettingsIcon sx={{ color: 'primary.main', fontSize: 36 }} />
          <Box>
            <Typography variant='h5' sx={{ fontWeight: 800, lineHeight: 1.2 }}>
              Admin Dashboard
            </Typography>
            <Typography variant='caption' sx={{ color: 'text.secondary' }}>
              All changes are automatically saved to disk following edits
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          {/* Media Processing Live Progress Chip & Trigger */}
          {mediaJobs?.isProcessing ? (
            <Chip
              onClick={() => mediaJobs.setIsDrawerOpen?.(true)}
              icon={
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pl: 0.5,
                  }}
                >
                  <SyncIcon
                    sx={{
                      fontSize: '18px !important',
                      animation: 'spin 1s infinite linear',
                      '@keyframes spin': {
                        '0%': { transform: 'rotate(0deg)' },
                        '100%': { transform: 'rotate(-360deg)' },
                      },
                    }}
                  />
                </Box>
              }
              label={`Processing ${mediaJobs.activeJobs.length} file${mediaJobs.activeJobs.length === 1 ? '' : 's'} (${mediaJobs.overallProgress}%)...`}
              color='warning'
              variant='filled'
              sx={{
                fontWeight: 700,
                py: 0.5,
                cursor: 'pointer',
                boxShadow: '0 0 12px rgba(255, 152, 0, 0.4)',
                '&:hover': {
                  backgroundColor: 'warning.dark',
                },
              }}
            />
          ) : isAutoSaving ? (
            <Chip
              icon={
                <SyncIcon
                  sx={{
                    animation: 'spin 1s infinite linear',
                    '@keyframes spin': {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(-360deg)' },
                    },
                  }}
                />
              }
              label={autoSaveActionText}
              color='warning'
              variant='outlined'
              sx={{ fontWeight: 700, py: 0.5 }}
            />
          ) : dirtyFields.size > 0 ? (
            <Chip
              icon={<PendingIcon />}
              label={`Unsaved changes (${dirtyFields.size})...`}
              color='warning'
              sx={{ fontWeight: 700, py: 0.5 }}
            />
          ) : savedFields.size > 0 ? (
            <Chip
              icon={<CheckCircleIcon />}
              label='Saved to disk!'
              color='success'
              sx={{ fontWeight: 700, py: 0.5, animation: 'pulse 1s 1' }}
            />
          ) : lastSavedTime ? (
            <Chip
              icon={<CheckCircleIcon />}
              label={`Saved: ${lastSavedTime}`}
              color='default'
              variant='outlined'
              sx={{ color: 'text.secondary', py: 0.5 }}
            />
          ) : loadedTime ? (
            <Chip
              icon={<CheckCircleIcon />}
              label={`Loaded: ${loadedTime}`}
              color='default'
              variant='outlined'
              sx={{ color: 'text.secondary', py: 0.5 }}
            />
          ) : null}

          {/* Media Center Quick Button */}
          <Button
            variant='outlined'
            size='small'
            onClick={() => mediaJobs?.setIsDrawerOpen?.(true)}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              color: mediaJobs?.isProcessing ? 'warning.main' : 'text.secondary',
              borderColor: mediaJobs?.isProcessing ? 'warning.main' : 'rgba(255, 255, 255, 0.15)',
              fontWeight: 600,
            }}
          >
            Media Queue {mediaJobs?.activeJobs?.length ? `(${mediaJobs.activeJobs.length})` : ''}
          </Button>

          <Button
            variant='outlined'
            size='small'
            startIcon={<HomeIcon />}
            href='/'
            target='_blank'
            rel='noopener noreferrer'
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            View Site
          </Button>
          {hasPassword && (
            <Button
              variant='outlined'
              color='error'
              size='small'
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
              sx={{ borderRadius: 2, textTransform: 'none' }}
            >
              Lock Panel
            </Button>
          )}
        </Box>
      </Paper>

      {/* Global Status Messages (Floating Ephemeral Toasts - Zero Layout Shift) */}
      <Snackbar
        open={Boolean(statusMessage)}
        autoHideDuration={5000}
        onClose={() => setStatusMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ zIndex: 2000 }}
      >
        <Alert
          severity='success'
          variant='filled'
          onClose={() => setStatusMessage(null)}
          sx={{
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            fontWeight: 600,
          }}
        >
          {statusMessage}
        </Alert>
      </Snackbar>

      <Snackbar
        open={Boolean(errorMessage)}
        autoHideDuration={null}
        onClose={() => setErrorMessage('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ zIndex: 2000, maxWidth: '90vw' }}
      >
        <Alert
          severity='error'
          variant='filled'
          action={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Tooltip title={isErrorCopied ? 'Copied!' : 'Copy Error'} arrow>
                <IconButton
                  size='small'
                  color='inherit'
                  onClick={() => {
                    if (errorMessage && typeof navigator !== 'undefined' && navigator.clipboard) {
                      navigator.clipboard.writeText(errorMessage)
                      setIsErrorCopied(true)
                      setTimeout(() => setIsErrorCopied(false), 2000)
                    }
                  }}
                  sx={{ p: 0.5 }}
                >
                  {isErrorCopied ? (
                    <CheckIcon fontSize='small' />
                  ) : (
                    <ContentCopyIcon fontSize='small' />
                  )}
                </IconButton>
              </Tooltip>
              <IconButton
                size='small'
                color='inherit'
                onClick={() => setErrorMessage('')}
                sx={{ p: 0.5 }}
              >
                <CloseIcon fontSize='small' />
              </IconButton>
            </Box>
          }
          sx={{
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            fontWeight: 600,
            alignItems: 'center',
          }}
        >
          {errorMessage}
        </Alert>
      </Snackbar>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(_, val) => setActiveTab(val)}
        indicatorColor='primary'
        textColor='primary'
        variant='fullWidth'
        sx={{
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          width: '100%',
          flexShrink: 0,
          '& .MuiTabs-flexContainer': {
            width: '100%',
            display: 'flex',
          },
          '& .MuiTab-root': {
            flex: 1,
            minWidth: 0,
            maxWidth: 'none',
            textTransform: 'none',
            fontWeight: 700,
            fontSize: { xs: '0.85rem', md: '0.925rem' },
            py: { xs: 1.25, md: 1.75 },
            minHeight: { xs: 48, md: 54 },
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
            },
          },
        }}
      >
        <Tab
          icon={
            <Tooltip title='Settings' arrow placement='top'>
              <TuneIcon sx={{ fontSize: { xs: 24, md: 20 } }} />
            </Tooltip>
          }
          iconPosition='start'
          label={isCompact ? undefined : 'Settings'}
          aria-label='Settings'
        />
        <Tab
          icon={
            <Tooltip title='Projects' arrow placement='top'>
              <AlbumIcon sx={{ fontSize: { xs: 24, md: 20 } }} />
            </Tooltip>
          }
          iconPosition='start'
          label={isCompact ? undefined : 'Projects'}
          aria-label='Projects'
        />
        <Tab
          icon={
            <Tooltip title='Audit' arrow placement='top'>
              <FactCheckIcon sx={{ fontSize: { xs: 24, md: 20 } }} />
            </Tooltip>
          }
          iconPosition='start'
          label={isCompact ? undefined : 'Audit'}
          aria-label='Audit'
        />
        <Tab
          icon={
            <Tooltip title='Utilities' arrow placement='top'>
              <DashboardIcon sx={{ fontSize: { xs: 24, md: 20 } }} />
            </Tooltip>
          }
          iconPosition='start'
          label={isCompact ? undefined : 'Utilities'}
          aria-label='Utilities'
        />
        <Tab
          icon={
            <Tooltip title='API' arrow placement='top'>
              <CodeIcon sx={{ fontSize: { xs: 24, md: 20 } }} />
            </Tooltip>
          }
          iconPosition='start'
          label={isCompact ? undefined : 'API'}
          aria-label='API'
        />
      </Tabs>
    </>
  )
}
