'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { mediaPreloader } from '@/lib/media/mediaPreloader'
import { trackStreamEvent } from '@/lib/hooks/useAnalyticsTracker'

/**
 * Resolves optimized audio streaming URL based on active quality tier.
 *
 * @param {string} rawUrl - Raw audio endpoint URL
 * @param {string} [tier='320k'] - Quality tier ('lossless', '320k', '192k', '128k')
 * @returns {string|undefined}
 */
export function getOptimizedAudioSrc(rawUrl, tier = '320k') {
  if (!rawUrl) return undefined
  const sep = rawUrl.includes('?') ? '&' : '?'
  if (tier === 'lossless') return `${rawUrl}${sep}q=lossless`
  if (tier === '320k') return `${rawUrl}${sep}b=320k`
  return `${rawUrl}${sep}b=${tier}`
}

/**
 * Custom hook to manage the HTML5 audio element lifecycle, stream resolution,
 * time tracking, seamless quality switching resume times, and preloading.
 *
 * @param {Object} params
 * @param {Object|null} params.playingTrack - Currently playing track
 * @param {boolean} params.isPlaying - Playback state
 * @param {string} params.audioQuality - Active audio quality tier
 * @param {number} params.effectiveVolume - Volume scale 0-100
 * @param {number} params.restartCount - Monotonic counter to force track replay
 * @param {Function} [params.onTogglePlay] - Play/pause toggle callback
 * @param {Function} [params.onShowToast] - Toast dispatcher
 * @param {Array} [params.manualQueue=[]] - Upcoming manual queue
 * @param {Array} [params.autoplayTracks=[]] - Upcoming autoplay queue
 * @returns {{
 *   audioRef: React.RefObject<HTMLAudioElement>,
 *   activeAudioSrc: string|undefined,
 *   audioQualityLabel: string,
 *   currentTime: number,
 *   duration: number,
 *   handleTimeUpdate: () => void,
 *   handleLoadedMetadata: () => void,
 *   handleCanPlayOrPlaying: () => void,
 *   handleSeek: (val: number) => void,
 *   handleDirectTogglePlay: () => void,
 *   setCurrentTime: React.Dispatch<React.SetStateAction<number>>
 * }}
 */
