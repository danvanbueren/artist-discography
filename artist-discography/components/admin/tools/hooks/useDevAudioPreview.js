'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

export function useDevAudioPreview() {
  const [playingAudioUrl, setPlayingAudioUrl] = useState(null)
  const audioObjRef = useRef(null)

  const cleanupAudio = useCallback((audio) => {
    if (!audio) return
    try {
      audio.pause()
      audio.removeAttribute('src')
      audio.load()
    } catch {}
  }, [])

  const stopAudio = useCallback(() => {
    if (audioObjRef.current) {
      cleanupAudio(audioObjRef.current)
      audioObjRef.current = null
    }
    setPlayingAudioUrl(null)
  }, [cleanupAudio])

  const handleSeekRelative = useCallback((offsetSeconds) => {
    const audio = audioObjRef.current
    if (!audio || typeof audio.currentTime !== 'number') return
    try {
      const maxTime = audio.duration && !Number.isNaN(audio.duration) ? audio.duration : Infinity
      const nextTime = Math.max(0, Math.min(maxTime, audio.currentTime + offsetSeconds))
      audio.currentTime = nextTime
    } catch {}
  }, [])

  // Clean up audio playback on unmount
  useEffect(() => {
    return () => {
      if (audioObjRef.current) {
        cleanupAudio(audioObjRef.current)
        audioObjRef.current = null
      }
    }
  }, [cleanupAudio])

  const handleToggleAudio = useCallback(
    (url) => {
      if (!url) return

      if (playingAudioUrl === url) {
        stopAudio()
      } else {
        if (audioObjRef.current) {
          cleanupAudio(audioObjRef.current)
          audioObjRef.current = null
        }
        const newAudio = new Audio()
        newAudio.preload = 'none'
        newAudio.src = url
        newAudio.play().catch(() => {
          cleanupAudio(newAudio)
          audioObjRef.current = null
          setPlayingAudioUrl(null)
        })
        newAudio.onended = () => {
          cleanupAudio(newAudio)
          audioObjRef.current = null
          setPlayingAudioUrl(null)
        }
        newAudio.onerror = () => {
          cleanupAudio(newAudio)
          audioObjRef.current = null
          setPlayingAudioUrl(null)
        }
        audioObjRef.current = newAudio
        setPlayingAudioUrl(url)
      }
    },
    [cleanupAudio, stopAudio, playingAudioUrl],
  )

  return {
    playingAudioUrl,
    handleToggleAudio,
    handleSeekRelative,
    stopAudio,
  }
}
