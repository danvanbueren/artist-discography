'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  createEmptyTrack,
  getProjectNameValidationError,
  getDuplicateTrackSlugIndexes,
} from '../adminUtils'

/**
 * Custom hook to manage form state and network upload for creating a new project.
 */
export function useCreateProjectForm({
  defaultArtistName = 'Artist',
  artistNameInputRef,
  artistData = {},
  markFieldDirty,
  setErrorMessage,
  setStatusMessage,
}) {
  const [name, setName] = useState('')
  const [type, setType] = useState('Single')
  const [artist, setArtist] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [visibility, setVisibility] = useState('public')
  const [copyright, setCopyright] = useState('cleared')
  const [coverFile, setCoverFile] = useState(null)
  const [coverPreview, setCoverPreview] = useState(null)
  const [tracks, setTracks] = useState([createEmptyTrack()])

  // Stable refs for background auto-save and submission
  const nameRef = useRef(name)
  const typeRef = useRef(type)
  const artistRef = useRef(artist)
  const dateRef = useRef(date)
  const visibilityRef = useRef(visibility)
  const copyrightRef = useRef(copyright)
  const coverFileRef = useRef(coverFile)
  const tracksRef = useRef(tracks)

  useEffect(() => {
    nameRef.current = name
  }, [name])
  useEffect(() => {
    typeRef.current = type
  }, [type])
  useEffect(() => {
    artistRef.current = artist
  }, [artist])
  useEffect(() => {
    dateRef.current = date
  }, [date])
  useEffect(() => {
    visibilityRef.current = visibility
  }, [visibility])
  useEffect(() => {
    copyrightRef.current = copyright
  }, [copyright])
  useEffect(() => {
    coverFileRef.current = coverFile
  }, [coverFile])
  useEffect(() => {
    tracksRef.current = tracks
  }, [tracks])

  // Cover preview URL management
  useEffect(() => {
    if (!coverFile) {
      setCoverPreview(null)
      return
    }
    const objectUrl = URL.createObjectURL(coverFile)
    setCoverPreview(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [coverFile])

  const resetCreateForm = useCallback(() => {
    const primaryName = (
      artistNameInputRef?.current ||
      artistData?.name ||
      defaultArtistName
    ).trim()

    setName('')
    setType('Single')
    setArtist(primaryName)
    setDate(new Date().toISOString().split('T')[0])
    setVisibility('public')
    setCopyright('cleared')
    setCoverFile(null)
    setCoverPreview(null)
    const initialTracks = [createEmptyTrack()]
    setTracks(initialTracks)

    nameRef.current = ''
    typeRef.current = 'Single'
    artistRef.current = primaryName
    dateRef.current = new Date().toISOString().split('T')[0]
    visibilityRef.current = 'public'
    copyrightRef.current = 'cleared'
    coverFileRef.current = null
    tracksRef.current = initialTracks
  }, [artistData?.name, defaultArtistName, artistNameInputRef])

  const handleUpdateTrack = useCallback((idx, field, value, onDone) => {
    setTracks((prev) => {
      const updated = [...prev]
      if (!updated[idx]) return prev
      updated[idx] = { ...updated[idx], [field]: value }
      return updated
    })
    if (typeof onDone === 'function') {
      onDone()
    }
  }, [])

  const handleAddTrack = useCallback((onDone) => {
    setTracks((prev) => [...prev, createEmptyTrack()])
    if (typeof onDone === 'function') {
      onDone()
    }
  }, [])

  const handleRemoveTrack = useCallback((idx, onDone) => {
    setTracks((prev) => {
      if (prev.length <= 1) return prev
      return prev.filter((_, i) => i !== idx)
    })
    if (typeof onDone === 'function') {
      onDone()
    }
  }, [])

  const handleMoveTrack = useCallback((fromIndex, toIndex, onDone) => {
    setTracks((prev) => {
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

  const handleTrackAudioChange = useCallback((idx, file, onDone) => {
    setTracks((prev) => {
      const updated = [...prev]
      if (!updated[idx]) return prev
      updated[idx] = {
        ...updated[idx],
        audioFile: file,
        audioFileName: file ? file.name : '',
        hasAudio: Boolean(file),
      }
      return updated
    })
    if (typeof onDone === 'function') {
      onDone()
    }
  }, [])

  const handleTrackLinkChange = useCallback((trackIdx, platformKey, val, onDone) => {
    setTracks((prev) => {
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

  const executeCreateProject = useCallback(
    async (password, projectsList = []) => {
      const currentName = nameRef.current
      const currentType = typeRef.current
      const currentArtist = artistRef.current
      const currentDate = dateRef.current
      const currentCoverFile = coverFileRef.current
      const currentTracks = tracksRef.current

      if (!currentName?.trim()) return false
      const validationError = getProjectNameValidationError(currentName, projectsList, -1)
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
        formData.append('name', currentName.trim())
        formData.append('type', currentType)
        formData.append('artist', currentArtist?.trim() || defaultArtistName)
        formData.append('date', currentDate)
        formData.append('visibility', visibilityRef.current || 'public')
        formData.append('copyright', copyrightRef.current || 'cleared')

        if (currentCoverFile) {
          formData.append('coverFile', currentCoverFile)
        }

        const cleanTracks = currentTracks.map((t, idx) => {
          if (t.audioFile) {
            formData.append(`track_${idx}_audioFile`, t.audioFile)
          }
          return {
            name: t.name.trim(),
            artist: t.artist.trim(),
            links: t.links,
          }
        })

        formData.append('tracks', JSON.stringify(cleanTracks))

        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData,
        })
        const json = await res.json().catch(() => ({}))

        if (!res.ok) {
          throw new Error(json.error || 'Failed to create project')
        }

        setStatusMessage?.(`Successfully created "${currentName}"`)
        return json.project || true
      } catch (err) {
        setErrorMessage?.(err.message || 'Error creating project')
        return false
      }
    },
    [defaultArtistName, setErrorMessage, setStatusMessage],
  )

  return {
    name,
    setName,
    type,
    setType,
    artist,
    setArtist,
    date,
    setDate,
    visibility,
    setVisibility,
    copyright,
    setCopyright,
    coverFile,
    setCoverFile,
    coverPreview,
    tracks,
    setTracks,
    resetCreateForm,
    handleUpdateTrack,
    handleAddTrack,
    handleRemoveTrack,
    handleMoveTrack,
    handleTrackAudioChange,
    handleTrackLinkChange,
    executeCreateProject,
  }
}
