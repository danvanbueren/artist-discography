'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

export function useDevAudioPreview() {
  const [playingAudioUrl, setPlayingAudioUrl] = useState(null)
  const [audioObj, setAudioObj] = useState(null)

  const playingAudioUrlRef = useRef(playingAudioUrl)
  playingAudioUrlRef.current = playingAudioUrl

  const audioObjRef = useRef(audioObj)
  audioObjRef.current = audioObj

  const cleanupAudio = useCallback((audio) => {
    if (!audio) return
    try {
      audio.pause()
      audio.removeAttribute('src')
      audio.load()
    } catch {}
  }, [])

  // Clean up audio playback on unmount
  useEffect(() => {
    return () => {
      if (audioObjRef.current) {
        cleanupAudio(audioObjRef.current)
      }
    }
  }, [cleanupAudio])

  const handleToggleAudio = useCallback((url) => {
    if (!url) return

    if (playingAudioUrlRef.current === url) {
      if (audioObjRef.current) {
        cleanupAudio(audioObjRef.current)
      }
      setPlayingAudioUrl(null)
      setAudioObj(null)
    } else {
      if (audioObjRef.current) {
        cleanupAudio(audioObjRef.current)
      }
      const newAudio = new Audio(url)
      newAudio.play().catch(() => { })
      newAudio.onended = () => {
        cleanupAudio(newAudio)
        setPlayingAudioUrl(null)
        setAudioObj(null)
      }
      setAudioObj(newAudio)
      setPlayingAudioUrl(url)
    }
  }, [cleanupAudio])

  return {
    playingAudioUrl,
    handleToggleAudio,
  }
}
