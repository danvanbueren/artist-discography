'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import {
  Box,
  Container,
  Stack,
  ThemeProvider,
  createTheme,
  CssBaseline,
  GlobalStyles,
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
import { useLogoAnalysis, getLogoFilter } from '../lib/useLogoAnalysis'
import { getCookie, setCookie } from '../lib/cookies'

export default function MainDiscographyApp({ data, health, initialSlug = [] }) {
  // Mounting & Hydration state
  const [mounted, setMounted] = useState(false)

  // System Theme Preference Detection
  const systemPrefersDark = useMediaQuery('(prefers-color-scheme: dark)')
  const [darkMode, setDarkMode] = useState(true)
  const logoAnalysis = useLogoAnalysis('/api/logo')

  // On mount: read saved theme cookie/localStorage; if none, default to system preference
  useEffect(() => {
    const savedTheme = getCookie('theme_mode') || localStorage.getItem('themeMode')
    if (savedTheme === 'dark') {
      setDarkMode(true)
    } else if (savedTheme === 'light') {
      setDarkMode(false)
    } else {
      setDarkMode(systemPrefersDark)
    }
  }, [systemPrefersDark])

  const handleToggleTheme = useCallback(() => {
    setDarkMode(prev => {
      const nextMode = !prev
      const nextThemeStr = nextMode ? 'dark' : 'light'
      try {
        setCookie('theme_mode', nextThemeStr)
        localStorage.setItem('themeMode', nextThemeStr)
      } catch {}
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
    return { view: 'ALL_PROJECTS', project: null, trackSlug: null }
  }, [initialSlug, projects])

  // SPA View & Route State initialized immediately to match URL
  const [currentView, setCurrentView] = useState(() => initialResolved.view)
  const [selectedProject, setSelectedProject] = useState(() => initialResolved.project)
  const [highlightedTrackSlug, setHighlightedTrackSlug] = useState(() => initialResolved.trackSlug)

  // Preferred Platform State (Default to 'spotify')
  const [selectedPlatform, setSelectedPlatform] = useState('spotify')
  const [platformModalOpen, setPlatformModalOpen] = useState(false)

  // Audio Player & Queue State
  const [playingTrack, setPlayingTrack] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [manualQueue, setManualQueue] = useState([])

  // Toast / Notification State
  const [toastMessage, setToastMessage] = useState('')
  const [toastOpen, setToastOpen] = useState(false)

  const showToast = useCallback((msg) => {
    setToastMessage(msg)
    setToastOpen(true)
  }, [])

  // Ref for the projects container — used by the scroll-aware mask effect below
  const projectsContainerRef = useRef(null)

  // Dynamically apply a CSS mask-image to the projects container that fades
  // project cards only where they actually overlap with the sticky nav or fixed player.
  // Uses direct DOM style mutation (not React state) to avoid re-renders on every scroll tick.
  useEffect(() => {
    // Approximate bar heights in px. Nav is only present on the main discography view.
    const NAV_H = currentView === 'SINGLE_PROJECT' ? 0 : 88
    const PLAYER_H = playingTrack ? 92 : 0
    const FADE = 52  // px: length of the fade gradient transition

    const applyMask = () => {
      const el = projectsContainerRef.current
      if (!el) return

      const rect = el.getBoundingClientRect()
      const vh = window.innerHeight

      // Is any content currently overlapping the nav at the top?
      const showTop = rect.top < NAV_H && rect.bottom > NAV_H
      // Is any content currently overlapping the player at the bottom?
      const showBottom = rect.bottom > vh - PLAYER_H && rect.top < vh - PLAYER_H

      let mask = 'none'

      if (showTop || showBottom) {
        // Convert viewport intersection points to container-relative px coordinates
        const topFadeStart = showTop ? Math.max(0, NAV_H - rect.top) : 0
        const topFadeEnd = showTop ? topFadeStart + FADE : 0

        const bottomFadeEnd = showBottom ? (vh - PLAYER_H) - rect.top : rect.height
        const bottomFadeStart = showBottom
          ? Math.max(topFadeEnd, bottomFadeEnd - FADE)
          : rect.height

        if (showTop && showBottom) {
          mask = `linear-gradient(to bottom, transparent ${topFadeStart}px, black ${topFadeEnd}px, black ${bottomFadeStart}px, transparent ${bottomFadeEnd}px)`
        } else if (showTop) {
          mask = `linear-gradient(to bottom, transparent ${topFadeStart}px, black ${topFadeEnd}px)`
        } else {
          mask = `linear-gradient(to bottom, black 0, black ${bottomFadeStart}px, transparent ${bottomFadeEnd}px)`
        }
      }

      el.style.maskImage = mask
      el.style.webkitMaskImage = mask
    }

    window.addEventListener('scroll', applyMask, { passive: true })
    window.addEventListener('resize', applyMask, { passive: true })
    applyMask()

    return () => {
      window.removeEventListener('scroll', applyMask)
      window.removeEventListener('resize', applyMask)
    }
  }, [currentView, playingTrack])

  // handleSkipNext, handleSkipPrev, handleQueueDragDrop, handleRemoveFromAutoplay
  // are declared below filteredProjects/displayedDiscographyTracks/autoplayTracks

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

  // Load preferred platform and theme from cookies on mount
  useEffect(() => {
    try {
      const savedPlatform = getCookie('preferred_music_platform') || localStorage.getItem('preferred_music_platform')
      if (savedPlatform) {
        setSelectedPlatform(savedPlatform)
      } else {
        setSelectedPlatform('spotify')
        setCookie('preferred_music_platform', 'spotify')
        localStorage.setItem('preferred_music_platform', 'spotify')
      }
    } catch {}
  }, [])

  const handleSelectPlatform = (platformId) => {
    setSelectedPlatform(platformId)
    try {
      setCookie('preferred_music_platform', platformId)
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

  // Sync route on mount and browser back/forward popstate
  useEffect(() => {
    syncStateFromLocation()
    setMounted(true)

    const handlePopState = () => {
      syncStateFromLocation()
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [syncStateFromLocation])

  // Navigation handlers (client-side SPA, uninterrupted audio!)
  const navigateToProject = (project) => {
    if (project) {
      const projSlug = slugify(project.name)
      if (projSlug) {
        window.history.pushState({}, '', `/${projSlug}`)
      }
      setSelectedProject(project)
      setHighlightedTrackSlug(null)
      setCurrentView('SINGLE_PROJECT')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const navigateToTrack = (project, track) => {
    if (project && track) {
      const projSlug = slugify(project.name)
      const trkSlug = slugify(track.name)
      if (projSlug && trkSlug) {
        window.history.pushState({}, '', `/${projSlug}/${trkSlug}`)
      }
      setSelectedProject(project)
      setHighlightedTrackSlug(trkSlug)
      setCurrentView('SINGLE_PROJECT')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const navigateToAllProjects = () => {
    window.history.pushState({}, '', '/')
    setCurrentView('ALL_PROJECTS')
    setSelectedProject(null)
    setHighlightedTrackSlug(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleNavigateToCurrentTrack = useCallback(() => {
    if (!playingTrack) return
    const parentProj = projects.find(p => (p.tracks || []).some(t => (t.name || '').toLowerCase() === (playingTrack.name || '').toLowerCase())) || projects.find(p => (p.name || '').toLowerCase() === (playingTrack.project || '').toLowerCase())
    if (parentProj) {
      const matchedTrack = (parentProj.tracks || []).find(t => (t.name || '').toLowerCase() === (playingTrack.name || '').toLowerCase()) || playingTrack
      navigateToTrack(parentProj, matchedTrack)
    }
  }, [playingTrack, projects, navigateToTrack])

  // Audio Playback Handler
  const handlePlayTrack = useCallback((track, proj) => {
    if (!track) return
    if (!track.hasAudio || !track.audioUrl) {
      showToast(`No audio available for "${track.name || 'this track'}"`)
      return
    }
    const parentProj = proj || selectedProject || projects.find(p => (p.tracks || []).some(t => (t.name || '').toLowerCase() === (track.name || '').toLowerCase()))
    const projName = parentProj?.name || track.project || ''
    const projCover = track.cover || parentProj?.cover || parentProj?.image || ''

    if (playingTrack?.name === track.name && isPlaying) {
      setIsPlaying(false)
    } else {
      setPlayingTrack({
        ...track,
        project: projName,
        projectCover: projCover,
        artist: track.artist || parentProj?.artist || artist.name,
      })
      setIsPlaying(true)
    }
  }, [playingTrack, isPlaying, selectedProject, projects, artist.name, showToast])

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

  // All Playable Tracks in Currently Presented Top-to-Bottom Order (factors in single project view, filters, search, & sorting)
  const displayedDiscographyTracks = useMemo(() => {
    const activeProjects = currentView === 'SINGLE_PROJECT' && selectedProject
      ? [selectedProject]
      : filteredProjects

    const list = []
    for (const proj of (activeProjects || [])) {
      for (const track of (proj.tracks || [])) {
        if (track.hasAudio && track.audioUrl) {
          list.push({
            track: {
              ...track,
              project: proj.name || '',
              projectCover: track.cover || proj.cover || '',
            },
            project: proj,
          })
        }
      }
    }
    return list
  }, [currentView, selectedProject, filteredProjects])

  const [customAutoplayQueue, setCustomAutoplayQueue] = useState(null)

  // Default autoplay list: strictly tracks that appear AFTER playingTrack in top-to-bottom order (no wrapping around)
  const defaultAutoplayTracks = useMemo(() => {
    if (!displayedDiscographyTracks || displayedDiscographyTracks.length === 0) return []
    if (!playingTrack) return displayedDiscographyTracks
    const currIndex = displayedDiscographyTracks.findIndex(
      item => (item.track.name || '').toLowerCase() === (playingTrack.name || '').toLowerCase()
    )
    if (currIndex === -1) return displayedDiscographyTracks
    return displayedDiscographyTracks.slice(currIndex + 1)
  }, [displayedDiscographyTracks, playingTrack])

  // Active autoplay tracks: custom override if modified by drag/drop or deletion, else default
  const autoplayTracks = useMemo(() => {
    return customAutoplayQueue !== null ? customAutoplayQueue : defaultAutoplayTracks
  }, [customAutoplayQueue, defaultAutoplayTracks])

  // Reset customAutoplayQueue when playingTrack changes to a new track
  useEffect(() => {
    setCustomAutoplayQueue(null)
  }, [playingTrack?.name])

  // Compute the most contextually relevant cover art to use as the full-page ambient background
  const ambientImage = useMemo(() => {
    // Priority 1: currently playing track's cover
    if (playingTrack?.projectCover) return playingTrack.projectCover
    if (playingTrack?.cover) return playingTrack.cover
    // Priority 2: single project view
    if (currentView === 'SINGLE_PROJECT' && selectedProject) {
      return selectedProject.cover || selectedProject.image || ''
    }
    // Priority 3: first visible project in the current filtered list
    for (const proj of (filteredProjects || [])) {
      const img = proj.cover || proj.image || ''
      if (img) return img
    }
    return ''
  }, [playingTrack, currentView, selectedProject, filteredProjects])

  const handleAddToQueue = useCallback((track, proj) => {
    if (!track || !track.hasAudio || !track.audioUrl) {
      showToast(`No audio available for "${track?.name || 'this track'}"`)
      return
    }
    const parentProj = proj || selectedProject || projects.find(p => (p.tracks || []).some(t => (t.name || '').toLowerCase() === (track.name || '').toLowerCase()))
    const trackWithProject = {
      ...track,
      project: parentProj?.name || track.project || '',
      projectCover: track.cover || parentProj?.cover || parentProj?.image || '',
    }
    setManualQueue(prev => [...prev, { track: trackWithProject, project: parentProj }])
    showToast(`Added "${track?.name || 'track'}" to queue`)
  }, [selectedProject, projects, showToast])

  const handleSkipNext = useCallback(() => {
    if (manualQueue.length > 0) {
      const [nextItem, ...restQueue] = manualQueue
      setManualQueue(restQueue)
      setPlayingTrack(nextItem.track)
      setIsPlaying(true)
      return
    }

    if (autoplayTracks.length > 0) {
      const [nextItem, ...restAutoplay] = autoplayTracks
      setCustomAutoplayQueue(restAutoplay)
      setPlayingTrack(nextItem.track)
      setIsPlaying(true)
    } else {
      setIsPlaying(false)
    }
  }, [manualQueue, autoplayTracks])

  const handleSkipPrev = useCallback(() => {
    if (displayedDiscographyTracks.length > 0) {
      let currIndex = -1
      if (playingTrack) {
        currIndex = displayedDiscographyTracks.findIndex(
          item => (item.track.name || '').toLowerCase() === (playingTrack.name || '').toLowerCase()
        )
      }
      if (currIndex > 0) {
        const prevItem = displayedDiscographyTracks[currIndex - 1]
        setPlayingTrack(prevItem.track)
        setIsPlaying(true)
      }
    }
  }, [playingTrack, displayedDiscographyTracks])

  const handleQueueDragDrop = useCallback(({ fromList, fromIndex, toList, toIndex }) => {
    let currentQueue = [...manualQueue]
    let currentAutoplay = [...autoplayTracks]

    if (fromList === 'queue' && toList === 'queue') {
      if (fromIndex < 0 || fromIndex >= currentQueue.length) return
      const [moved] = currentQueue.splice(fromIndex, 1)
      const targetIdx = Math.min(toIndex, currentQueue.length)
      currentQueue.splice(targetIdx, 0, moved)
      setManualQueue(currentQueue)
    } else if (fromList === 'autoplay' && toList === 'autoplay') {
      if (fromIndex < 0 || fromIndex >= currentAutoplay.length) return
      const [moved] = currentAutoplay.splice(fromIndex, 1)
      const targetIdx = Math.min(toIndex, currentAutoplay.length)
      currentAutoplay.splice(targetIdx, 0, moved)
      setCustomAutoplayQueue(currentAutoplay)
    } else if (fromList === 'autoplay' && toList === 'queue') {
      if (fromIndex < 0 || fromIndex >= currentAutoplay.length) return
      const [moved] = currentAutoplay.splice(fromIndex, 1)
      const targetIdx = Math.min(toIndex, currentQueue.length)
      currentQueue.splice(targetIdx, 0, moved)
      setManualQueue(currentQueue)
      setCustomAutoplayQueue(currentAutoplay)
    } else if (fromList === 'queue' && toList === 'autoplay') {
      if (fromIndex < 0 || fromIndex >= currentQueue.length) return
      const [moved] = currentQueue.splice(fromIndex, 1)
      const targetIdx = Math.min(toIndex, currentAutoplay.length)
      currentAutoplay.splice(targetIdx, 0, moved)
      setManualQueue(currentQueue)
      setCustomAutoplayQueue(currentAutoplay)
    }
  }, [manualQueue, autoplayTracks])

  const handleRemoveFromAutoplay = useCallback((index) => {
    setCustomAutoplayQueue(prev => {
      const current = prev !== null ? [...prev] : [...autoplayTracks]
      if (index >= 0 && index < current.length) {
        current.splice(index, 1)
      }
      return current
    })
  }, [autoplayTracks])

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
          draggable={false}
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
      <GlobalStyles
        styles={{
          '*': {
            userSelect: 'none !important',
            WebkitUserSelect: 'none !important',
            MozUserSelect: 'none !important',
            msUserSelect: 'none !important',
          },
          '[draggable="true"], [draggable="true"] *': {
            WebkitUserDrag: 'element !important',
            userSelect: 'none !important',
            WebkitUserSelect: 'none !important',
          },
          'img, picture, video, canvas': {
            userSelect: 'none !important',
            WebkitUserSelect: 'none !important',
            WebkitUserDrag: 'none !important',
            pointerEvents: 'none',
          },
          'input, textarea, [contenteditable="true"]': {
            userSelect: 'text !important',
            WebkitUserSelect: 'text !important',
            MozUserSelect: 'text !important',
            msUserSelect: 'text !important',
            pointerEvents: 'auto',
          },
          // Modern custom scrollbars
          '*::-webkit-scrollbar': {
            width: '6px',
            height: '6px',
          },
          '*::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '*::-webkit-scrollbar-thumb': {
            background: darkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.18)',
            borderRadius: '99px',
            transition: 'background 0.2s ease',
          },
          '*::-webkit-scrollbar-thumb:hover': {
            background: darkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.32)',
          },
          '*::-webkit-scrollbar-corner': {
            background: 'transparent',
          },
          // Firefox scrollbar
          '*': {
            scrollbarWidth: 'thin',
            scrollbarColor: darkMode
              ? 'rgba(255,255,255,0.15) transparent'
              : 'rgba(0,0,0,0.18) transparent',
          },
        }}
      />

      {/* Fixed full-viewport ambient background — blurred cover art */}
      <Box
        aria-hidden
        sx={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
          bgcolor: 'background.default',
          transition: 'background-color 0.3s ease',
        }}
      >
        {ambientImage && (
          <Box
            key={ambientImage}
            sx={{
              position: 'absolute',
              inset: '-10%',
              backgroundImage: `url(${ambientImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(80px) saturate(1.2)',
              opacity: darkMode ? 0.18 : 0.12,
              animation: 'ambientFadeIn 1.2s ease forwards',
              '@keyframes ambientFadeIn': {
                from: { opacity: 0 },
                to: { opacity: darkMode ? 0.18 : 0.12 },
              },
            }}
          />
        )}
      </Box>

      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          zIndex: 1,
          color: 'text.primary',
          pb: playingTrack ? { xs: 14, sm: 16 } : { xs: 5, sm: 6 },
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
        <Container
          ref={projectsContainerRef}
          maxWidth="md"
          sx={{
            px: { xs: 2, sm: 3 },
            mt: { xs: 2, sm: 3 },
            flexGrow: 1,
          }}
        >
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
                  onClick={navigateToAllProjects}
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
                  <Box
                    component="img"
                    src="/api/logo"
                    alt="Artist Logo"
                    draggable={false}
                    sx={{
                      height: { xs: 36, sm: 48, md: 54 },
                      maxWidth: { xs: 80, sm: 120, md: 150 },
                      objectFit: 'contain',
                      filter: getLogoFilter(logoAnalysis, darkMode, 'none'),
                    }}
                  />
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
                isPlaying={isPlaying}
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
                    isPlaying={isPlaying}
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
          queueCount={manualQueue.length}
          manualQueue={manualQueue}
          autoplayTracks={autoplayTracks}
          onQueueDragDrop={handleQueueDragDrop}
          onRemoveFromManualQueue={(index) => {
            setManualQueue(prev => prev.filter((_, i) => i !== index))
          }}
          onRemoveFromAutoplay={handleRemoveFromAutoplay}
          onPlayQueuedTrack={(item, index, isManual = true) => {
            if (isManual) {
              setManualQueue(prev => prev.filter((_, i) => i !== index))
            } else {
              handleRemoveFromAutoplay(index)
            }
            setPlayingTrack(item.track)
            setIsPlaying(true)
          }}
          onSkipNext={handleSkipNext}
          onSkipPrev={handleSkipPrev}
          onShowToast={showToast}
          onNavigateToCurrentTrack={handleNavigateToCurrentTrack}
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
