'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Box,
  Container,
  Stack,
  ThemeProvider,
  createTheme,
  CssBaseline,
} from '@mui/material'
import ArtistHero from './ArtistHero'
import FloatingNavBar from './FloatingNavBar'
import PlatformSelectorModal from './PlatformSelectorModal'
import ProjectCard from './ProjectCard'
import AudioPlayerBar from './AudioPlayerBar'
import DevHealthDrawer from './DevHealthDrawer'
import SubduedText from './SubduedText'
import { slugify, findProjectBySlug, findTrackBySlug } from '../lib/slugs'

export default function MainDiscographyApp({ data, health, initialSlug = [] }) {
  // Theme state
  const [darkMode, setDarkMode] = useState(true)

  // SPA View & Route State
  const [currentView, setCurrentView] = useState('ALL_PROJECTS')
  const [selectedProject, setSelectedProject] = useState(null)
  const [highlightedTrackSlug, setHighlightedTrackSlug] = useState(null)

  // Preferred Platform State
  const [selectedPlatform, setSelectedPlatform] = useState('')
  const [platformModalOpen, setPlatformModalOpen] = useState(false)

  // Audio Player State
  const [playingTrack, setPlayingTrack] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)

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

  const artist = data?.artist ?? {}
  const projects = data?.projects ?? []

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
    syncStateFromLocation()

    const handlePopState = () => {
      syncStateFromLocation()
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [syncStateFromLocation])

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
          pb: playingTrack ? { xs: 20, sm: 24, md: 28 } : { xs: 8, sm: 12 },
          transition: 'background-color 0.3s ease',
        }}
      >
        {/* Top Screen-Height Hero Section */}
        <ArtistHero
          artist={artist}
          onLogoClick={currentView === 'SINGLE_PROJECT' ? navigateToHome : undefined}
        />

        {/* Contained Floating Sticky Nav Bar */}
        <FloatingNavBar
          activeTypes={activeTypes}
          onToggleType={handleToggleType}
          onResetTypes={handleResetTypes}
          sortOrder={sortOrder}
          onSortChange={setSortOrder}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          darkMode={darkMode}
          onToggleTheme={() => setDarkMode(prev => !prev)}
          selectedPlatform={selectedPlatform}
          onOpenPlatformModal={() => setPlatformModalOpen(true)}
        />

        {/* Main Content Projects Container */}
        <Container maxWidth="md" sx={{ mt: 4, flexGrow: 1 }}>
          {currentView === 'SINGLE_PROJECT' && selectedProject ? (
            <ProjectCard
              project={selectedProject}
              artistName={artist.name}
              onSelectProject={navigateToProject}
              onBackToAll={navigateToHome}
              isSingleView={true}
              onPlayTrack={handlePlayTrack}
              playingTrack={playingTrack}
              highlightedTrackSlug={highlightedTrackSlug}
              onSelectTrack={(track) => navigateToTrack(selectedProject, track)}
              selectedPlatform={selectedPlatform}
            />
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
        />

        {/* Dev Data Health Drawer Badge */}
        <DevHealthDrawer health={health} />
      </Box>
    </ThemeProvider>
  )
}
