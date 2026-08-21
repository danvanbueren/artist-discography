'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { DIRTY_FIELD_SX, SAVED_FIELD_SX, DEFAULT_FIELD_SX } from '../adminConstants'

export function useAutoSave(editNameRef = null) {
  const [dirtyFields, setDirtyFields] = useState(new Set())
  const [savedFields, setSavedFields] = useState(new Set())
  const [isAutoSaving, setIsAutoSaving] = useState(false)
  const [autoSaveActionText, setAutoSaveActionText] = useState('Auto-saving changes...')
  const [lastSavedTime, setLastSavedTime] = useState(null)
  const [loadedTime, setLoadedTime] = useState(null)

  // Global Status Messages
  const [statusMessage, setStatusMessage] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    setLoadedTime(new Date().toLocaleTimeString())
  }, [])

  const dirtyFieldsRef = useRef(dirtyFields)
  useEffect(() => {
    dirtyFieldsRef.current = dirtyFields
  }, [dirtyFields])

  const autoSaveDebounceRef = useRef(null)
  const savedHighlightTimeoutRef = useRef(null)
  const isSavingInFlightRef = useRef(false)
  const pendingSaveTaskRef = useRef(null)

  // Auto-dismiss transient messages
  useEffect(() => {
    if (!statusMessage) return
    const timer = setTimeout(() => {
      setStatusMessage(null)
    }, 5000)
    return () => clearTimeout(timer)
  }, [statusMessage])

  useEffect(() => {
    if (!errorMessage) return
    const timer = setTimeout(() => {
      setErrorMessage('')
    }, 6000)
    return () => clearTimeout(timer)
  }, [errorMessage])

  // Cleanup pending timeouts on unmount
  useEffect(() => {
    return () => {
      if (autoSaveDebounceRef.current) {
        clearTimeout(autoSaveDebounceRef.current)
      }
      if (savedHighlightTimeoutRef.current) {
        clearTimeout(savedHighlightTimeoutRef.current)
      }
      pendingSaveTaskRef.current = null
      isSavingInFlightRef.current = false
    }
  }, [])

  // Core sequential save executor
  const executeSaveQueue = useCallback(
    async (saveCallback) => {
      if (isSavingInFlightRef.current) {
        // An HTTP save request is already in flight. Queue the latest saveCallback to run immediately upon completion.
        pendingSaveTaskRef.current = saveCallback
        return
      }

      isSavingInFlightRef.current = true
      setIsAutoSaving(true)

      const snapshotKeys = Array.from(dirtyFieldsRef.current)
      let actionLabel = 'Auto-saving changes...'
      if (snapshotKeys.some((k) => k.includes('audio'))) {
        actionLabel = 'Uploading & saving audio...'
      } else if (snapshotKeys.some((k) => k.includes('cover'))) {
        actionLabel = 'Uploading & saving cover...'
      } else if (snapshotKeys.some((k) => k.includes('logo'))) {
        actionLabel = 'Uploading & saving logo...'
      } else if (snapshotKeys.some((k) => k.startsWith('new_'))) {
        actionLabel = 'Saving new project...'
      } else if (
        snapshotKeys.some(
          (k) =>
            k === 'artistName' ||
            k === 'artistBio' ||
            k === 'siteUrl' ||
            k === 'privateAccessCode' ||
            k === 'adminAccess' ||
            k === 'adminPassword' ||
            k.startsWith('platform_') ||
            k.startsWith('social_'),
        )
      ) {
        actionLabel = 'Saving settings & profile...'
      } else if (snapshotKeys.some((k) => k.startsWith('edit_'))) {
        const currentEditName = editNameRef?.current?.trim?.()
        actionLabel = currentEditName
          ? `Saving "${currentEditName}"...`
          : 'Saving project changes...'
      }

      setAutoSaveActionText(actionLabel)

      let success = false
      try {
        success = await saveCallback()
      } catch (err) {
        setErrorMessage(`Save error: ${err.message}`)
        success = false
      } finally {
        isSavingInFlightRef.current = false
        setIsAutoSaving(false)
      }

      if (success) {
        setLastSavedTime(new Date().toLocaleTimeString())
        setDirtyFields((prev) => {
          const next = new Set(prev)
          snapshotKeys.forEach((k) => next.delete(k))
          return next
        })
        snapshotKeys.forEach((k) => dirtyFieldsRef.current.delete(k))
        setSavedFields((prev) => {
          const next = new Set(prev)
          snapshotKeys.forEach((k) => next.add(k))
          return next
        })

        if (savedHighlightTimeoutRef.current) {
          clearTimeout(savedHighlightTimeoutRef.current)
        }
        savedHighlightTimeoutRef.current = setTimeout(() => {
          setSavedFields(new Set())
        }, 1500)
      } else {
        // Clear dirty fields after displaying error so UI does not hang in "Unsaved changes"
        setTimeout(() => {
          setDirtyFields((prev) => {
            const next = new Set(prev)
            snapshotKeys.forEach((k) => next.delete(k))
            return next
          })
          snapshotKeys.forEach((k) => dirtyFieldsRef.current.delete(k))
        }, 2500)
      }

      // If another save was queued while this save was in flight, execute it sequentially now
      if (pendingSaveTaskRef.current) {
        const nextTask = pendingSaveTaskRef.current
        pendingSaveTaskRef.current = null
        // Small pause to let DOM and network settle before running next queued request
        setTimeout(() => {
          executeSaveQueue(nextTask)
        }, 50)
      }
    },
    [editNameRef],
  )

  const markFieldDirty = useCallback(
    (fieldKey, saveCallback, delayMs = 1000) => {
      if (fieldKey) {
        dirtyFieldsRef.current.add(fieldKey)
      }
      setDirtyFields((prev) => {
        if (prev.has(fieldKey)) return prev
        const next = new Set(prev)
        next.add(fieldKey)
        return next
      })
      setSavedFields((prev) => {
        if (!prev.has(fieldKey)) return prev
        const next = new Set(prev)
        next.delete(fieldKey)
        return next
      })

      // If an upload or high-priority action is triggered (delayMs <= 200), don't postpone it with longer delays
      const isUploadField =
        fieldKey &&
        (fieldKey.includes('audio') || fieldKey.includes('cover') || fieldKey.includes('logo'))
      const effectiveDelay = isUploadField ? Math.min(delayMs, 100) : delayMs

      if (autoSaveDebounceRef.current) {
        clearTimeout(autoSaveDebounceRef.current)
      }

      autoSaveDebounceRef.current = setTimeout(() => {
        autoSaveDebounceRef.current = null
        executeSaveQueue(saveCallback)
      }, effectiveDelay)
    },
    [executeSaveQueue],
  )

  const clearPendingAutoSave = useCallback(() => {
    if (autoSaveDebounceRef.current) {
      clearTimeout(autoSaveDebounceRef.current)
      autoSaveDebounceRef.current = null
    }
    pendingSaveTaskRef.current = null
    dirtyFieldsRef.current = new Set()
    setDirtyFields(new Set())
    setSavedFields(new Set())
  }, [])

  const getFieldSx = useCallback(
    (fieldKey) => {
      if (dirtyFields.has(fieldKey)) return DIRTY_FIELD_SX
      if (savedFields.has(fieldKey)) return SAVED_FIELD_SX
      return DEFAULT_FIELD_SX
    },
    [dirtyFields, savedFields],
  )

  return {
    dirtyFields,
    setDirtyFields,
    savedFields,
    setSavedFields,
    isAutoSaving,
    autoSaveActionText,
    lastSavedTime,
    loadedTime,
    statusMessage,
    setStatusMessage,
    errorMessage,
    setErrorMessage,
    markFieldDirty,
    clearPendingAutoSave,
    getFieldSx,
  }
}
