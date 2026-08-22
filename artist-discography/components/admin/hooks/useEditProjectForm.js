'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  createEmptyTrack,
  getProjectNameValidationError,
  getDuplicateTrackSlugIndexes,
  resolveOverrideArtist,
} from '../adminUtils'
import { slugify } from '@/lib/data/slugs'

/**
 * Formats track array for edit form with consistent stable IDs.
 */
export function formatProjectTracks(tracksList, primaryName, projectArtist) {
  return (tracksList ?? []).map((t, tIdx) => ({
    id: t.id || `edit-track-${tIdx}`,
    name: t.name || '',
    originalName: t.name || '',
    artist: resolveOverrideArtist(t.artist, primaryName, projectArtist),
    audio: t.audio || t.audioUrl || '',
    hasAudio: Boolean(t.audio || t.hasAudio || t.audioUrl),
    audioFile: null,
    audioFileName: '',
    links: {
      spotify: '',
      apple: '',
      youtube: '',
      soundcloud: '',
      amazon: '',
      bandcamp: '',
      deezer: '',
      itunes: '',
      pandora: '',
      tidal: '',
      ...(t.links || {}),
    },
  }))
}

/**
 * Custom hook to manage form state and network upload for editing an existing project.
 */
export function useEditProjectForm({
  defaultArtistName = 'Artist',
  artistNameInputRef,
  artistData = {},
  markFieldDirty,
  setErrorMessage,
  setStatusMessage,
}) {
  const [editName, setEditName] = useState('')
  const [editType, setEditType] = useState('Single')
  const [editArtist, setEditArtist] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editVisibility, setEditVisibility] = useState('public')
  const [editCopyright, setEditCopyright] = useState('cleared')
  const [editCoverFile, setEditCoverFile] = useState(null)
  const [editCoverPreview, setEditCoverPreview] = useState(null)
  const [editTracks, setEditTracks] = useState([])

  // Stable refs
  const editNameRef = useRef(editName)
  const editTypeRef = useRef(editType)
  const editArtistRef = useRef(editArtist)
  const editDateRef = useRef(editDate)
  const editVisibilityRef = useRef(editVisibility)
  const editCopyrightRef = useRef(editCopyright)
  const editCoverFileRef = useRef(editCoverFile)
  const editTracksRef = useRef(editTracks)

  useEffect(() => {
    editNameRef.current = editName
  }, [editName])
  useEffect(() => {
    editTypeRef.current = editType
  }, [editType])
  useEffect(() => {
    editArtistRef.current = editArtist
  }, [editArtist])
  useEffect(() => {
    editDateRef.current = editDate
  }, [editDate])
  useEffect(() => {
    editVisibilityRef.current = editVisibility
  }, [editVisibility])
  useEffect(() => {
    editCopyrightRef.current = editCopyright
  }, [editCopyright])
  useEffect(() => {
    editCoverFileRef.current = editCoverFile
  }, [editCoverFile])
  useEffect(() => {
    editTracksRef.current = editTracks
  }, [editTracks])

  // Cover preview URL management
  useEffect(() => {
    if (!editCoverFile) return
    const objectUrl = URL.createObjectURL(editCoverFile)
    setEditCoverPreview(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [editCoverFile])

  const populateEditForm = useCallback(
    (proj) => {
      if (!proj) return
      const primaryName = (
        artistNameInputRef?.current ||
        artistData?.name ||
        defaultArtistName
      ).trim()

      const formatted = formatProjectTracks(proj.tracks, primaryName, proj.artist)

      setEditName(proj.name || '')
      setEditType(proj.type || 'Single')
      setEditArtist(resolveOverrideArtist(proj.artist, primaryName))
      setEditDate(proj.date || new Date().toISOString().split('T')[0])
      setEditVisibility(proj.visibility || 'public')
      setEditCopyright(proj.copyright || 'cleared')
      setEditCoverFile(null)
      setEditCoverPreview(proj.cover || null)
      setEditTracks(formatted)

      editNameRef.current = proj.name || ''
      editTypeRef.current = proj.type || 'Single'
      editArtistRef.current = resolveOverrideArtist(proj.artist, primaryName)
      editDateRef.current = proj.date || new Date().toISOString().split('T')[0]
      editVisibilityRef.current = proj.visibility || 'public'
      editCopyrightRef.current = proj.copyright || 'cleared'
      editCoverFileRef.current = null
      editTracksRef.current = formatted
    },
    [artistData?.name, defaultArtistName, artistNameInputRef],
  )

  const handleUpdateEditTrack = useCallback((idx, field, value, onDone) => {
    setEditTracks((prev) => {
      const updated = [...prev]
      if (!updated[idx]) return prev
      updated[idx] = { ...updated[idx], [field]: value }
      return updated
    })
    if (typeof onDone === 'function') {
      onDone()
    }
  }, [])

  const handleAddEditTrack = useCallback((onDone) => {
    setEditTracks((prev) => [...prev, createEmptyTrack()])
    if (typeof onDone === 'function') {
      onDone()
    }
  }, [])

  const handleRemoveEditTrack = useCallback((idx, onDone) => {
    setEditTracks((prev) => {
      if (prev.length <= 1) return prev
      return prev.filter((_, i) => i !== idx)
    })
    if (typeof onDone === 'function') {
      onDone()
    }
  }, [])

  const handleMoveEditTrack = useCallback((fromIndex, toIndex, onDone) => {
    setEditTracks((prev) => {
      if (toIndex < 0 || toIndex >= prev.length) return prev
      const updated = [...prev]
      const [moved] = updated.splice(fromIndex, 1)
      updated.splice(toIndex, 0, moved)
      if (typeof onDone === 'function') {
        onDone(updated)
      }
      return updated
    })
  }, [])

  const handleEditTrackAudioChange = useCallback((idx, file, onDone) => {
    setEditTracks((prev) => {
      const updated = [...prev]
      if (!updated[idx]) return prev
      updated[idx] = {
        ...updated[idx],
        audioFile: file,
        audioFileName: file ? file.name : '',
        hasAudio: Boolean(file || updated[idx].audio),
      }
      return updated
    })
    if (typeof onDone === 'function') {
      onDone()
    }
  }, [])

  const handleEditTrackLinkChange = useCallback((trackIdx, platformKey, val, onDone) => {
    setEditTracks((prev) => {
      const updated = [...prev]
      if (!updated[trackIdx]) return prev
      const currentLinks = updated[trackIdx].links || {}
      updated[trackIdx] = {
        ...updated[trackIdx],
        links: {
          ...currentLinks,
          [platformKey]: val,
        },
      }
      return updated
    })
    if (typeof onDone === 'function') {
      onDone()
    }
  }, [])

  const executeEditProject = useCallback(
    async (password, projectsList = [], selectedProjIndex = 0, overrideTracks = null) => {
      const currentName = editNameRef.current
      const currentType = editTypeRef.current
      const currentArtist = editArtistRef.current
      const currentDate = editDateRef.current
      const currentCoverFile = editCoverFileRef.current
      const currentTracks = overrideTracks || editTracksRef.current
      const origProject = projectsList[selectedProjIndex]

      if (!origProject || !currentName?.trim()) return false
      const validationError = getProjectNameValidationError(
        currentName,
        projectsList,
        selectedProjIndex,
      )
      if (validationError) {
        setErrorMessage?.(`Cannot save: ${validationError}`)
        return false
      }
      const dupTracks = getDuplicateTrackSlugIndexes(currentTracks)
      if (dupTracks.size > 0) {
        setErrorMessage?.('Cannot save: Duplicate track titles detected within the project.')
        return false
      }

      try {
        const formData = new FormData()
        formData.append('password', password)
        formData.append('action', 'update')
        formData.append('originalName', origProject.name)
        formData.append('originalSlug', slugify(origProject.name))
        formData.append('projectIndex', String(selectedProjIndex))
        formData.append('name', currentName.trim())
        formData.append('type', currentType)
        formData.append('artist', currentArtist?.trim() || defaultArtistName)
        formData.append('date', currentDate)
        formData.append('visibility', editVisibilityRef.current || 'public')
        formData.append('copyright', editCopyrightRef.current || 'cleared')

        if (currentCoverFile) {
          formData.append('coverFile', currentCoverFile)
        }

        const cleanTracks = currentTracks.map((t, idx) => {
          if (t.audioFile) {
            formData.append(`track_${idx}_audioFile`, t.audioFile)
          }
          return {
            name: t.name.trim(),
            originalName: t.originalName || '',
            artist: t.artist.trim(),
            audio: t.audio || '',
            links: t.links,
          }
        })

        formData.append('tracks', JSON.stringify(cleanTracks))

        const res = await fetch('/api/admin/project', {
          method: 'POST',
          body: formData,
        })
        const json = await res.json().catch(() => ({}))

        if (!res.ok) {
          throw new Error(json.error || 'Failed to update project')
        }

        setStatusMessage?.(`Successfully updated "${currentName}"`)
        return json.updatedProject || true
      } catch (err) {
        setErrorMessage?.(err.message || 'Error updating project')
        return false
      }
    },
    [defaultArtistName, setErrorMessage, setStatusMessage],
  )

  return {
    editName,
    setEditName,
    editType,
    setEditType,
    editArtist,
    setEditArtist,
    editDate,
    setEditDate,
    editVisibility,
    setEditVisibility,
    editCopyright,
    setEditCopyright,
    editCoverFile,
    setEditCoverFile,
    editCoverPreview,
    setEditCoverPreview,
    editTracks,
    setEditTracks,
    populateEditForm,
    handleUpdateEditTrack,
    handleAddEditTrack,
    handleRemoveEditTrack,
    handleMoveEditTrack,
    handleEditTrackAudioChange,
    handleEditTrackLinkChange,
    executeEditProject,
  }
}
