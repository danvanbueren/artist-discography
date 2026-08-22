'use client'

import { Box, Chip } from '@mui/material'
import ArrowDownwardRoundedIcon from '@mui/icons-material/ArrowDownwardRounded'
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded'
import SortByAlphaRoundedIcon from '@mui/icons-material/SortByAlphaRounded'

/**
 * Sort mode toolbar with options (Newest, Oldest, Title A-Z, Title Z-A).
 *
 * @param {Object} props
 * @param {string} props.sortOrder - Current sort order key
 * @param {Function} props.onSortChange - Sort change handler
 * @param {Object} props.sortDrag - useDragScroll object
 */
export default function NavBarSortBar({ sortOrder = 'newest', onSortChange, sortDrag }) {
  return (
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
        label='Newest First'
        clickable
        onClick={() => {
          if (sortDrag.hasDraggedRef.current) return
          onSortChange('newest')
        }}
        color={sortOrder === 'newest' ? 'primary' : 'default'}
        variant={sortOrder === 'newest' ? 'filled' : 'outlined'}
        size='medium'
        sx={{ flexShrink: 0, height: 38, px: 1, fontSize: '0.875rem', userSelect: 'none' }}
      />
      <Chip
        icon={<ArrowUpwardRoundedIcon />}
        label='Oldest First'
        clickable
        onClick={() => {
          if (sortDrag.hasDraggedRef.current) return
          onSortChange('oldest')
        }}
        color={sortOrder === 'oldest' ? 'primary' : 'default'}
        variant={sortOrder === 'oldest' ? 'filled' : 'outlined'}
        size='medium'
        sx={{ flexShrink: 0, height: 38, px: 1, fontSize: '0.875rem', userSelect: 'none' }}
      />
      <Chip
        icon={<SortByAlphaRoundedIcon />}
        label='Title A-Z'
        clickable
        onClick={() => {
          if (sortDrag.hasDraggedRef.current) return
          onSortChange('title-asc')
        }}
        color={sortOrder === 'title-asc' ? 'primary' : 'default'}
        variant={sortOrder === 'title-asc' ? 'filled' : 'outlined'}
        size='medium'
        sx={{ flexShrink: 0, height: 38, px: 1, fontSize: '0.875rem', userSelect: 'none' }}
      />
      <Chip
        icon={<SortByAlphaRoundedIcon />}
        label='Title Z-A'
        clickable
        onClick={() => {
          if (sortDrag.hasDraggedRef.current) return
          onSortChange('title-desc')
        }}
        color={sortOrder === 'title-desc' ? 'primary' : 'default'}
        variant={sortOrder === 'title-desc' ? 'filled' : 'outlined'}
        size='medium'
        sx={{ flexShrink: 0, height: 38, px: 1, fontSize: '0.875rem', userSelect: 'none' }}
      />
    </Box>
  )
}
