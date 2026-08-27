'use client'

import React, { useState, useRef, useMemo } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import FormControl from '@mui/material/FormControl'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Tooltip from '@mui/material/Tooltip'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import BookmarkAddIcon from '@mui/icons-material/BookmarkAdd'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import { DEFAULT_TEMPLATE, AVAILABLE_TOKENS, BUILTIN_PRESETS } from '@/lib/data/templateEngine'

/**
 * Editor interface for customizing layout templates with token chips and preset management.
 *
 * @param {Object} props
 * @param {string} props.template - Current template value
 * @param {Function} props.onChange - Template change callback
 * @param {Array<Object>} props.customPresets - User-saved custom presets
 * @param {Function} props.onSavePreset - Callback to save preset
 * @param {Function} props.onDeletePreset - Callback to delete preset
 * @param {Function} props.onResetDefault - Callback to reset to default template
 */
export default function TemplateEditor({
  template,
  onChange,
  customPresets = [],
  onSavePreset,
  onDeletePreset,
  onResetDefault,
}) {
  const textareaRef = useRef(null)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [presetNameInput, setPresetNameInput] = useState('')

  const allPresets = useMemo(() => [...BUILTIN_PRESETS, ...customPresets], [customPresets])

  // Automatically detect matching preset based on current template content
  const currentPresetId = useMemo(() => {
    const trimmedTemplate = (template || '').trim()
    const match = allPresets.find((p) => (p.template || '').trim() === trimmedTemplate)
    return match ? match.id : 'custom'
  }, [template, allPresets])

  const handleSelectPreset = (presetId) => {
    if (presetId === 'custom') return
    const found = allPresets.find((p) => p.id === presetId)
    if (found && found.template) {
      onChange(found.template)
    }
  }

  const handleInsertToken = (tokenStr) => {
    const el = textareaRef.current
    if (!el) {
      onChange((template || '') + tokenStr)
      return
    }

    const start = el.selectionStart ?? el.value.length
    const end = el.selectionEnd ?? el.value.length
    const currentVal = template || ''
    const updated = currentVal.substring(0, start) + tokenStr + currentVal.substring(end)
    onChange(updated)

    setTimeout(() => {
      el.focus()
      el.setSelectionRange(start + tokenStr.length, start + tokenStr.length)
    }, 0)
  }

  const handleOpenSaveDialog = () => {
    setPresetNameInput('')
    setSaveDialogOpen(true)
  }

  const handleConfirmSavePreset = () => {
    if (!presetNameInput.trim()) return
    const newPreset = {
      id: `custom-${Date.now()}`,
      name: presetNameInput.trim(),
      template: template,
    }
    if (onSavePreset) {
      onSavePreset(newPreset)
    }
    setSaveDialogOpen(false)
  }

  const handleDeleteSelectedPreset = () => {
    if (currentPresetId.startsWith('custom-') && onDeletePreset) {
      onDeletePreset(currentPresetId)
      onChange(DEFAULT_TEMPLATE)
    }
  }

  return (
    <Box
      sx={{
        backgroundColor: '#13131c',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 2,
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      {/* Top Presets Row */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1.5,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Typography variant='caption' sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600 }}>
            Preset:
          </Typography>
          <FormControl size='small' sx={{ minWidth: 200 }}>
            <Select
              value={currentPresetId}
              onChange={(e) => handleSelectPreset(e.target.value)}
              slotProps={{
                paper: {
                  sx: {
                    backgroundColor: '#13131c',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  },
                },
              }}
              sx={{
                backgroundColor: '#0a0a0f',
                borderRadius: 1.5,
                fontSize: '0.8rem',
                color: '#fff',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 255, 255, 0.15)',
                },
              }}
            >
              {currentPresetId === 'custom' && (
                <MenuItem
                  value='custom'
                  disabled
                  sx={{
                    fontStyle: 'italic',
                    color: 'rgba(255, 255, 255, 0.7)',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    fontSize: '0.8rem',
                  }}
                >
                  ✏️ Custom Layout
                </MenuItem>
              )}

              <MenuItem disabled sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>
                Built-in Presets
              </MenuItem>
              {BUILTIN_PRESETS.map((p) => (
                <MenuItem key={p.id} value={p.id} sx={{ fontSize: '0.8rem' }}>
                  {p.name}
                </MenuItem>
              ))}

              {customPresets.length > 0 && (
                <MenuItem
                  disabled
                  sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', mt: 1 }}
                >
                  Saved Custom Presets
                </MenuItem>
              )}
              {customPresets.map((p) => (
                <MenuItem key={p.id} value={p.id} sx={{ fontSize: '0.8rem' }}>
                  ⭐ {p.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {currentPresetId.startsWith('custom-') && (
            <Button
              size='small'
              color='error'
              variant='outlined'
              startIcon={<DeleteIcon fontSize='small' />}
              onClick={handleDeleteSelectedPreset}
              sx={{ textTransform: 'none', borderRadius: 1.5, fontSize: '0.75rem', px: 1 }}
            >
              Delete
            </Button>
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            size='small'
            variant='outlined'
            startIcon={<BookmarkAddIcon fontSize='small' />}
            onClick={handleOpenSaveDialog}
            sx={{ textTransform: 'none', borderRadius: 1.5, fontSize: '0.75rem' }}
          >
            Save Preset
          </Button>

          <Button
            size='small'
            color='secondary'
            variant='outlined'
            startIcon={<RestartAltIcon fontSize='small' />}
            onClick={() => {
              if (onResetDefault) onResetDefault()
              onChange(DEFAULT_TEMPLATE)
            }}
            sx={{ textTransform: 'none', borderRadius: 1.5, fontSize: '0.75rem' }}
          >
            Reset
          </Button>
        </Box>
      </Box>

      {/* Variable Token Pills */}
      <Box>
        <Typography
          variant='caption'
          sx={{
            display: 'block',
            color: 'rgba(255, 255, 255, 0.6)',
            mb: 0.75,
            fontWeight: 500,
          }}
        >
          Click token to insert:
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
          {AVAILABLE_TOKENS.map((item) => (
            <Tooltip
              key={item.token}
              title={`${item.description} (e.g. "${item.example}")`}
              arrow
              placement='top'
            >
              <Chip
                icon={<AddIcon sx={{ fontSize: '13px !important' }} />}
                label={item.label}
                clickable
                size='small'
                onClick={() => handleInsertToken(item.token)}
                sx={{
                  backgroundColor: 'rgba(144, 202, 249, 0.08)',
                  color: '#90caf9',
                  border: '1px solid rgba(144, 202, 249, 0.25)',
                  fontSize: '0.725rem',
                  height: 24,
                  fontFamily: 'ui-monospace, monospace',
                  borderRadius: 1.5,
                  '&:hover': {
                    backgroundColor: 'rgba(144, 202, 249, 0.2)',
                    borderColor: '#90caf9',
                  },
                }}
              />
            </Tooltip>
          ))}
        </Box>
      </Box>

      {/* Multiline Template Text Field */}
      <Box>
        <Typography
          variant='caption'
          sx={{
            display: 'block',
            color: 'rgba(255, 255, 255, 0.6)',
            mb: 0.75,
            fontWeight: 500,
          }}
        >
          Template Structure:
        </Typography>

        <TextField
          inputRef={textareaRef}
          multiline
          minRows={5}
          maxRows={14}
          fullWidth
          value={template}
          onChange={(e) => onChange(e.target.value)}
          slotProps={{
            htmlInput: {
              sx: {
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                fontSize: '0.85rem',
                lineHeight: 1.5,
                color: '#eceff1',
              },
            },
          }}
          sx={{
            backgroundColor: '#0a0a0f',
            borderRadius: 1.5,
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(255, 255, 255, 0.12)',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(144, 202, 249, 0.4)',
            },
            '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#90caf9',
            },
          }}
        />
      </Box>

      {/* Save Preset Dialog */}
      <Dialog
        open={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        slotProps={{
          paper: {
            sx: {
              backgroundColor: '#13131c',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 2,
              p: 1,
              maxWidth: 380,
              width: '100%',
            },
          },
        }}
      >
        <DialogTitle sx={{ color: '#fff', pb: 1, fontSize: '1rem' }}>
          Save Custom Preset
        </DialogTitle>
        <DialogContent>
          <Typography
            variant='body2'
            sx={{ color: 'rgba(255, 255, 255, 0.6)', mb: 2, fontSize: '0.85rem' }}
          >
            Give your template layout a name so you can switch to it later.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            size='small'
            placeholder='e.g. Short Link Promo, TikTok Caption'
            value={presetNameInput}
            onChange={(e) => setPresetNameInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleConfirmSavePreset()
              }
            }}
            sx={{
              backgroundColor: '#0a0a0f',
              borderRadius: 1.5,
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setSaveDialogOpen(false)}
            sx={{ textTransform: 'none', color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.85rem' }}
          >
            Cancel
          </Button>
          <Button
            variant='contained'
            onClick={handleConfirmSavePreset}
            disabled={!presetNameInput.trim()}
            sx={{ textTransform: 'none', borderRadius: 1.5, fontSize: '0.85rem' }}
          >
            Save Preset
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
