'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import {
  Box,
  Container,
  ThemeProvider,
  createTheme,
  CssBaseline,
  GlobalStyles,
  useMediaQuery,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material'
import { slugify, findProjectBySlug } from '@/lib/data/slugs'
import { getCookie, setCookie } from '@/lib/data/cookies'
import { useLogoAnalysis } from '@/lib/hooks/useLogoAnalysis'
import { mediaPreloader } from '@/lib/media/mediaPreloader'
import {
  getSavedAudioQuality,
  saveAudioQuality,
  detectInitialAudioQuality,
  QUALITY_TIER_CONFIG,
} from '@/lib/network/networkProbe'
import AmbientBackground from '@/components/layout/AmbientBackground'
import FloatingNavBar from '@/components/layout/FloatingNavBar'
import AudioPlayerBar from '@/components/player/AudioPlayerBar'
import PrivateAccessModal from '@/components/auth/PrivateAccessModal'
import PlatformSelectorModal, {
  STREAMING_PLATFORMS,
} from '@/components/discography/modals/PlatformSelectorModal'
import AudioQualityModal from '@/components/player/AudioQualityModal'
import OnboardingPlatformBanner from '@/components/discography/banners/OnboardingPlatformBanner'
import OnboardingThemeBanner from '@/components/discography/banners/OnboardingThemeBanner'
import PlaybackQualityBanner from '@/components/player/PlaybackQualityBanner'
import { getSortedActiveLinks } from '@/components/discography/ArtistHero'

import { useDiscographyRouting } from './hooks/useDiscographyRouting'
import { useDiscographyFilterSort } from './hooks/useDiscographyFilterSort'
import { useDiscographyPlayback } from './hooks/useDiscographyPlayback'
import { useDiscographyKeyboardShortcuts } from './hooks/useDiscographyKeyboardShortcuts'
import SingleProjectView from './views/SingleProjectView'
import AllProjectsGridView from './views/AllProjectsGridView'
import DiscographyHeaderSection from './views/DiscographyHeaderSection'

/**
 * MainDiscographyApp
 * Master SPA coordinator for the public discography interface.
 */
