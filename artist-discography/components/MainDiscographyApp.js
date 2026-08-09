'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Box,
  Container,
  Stack,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Typography,
  Snackbar,
  CircularProgress,
} from '@mui/material'
import useMediaQuery from '@mui/material/useMediaQuery'
import ArtistHero from './ArtistHero'
import FloatingNavBar from './FloatingNavBar'
import PlatformSelectorModal from './PlatformSelectorModal'
import ProjectCard from './ProjectCard'
import AudioPlayerBar from './AudioPlayerBar'
import DevHealthDrawer from './DevHealthDrawer'
import SubduedText from './SubduedText'
import { slugify, findProjectBySlug, findTrackBySlug } from '../lib/slugs'
import { useLogoAnalysis, shouldApplyLogoGradient } from '../lib/useLogoAnalysis'

export default function MainDiscographyApp({ data, health, initialSlug = [] }) {
  // Mounting & Hydration state
  const [mounted, setMounted] = useState(false)

  // System Theme Preference Detection
  const systemPrefersDark = useMediaQuery('(prefers-color-scheme: dark)')
  const [darkMode, setDarkMode] = useState(true)
  const logoAnalysis = useLogoAnalysis('/api/logo')
  const applySingleLogoGradient = shouldApplyLogoGradient(logoAnalysis, darkMode)

  const handleToggleTheme = useCallback(() => {
    setDarkMode(prev => {
      const nextMode = !prev
      if (typeof window !== 'undefined') {
        localStorage.setItem('themeMode', nextMode ? 'dark' : 'light')
      }
      return nextMode
    })
  }, [])

  const artist = data?.artist ?? {}
  const projects = useMemo(() => data?.projects ?? [], [data])

  // Resolve initial project & track from initialSlug or window.location
  const initialResolved = useMemo(() => {
    let slugArr = initialSlug
    if (typeof window !== 'undefined' && (!slugArr || slugArr.length === 0)) {
      const pathSegments = window.location.pathname.split('/').filter(Boolean)
      slugArr = pathSegments
    }
    if (slugArr && slugArr.length > 0) {
      const matchedProject = findProjectBySlug(projects, slugArr[0])
      if (matchedProject) {
        let matchedTrackSlug = null
        if (slugArr.length > 1) {
          const matchedTrack = findTrackBySlug(matchedProject.tracks ?? [], slugArr[1])
          if (matchedTrack) {
            matchedTrackSlug = slugify(matchedTrack.name)
          }
        }
        return {
          view: 'SINGLE_PROJECT',
          project: matchedProject,
          trackSlug: matchedTrackSlug,
        }
      }
    }
    return {
      view: 'ALL_PROJECTS',
      project: null,
      trackSlug: null,
    }
  }, [initialSlug, projects])

  // SPA View & Route State initialized immediately to match URL
  const [currentView, setCurrentView] = useState(() => initialResolved.view)
  const [selectedProject, setSelectedProject] = useState(() => initialResolved.project)
  const [highlightedTrackSlug, setHighlightedTrackSlug] = useState(() => initialResolved.trackSlug)

  // Preferred Platform State
  const [selectedPlatform, setSelectedPlatform] = useState('')
  const [platformModalOpen, setPlatformModalOpen] = useState(false)

  // Audio Player & Queue State
  const [playingTrack, setPlayingTrack] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioQueue, setAudioQueue] = useState([])

  // Toast / Notification State
  const [toastMessage, setToastMessage] = useState('')
  const [toastOpen, setToastOpen] = useState(false)

  const showToast = useCallback((msg) => {
    setToastMessage(msg)
    setToastOpen(true)
  }, [])

  const handleAddToQueue = useCallback((track, proj) => {
    setAudioQueue(prev => [...prev, { track, project: proj }])
    showToast(`Added "${track?.name || 'track'}" to queue`)
  }, [showToast])

  const handleSkipNext = useCallback(() => {
    if (audioQueue.length > 0) {
      const [nextItem, ...restQueue] = audioQueue
      setAudioQueue(restQueue)
      setPlayingTrack(nextItem.track)
      setIsPlaying(true)
      showToast(`Now playing "${nextItem.track?.name || 'track'}"`)
    } else {
      setIsPlaying(false)
    }
  }, [audioQueue, showToast])

  // Multi-Select Type Filters & Sorting State
  const [activeTypes, setActiveTypes] = useState([]) // e.g. ['LP', 'EP']
  const [sortOrder, setSortOrder] = useState('newest') // 'newest' | 'oldest' | 'title-asc' | 'title-desc'
  const [searchQuery, setSearchQuery] = useState('')

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: darkMode ? 'dark' : 'light',
          primary: {
            main: '#90caf9',
          },
          secondary: {
            main: '#f48fb1',
          },
          background: {
            default: darkMode ? '#0a0a0f' : '#f6f7fa',
            paper: darkMode ? '#13131c' : '#ffffff',
          },
        },
        typography: {
          fontFamily: 'Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        },
      }),
    [darkMode]
  )

  // Load preferred platform from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('preferred_music_platform')
      if (saved) setSelectedPlatform(saved)
    } catch {}
  }, [])

  const handleSelectPlatform = (platformId) => {
    setSelectedPlatform(platformId)
    try {
      localStorage.setItem('preferred_music_platform', platformId)
    } catch {}
  }

  const handleToggleType = (type) => {
    setActiveTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  const handleResetTypes = () => {
    setActiveTypes([])
  }

  // Parse path and sync SPA state with URL
  const syncStateFromLocation = useCallback(() => {
    const path = window.location.pathname
    const pathSegments = path.split('/').filter(Boolean)

    if (pathSegments.length === 0) {
      setCurrentView('ALL_PROJECTS')
      setSelectedProject(null)
      setHighlightedTrackSlug(null)
      return
    }

    const projSlug = pathSegments[0]
    const matchedProject = findProjectBySlug(projects, projSlug)

    if (matchedProject) {
      setCurrentView('SINGLE_PROJECT')
      setSelectedProject(matchedProject)

      if (pathSegments.length > 1) {
        const trkSlug = pathSegments[1]
        const matchedTrack = findTrackBySlug(matchedProject.tracks, trkSlug)
        if (matchedTrack) {
          setHighlightedTrackSlug(slugify(matchedTrack.name))
        } else {
          const validProjSlug = slugify(matchedProject.name) || projSlug
          window.history.replaceState({}, '', `/${validProjSlug}`)
          setHighlightedTrackSlug(null)
        }
      } else {
        setHighlightedTrackSlug(null)
      }
    } else {
      window.history.replaceState({}, '', '/')
      setCurrentView('ALL_PROJECTS')
      setSelectedProject(null)
      setHighlightedTrackSlug(null)
    }
  }, [projects])

  // Sync on mount and browser back/forward popstate
  useEffect(() => {
    const savedTheme = localStorage.getItem('themeMode')
    if (savedTheme === 'dark') {
      setDarkMode(true)
    } else if (savedTheme === 'light') {
      setDarkMode(false)
    } else {
      setDarkMode(systemPrefersDark)
    }

    syncStateFromLocation()
    setMounted(true)

    const handlePopState = () => {
      syncStateFromLocation()
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [systemPrefersDark, syncStateFromLocation])

  // Navigation handlers (client-side SPA, uninterrupted audio!)
  const navigateToProject = (project) => {
    if (!project) return
    const projSlug = slugify(project.name) || 'project'
    window.history.pushState({}, '', `/${projSlug}`)
    setSelectedProject(project)
    setCurrentView('SINGLE_PROJECT')
    setHighlightedTrackSlug(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const navigateToTrack = (project, track) => {
    if (!project || !track) return
    const projSlug = slugify(project.name) || 'project'
    const trkSlug = slugify(track.name) || 'track'
    window.history.pushState({}, '', `/${projSlug}/${trkSlug}`)
    setSelectedProject(project)
    setCurrentView('SINGLE_PROJECT')
    setHighlightedTrackSlug(trkSlug)
    handlePlayTrack(track)
  }

  const navigateToHome = () => {
    window.history.pushState({}, '', '/')
    setCurrentView('ALL_PROJECTS')
    setSelectedProject(null)
    setHighlightedTrackSlug(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Audio Playback Handler
  const handlePlayTrack = (track) => {
    if (!track) return
    if (playingTrack?.name === track.name && isPlaying) {
      setIsPlaying(false)
    } else {
      setPlayingTrack({
        ...track,
        artist: track.artist || selectedProject?.artist || artist.name,
      })
      setIsPlaying(true)
    }
  }

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    let result = [...projects]

    // Multi-Select Type Filter
    if (activeTypes.length > 0) {
      result = result.filter(p =>
        activeTypes.some(t => (p.type || '').toLowerCase() === t.toLowerCase())
      )
    }

    // Search filter
    if (searchQuery && searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter(p => {
        const nameMatch = (p.name || '').toLowerCase().includes(q)
        const artistMatch = (p.artist || '').toLowerCase().includes(q)
        const trackMatch = (p.tracks || []).some(t => (t.name || '').toLowerCase().includes(q))
        return nameMatch || artistMatch || trackMatch
      })
    }

    // Sort order variants
    result.sort((a, b) => {
      if (sortOrder === 'newest') {
        const dateA = new Date(a.date || 0).getTime()
        const dateB = new Date(b.date || 0).getTime()
        return dateB - dateA
      } else if (sortOrder === 'oldest') {
        const dateA = new Date(a.date || 0).getTime()
        const dateB = new Date(b.date || 0).getTime()
        return dateA - dateB
      } else if (sortOrder === 'title-asc') {
        return (a.name || '').localeCompare(b.name || '')
      } else if (sortOrder === 'title-desc') {
        return (b.name || '').localeCompare(a.name || '')
      }
      return 0
    })

    return result
  }, [projects, activeTypes, searchQuery, sortOrder])

  if (!mounted) {
    return (
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          bgcolor: '#0a0a0f',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 3,
          zIndex: 9999,
        }}
      >
        <Box
          component="img"
          src="/api/logo"
          alt="Loading"
          sx={{
            maxHeight: 90,
            maxWidth: 180,
            objectFit: 'contain',
            opacity: 0.8,
            animation: 'pulse 1.8s infinite ease-in-out',
            '@keyframes pulse': {
              '0%, 100%': { opacity: 0.35, transform: 'scale(0.97)' },
              '50%': { opacity: 0.95, transform: 'scale(1.03)' },
            },
          }}
        />
        <CircularProgress size={36} thickness={4} sx={{ color: '#90caf9' }} />
      </Box>
    )
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'background.default',
          color: 'text.primary',
          pb: playingTrack ? { xs: 14, sm: 16 } : { xs: 5, sm: 6 },
          transition: 'background-color 0.3s ease',
        }}
      >
        {/* Top Screen-Height Hero Section (Only on main discography view) */}
        {currentView !== 'SINGLE_PROJECT' && (
          <ArtistHero
            artist={artist}
            onLogoClick={undefined}
          />
        )}

        {/* Contained Floating Sticky Nav Bar (Only on main discography view) */}
        {currentView !== 'SINGLE_PROJECT' && (
          <FloatingNavBar
            activeTypes={activeTypes}
            onToggleType={handleToggleType}
            onResetTypes={handleResetTypes}
            sortOrder={sortOrder}
            onSortChange={setSortOrder}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            darkMode={darkMode}
            onToggleTheme={handleToggleTheme}
            selectedPlatform={selectedPlatform}
            onOpenPlatformModal={() => setPlatformModalOpen(true)}
          />
        )}

        {/* Main Content Projects Container */}
        <Container maxWidth="md" sx={{ mt: { xs: 1, sm: 2 }, flexGrow: 1 }}>
          {currentView === 'SINGLE_PROJECT' && selectedProject ? (
            <Stack spacing={3}>
              {/* Single Project Page Header: Centered Horizontal Logo & Artist Name Button */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  py: { xs: 2.5, sm: 4, md: 5 },
                }}
              >
                <Stack
                  direction="row"
                  spacing={2}
                  onClick={navigateToHome}
                  sx={{
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    px: { xs: 2, sm: 3 },
                    py: 1.25,
                    borderRadius: 4,
                    bgcolor: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                    border: '1px solid',
                    borderColor: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                    backdropFilter: 'blur(8px)',
                    transition: 'transform 0.25s ease, bgcolor 0.25s ease, border-color 0.25s ease',
                    '&:hover': {
                      transform: 'scale(1.04)',
                      bgcolor: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                      borderColor: 'primary.main',
                    },
                  }}
                >
                  {applySingleLogoGradient ? (
                    <Box
                      sx={{
                        width: { xs: 36, sm: 48, md: 54 },
                        height: { xs: 36, sm: 48, md: 54 },
                        WebkitMaskImage: 'url("/api/logo")',
                        maskImage: 'url("/api/logo")',
                        WebkitMaskSize: 'contain',
                        maskSize: 'contain',
                        WebkitMaskRepeat: 'no-repeat',
                        maskRepeat: 'no-repeat',
                        WebkitMaskPosition: 'center',
                        maskPosition: 'center',
                        background: darkMode
                          ? 'linear-gradient(135deg, #ffffff 0%, #a0a0b0 100%)'
                          : 'linear-gradient(135deg, #111827 0%, #4b5563 100%)',
                      }}
                    />
                  ) : (
                    <Box
                      component="img"
                      src="/api/logo"
                      alt="Artist Logo"
                      sx={{
                        height: { xs: 36, sm: 48, md: 54 },
                        maxWidth: 150,
                        objectFit: 'contain',
                      }}
                    />
                  )}
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 800,
                      fontSize: { xs: '1.15rem', sm: '1.4rem' },
                      background: darkMode
                        ? 'linear-gradient(135deg, #ffffff 0%, #a0a0b0 100%)'
                        : 'linear-gradient(135deg, #111827 0%, #4b5563 100%)',
                      WebkitBackgroundClip: artist.name ? 'text' : 'none',
                      WebkitTextFillColor: artist.name ? 'transparent' : 'inherit',
                    }}
                  >
                    {artist.name || 'Artist'}
                  </Typography>
                </Stack>
              </Box>

              <ProjectCard
                project={selectedProject}
                artistName={artist.name}
                onSelectProject={navigateToProject}
                isSingleView={true}
                onPlayTrack={handlePlayTrack}
                onAddToQueue={handleAddToQueue}
                onShowToast={showToast}
                playingTrack={playingTrack}
                highlightedTrackSlug={highlightedTrackSlug}
                onSelectTrack={(track) => navigateToTrack(selectedProject, track)}
                selectedPlatform={selectedPlatform}
              />
            </Stack>
          ) : (
            <Stack spacing={4}>
              {filteredProjects.length === 0 ? (
                <Box sx={{ py: 10, textAlign: 'center' }}>
                  <SubduedText
                    value=""
                    placeholder="No projects match your selected filter or search query."
                    variant="h6"
                  />
                </Box>
              ) : (
                filteredProjects.map((proj, idx) => (
                  <ProjectCard
                    key={idx}
                    project={proj}
                    artistName={artist.name}
                    onSelectProject={navigateToProject}
                    isSingleView={false}
                    onPlayTrack={handlePlayTrack}
                    onAddToQueue={handleAddToQueue}
                    onShowToast={showToast}
                    playingTrack={playingTrack}
                    highlightedTrackSlug={null}
                    onSelectTrack={(track) => navigateToTrack(proj, track)}
                    selectedPlatform={selectedPlatform}
                  />
                ))
              )}
            </Stack>
          )}
        </Container>

        {/* Preferred Platform Selector Modal */}
        <PlatformSelectorModal
          open={platformModalOpen}
          onClose={() => setPlatformModalOpen(false)}
          selectedPlatform={selectedPlatform}
          onSelectPlatform={handleSelectPlatform}
        />

        {/* Contained Floating Audio Player Bar */}
        <AudioPlayerBar
          playingTrack={playingTrack}
          isPlaying={isPlaying}
          onTogglePlay={() => setIsPlaying(prev => !prev)}
          onClosePlayer={() => {
            setPlayingTrack(null)
            setIsPlaying(false)
          }}
          queueCount={audioQueue.length}
          onSkipNext={handleSkipNext}
        />

        {/* Feedback Snackbar / Toast */}
        <Snackbar
          open={toastOpen}
          autoHideDuration={3000}
          onClose={() => setToastOpen(false)}
          message={toastMessage}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          sx={{ mb: playingTrack ? 10 : 2 }}
        />

        {/* Dev Data Health Drawer Badge */}
        <DevHealthDrawer health={health} />
      </Box>
    </ThemeProvider>
  )
}
