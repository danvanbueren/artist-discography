'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

/**
 * Custom hook to manage Picture-in-Picture (PiP) rendering via an off-screen canvas.
 * Draws current artwork and metadata into a video stream for mini player display.
 *
 * @param {Object} params
 * @param {Object|null} params.playingTrack - Currently playing track metadata
 * @param {boolean} params.isPlaying - Audio playback state
 * @param {string|null} params.coverArt - Cover artwork URL
 * @param {Function} [params.onShowToast] - Toast message dispatcher
 * @returns {{ isPipActive: boolean, handleTogglePip: () => Promise<void>, handleExitPip: () => Promise<void> }}
 */
export function usePictureInPicture({ playingTrack, isPlaying, coverArt, onShowToast }) {
  const [isPipActive, setIsPipActive] = useState(false)
  const canvasRef = useRef(null)
  const videoRef = useRef(null)
  const streamRef = useRef(null)

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

  // Extract primitive properties to maintain clean, static dependency arrays
  const hasTrack = Boolean(playingTrack)
  const trackTitle = playingTrack?.name || 'Untitled Track'
  const trackArtist = playingTrack?.artist || 'Artist'
  const trackProject = playingTrack?.project || ''

  // 2. Draw live album artwork and track title to canvas whenever track changes
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !hasTrack) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const size = 512
    const draw = (img) => {
      ctx.clearRect(0, 0, size, size)
      ctx.fillStyle = '#121218'
      ctx.fillRect(0, 0, size, size)

      if (img && img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, 0, 0, size, size)
      } else {
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

      // Track Title
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 30px sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(trackTitle, 24, size - 65, size - 48)

      // Artist & Project Subtitle
      ctx.fillStyle = 'rgba(255,255,255,0.75)'
      ctx.font = '20px sans-serif'
      const sub = [trackArtist, trackProject].filter(Boolean).join(' • ')
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
  }, [hasTrack, trackTitle, trackArtist, trackProject, coverArt])

  // 3. Keep video play/pause synchronized with audio stream
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (isPlaying && hasTrack) {
      video.play().catch(() => {})
    } else {
      video.pause()
    }
  }, [isPlaying, hasTrack])

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
    if (!hasTrack) {
      handleExitPip()
    }
  }, [hasTrack, handleExitPip])

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

  return {
    isPipActive,
    handleTogglePip,
    handleExitPip,
  }
}
