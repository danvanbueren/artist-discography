'use client'

import { useState, useEffect, useRef, useCallback, useTransition } from 'react'
import { slugify } from '@/lib/data/slugs'
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
  initialSelectedProjIndex = 0,
  initialIsCreatingNew = false,
  onNavigateToProject,
  onNavigateToNewProject,
  onProjectRenamed,
  onProjectDeleted,
  markFieldDirty,
  flushPendingAutoSave,
  clearPendingAutoSave,
  setErrorMessage,
  setStatusMessage,
}) {
  const [projectsList, setProjectsList] = useState(() => initialData?.projects ?? [])
  const [isCreatingNew, setIsCreatingNew] = useState(() => initialIsCreatingNew)
  const [selectedProjIndex, setSelectedProjIndex] = useState(() => initialSelectedProjIndex)
  const [isPendingProjectSwitch, startProjectTransition] = useTransition()
  const [isSwitchingProject, setIsSwitchingProject] = useState(false)

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
    isSwitchingProject,
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
    editTracksRef: editForm.editTracksRef,
    setErrorMessage,
    setStatusMessage,
    onProjectDeleted,
  })

  // Sync initialData
  useEffect(() => {
    if (initialData?.projects) {
      setProjectsList(initialData.projects)
      if (initialData.projects.length === 0) {
        setIsCreatingNew(true)
        setSelectedProjIndex(-1)
      }
    }
  }, [initialData])

  // Sync state when router navigates (initial load or popstate)
  useEffect(() => {
    if (initialIsCreatingNew) {
      if (!isCreatingNewRef.current) {
        clearPendingAutoSave?.()
        setSelectedProjIndex(-1)
        selectedProjIndexRef.current = -1
        setIsCreatingNew(true)
        isCreatingNewRef.current = true
        createForm.resetCreateForm()
      }
    } else if (
      initialSelectedProjIndex >= 0 &&
      initialSelectedProjIndex < projectsList.length &&
      (selectedProjIndexRef.current !== initialSelectedProjIndex || isCreatingNewRef.current)
    ) {
      clearPendingAutoSave?.()
      setIsCreatingNew(false)
      isCreatingNewRef.current = false
      setSelectedProjIndex(initialSelectedProjIndex)
      selectedProjIndexRef.current = initialSelectedProjIndex
      const proj = projectsList[initialSelectedProjIndex]
      if (proj) {
        editForm.populateEditForm(proj)
      }
    }
  }, [initialSelectedProjIndex, initialIsCreatingNew, projectsList, createForm, editForm, clearPendingAutoSave])

  const lastLoadedProjIndexRef = useRef(-1)

  // Select project handler
  const handleSelectProject = useCallback(
    async (idx, options = {}) => {
      if (idx < 0 || idx >= projectsList.length) return

      if (flushPendingAutoSave) {
        await flushPendingAutoSave()
      }

      setIsCreatingNew(false)
      isCreatingNewRef.current = false
      lastLoadedProjIndexRef.current = idx
      setIsSwitchingProject(true)

      const proj = projectsList[idx]
      setSelectedProjIndex(idx)
      selectedProjIndexRef.current = idx
      editForm.populateEditForm(proj)

      if (options.syncUrl !== false) {
        onNavigateToProject?.(idx)
      }

      setTimeout(() => {
        setIsSwitchingProject(false)
      }, 60)
    },
    [projectsList, editForm, flushPendingAutoSave, onNavigateToProject],
  )

  // Start create new project handler
  const handleStartCreateNewProject = useCallback(
    async (options = {}) => {
      if (flushPendingAutoSave) {
        await flushPendingAutoSave()
      }
      setSelectedProjIndex(-1)
      lastLoadedProjIndexRef.current = -1
      setIsCreatingNew(true)
      createForm.resetCreateForm()

      if (options.syncUrl !== false) {
        onNavigateToNewProject?.()
      }
    },
    [createForm, flushPendingAutoSave, onNavigateToNewProject],
  )

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
      editForm.populateEditForm(proj)
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
      const result = await createForm.executeCreateProject(password, projectsList)
      if (result && typeof result === 'object') {
        const createdProject = result
        setProjectsList((prev) => [createdProject, ...prev])
        setIsCreatingNew(false)
        setSelectedProjIndex(0)
        onNavigateToProject?.(0)
        return true
      }
      return Boolean(result)
    },
    [createForm, projectsList, onNavigateToProject],
  )

  const executeEdit = useCallback(
    async (password, overrideTracks = null) => {
      const result = await editForm.executeEditProject(
        password,
        projectsList,
        selectedProjIndex,
        overrideTracks,
      )
      if (result && typeof result === 'object') {
        const updatedProject = result
        setProjectsList((prev) => {
          const next = [...prev]
          if (selectedProjIndex >= 0 && selectedProjIndex < next.length) {
            next[selectedProjIndex] = {
              ...next[selectedProjIndex],
              ...updatedProject,
            }
          }
          return next
        })
        if (updatedProject.name) {
          const newSlug = slugify(updatedProject.name)
          onProjectRenamed?.(newSlug)
        }
        return true
      }
      return Boolean(result)
    },
    [editForm, projectsList, selectedProjIndex, onProjectRenamed],
  )

  return {
    projectsList,
    setProjectsList,
    isCreatingNew,
    setIsCreatingNew,
    selectedProjIndex,
    isPendingProjectSwitch: isPendingProjectSwitch || isSwitchingProject,
    isSwitchingProject,

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
    handleUpdateCreateTrackName: (idx, val, onDone) =>
      createForm.handleUpdateTrack(idx, 'name', val, onDone),
    handleUpdateCreateTrackArtist: (idx, val, onDone) =>
      createForm.handleUpdateTrack(idx, 'artist', val, onDone),
    handleUpdateCreateTrackLink: createForm.handleTrackLinkChange,
    handleCreateTrackAudioUpload: createForm.handleTrackAudioChange,
    handleCreateTrackAudioRemove: (idx, onDone) =>
      createForm.handleTrackAudioChange(idx, null, onDone),
    handleMoveCreateTrackUp: (idx, onDone) => createForm.handleMoveTrack(idx, idx - 1, onDone),
    handleMoveCreateTrackDown: (idx, onDone) => createForm.handleMoveTrack(idx, idx + 1, onDone),
    handleDeleteCreateTrack: (track, idx) =>
      operations.setTrackToDelete({ index: idx, isEditing: false, trackName: track.name }),

    handleUpdateEditTrackName: (idx, val, onDone) =>
      editForm.handleUpdateEditTrack(idx, 'name', val, onDone),
    handleUpdateEditTrackArtist: (idx, val, onDone) =>
      editForm.handleUpdateEditTrack(idx, 'artist', val, onDone),
    handleUpdateEditTrackLink: editForm.handleEditTrackLinkChange,
    handleEditTrackAudioUpload: editForm.handleEditTrackAudioChange,
    handleEditTrackAudioRemove: (idx, onDone) =>
      editForm.handleEditTrackAudioChange(idx, null, onDone),
    handleMoveEditTrackUp: (idx, onDone) => editForm.handleMoveEditTrack(idx, idx - 1, onDone),
    handleMoveEditTrackDown: (idx, onDone) => editForm.handleMoveEditTrack(idx, idx + 1, onDone),
    handleDeleteEditTrack: (track, idx) =>
      operations.setTrackToDelete({ index: idx, isEditing: true, trackName: track.name }),
    handleRemoveEditCover: editForm.handleRemoveEditCover,
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
