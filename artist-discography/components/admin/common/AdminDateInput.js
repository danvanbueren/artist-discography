'use client'

import { memo, useMemo } from 'react'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs from 'dayjs'
import { DIRTY_FIELD_SX, SAVED_FIELD_SX, DEFAULT_FIELD_SX } from '../adminConstants'

const AdminDateInput = memo(function AdminDateInput({
  label = 'Release Date',
  value,
  onChange,
  required,
  size = 'small',
  fullWidth = true,
  error,
  warning,
  helperText,
  isDirty,
  isSaved,
  sx,
  format = 'DD-MMM-YYYY',
  ...rest
}) {
  const dateValue = useMemo(() => {
    if (!value) return null
    const parsed = dayjs(value)
    return parsed.isValid() ? parsed : null
  }, [value])

  const handleChange = (newValue) => {
    if (!newValue) {
      onChange?.('')
    } else if (newValue.isValid && newValue.isValid()) {
      onChange?.(newValue.format('YYYY-MM-DD'))
    }
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
    : warning
      ? {
          ...fieldSx,
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'rgba(255, 179, 0, 0.06)',
            '& fieldset': {
              borderColor: '#fbbf24 !important',
              borderWidth: 1.5,
            },
          },
          '& .MuiFormHelperText-root': {
            color: '#fbbf24 !important',
          },
          ...sx,
        }
      : {
          ...fieldSx,
          ...sx,
        }

  return (
    <DatePicker
      label={label}
      value={dateValue}
      onChange={handleChange}
      format={format}
      slotProps={{
        textField: {
          size,
          fullWidth,
          required,
          error,
          helperText,
          sx: combinedSx,
        },
      }}
      {...rest}
    />
  )
})

export default AdminDateInput
