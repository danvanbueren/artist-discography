'use client'

import { useState, useCallback } from 'react'
import { resolveOverrideArtist } from '../adminUtils'
import { formatProjectTracks } from './useEditProjectForm'

/**
 * Custom hook to manage project deletion, track deletion, and cross-project track copying.
 */
export function useProjectOperations({
  projectsList = [],
  setProjectsList,
  selectedProjIndex = 0,
  setSelectedProjIndex,
  setIsCreatingNew,
  defaultArtistName = 'Artist',
  artistNameInputRef,
  artistData = {},
  setEditName,
  setEditType,
  setEditArtist,
  setEditDate,
  setEditCoverFile,
  setEditCoverPreview,
  setEditTracks,
  editTracksRef,
  setErrorMessage,
  setStatusMessage,
}) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [trackToDelete, setTrackToDelete] = useState(null)
  const [trackToCopy, setTrackToCopy] = useState(null)
  const [copyTargetProjectIndex, setCopyTargetProjectIndex] = useState(0)
  const [isCopyingTrack, setIsCopyingTrack] = useState(false)

  // Project Deletion
  const handleDeleteProject = useCallback(
    async (password) => {
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
            const primaryName = (
              artistNameInputRef?.current ||
              artistData?.name ||
              defaultArtistName
            ).trim()
            const formattedTracks = formatProjectTracks(
              nextProj.tracks,
              primaryName,
              nextProj.artist,
            )
            setEditName(nextProj.name || '')
            setEditType(nextProj.type || 'Single')
            setEditArtist(resolveOverrideArtist(nextProj.artist, primaryName))
            setEditDate(nextProj.date || new Date().toISOString().split('T')[0])
            setEditCoverFile(null)
            setEditCoverPreview(nextProj.cover || null)
            setEditTracks(formattedTracks)
            if (editTracksRef) editTracksRef.current = formattedTracks
            setSelectedProjIndex(nextIndex)
          }
        } else {
          setErrorMessage?.(result.error || 'Failed to delete project.')
        }
      } catch (err) {
        setErrorMessage?.(`Delete failed: ${err.message}`)
      }
    },
    [
      selectedProjIndex,
      projectsList,
      setProjectsList,
      setIsCreatingNew,
      setSelectedProjIndex,
      defaultArtistName,
      artistNameInputRef,
      artistData?.name,
      setEditName,
      setEditType,
      setEditArtist,
      setEditDate,
      setEditCoverFile,
      setEditCoverPreview,
      setEditTracks,
      editTracksRef,
      setErrorMessage,
      setStatusMessage,
    ],
  )

  // Track Copying
  const handleCopyTrack = useCallback(
    async (password) => {
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
              const primaryName = (
                artistNameInputRef?.current ||
                artistData?.name ||
                defaultArtistName
              ).trim()
              const updatedTracks = (result.updatedTargetProject.tracks ?? []).map((t, idx) => ({
                id: editTracksRef?.current[idx]?.id || `edit-track-${idx}`,
                name: t.name || '',
                originalName: t.name || '',
                artist: resolveOverrideArtist(
                  t.artist,
                  primaryName,
                  result.updatedTargetProject.artist,
                ),
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
              if (editTracksRef) editTracksRef.current = updatedTracks
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
    },
    [
      trackToCopy,
      copyTargetProjectIndex,
      setProjectsList,
      selectedProjIndex,
      defaultArtistName,
      artistNameInputRef,
      artistData?.name,
      editTracksRef,
      setEditTracks,
      setErrorMessage,
      setStatusMessage,
    ],
  )

  return {
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    trackToDelete,
    setTrackToDelete,
    trackToCopy,
    setTrackToCopy,
    copyTargetProjectIndex,
    setCopyTargetProjectIndex,
    isCopyingTrack,
    handleDeleteProject,
    handleCopyTrack,
  }
}
