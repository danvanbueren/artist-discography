'use client'

import { Box, TextField, InputAdornment, IconButton } from '@mui/material'
import ClearRoundedIcon from '@mui/icons-material/ClearRounded'

/**
 * Expandable full-width search input for FloatingNavBar.
 *
 * @param {Object} props
 * @param {string} props.searchQuery - Current search query
 * @param {Function} props.onSearchChange - Query change handler
 * @param {Function} props.onFocus - Input focus handler
 * @param {Function} props.onBlur - Input blur handler
 * @param {Function} props.onCloseSearch - Exit search mode handler
 */
export default function NavBarSearchBar({
  searchQuery = '',
  onSearchChange,
  onFocus,
  onBlur,
  onCloseSearch,
}) {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <TextField
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            onCloseSearch()
          }
        }}
        placeholder='Search by title, artist, or track...'
        size='small'
        fullWidth
        autoFocus
        slotProps={{
          htmlInput: {
            sx: { py: 0.75, fontSize: '0.95rem' },
          },
          input: {
            sx: { height: 40 },
            endAdornment: searchQuery ? (
              <InputAdornment position='end'>
                <IconButton
                  size='small'
                  onMouseDown={(e) => {
                    e.preventDefault()
                    onSearchChange('')
                  }}
                >
                  <ClearRoundedIcon fontSize='small' />
                </IconButton>
              </InputAdornment>
            ) : null,
          },
        }}
      />
    </Box>
  )
}
