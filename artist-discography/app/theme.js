'use client'

import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    mode: 'dark',
  },
  components: {
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