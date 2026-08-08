'use client'

import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import theme from './theme'

export default function Providers({ children }) {
    return (
        <ThemeProvider theme={theme}>
            <Analytics />
            <CssBaseline />
            {children}
        </ThemeProvider>
    )
}
