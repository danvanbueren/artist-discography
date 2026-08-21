'use client'

import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
    },
    secondary: {
      main: '#f48fb1',
    },
    background: {
      default: '#0a0a0f',
      paper: '#13131c',
    },
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
    MuiModal: {
      defaultProps: {
        disableScrollLock: true,
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
        ':root': {
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255, 255, 255, 0.45) transparent',
        },
        html: {
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255, 255, 255, 0.45) transparent',
        },
        body: {
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255, 255, 255, 0.45) transparent',
        },
        '*': {
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255, 255, 255, 0.45) transparent',
        },
        '::-webkit-scrollbar': {
          width: '8px',
          height: '8px',
          background: 'transparent !important',
          backgroundColor: 'transparent !important',
        },
        '*::-webkit-scrollbar': {
          width: '8px',
          height: '8px',
          background: 'transparent !important',
          backgroundColor: 'transparent !important',
        },
        '::-webkit-scrollbar-track': {
          background: 'transparent !important',
          backgroundColor: 'transparent !important',
        },
        '*::-webkit-scrollbar-track': {
          background: 'transparent !important',
          backgroundColor: 'transparent !important',
        },
        '::-webkit-scrollbar-track-piece': {
          background: 'transparent !important',
          backgroundColor: 'transparent !important',
        },
        '*::-webkit-scrollbar-track-piece': {
          background: 'transparent !important',
          backgroundColor: 'transparent !important',
        },
        '::-webkit-scrollbar-corner': {
          background: 'transparent !important',
          backgroundColor: 'transparent !important',
        },
        '*::-webkit-scrollbar-corner': {
          background: 'transparent !important',
          backgroundColor: 'transparent !important',
        },
        '::-webkit-scrollbar-thumb': {
          background: 'rgba(255, 255, 255, 0.45) !important',
          backgroundColor: 'rgba(255, 255, 255, 0.45) !important',
          borderRadius: '99px',
        },
        '*::-webkit-scrollbar-thumb': {
          background: 'rgba(255, 255, 255, 0.45) !important',
          backgroundColor: 'rgba(255, 255, 255, 0.45) !important',
          borderRadius: '99px',
        },
        '::-webkit-scrollbar-thumb:hover': {
          background: 'rgba(255, 255, 255, 0.75) !important',
          backgroundColor: 'rgba(255, 255, 255, 0.75) !important',
        },
        '*::-webkit-scrollbar-thumb:hover': {
          background: 'rgba(255, 255, 255, 0.75) !important',
          backgroundColor: 'rgba(255, 255, 255, 0.75) !important',
        },
        '::-webkit-scrollbar-button': {
          display: 'none !important',
          width: 0,
          height: 0,
        },
        '*::-webkit-scrollbar-button': {
          display: 'none !important',
          width: 0,
          height: 0,
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
