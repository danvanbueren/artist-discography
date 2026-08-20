'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

/**
 * Custom hook to manage Picture-in-Picture (PiP) and Remote Playback / Cast capabilities
 * for HTML5 audio playback.
 */
export function useMediaCastAndPip({
  audioRef,
  playingTrack,
  isPlaying,
  coverArt,
  onShowToast,
}) {
  const [isPipActive, setIsPipActive] = useState(false)
  const [isCasting, setIsCasting] = useState(false)
  const [isCastAvailable, setIsCastAvailable] = useState(true)
  const [castError, setCastError] = useState(false)

  const canvasRef = useRef(null)
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const castErrorTimeoutRef = useRef(null)

  // 1. Initialize hidden Canvas and Video elements for PiP stream
  useEffect(() => {
    if (typeof window === 'undefined') return

    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    canvasRef.current = canvas

    const video = document.createElement('video')
    video.muted = true
    video.playsInline = true
    video.style.position = 'fixed'
    video.style.top = '-9999px'
    video.style.left = '-9999px'
    video.style.width = '1px'
    video.style.height = '1px'
    video.style.opacity = '0'
    video.style.pointerEvents = 'none'
    document.body.appendChild(video)
    videoRef.current = video

    const handleEnterPip = () => setIsPipActive(true)
    const handleLeavePip = () => setIsPipActive(false)

    video.addEventListener('enterpictureinpicture', handleEnterPip)
    video.addEventListener('leavepictureinpicture', handleLeavePip)

    // Capture stream from canvas
    try {
      if (typeof canvas.captureStream === 'function') {
        const stream = canvas.captureStream(10) // 10 fps
        streamRef.current = stream
        video.srcObject = stream
        video.play().catch(() => {})
      }
    } catch (err) {
      console.warn('Canvas captureStream not supported for PiP:', err)
    }

    return () => {
      video.removeEventListener('enterpictureinpicture', handleEnterPip)
      video.removeEventListener('leavepictureinpicture', handleLeavePip)
      try {
        if (document.pictureInPictureElement === video) {
          document.exitPictureInPicture().catch(() => {})
        }
      } catch {}
      if (video.parentNode) {
        video.parentNode.removeChild(video)
      }
    }
  }, [])

  // 2. Draw live album artwork and track title to canvas whenever track changes
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !playingTrack) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const size = 512
    const draw = (img) => {
      ctx.clearRect(0, 0, size, size)
      // Background
      ctx.fillStyle = '#121218'
      ctx.fillRect(0, 0, size, size)

      if (img && img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, 0, 0, size, size)
      } else {
        // Gradient placeholder
        const grad = ctx.createLinearGradient(0, 0, size, size)
        grad.addColorStop(0, '#1e1b4b')
        grad.addColorStop(1, '#0f172a')
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, size, size)
      }

      // Dark gradient overlay for bottom text legibility
      const overlay = ctx.createLinearGradient(0, size - 150, 0, size)
      overlay.addColorStop(0, 'rgba(0,0,0,0)')
      overlay.addColorStop(0.35, 'rgba(0,0,0,0.65)')
      overlay.addColorStop(1, 'rgba(0,0,0,0.95)')
      ctx.fillStyle = overlay
      ctx.fillRect(0, size - 150, size, 150)

      // Title
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 30px sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(playingTrack?.name || 'Untitled Track', 24, size - 65, size - 48)

      // Artist & Project
      ctx.fillStyle = 'rgba(255,255,255,0.75)'
      ctx.font = '20px sans-serif'
      const sub = [playingTrack?.artist || 'Artist', playingTrack?.project].filter(Boolean).join(' • ')
      ctx.fillText(sub, 24, size - 26, size - 48)
    }

    if (coverArt) {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => draw(img)
      img.onerror = () => draw(null)
      img.src = coverArt
      if (img.complete) draw(img)
    } else {
      draw(null)
    }
  }, [playingTrack?.name, playingTrack?.artist, playingTrack?.project, coverArt])

  // 3. Keep video play/pause synchronized with audio stream
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (isPlaying && playingTrack) {
      video.play().catch(() => {})
    } else {
      video.pause()
    }
  }, [isPlaying, Boolean(playingTrack)])

  // 4. Remote Playback API (Chrome Casting) Integration
  useEffect(() => {
    const audio = audioRef?.current
    if (!audio || !('remote' in audio)) {
      return
    }

    audio.disableRemotePlayback = false

    const handleConnecting = () => {
      setIsCasting(true)
      if (onShowToast) onShowToast('Connecting to Cast device...')
    }

    const handleConnect = () => {
      setIsCasting(true)
      if (onShowToast) onShowToast('Connected to Cast device')
    }

    const handleDisconnect = () => {
      setIsCasting(false)
      if (onShowToast) onShowToast('Disconnected from Cast device')
    }

    audio.remote.addEventListener('connecting', handleConnecting)
    audio.remote.addEventListener('connect', handleConnect)
    audio.remote.addEventListener('disconnect', handleDisconnect)

    let watchId = null
    try {
      if (typeof audio.remote.watchAvailability === 'function') {
        audio.remote.watchAvailability((available) => {
          setIsCastAvailable(available)
        }).then((id) => {
          watchId = id
        }).catch(() => {
          setIsCastAvailable(true)
        })
      } else {
        setIsCastAvailable(true)
      }
    } catch {
      setIsCastAvailable(true)
    }

    return () => {
      audio.remote.removeEventListener('connecting', handleConnecting)
      audio.remote.removeEventListener('connect', handleConnect)
      audio.remote.removeEventListener('disconnect', handleDisconnect)
      if (watchId !== null && typeof audio.remote.cancelWatchAvailability === 'function') {
        audio.remote.cancelWatchAvailability(watchId).catch(() => {})
      }
    }
  }, [audioRef, onShowToast])

  const triggerCastErrorVisual = useCallback((message) => {
    setCastError(true)
    if (castErrorTimeoutRef.current) clearTimeout(castErrorTimeoutRef.current)
    castErrorTimeoutRef.current = setTimeout(() => {
      setCastError(false)
    }, 800)
    if (onShowToast && message) {
      onShowToast(message)
    }
  }, [onShowToast])

  // Destroy Picture-in-Picture session
  const handleExitPip = useCallback(async () => {
    if (typeof document === 'undefined') return
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture()
      }
    } catch {}
    setIsPipActive(false)
    if (videoRef.current) {
      videoRef.current.pause()
    }
  }, [])

  // Auto-destroy Picture-in-Picture session when audio player is closed or track cleared
  useEffect(() => {
    if (!playingTrack) {
      handleExitPip()
    }
  }, [playingTrack, handleExitPip])

  // Toggle Picture-in-Picture
  const handleTogglePip = useCallback(async () => {
    if (typeof document === 'undefined') return

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture()
        setIsPipActive(false)
      } else if (videoRef.current) {
        await videoRef.current.play().catch(() => {})
        await videoRef.current.requestPictureInPicture()
        setIsPipActive(true)
      }
    } catch (err) {
      console.warn('Picture-in-Picture request failed:', err)
      if (onShowToast) onShowToast('Picture-in-Picture is unavailable or blocked by browser')
    }
  }, [onShowToast])

  // Prompt Cast Device Picker
  const handlePromptCast = useCallback(async () => {
    const audio = audioRef?.current

    if (!audio) {
      triggerCastErrorVisual('Audio engine not initialized')
      return
    }

    if (!('remote' in audio) || typeof audio.remote?.prompt !== 'function') {
      triggerCastErrorVisual('Casting is not supported by your browser. Use Google Chrome or Microsoft Edge to cast to speakers & TVs.')
      return
    }

    try {
      await audio.remote.prompt()
    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'AbortError') {
        // User closed or dismissed the cast selector dialog
        return
      }
      if (err.name === 'NotFoundError') {
        triggerCastErrorVisual('No Cast devices found on your local network.')
        return
      }
      if (err.name === 'NotSupportedError') {
        triggerCastErrorVisual('Casting this audio stream is not supported by the receiver device.')
        return
      }
      console.warn('Remote playback prompt error:', err)
      triggerCastErrorVisual(err.message || 'Unable to connect to Cast device.')
    }
  }, [audioRef, triggerCastErrorVisual])

  return {
    isPipActive,
    isCasting,
    isCastAvailable,
    castError,
    handleTogglePip,
    handleExitPip,
    handlePromptCast,
  }
}
