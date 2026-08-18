'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

export function useArtistProfile(initialData = {}, defaultArtistName = 'Artist', setErrorMessage) {
  const [artistData, setArtistData] = useState(() => initialData?.artist ?? {})

  const [artistNameInput, setArtistNameInput] = useState(() => artistData?.name || defaultArtistName)
  const [artistBioInput, setArtistBioInput] = useState(() => artistData?.bio || '')
  const [artistPlatforms, setArtistPlatforms] = useState(() => artistData?.links?.platforms || {})
  const [artistSocials, setArtistSocials] = useState(() => artistData?.links?.socials || {})

  const artistNameInputRef = useRef(artistNameInput)
  const artistBioInputRef = useRef(artistBioInput)
  const artistPlatformsRef = useRef(artistPlatforms)
  const artistSocialsRef = useRef(artistSocials)

  useEffect(() => {
    artistNameInputRef.current = artistNameInput
  }, [artistNameInput])

  useEffect(() => {
    artistBioInputRef.current = artistBioInput
  }, [artistBioInput])

  useEffect(() => {
    artistPlatformsRef.current = artistPlatforms
  }, [artistPlatforms])

  useEffect(() => {
    artistSocialsRef.current = artistSocials
  }, [artistSocials])

  // Sync initialData when passed
  useEffect(() => {
    if (initialData?.artist) {
      setArtistData(initialData.artist)
      setArtistNameInput(initialData.artist.name || defaultArtistName)
      setArtistBioInput(initialData.artist.bio || '')
      setArtistPlatforms(initialData.artist.links?.platforms || {})
      setArtistSocials(initialData.artist.links?.socials || {})
    }
  }, [initialData, defaultArtistName])

  const executeSaveArtist = useCallback(async (password) => {
    try {
      const res = await fetch('/api/admin/artist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password,
          name: artistNameInputRef.current?.trim?.() || '',
          bio: artistBioInputRef.current?.trim?.() || '',
          platforms: artistPlatformsRef.current,
          socials: artistSocialsRef.current,
        }),
        signal: AbortSignal.timeout(20000),
      })
      const result = await res.json().catch(() => ({}))
      if (res.ok && result.success) {
        return true
      }
      setErrorMessage?.(result.error || 'Failed to save artist profile.')
      return false
    } catch (err) {
      setErrorMessage?.(`Auto-save error: ${err.message}`)
      return false
    }
  }, [setErrorMessage])

  return {
    artistData,
    setArtistData,
    artistNameInput,
    setArtistNameInput,
    artistNameInputRef,
    artistBioInput,
    setArtistBioInput,
    artistBioInputRef,
    artistPlatforms,
    setArtistPlatforms,
    artistPlatformsRef,
    artistSocials,
    setArtistSocials,
    artistSocialsRef,
    executeSaveArtist,
  }
}
