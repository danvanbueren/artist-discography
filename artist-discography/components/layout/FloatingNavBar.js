'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Box, Container, Paper, IconButton, useTheme, Fade } from '@mui/material'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import { useDragScroll } from '@/lib/hooks/useDragScroll'
import NavBarMainToolbar from './navbar/NavBarMainToolbar'
import NavBarSearchBar from './navbar/NavBarSearchBar'
import NavBarFilterBar, { FILTER_OPTIONS } from './navbar/NavBarFilterBar'
import NavBarSortBar from './navbar/NavBarSortBar'
import NavBarSettingsBar from './navbar/NavBarSettingsBar'

export { FILTER_OPTIONS }

/**
 * FloatingNavBar
 * Responsive floating sticky navigation bar with fluid multi-mode toolbars:
 * Main, Search, Release Type Filter, Sort Order, and Settings.
 */
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
  audioQuality = '320k',
  isStuttering = false,
  onOpenQualityModal,
  isPrivateAuthenticated = false,
  onOpenPrivateAccessModal,
  showScrollTop = false,
  onScrollToTop,
  sx = {},
}) {
  const theme = useTheme()
  const [navMode, setNavMode] = useState('main') // 'main' | 'search' | 'filter' | 'sort' | 'settings'
  const navRef = useRef(null)
  const inactivityTimerRef = useRef(null)
  const [isHovering, setIsHovering] = useState(false)
  const [isSearchFocused, setIsSearchFocused] = useState(false)

  const mainDrag = useDragScroll()
  const filterDrag = useDragScroll()
  const sortDrag = useDragScroll()
  const settingsDrag = useDragScroll()

  // Reset scroll position to beginning when Top button appears
  const prevShowScrollTopRef = useRef(showScrollTop)
  useEffect(() => {
    if (showScrollTop && !prevShowScrollTopRef.current && mainDrag.ref.current) {
      mainDrag.ref.current.scrollLeft = 0
    }
    prevShowScrollTopRef.current = showScrollTop
  }, [showScrollTop, mainDrag.ref])

  // Clear timer helper
  const clearInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current)
      inactivityTimerRef.current = null
    }
  }, [])

  // 5-second inactivity auto-dismiss timer
  const startInactivityTimer = useCallback(() => {
    clearInactivityTimer()
    if (navMode !== 'main' && !isHovering && !isSearchFocused) {
      inactivityTimerRef.current = setTimeout(() => {
        setNavMode('main')
      }, 5000)
    }
  }, [clearInactivityTimer, navMode, isHovering, isSearchFocused])

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

  // Escape key handler
  useEffect(() => {
    if (navMode === 'main') return
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setNavMode('main')
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [navMode])

  // Click outside handler
  useEffect(() => {
    if (navMode === 'main') return
    const handlePointerDown = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setNavMode('main')
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [navMode])

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
        ...sx,
      }}
    >
      <Container
        ref={navRef}
        maxWidth='md'
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
            bgcolor:
              theme.palette.mode === 'dark'
                ? 'rgba(18, 18, 26, 0.88)'
                : 'rgba(255, 255, 255, 0.88)',
            border: '1px solid',
            borderColor:
              theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
            transition: 'background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {/* Back button when inside sub-menu */}
          {navMode !== 'main' && (
            <Fade in={navMode !== 'main'}>
              <IconButton
                size='medium'
                onClick={() => setNavMode('main')}
                sx={{ mr: 1.5, p: 1, color: 'text.secondary' }}
              >
                <ArrowBackRoundedIcon />
              </IconButton>
            </Fade>
          )}

          {/* MAIN MENU */}
          {navMode === 'main' && (
            <NavBarMainToolbar
              showScrollTop={showScrollTop}
              onScrollToTop={onScrollToTop}
              isSearchActive={isSearchActive}
              onOpenSearch={() => setNavMode('search')}
              onClearSearch={() => onSearchChange('')}
              isFilterActive={isFilterActive}
              onOpenFilter={() => setNavMode('filter')}
              onResetFilter={onResetTypes}
              onOpenSort={() => setNavMode('sort')}
              isStuttering={isStuttering}
              onOpenSettings={() => setNavMode('settings')}
              mainDrag={mainDrag}
            />
          )}

          {/* SEARCH MODE */}
          {navMode === 'search' && (
            <NavBarSearchBar
              searchQuery={searchQuery}
              onSearchChange={onSearchChange}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => {
                setIsSearchFocused(false)
                setNavMode('main')
              }}
              onCloseSearch={() => setNavMode('main')}
            />
          )}

          {/* FILTER MODE */}
          {navMode === 'filter' && (
            <NavBarFilterBar
              activeTypes={activeTypes}
              onToggleType={onToggleType}
              filterDrag={filterDrag}
            />
          )}

          {/* SORT MODE */}
          {navMode === 'sort' && (
            <NavBarSortBar sortOrder={sortOrder} onSortChange={onSortChange} sortDrag={sortDrag} />
          )}

          {/* SETTINGS MODE */}
          {navMode === 'settings' && (
            <NavBarSettingsBar
              hasAvailablePlatforms={hasAvailablePlatforms}
              onOpenPlatformModal={onOpenPlatformModal}
              selectedPlatform={selectedPlatform}
              onOpenQualityModal={onOpenQualityModal}
              isStuttering={isStuttering}
              audioQuality={audioQuality}
              darkMode={darkMode}
              onToggleTheme={onToggleTheme}
              onOpenPrivateAccessModal={onOpenPrivateAccessModal}
              isPrivateAuthenticated={isPrivateAuthenticated}
              settingsDrag={settingsDrag}
            />
          )}
        </Paper>
      </Container>
    </Box>
  )
}
