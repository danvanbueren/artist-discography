'use client'

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from '@mui/material'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'

export default function CopyTrackDialog({
  open,
  onClose,
  trackToCopy,
  trackName,
  sourceProjectName,
  projectsList = [],
  copyTargetProjectIndex,
  selectedTargetIndex,
  onChangeTargetProjectIndex,
  onChangeTargetIndex,
  onConfirmCopy,
  onConfirm,
  isCopyingTrack,
  isCopying,
}) {
  const targetIndex = copyTargetProjectIndex ?? selectedTargetIndex ?? 0
  const handleTargetChange = onChangeTargetProjectIndex || onChangeTargetIndex
  const handleConfirm = onConfirmCopy || onConfirm
  const copying = Boolean(isCopyingTrack ?? isCopying)
  const displayTrackName = trackToCopy?.track?.name || trackName || 'Untitled Track'
  const sourceProjIdx = trackToCopy?.sourceProjectIndex
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
            p: 1.5,
            minWidth: 380,
            maxWidth: 500,
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          fontWeight: 700,
          pb: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <ContentCopyIcon color='primary' /> Copy Track to Another Project
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Typography variant='body2' sx={{ color: 'text.secondary', mb: 2 }}>
          Copying track <strong>&quot;{displayTrackName}&quot;</strong> into a destination project.
          Any audio file will also be duplicated as an independent copy.
        </Typography>

        <FormControl fullWidth size='small' sx={{ mt: 1 }}>
          <InputLabel id='target-project-label'>Destination Project</InputLabel>
          <Select
            labelId='target-project-label'
            label='Destination Project'
            value={targetIndex}
            onChange={(e) => handleTargetChange?.(Number(e.target.value))}
          >
            {projectsList.map((p, idx) => (
              <MenuItem key={idx} value={idx}>
                {p.name || `Project #${idx + 1}`} {idx === sourceProjIdx ? '(Current Project)' : ''}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button variant='outlined' onClick={onClose} sx={{ borderRadius: 2 }}>
          Cancel
        </Button>
        <Button
          variant='contained'
          color='primary'
          onClick={handleConfirm}
          disabled={copying || projectsList.length === 0}
          startIcon={copying ? <CircularProgress size={16} color='inherit' /> : <ContentCopyIcon />}
          sx={{ borderRadius: 2 }}
        >
          {copying ? 'Copying…' : 'Copy Track'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
