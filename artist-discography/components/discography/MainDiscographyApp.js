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
  Button,
  Paper,
  IconButton,
  Tooltip,
  Badge,
} from '@mui/material'
import LockOpenIcon from '@mui/icons-material/LockOpen'
import BugReportIcon from '@mui/icons-material/BugReport'
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded'
import useMediaQuery from '@mui/material/useMediaQuery'
import ArtistHero, { getSortedActiveLinks } from '../artist/ArtistHero'
import CompactArtistHeader from '../layout/CompactArtistHeader'
import FloatingNavBar from '../layout/FloatingNavBar'
import PlatformSelectorModal, { STREAMING_PLATFORMS } from './PlatformSelectorModal'
import ProjectCard from './ProjectCard'
import AudioPlayerBar from '../player/AudioPlayerBar'
import AudioQualityModal from '../player/AudioQualityModal'
import DevHealthDrawer from '../dev/DevHealthDrawer'
import SubduedText from '../ui/SubduedText'
import AmbientBackground from '../layout/AmbientBackground'
import { slugify, findProjectBySlug, findTrackBySlug } from '../../lib/slugs'
import { useLogoAnalysis, getLogoFilter } from '../../lib/hooks/useLogoAnalysis'
import { getCookie, setCookie } from '../../lib/cookies'
import { mediaPreloader } from '../../lib/mediaPreloader'
import { detectInitialAudioQuality, saveAudioQuality, getSavedAudioQuality, QUALITY_TIER_CONFIG } from '../../lib/networkProbe'

