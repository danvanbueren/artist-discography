'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Stack,
  Typography,
  Paper,
  Card,
  CardContent,
  Chip,
  Button,
  IconButton,
  Divider,
  Alert,
  AlertTitle,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Grid,
  CircularProgress,
} from '@mui/material'

import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import HomeIcon from '@mui/icons-material/Home'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import MusicNoteIcon from '@mui/icons-material/MusicNote'
import AlbumIcon from '@mui/icons-material/Album'
import LaunchIcon from '@mui/icons-material/Launch'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import PauseIcon from '@mui/icons-material/Pause'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import AudioFileIcon from '@mui/icons-material/AudioFile'
import ImageIcon from '@mui/icons-material/Image'
import LinkIcon from '@mui/icons-material/Link'
import EqualizerIcon from '@mui/icons-material/Equalizer'
import SecurityIcon from '@mui/icons-material/Security'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import CodeIcon from '@mui/icons-material/Code'
import { useRouter } from 'next/navigation'
import DashboardIcon from '@mui/icons-material/Dashboard'
import { formatProjectDate } from '../lib/dateUtils'
import DevApiExplorer from './DevApiExplorer'
import DevPlatformsSocialsView from './DevPlatformsSocialsView'
import DevDiscographyAuditView from './DevDiscographyAuditView'

