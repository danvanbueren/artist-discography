'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

/**
 * Normalizes internal artwork URLs to request a 512px WebP asset for PiP canvas rendering.
 *
 * @param {string|null} coverArt - Source artwork URL
 * @returns {string}
 */
function normalizePipCoverUrl(coverArt) {
  if (!coverArt || typeof coverArt !== 'string') return ''
  if (coverArt.startsWith('/api/') && !/[?&]w=\d+/.test(coverArt)) {
    const separator = coverArt.includes('?') ? '&' : '?'
    return `${coverArt}${separator}w=512&q=80&fmt=webp`
  }
  return coverArt
}

/**
 * Renders track metadata and optional cover artwork into the offscreen PiP canvas.
 *
 * @param {HTMLCanvasElement} canvas - 512x512 target canvas
 * @param {{ title: string, artist: string, project: string }} meta - Track labels
 * @param {HTMLImageElement|null} img - Loaded artwork image or null for fallback gradient
 */
function drawPipFrame(canvas, meta, img) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const size = 512
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

  const overlay = ctx.createLinearGradient(0, size - 150, 0, size)
  overlay.addColorStop(0, 'rgba(0,0,0,0)')
  overlay.addColorStop(0.35, 'rgba(0,0,0,0.65)')
  overlay.addColorStop(1, 'rgba(0,0,0,0.95)')
  ctx.fillStyle = overlay
  ctx.fillRect(0, size - 150, size, 150)

  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 30px sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText(meta.title, 24, size - 65, size - 48)

  ctx.fillStyle = 'rgba(255,255,255,0.75)'
  ctx.font = '20px sans-serif'
  const sub = [meta.artist, meta.project].filter(Boolean).join(' • ')
  ctx.fillText(sub, 24, size - 26, size - 48)
}

/**
 * Custom hook to manage Picture-in-Picture (PiP) rendering via a lazily allocated off-screen canvas.
 * Allocates zero canvas, video, or captureStream resources until the user explicitly opens PiP.
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
  const listenersCleanupRef = useRef(null)

  const hasTrack = Boolean(playingTrack)
  const trackTitle = playingTrack?.name || 'Untitled Track'
  const trackArtist = playingTrack?.artist || 'Artist'
  const trackProject = playingTrack?.project || ''
  const pipCoverUrl = normalizePipCoverUrl(coverArt)

  const latestMetaRef = useRef({ title: trackTitle, artist: trackArtist, project: trackProject })
  latestMetaRef.current = { title: trackTitle, artist: trackArtist, project: trackProject }

  const cleanupPipResources = useCallback(() => {
    if (listenersCleanupRef.current) {
      listenersCleanupRef.current()
      listenersCleanupRef.current = null
    }

    const stream = streamRef.current
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    const video = videoRef.current
    if (video) {
      try {
        video.pause()
        video.srcObject = null
        if (video.parentNode) {
          video.parentNode.removeChild(video)
        }
      } catch {}
      videoRef.current = null
    }

    canvasRef.current = null
    setIsPipActive(false)
  }, [])

  const drawCurrentCoverToCanvas = useCallback((canvas, meta, targetCoverUrl) => {
    drawPipFrame(canvas, meta, null)
    if (!targetCoverUrl) return () => {}

    let isCancelled = false
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      if (!isCancelled && canvasRef.current === canvas) {
        drawPipFrame(canvas, meta, img)
      }
    }
    img.src = targetCoverUrl
    if (img.complete) {
      drawPipFrame(canvas, meta, img)
    }

    return () => {
      isCancelled = true
    }
  }, [])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (typeof document !== 'undefined' && document.pictureInPictureElement === videoRef.current) {
        document.exitPictureInPicture().catch(() => {})
      }
      cleanupPipResources()
    }
  }, [cleanupPipResources])

  // Redraw artwork/metadata while PiP is actively open
  useEffect(() => {
    if (!isPipActive || !canvasRef.current || !hasTrack) return
    return drawCurrentCoverToCanvas(
      canvasRef.current,
      { title: trackTitle, artist: trackArtist, project: trackProject },
      pipCoverUrl,
    )
  }, [isPipActive, hasTrack, trackTitle, trackArtist, trackProject, pipCoverUrl, drawCurrentCoverToCanvas])

  // Sync play/pause only while PiP is actively open
  useEffect(() => {
    if (!isPipActive) return
    const video = videoRef.current
    if (!video) return

    if (isPlaying && hasTrack) {
      video.play().catch(() => {})
    } else {
      video.pause()
    }
  }, [isPipActive, isPlaying, hasTrack])

  // Exit and tear down PiP session cleanly
  const handleExitPip = useCallback(async () => {
    if (typeof document !== 'undefined') {
      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture()
        }
      } catch {}
    }
    cleanupPipResources()
  }, [cleanupPipResources])

  // Auto-destroy PiP session when audio player closes or track clears
  useEffect(() => {
    if (!hasTrack && (isPipActive || videoRef.current)) {
      handleExitPip()
    }
  }, [hasTrack, isPipActive, handleExitPip])

  // Lazily allocate canvas/video/captureStream and toggle PiP
  const handleTogglePip = useCallback(async () => {
    if (typeof document === 'undefined') return

    if (!('pictureInPictureEnabled' in document) || !document.pictureInPictureEnabled) {
      if (onShowToast) onShowToast('Picture-in-Picture is unsupported in this browser')
      return
    }

    try {
      if (document.pictureInPictureElement) {
        await handleExitPip()
        return
      }

      if (!videoRef.current) {
        const canvas = document.createElement('canvas')
        canvas.width = 512
        canvas.height = 512
        canvasRef.current = canvas

        drawCurrentCoverToCanvas(canvas, latestMetaRef.current, pipCoverUrl)

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
        const handleLeavePip = () => cleanupPipResources()
        video.addEventListener('enterpictureinpicture', handleEnterPip)
        video.addEventListener('leavepictureinpicture', handleLeavePip)
        listenersCleanupRef.current = () => {
          video.removeEventListener('enterpictureinpicture', handleEnterPip)
          video.removeEventListener('leavepictureinpicture', handleLeavePip)
        }

        if (typeof canvas.captureStream === 'function') {
          const stream = canvas.captureStream(10)
          streamRef.current = stream
          video.srcObject = stream
        }
      }

      if (videoRef.current) {
        await videoRef.current.play().catch(() => {})
        await videoRef.current.requestPictureInPicture()
        setIsPipActive(true)
      }
    } catch (err) {
      console.warn('Picture-in-Picture request failed:', err)
      cleanupPipResources()
      if (onShowToast) onShowToast('Picture-in-Picture is unavailable or blocked by browser')
    }
  }, [onShowToast, pipCoverUrl, handleExitPip, cleanupPipResources, drawCurrentCoverToCanvas])

  return {
    isPipActive,
    handleTogglePip,
    handleExitPip,
  }
}