function shuffleArray(array) {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function sortTracksByDiscographyOrder(tracks, discographyList) {
  return [...tracks].sort((a, b) => {
    const nameA = (a.track?.name || a.name || '').toLowerCase()
    const nameB = (b.track?.name || b.name || '').toLowerCase()
    const indexA = discographyList.findIndex(
      item => (item.track.name || '').toLowerCase() === nameA
    )
    const indexB = discographyList.findIndex(
      item => (item.track.name || '').toLowerCase() === nameB
    )
    if (indexA === -1) return 1
    if (indexB === -1) return -1
    return indexA - indexB
  })
}

export default function MainDiscographyApp({ data, health, initialSlug = [], initialThemeMode = null }) {
  // Mounting & Hydration state
  const [mounted, setMounted] = useState(false)

  // System Theme Preference Detection
  const systemPrefersDark = useMediaQuery('(prefers-color-scheme: dark)')
  const [darkMode, setDarkMode] = useState(() => {
    if (initialThemeMode === 'dark') return true
    if (initialThemeMode === 'light') return false
    return true
  })
  const logoAnalysis = useLogoAnalysis('/api/logo?w=96&fmt=webp')

  // On mount: read saved theme cookie/localStorage; if none, default to system preference
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
    setDarkMode(prev => {
      const nextMode = !prev
      const nextThemeStr = nextMode ? 'dark' : 'light'
      try {
        setCookie('theme_mode', nextThemeStr)
        localStorage.setItem('themeMode', nextThemeStr)
      } catch { }
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

  // Preferred Platform State (Default to 'youtube')
  const [selectedPlatform, setSelectedPlatform] = useState('youtube')
  const [platformModalOpen, setPlatformModalOpen] = useState(false)

  // Toast / Notification State
  const [toastMessage, setToastMessage] = useState('')
  const [toastOpen, setToastOpen] = useState(false)

  const showToast = useCallback((msg) => {
    setToastMessage(msg)
    setToastOpen(true)
  }, [])

  // Audio Quality State & Modal
  const [audioQuality, setAudioQuality] = useState(() => getSavedAudioQuality() || '320k')
  const [qualityModalOpen, setQualityModalOpen] = useState(false)
  const [isPlaybackStuttering, setIsPlaybackStuttering] = useState(false)

  // On mount: Probe network performance on initial app load if no saved preference
  useEffect(() => {
    const saved = getSavedAudioQuality()
    if (!saved) {
      detectInitialAudioQuality().then((tier) => {
        setAudioQuality(tier)
      })
    }
  }, [])

  const handleSelectQuality = useCallback((tier) => {
    setAudioQuality(tier)
    saveAudioQuality(tier)
    const tierLabel = QUALITY_TIER_CONFIG[tier]?.label || tier
    showToast(`Audio quality set to ${tierLabel}`)
  }, [showToast])

  // Audio Player & Queue State
  const [playingTrack, setPlayingTrack] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [manualQueue, setManualQueue] = useState([])
  const [devDrawerOpen, setDevDrawerOpen] = useState(false)
  const [restartCount, setRestartCount] = useState(0)

  // Ref for the projects container — used by the scroll-aware mask effect below
  const projectsContainerRef = useRef(null)
  // Ref for the main scroll container
  const mainScrollRef = useRef(null)
  const [showScrollTop, setShowScrollTop] = useState(false)

  const scrollToTop = useCallback(() => {
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

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

  // Available platforms calculated from links across all posted projects & tracks
  const availablePlatformIds = useMemo(() => {
    const availableSet = new Set()
    for (const proj of (projects || [])) {
      if (proj?.links && typeof proj.links === 'object') {
        for (const [key, url] of Object.entries(proj.links)) {
          if (url && typeof url === 'string' && url.trim() !== '') {
            availableSet.add(key.toLowerCase())
          }
        }
      }
      for (const track of (proj?.tracks || [])) {
        if (track?.links && typeof track.links === 'object') {
          for (const [key, url] of Object.entries(track.links)) {
            if (url && typeof url === 'string' && url.trim() !== '') {
              availableSet.add(key.toLowerCase())
            }
          }
        }
      }
    }
    return STREAMING_PLATFORMS
      .map(p => p.id)
      .filter(id => availableSet.has(id))
  }, [projects])

  const availablePlatforms = useMemo(() => {
    return STREAMING_PLATFORMS.filter(p => availablePlatformIds.includes(p.id))
  }, [availablePlatformIds])

  // Load preferred platform and theme from cookies on mount, fallback if saved platform is unavailable
  useEffect(() => {
    try {
      const savedPlatform = (getCookie('preferred_music_platform') || localStorage.getItem('preferred_music_platform') || '').toLowerCase()
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
    } catch { }
  }, [availablePlatformIds])

  // Preload top project cover artwork and initial audio chunk during idle browser time
  useEffect(() => {
    if (!projects || projects.length === 0) return
    const topProjects = projects.slice(0, 4)
    for (const proj of topProjects) {
      if (proj?.cover && typeof proj.cover === 'string' && proj.cover.startsWith('/api/media')) {
        mediaPreloader.preloadImage(`${proj.cover}${proj.cover.includes('?') ? '&' : '?'}w=400&q=80&fmt=webp`)
      }
    }
    const firstAudioTrack = projects.flatMap(p => p.tracks || []).find(t => t?.audioUrl)
    if (firstAudioTrack?.audioUrl) {
      mediaPreloader.preloadAudioChunk(firstAudioTrack.audioUrl)
    }
  }, [projects])

  const handleSelectPlatform = (platformId) => {
    setSelectedPlatform(platformId)
    try {
      setCookie('preferred_music_platform', platformId)
      localStorage.setItem('preferred_music_platform', platformId)
    } catch { }
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

  // Preload essential visual assets (logo & active platform/social icons) before revealing main page
  useEffect(() => {
    syncStateFromLocation()

    let isMounted = true

    const preloadImagePromise = (src) => {
      if (!src || typeof window === 'undefined') return Promise.resolve()
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
    }

    // Collect essential initial images
    const essentialImages = [
      '/api/logo?w=240&fmt=webp',
      '/api/logo?w=96&fmt=webp',
    ]

    // Add active platform & social icons
    const activeLinks = getSortedActiveLinks(artist)
    for (const link of activeLinks) {
      if (link?.icon && !essentialImages.includes(link.icon)) {
        essentialImages.push(link.icon)
      }
    }

    // Include icons for available project platforms
    for (const pId of (availablePlatformIds || [])) {
      const iconPath = `/platforms/${pId}.webp`
      if (!essentialImages.includes(iconPath)) {
        essentialImages.push(iconPath)
      }
    }

    const loadAllEssential = Promise.allSettled(essentialImages.map(preloadImagePromise))
    const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 1000)) // Max 1s timeout to ensure no hanging

    Promise.race([loadAllEssential, timeoutPromise]).then(() => {
      if (isMounted) {
        setMounted(true)
      }
    })

    const handlePopState = () => {
      syncStateFromLocation()
    }
    window.addEventListener('popstate', handlePopState)
    return () => {
      isMounted = false
      window.removeEventListener('popstate', handlePopState)
    }
  }, [syncStateFromLocation, artist, availablePlatformIds])

  // Sync document.title dynamically (highest priority: playing track)
  useEffect(() => {
    if (!mounted) return

    const rawArtistName = artist?.name?.trim()
    const artistName = rawArtistName || 'Artist'

    // Priority 1: Currently Playing Song (Highest Priority)
    if (playingTrack?.name) {
      const projName = playingTrack.project || projects?.find(p => (p.tracks || []).some(t => (t.name || '').toLowerCase() === (playingTrack.name || '').toLowerCase()))?.name || ''
      document.title = projName
        ? `${artistName} | ${playingTrack.name} (${projName})`
        : `${artistName} | ${playingTrack.name}`
      return
    }

    // Priority 2: Single Project / Track View
    if (currentView === 'SINGLE_PROJECT' && selectedProject) {
      if (highlightedTrackSlug) {
        const matchedTrack = (selectedProject.tracks || []).find(t => slugify(t.name || '') === highlightedTrackSlug)
        if (matchedTrack?.name) {
          const projName = selectedProject.name || matchedTrack.project || ''
          document.title = projName
            ? `${artistName} | ${matchedTrack.name} (${projName})`
            : `${artistName} | ${matchedTrack.name}`
          return
        }
      }
      if (selectedProject.name) {
        document.title = `${artistName} | ${selectedProject.name}`
        return
      }
    }

    // Priority 3: Default Home Base Title
    document.title = `${artistName} | Discography`
  }, [mounted, currentView, selectedProject, highlightedTrackSlug, artist, playingTrack, projects])

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
      scrollToTop()
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
      scrollToTop()
    }
  }

  const selectTrackOnProjectPage = (project, track) => {
    if (project && track) {
      const projSlug = slugify(project.name)
      const trkSlug = slugify(track.name)
      if (projSlug && trkSlug) {
        window.history.pushState({}, '', `/${projSlug}/${trkSlug}`)
      }
      setHighlightedTrackSlug(trkSlug)
    }
  }

  const highlightTrackOnMainPage = (track) => {
    if (track) {
      const trkSlug = slugify(track.name)
      setHighlightedTrackSlug(trkSlug)
    }
  }

  const navigateToAllProjects = useCallback(() => {
    const targetProjSlug = selectedProject ? slugify(selectedProject.name || '') : null

    window.history.pushState({}, '', '/')
    setCurrentView('ALL_PROJECTS')
    setSelectedProject(null)
    setHighlightedTrackSlug(null)

    if (targetProjSlug) {
      setTimeout(() => {
        const el = document.getElementById(`project-${targetProjSlug}`)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        } else {
          scrollToTop()
        }
      }, 60)
    } else {
      scrollToTop()
    }
  }, [selectedProject, scrollToTop])

  const handleNavigateToCurrentTrack = useCallback(() => {
    if (!playingTrack) return
    const parentProj = projects.find(p => (p.tracks || []).some(t => (t.name || '').toLowerCase() === (playingTrack.name || '').toLowerCase())) || projects.find(p => (p.name || '').toLowerCase() === (playingTrack.project || '').toLowerCase())
    if (parentProj) {
      const matchedTrack = (parentProj.tracks || []).find(t => (t.name || '').toLowerCase() === (playingTrack.name || '').toLowerCase()) || playingTrack
      navigateToTrack(parentProj, matchedTrack)
    }
  }, [playingTrack, projects, navigateToTrack])

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

  // Dynamically apply a CSS mask-image to the projects container that fades
  // project cards only where they actually overlap with the sticky nav or fixed player.
  // Uses direct DOM style mutation (not React state) to avoid re-renders on every scroll tick.
  const applyMask = useCallback(() => {
    const el = projectsContainerRef.current
    const scrollEl = mainScrollRef.current
    if (!el || !scrollEl) return

    const rect = el.getBoundingClientRect()
    const scrollRect = scrollEl.getBoundingClientRect()
    const containerTop = scrollRect.top
    const containerHeight = scrollRect.height

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 600

    // Approximate bar heights in px. Nav is only present on the main discography view.
    const NAV_H = currentView === 'SINGLE_PROJECT' ? 0 : (isMobile ? 76 : 88)
    // Player bar total height including container padding from bottom of viewport
    const PLAYER_H = isMobile ? 80 : 120
    const FADE = isMobile ? 24 : 50 // px: length of the fade gradient transition

    // 1. Top fade: Trigger once content scrolls past the sticky nav (or top of viewport)
    const navBottomY = containerTop + NAV_H
    const isNavSticky = rect.top <= navBottomY + 4
    const showTop = rect.top < navBottomY && rect.bottom > navBottomY

    // 2. Sync jump-to-top button in navbar with the navbar's sticky state
    setShowScrollTop((prev) => (prev !== isNavSticky ? isNavSticky : prev))

    // 3. Bottom fade: Only active when audio player is open and content overlaps player area
    const playerTopY = containerTop + containerHeight - PLAYER_H
    const showBottom = Boolean(playingTrack) && rect.bottom > playerTopY && rect.top < playerTopY

    let mask = 'none'

    if (showTop || showBottom) {
      // Convert viewport intersection points to container-relative px coordinates
      const topFadeStart = showTop ? Math.max(0, navBottomY - rect.top) : 0
      const topFadeEnd = showTop ? topFadeStart + FADE : 0

      const bottomFadeEnd = showBottom
        ? Math.min(rect.height, Math.max(topFadeEnd, playerTopY - rect.top))
        : rect.height
      const bottomFadeStart = showBottom
        ? Math.max(topFadeEnd, bottomFadeEnd - FADE)
        : rect.height

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

    const handleScroll = () => {
      applyMask()
    }

    if (scrollEl) {
      scrollEl.addEventListener('scroll', handleScroll, { passive: true })
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll, { passive: true })

    let resizeObserver = null
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        handleScroll()
      })
      if (projectsEl) resizeObserver.observe(projectsEl)
      if (scrollEl) resizeObserver.observe(scrollEl)
    }

    handleScroll()

    return () => {
      if (scrollEl) {
        scrollEl.removeEventListener('scroll', handleScroll)
      }
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
    }
  }, [mounted, applyMask, filteredProjects, selectedProject, currentView, playingTrack])

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
              projectType: proj.type || '',
              projectArtist: proj.artist || artist?.name || '',
              projectCover: track.cover || proj.cover || '',
              artist: track.artist || proj.artist || artist?.name || '',
            },
            project: proj,
          })
        }
      }
    }
    return list
  }, [currentView, selectedProject, filteredProjects, artist?.name])

  const [autoplayTracks, setAutoplayTracks] = useState([])
  const [isShuffle, setIsShuffle] = useState(false)
  const [repeatMode, setRepeatMode] = useState('off') // 'off' | 'all' | 'one'

  const handleToggleShuffle = useCallback(() => {
    setIsShuffle(prev => {
      const nextShuffle = !prev
      if (nextShuffle) {
        setAutoplayTracks(current => shuffleArray(current))
      } else {
        setAutoplayTracks(current => sortTracksByDiscographyOrder(current, displayedDiscographyTracks))
      }
      return nextShuffle
    })
  }, [displayedDiscographyTracks])

  // Audio Playback Handler (Invoked when user physically clicks PLAY on a track)
  const handlePlayTrack = useCallback((track, proj, options = {}) => {
    if (!track) return
    if (!track.hasAudio || !track.audioUrl) {
      showToast(`No audio available for "${track.name || 'this track'}"`)
      return
    }
    const parentProj = proj || selectedProject || projects.find(p => (p.tracks || []).some(t => (t.name || '').toLowerCase() === (track.name || '').toLowerCase()))
    const projName = parentProj?.name || track.project || ''
    const projCover = track.cover || parentProj?.cover || parentProj?.image || ''

    const isSameTrack = playingTrack?.name === track.name

    if (isSameTrack) {
      if (options?.touchMode) {
        if (isPlaying) {
          setRestartCount((c) => c + 1)
        } else {
          setIsPlaying(true)
        }
      } else if (options?.restart || options?.restartIfSame) {
        setIsPlaying(true)
        setRestartCount((c) => c + 1)
      } else {
        setIsPlaying((prev) => !prev)
      }
    } else {
      const trackWithProject = {
        ...track,
        project: projName,
        projectType: parentProj?.type || track.projectType || '',
        projectArtist: parentProj?.artist || artist.name || '',
        projectCover: projCover,
        artist: track.artist || parentProj?.artist || artist.name || '',
      }
      setPlayingTrack(trackWithProject)
      setIsPlaying(true)

      // Direct track play clears manual queue immediately
      setManualQueue([])

      // User physically clicked PLAY on a new track -> populate autoplay queue with tracks that follow it
      const currIndex = (displayedDiscographyTracks || []).findIndex(
        (item) => (item.track.name || '').toLowerCase() === (track.name || '').toLowerCase()
      )
      if (currIndex !== -1) {
        const remaining = displayedDiscographyTracks.slice(currIndex + 1)
        setAutoplayTracks(isShuffle ? shuffleArray(remaining) : remaining)
      } else {
        setAutoplayTracks([])
      }
    }
  }, [playingTrack, isPlaying, selectedProject, projects, artist.name, showToast, displayedDiscographyTracks, isShuffle])

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
      projectType: parentProj?.type || track.projectType || '',
      projectArtist: parentProj?.artist || artist.name || '',
      projectCover: track.cover || parentProj?.cover || parentProj?.image || '',
    }
    setManualQueue(prev => [...prev, { track: trackWithProject, project: parentProj }])
    showToast(`Added "${track?.name || 'track'}" to queue`)
  }, [selectedProject, projects, showToast, artist?.name])

  const handleSkipNext = useCallback(() => {
    if (repeatMode === 'one' && playingTrack) {
      return
    }

    if (manualQueue.length > 0) {
      const [nextItem, ...restQueue] = manualQueue
      setManualQueue(restQueue)
      setPlayingTrack(nextItem.track)
      setIsPlaying(true)
      return
    }

    if (autoplayTracks.length > 0) {
      const [nextItem, ...restAutoplay] = autoplayTracks
      setAutoplayTracks(restAutoplay)
      setPlayingTrack(nextItem.track)
      setIsPlaying(true)
    } else if (repeatMode === 'all' && displayedDiscographyTracks.length > 0) {
      const freshTracks = isShuffle ? shuffleArray(displayedDiscographyTracks) : [...displayedDiscographyTracks]
      const [firstItem, ...rest] = freshTracks
      setAutoplayTracks(rest)
      setPlayingTrack(firstItem.track)
      setIsPlaying(true)
    } else {
      setIsPlaying(false)
      setRestartCount((c) => c + 1)
    }
  }, [repeatMode, playingTrack, manualQueue, autoplayTracks, displayedDiscographyTracks, isShuffle])

  const handleSkipPrev = useCallback(() => {
    if (displayedDiscographyTracks.length > 0) {
      let currIndex = -1
      if (playingTrack) {
        currIndex = displayedDiscographyTracks.findIndex(
          item => (item.track.name || '').toLowerCase() === (playingTrack.name || '').toLowerCase()
        )
      }
      if (currIndex > 0) {
        const prevIndex = currIndex - 1
        const prevItem = displayedDiscographyTracks[prevIndex]
        const remaining = displayedDiscographyTracks.slice(prevIndex + 1)
        setPlayingTrack(prevItem.track)
        setIsPlaying(true)
        setAutoplayTracks(isShuffle ? shuffleArray(remaining) : remaining)
      } else if (currIndex === 0) {
        if (repeatMode === 'all') {
          const prevIndex = displayedDiscographyTracks.length - 1
          const prevItem = displayedDiscographyTracks[prevIndex]
          setPlayingTrack(prevItem.track)
          setIsPlaying(true)
          setAutoplayTracks([])
        } else {
          const remaining = displayedDiscographyTracks.slice(1)
          setAutoplayTracks(isShuffle ? shuffleArray(remaining) : remaining)
          setRestartCount((c) => c + 1)
          setIsPlaying(true)
        }
      }
    }
  }, [playingTrack, displayedDiscographyTracks, isShuffle, repeatMode])

  const handleQueueDragDrop = useCallback(({ fromList, fromIndex, toList, toIndex }) => {
    let currentQueue = [...manualQueue]
    let currentAutoplay = [...autoplayTracks]

    if (fromList === 'queue' && toList === 'queue') {
      if (fromIndex < 0 || fromIndex >= currentQueue.length) return
      const [moved] = currentQueue.splice(fromIndex, 1)
      const rawTargetIdx = fromIndex < toIndex ? toIndex - 1 : toIndex
      const targetIdx = Math.max(0, Math.min(rawTargetIdx, currentQueue.length))
      currentQueue.splice(targetIdx, 0, moved)
      setManualQueue(currentQueue)
    } else if (fromList === 'autoplay' && toList === 'autoplay') {
      if (fromIndex < 0 || fromIndex >= currentAutoplay.length) return
      const [moved] = currentAutoplay.splice(fromIndex, 1)
      const rawTargetIdx = fromIndex < toIndex ? toIndex - 1 : toIndex
      const targetIdx = Math.max(0, Math.min(rawTargetIdx, currentAutoplay.length))
      currentAutoplay.splice(targetIdx, 0, moved)
      setAutoplayTracks(currentAutoplay)
    } else if (fromList === 'autoplay' && toList === 'queue') {
      if (fromIndex < 0 || fromIndex >= currentAutoplay.length) return
      const [moved] = currentAutoplay.splice(fromIndex, 1)
      const targetIdx = Math.max(0, Math.min(toIndex, currentQueue.length))
      currentQueue.splice(targetIdx, 0, moved)
      setManualQueue(currentQueue)
      setAutoplayTracks(currentAutoplay)
    } else if (fromList === 'queue' && toList === 'autoplay') {
      if (fromIndex < 0 || fromIndex >= currentQueue.length) return
      const [moved] = currentQueue.splice(fromIndex, 1)
      const targetIdx = Math.max(0, Math.min(toIndex, currentAutoplay.length))
      currentAutoplay.splice(targetIdx, 0, moved)
      setManualQueue(currentQueue)
      setAutoplayTracks(currentAutoplay)
    }
  }, [manualQueue, autoplayTracks])

  const handleRemoveFromAutoplay = useCallback((index) => {
    setAutoplayTracks(prev => {
      const current = [...prev]
      if (index >= 0 && index < current.length) {
        current.splice(index, 1)
      }
      return current
    })
  }, [])

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
          src="/api/logo?w=240&fmt=webp"
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
          // Transparent custom scrollbars on root viewport & all containers
          ':root': {
            scrollbarWidth: 'thin',
            scrollbarColor: darkMode
              ? 'rgba(255, 255, 255, 0.45) transparent'
              : 'rgba(0, 0, 0, 0.45) transparent',
          },
          html: {
            scrollbarWidth: 'thin',
            scrollbarColor: darkMode
              ? 'rgba(255, 255, 255, 0.45) transparent'
              : 'rgba(0, 0, 0, 0.45) transparent',
          },
          body: {
            scrollbarWidth: 'thin',
            scrollbarColor: darkMode
              ? 'rgba(255, 255, 255, 0.45) transparent'
              : 'rgba(0, 0, 0, 0.45) transparent',
          },
          '*': {
            scrollbarWidth: 'thin',
            scrollbarColor: darkMode
              ? 'rgba(255, 255, 255, 0.45) transparent'
              : 'rgba(0, 0, 0, 0.45) transparent',
          },
          '::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
            background: 'transparent !important',
            backgroundColor: 'transparent !important',
          },
          '*::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
            background: 'transparent !important',
            backgroundColor: 'transparent !important',
          },
          '::-webkit-scrollbar-track': {
            background: 'transparent !important',
            backgroundColor: 'transparent !important',
          },
          '*::-webkit-scrollbar-track': {
            background: 'transparent !important',
            backgroundColor: 'transparent !important',
          },
          '::-webkit-scrollbar-track-piece': {
            background: 'transparent !important',
            backgroundColor: 'transparent !important',
          },
          '*::-webkit-scrollbar-track-piece': {
            background: 'transparent !important',
            backgroundColor: 'transparent !important',
          },
          '::-webkit-scrollbar-corner': {
            background: 'transparent !important',
            backgroundColor: 'transparent !important',
          },
          '*::-webkit-scrollbar-corner': {
            background: 'transparent !important',
            backgroundColor: 'transparent !important',
          },
          '::-webkit-scrollbar-thumb': {
            background: darkMode ? 'rgba(255, 255, 255, 0.45) !important' : 'rgba(0, 0, 0, 0.45) !important',
            backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.45) !important' : 'rgba(0, 0, 0, 0.45) !important',
            borderRadius: '99px !important',
            transition: 'background 0.2s ease',
          },
          '*::-webkit-scrollbar-thumb': {
            background: darkMode ? 'rgba(255, 255, 255, 0.45) !important' : 'rgba(0, 0, 0, 0.45) !important',
            backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.45) !important' : 'rgba(0, 0, 0, 0.45) !important',
            borderRadius: '99px !important',
            transition: 'background 0.2s ease',
          },
          '::-webkit-scrollbar-thumb:hover': {
            background: darkMode ? 'rgba(255, 255, 255, 0.75) !important' : 'rgba(0, 0, 0, 0.7) !important',
            backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.75) !important' : 'rgba(0, 0, 0, 0.7) !important',
          },
          '*::-webkit-scrollbar-thumb:hover': {
            background: darkMode ? 'rgba(255, 255, 255, 0.75) !important' : 'rgba(0, 0, 0, 0.7) !important',
            backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.75) !important' : 'rgba(0, 0, 0, 0.7) !important',
          },
          '::-webkit-scrollbar-thumb:active': {
            background: darkMode ? 'rgba(255, 255, 255, 0.95) !important' : 'rgba(0, 0, 0, 0.9) !important',
            backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.95) !important' : 'rgba(0, 0, 0, 0.9) !important',
          },
          '*::-webkit-scrollbar-thumb:active': {
            background: darkMode ? 'rgba(255, 255, 255, 0.95) !important' : 'rgba(0, 0, 0, 0.9) !important',
            backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.95) !important' : 'rgba(0, 0, 0, 0.9) !important',
          },
          '::-webkit-scrollbar-button': {
            display: 'none !important',
            width: 0,
            height: 0,
          },
          '*::-webkit-scrollbar-button': {
            display: 'none !important',
            width: 0,
            height: 0,
          },
        }}
      />

      {/* Full-viewport fixed root shell */}
      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          overflow: 'hidden',
          bgcolor: 'background.default',
        }}
      >
        {/* Full-viewport ambient background with dynamic adaptive blurred dots */}
        <AmbientBackground ambientImage={ambientImage} darkMode={darkMode} />

        {/* Primary in-flow scroll container with transparent floating scrollbar */}
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
          {/* Floating Dev & Admin Alert Cards (Top Left) */}
          {(data?.adminAccess !== false || Boolean(data?.devAccess)) && (
            <Stack
              spacing={1}
              sx={{
                position: 'fixed',
                top: { xs: 12, sm: 16 },
                left: { xs: 12, sm: 16 },
                zIndex: 3000,
                pointerEvents: 'none',
                maxWidth: { xs: 'calc(100vw - 24px)', sm: 380 },
              }}
            >
              {data?.adminAccess !== false && (
                <Paper
                  elevation={6}
                  sx={{
                    pointerEvents: 'auto',
                    borderRadius: 3,
                    px: { xs: 1, sm: 2 },
                    py: { xs: 0.75, sm: 1.25 },
                    bgcolor: '#b71c1c',
                    color: '#ffffff',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    boxShadow: '0 8px 24px rgba(183, 28, 28, 0.45)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: { xs: 0.75, sm: 1.5 },
                    animation: 'pulseAdminAlert 2s infinite ease-in-out',
                    '@keyframes pulseAdminAlert': {
                      '0%': { backgroundColor: '#b71c1c', boxShadow: '0 6px 18px rgba(183, 28, 28, 0.4)' },
                      '50%': { backgroundColor: '#d32f2f', boxShadow: '0 10px 28px rgba(211, 47, 47, 0.65)' },
                      '100%': { backgroundColor: '#b71c1c', boxShadow: '0 6px 18px rgba(183, 28, 28, 0.4)' },
                    },
                  }}
                >
                  <LockOpenIcon sx={{ fontSize: { xs: 18, sm: 20 }, color: '#ffffff', flexShrink: 0 }} />
                  <Box sx={{ display: { xs: 'none', sm: 'block' }, minWidth: 0, flexGrow: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#ffffff', display: 'block', lineHeight: 1.25, fontSize: '0.775rem' }}>
                      Admin Access Open
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.85)', display: 'block', fontSize: '0.7rem', lineHeight: 1.2 }}>
                      Set adminAccess: false for prod
                    </Typography>
                  </Box>
                  <Tooltip title="Open Admin Portal" arrow>
                    <IconButton
                      component="a"
                      href="/_sys/_admin"
                      target="_blank"
                      rel="noopener noreferrer"
                      size="small"
                      sx={{
                        color: '#ffffff',
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        p: { xs: 0.5, sm: 0.75 },
                        ml: 'auto',
                        flexShrink: 0,
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.35)',
                          transform: 'scale(1.08)',
                        },
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <OpenInNewRoundedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Paper>
              )}

              {Boolean(data?.devAccess) && (
                <Paper
                  elevation={6}
                  sx={{
                    pointerEvents: 'auto',
                    borderRadius: 3,
                    px: { xs: 1, sm: 2 },
                    py: { xs: 0.75, sm: 1.25 },
                    bgcolor: '#e65100',
                    color: '#ffffff',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    boxShadow: '0 8px 24px rgba(230, 81, 0, 0.45)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: { xs: 0.75, sm: 1.5 },
                    animation: 'pulseDevAlert 2s infinite ease-in-out',
                    '@keyframes pulseDevAlert': {
                      '0%': { backgroundColor: '#e65100', boxShadow: '0 6px 18px rgba(230, 81, 0, 0.4)' },
                      '50%': { backgroundColor: '#f57c00', boxShadow: '0 10px 28px rgba(245, 124, 0, 0.65)' },
                      '100%': { backgroundColor: '#e65100', boxShadow: '0 6px 18px rgba(230, 81, 0, 0.4)' },
                    },
                  }}
                >
                  {/* Clickable Bug Icon which opens the Dev Data Health Report Drawer */}
                  <Tooltip title="View Dev Data Health Report" arrow>
                    <IconButton
                      size="small"
                      onClick={() => setDevDrawerOpen(true)}
                      sx={{
                        color: '#ffffff',
                        p: 0.5,
                        flexShrink: 0,
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.25)',
                          transform: 'scale(1.1)',
                        },
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <Badge
                        badgeContent={health?.issues?.length || null}
                        color="error"
                        sx={{
                          '& .MuiBadge-badge': {
                            fontSize: '0.65rem',
                            height: 16,
                            minWidth: 16,
                            padding: '0 4px',
                          },
                        }}
                      >
                        <BugReportIcon sx={{ fontSize: { xs: 18, sm: 20 }, color: '#ffffff' }} />
                      </Badge>
                    </IconButton>
                  </Tooltip>

                  <Box sx={{ display: { xs: 'none', sm: 'block' }, minWidth: 0, flexGrow: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#ffffff', display: 'block', lineHeight: 1.25, fontSize: '0.775rem' }}>
                      Dev Mode Enabled
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.85)', display: 'block', fontSize: '0.7rem', lineHeight: 1.2 }}>
                      Set devAccess: false for prod
                    </Typography>
                  </Box>

                  <Tooltip title="Open Dev Tool" arrow>
                    <IconButton
                      component="a"
                      href="/_sys/_dev"
                      target="_blank"
                      rel="noopener noreferrer"
                      size="small"
                      sx={{
                        color: '#ffffff',
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        p: { xs: 0.5, sm: 0.75 },
                        ml: 'auto',
                        flexShrink: 0,
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.35)',
                          transform: 'scale(1.08)',
                        },
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <OpenInNewRoundedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Paper>
              )}
            </Stack>
          )}
          {/* Dev Data Health Drawer (Triggered by clicking bug icon) */}
          {Boolean(data?.devAccess) && (
            <DevHealthDrawer
              health={health}
              open={devDrawerOpen}
              onClose={() => setDevDrawerOpen(false)}
            />
          )}
          {/* Top Screen-Height Hero Section (Only on main discography view) */}
          {currentView !== 'SINGLE_PROJECT' && (
            <ArtistHero
              artist={artist}
              onLogoClick={undefined}
              ambientImage={ambientImage}
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
              hasAvailablePlatforms={availablePlatformIds.length > 0}
              audioQuality={audioQuality}
              isStuttering={isPlaybackStuttering}
              onOpenQualityModal={() => setQualityModalOpen(true)}
              showScrollTop={showScrollTop}
              onScrollToTop={scrollToTop}
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
                {/* Single Project Page Header: Compact Artist Header */}
                <CompactArtistHeader
                  artist={artist}
                  onNavigateHome={navigateToAllProjects}
                  darkMode={darkMode}
                  onToggleTheme={handleToggleTheme}
                  selectedPlatform={selectedPlatform}
                  onOpenPlatformModal={() => setPlatformModalOpen(true)}
                  ambientImage={ambientImage}
                  hasAvailablePlatforms={availablePlatformIds.length > 0}
                />

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
                  onSelectTrackRow={(track) => selectTrackOnProjectPage(selectedProject, track)}
                  onSelectTrackTitle={(track) => selectTrackOnProjectPage(selectedProject, track)}
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
                  filteredProjects.map((proj, idx) => {
                    const pSlug = slugify(proj.name || '')
                    return (
                      <Box
                        key={proj.id || pSlug || idx}
                        id={`project-${pSlug}`}
                        sx={{ scrollMarginTop: { xs: 80, sm: 100 } }}
                      >
                        <ProjectCard
                          project={proj}
                          artistName={artist.name}
                          onSelectProject={navigateToProject}
                          isSingleView={false}
                          onPlayTrack={handlePlayTrack}
                          onAddToQueue={handleAddToQueue}
                          onShowToast={showToast}
                          playingTrack={playingTrack}
                          isPlaying={isPlaying}
                          highlightedTrackSlug={highlightedTrackSlug}
                          onSelectTrackRow={null}
                          onSelectTrackTitle={(track) => navigateToTrack(proj, track)}
                          selectedPlatform={selectedPlatform}
                        />
                      </Box>
                    )
                  })
                )}
              </Stack>
            )}
          </Container>
        </Box>

        {/* Preferred Platform Selector Modal */}
        <PlatformSelectorModal
          open={platformModalOpen}
          onClose={() => setPlatformModalOpen(false)}
          selectedPlatform={selectedPlatform}
          onSelectPlatform={handleSelectPlatform}
          availablePlatforms={availablePlatforms}
        />

        {/* Audio Playback Quality Selector Modal */}
        <AudioQualityModal
          open={qualityModalOpen}
          onClose={() => setQualityModalOpen(false)}
          activeQuality={audioQuality}
          isStuttering={isPlaybackStuttering}
          onSelectQuality={handleSelectQuality}
        />

        {/* Contained Floating Audio Player Bar */}
        <AudioPlayerBar
          playingTrack={playingTrack}
          isPlaying={isPlaying}
          restartCount={restartCount}
          audioQuality={audioQuality}
          onOpenQualityModal={() => setQualityModalOpen(true)}
          onStutterChange={setIsPlaybackStuttering}
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
              setAutoplayTracks(prev => prev.slice(index + 1))
            }
            setPlayingTrack(item.track)
            setIsPlaying(true)
          }}
          onSkipNext={handleSkipNext}
          onSkipPrev={handleSkipPrev}
          onShowToast={showToast}
          onNavigateToCurrentTrack={handleNavigateToCurrentTrack}
          isShuffle={isShuffle}
          onToggleShuffle={handleToggleShuffle}
          repeatMode={repeatMode}
          onCycleRepeatMode={() => {
            setRepeatMode(prev => {
              if (prev === 'off') return 'all'
              if (prev === 'all') return 'one'
              return 'off'
            })
          }}
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

        {/* Dev Data Health Drawer Badge (Only rendered when devAccess is enabled) */}
        {data?.devAccess !== false && <DevHealthDrawer health={health} />}
      </Box>
    </ThemeProvider>
  )
}
