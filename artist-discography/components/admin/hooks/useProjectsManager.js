'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  resolveOverrideArtist,
  isProjectSlugDuplicate,
  getDuplicateTrackSlugIndexes,
  createEmptyTrack,
} from '../adminUtils'
import { EMPTY_SET } from '../adminConstants'
import { slugify } from '../../../lib/slugs'

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

  // New Project Form State
  const [name, setName] = useState('')
  const [type, setType] = useState('Single')
  const [artist, setArtist] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [coverFile, setCoverFile] = useState(null)
  const [coverPreview, setCoverPreview] = useState(null)
  const [tracks, setTracks] = useState([createEmptyTrack()])

  // Edit Project Form State
  const [editName, setEditName] = useState('')
  const [editType, setEditType] = useState('Single')
  const [editArtist, setEditArtist] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editCoverFile, setEditCoverFile] = useState(null)
  const [editCoverPreview, setEditCoverPreview] = useState(null)
  const [editTracks, setEditTracks] = useState([])

  // Modal Dialogs State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [trackToDelete, setTrackToDelete] = useState(null)
  const [trackToCopy, setTrackToCopy] = useState(null)
  const [copyTargetProjectIndex, setCopyTargetProjectIndex] = useState(0)
  const [isCopyingTrack, setIsCopyingTrack] = useState(false)

  const selectedProjIndexRef = useRef(selectedProjIndex)
  const isCreatingNewRef = useRef(isCreatingNew)
  useEffect(() => { selectedProjIndexRef.current = selectedProjIndex }, [selectedProjIndex])
  useEffect(() => { isCreatingNewRef.current = isCreatingNew }, [isCreatingNew])

  // Stable Refs for Auto-Save
  const nameRef = useRef(name)
  const typeRef = useRef(type)
  const artistRef = useRef(artist)
  const dateRef = useRef(date)
  const coverFileRef = useRef(coverFile)
  const tracksRef = useRef(tracks)

  const editNameRef = useRef(editName)
  const editTypeRef = useRef(editType)
  const editArtistRef = useRef(editArtist)
  const editDateRef = useRef(editDate)
  const editCoverFileRef = useRef(editCoverFile)
  const editTracksRef = useRef(editTracks)

  useEffect(() => { nameRef.current = name }, [name])
  useEffect(() => { typeRef.current = type }, [type])
  useEffect(() => { artistRef.current = artist }, [artist])
  useEffect(() => { dateRef.current = date }, [date])
  useEffect(() => { coverFileRef.current = coverFile }, [coverFile])
  useEffect(() => { tracksRef.current = tracks }, [tracks])

  useEffect(() => { editNameRef.current = editName }, [editName])
  useEffect(() => { editTypeRef.current = editType }, [editType])
  useEffect(() => { editArtistRef.current = editArtist }, [editArtist])
  useEffect(() => { editDateRef.current = editDate }, [editDate])
  useEffect(() => { editCoverFileRef.current = editCoverFile }, [editCoverFile])
  useEffect(() => { editTracksRef.current = editTracks }, [editTracks])

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

  // Select project handler
  const handleSelectProject = useCallback((idx) => {
    if (idx < 0 || idx >= projectsList.length) return

    clearPendingAutoSave()
    setIsCreatingNew(false)
    isCreatingNewRef.current = false
    setSelectedProjIndex(idx)
    selectedProjIndexRef.current = idx

    const proj = projectsList[idx]
    const primaryName = (artistNameInputRef?.current || artistData?.name || defaultArtistName).trim()
    const formattedTracks = (proj.tracks ?? []).map((t, tIdx) => ({
      id: `edit-track-${tIdx}-${Date.now()}`,
      name: t.name || '',
      originalName: t.name || '',
      artist: resolveOverrideArtist(t.artist, primaryName, proj.artist),
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

    setEditName(proj.name || '')
    setEditType(proj.type || 'Single')
    setEditArtist(resolveOverrideArtist(proj.artist, primaryName))
    setEditDate(proj.date || new Date().toISOString().split('T')[0])
    setEditCoverFile(null)
    setEditCoverPreview(proj.cover || null)
    setEditTracks(formattedTracks)

    editNameRef.current = proj.name || ''
    editTypeRef.current = proj.type || 'Single'
    editArtistRef.current = resolveOverrideArtist(proj.artist, primaryName)
    editDateRef.current = proj.date || new Date().toISOString().split('T')[0]
    editCoverFileRef.current = null
    editTracksRef.current = formattedTracks
  }, [projectsList, artistData?.name, defaultArtistName, artistNameInputRef, clearPendingAutoSave])

  // Start create new project handler
  const handleStartCreateNewProject = useCallback(() => {
    clearPendingAutoSave()
    setSelectedProjIndex(-1)
    setIsCreatingNew(true)
    setName('')
    setType('Single')
    const primaryName = (artistNameInputRef?.current || artistData?.name || defaultArtistName).trim()
    setArtist(primaryName)
    setDate(new Date().toISOString().split('T')[0])
    setCoverFile(null)
    setCoverPreview(null)
    const initialTracks = [createEmptyTrack()]
    setTracks(initialTracks)

    nameRef.current = ''
    typeRef.current = 'Single'
    artistRef.current = primaryName
    dateRef.current = new Date().toISOString().split('T')[0]
    coverFileRef.current = null
    tracksRef.current = initialTracks
  }, [artistData?.name, defaultArtistName, artistNameInputRef, clearPendingAutoSave])

  // Populate Edit Project form when selecting project index
  useEffect(() => {
    if (!isCreatingNew && projectsList.length > 0 && selectedProjIndex >= 0 && selectedProjIndex < projectsList.length) {
      const proj = projectsList[selectedProjIndex]
      const primaryName = (artistNameInputRef?.current || artistData?.name || defaultArtistName).trim()
      setEditName(proj.name || '')
      setEditType(proj.type || 'Single')
      setEditArtist(resolveOverrideArtist(proj.artist, primaryName))
      setEditDate(proj.date || new Date().toISOString().split('T')[0])
      setEditCoverFile(null)
      setEditCoverPreview(proj.cover || null)

      const formattedTracks = (proj.tracks ?? []).map((t, idx) => ({
        id: `edit-track-${idx}-${Date.now()}`,
        name: t.name || '',
        originalName: t.name || '',
        artist: resolveOverrideArtist(t.artist, primaryName, proj.artist),
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
      setEditTracks(formattedTracks)
    }
  }, [selectedProjIndex, isCreatingNew, defaultArtistName, artistNameInputRef, artistData?.name])

  // Cover image preview cleanups
  useEffect(() => {
    if (!coverFile) {
      setCoverPreview(null)
      return
    }
    const objectUrl = URL.createObjectURL(coverFile)
    setCoverPreview(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [coverFile])

  useEffect(() => {
    if (!editCoverFile) return
    const objectUrl = URL.createObjectURL(editCoverFile)
    setEditCoverPreview(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [editCoverFile])

  // Slug and track validation variables
  const isEditNameDuplicate = useMemo(
    () => !isCreatingNew && isProjectSlugDuplicate(editName, projectsList, selectedProjIndex),
    [isCreatingNew, editName, projectsList, selectedProjIndex]
  )
  const editDupTrackIndexes = useMemo(
    () => (!isCreatingNew ? getDuplicateTrackSlugIndexes(editTracks) : EMPTY_SET),
    [isCreatingNew, editTracks]
  )
  const isNewNameDuplicate = useMemo(
    () => isCreatingNew && isProjectSlugDuplicate(name, projectsList, -1),
    [isCreatingNew, name, projectsList]
  )
  const newDupTrackIndexes = useMemo(
    () => (isCreatingNew ? getDuplicateTrackSlugIndexes(tracks) : EMPTY_SET),
    [isCreatingNew, tracks]
  )

  // Auto-Save: Create New Project
  const executeCreateProject = useCallback(async (password) => {
    const currentName = nameRef.current
    const currentType = typeRef.current
    const currentArtist = artistRef.current
    const currentDate = dateRef.current
    const currentCoverFile = coverFileRef.current
    const currentTracks = tracksRef.current

    if (!currentName?.trim()) return false
    if (isProjectSlugDuplicate(currentName, projectsList, -1)) {
      setErrorMessage?.(`Cannot save: A project named "${currentName.trim()}" (slug: "${slugify(currentName)}") already exists.`)
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
        headers: { 'x-admin-password': password },
        body: formData,
        signal: AbortSignal.timeout(25000),
      })

      const result = await res.json().catch(() => ({}))
      if (res.ok && result.success) {
        if (result.createdProject) {
          const createdProj = result.createdProject
          setProjectsList((prev) => [createdProj, ...prev])

          const primaryName = (artistNameInputRef?.current || artistData?.name || defaultArtistName).trim()
          const formattedTracks = (createdProj.tracks ?? []).map((t, idx) => ({
            id: `edit-track-${idx}-${Date.now()}`,
            name: t.name || '',
            originalName: t.name || '',
            artist: resolveOverrideArtist(t.artist, primaryName, createdProj.artist),
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
          setEditName(createdProj.name || '')
          setEditType(createdProj.type || 'Single')
          setEditArtist(resolveOverrideArtist(createdProj.artist, primaryName))
          setEditDate(createdProj.date || new Date().toISOString().split('T')[0])
          setEditCoverFile(null)
          setEditCoverPreview(createdProj.cover || null)
          setEditTracks(formattedTracks)
          editTracksRef.current = formattedTracks

          setSelectedProjIndex(0)
          setIsCreatingNew(false)
        }
        setName('')
        setCoverFile(null)
        setCoverPreview(null)
        setTracks([createEmptyTrack()])
        return true
      }
      setErrorMessage?.(result.error || 'Failed to save project.')
      return false
    } catch (err) {
      setErrorMessage?.(`Auto-save creation error: ${err.message}`)
      return false
    }
  }, [projectsList, defaultArtistName, artistNameInputRef, artistData?.name, setErrorMessage])

  // Auto-Save: Update Existing Project
  const executeUpdateProject = useCallback(async (password, overrideTracks = null) => {
    const targetIndex = selectedProjIndexRef.current
    const currentName = editNameRef.current
    const currentType = editTypeRef.current
    const currentArtist = editArtistRef.current
    const currentDate = editDateRef.current
    const currentCoverFile = editCoverFileRef.current
    const currentTracks = overrideTracks || editTracksRef.current

    if (!currentName?.trim() || targetIndex < 0 || targetIndex >= projectsList.length) return false
    if (isProjectSlugDuplicate(currentName, projectsList, targetIndex)) {
      setErrorMessage?.(`Cannot save: A project named "${currentName.trim()}" (slug: "${slugify(currentName)}") already exists.`)
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
      formData.append('projectIndex', targetIndex)
      formData.append('name', currentName.trim())
      formData.append('type', currentType)
      formData.append('artist', currentArtist.trim())
      formData.append('date', currentDate)

      if (currentCoverFile) {
        formData.append('coverFile', currentCoverFile)
      }

      const uploadedFileMap = new Map()
      const cleanTracks = currentTracks.map((t, idx) => {
        if (t.audioFile) {
          formData.append(`track_${idx}_audioFile`, t.audioFile)
          uploadedFileMap.set(idx, t.audioFile)
        }
        return {
          name: t.name.trim(),
          originalName: (t.originalName || '').trim(),
          artist: t.artist.trim(),
          links: t.links,
        }
      })

      formData.append('tracks', JSON.stringify(cleanTracks))

      const res = await fetch('/api/admin/project', {
        method: 'POST',
        headers: { 'x-admin-password': password },
        body: formData,
        signal: AbortSignal.timeout(25000),
      })

      const result = await res.json().catch(() => ({}))
      if (res.ok && result.success) {
        if (result.updatedProject) {
          setProjectsList((prev) => {
            const next = [...prev]
            next[targetIndex] = result.updatedProject
            return next
          })

          // ONLY update active edit form fields if the user is STILL viewing that project!
          if (selectedProjIndexRef.current === targetIndex && !isCreatingNewRef.current) {
            if (result.updatedProject.cover) {
              setEditCoverPreview(result.updatedProject.cover)
            } else {
              setEditCoverPreview(null)
            }

            const primaryName = (artistNameInputRef?.current || artistData?.name || defaultArtistName).trim()
            const currentLocalTracks = editTracksRef.current
            const updatedFormattedTracks = (result.updatedProject.tracks ?? []).map((t, idx) => {
              const local = currentLocalTracks[idx]
              const uploadedFileForTrack = uploadedFileMap.get(idx)
              const isSameUploadedFile = uploadedFileForTrack && local?.audioFile === uploadedFileForTrack
              const audioFile = isSameUploadedFile ? null : (local?.audioFile || null)
              const audioFileName = isSameUploadedFile ? '' : (local?.audioFileName || '')

              return {
                id: local?.id || `edit-track-${idx}-${Date.now()}`,
                name: local ? local.name : (t.name || ''),
                originalName: t.name || local?.originalName || '',
                artist: local ? local.artist : resolveOverrideArtist(t.artist, primaryName, result.updatedProject.artist),
                audio: t.audio || t.audioUrl || local?.audio || '',
                hasAudio: Boolean(t.audio || t.hasAudio || t.audioUrl || local?.hasAudio),
                audioUrl: t.audioUrl || local?.audioUrl || '',
                audioFile,
                audioFileName,
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
                  ...(local?.links || {}),
                },
              }
            })
            setEditTracks(updatedFormattedTracks)
            editTracksRef.current = updatedFormattedTracks
            setEditCoverFile(null)
            editCoverFileRef.current = null
          }
        }
        return true
      }
      setErrorMessage?.(result.error || 'Failed to update project.')
      return false
    } catch (err) {
      setErrorMessage?.(`Auto-save update error: ${err.message}`)
      return false
    }
  }, [projectsList, defaultArtistName, artistNameInputRef, artistData?.name, setErrorMessage])

  // Track Handlers: Create Form
  const handleUpdateCreateTrackName = useCallback((index, val, onTriggerSave) => {
    setTracks((prev) => {
      const n = [...prev]
      n[index] = { ...n[index], name: val }
      tracksRef.current = n
      return n
    })
    onTriggerSave?.(`new_track_${index}_title`)
  }, [])

  const handleUpdateCreateTrackArtist = useCallback((index, val, onTriggerSave) => {
    setTracks((prev) => {
      const n = [...prev]
      n[index] = { ...n[index], artist: val }
      tracksRef.current = n
      return n
    })
    onTriggerSave?.(`new_track_${index}_artist`)
  }, [])

  const handleUpdateCreateTrackLink = useCallback((index, key, val, onTriggerSave) => {
    setTracks((prev) => {
      const n = [...prev]
      n[index] = { ...n[index], links: { ...n[index].links, [key]: val } }
      tracksRef.current = n
      return n
    })
    onTriggerSave?.(`new_track_${index}_${key}`)
  }, [])

  const handleCreateTrackAudioUpload = useCallback((index, file, onTriggerSave) => {
    const n = tracksRef.current.map((t, i) => i === index ? { ...t, audioFile: file, audioFileName: file.name } : t)
    setTracks(n)
    tracksRef.current = n
    onTriggerSave?.(`new_track_${index}_audio`)
  }, [])

  const handleCreateTrackAudioRemove = useCallback((index) => {
    setTracks((prev) => {
      const n = prev.map((t, i) => i === index ? { ...t, audioFile: null, audioFileName: '' } : t)
      tracksRef.current = n
      return n
    })
  }, [])

  const handleMoveCreateTrackUp = useCallback((index) => {
    setTracks((prev) => {
      if (index === 0) return prev
      const n = [...prev]
      const t = n[index]
      n[index] = n[index - 1]
      n[index - 1] = t
      tracksRef.current = n
      return n
    })
  }, [])

  const handleMoveCreateTrackDown = useCallback((index) => {
    setTracks((prev) => {
      if (index >= prev.length - 1) return prev
      const n = [...prev]
      const t = n[index]
      n[index] = n[index + 1]
      n[index + 1] = t
      tracksRef.current = n
      return n
    })
  }, [])

  const handleDeleteCreateTrack = useCallback((track, index) => {
    setTrackToDelete({
      index,
      isEditing: false,
      trackName: track.name.trim() || `Track #${index + 1}`,
    })
  }, [])

  // Track Handlers: Edit Form
  const handleUpdateEditTrackName = useCallback((index, val, onTriggerSave) => {
    setEditTracks((prev) => {
      const n = [...prev]
      n[index] = { ...n[index], name: val }
      editTracksRef.current = n
      return n
    })
    onTriggerSave?.(`edit_track_${index}_title`)
  }, [])

  const handleUpdateEditTrackArtist = useCallback((index, val, onTriggerSave) => {
    setEditTracks((prev) => {
      const n = [...prev]
      n[index] = { ...n[index], artist: val }
      editTracksRef.current = n
      return n
    })
    onTriggerSave?.(`edit_track_${index}_artist`)
  }, [])

  const handleUpdateEditTrackLink = useCallback((index, key, val, onTriggerSave) => {
    setEditTracks((prev) => {
      const n = [...prev]
      n[index] = { ...n[index], links: { ...n[index].links, [key]: val } }
      editTracksRef.current = n
      return n
    })
    onTriggerSave?.(`edit_track_${index}_${key}`)
  }, [])

  const handleEditTrackAudioUpload = useCallback((index, file, onTriggerSave) => {
    const n = editTracksRef.current.map((t, i) => i === index ? { ...t, audioFile: file, audioFileName: file.name } : t)
    setEditTracks(n)
    editTracksRef.current = n
    onTriggerSave?.(`edit_track_${index}_audio`)
  }, [])

  const handleEditTrackAudioRemove = useCallback((index) => {
    setEditTracks((prev) => {
      const n = prev.map((t, i) => i === index ? { ...t, audioFile: null, audioFileName: '' } : t)
      editTracksRef.current = n
      return n
    })
  }, [])

  const handleMoveEditTrackUp = useCallback((index, onTriggerSave) => {
    const n = [...editTracksRef.current]
    if (index === 0) return
    const t = n[index]
    n[index] = n[index - 1]
    n[index - 1] = t
    setEditTracks(n)
    editTracksRef.current = n
    onTriggerSave?.(`edit_move_${index}`, n)
  }, [])

  const handleMoveEditTrackDown = useCallback((index, onTriggerSave) => {
    const n = [...editTracksRef.current]
    if (index >= n.length - 1) return
    const t = n[index]
    n[index] = n[index + 1]
    n[index + 1] = t
    setEditTracks(n)
    editTracksRef.current = n
    onTriggerSave?.(`edit_move_${index}`, n)
  }, [])

  const handleDeleteEditTrack = useCallback((track, index) => {
    setTrackToDelete({
      index,
      isEditing: true,
      trackName: track.name.trim() || `Track #${index + 1}`,
    })
  }, [])

  const handleCopyEditTrack = useCallback((track, index) => {
    setTrackToCopy({
      track,
      sourceProjectIndex: selectedProjIndex,
      trackIndex: index,
    })
    setCopyTargetProjectIndex(selectedProjIndex >= 0 ? selectedProjIndex : 0)
  }, [selectedProjIndex])

  // Delete Project Submit
  const handleDeleteProject = useCallback(async (password) => {
    setDeleteConfirmOpen(false)
    setErrorMessage?.('')

    try {
      const formData = new FormData()
      formData.append('password', password)
      formData.append('action', 'delete')
      formData.append('projectIndex', selectedProjIndex)

      const res = await fetch('/api/admin/project', {
        method: 'POST',
        headers: { 'x-admin-password': password },
        body: formData,
      })

      const result = await res.json().catch(() => ({}))

      if (res.ok && result.success) {
        setStatusMessage?.(result.message)

        const nextList = projectsList.filter((_, i) => i !== selectedProjIndex)
        setProjectsList(nextList)

        if (nextList.length === 0) {
          setIsCreatingNew(false)
          setSelectedProjIndex(-1)
        } else {
          const nextIndex = Math.min(selectedProjIndex, nextList.length - 1)
          const nextProj = nextList[nextIndex]
          const primaryName = (artistNameInputRef?.current || artistData?.name || defaultArtistName).trim()
          const formattedTracks = (nextProj.tracks ?? []).map((t, tIdx) => ({
            id: `edit-track-${tIdx}-${Date.now()}`,
            name: t.name || '',
            originalName: t.name || '',
            artist: resolveOverrideArtist(t.artist, primaryName, nextProj.artist),
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
          setEditName(nextProj.name || '')
          setEditType(nextProj.type || 'Single')
          setEditArtist(resolveOverrideArtist(nextProj.artist, primaryName))
          setEditDate(nextProj.date || new Date().toISOString().split('T')[0])
          setEditCoverFile(null)
          setEditCoverPreview(nextProj.cover || null)
          setEditTracks(formattedTracks)
          editTracksRef.current = formattedTracks
          setSelectedProjIndex(nextIndex)
        }
      } else {
        setErrorMessage?.(result.error || 'Failed to delete project.')
      }
    } catch (err) {
      setErrorMessage?.(`Delete failed: ${err.message}`)
    }
  }, [selectedProjIndex, projectsList, defaultArtistName, artistNameInputRef, artistData?.name, setErrorMessage, setStatusMessage])

  // Confirm Delete Track
  const confirmDeleteTrack = useCallback((onTriggerSave) => {
    if (!trackToDelete) return
    const { index, isEditing } = trackToDelete
    if (isEditing) {
      if (editTracks.length <= 1) {
        setTrackToDelete(null)
        return
      }
      const n = editTracks.filter((_, i) => i !== index)
      setEditTracks(n)
      editTracksRef.current = n
      onTriggerSave?.(`edit_del_${index}`, n)
    } else {
      if (tracks.length <= 1) {
        setTrackToDelete(null)
        return
      }
      setTracks((prev) => prev.filter((_, i) => i !== index))
    }
    setTrackToDelete(null)
  }, [trackToDelete, editTracks, tracks])

  // Copy Track Submit
  const handleCopyTrack = useCallback(async (password) => {
    if (!trackToCopy) return
    setIsCopyingTrack(true)
    setErrorMessage?.('')

    try {
      const res = await fetch('/api/admin/copy-track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password,
          sourceProjectIndex: trackToCopy.sourceProjectIndex,
          sourceTrackIndex: trackToCopy.trackIndex,
          targetProjectIndex: copyTargetProjectIndex,
        }),
      })

      const result = await res.json().catch(() => ({}))
      if (res.ok && result.success) {
        setStatusMessage?.(result.message)

        if (result.updatedTargetProject && typeof result.targetProjectIndex === 'number') {
          setProjectsList((prev) => {
            const next = [...prev]
            next[result.targetProjectIndex] = result.updatedTargetProject
            return next
          })

          if (result.targetProjectIndex === selectedProjIndex) {
            const primaryName = (artistNameInputRef?.current || artistData?.name || defaultArtistName).trim()
            const updatedTracks = (result.updatedTargetProject.tracks ?? []).map((t, idx) => ({
              id: editTracksRef.current[idx]?.id || `edit-track-${idx}-${Date.now()}`,
              name: t.name || '',
              originalName: t.name || '',
              artist: resolveOverrideArtist(t.artist, primaryName, result.updatedTargetProject.artist),
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
            setEditTracks(updatedTracks)
            editTracksRef.current = updatedTracks
          }
        }

        setTrackToCopy(null)
      } else {
        setErrorMessage?.(result.error || 'Failed to copy track.')
      }
    } catch (err) {
      setErrorMessage?.(`Error copying track: ${err.message}`)
    } finally {
      setIsCopyingTrack(false)
    }
  }, [trackToCopy, copyTargetProjectIndex, selectedProjIndex, defaultArtistName, artistNameInputRef, artistData?.name, setErrorMessage, setStatusMessage])

  return {
    projectsList,
    setProjectsList,
    isCreatingNew,
    setIsCreatingNew,
    selectedProjIndex,
    setSelectedProjIndex,
    // Create form
    name,
    setName,
    nameRef,
    type,
    setType,
    typeRef,
    artist,
    setArtist,
    artistRef,
    date,
    setDate,
    dateRef,
    coverFile,
    setCoverFile,
    coverFileRef,
    coverPreview,
    tracks,
    setTracks,
    tracksRef,
    // Edit form
    editName,
    setEditName,
    editNameRef,
    editType,
    setEditType,
    editTypeRef,
    editArtist,
    setEditArtist,
    editArtistRef,
    editDate,
    setEditDate,
    editDateRef,
    editCoverFile,
    setEditCoverFile,
    editCoverFileRef,
    editCoverPreview,
    editTracks,
    setEditTracks,
    editTracksRef,
    // Modals
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    trackToDelete,
    setTrackToDelete,
    trackToCopy,
    setTrackToCopy,
    copyTargetProjectIndex,
    setCopyTargetProjectIndex,
    isCopyingTrack,
    // Validation
    isEditNameDuplicate,
    editDupTrackIndexes,
    isNewNameDuplicate,
    newDupTrackIndexes,
    // Actions
    handleSelectProject,
    handleStartCreateNewProject,
    executeCreateProject,
    executeUpdateProject,
    handleDeleteProject,
    confirmDeleteTrack,
    handleCopyTrack,
    // Track handlers
    handleUpdateCreateTrackName,
    handleUpdateCreateTrackArtist,
    handleUpdateCreateTrackLink,
    handleCreateTrackAudioUpload,
    handleCreateTrackAudioRemove,
    handleMoveCreateTrackUp,
    handleMoveCreateTrackDown,
    handleDeleteCreateTrack,
    handleUpdateEditTrackName,
    handleUpdateEditTrackArtist,
    handleUpdateEditTrackLink,
    handleEditTrackAudioUpload,
    handleEditTrackAudioRemove,
    handleMoveEditTrackUp,
    handleMoveEditTrackDown,
    handleDeleteEditTrack,
    handleCopyEditTrack,
  }
}
