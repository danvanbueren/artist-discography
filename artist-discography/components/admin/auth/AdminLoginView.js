'use client'

import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material'
import LockIcon from '@mui/icons-material/Lock'
import HomeIcon from '@mui/icons-material/Home'

export default function AdminLoginView({
  password,
  setPassword,
  authError,
  setAuthError,
  isAuthLoading,
  handleLogin,
}) {
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
      <Container maxWidth="sm" sx={{ py: 10 }}>
        <Paper
          elevation={6}
          sx={{
            p: 4,
            borderRadius: 3,
            backgroundColor: 'rgba(20, 20, 28, 0.9)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              mb: 3,
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                backgroundColor: 'primary.dark',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2,
              }}
            >
              <LockIcon sx={{ fontSize: 32, color: 'primary.contrastText' }} />
            </Box>
            <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>
              Site Owner Portal
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              Enter password to unlock site management tools
            </Typography>
          </Box>

          {authError && (
            <Alert
              severity="error"
              onClose={() => setAuthError('')}
              sx={{ mb: 3 }}
            >
              {authError}
            </Alert>
          )}

          <Box
            component="form"
            onSubmit={handleLogin}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2.5,
            }}
          >
            <TextField
              label="Admin Password"
              type="password"
              variant="outlined"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
            />
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={isAuthLoading || !password}
              sx={{ py: 1.4, borderRadius: 2, fontWeight: 600 }}
            >
              {isAuthLoading ? <CircularProgress size={24} /> : 'Unlock Admin Panel'}
            </Button>
            <Button
              variant="text"
              startIcon={<HomeIcon />}
              href="/"
              sx={{ color: 'text.secondary', textTransform: 'none' }}
            >
              Back to Discography
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  )
}
