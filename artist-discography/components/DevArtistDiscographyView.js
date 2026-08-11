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
  Tooltip,
  LinearProgress,
  Grid,
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

export default function DevArtistDiscographyView({ data, health }) {
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState(0)
  const [playingAudioUrl, setPlayingAudioUrl] = useState(null)
  const [audioObj, setAudioObj] = useState(null)
  const [copiedJson, setCopiedJson] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

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
      navigator.clipboard.writeText(JSON.stringify(data, null, 2))
      setCopiedJson(true)
      setTimeout(() => setCopiedJson(false), 2000)
    } catch (err) {}
  }

  const artistName = data?.artist?.name ?? ''
  const artistBio = data?.artist?.bio ?? ''
  const isArtistNameEmpty = !artistName || artistName.trim() === ''
  const platforms = data?.artist?.links?.platforms ?? {}
  const socials = data?.artist?.links?.socials ?? {}
  const projects = data?.projects ?? []

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
      {/* Top Header Bar with Back Button */}
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
            Back to Discography
          </Button>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
              Developer & Data Health Suite
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              System diagnostics, asset coverage, and data audit tools
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<HomeIcon />}
            href="/"
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Main Site
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            size="small"
            startIcon={<AdminPanelSettingsIcon />}
            href="/admin"
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Admin Portal
          </Button>
        </Box>
      </Paper>

      {/* Warnings & Alerts */}
      {isArtistNameEmpty && (
        <Alert
          severity="warning"
          icon={<WarningAmberRoundedIcon />}
          sx={{ mb: 3, borderRadius: 2.5 }}
        >
          <AlertTitle sx={{ fontWeight: 700 }}>Site Operator Alert</AlertTitle>
          Artist name is currently empty. Update <code>data/artist-data.json</code> with the artist name.
        </Alert>
      )}

      {health?.issues?.length > 0 && (
        <Alert
          severity="info"
          icon={<InfoOutlinedIcon />}
          sx={{ mb: 3, borderRadius: 2.5 }}
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
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
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
              <SecurityIcon color={data?.adminAccess ? 'warning' : 'success'} />
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
              <Chip
                label={`Admin: ${data?.adminAccess ? 'OPEN' : 'LOCKED'}`}
                color={data?.adminAccess ? 'error' : 'default'}
                size="small"
                sx={{ fontWeight: 700 }}
              />
              <Chip
                label={`Dev: ${data?.devAccess !== false ? 'OPEN' : 'LOCKED'}`}
                color={data?.devAccess !== false ? 'warning' : 'default'}
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

      {/* Tabs navigation */}
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
          onChange={(_, val) => setActiveTab(val)}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', px: 2, pt: 1 }}
        >
          <Tab icon={<AlbumIcon />} iconPosition="start" label="Discography & Media Audit" sx={{ textTransform: 'none', fontWeight: 700 }} />
          <Tab icon={<EqualizerIcon />} iconPosition="start" label="Platforms & Socials" sx={{ textTransform: 'none', fontWeight: 700 }} />
          <Tab icon={<InfoOutlinedIcon />} iconPosition="start" label="Raw JSON & Health" sx={{ textTransform: 'none', fontWeight: 700 }} />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {/* TAB 0: Discography & Media Audit */}
          {activeTab === 0 && (
            <Stack spacing={3}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Projects & Tracks Media Coverage
                </Typography>
                <Chip
                  icon={mounted && health?.isHealthy ? <CheckCircleOutlineRoundedIcon /> : undefined}
                  label={health?.isHealthy ? 'JSON File: Fully Valid' : 'JSON File: Health Warnings'}
                  color={health?.isHealthy ? 'success' : 'warning'}
                  variant="outlined"
                />
              </Box>

              {projects.length === 0 ? (
                <Alert severity="info">No projects found in artist-data.json.</Alert>
              ) : (
                projects.map((proj, idx) => {
                  const projName = proj.name || 'Untitled Project'
                  const projType = proj.type || 'Project'
                  const projDate = proj.date || 'Date Unset'
                  const trks = proj.tracks ?? []
                  const hasCover = Boolean(proj.cover || proj.hasCover)

                  return (
                    <Card
                      key={idx}
                      variant="outlined"
                      sx={{
                        backgroundColor: 'rgba(28, 28, 38, 0.6)',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: 2.5,
                      }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            {hasCover && proj.cover ? (
                              <Box
                                component="img"
                                src={proj.cover}
                                alt={projName}
                                sx={{ width: 48, height: 48, borderRadius: 1.5, objectFit: 'cover' }}
                              />
                            ) : (
                              <Box
                                sx={{
                                  width: 48,
                                  height: 48,
                                  borderRadius: 1.5,
                                  backgroundColor: 'rgba(255,255,255,0.05)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <ImageIcon color="action" />
                              </Box>
                            )}
                            <Box>
                              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                                {projName}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                By {proj.artist || artistName} • Released {projDate}
                              </Typography>
                            </Box>
                          </Box>

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip label={projType} color="info" size="small" sx={{ fontWeight: 600 }} />
                            <Chip
                              icon={hasCover ? <ImageIcon fontSize="small" /> : undefined}
                              label={hasCover ? 'Cover OK' : 'No Cover'}
                              color={hasCover ? 'success' : 'error'}
                              variant="outlined"
                              size="small"
                            />
                          </Box>
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                          Tracks ({trks.length})
                        </Typography>

                        <TableContainer component={Paper} variant="outlined" sx={{ backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 2 }}>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Track Title</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Audio File Status</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Streaming Links</TableCell>
                                <TableCell sx={{ fontWeight: 700 }} align="right">Preview</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {trks.map((trk, tIdx) => {
                                const trkAudio = trk.audioUrl || trk.audio
                                const hasAudio = Boolean(trkAudio || trk.hasAudio)
                                const activeLinks = Object.entries(trk.links ?? {}).filter(
                                  ([_, u]) => u && typeof u === 'string' && u.trim() !== ''
                                )

                                return (
                                  <TableRow key={tIdx} hover>
                                    <TableCell sx={{ color: 'text.secondary' }}>{tIdx + 1}</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>{trk.name || 'Untitled'}</TableCell>
                                    <TableCell>
                                      <Chip
                                        icon={<AudioFileIcon fontSize="small" />}
                                        label={hasAudio ? 'Audio Available' : 'Missing Audio'}
                                        color={hasAudio ? 'success' : 'default'}
                                        variant={hasAudio ? 'filled' : 'outlined'}
                                        size="small"
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                        {activeLinks.map(([lKey]) => (
                                          <Chip key={lKey} label={lKey} size="small" variant="outlined" />
                                        ))}
                                        {activeLinks.length === 0 && (
                                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                            None
                                          </Typography>
                                        )}
                                      </Box>
                                    </TableCell>
                                    <TableCell align="right">
                                      {hasAudio && trkAudio ? (
                                        <IconButton
                                          size="small"
                                          color="primary"
                                          onClick={() => handleToggleAudio(trkAudio)}
                                        >
                                          {playingAudioUrl === trkAudio ? <PauseIcon fontSize="small" /> : <PlayArrowIcon fontSize="small" />}
                                        </IconButton>
                                      ) : (
                                        <Typography variant="caption" sx={{ color: 'text.disabled' }}>-</Typography>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                )
                              })}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </Stack>
          )}

          {/* TAB 1: Platforms & Socials */}
          {activeTab === 1 && (
            <Stack spacing={3}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
                  Artist Platforms & Stores
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                  {Object.entries(platforms).map(([platformKey, url]) => {
                    const hasUrl = Boolean(url && typeof url === 'string' && url.trim() !== '')
                    return (
                      <Chip
                        key={platformKey}
                        label={`${platformKey}${hasUrl ? '' : ' (unconfigured)'}`}
                        component={hasUrl ? 'a' : 'div'}
                        href={hasUrl ? url : undefined}
                        target={hasUrl ? '_blank' : undefined}
                        rel={hasUrl ? 'noopener noreferrer' : undefined}
                        clickable={hasUrl}
                        color={hasUrl ? 'primary' : 'default'}
                        variant={hasUrl ? 'filled' : 'outlined'}
                        icon={hasUrl && mounted ? <LaunchIcon fontSize="small" /> : undefined}
                        sx={{ py: 2, px: 1, borderRadius: 2 }}
                      />
                    )
                  })}
                </Box>
              </Box>

              <Divider />

              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
                  Artist Social Accounts
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                  {Object.entries(socials).map(([socialKey, url]) => {
                    const hasUrl = Boolean(url && typeof url === 'string' && url.trim() !== '')
                    return (
                      <Chip
                        key={socialKey}
                        label={`${socialKey}${hasUrl ? '' : ' (unconfigured)'}`}
                        component={hasUrl ? 'a' : 'div'}
                        href={hasUrl ? url : undefined}
                        target={hasUrl ? '_blank' : undefined}
                        rel={hasUrl ? 'noopener noreferrer' : undefined}
                        clickable={hasUrl}
                        color={hasUrl ? 'secondary' : 'default'}
                        variant={hasUrl ? 'filled' : 'outlined'}
                        icon={hasUrl && mounted ? <LaunchIcon fontSize="small" /> : undefined}
                        sx={{ py: 2, px: 1, borderRadius: 2 }}
                      />
                    )
                  })}
                </Box>
              </Box>
            </Stack>
          )}

          {/* TAB 2: Raw JSON & Health */}
          {activeTab === 2 && (
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
                  maxHeight: 500,
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
                  {JSON.stringify(data, null, 2)}
                </Typography>
              </Paper>
            </Stack>
          )}
        </Box>
      </Paper>
    </Container>
  )
}
