'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

export function useArtistProfile(
  initialData = {},
  defaultArtistName = 'Artist',
  setErrorMessage,
  setStatusMessage,
  onAdminPasswordSaved,
  onAdminAccessSaved,
  onAuthStatusError,
) {
  const [artistData, setArtistData] = useState(() => initialData?.artist ?? {})

  const [artistNameInput, setArtistNameInput] = useState(
    () => artistData?.name || defaultArtistName,
  )
  const [artistBioInput, setArtistBioInput] = useState(() => artistData?.bio || '')
  const [artistPlatforms, setArtistPlatforms] = useState(() => artistData?.links?.platforms || {})
  const [artistSocials, setArtistSocials] = useState(() => artistData?.links?.socials || {})
  const [adminAccessInput, setAdminAccessInput] = useState(() => initialData?.adminAccess !== false)
  const [adminPasswordInput, setAdminPasswordInput] = useState(
    () => initialData?.adminPassword ?? '',
  )
  const [privateAccessCodeInput, setPrivateAccessCodeInput] = useState(
    () => initialData?.privateAccessCode || '',
  )
  const [siteUrlInput, setSiteUrlInput] = useState(() => initialData?.siteUrl || '')

  // Logo State
  const [logoInfo, setLogoInfo] = useState(
    () =>
      initialData?.logoInfo ?? {
        exists: true,
        isCustom: false,
        filename: 'logo.png',
        url: '/api/logo',
      },
  )
  const [logoTimestamp, setLogoTimestamp] = useState(() => Date.now())
  const [logoPreview, setLogoPreview] = useState(() => `/api/logo?t=${Date.now()}`)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [isResettingLogo, setIsResettingLogo] = useState(false)

  // Background State
  const [backgroundInfo, setBackgroundInfo] = useState(
    () =>
      initialData?.backgroundInfo ?? {
        exists: false,
        filename: null,
        url: null,
      },
  )
  const [backgroundTimestamp, setBackgroundTimestamp] = useState(() => Date.now())
  const [backgroundPreview, setBackgroundPreview] = useState(
    () => `/api/background?t=${Date.now()}`,
  )
  const [isUploadingBackground, setIsUploadingBackground] = useState(false)
  const [isResettingBackground, setIsResettingBackground] = useState(false)

  const artistNameInputRef = useRef(artistNameInput)
  const artistBioInputRef = useRef(artistBioInput)
  const artistPlatformsRef = useRef(artistPlatforms)
  const artistSocialsRef = useRef(artistSocials)
  const adminAccessInputRef = useRef(adminAccessInput)
  const adminPasswordInputRef = useRef(adminPasswordInput)
  const privateAccessCodeInputRef = useRef(privateAccessCodeInput)
  const siteUrlInputRef = useRef(siteUrlInput)

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
    adminAccessInputRef.current = adminAccessInput
  }, [adminAccessInput])

  useEffect(() => {
    adminPasswordInputRef.current = adminPasswordInput
  }, [adminPasswordInput])

  useEffect(() => {
    privateAccessCodeInputRef.current = privateAccessCodeInput
  }, [privateAccessCodeInput])

  useEffect(() => {
    siteUrlInputRef.current = siteUrlInput
  }, [siteUrlInput])

  // Sync initialData when passed
  useEffect(() => {
    if (initialData?.artist) {
      setArtistData(initialData.artist)
      setArtistNameInput(initialData.artist.name || defaultArtistName)
      setArtistBioInput(initialData.artist.bio || '')
      setArtistPlatforms(initialData.artist.links?.platforms || {})
      setArtistSocials(initialData.artist.links?.socials || {})
    }
    if (initialData?.adminAccess !== undefined) {
      setAdminAccessInput(initialData.adminAccess !== false)
    }
    if (initialData?.adminPassword !== undefined) {
      setAdminPasswordInput(initialData.adminPassword ?? '')
    }
    if (initialData?.privateAccessCode !== undefined) {
      setPrivateAccessCodeInput(initialData.privateAccessCode || '')
    }
    if (initialData?.siteUrl !== undefined) {
      setSiteUrlInput(initialData.siteUrl || '')
    }
    if (initialData?.logoInfo) {
      setLogoInfo(initialData.logoInfo)
    }
    if (initialData?.backgroundInfo) {
      setBackgroundInfo(initialData.backgroundInfo)
    }
  }, [initialData, defaultArtistName])

  const executeSaveArtist = useCallback(
    async (password) => {
      try {
        const savedAdminPassword = adminPasswordInputRef.current ?? ''
        const savedAdminAccess = Boolean(adminAccessInputRef.current)
        const res = await fetch('/api/admin/artist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            password,
            name: artistNameInputRef.current?.trim?.() || '',
            bio: artistBioInputRef.current?.trim?.() || '',
            platforms: artistPlatformsRef.current,
            socials: artistSocialsRef.current,
            adminAccess: savedAdminAccess,
            adminPassword: savedAdminPassword,
            privateAccessCode: privateAccessCodeInputRef.current?.trim?.() || '',
            siteUrl: siteUrlInputRef.current?.trim?.() || '',
          }),
          signal: AbortSignal.timeout(20000),
        })
        const result = await res.json().catch(() => ({}))
        if (res.ok && result.success) {
          onAdminPasswordSaved?.(savedAdminPassword)
          onAdminAccessSaved?.(savedAdminAccess)
          return true
        }
        if (res.status === 401 || res.status === 403) {
          onAuthStatusError?.(res.status, result.error)
        }
        setErrorMessage?.(result.error || 'Failed to save settings & profile.')
        return false
      } catch (err) {
        setErrorMessage?.(`Auto-save error: ${err.message}`)
        return false
      }
    },
    [setErrorMessage, onAdminPasswordSaved, onAdminAccessSaved, onAuthStatusError],
  )

  const uploadLogoFile = useCallback(
    async (file, password) => {
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
        if (res.status === 401 || res.status === 403) {
          onAuthStatusError?.(res.status, result.error)
        }
        setErrorMessage?.(result.error || 'Failed to upload logo.')
        return false
      } catch (err) {
        setErrorMessage?.(`Logo upload error: ${err.message}`)
        return false
      } finally {
        setIsUploadingLogo(false)
      }
    },
    [setErrorMessage, setStatusMessage, onAuthStatusError],
  )

  const resetLogo = useCallback(
    async (password) => {
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
        if (res.status === 401 || res.status === 403) {
          onAuthStatusError?.(res.status, result.error)
        }
        setErrorMessage?.(result.error || 'Failed to reset logo.')
        return false
      } catch (err) {
        setErrorMessage?.(`Logo reset error: ${err.message}`)
        return false
      } finally {
        setIsResettingLogo(false)
      }
    },
    [setErrorMessage, setStatusMessage, onAuthStatusError],
  )

  const uploadBackgroundFile = useCallback(
    async (file, password) => {
      if (!file) return false
      setIsUploadingBackground(true)
      try {
        const formData = new FormData()
        formData.append('password', password || '')
        formData.append('backgroundFile', file)

        const res = await fetch('/api/admin/background', {
          method: 'POST',
          body: formData,
          signal: AbortSignal.timeout(30000),
        })
        const result = await res.json().catch(() => ({}))
        if (res.ok && result.success) {
          const now = Date.now()
          setBackgroundInfo(result.background || {})
          setBackgroundTimestamp(now)
          setBackgroundPreview(`/api/background?t=${now}`)
          setStatusMessage?.(result.message || 'Background uploaded successfully!')
          return true
        }
        if (res.status === 401 || res.status === 403) {
          onAuthStatusError?.(res.status, result.error)
        }
        setErrorMessage?.(result.error || 'Failed to upload background.')
        return false
      } catch (err) {
        setErrorMessage?.(`Background upload error: ${err.message}`)
        return false
      } finally {
        setIsUploadingBackground(false)
      }
    },
    [setErrorMessage, setStatusMessage, onAuthStatusError],
  )

  const resetBackground = useCallback(
    async (password) => {
      setIsResettingBackground(true)
      try {
        const res = await fetch('/api/admin/background', {
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
          setBackgroundInfo(result.background || {})
          setBackgroundTimestamp(now)
          setBackgroundPreview(`/api/background?t=${now}`)
          setStatusMessage?.(result.message || 'Background reset to default.')
          return true
        }
        if (res.status === 401 || res.status === 403) {
          onAuthStatusError?.(res.status, result.error)
        }
        setErrorMessage?.(result.error || 'Failed to reset background.')
        return false
      } catch (err) {
        setErrorMessage?.(`Background reset error: ${err.message}`)
        return false
      } finally {
        setIsResettingBackground(false)
      }
    },
    [setErrorMessage, setStatusMessage, onAuthStatusError],
  )

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
    adminAccessInput,
    setAdminAccessInput,
    adminAccessInputRef,
    adminPasswordInput,
    setAdminPasswordInput,
    adminPasswordInputRef,
    privateAccessCodeInput,
    setPrivateAccessCodeInput,
    privateAccessCodeInputRef,
    siteUrlInput,
    setSiteUrlInput,
    siteUrlInputRef,
    logoInfo,
    setLogoInfo,
    logoPreview,
    logoTimestamp,
    isUploadingLogo,
    isResettingLogo,
    uploadLogoFile,
    resetLogo,
    backgroundInfo,
    setBackgroundInfo,
    backgroundPreview,
    backgroundTimestamp,
    isUploadingBackground,
    isResettingBackground,
    uploadBackgroundFile,
    resetBackground,
    executeSaveArtist,
  }
}
