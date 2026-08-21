'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  Typography,
  IconButton,
  InputAdornment,
  CircularProgress,
  Box,
  Chip,
  Fade,
} from '@mui/material'
import LockRoundedIcon from '@mui/icons-material/LockRounded'
import LockOpenRoundedIcon from '@mui/icons-material/LockOpenRounded'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import LockResetRoundedIcon from '@mui/icons-material/LockResetRounded'

export default function PrivateAccessModal({
  open,
  onClose,
  isAuthenticated,
  onAuthenticate,
  onLock,
  onShowToast,
}) {
  const [accessCode, setAccessCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) {
      setAccessCode('')
      setError('')
      setShowPassword(false)
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus()
        }
      }, 100)
    }
  }, [open])

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault()
    if (!accessCode.trim()) {
      setError('Please enter an access code')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/private-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessCode: accessCode.trim() }),
      })

      const data = await res.json().catch(() => ({}))

      if (res.ok && data.success) {
        if (onAuthenticate) {
          onAuthenticate()
        }
        if (onShowToast) {
          onShowToast('Private access unlocked!')
        }
        onClose()
      } else {
        setError(data.error || 'Invalid private access code')
      }
    } catch (err) {
      setError('Failed to verify access code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleLock = async () => {
    setLoading(true)
    try {
      await fetch('/api/auth/private-access', { method: 'DELETE' })
      if (onLock) {
        onLock()
      }
      if (onShowToast) {
        onShowToast('Private access locked')
      }
      onClose()
    } catch (err) {
      if (onLock) {
        onLock()
      }
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth='xs'
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 4,
            p: { xs: 1.5, sm: 2 },
            bgcolor: 'background.paper',
            backgroundImage: 'none',
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 24px 48px rgba(0, 0, 0, 0.4)',
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          m: 0,
          p: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Stack direction='row' spacing={1.5} sx={{ alignItems: 'center' }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: isAuthenticated ? 'rgba(76, 175, 80, 0.15)' : 'rgba(144, 202, 249, 0.15)',
              color: isAuthenticated ? 'success.main' : 'primary.main',
            }}
          >
            {isAuthenticated ? (
              <LockOpenRoundedIcon fontSize='small' />
            ) : (
              <LockRoundedIcon fontSize='small' />
            )}
          </Box>
          <Typography variant='h6' sx={{ fontWeight: 800 }}>
            Private Access
          </Typography>
        </Stack>
        <IconButton aria-label='close' onClick={onClose} sx={{ color: 'text.secondary', p: 0.5 }}>
          <CloseRoundedIcon fontSize='small' />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 1.5, pt: 1 }}>
        {isAuthenticated ? (
          <Stack spacing={2.5} sx={{ py: 1, alignItems: 'center', textAlign: 'center' }}>
            <Chip
              icon={<CheckCircleRoundedIcon />}
              label='Private Access Unlocked'
              color='success'
              sx={{ fontWeight: 700, px: 1, py: 2, borderRadius: 2 }}
            />
            <Typography variant='body2' color='text.secondary'>
              Private tracks and unreleased audio playback are currently unlocked for this device
              session.
            </Typography>
          </Stack>
        ) : (
          <Box component='form' onSubmit={handleSubmit} noValidate sx={{ mt: 0.5 }}>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
              Enter the private access code to reveal hidden tracks and unlock audio streaming for
              uncleared releases.
            </Typography>
            <TextField
              inputRef={inputRef}
              fullWidth
              size='small'
              type={showPassword ? 'text' : 'password'}
              label='Access Code'
              placeholder='Enter private code'
              value={accessCode}
              onChange={(e) => {
                setAccessCode(e.target.value)
                if (error) setError('')
              }}
              error={Boolean(error)}
              helperText={error || ' '}
              autoComplete='off'
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position='end'>
                      <IconButton
                        size='small'
                        onClick={() => setShowPassword((prev) => !prev)}
                        edge='end'
                        sx={{ color: 'text.secondary' }}
                      >
                        {showPassword ? (
                          <VisibilityOffRoundedIcon fontSize='small' />
                        ) : (
                          <VisibilityRoundedIcon fontSize='small' />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 1.5, pt: 0, justifyContent: 'space-between' }}>
        <Button
          onClick={onClose}
          size='medium'
          variant='outlined'
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 2,
            borderColor: 'divider',
            color: 'text.primary',
            '&:hover': {
              borderColor: 'text.primary',
              bgcolor: 'action.hover',
            },
          }}
        >
          Cancel
        </Button>

        {isAuthenticated ? (
          <Button
            onClick={handleLock}
            disabled={loading}
            variant='outlined'
            color='warning'
            startIcon={loading ? <CircularProgress size={16} /> : <LockResetRoundedIcon />}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
          >
            Lock Access
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={loading || !accessCode.trim()}
            variant='contained'
            color='primary'
            startIcon={
              loading ? <CircularProgress size={16} color='inherit' /> : <LockOpenRoundedIcon />
            }
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: 2,
              px: 2.5,
            }}
          >
            Unlock
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}
