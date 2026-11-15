'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import {
  Box,
  Container,
  ThemeProvider,
  createTheme,
  GlobalStyles,
  useMediaQuery,
  Snackbar,
  Alert,
} from '@mui/material'
import { slugify, findProjectBySlug } from '@/lib/data/slugs'
import { getCookie, setCookie } from '@/lib/data/cookies'
import { usePerformanceMode } from '@/lib/performance/PerformanceModeContext'
import {
  getSavedAudioQuality,
  saveAudioQuality,
  detectInitialAudioQuality,
  QUALITY_TIER_CONFIG,
} from '@/lib/network/networkProbe'
import { useAnalyticsTracker } from '@/lib/hooks/useAnalyticsTracker'
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
  const { isLiteMode } = usePerformanceMode()

  // 1. Theme State
  const systemPrefersDark = useMediaQuery('(prefers-color-scheme: dark)')
  const [darkMode, setDarkMode] = useState(() => {
    if (initialThemeMode === 'dark') return true
    if (initialThemeMode === 'light') return false
    return true
  })

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
    pendingScrollProjectSlug,
    clearPendingScrollProjectSlug,
    handleSelectProject,
    handleSelectTrackRow,
    handleSelectTrackTitle,
    handleNavigateHome,
    navigateToCurrentTrack,
  } = useDiscographyRouting({ projects, initialSlug })

  // 3.1 Public Page Views Analytics Tracking
  const currentPath = useMemo(() => {
    if (selectedProject) {
      const projSlug = slugify(selectedProject.name) || ''
      if (highlightedTrackSlug) {
        return `/${projSlug}/${highlightedTrackSlug}`
      }
      return `/${projSlug}`
    }
    return '/'
  }, [selectedProject, highlightedTrackSlug])

  useAnalyticsTracker(currentPath)

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

  const handleNavigateHomeWithScroll = useCallback(
    (targetProject = null) => {
      if (activeTypes && activeTypes.length > 0) {
        handleResetTypes()
      }
      if (searchQuery) {
        setSearchQuery('')
      }
      handleNavigateHome(targetProject)
    },
    [activeTypes, handleResetTypes, searchQuery, setSearchQuery, handleNavigateHome],
  )

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

  // 7.1 Active Ambient Image
  const ambientImage = useMemo(() => {
    if (playingTrack) {
      return playingTrack.cover || playingTrack.projectCover || null
    }
    if (currentView === 'SINGLE_PROJECT' && selectedProject) {
      return selectedProject.cover || selectedProject.image || null
    }
    if (data?.backgroundInfo?.exists && data?.backgroundInfo?.url) {
      return data.backgroundInfo.url
    }
    const newestProject = filteredProjects[0] || projects[0]
    return newestProject?.cover || newestProject?.image || null
  }, [
    playingTrack,
    currentView,
    selectedProject,
    data?.backgroundInfo?.exists,
    data?.backgroundInfo?.url,
    filteredProjects,
    projects,
  ])

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

  // 10. Theme Object
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

  // 11. Dynamic Document Title
  useEffect(() => {
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
    artist?.name,
    playingTrack?.name,
    playingTrack?.project,
    currentView,
    selectedProject?.name,
    projects,
  ])

  // Scroll aware Jump to Top & Dynamic Masking
  const mainScrollRef = useRef(null)
  const projectsContainerRef = useRef(null)
  const lastMaskKeyRef = useRef('')
  const applyCachedMaskRef = useRef(null)
  const hasPlayingTrack = Boolean(playingTrack)
  const hasPlayingTrackRef = useRef(hasPlayingTrack)
  hasPlayingTrackRef.current = hasPlayingTrack
  const [showScrollTop, setShowScrollTop] = useState(false)

  const scrollToTop = useCallback(() => {
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  useEffect(() => {
    const el = projectsContainerRef.current
    const scrollEl = mainScrollRef.current
    if (!el || !scrollEl) return

    if (isLiteMode) {
      el.style.maskImage = ''
      el.style.webkitMaskImage = ''
      lastMaskKeyRef.current = ''
    }

    let cachedElOffsetTop = 0
    let cachedElHeight = 0
    let cachedContainerHeight = 0
    let cachedIsMobile = false
    let rafId = null

    const measureLayout = () => {
      const rect = el.getBoundingClientRect()
      const scrollRect = scrollEl.getBoundingClientRect()
      cachedElOffsetTop = rect.top - scrollRect.top + scrollEl.scrollTop
      cachedElHeight = rect.height
      cachedContainerHeight = scrollRect.height
      cachedIsMobile = typeof window !== 'undefined' && window.innerWidth < 600
    }

    const applyCachedMask = () => {
      rafId = null
      const scrollTop = scrollEl.scrollTop
      const relTop = cachedElOffsetTop - scrollTop
      const relBottom = relTop + cachedElHeight

      const NAV_H = currentView === 'SINGLE_PROJECT' ? 0 : cachedIsMobile ? 76 : 88
      const PLAYER_H = cachedIsMobile ? 80 : 120
      const FADE = cachedIsMobile ? 24 : 50

      const isNavSticky = relTop <= NAV_H + 4
      setShowScrollTop((prev) => (prev !== isNavSticky ? isNavSticky : prev))

      if (isLiteMode) return

      const showTop = relTop < NAV_H && relBottom > NAV_H
      const playerTopY = cachedContainerHeight - PLAYER_H
      const showBottom =
        hasPlayingTrackRef.current && relBottom > playerTopY && relTop < playerTopY

      let topFadeStart = 0
      let topFadeEnd = 0
      let bottomFadeStart = Math.round(cachedElHeight)
      let bottomFadeEnd = Math.round(cachedElHeight)

      if (showTop) {
        topFadeStart = Math.max(0, Math.round(NAV_H - relTop))
        topFadeEnd = topFadeStart + FADE
      }

      if (showBottom) {
        bottomFadeEnd = Math.round(
          Math.min(cachedElHeight, Math.max(topFadeEnd, playerTopY - relTop)),
        )
        bottomFadeStart = Math.max(topFadeEnd, bottomFadeEnd - FADE)
      }

      const maskKey = `${showTop ? 1 : 0}:${showBottom ? 1 : 0}:${topFadeStart}:${topFadeEnd}:${bottomFadeStart}:${bottomFadeEnd}`
      if (maskKey === lastMaskKeyRef.current) return
      lastMaskKeyRef.current = maskKey

      let mask = 'none'
      if (showTop && showBottom && bottomFadeStart > topFadeEnd) {
        mask = `linear-gradient(to bottom, transparent 0px, transparent ${topFadeStart}px, black ${topFadeEnd}px, black ${bottomFadeStart}px, transparent ${bottomFadeEnd}px, transparent 100%)`
      } else if (showTop) {
        mask = `linear-gradient(to bottom, transparent 0px, transparent ${topFadeStart}px, black ${topFadeEnd}px, black 100%)`
      } else if (showBottom) {
        mask = `linear-gradient(to bottom, black 0px, black ${bottomFadeStart}px, transparent ${bottomFadeEnd}px, transparent 100%)`
      }

      el.style.maskImage = mask
      el.style.webkitMaskImage = mask
    }

    applyCachedMaskRef.current = applyCachedMask

    const scheduleMask = () => {
      if (rafId !== null) return
      rafId = requestAnimationFrame(applyCachedMask)
    }

    const handleLayoutChange = () => {
      measureLayout()
      scheduleMask()
    }

    measureLayout()
    applyCachedMask()

    scrollEl.addEventListener('scroll', scheduleMask, { passive: true })
    window.addEventListener('resize', handleLayoutChange, { passive: true })

    let resizeObserver = null
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(handleLayoutChange)
      resizeObserver.observe(el)
      resizeObserver.observe(scrollEl)
      for (const child of scrollEl.children) {
        resizeObserver.observe(child)
      }
    }

    return () => {
      applyCachedMaskRef.current = null
      if (rafId !== null) cancelAnimationFrame(rafId)
      scrollEl.removeEventListener('scroll', scheduleMask)
      window.removeEventListener('resize', handleLayoutChange)
      if (resizeObserver) resizeObserver.disconnect()
    }
  }, [isLiteMode, currentView])

  useEffect(() => {
    if (!isLiteMode) {
      applyCachedMaskRef.current?.()
    }
  }, [hasPlayingTrack, isLiteMode])

  // Auto-scroll to target project when navigating back to all projects from single project view
  useEffect(() => {
    if (!pendingScrollProjectSlug || currentView !== 'ALL_PROJECTS') return

    let isCancelled = false
    const targetSlug = pendingScrollProjectSlug

    const performScroll = () => {
      if (isCancelled) return
      const targetEl = document.getElementById(`project-${targetSlug}`)
      if (targetEl) {
        if (typeof targetEl.scrollIntoView === 'function') {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
        } else if (mainScrollRef.current) {
          const container = mainScrollRef.current
          const targetRect = targetEl.getBoundingClientRect()
          const containerRect = container.getBoundingClientRect()
          const isMobile = typeof window !== 'undefined' && window.innerWidth < 600
          const navHeight = isMobile ? 80 : 100
          const targetScrollTop =
            container.scrollTop + (targetRect.top - containerRect.top) - navHeight
          container.scrollTo({
            top: Math.max(0, targetScrollTop),
            behavior: 'smooth',
          })
        }
        clearPendingScrollProjectSlug()
      }
    }

    const frameId = requestAnimationFrame(() => {
      requestAnimationFrame(performScroll)
    })

    const timeoutId = setTimeout(performScroll, 120)

    return () => {
      isCancelled = true
      cancelAnimationFrame(frameId)
      clearTimeout(timeoutId)
    }
  }, [pendingScrollProjectSlug, currentView, clearPendingScrollProjectSlug])

  const handleDismissPlatformOnboarding = useCallback(() => {
    setPlatformOnboardingCompleted(true)
  }, [])

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles
        styles={{
          ':root': {
            '--scrollbar-thumb': darkMode
              ? 'rgba(255, 255, 255, 0.45)'
              : 'rgba(0, 0, 0, 0.45)',
          },
          body: {
            backgroundColor: theme.palette.background.default,
            color: theme.palette.text.primary,
            transition: 'background-color 0.3s ease, color 0.3s ease',
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
              hasAvailablePlatforms={availablePlatformIds.length > 0}
              audioQuality={audioQuality}
              isStuttering={isPlaybackStuttering}
              onOpenQualityModal={() => setQualityModalOpen(true)}
              isPrivateAuthenticated={isPrivateAccessAuthenticated}
              onOpenPrivateAccessModal={() => setPrivateAccessModalOpen(true)}
              showScrollTop={showScrollTop}
              onScrollToTop={scrollToTop}
            />
          )}

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
                onNavigateHome={handleNavigateHomeWithScroll}
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
          onDismiss={handleDismissPlatformOnboarding}
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
