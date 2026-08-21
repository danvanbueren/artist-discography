'use client'

import { memo, useState, useEffect, useRef, useCallback } from 'react'
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
  warning,
  helperText,
  isDirty,
  isSaved,
  slotProps,
  sx,
  debounceMs = 250,
  onBlur,
  onKeyDown,
  ...rest
}) {
  const [localValue, setLocalValue] = useState(value ?? '')
  const [prevValue, setPrevValue] = useState(value ?? '')
  const lastSyncedValueRef = useRef(value ?? '')
  const timerRef = useRef(null)
  const isTypingRef = useRef(false)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  // Synchronize incoming external value changes immediately during render (official React pattern)
  // This eliminates 180+ post-paint useEffect executions when switching projects.
  if (value !== prevValue) {
    setPrevValue(value)
    setLocalValue(value ?? '')
    lastSyncedValueRef.current = value ?? ''
    isTypingRef.current = false
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  // Cleanup pending timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  const flushChange = useCallback((val) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    isTypingRef.current = false
    lastSyncedValueRef.current = val
    onChangeRef.current?.(val)
  }, [])

  const handleChange = (e) => {
    const nextVal = e.target.value
    setLocalValue(nextVal)
    isTypingRef.current = true

    if (debounceMs <= 0) {
      flushChange(nextVal)
      return
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    timerRef.current = setTimeout(() => {
      timerRef.current = null
      isTypingRef.current = false
      lastSyncedValueRef.current = nextVal
      onChangeRef.current?.(nextVal)
    }, debounceMs)
  }

  const handleBlur = (e) => {
    if (timerRef.current) {
      flushChange(localValue)
    }
    onBlur?.(e)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !multiline) {
      if (timerRef.current) {
        flushChange(localValue)
      }
    }
    onKeyDown?.(e)
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
    <TextField
      label={label}
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
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
