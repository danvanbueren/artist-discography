'use client'

import { useMemo, useDeferredValue } from 'react'
import { getProjectNameValidationError, getDuplicateTrackSlugIndexes } from '../adminUtils'
import { EMPTY_SET } from '../adminConstants'

/**
 * Custom hook providing deferred validation checks for project names and track duplicate slugs.
 */
export function useProjectValidation({
  isCreatingNew,
  isPendingProjectSwitch,
  projectsList = [],
  selectedProjIndex = 0,
  name = '',
  tracks = [],
  editName = '',
  editTracks = [],
}) {
  const deferredEditTracks = useDeferredValue(editTracks)
  const deferredName = useDeferredValue(name)
  const deferredTracks = useDeferredValue(tracks)

  const editNameValidationError = useMemo(() => {
    if (isCreatingNew || isPendingProjectSwitch) return null
    return getProjectNameValidationError(editName, projectsList, selectedProjIndex)
  }, [isCreatingNew, isPendingProjectSwitch, editName, projectsList, selectedProjIndex])

  const isEditNameDuplicate = useMemo(
    () => Boolean(editNameValidationError),
    [editNameValidationError],
  )

  const editDupTrackIndexes = useMemo(() => {
    if (isCreatingNew || isPendingProjectSwitch) return EMPTY_SET
    return getDuplicateTrackSlugIndexes(deferredEditTracks)
  }, [isCreatingNew, isPendingProjectSwitch, deferredEditTracks])

  const newNameValidationError = useMemo(
    () => (isCreatingNew ? getProjectNameValidationError(deferredName, projectsList, -1) : null),
    [isCreatingNew, deferredName, projectsList],
  )

  const isNewNameDuplicate = useMemo(
    () => Boolean(newNameValidationError),
    [newNameValidationError],
  )

  const newDupTrackIndexes = useMemo(
    () => (isCreatingNew ? getDuplicateTrackSlugIndexes(deferredTracks) : EMPTY_SET),
    [isCreatingNew, deferredTracks],
  )

  return {
    editNameValidationError,
    isEditNameDuplicate,
    editDupTrackIndexes,
    newNameValidationError,
    isNewNameDuplicate,
    newDupTrackIndexes,
  }
}
