'use client'

import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    mode: 'dark',
  },
  components: {
    MuiIconButton: {
      styleOverrides: {
        root: {
          position: 'relative',
          padding: '8px',
          '&::after': {
            content: '""',
            position: 'absolute',
            top: -6,
            left: -6,
            right: -6,
            bottom: -6,
          },
        },
        sizeSmall: {
          padding: '7px',
          '&::after': {
            content: '""',
            position: 'absolute',
            top: -5,
            left: -5,
            right: -5,
            bottom: -5,
          },
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        'html, body': {
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none',
        },
        'input, textarea, [contenteditable="true"]': {
          userSelect: 'text',
          WebkitUserSelect: 'text',
        },
      },
    },
  },
})

export default theme