export default function DevArtistDiscographyView({ data: initialData, health }) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [dataState, setDataState] = useState(initialData)
  const [activeTab, setActiveTab] = useState(0)
  const [playingAudioUrl, setPlayingAudioUrl] = useState(null)
  const [audioObj, setAudioObj] = useState(null)
  const [copiedJson, setCopiedJson] = useState(false)
  const [isGeneratingDummy, setIsGeneratingDummy] = useState(false)
  const [seedMessage, setSeedMessage] = useState('')
  const [seedError, setSeedError] = useState('')

  useEffect(() => {
    setMounted(true)
    try {
      const savedTab = sessionStorage.getItem('dev_active_tab')
      if (savedTab !== null) {
        const parsed = parseInt(savedTab, 10)
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 4) {
          setActiveTab(parsed)
        }
      }
    } catch (e) {}
  }, [])

  useEffect(() => {
    if (initialData) {
      setDataState(initialData)
    }
  }, [initialData])

  const handleTabChange = (_, val) => {
    setActiveTab(val)
    try {
      sessionStorage.setItem('dev_active_tab', String(val))
    } catch (e) {}
  }

  // Audio preview playback handler
  const handleToggleAudio = (url) => {
    if (!url) return

    if (playingAudioUrl === url) {
      if (audioObj) {
        audioObj.pause()
      }
      setPlayingAudioUrl(null)
      setAudioObj(null)
    } else {
      if (audioObj) {
        audioObj.pause()
      }
      const newAudio = new Audio(url)
      newAudio.play().catch(() => {})
      newAudio.onended = () => {
        setPlayingAudioUrl(null)
        setAudioObj(null)
      }
      setAudioObj(newAudio)
      setPlayingAudioUrl(url)
    }
  }

  // Copy raw JSON to clipboard
  const handleCopyJson = () => {
    try {
      navigator.clipboard.writeText(JSON.stringify(dataState, null, 2))
      setCopiedJson(true)
      setTimeout(() => setCopiedJson(false), 2000)
    } catch (err) {}
  }

  // Generate randomized dummy data seamlessly without forcing page reload
  const handleGenerateDummyData = async () => {
    setIsGeneratingDummy(true)
    setSeedMessage('')
    setSeedError('')
    try {
      const res = await fetch('/api/dev/seed-dummy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const result = await res.json()
      if (res.ok && result?.success) {
        setSeedMessage(result.message || 'Dummy data generated successfully!')
        if (result.data) {
          setDataState(result.data)
        }
        try {
          router.refresh()
        } catch (e) {}
      } else {
        setSeedError(result?.error || 'Failed to generate dummy data.')
      }
    } catch (err) {
      setSeedError(`Error generating dummy data: ${err.message}`)
    } finally {
      setIsGeneratingDummy(false)
    }
  }

  const artistName = dataState?.artist?.name ?? ''
  const artistBio = dataState?.artist?.bio ?? ''
  const isArtistNameEmpty = !artistName || artistName.trim() === ''
  const platforms = dataState?.artist?.links?.platforms ?? {}
  const socials = dataState?.artist?.links?.socials ?? {}
  const projects = dataState?.projects ?? []

  // Metrics computation
  let totalTracksCount = 0
  let tracksWithAudioCount = 0
  let projectsWithCoverCount = 0
  let totalPlatformLinksCount = 0

  projects.forEach((p) => {
    if (p.cover || p.hasCover) projectsWithCoverCount++
    const trks = p.tracks ?? []
    totalTracksCount += trks.length
    trks.forEach((t) => {
      if (t.audioUrl || t.hasAudio || t.audio) tracksWithAudioCount++
      const links = t.links ?? {}
      Object.values(links).forEach((l) => {
        if (l && typeof l === 'string' && l.trim() !== '') totalPlatformLinksCount++
      })
    })
  })

  const audioCoveragePct = totalTracksCount > 0 ? Math.round((tracksWithAudioCount / totalTracksCount) * 100) : 0
  const coverCoveragePct = projects.length > 0 ? Math.round((projectsWithCoverCount / projects.length) * 100) : 0

  return (
    <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 }, py: 5 }}>
      {/* Top Header Bar with Navigation & Actions */}
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
              Developer & System Control Center
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              System metrics, OpenAPI interactive explorer, asset coverage, and data health console
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Seed Status & Warnings Alerts */}
      {seedMessage && (
        <Alert severity="success" onClose={() => setSeedMessage('')} sx={{ mb: 3, borderRadius: 2.5 }}>
          {seedMessage}
        </Alert>
      )}
      {seedError && (
        <Alert severity="error" onClose={() => setSeedError('')} sx={{ mb: 3, borderRadius: 2.5 }}>
          {seedError}
        </Alert>
      )}

      {/* Reorganized Tab Navigation */}
      <Paper
        elevation={2}
        sx={{
          borderRadius: 3,
          backgroundColor: 'rgba(20, 20, 28, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          mb: 4,
        }}
      >
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', px: 2, pt: 1 }}
        >
          <Tab icon={<DashboardIcon />} iconPosition="start" label="Overview & Health" sx={{ textTransform: 'none', fontWeight: 700 }} />
          <Tab icon={<CodeIcon />} iconPosition="start" label="API Explorer" sx={{ textTransform: 'none', fontWeight: 700 }} />
          <Tab icon={<AlbumIcon />} iconPosition="start" label="Discography & Media Audit" sx={{ textTransform: 'none', fontWeight: 700 }} />
          <Tab icon={<EqualizerIcon />} iconPosition="start" label="Platforms & Socials" sx={{ textTransform: 'none', fontWeight: 700 }} />
          <Tab icon={<InfoOutlinedIcon />} iconPosition="start" label="Raw JSON Inspector" sx={{ textTransform: 'none', fontWeight: 700 }} />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {/* TAB 0: System Overview & Health */}
          {activeTab === 0 && (
            <Stack spacing={3}>
              {/* Warnings & Alerts */}
              {isArtistNameEmpty && (
                <Alert
                  severity="warning"
                  icon={<WarningAmberRoundedIcon />}
                  sx={{ borderRadius: 2.5 }}
                >
                  <AlertTitle sx={{ fontWeight: 700 }}>Site Operator Alert</AlertTitle>
                  Artist name is currently empty. Update <code>data/artist-data.json</code> with the artist name.
                </Alert>
              )}

              {health?.issues?.length > 0 && (
                <Alert
                  severity="info"
                  icon={<InfoOutlinedIcon />}
                  sx={{ borderRadius: 2.5 }}
                >
                  <AlertTitle sx={{ fontWeight: 700 }}>Data File Health Log ({health.issues.length} notes)</AlertTitle>
                  <Box component="ul" sx={{ m: 0, pl: 2 }}>
                    {health.issues.map((issue, idx) => (
                      <li key={idx}>{issue}</li>
                    ))}
                  </Box>
                </Alert>
              )}

              {/* High Level Stats Summary Row */}
              <Grid container spacing={2.5}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Paper
                    elevation={2}
                    sx={{
                      p: 2.5,
                      borderRadius: 3,
                      backgroundColor: 'rgba(25, 25, 35, 0.75)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        Total Projects
                      </Typography>
                      <AlbumIcon color="primary" />
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 800 }}>
                      {projects.length}
                    </Typography>
                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={coverCoveragePct}
                        sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
                      />
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {coverCoveragePct}% covers
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Paper
                    elevation={2}
                    sx={{
                      p: 2.5,
                      borderRadius: 3,
                      backgroundColor: 'rgba(25, 25, 35, 0.75)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        Total Tracks
                      </Typography>
                      <MusicNoteIcon color="secondary" />
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 800 }}>
                      {totalTracksCount}
                    </Typography>
                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        color="secondary"
                        value={audioCoveragePct}
                        sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
                      />
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {audioCoveragePct}% audio
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Paper
                    elevation={2}
                    sx={{
                      p: 2.5,
                      borderRadius: 3,
                      backgroundColor: 'rgba(25, 25, 35, 0.75)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        Streaming Links
                      </Typography>
                      <LinkIcon color="info" />
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 800 }}>
                      {totalPlatformLinksCount}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1 }}>
                      Active platform URLs configured
                    </Typography>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Paper
                    elevation={2}
                    sx={{
                      p: 2.5,
                      borderRadius: 3,
                      backgroundColor: 'rgba(25, 25, 35, 0.75)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        System Access
                      </Typography>
                      <SecurityIcon color={dataState?.adminAccess ? 'warning' : 'success'} />
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
                      <Chip
                        label={`Admin: ${dataState?.adminAccess ? 'OPEN' : 'LOCKED'}`}
                        color={dataState?.adminAccess ? 'error' : 'default'}
                        size="small"
                        sx={{ fontWeight: 700 }}
                      />
                      <Chip
                        label={`Dev: ${Boolean(dataState?.devAccess) ? 'OPEN' : 'LOCKED'}`}
                        color={Boolean(dataState?.devAccess) ? 'warning' : 'default'}
                        size="small"
                        sx={{ fontWeight: 700 }}
                      />
                    </Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1 }}>
                      Access status in artist-data.json
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              {/* Quick Actions Panel */}
              <Card
                variant="outlined"
                sx={{
                  backgroundColor: 'rgba(26, 26, 36, 0.6)',
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: 2.5,
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                    Quick Developer Controls
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2.5 }}>
                    Seed sample data for testing responsive views or access administrative controls
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Button
                      variant="contained"
                      color="warning"
                      startIcon={isGeneratingDummy ? <CircularProgress size={18} color="inherit" /> : <AutoAwesomeIcon />}
                      onClick={handleGenerateDummyData}
                      disabled={isGeneratingDummy}
                      sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
                    >
                      {isGeneratingDummy ? 'Generating Data...' : 'Randomize Dummy Data'}
                    </Button>

                    <Button
                      variant="outlined"
                      color="secondary"
                      startIcon={<AdminPanelSettingsIcon />}
                      href="/sys/admin"
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                    >
                      Open Admin Portal
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Stack>
          )}

          {/* TAB 1: API Explorer */}
          {activeTab === 1 && <DevApiExplorer />}

          {/* TAB 2: Discography & Media Audit */}
          {activeTab === 2 && (
            <DevDiscographyAuditView
              projects={projects}
              artistName={artistName}
              health={health}
              mounted={mounted}
              playingAudioUrl={playingAudioUrl}
              handleToggleAudio={handleToggleAudio}
            />
          )}

          {/* TAB 3: Platforms & Socials */}
          {activeTab === 3 && <DevPlatformsSocialsView platforms={platforms} socials={socials} />}

          {/* TAB 4: Raw JSON Inspector */}
          {activeTab === 4 && (
            <Stack spacing={3}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Raw artist-data.json Inspector
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<ContentCopyIcon />}
                  onClick={handleCopyJson}
                  sx={{ borderRadius: 2 }}
                >
                  {copiedJson ? 'Copied to Clipboard!' : 'Copy JSON'}
                </Button>
              </Box>

              <Paper
                variant="outlined"
                sx={{
                  p: 2.5,
                  backgroundColor: '#0d0d12',
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: 2.5,
                  maxHeight: 550,
                  overflowY: 'auto',
                }}
              >
                <Typography
                  component="pre"
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: '0.85rem',
                    color: '#81d4fa',
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {JSON.stringify(dataState, null, 2)}
                </Typography>
              </Paper>
            </Stack>
          )}
        </Box>
      </Paper>
    </Container>
  )
}
