import { createTheme } from '@mui/material/styles'

export const adminTheme = createTheme({
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
  typography: {
    fontFamily: 'Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
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
  },
})
