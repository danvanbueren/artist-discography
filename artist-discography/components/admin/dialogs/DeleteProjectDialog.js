'use client'

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
} from '@mui/material'

export default function DeleteProjectDialog({
  open,
  onClose,
  projectName,
  onConfirmDelete,
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
            backgroundColor: 'rgba(25, 25, 35, 0.95)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            p: 1,
            maxWidth: 450,
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          textAlign: 'center',
          pt: 3,
          color: 'error.main',
          fontWeight: 700,
        }}
      >
        Delete Project?
      </DialogTitle>
      <DialogContent sx={{ textAlign: 'center' }}>
        <Typography variant="body1">
          Are you sure you want to delete <strong>{projectName || 'this project'}</strong> from your discography? This action cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions
        sx={{
          justifyContent: 'center',
          pb: 3,
          px: 3,
          gap: 1.5,
        }}
      >
        <Button
          variant="outlined"
          onClick={onClose}
          sx={{ borderRadius: 2 }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={onConfirmDelete}
          sx={{ borderRadius: 2 }}
        >
          Confirm Delete
        </Button>
      </DialogActions>
    </Dialog>
  )
}
