'use client'

import { Box, Stack, Button, IconButton } from '@mui/material'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import TuneRoundedIcon from '@mui/icons-material/TuneRounded'
import SortRoundedIcon from '@mui/icons-material/SortRounded'
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded'
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'

/**
 * Main root toolbar buttons in FloatingNavBar (Top, Search, Filter, Sort, Settings).
 *
 * @param {Object} props
 * @param {boolean} props.showScrollTop - Display jump to top button
 * @param {Function} [props.onScrollToTop] - Top jump click handler
 * @param {boolean} props.isSearchActive - Query has text
 * @param {Function} props.onOpenSearch - Switch to search mode
 * @param {Function} props.onClearSearch - Clear query text
 * @param {boolean} props.isFilterActive - Active release type filters
 * @param {Function} props.onOpenFilter - Switch to filter mode
 * @param {Function} props.onResetFilter - Reset active types
 * @param {Function} props.onOpenSort - Switch to sort mode
 * @param {boolean} props.isStuttering - Stutter alert indicator
 * @param {Function} props.onOpenSettings - Switch to settings mode
 * @param {Object} props.mainDrag - useDragScroll object
 */
export default function NavBarMainToolbar({
  showScrollTop,
  onScrollToTop,
  isSearchActive,
  onOpenSearch,
  onClearSearch,
  isFilterActive,
  onOpenFilter,
  onResetFilter,
  onOpenSort,
  isStuttering,
  onOpenSettings,
  mainDrag,
}) {
  return (
    <Box
      ref={mainDrag.ref}
      {...mainDrag.bind}
      sx={{
        display: 'flex',
        gap: { xs: 0.75, sm: 1.5 },
        overflowX: 'auto',
        py: 0.5,
        px: 0.5,
        minWidth: 0,
        width: '100%',
        alignItems: 'center',
        justifyContent: { xs: 'flex-start', sm: 'space-around' },
        cursor: mainDrag.isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': { display: 'none' },
      }}
    >
      {/* 1. TOP JUMP BUTTON */}
      {showScrollTop && (
        <Button
          size='medium'
          onClick={() => {
            if (mainDrag.hasDraggedRef.current) return
            if (onScrollToTop) onScrollToTop()
          }}
          startIcon={<ArrowUpwardRoundedIcon />}
          sx={{
            flexShrink: 0,
            whiteSpace: 'nowrap',
            textTransform: 'none',
            fontWeight: 600,
            fontSize: { xs: '0.85rem', sm: '0.95rem' },
            borderRadius: 3,
            px: { xs: 1.25, sm: 2 },
            py: 1,
            minWidth: 0,
            color: 'text.primary',
            '&:hover': { bgcolor: 'action.hover' },
          }}
        >
          Top
        </Button>
      )}

      {/* 2. SEARCH BUTTON & RESET */}
      <Stack direction='row' spacing={0.5} sx={{ alignItems: 'center', flexShrink: 0 }}>
        <Button
          size='medium'
          onClick={() => {
            if (mainDrag.hasDraggedRef.current) return
            onOpenSearch()
          }}
          startIcon={<SearchRoundedIcon />}
          sx={{
            flexShrink: 0,
            whiteSpace: 'nowrap',
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
            size='small'
            onClick={(e) => {
              e.stopPropagation()
              if (mainDrag.hasDraggedRef.current) return
              onClearSearch()
            }}
            sx={{
              p: 0.75,
              color: 'error.main',
              flexShrink: 0,
              '&:hover': { bgcolor: 'rgba(244, 67, 54, 0.15)' },
            }}
          >
            <DeleteOutlineRoundedIcon fontSize='small' />
          </IconButton>
        )}
      </Stack>

      {/* 3. FILTER BUTTON & RESET */}
      <Stack direction='row' spacing={0.5} sx={{ alignItems: 'center', flexShrink: 0 }}>
        <Button
          size='medium'
          onClick={() => {
            if (mainDrag.hasDraggedRef.current) return
            onOpenFilter()
          }}
          startIcon={<TuneRoundedIcon />}
          sx={{
            flexShrink: 0,
            whiteSpace: 'nowrap',
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
            size='small'
            onClick={(e) => {
              e.stopPropagation()
              if (mainDrag.hasDraggedRef.current) return
              onResetFilter()
            }}
            sx={{
              p: 0.75,
              color: 'error.main',
              flexShrink: 0,
              '&:hover': { bgcolor: 'rgba(244, 67, 54, 0.15)' },
            }}
          >
            <DeleteOutlineRoundedIcon fontSize='small' />
          </IconButton>
        )}
      </Stack>

      {/* 4. SORT BUTTON */}
      <Button
        size='medium'
        onClick={() => {
          if (mainDrag.hasDraggedRef.current) return
          onOpenSort()
        }}
        startIcon={<SortRoundedIcon />}
        sx={{
          flexShrink: 0,
          whiteSpace: 'nowrap',
          textTransform: 'none',
          fontWeight: 600,
          fontSize: { xs: '0.85rem', sm: '0.95rem' },
          borderRadius: 3,
          px: { xs: 1.25, sm: 2 },
          py: 1,
          minWidth: 0,
          color: 'text.primary',
          '&:hover': { bgcolor: 'action.hover' },
        }}
      >
        Sort
      </Button>

      {/* 5. SETTINGS BUTTON */}
      <Button
        size='medium'
        onClick={() => {
          if (mainDrag.hasDraggedRef.current) return
          onOpenSettings()
        }}
        startIcon={
          isStuttering ? (
            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
              <SettingsRoundedIcon />
              <Box
                sx={{
                  position: 'absolute',
                  top: -2,
                  right: -2,
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#fbbf24' : '#d97706'),
                  border: '1.5px solid',
                  borderColor: (theme) => (theme.palette.mode === 'dark' ? '#181822' : '#ffffff'),
                }}
              />
            </Box>
          ) : (
            <SettingsRoundedIcon />
          )
        }
        sx={{
          flexShrink: 0,
          whiteSpace: 'nowrap',
          textTransform: 'none',
          fontWeight: isStuttering ? 700 : 600,
          fontSize: { xs: '0.85rem', sm: '0.95rem' },
          borderRadius: 3,
          px: { xs: 1.25, sm: 2 },
          py: 1,
          minWidth: 0,
          color: isStuttering
            ? (theme) => (theme.palette.mode === 'dark' ? '#fbbf24' : '#d97706')
            : 'text.primary',
          '&:hover': { bgcolor: 'action.hover' },
        }}
      >
        Settings
      </Button>
    </Box>
  )
}
