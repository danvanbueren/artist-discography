'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Box,
  Container,
  Paper,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Button,
  Stack,
  Typography,
  useTheme,
  Collapse,
  Fade,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import TuneRoundedIcon from '@mui/icons-material/TuneRounded'
import SortRoundedIcon from '@mui/icons-material/SortRounded'
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import ClearRoundedIcon from '@mui/icons-material/ClearRounded'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import SettingsBrightnessRoundedIcon from '@mui/icons-material/SettingsBrightnessRounded'
import LinkIcon from '@mui/icons-material/Link'
import ArrowDownwardRoundedIcon from '@mui/icons-material/ArrowDownwardRounded'
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded'
import SortByAlphaRoundedIcon from '@mui/icons-material/SortByAlphaRounded'
import { SOCIAL_ICONS } from './ArtistHero'

export const FILTER_OPTIONS = [
  'LP',
  'EP',
  'Single',
  'Feature',
  'Remix',
  'Bootleg',
  'Flip',
  'Edit',
  'Compilation',
  'Minimix',
  'DJ Set',
  'Mixtape',
  'Live',
  'Other',
]

function useDragScroll() {
  const ref = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const startXRef = useRef(0)
  const scrollLeftRef = useRef(0)
  const hasDraggedRef = useRef(false)

  const onMouseDown = useCallback((e) => {
    if (!ref.current) return
    setIsDragging(true)
    hasDraggedRef.current = false
    startXRef.current = e.pageX - ref.current.offsetLeft
    scrollLeftRef.current = ref.current.scrollLeft
  }, [])

  const onMouseLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const onMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const onMouseMove = useCallback((e) => {
    if (!isDragging || !ref.current) return
    const x = e.pageX - ref.current.offsetLeft
    const walk = (x - startXRef.current) * 1.5
    if (Math.abs(walk) > 4) {
      hasDraggedRef.current = true
    }
    ref.current.scrollLeft = scrollLeftRef.current - walk
  }, [isDragging])

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const handleWheel = (e) => {
      if (e.deltaY !== 0) {
        e.preventDefault()
        el.scrollLeft += e.deltaY * 1.2
      }
    }

    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      el.removeEventListener('wheel', handleWheel)
    }
  }, [])

  return {
    ref,
    isDragging,
    hasDraggedRef,
    bind: {
      onMouseDown,
      onMouseLeave,
      onMouseUp,
      onMouseMove,
    },
  }
}

