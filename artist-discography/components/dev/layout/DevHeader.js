'use client'

import {
  Paper,
  Box,
  Typography,
  Button,
  Alert,
  Tabs,
  Tab,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import DashboardIcon from '@mui/icons-material/Dashboard'
import CodeIcon from '@mui/icons-material/Code'
import AlbumIcon from '@mui/icons-material/Album'
import EqualizerIcon from '@mui/icons-material/Equalizer'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'

export default function DevHeader({
  seedMessage,
  setSeedMessage,
  seedError,
  setSeedError,
  activeTab,
  handleTabChange,
}) {
  return (
    <>
      {/* Top Header Bar with Navigation & Title */}
      <Paper
        elevation={4}
        sx={{
          p: 2.5,
          mb: 4,
          borderRadius: 3,
          backgroundColor: 'rgba(22, 22, 30, 0.9)',
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
          <Button
            variant="contained"
            color="primary"
            startIcon={<ArrowBackIcon />}
            href="/"
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
          >
            Home
          </Button>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
              Developer &amp; System Control Center
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              System metrics, OpenAPI interactive explorer, asset coverage, and data health console
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Seed Status & Warnings Alerts */}
      {seedMessage && (
        <Alert
          severity="success"
          onClose={() => setSeedMessage('')}
          sx={{ mb: 3, borderRadius: 2.5 }}
        >
          {seedMessage}
        </Alert>
      )}
      {seedError && (
        <Alert
          severity="error"
          onClose={() => setSeedError('')}
          sx={{ mb: 3, borderRadius: 2.5 }}
        >
          {seedError}
        </Alert>
      )}

      {/* Tab Navigation */}
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        indicatorColor="primary"
        textColor="primary"
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          px: 2,
          pt: 1,
        }}
      >
        <Tab
          icon={<DashboardIcon />}
          iconPosition="start"
          label="Overview & Health"
          sx={{ textTransform: 'none', fontWeight: 700 }}
        />
        <Tab
          icon={<CodeIcon />}
          iconPosition="start"
          label="API Explorer"
          sx={{ textTransform: 'none', fontWeight: 700 }}
        />
        <Tab
          icon={<AlbumIcon />}
          iconPosition="start"
          label="Discography & Media Audit"
          sx={{ textTransform: 'none', fontWeight: 700 }}
        />
        <Tab
          icon={<EqualizerIcon />}
          iconPosition="start"
          label="Platforms & Socials"
          sx={{ textTransform: 'none', fontWeight: 700 }}
        />
        <Tab
          icon={<InfoOutlinedIcon />}
          iconPosition="start"
          label="Raw JSON Inspector"
          sx={{ textTransform: 'none', fontWeight: 700 }}
        />
      </Tabs>
    </>
  )
}
