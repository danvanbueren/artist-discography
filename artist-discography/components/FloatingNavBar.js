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
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import TuneRoundedIcon from '@mui/icons-material/TuneRounded'
import SortRoundedIcon from '@mui/icons-material/SortRounded'
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded'
import ClearRoundedIcon from '@mui/icons-material/ClearRounded'
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded'
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded'
import HeadsetRoundedIcon from '@mui/icons-material/HeadsetRounded'
import ArrowDownwardRoundedIcon from '@mui/icons-material/ArrowDownwardRounded'
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded'
import SortByAlphaRoundedIcon from '@mui/icons-material/SortByAlphaRounded'

export const FILTER_OPTIONS = [
  'LP',
  'EP',
  'Single',
  'Feature',
  'Remix',
  'Bootleg',
  'Flip',
  'Edit',
]

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
}) {
  const theme = useTheme()
  const [navMode, setNavMode] = useState('main') // 'main' | 'search' | 'filter' | 'sort' | 'settings'
  const navRef = useRef(null)
  const inactivityTimerRef = useRef(null)
  const [isHovering, setIsHovering] = useState(false)
  const [isSearchFocused, setIsSearchFocused] = useState(false)

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

  const isSearchActive = Boolean(searchQuery && searchQuery.trim() !== '')
  const isFilterActive = activeTypes.length > 0

  return (
    <Container
      ref={navRef}
      maxWidth="md"
      sx={{
        position: 'sticky',
        top: 16,
        zIndex: 1100,
        px: { xs: 1.5, sm: 2 },
      }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <Paper
        elevation={4}
        sx={{
          borderRadius: 4,
          py: 1.25,
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
          transition: 'all 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          minHeight: 58,
        }}
      >
        {/* Back Button when inside a sub-menu */}
        {navMode !== 'main' && (
          <Fade in={navMode !== 'main'}>
            <IconButton
              size="small"
              onClick={() => setNavMode('main')}
              sx={{ mr: 1.5, color: 'text.secondary' }}
            >
              <ArrowBackRoundedIcon fontSize="small" />
            </IconButton>
          </Fade>
        )}

        {/* --- MAIN MENU MODE --- */}
        {navMode === 'main' && (
          <Stack
            direction="row"
            spacing={1.5}
            sx={{
              width: '100%',
              justifyContent: 'space-around',
              alignItems: 'center',
            }}
          >
            {/* 1. SEARCH ICON & RESET */}
            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
              <IconButton
                size="small"
                onClick={() => setNavMode('search')}
                sx={{
                  p: 1,
                  borderRadius: 2,
                  border: isSearchActive ? '2px solid' : '1px solid transparent',
                  borderColor: isSearchActive ? 'primary.main' : 'transparent',
                  bgcolor: isSearchActive ? 'rgba(144, 202, 249, 0.15)' : 'transparent',
                  color: isSearchActive ? 'primary.main' : 'inherit',
                }}
              >
                <SearchRoundedIcon />
              </IconButton>

              {isSearchActive && (
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation()
                    onSearchChange('')
                  }}
                  sx={{
                    p: 0.75,
                    borderRadius: 2,
                    border: '2px solid',
                    borderColor: 'primary.main',
                    color: 'primary.main',
                  }}
                >
                  <RestartAltRoundedIcon fontSize="small" />
                </IconButton>
              )}
            </Stack>

            {/* 2. FILTER ICON & RESET */}
            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
              <IconButton
                size="small"
                onClick={() => setNavMode('filter')}
                sx={{
                  p: 1,
                  borderRadius: 2,
                  border: isFilterActive ? '2px solid' : '1px solid transparent',
                  borderColor: isFilterActive ? 'primary.main' : 'transparent',
                  bgcolor: isFilterActive ? 'rgba(144, 202, 249, 0.15)' : 'transparent',
                  color: isFilterActive ? 'primary.main' : 'inherit',
                }}
              >
                <TuneRoundedIcon />
              </IconButton>

              {isFilterActive && (
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation()
                    onResetTypes()
                  }}
                  sx={{
                    p: 0.75,
                    borderRadius: 2,
                    border: '2px solid',
                    borderColor: 'primary.main',
                    color: 'primary.main',
                  }}
                >
                  <RestartAltRoundedIcon fontSize="small" />
                </IconButton>
              )}
            </Stack>

            {/* 3. SORT ICON */}
            <IconButton
              size="small"
              onClick={() => setNavMode('sort')}
              sx={{ p: 1, borderRadius: 2 }}
            >
              <SortRoundedIcon />
            </IconButton>

            {/* 4. SETTINGS ICON */}
            <IconButton
              size="small"
              onClick={() => setNavMode('settings')}
              sx={{ p: 1, borderRadius: 2 }}
            >
              <SettingsRoundedIcon />
            </IconButton>
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
            sx={{
              display: 'flex',
              gap: 0.75,
              overflowX: 'auto',
              py: 0.5,
              scrollbarWidth: 'none',
              '&::-webkit-scrollbar': { display: 'none' },
              flexGrow: 1,
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
                    onToggleType(type)
                  }}
                  color={isSelected ? 'primary' : 'default'}
                  variant={isSelected ? 'filled' : 'outlined'}
                  size="small"
                  sx={{
                    fontWeight: isSelected ? 700 : 500,
                    fontSize: '0.825rem',
                    borderRadius: 2,
                    px: 0.5,
                    transition: 'all 0.2s ease',
                  }}
                />
              )
            })}
          </Box>
        )}

        {/* --- SORT MODE --- */}
        {navMode === 'sort' && (
          <Stack
            direction="row"
            spacing={1}
            sx={{
              overflowX: 'auto',
              scrollbarWidth: 'none',
              '&::-webkit-scrollbar': { display: 'none' },
              flexGrow: 1,
              alignItems: 'center',
            }}
          >
            <Chip
              icon={<ArrowDownwardRoundedIcon fontSize="small" />}
              label="Newest First"
              clickable
              onClick={() => {
                onSortChange('newest')
              }}
              color={sortOrder === 'newest' ? 'primary' : 'default'}
              variant={sortOrder === 'newest' ? 'filled' : 'outlined'}
              size="small"
            />
            <Chip
              icon={<ArrowUpwardRoundedIcon fontSize="small" />}
              label="Oldest First"
              clickable
              onClick={() => {
                onSortChange('oldest')
              }}
              color={sortOrder === 'oldest' ? 'primary' : 'default'}
              variant={sortOrder === 'oldest' ? 'filled' : 'outlined'}
              size="small"
            />
            <Chip
              icon={<SortByAlphaRoundedIcon fontSize="small" />}
              label="Title A-Z"
              clickable
              onClick={() => {
                onSortChange('title-asc')
              }}
              color={sortOrder === 'title-asc' ? 'primary' : 'default'}
              variant={sortOrder === 'title-asc' ? 'filled' : 'outlined'}
              size="small"
            />
            <Chip
              icon={<SortByAlphaRoundedIcon fontSize="small" />}
              label="Title Z-A"
              clickable
              onClick={() => {
                onSortChange('title-desc')
              }}
              color={sortOrder === 'title-desc' ? 'primary' : 'default'}
              variant={sortOrder === 'title-desc' ? 'filled' : 'outlined'}
              size="small"
            />
          </Stack>
        )}

        {/* --- SETTINGS MODE (Theme toggle & Platform selector) --- */}
        {navMode === 'settings' && (
          <Stack
            direction="row"
            spacing={1.5}
            sx={{
              flexGrow: 1,
              justifyContent: 'space-around',
              alignItems: 'center',
            }}
          >
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                onOpenPlatformModal()
              }}
              startIcon={<HeadsetRoundedIcon fontSize="small" />}
              sx={{
                borderRadius: 3,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.85rem',
              }}
            >
              {selectedPlatform ? selectedPlatform.toUpperCase() : 'Preferred Platform'}
            </Button>

            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                onToggleTheme()
              }}
              startIcon={
                darkMode ? (
                  <LightModeRoundedIcon fontSize="small" color="warning" />
                ) : (
                  <DarkModeRoundedIcon fontSize="small" />
                )
              }
              sx={{
                borderRadius: 3,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.85rem',
              }}
            >
              {darkMode ? 'Light Theme' : 'Dark Theme'}
            </Button>
          </Stack>
        )}
      </Paper>
    </Container>
  )
}
