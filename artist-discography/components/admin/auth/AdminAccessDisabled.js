'use client'

import { Box, Container, Paper, Typography, Alert, Button } from '@mui/material'
import LockIcon from '@mui/icons-material/Lock'
import HomeIcon from '@mui/icons-material/Home'

export default function AdminAccessDisabled() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        bgcolor: 'background.default',
        color: 'text.primary',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        boxSizing: 'border-box',
      }}
    >
      <Container maxWidth='md' sx={{ py: 8 }}>
        <Paper
          elevation={4}
          sx={{
            p: 4,
            borderRadius: 3,
            backgroundColor: 'rgba(20, 20, 25, 0.85)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            textAlign: 'center',
          }}
        >
          <LockIcon sx={{ fontSize: 56, color: 'error.main', mb: 2 }} />
          <Typography variant='h4' component='h1' sx={{ fontWeight: 700, mb: 2 }}>
            Admin Access Disabled
          </Typography>
          <Alert severity='warning' sx={{ mb: 4, textAlign: 'left' }}>
            Access to the admin portal is currently disabled. To enable access, set{' '}
            <code>&quot;adminAccess&quot;: true</code> in <code>data/config.json</code>.
          </Alert>
          <Button
            variant='contained'
            startIcon={<HomeIcon />}
            href='/'
            sx={{ borderRadius: 2, px: 3, py: 1 }}
          >
            Return to Discography
          </Button>
        </Paper>
      </Container>
    </Box>
  )
}