export function useAudioElementEngine({
  playingTrack,
  isPlaying,
  audioQuality = '320k',
  effectiveVolume = 100,
  restartCount = 0,
  onTogglePlay,
  onShowToast,
  manualQueue = [],
  autoplayTracks = [],
}) {
  const [currentTime, setCurrentTime] = useState(0)
  const [realDuration, setRealDuration] = useState(0)
  const audioRef = useRef(null)

  const activeTier = audioQuality || '320k'
  const rawAudioUrl = playingTrack?.audioUrl

  // Compute audio source URL based on active quality tier
  const activeAudioSrc = useMemo(() => {
    return getOptimizedAudioSrc(rawAudioUrl, activeTier)
  }, [rawAudioUrl, activeTier])

  // Dynamic Quality Label for Pill
  const audioQualityLabel = useMemo(() => {
    if (playingTrack?.quality) return playingTrack.quality
    if (activeTier === '128k') return '128 kbps'
    if (activeTier === '192k') return '192 kbps'
    if (activeTier === '320k') return '320 kbps'
    if (activeTier === 'lossless') return 'Lossless'
    return '320 kbps'
  }, [playingTrack?.quality, activeTier])

  const pendingResumeTimeRef = useRef(null)
  const shouldResumeAfterQualitySwitchRef = useRef(false)

  // Seamlessly update audio stream when user changes quality tier
  const prevTierRef = useRef(activeTier)
  useEffect(() => {
    if (prevTierRef.current !== activeTier) {
      prevTierRef.current = activeTier
      if (audioRef.current && playingTrack) {
        const currentPos = audioRef.current.currentTime || currentTime
        const wasPlaying = isPlaying && !audioRef.current.paused
        pendingResumeTimeRef.current = currentPos
        shouldResumeAfterQualitySwitchRef.current = wasPlaying
      }
    }
  }, [activeTier, playingTrack, isPlaying, currentTime])

  // Track duration in seconds
  const duration = realDuration || playingTrack?.durationSeconds || playingTrack?.duration || 215

  // Volume synchronization to audio DOM element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = Math.min(1, Math.max(0, effectiveVolume / 100))
    }
  }, [effectiveVolume])

  // Ready / Playing Handler: Restores playback position after quality switch
  const handleCanPlayOrPlaying = useCallback(() => {
    mediaPreloader.setAudioBuffering(false)

    if (pendingResumeTimeRef.current !== null && audioRef.current) {
      const targetTime = pendingResumeTimeRef.current
      pendingResumeTimeRef.current = null
      try {
        audioRef.current.currentTime = targetTime
      } catch {}
      if (shouldResumeAfterQualitySwitchRef.current) {
        audioRef.current.play().catch((err) => {
          if (err.name !== 'AbortError') console.warn('Resume play error:', err)
        })
      }
    }
  }, [])

  // Handle restart count trigger (restarts current track from beginning)
  const prevRestartCountRef = useRef(restartCount)
  useEffect(() => {
    if (restartCount !== prevRestartCountRef.current) {
      prevRestartCountRef.current = restartCount
      if (restartCount > 0 && audioRef.current) {
        audioRef.current.currentTime = 0
        setCurrentTime(0)
        if (isPlaying) {
          const p = audioRef.current.play()
          if (p !== undefined) {
            p.catch(console.warn)
          }
        }
      }
    }
  }, [restartCount, isPlaying])

  // Clean up media resources on unmount
  useEffect(() => {
    const audioEl = audioRef.current
    return () => {
      mediaPreloader.clearAudioPreload()
      if (audioEl) {
        try {
          audioEl.pause()
          audioEl.removeAttribute('src')
          audioEl.load()
        } catch {}
      }
    }
  }, [])

  // Reset player duration when playing track changes
  useEffect(() => {
    setRealDuration(0)
    pendingResumeTimeRef.current = null
  }, [rawAudioUrl, playingTrack?.name])

  // Pre-buffer initial audio bytes for upcoming track and artwork
  useEffect(() => {
    const upcoming = [...(manualQueue || []), ...(autoplayTracks || [])]
    const nextItem = upcoming[0]
    const nextTrackObj = nextItem?.track || nextItem

    if (nextTrackObj?.audioUrl && nextTrackObj.audioUrl !== rawAudioUrl) {
      const nextAudioSrc = getOptimizedAudioSrc(nextTrackObj.audioUrl, activeTier)
      if (nextAudioSrc) {
        mediaPreloader.preloadAudioChunk(nextAudioSrc)
      }
    } else if (!nextItem) {
      mediaPreloader.clearAudioPreload()
    }

    for (const item of upcoming.slice(0, 3)) {
      const trackObj = item?.track || item
      const coverUrl =
        item?.project?.cover || item?.track?.cover || trackObj?.projectCover || trackObj?.cover
      if (coverUrl && typeof coverUrl === 'string' && coverUrl.startsWith('/api/media')) {
        mediaPreloader.preloadImage(
          `${coverUrl}${coverUrl.includes('?') ? '&' : '?'}w=120&q=75&fmt=webp`,
        )
      }
    }
  }, [manualQueue, autoplayTracks, rawAudioUrl, activeTier])

  // Sync playback state with audio DOM element
  useEffect(() => {
    if (!audioRef.current) return
    if (isPlaying && activeAudioSrc) {
      if (audioRef.current.paused) {
        const playPromise = audioRef.current.play()
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            if (err.name === 'AbortError') return
            console.warn('Audio playback interrupted:', err)
            if (onTogglePlay) onTogglePlay()
            if (onShowToast) onShowToast('Audio stream unavailable')
          })
        }
      }
    } else {
      if (!audioRef.current.paused) {
        audioRef.current.pause()
      }
    }
  }, [isPlaying, activeAudioSrc, onTogglePlay, onShowToast])

  // Track audio stream event in analytics
  useEffect(() => {
    if (isPlaying && playingTrack?.name) {
      trackStreamEvent({
        project: playingTrack.project || '',
        track: playingTrack.name || '',
        path: typeof window !== 'undefined' ? window.location.pathname : '/',
      })
    }
  }, [isPlaying, playingTrack?.name, playingTrack?.project])

  // Direct synchronous toggle for zero-latency playback response
  const handleDirectTogglePlay = useCallback(() => {
    if (audioRef.current) {
      if (audioRef.current.paused) {
        const playPromise = audioRef.current.play()
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn('Audio playback interrupted:', err)
          })
        }
      } else {
        audioRef.current.pause()
      }
    }
    if (onTogglePlay) onTogglePlay()
  }, [onTogglePlay])

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }, [])

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current && audioRef.current.duration) {
      setRealDuration(audioRef.current.duration)
    }
  }, [])

  const handleSeek = useCallback((val) => {
    if (audioRef.current) {
      audioRef.current.currentTime = val
      setCurrentTime(val)
    }
  }, [])

  return {
    audioRef,
    activeAudioSrc,
    audioQualityLabel,
    currentTime,
    duration,
    handleTimeUpdate,
    handleLoadedMetadata,
    handleCanPlayOrPlaying,
    handleSeek,
    handleDirectTogglePlay,
    setCurrentTime,
  }
}
