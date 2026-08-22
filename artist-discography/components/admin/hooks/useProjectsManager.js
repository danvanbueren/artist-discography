'use client'

import { useState, useEffect, useRef, useCallback, useTransition } from 'react'
import { resolveOverrideArtist } from '../adminUtils'
import { useCreateProjectForm } from './useCreateProjectForm'
import { useEditProjectForm, formatProjectTracks } from './useEditProjectForm'
import { useProjectValidation } from './useProjectValidation'
import { useProjectOperations } from './useProjectOperations'

export { formatProjectTracks }

/**
 * useProjectsManager
 * Master state management hook orchestrating project catalog CRUD, form editing,
 * track additions/reorders, cross-project copying, and validations.
 */
export function useProjectsManager({
  initialData = {},
  defaultArtistName = 'Artist',
  artistData = {},
  artistNameInputRef,
  markFieldDirty,
  clearPendingAutoSave,
  setErrorMessage,
  setStatusMessage,
}) {
  const [projectsList, setProjectsList] = useState(() => initialData?.projects ?? [])
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const [selectedProjIndex, setSelectedProjIndex] = useState(0)
  const [isPendingProjectSwitch, startProjectTransition] = useTransition()

  const selectedProjIndexRef = useRef(selectedProjIndex)
  const isCreatingNewRef = useRef(isCreatingNew)
  useEffect(() => {
    selectedProjIndexRef.current = selectedProjIndex
  }, [selectedProjIndex])
  useEffect(() => {
    isCreatingNewRef.current = isCreatingNew
  }, [isCreatingNew])

  // 1. Create Project Form Hook
  const createForm = useCreateProjectForm({
    defaultArtistName,
    artistNameInputRef,
    artistData,
    markFieldDirty,
    setErrorMessage,
    setStatusMessage,
  })

  // 2. Edit Project Form Hook
  const editForm = useEditProjectForm({
    defaultArtistName,
    artistNameInputRef,
    artistData,
    markFieldDirty,
    setErrorMessage,
    setStatusMessage,
  })

  // 3. Validation Hook
  const validation = useProjectValidation({
    isCreatingNew,
    isPendingProjectSwitch,
    projectsList,
    selectedProjIndex,
    name: createForm.name,
    tracks: createForm.tracks,
    editName: editForm.editName,
    editTracks: editForm.editTracks,
  })

  // 4. Project Operations Hook (Delete, Copy, Reorder)
  const operations = useProjectOperations({
    projectsList,
    setProjectsList,
    selectedProjIndex,
    setSelectedProjIndex,
    setIsCreatingNew,
    defaultArtistName,
    artistNameInputRef,
    artistData,
    setEditName: editForm.setEditName,
    setEditType: editForm.setEditType,
    setEditArtist: editForm.setEditArtist,
    setEditDate: editForm.setEditDate,
    setEditCoverFile: editForm.setEditCoverFile,
    setEditCoverPreview: editForm.setEditCoverPreview,
    setEditTracks: editForm.setEditTracks,
    setErrorMessage,
    setStatusMessage,
  })

  // Sync initialData
  useEffect(() => {
    if (initialData?.projects) {
      setProjectsList(initialData.projects)
      if (initialData.projects.length === 0) {
        setIsCreatingNew(false)
        setSelectedProjIndex(-1)
      }
    }
  }, [initialData])

  const lastLoadedProjIndexRef = useRef(-1)

  // Select project handler
  const handleSelectProject = useCallback(
    (idx) => {
      if (idx < 0 || idx >= projectsList.length) return

      clearPendingAutoSave?.()
      setIsCreatingNew(false)
      isCreatingNewRef.current = false
      lastLoadedProjIndexRef.current = idx

      const proj = projectsList[idx]
      startProjectTransition(() => {
        setSelectedProjIndex(idx)
        selectedProjIndexRef.current = idx
        editForm.populateEditForm(proj)
      })
    },
    [projectsList, editForm, clearPendingAutoSave],
  )

  // Start create new project handler
  const handleStartCreateNewProject = useCallback(() => {
    clearPendingAutoSave?.()
    setSelectedProjIndex(-1)
    lastLoadedProjIndexRef.current = -1
    setIsCreatingNew(true)
    createForm.resetCreateForm()
  }, [createForm, clearPendingAutoSave])

  // Populate Edit Project form on initial mount or index changes
  useEffect(() => {
    if (
      !isCreatingNew &&
      projectsList.length > 0 &&
      selectedProjIndex >= 0 &&
      selectedProjIndex < projectsList.length &&
      lastLoadedProjIndexRef.current !== selectedProjIndex
    ) {
      lastLoadedProjIndexRef.current = selectedProjIndex
      const proj = projectsList[selectedProjIndex]
      startProjectTransition(() => {
        editForm.populateEditForm(proj)
      })
    }
  }, [selectedProjIndex, isCreatingNew, projectsList, editForm])

  // Track deletion confirmation
  const confirmDeleteTrack = useCallback(
    (onTriggerSave) => {
      if (!operations.trackToDelete) return
      const { index, isEditing } = operations.trackToDelete
      if (isEditing) {
        if (editForm.editTracks.length <= 1) {
          operations.setTrackToDelete(null)
          return
        }
        const n = editForm.editTracks.filter((_, i) => i !== index)
        editForm.setEditTracks(n)
        onTriggerSave?.(`edit_del_${index}`, n)
      } else {
        if (createForm.tracks.length <= 1) {
          operations.setTrackToDelete(null)
          return
        }
        createForm.setTracks((prev) => prev.filter((_, i) => i !== index))
      }
      operations.setTrackToDelete(null)
    },
    [operations, editForm, createForm],
  )

  const executeCreate = useCallback(
    async (password) => {
      return createForm.executeCreateProject(password, projectsList)
    },
    [createForm, projectsList],
  )

  const executeEdit = useCallback(
    async (password) => {
      return editForm.executeEditProject(password, projectsList, selectedProjIndex)
    },
    [editForm, projectsList, selectedProjIndex],
  )

  return {
    projectsList,
    setProjectsList,
    isCreatingNew,
    setIsCreatingNew,
    selectedProjIndex,
    setSelectedProjIndex,
    isPendingProjectSwitch,

    // Create form
    name: createForm.name,
    setName: createForm.setName,
    type: createForm.type,
    setType: createForm.setType,
    artist: createForm.artist,
    setArtist: createForm.setArtist,
    date: createForm.date,
    setDate: createForm.setDate,
    visibility: createForm.visibility,
    setVisibility: createForm.setVisibility,
    copyright: createForm.copyright,
    setCopyright: createForm.setCopyright,
    coverFile: createForm.coverFile,
    setCoverFile: createForm.setCoverFile,
    coverPreview: createForm.coverPreview,
    tracks: createForm.tracks,
    setTracks: createForm.setTracks,

    // Edit form
    editName: editForm.editName,
    setEditName: editForm.setEditName,
    editType: editForm.editType,
    setEditType: editForm.setEditType,
    editArtist: editForm.editArtist,
    setEditArtist: editForm.setEditArtist,
    editDate: editForm.editDate,
    setEditDate: editForm.setEditDate,
    editVisibility: editForm.editVisibility,
    setEditVisibility: editForm.setEditVisibility,
    editCopyright: editForm.editCopyright,
    setEditCopyright: editForm.setEditCopyright,
    editCoverFile: editForm.editCoverFile,
    setEditCoverFile: editForm.setEditCoverFile,
    editCoverPreview: editForm.editCoverPreview,
    editTracks: editForm.editTracks,
    setEditTracks: editForm.setEditTracks,

    // Modals
    deleteConfirmOpen: operations.deleteConfirmOpen,
    setDeleteConfirmOpen: operations.setDeleteConfirmOpen,
    trackToDelete: operations.trackToDelete,
    setTrackToDelete: operations.setTrackToDelete,
    trackToCopy: operations.trackToCopy,
    setTrackToCopy: operations.setTrackToCopy,
    copyTargetProjectIndex: operations.copyTargetProjectIndex,
    setCopyTargetProjectIndex: operations.setCopyTargetProjectIndex,
    isCopyingTrack: operations.isCopyingTrack,

    // Validation
    isEditNameDuplicate: validation.isEditNameDuplicate,
    editNameValidationError: validation.editNameValidationError,
    editDupTrackIndexes: validation.editDupTrackIndexes,
    isNewNameDuplicate: validation.isNewNameDuplicate,
    newNameValidationError: validation.newNameValidationError,
    newDupTrackIndexes: validation.newDupTrackIndexes,

    // Actions
    handleSelectProject,
    handleStartCreateNewProject,
    executeCreateProject: executeCreate,
    executeUpdateProject: executeEdit,
    handleDeleteProject: operations.handleDeleteProject,
    confirmDeleteTrack,
    handleCopyTrack: operations.handleCopyTrack,

    // Track handlers
    handleUpdateCreateTrackName: (idx, val) => createForm.handleUpdateTrack(idx, 'name', val),
    handleUpdateCreateTrackArtist: (idx, val) => createForm.handleUpdateTrack(idx, 'artist', val),
    handleUpdateCreateTrackLink: createForm.handleTrackLinkChange,
    handleCreateTrackAudioUpload: createForm.handleTrackAudioChange,
    handleCreateTrackAudioRemove: (idx) => createForm.handleTrackAudioChange(idx, null),
    handleMoveCreateTrackUp: (idx) => createForm.handleMoveTrack(idx, idx - 1),
    handleMoveCreateTrackDown: (idx) => createForm.handleMoveTrack(idx, idx + 1),
    handleDeleteCreateTrack: (track, idx) =>
      operations.setTrackToDelete({ index: idx, isEditing: false, trackName: track.name }),

    handleUpdateEditTrackName: (idx, val) => editForm.handleUpdateEditTrack(idx, 'name', val),
    handleUpdateEditTrackArtist: (idx, val) => editForm.handleUpdateEditTrack(idx, 'artist', val),
    handleUpdateEditTrackLink: editForm.handleEditTrackLinkChange,
    handleEditTrackAudioUpload: editForm.handleEditTrackAudioChange,
    handleEditTrackAudioRemove: (idx) => editForm.handleEditTrackAudioChange(idx, null),
    handleMoveEditTrackUp: (idx) => editForm.handleMoveEditTrack(idx, idx - 1),
    handleMoveEditTrackDown: (idx) => editForm.handleMoveEditTrack(idx, idx + 1),
    handleDeleteEditTrack: (track, idx) =>
      operations.setTrackToDelete({ index: idx, isEditing: true, trackName: track.name }),
    handleCopyEditTrack: (track, idx) => {
      operations.setTrackToCopy({
        track,
        sourceProjectIndex: selectedProjIndex,
        trackIndex: idx,
      })
      operations.setCopyTargetProjectIndex(selectedProjIndex >= 0 ? selectedProjIndex : 0)
    },
  }
}