export default function FloatingNavBar({
  activeTypes = [],
  onToggleType,
  onResetTypes,
  sortOrder = 'newest',
  onSortChange,
  searchQuery = '',
  onSearchChange,
  darkMode,
  onToggleTheme,
  selectedPlatform,
  onOpenPlatformModal,
  hasAvailablePlatforms = true,
}) {
  const theme = useTheme()
  const [navMode, setNavMode] = useState('main') // 'main' | 'search' | 'filter' | 'sort' | 'settings'
  const navRef = useRef(null)
  const inactivityTimerRef = useRef(null)
  const [isHovering, setIsHovering] = useState(false)
  const [isSearchFocused, setIsSearchFocused] = useState(false)

  const filterDrag = useDragScroll()
  const sortDrag = useDragScroll()

  // Track scroll position to conditionally show jump-to-top button
  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleScrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  // Clear timer helper
  const clearInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current)
      inactivityTimerRef.current = null
    }
  }, [])

  // Start 5-second inactivity timer (only when in child nav, not hovering, and search not focused)
  const startInactivityTimer = useCallback(() => {
    clearInactivityTimer()
    if (navMode !== 'main' && !isHovering && !isSearchFocused) {
      inactivityTimerRef.current = setTimeout(() => {
        setNavMode('main')
      }, 5000)
    }
  }, [clearInactivityTimer, navMode, isHovering, isSearchFocused])

  // Manage timer lifecycle based on navMode, hover, and focus
  useEffect(() => {
    if (navMode === 'main') {
      clearInactivityTimer()
    } else if (!isHovering && !isSearchFocused) {
      startInactivityTimer()
    } else {
      clearInactivityTimer()
    }

    return () => clearInactivityTimer()
  }, [navMode, isHovering, isSearchFocused, startInactivityTimer, clearInactivityTimer])

  // Immediately jump back to parent menu on Escape key
  useEffect(() => {
    if (navMode === 'main') return

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setNavMode('main')
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [navMode])

  // Immediately jump back to parent menu when clicking outside nav bar component
  useEffect(() => {
    if (navMode === 'main') return

    const handlePointerDown = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setNavMode('main')
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [navMode])

  const bgDefault = theme.palette.background.default
  const bgTransparent = alpha(bgDefault, 0)
  const isSearchActive = Boolean(searchQuery && searchQuery.trim() !== '')
  const isFilterActive = Boolean(activeTypes && activeTypes.length > 0)

  return (
    <Box
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 1100,
        pt: { xs: 1.5, sm: 2 },
        pb: { xs: 1.5, sm: 2 },
        pointerEvents: 'none',
      }}
    >

      <Container
        ref={navRef}
        maxWidth="md"
        sx={{
          px: { xs: 2, sm: 3 },
          pointerEvents: 'auto',
        }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
      <Paper
        elevation={4}
        sx={{
          height: 64,
          minHeight: 64,
          maxHeight: 64,
          borderRadius: 4,
          py: 0,
          px: { xs: 2, sm: 3 },
          backdropFilter: 'blur(16px)',
          bgcolor: theme.palette.mode === 'dark'
            ? 'rgba(18, 18, 26, 0.88)'
            : 'rgba(255, 255, 255, 0.88)',
          border: '1px solid',
          borderColor: theme.palette.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.12)'
            : 'rgba(0, 0, 0, 0.12)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
          transition: 'background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {/* Back Button when inside a sub-menu */}
        {navMode !== 'main' && (
          <Fade in={navMode !== 'main'}>
            <IconButton
              size="medium"
              onClick={() => setNavMode('main')}
              sx={{ mr: 1.5, p: 1, color: 'text.secondary' }}
            >
              <ArrowBackRoundedIcon />
            </IconButton>
          </Fade>
        )}

        {/* --- MAIN MENU MODE --- */}
        {navMode === 'main' && (
          <Stack
            direction="row"
            spacing={{ xs: 0.5, sm: 1.5 }}
            sx={{
              width: '100%',
              justifyContent: 'space-around',
              alignItems: 'center',
            }}
          >
            {/* 1. TOP JUMP BUTTON (Appears on far left when scrolled down) */}
            {showScrollTop && (
              <Button
                size="medium"
                onClick={handleScrollToTop}
                startIcon={<ArrowUpwardRoundedIcon />}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: { xs: '0.85rem', sm: '0.95rem' },
                  borderRadius: 3,
                  px: { xs: 1.25, sm: 2 },
                  py: 1,
                  minWidth: 0,
                  color: 'text.primary',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
              >
                Top
              </Button>
            )}

            {/* 2. SEARCH BUTTON & RESET */}
            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
              <Button
                size="medium"
                onClick={() => setNavMode('search')}
                startIcon={<SearchRoundedIcon />}
                sx={{
                  textTransform: 'none',
                  fontWeight: isSearchActive ? 700 : 600,
                  fontSize: { xs: '0.85rem', sm: '0.95rem' },
                  borderRadius: 3,
                  px: { xs: 1.25, sm: 2 },
                  py: 1,
                  minWidth: 0,
                  border: isSearchActive ? '2px solid' : '1px solid transparent',
                  borderColor: isSearchActive ? 'primary.main' : 'transparent',
                  bgcolor: isSearchActive ? 'rgba(144, 202, 249, 0.15)' : 'transparent',
                  color: isSearchActive ? 'primary.main' : 'text.primary',
                  '&:hover': {
                    bgcolor: isSearchActive ? 'rgba(144, 202, 249, 0.25)' : 'action.hover',
                  },
                }}
              >
                Search
              </Button>

              {isSearchActive && (
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation()
                    onSearchChange('')
                  }}
                  sx={{
                    p: 0.75,
                    color: 'error.main',
                    '&:hover': {
                      bgcolor: 'rgba(244, 67, 54, 0.15)',
                    },
                  }}
                >
                  <DeleteOutlineRoundedIcon fontSize="small" />
                </IconButton>
              )}
            </Stack>

            {/* 3. FILTER BUTTON & RESET */}
            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
              <Button
                size="medium"
                onClick={() => setNavMode('filter')}
                startIcon={<TuneRoundedIcon />}
                sx={{
                  textTransform: 'none',
                  fontWeight: isFilterActive ? 700 : 600,
                  fontSize: { xs: '0.85rem', sm: '0.95rem' },
                  borderRadius: 3,
                  px: { xs: 1.25, sm: 2 },
                  py: 1,
                  minWidth: 0,
                  border: isFilterActive ? '2px solid' : '1px solid transparent',
                  borderColor: isFilterActive ? 'primary.main' : 'transparent',
                  bgcolor: isFilterActive ? 'rgba(144, 202, 249, 0.15)' : 'transparent',
                  color: isFilterActive ? 'primary.main' : 'text.primary',
                  '&:hover': {
                    bgcolor: isFilterActive ? 'rgba(144, 202, 249, 0.25)' : 'action.hover',
                  },
                }}
              >
                Filter
              </Button>

              {isFilterActive && (
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation()
                    onResetTypes()
                  }}
                  sx={{
                    p: 0.75,
                    color: 'error.main',
                    '&:hover': {
                      bgcolor: 'rgba(244, 67, 54, 0.15)',
                    },
                  }}
                >
                  <DeleteOutlineRoundedIcon fontSize="small" />
                </IconButton>
              )}
            </Stack>

            {/* 4. SORT BUTTON */}
            <Button
              size="medium"
              onClick={() => setNavMode('sort')}
              startIcon={<SortRoundedIcon />}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                fontSize: { xs: '0.85rem', sm: '0.95rem' },
                borderRadius: 3,
                px: { xs: 1.25, sm: 2 },
                py: 1,
                minWidth: 0,
                color: 'text.primary',
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
            >
              Sort
            </Button>

            {/* 5. SETTINGS BUTTON */}
            <Button
              size="medium"
              onClick={() => setNavMode('settings')}
              startIcon={<SettingsRoundedIcon />}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                fontSize: { xs: '0.85rem', sm: '0.95rem' },
                borderRadius: 3,
                px: { xs: 1.25, sm: 2 },
                py: 1,
                minWidth: 0,
                color: 'text.primary',
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
            >
              Settings
            </Button>
          </Stack>
        )}

        {/* --- SEARCH MODE (Full-width text input expand, stays active while focused, immediate return on blur/Esc) --- */}
        {navMode === 'search' && (
          <Box sx={{ flexGrow: 1 }}>
            <TextField
              value={searchQuery}
              onChange={(e) => {
                onSearchChange(e.target.value)
              }}
              onFocus={() => {
                setIsSearchFocused(true)
              }}
              onBlur={() => {
                setIsSearchFocused(false)
                setNavMode('main')
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  setNavMode('main')
                }
              }}
              placeholder="Search by title, artist, or track..."
              size="small"
              fullWidth
              autoFocus
              slotProps={{
                htmlInput: {
                  sx: { py: 0.75, fontSize: '0.95rem' },
                },
                input: {
                  sx: { height: 40 },
                  endAdornment: searchQuery ? (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onMouseDown={(e) => {
                          e.preventDefault()
                          onSearchChange('')
                        }}
                      >
                        <ClearRoundedIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                },
              }}
            />
          </Box>
        )}

        {/* --- FILTER MODE (Multi-select: LP, EP, Single, Feature, Remix, Bootleg, Flip, Edit) --- */}
        {navMode === 'filter' && (
          <Box
            ref={filterDrag.ref}
            {...filterDrag.bind}
            sx={{
              display: 'flex',
              gap: 1,
              overflowX: 'auto',
              py: 0.5,
              px: 0.5,
              minWidth: 0,
              flexGrow: 1,
              alignItems: 'center',
              cursor: filterDrag.isDragging ? 'grabbing' : 'grab',
              userSelect: 'none',
              scrollbarWidth: 'none',
              '&::-webkit-scrollbar': { display: 'none' },
            }}
          >
            {FILTER_OPTIONS.map((type) => {
              const isSelected = activeTypes.includes(type)
              return (
                <Chip
                  key={type}
                  label={type}
                  clickable
                  onClick={() => {
                    if (filterDrag.hasDraggedRef.current) return
                    onToggleType(type)
                  }}
                  color={isSelected ? 'primary' : 'default'}
                  variant={isSelected ? 'filled' : 'outlined'}
                  size="medium"
                  sx={{
                    flexShrink: 0,
                    fontWeight: isSelected ? 700 : 500,
                    fontSize: '0.875rem',
                    borderRadius: 2.5,
                    px: 1,
                    height: 38,
                    transition: 'all 0.2s ease',
                    userSelect: 'none',
                  }}
                />
              )
            })}
          </Box>
        )}

        {/* --- SORT MODE --- */}
        {navMode === 'sort' && (
          <Box
            ref={sortDrag.ref}
            {...sortDrag.bind}
            sx={{
              display: 'flex',
              gap: 1.25,
              overflowX: 'auto',
              py: 0.5,
              px: 0.5,
              minWidth: 0,
              flexGrow: 1,
              alignItems: 'center',
              cursor: sortDrag.isDragging ? 'grabbing' : 'grab',
              userSelect: 'none',
              scrollbarWidth: 'none',
              '&::-webkit-scrollbar': { display: 'none' },
            }}
          >
            <Chip
              icon={<ArrowDownwardRoundedIcon />}
              label="Newest First"
              clickable
              onClick={() => {
                if (sortDrag.hasDraggedRef.current) return
                onSortChange('newest')
              }}
              color={sortOrder === 'newest' ? 'primary' : 'default'}
              variant={sortOrder === 'newest' ? 'filled' : 'outlined'}
              size="medium"
              sx={{ flexShrink: 0, height: 38, px: 1, fontSize: '0.875rem', userSelect: 'none' }}
            />
            <Chip
              icon={<ArrowUpwardRoundedIcon />}
              label="Oldest First"
              clickable
              onClick={() => {
                if (sortDrag.hasDraggedRef.current) return
                onSortChange('oldest')
              }}
              color={sortOrder === 'oldest' ? 'primary' : 'default'}
              variant={sortOrder === 'oldest' ? 'filled' : 'outlined'}
              size="medium"
              sx={{ flexShrink: 0, height: 38, px: 1, fontSize: '0.875rem', userSelect: 'none' }}
            />
            <Chip
              icon={<SortByAlphaRoundedIcon />}
              label="Title A-Z"
              clickable
              onClick={() => {
                if (sortDrag.hasDraggedRef.current) return
                onSortChange('title-asc')
              }}
              color={sortOrder === 'title-asc' ? 'primary' : 'default'}
              variant={sortOrder === 'title-asc' ? 'filled' : 'outlined'}
              size="medium"
              sx={{ flexShrink: 0, height: 38, px: 1, fontSize: '0.875rem', userSelect: 'none' }}
            />
            <Chip
              icon={<SortByAlphaRoundedIcon />}
              label="Title Z-A"
              clickable
              onClick={() => {
                if (sortDrag.hasDraggedRef.current) return
                onSortChange('title-desc')
              }}
              color={sortOrder === 'title-desc' ? 'primary' : 'default'}
              variant={sortOrder === 'title-desc' ? 'filled' : 'outlined'}
              size="medium"
              sx={{ flexShrink: 0, height: 38, px: 1, fontSize: '0.875rem', userSelect: 'none' }}
            />
          </Box>
        )}

        {/* --- SETTINGS MODE (Theme toggle & Platform selector) --- */}
        {navMode === 'settings' && (
          <Stack
            direction="row"
            spacing={1.5}
            sx={{
              flexGrow: 1,
              justifyContent: 'flex-start',
              alignItems: 'center',
            }}
          >
            <Button
              size="medium"
              variant="outlined"
              disabled={!hasAvailablePlatforms}
              onClick={() => {
                onOpenPlatformModal()
              }}
              startIcon={
                selectedPlatform && SOCIAL_ICONS[selectedPlatform] ? (
                  <Box
                    component="img"
                    src={SOCIAL_ICONS[selectedPlatform]}
                    alt={selectedPlatform || 'Platform'}
                    draggable={false}
                    sx={{
                      width: 20,
                      height: 20,
                      objectFit: 'contain',
                      borderRadius: 0.5,
                    }}
                  />
                ) : (
                  <LinkIcon />
                )
              }
              sx={{
                borderRadius: 3,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.9rem',
                py: 1,
                px: 2,
                color: 'text.primary',
                borderColor: 'divider',
                '&:hover': {
                  borderColor: 'text.primary',
                  bgcolor: 'action.hover',
                },
              }}
            >
              Platform
            </Button>

            <Button
              size="medium"
              variant="outlined"
              onClick={() => {
                onToggleTheme()
              }}
              startIcon={
                darkMode ? (
                  <LightModeIcon />
                ) : (
                  <DarkModeIcon />
                )
              }
              sx={{
                borderRadius: 3,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.9rem',
                py: 1,
                px: 2,
                color: 'text.primary',
                borderColor: 'divider',
                '&:hover': {
                  borderColor: 'text.primary',
                  bgcolor: 'action.hover',
                },
              }}
            >
              {darkMode ? 'Light Theme' : 'Dark Theme'}
            </Button>
          </Stack>
        )}
      </Paper>
    </Container>
  </Box>
  )
}
