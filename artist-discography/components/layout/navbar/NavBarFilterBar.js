'use client'

import { Box, Chip } from '@mui/material'

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

/**
 * Filter mode toolbar with horizontally scrollable release type chips.
 *
 * @param {Object} props
 * @param {Array} props.activeTypes - Selected release type strings
 * @param {Function} props.onToggleType - Toggle release type handler
 * @param {Object} props.filterDrag - useDragScroll object
 */
export default function NavBarFilterBar({ activeTypes = [], onToggleType, filterDrag }) {
  return (
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
            size='medium'
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
  )
}
