'use client'

import { memo } from 'react'
import { TextField } from '@mui/material'
import { DIRTY_FIELD_SX, SAVED_FIELD_SX, DEFAULT_FIELD_SX } from '../adminConstants'

const AdminTextInput = memo(function AdminTextInput({
  label,
  value,
  onChange,
  placeholder,
  required,
  type,
  size = 'small',
  fullWidth = true,
  multiline,
  rows,
  error,
  helperText,
  isDirty,
  isSaved,
  slotProps,
  sx,
  ...rest
}) {
  const handleChange = (e) => {
    onChange?.(e.target.value)
  }

  const fieldSx = isDirty ? DIRTY_FIELD_SX : isSaved ? SAVED_FIELD_SX : DEFAULT_FIELD_SX
  const combinedSx = error
    ? {
        ...fieldSx,
        '& .MuiOutlinedInput-root': {
          '& fieldset': {
            borderColor: '#f44336 !important',
            borderWidth: 2,
          },
        },
        ...sx,
      }
    : {
        ...fieldSx,
        ...sx,
      }

  return (
    <TextField
      label={label}
      value={value ?? ''}
      onChange={handleChange}
      placeholder={placeholder}
      required={required}
      type={type}
      size={size}
      fullWidth={fullWidth}
      multiline={multiline}
      rows={rows}
      error={error}
      helperText={helperText}
      slotProps={slotProps}
      sx={combinedSx}
      {...rest}
    />
  )
})

export default AdminTextInput
