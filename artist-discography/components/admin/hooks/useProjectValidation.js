'use client'

import { useMemo } from 'react'
import { getProjectNameValidationError, getDuplicateTrackSlugIndexes } from '../adminUtils'
import { EMPTY_SET } from '../adminConstants'

/**
 * Custom hook providing deferred validation checks for project names and track duplicate slugs.
 */
export function useProjectValidation({
  isCreatingNew,
  isPendingProjectSwitch,
  isSwitchingProject = false,
  projectsList = [],
  selectedProjIndex = 0,
  name = '',
  tracks = [],
  editName = '',
  editTracks = [],
}) {
  const isSwitching = isPendingProjectSwitch || isSwitchingProject

  const editNameValidationError = useMemo(() => {
    if (
      isCreatingNew ||
      isSwitching ||
      selectedProjIndex < 0 ||
      selectedProjIndex >= projectsList.length
    ) {
      return null
    }
    return getProjectNameValidationError(editName, projectsList, selectedProjIndex)
  }, [isCreatingNew, isSwitching, editName, projectsList, selectedProjIndex])

  const isEditNameDuplicate = useMemo(
    () => Boolean(editNameValidationError),
    [editNameValidationError],
  )

  const editDupTrackIndexes = useMemo(() => {
    if (isCreatingNew || isSwitching) return EMPTY_SET
    return getDuplicateTrackSlugIndexes(editTracks)
  }, [isCreatingNew, isSwitching, editTracks])

  const newNameValidationError = useMemo(
    () => (isCreatingNew ? getProjectNameValidationError(name, projectsList, -1) : null),
    [isCreatingNew, name, projectsList],
  )

  const isNewNameDuplicate = useMemo(
    () => Boolean(newNameValidationError),
    [newNameValidationError],
  )

  const newDupTrackIndexes = useMemo(
    () => (isCreatingNew ? getDuplicateTrackSlugIndexes(tracks) : EMPTY_SET),
    [isCreatingNew, tracks],
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
