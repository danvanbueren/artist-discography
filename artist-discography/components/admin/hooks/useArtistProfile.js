'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

export function useArtistProfile(initialData = {}, defaultArtistName = 'Artist', setErrorMessage, setStatusMessage) {
  const [artistData, setArtistData] = useState(() => initialData?.artist ?? {})

  const [artistNameInput, setArtistNameInput] = useState(() => artistData?.name || defaultArtistName)
  const [artistBioInput, setArtistBioInput] = useState(() => artistData?.bio || '')
  const [artistPlatforms, setArtistPlatforms] = useState(() => artistData?.links?.platforms || {})
  const [artistSocials, setArtistSocials] = useState(() => artistData?.links?.socials || {})
  const [privateAccessCodeInput, setPrivateAccessCodeInput] = useState(() => initialData?.privateAccessCode || '')

  // Logo State
  const [logoInfo, setLogoInfo] = useState(() => initialData?.logoInfo ?? {
    exists: true,
    isCustom: false,
    filename: 'logo.png',
    url: '/api/logo',
  })
  const [logoTimestamp, setLogoTimestamp] = useState(() => Date.now())
  const [logoPreview, setLogoPreview] = useState(() => `/api/logo?t=${Date.now()}`)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [isResettingLogo, setIsResettingLogo] = useState(false)

  const artistNameInputRef = useRef(artistNameInput)
  const artistBioInputRef = useRef(artistBioInput)
  const artistPlatformsRef = useRef(artistPlatforms)
  const artistSocialsRef = useRef(artistSocials)
  const privateAccessCodeInputRef = useRef(privateAccessCodeInput)

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

  useEffect(() => {
    privateAccessCodeInputRef.current = privateAccessCodeInput
  }, [privateAccessCodeInput])

  // Sync initialData when passed
  useEffect(() => {
    if (initialData?.artist) {
      setArtistData(initialData.artist)
      setArtistNameInput(initialData.artist.name || defaultArtistName)
      setArtistBioInput(initialData.artist.bio || '')
      setArtistPlatforms(initialData.artist.links?.platforms || {})
      setArtistSocials(initialData.artist.links?.socials || {})
    }
    if (initialData?.privateAccessCode !== undefined) {
      setPrivateAccessCodeInput(initialData.privateAccessCode || '')
    }
    if (initialData?.logoInfo) {
      setLogoInfo(initialData.logoInfo)
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
          privateAccessCode: privateAccessCodeInputRef.current?.trim?.() || '',
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

  const uploadLogoFile = useCallback(async (file, password) => {
    if (!file) return false
    setIsUploadingLogo(true)
    try {
      const formData = new FormData()
      formData.append('password', password || '')
      formData.append('logoFile', file)

      const res = await fetch('/api/admin/logo', {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(30000),
      })
      const result = await res.json().catch(() => ({}))
      if (res.ok && result.success) {
        const now = Date.now()
        setLogoInfo(result.logo || {})
        setLogoTimestamp(now)
        setLogoPreview(`/api/logo?t=${now}`)
        setStatusMessage?.(result.message || 'Logo uploaded successfully!')
        return true
      }
      setErrorMessage?.(result.error || 'Failed to upload logo.')
      return false
    } catch (err) {
      setErrorMessage?.(`Logo upload error: ${err.message}`)
      return false
    } finally {
      setIsUploadingLogo(false)
    }
  }, [setErrorMessage, setStatusMessage])

  const resetLogo = useCallback(async (password) => {
    setIsResettingLogo(true)
    try {
      const res = await fetch('/api/admin/logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: password || '',
          action: 'delete',
        }),
        signal: AbortSignal.timeout(20000),
      })
      const result = await res.json().catch(() => ({}))
      if (res.ok && result.success) {
        const now = Date.now()
        setLogoInfo(result.logo || {})
        setLogoTimestamp(now)
        setLogoPreview(`/api/logo?t=${now}`)
        setStatusMessage?.(result.message || 'Logo reset to default.')
        return true
      }
      setErrorMessage?.(result.error || 'Failed to reset logo.')
      return false
    } catch (err) {
      setErrorMessage?.(`Logo reset error: ${err.message}`)
      return false
    } finally {
      setIsResettingLogo(false)
    }
  }, [setErrorMessage, setStatusMessage])

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
    privateAccessCodeInput,
    setPrivateAccessCodeInput,
    privateAccessCodeInputRef,
    logoInfo,
    setLogoInfo,
    logoPreview,
    logoTimestamp,
    isUploadingLogo,
    isResettingLogo,
    uploadLogoFile,
    resetLogo,
    executeSaveArtist,
  }
}
