'use client'

import { useState } from 'react'
import {
  Box,
  Container,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  Button,
  Stack,
  useTheme,
} from '@mui/material'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import SortRoundedIcon from '@mui/icons-material/SortRounded'
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded'
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded'
import HeadsetRoundedIcon from '@mui/icons-material/HeadsetRounded'
import ClearRoundedIcon from '@mui/icons-material/ClearRounded'

const PROJECT_TYPES = ['All', 'Album', 'EP', 'Single', 'Collaboration']

export default function FloatingNavBar({
  activeType,
  onTypeChange,
  sortOrder,
  onSortChange,
  searchQuery,
  onSearchChange,
  darkMode,
  onToggleTheme,
  selectedPlatform,
  onOpenPlatformModal,
}) {
  const theme = useTheme()
  const [showSearch, setShowSearch] = useState(false)

  return (
    <Box
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 1100,
        py: 1.5,
        px: { xs: 1.5, sm: 3 },
        backdropFilter: 'blur(16px)',
        bgcolor: theme.palette.mode === 'dark'
          ? 'rgba(18, 18, 24, 0.85)'
          : 'rgba(255, 255, 255, 0.85)',
        borderBottom: '1px solid',
        borderColor: theme.palette.mode === 'dark'
          ? 'rgba(255, 255, 255, 0.08)'
          : 'rgba(0, 0, 0, 0.08)',
        transition: 'background-color 0.3s ease, border-color 0.3s ease',
      }}
    >
      <Container
        maxWidth="md"
        disableGutters
        sx={{
          display: 'flex',
          alignItems: 'center',
          justify: 'space-between',
          gap: 1.5,
        }}
      >
        {/* Left: Filter Chips */}
        <Box
          sx={{
            display: 'flex',
            gap: 0.75,
            overflowX: 'auto',
            py: 0.5,
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
            flexShrink: 1,
          }}
        >
          {PROJECT_TYPES.map(type => {
            const isSelected = activeType === type
            return (
              <Chip
                key={type}
                label={type === 'All' ? 'All Releases' : type}
                clickable
                onClick={() => onTypeChange(type)}
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

        {/* Right: Actions Stack */}
        <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', flexShrink: 0 }}>
          {/* Search Toggle / Input */}
          {showSearch ? (
            <TextField
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="Search projects & tracks..."
              size="small"
              autoFocus
              slotProps={{
                htmlInput: {
                  sx: { py: 0.5, px: 1, fontSize: '0.85rem' },
                },
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => {
                          onSearchChange('')
                          setShowSearch(false)
                        }}
                      >
                        <ClearRoundedIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ width: { xs: 160, sm: 220 } }}
            />
          ) : (
            <Tooltip title="Search Discography" arrow>
              <IconButton
                size="small"
                onClick={() => setShowSearch(true)}
                sx={{
                  bgcolor: searchQuery ? 'action.selected' : 'transparent',
                }}
              >
                <SearchRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          {/* Sort Toggle */}
          <Tooltip title={`Sorted: ${sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}`} arrow>
            <IconButton
              size="small"
              onClick={() => onSortChange(sortOrder === 'newest' ? 'oldest' : 'newest')}
              sx={{
                bgcolor: sortOrder === 'oldest' ? 'action.selected' : 'transparent',
              }}
            >
              <SortRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {/* Platform Selector Button */}
          <Tooltip title="Preferred Music Platform" arrow>
            <Button
              size="small"
              variant="outlined"
              onClick={onOpenPlatformModal}
              startIcon={<HeadsetRoundedIcon fontSize="small" />}
              sx={{
                borderRadius: 4,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.775rem',
                py: 0.25,
                px: 1.2,
                whiteSpace: 'nowrap',
                display: { xs: 'none', sm: 'inline-flex' },
              }}
            >
              {selectedPlatform ? selectedPlatform.toUpperCase() : 'Platform'}
            </Button>
          </Tooltip>

          {/* Mobile Platform Icon Button */}
          <Tooltip title="Preferred Music Platform" arrow>
            <IconButton
              size="small"
              onClick={onOpenPlatformModal}
              sx={{ display: { xs: 'inline-flex', sm: 'none' } }}
            >
              <HeadsetRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {/* Dark/Light Mode Toggle */}
          <Tooltip title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'} arrow>
            <IconButton size="small" onClick={onToggleTheme}>
              {darkMode ? (
                <LightModeRoundedIcon fontSize="small" color="warning" />
              ) : (
                <DarkModeRoundedIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
        </Stack>
      </Container>
    </Box>
  )
}
