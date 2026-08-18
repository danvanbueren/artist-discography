'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

export function useDevAudioPreview() {
  const [playingAudioUrl, setPlayingAudioUrl] = useState(null)
  const [audioObj, setAudioObj] = useState(null)

  const playingAudioUrlRef = useRef(playingAudioUrl)
  playingAudioUrlRef.current = playingAudioUrl

  const audioObjRef = useRef(audioObj)
  audioObjRef.current = audioObj

  // Clean up audio playback on unmount
  useEffect(() => {
    return () => {
      if (audioObjRef.current) {
        audioObjRef.current.pause()
      }
    }
  }, [])

  const handleToggleAudio = useCallback((url) => {
    if (!url) return

    if (playingAudioUrlRef.current === url) {
      if (audioObjRef.current) {
        audioObjRef.current.pause()
      }
      setPlayingAudioUrl(null)
      setAudioObj(null)
    } else {
      if (audioObjRef.current) {
        audioObjRef.current.pause()
      }
      const newAudio = new Audio(url)
      newAudio.play().catch(() => { })
      newAudio.onended = () => {
        setPlayingAudioUrl(null)
        setAudioObj(null)
      }
      setAudioObj(newAudio)
      setPlayingAudioUrl(url)
    }
  }, [])

  return {
    playingAudioUrl,
    handleToggleAudio,
  }
}