export default function MainDiscographyApp({
  data,
  health,
  initialSlug = [],
  initialThemeMode = null,
}) {
  const [mounted, setMounted] = useState(false)

  // 1. Theme State
  const systemPrefersDark = useMediaQuery('(prefers-color-scheme: dark)')
  const [darkMode, setDarkMode] = useState(() => {
    if (initialThemeMode === 'dark') return true
    if (initialThemeMode === 'light') return false
    return true
  })
  const logoAnalysis = useLogoAnalysis('/api/logo?w=96&fmt=webp')

  useEffect(() => {
    const savedTheme = getCookie('theme_mode') || localStorage.getItem('themeMode')
    if (savedTheme === 'dark') {
      setDarkMode(true)
    } else if (savedTheme === 'light') {
      setDarkMode(false)
    } else if (typeof systemPrefersDark === 'boolean') {
      setDarkMode(systemPrefersDark)
    }
  }, [systemPrefersDark])

  const handleToggleTheme = useCallback(() => {
    setDarkMode((prev) => {
      const nextMode = !prev
      const nextThemeStr = nextMode ? 'dark' : 'light'
      try {
        setCookie('theme_mode', nextThemeStr)
        localStorage.setItem('themeMode', nextThemeStr)
      } catch {}
      return nextMode
    })
  }, [])

  // 2. Private Gated Access State
  const [isPrivateAccessAuthenticated, setIsPrivateAccessAuthenticated] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        return (
          getCookie('private_access_auth') === 'true' ||
          localStorage.getItem('authenticated_private_access') === 'true'
        )
      } catch {}
    }
    return false
  })
  const [privateAccessModalOpen, setPrivateAccessModalOpen] = useState(false)

  useEffect(() => {
    fetch('/api/auth/private-access')
      .then((res) => res.json())
      .then((resData) => {
        if (resData && typeof resData.authenticated === 'boolean') {
          setIsPrivateAccessAuthenticated(resData.authenticated)
          try {
            if (resData.authenticated) {
              localStorage.setItem('authenticated_private_access', 'true')
            } else {
              localStorage.removeItem('authenticated_private_access')
            }
          } catch {}
        }
      })
      .catch(() => {})
  }, [])

  const artist = useMemo(() => data?.artist ?? {}, [data?.artist])
  const rawProjects = useMemo(() => data?.projects ?? [], [data])

  // Contextually filter and gate projects based on private access authorization
  const projects = useMemo(() => {
    return rawProjects
      .filter((proj) => {
        if (proj.visibility === 'private' && !isPrivateAccessAuthenticated) {
          return false
        }
        return true
      })
      .map((proj) => {
        const isUncleared = proj.copyright === 'uncleared'
        if (isUncleared && !isPrivateAccessAuthenticated) {
          const maskedTracks = (proj.tracks ?? []).map((t) => ({
            ...t,
            hasAudio: false,
            audioUrl: '',
            audio: '',
          }))
          return {
            ...proj,
            tracks: maskedTracks,
          }
        }
        return proj
      })
  }, [rawProjects, isPrivateAccessAuthenticated])

  // 3. Routing & History Hook
  const {
    currentView,
    selectedProject,
    highlightedTrackSlug,
    handleSelectProject,
    handleSelectTrackRow,
    handleSelectTrackTitle,
    handleNavigateHome,
    navigateToCurrentTrack,
  } = useDiscographyRouting({ projects, initialSlug })

  // 4. Filtering & Sorting Hook
  const {
    activeTypes,
    sortOrder,
    searchQuery,
    setSearchQuery,
    setSortOrder,
    handleToggleType,
    handleResetTypes,
    filteredProjects,
    displayedDiscographyTracks,
  } = useDiscographyFilterSort({ projects })

  // 5. Toast Notifications
  const [toastMessage, setToastMessage] = useState('')
  const [toastOpen, setToastOpen] = useState(false)
  const showToast = useCallback((msg) => {
    setToastMessage(msg)
    setToastOpen(true)
  }, [])

  // 6. Playback Hook
  const {
    playingTrack,
    setPlayingTrack,
    isPlaying,
    setIsPlaying,
    manualQueue,
    autoplayTracks,
    isShuffle,
    repeatMode,
    restartCount,
    handlePlayTrack,
    handleTogglePlayPause,
    handleToggleShuffle,
    handleCycleRepeatMode,
    handleSkipNext,
    handleSkipPrev,
    handleQueueDragDrop,
    handleRemoveFromManualQueue,
    handleRemoveFromAutoplay,
    handleAddToQueue,
    handlePlayQueuedTrack,
    handleClosePlayer,
  } = useDiscographyPlayback({
    projects,
    artist,
    displayedDiscographyTracks,
    selectedProject,
    showToast,
  })

  // 7. Global Keyboard Shortcuts
  useDiscographyKeyboardShortcuts({
    hasPlayingTrack: Boolean(playingTrack),
    onTogglePlay: handleTogglePlayPause,
  })

  // 8. Platforms Preference & Modal
  const [selectedPlatform, setSelectedPlatform] = useState('youtube')
  const [platformModalOpen, setPlatformModalOpen] = useState(false)
  const [platformOnboardingCompleted, setPlatformOnboardingCompleted] = useState(false)

  const availablePlatformIds = useMemo(() => {
    const availableSet = new Set()
    for (const proj of projects || []) {
      if (proj?.links && typeof proj.links === 'object') {
        for (const [key, url] of Object.entries(proj.links)) {
          if (url && typeof url === 'string' && url.trim() !== '') {
            availableSet.add(key.toLowerCase())
          }
        }
      }
      for (const track of proj?.tracks || []) {
        if (track?.links && typeof track.links === 'object') {
          for (const [key, url] of Object.entries(track.links)) {
            if (url && typeof url === 'string' && url.trim() !== '') {
              availableSet.add(key.toLowerCase())
            }
          }
        }
      }
    }
    return STREAMING_PLATFORMS.map((p) => p.id).filter((id) => availableSet.has(id))
  }, [projects])

  const availablePlatforms = useMemo(() => {
    return STREAMING_PLATFORMS.filter((p) => availablePlatformIds.includes(p.id))
  }, [availablePlatformIds])

  useEffect(() => {
    try {
      const savedPlatform = (
        getCookie('preferred_music_platform') ||
        localStorage.getItem('preferred_music_platform') ||
        ''
      ).toLowerCase()
      if (availablePlatformIds.length > 0) {
        if (savedPlatform && availablePlatformIds.includes(savedPlatform)) {
          setSelectedPlatform(savedPlatform)
        } else {
          const fallback = availablePlatformIds[0]
          setSelectedPlatform(fallback)
          setCookie('preferred_music_platform', fallback)
          localStorage.setItem('preferred_music_platform', fallback)
        }
      } else {
        setSelectedPlatform('')
      }
    } catch {}
  }, [availablePlatformIds])

  const handleSelectPlatform = (platformId) => {
    setSelectedPlatform(platformId)
    try {
      setCookie('preferred_music_platform', platformId)
      localStorage.setItem('preferred_music_platform', platformId)
    } catch {}
  }

  // 9. Audio Quality & Stutter
  const [audioQuality, setAudioQuality] = useState(() => getSavedAudioQuality() || '320k')
  const [qualityModalOpen, setQualityModalOpen] = useState(false)
  const [isPlaybackStuttering, setIsPlaybackStuttering] = useState(false)

  useEffect(() => {
    const saved = getSavedAudioQuality()
    if (!saved) {
      detectInitialAudioQuality().then((tier) => setAudioQuality(tier))
    }
  }, [])

  const handleSelectQuality = useCallback(
    (tier) => {
      setAudioQuality(tier)
      saveAudioQuality(tier)
      const tierLabel = QUALITY_TIER_CONFIG[tier]?.label || tier
      showToast(`Audio quality set to ${tierLabel}`)
    },
    [showToast],
  )

  // 10. Preload Essential Visual Assets & Idle Preloading
  useEffect(() => {
    let isCurrent = true
    const essentialImages = ['/api/logo?w=320&fmt=webp', '/api/logo?w=96&fmt=webp']
    const activeLinks = getSortedActiveLinks(artist)
    for (const link of activeLinks) {
      if (link?.icon && !essentialImages.includes(link.icon)) {
        essentialImages.push(link.icon)
      }
    }
    for (const pId of availablePlatformIds || []) {
      const iconPath = `/platforms/${pId}.webp`
      if (!essentialImages.includes(iconPath)) {
        essentialImages.push(iconPath)
      }
    }

    const loadPromises = essentialImages.map((src) => {
      return new Promise((resolve) => {
        const img = new Image()
        img.src = src
        if (img.decode) {
          img.decode().then(resolve).catch(resolve)
        } else {
          img.onload = resolve
          img.onerror = resolve
        }
      })
    })

    const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 1000))
    Promise.race([Promise.allSettled(loadPromises), timeoutPromise]).then(() => {
      if (isCurrent) setMounted(true)
    })

    return () => {
      isCurrent = false
    }
  }, [artist, availablePlatformIds])

  // 11. Theme Object
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: darkMode ? 'dark' : 'light',
          primary: { main: '#90caf9' },
          secondary: { main: '#f48fb1' },
          background: {
            default: darkMode ? '#0a0a0f' : '#f6f7fa',
            paper: darkMode ? '#13131c' : '#ffffff',
          },
        },
        typography: {
          fontFamily: 'Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        },
      }),
    [darkMode],
  )

  // 12. Dynamic Title & Ambient Image
  useEffect(() => {
    if (!mounted) return
    const artistName = artist?.name?.trim() || 'Artist'
    if (playingTrack?.name) {
      const projName =
        playingTrack.project ||
        projects?.find((p) =>
          (p.tracks || []).some(
            (t) => (t.name || '').toLowerCase() === (playingTrack.name || '').toLowerCase(),
          ),
        )?.name ||
        ''
      document.title = projName
        ? `${artistName} | ${playingTrack.name} (${projName})`
        : `${artistName} | ${playingTrack.name}`
    } else if (currentView === 'SINGLE_PROJECT' && selectedProject?.name) {
      document.title = `${artistName} | ${selectedProject.name}`
    } else {
      document.title = `${artistName} | Discography`
    }
  }, [
    mounted,
    artist?.name,
    playingTrack?.name,
    playingTrack?.project,
    currentView,
    selectedProject?.name,
    projects,
  ])

  const ambientImage = useMemo(() => {
    if (playingTrack) {
      return playingTrack.cover || playingTrack.projectCover || null
    }
    if (currentView === 'SINGLE_PROJECT' && selectedProject) {
      return selectedProject.cover || selectedProject.image || null
    }
    const newestProject = filteredProjects[0] || projects[0]
    return newestProject?.cover || newestProject?.image || null
  }, [playingTrack, currentView, selectedProject, filteredProjects, projects])

  // Scroll aware Jump to Top & Dynamic Masking
  const mainScrollRef = useRef(null)
  const projectsContainerRef = useRef(null)
  const [showScrollTop, setShowScrollTop] = useState(false)

  const scrollToTop = useCallback(() => {
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const applyMask = useCallback(() => {
    const el = projectsContainerRef.current
    const scrollEl = mainScrollRef.current
    if (!el || !scrollEl) return

    const rect = el.getBoundingClientRect()
    const scrollRect = scrollEl.getBoundingClientRect()
    const containerTop = scrollRect.top
    const containerHeight = scrollRect.height
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 600

    const NAV_H = currentView === 'SINGLE_PROJECT' ? 0 : isMobile ? 76 : 88
    const PLAYER_H = isMobile ? 80 : 120
    const FADE = isMobile ? 24 : 50

    const navBottomY = containerTop + NAV_H
    const isNavSticky = rect.top <= navBottomY + 4
    const showTop = rect.top < navBottomY && rect.bottom > navBottomY

    setShowScrollTop((prev) => (prev !== isNavSticky ? isNavSticky : prev))

    const playerTopY = containerTop + containerHeight - PLAYER_H
    const showBottom = Boolean(playingTrack) && rect.bottom > playerTopY && rect.top < playerTopY

    let mask = 'none'
    if (showTop || showBottom) {
      const topFadeStart = showTop ? Math.max(0, navBottomY - rect.top) : 0
      const topFadeEnd = showTop ? topFadeStart + FADE : 0
      const bottomFadeEnd = showBottom
        ? Math.min(rect.height, Math.max(topFadeEnd, playerTopY - rect.top))
        : rect.height
      const bottomFadeStart = showBottom ? Math.max(topFadeEnd, bottomFadeEnd - FADE) : rect.height

      if (showTop && showBottom && bottomFadeStart > topFadeEnd) {
        mask = `linear-gradient(to bottom, transparent 0px, transparent ${topFadeStart}px, black ${topFadeEnd}px, black ${bottomFadeStart}px, transparent ${bottomFadeEnd}px, transparent 100%)`
      } else if (showTop) {
        mask = `linear-gradient(to bottom, transparent 0px, transparent ${topFadeStart}px, black ${topFadeEnd}px, black 100%)`
      } else if (showBottom) {
        mask = `linear-gradient(to bottom, black 0px, black ${bottomFadeStart}px, transparent ${bottomFadeEnd}px, transparent 100%)`
      }
    }

    el.style.maskImage = mask
    el.style.webkitMaskImage = mask
  }, [currentView, playingTrack])

  useEffect(() => {
    if (!mounted) return
    const scrollEl = mainScrollRef.current
    const projectsEl = projectsContainerRef.current

    const handleScroll = () => applyMask()
    if (scrollEl) scrollEl.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll, { passive: true })

    let resizeObserver = null
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => handleScroll())
      if (projectsEl) resizeObserver.observe(projectsEl)
      if (scrollEl) resizeObserver.observe(scrollEl)
    }

    handleScroll()
    return () => {
      if (scrollEl) scrollEl.removeEventListener('scroll', handleScroll)
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
      if (resizeObserver) resizeObserver.disconnect()
    }
  }, [mounted, applyMask, filteredProjects, selectedProject, currentView, playingTrack])

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
          component='img'
          src='/api/logo?w=320&fmt=webp'
          alt='Loading'
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
          },
          '[draggable="true"], [draggable="true"] *': {
            WebkitUserDrag: 'element !important',
          },
          'img, picture, video, canvas': {
            userSelect: 'none !important',
            WebkitUserDrag: 'none !important',
            pointerEvents: 'none',
          },
          'input, textarea, [contenteditable="true"]': {
            userSelect: 'text !important',
            pointerEvents: 'auto',
          },
          ':root, html, body, *': {
            scrollbarWidth: 'thin',
            scrollbarColor: darkMode
              ? 'rgba(255, 255, 255, 0.45) transparent'
              : 'rgba(0, 0, 0, 0.45) transparent',
          },
          '*::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
            background: 'transparent !important',
          },
          '*::-webkit-scrollbar-thumb': {
            background: darkMode
              ? 'rgba(255, 255, 255, 0.45) !important'
              : 'rgba(0, 0, 0, 0.45) !important',
            borderRadius: '99px !important',
          },
        }}
      />

      {/* Root Shell */}
      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          overflow: 'hidden',
          bgcolor: 'background.default',
        }}
      >
        {/* Full-viewport ambient background */}
        <AmbientBackground ambientImage={ambientImage} darkMode={darkMode} />

        {/* In-flow scroll container */}
        <Box
          ref={mainScrollRef}
          sx={{
            position: 'relative',
            height: '100%',
            width: '100%',
            overflowY: 'auto',
            overflowX: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1,
            pb: playingTrack ? { xs: 14, sm: 16 } : { xs: 5, sm: 6 },
          }}
        >
          {/* Header & Hero Section */}
          <DiscographyHeaderSection
            artist={artist}
            ambientImage={ambientImage}
            hasAdminAccess={data?.adminAccess !== false}
            isSingleView={currentView === 'SINGLE_PROJECT'}
          />

          {/* Floating Sticky Nav Bar */}
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
            hasAvailablePlatforms={availablePlatformIds.length > 0}
            audioQuality={audioQuality}
            isStuttering={isPlaybackStuttering}
            onOpenQualityModal={() => setQualityModalOpen(true)}
            isPrivateAuthenticated={isPrivateAccessAuthenticated}
            onOpenPrivateAccessModal={() => setPrivateAccessModalOpen(true)}
            showScrollTop={showScrollTop}
            onScrollToTop={scrollToTop}
            sx={{
              display: currentView === 'SINGLE_PROJECT' ? 'none' : 'block',
            }}
          />

          {/* Main Content Projects Container */}
          <Container
            ref={projectsContainerRef}
            maxWidth='md'
            sx={{
              px: { xs: 2, sm: 3 },
              mt: currentView === 'SINGLE_PROJECT' ? 0 : { xs: 2, sm: 3 },
              flexGrow: 1,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* 1. Single Project View */}
            {currentView === 'SINGLE_PROJECT' && selectedProject && (
              <SingleProjectView
                selectedProject={selectedProject}
                artist={artist}
                darkMode={darkMode}
                onToggleTheme={handleToggleTheme}
                selectedPlatform={selectedPlatform}
                onOpenPlatformModal={() => setPlatformModalOpen(true)}
                ambientImage={ambientImage}
                hasAvailablePlatforms={availablePlatformIds.length > 0}
                audioQuality={audioQuality}
                isStuttering={isPlaybackStuttering}
                onOpenQualityModal={() => setQualityModalOpen(true)}
                isPrivateAuthenticated={isPrivateAccessAuthenticated}
                onOpenPrivateAccessModal={() => setPrivateAccessModalOpen(true)}
                onNavigateHome={handleNavigateHome}
                onPlayTrack={handlePlayTrack}
                onAddToQueue={handleAddToQueue}
                onShowToast={showToast}
                playingTrack={playingTrack}
                isPlaying={isPlaying}
                highlightedTrackSlug={highlightedTrackSlug}
                onSelectTrackRow={handleSelectTrackRow}
                onSelectTrackTitle={handleSelectTrackTitle}
              />
            )}

            {/* 2. All Projects Grid View */}
            {currentView === 'ALL_PROJECTS' && (
              <AllProjectsGridView
                filteredProjects={filteredProjects}
                artist={artist}
                onSelectProject={handleSelectProject}
                onPlayTrack={handlePlayTrack}
                onAddToQueue={handleAddToQueue}
                onShowToast={showToast}
                playingTrack={playingTrack}
                isPlaying={isPlaying}
                highlightedTrackSlug={highlightedTrackSlug}
                onSelectTrackTitle={handleSelectTrackTitle}
                selectedPlatform={selectedPlatform}
                isPrivateAuthenticated={isPrivateAccessAuthenticated}
              />
            )}
          </Container>
        </Box>

        {/* Modals & Banners */}
        <PrivateAccessModal
          open={privateAccessModalOpen}
          onClose={() => setPrivateAccessModalOpen(false)}
          isAuthenticated={isPrivateAccessAuthenticated}
          onAuthenticate={() => {
            setIsPrivateAccessAuthenticated(true)
            try {
              localStorage.setItem('authenticated_private_access', 'true')
            } catch {}
          }}
          onLock={() => {
            setIsPrivateAccessAuthenticated(false)
            try {
              localStorage.removeItem('authenticated_private_access')
            } catch {}
            if (playingTrack) {
              setPlayingTrack(null)
              setIsPlaying(false)
            }
          }}
          onShowToast={showToast}
        />

        <PlatformSelectorModal
          open={platformModalOpen}
          onClose={() => setPlatformModalOpen(false)}
          selectedPlatform={selectedPlatform}
          onSelectPlatform={handleSelectPlatform}
          availablePlatforms={availablePlatforms}
        />

        <AudioQualityModal
          open={qualityModalOpen}
          onClose={() => setQualityModalOpen(false)}
          activeQuality={audioQuality}
          isStuttering={isPlaybackStuttering}
          onSelectQuality={handleSelectQuality}
        />

        <OnboardingPlatformBanner
          onOpenPlatformModal={() => setPlatformModalOpen(true)}
          isPlayerOpen={Boolean(playingTrack)}
          onDismiss={() => setPlatformOnboardingCompleted(true)}
        />

        <OnboardingThemeBanner
          darkMode={darkMode}
          onToggleTheme={handleToggleTheme}
          isPlayerOpen={Boolean(playingTrack)}
          readyToShow={platformOnboardingCompleted}
        />

        <PlaybackQualityBanner
          isStuttering={isPlaybackStuttering}
          onOpenQualityModal={() => setQualityModalOpen(true)}
          isPlayerOpen={Boolean(playingTrack)}
        />

        {/* Floating Audio Player Bar */}
        <AudioPlayerBar
          playingTrack={playingTrack}
          isPlaying={isPlaying}
          restartCount={restartCount}
          audioQuality={audioQuality}
          manualQueue={manualQueue}
          autoplayTracks={autoplayTracks}
          isShuffle={isShuffle}
          repeatMode={repeatMode}
          onTogglePlay={handleTogglePlayPause}
          onClosePlayer={handleClosePlayer}
          onSkipNext={handleSkipNext}
          onSkipPrev={handleSkipPrev}
          onToggleShuffle={handleToggleShuffle}
          onCycleRepeatMode={handleCycleRepeatMode}
          onQueueDragDrop={handleQueueDragDrop}
          onRemoveFromManualQueue={handleRemoveFromManualQueue}
          onRemoveFromAutoplay={handleRemoveFromAutoplay}
          onPlayQueuedTrack={handlePlayQueuedTrack}
          onShowToast={showToast}
          onNavigateToCurrentTrack={() => navigateToCurrentTrack(playingTrack)}
          onOpenQualityModal={() => setQualityModalOpen(true)}
          onStutterChange={setIsPlaybackStuttering}
        />

        {/* Floating Toast Notification */}
        <Snackbar
          open={toastOpen}
          autoHideDuration={2500}
          onClose={() => setToastOpen(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          sx={{ mb: playingTrack ? { xs: 9, sm: 11 } : 2 }}
        >
          <Alert
            onClose={() => setToastOpen(false)}
            severity='info'
            variant='filled'
            sx={{
              width: '100%',
              bgcolor: (theme) =>
                theme.palette.mode === 'dark'
                  ? 'rgba(30, 30, 42, 0.95)'
                  : 'rgba(240, 240, 248, 0.95)',
              color: 'text.primary',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
              borderRadius: 3,
            }}
          >
            {toastMessage}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  )
}
