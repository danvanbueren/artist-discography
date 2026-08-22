'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import VolumeUpRoundedIcon from '@mui/icons-material/VolumeUpRounded'
import VolumeDownRoundedIcon from '@mui/icons-material/VolumeDownRounded'
import VolumeOffRoundedIcon from '@mui/icons-material/VolumeOffRounded'
import { getCookie, setCookie } from '@/lib/data/cookies'

export const MIN_LISTENABLE_VOLUME = 10
export const DEFAULT_UNMUTE_VOLUME = 100

/**
 * Custom hook to manage player volume, mute state, and persistence.
 *
 * @param {Object} params
 * @param {boolean} params.isTouch - Whether current device is a touch screen
 * @returns {{
 *   volume: number,
 *   isMuted: boolean,
 *   effectiveVolume: number,
 *   handleVolumeChange: (e: any, newValue: number) => void,
 *   handleToggleMute: () => void,
 *   VolumeIconComponent: React.ComponentType<any>
 * }}
 */
export function useAudioVolume({ isTouch = false } = {}) {
  const [volume, setVolume] = useState(100)
  const [prevVolume, setPrevVolume] = useState(100)
  const [isMuted, setIsMuted] = useState(false)

  // Load volume & mute preferences on mount
  useEffect(() => {
    try {
      const savedVol =
        getCookie('audio_playback_volume') || localStorage.getItem('audio_playback_volume')
      const savedMuted =
        getCookie('audio_playback_muted') || localStorage.getItem('audio_playback_muted')
      const savedPrevVol =
        getCookie('audio_playback_prev_volume') ||
        localStorage.getItem('audio_playback_prev_volume')

      let v = 100
      if (savedVol !== null && !isNaN(Number(savedVol))) {
        v = Math.min(100, Math.max(0, Number(savedVol)))
      }

      let pV = 100
      if (
        savedPrevVol !== null &&
        !isNaN(Number(savedPrevVol)) &&
        Number(savedPrevVol) >= MIN_LISTENABLE_VOLUME
      ) {
        pV = Math.min(100, Math.max(MIN_LISTENABLE_VOLUME, Number(savedPrevVol)))
      } else if (v >= MIN_LISTENABLE_VOLUME) {
        pV = v
      }

      const muted = savedMuted === 'true' || (savedMuted === null && v === 0)

      setVolume(v)
      setPrevVolume(pV)
      setIsMuted(muted)
    } catch {}
  }, [])

  // Touch devices always default to 100% volume in-app (controlled via hardware buttons)
  useEffect(() => {
    if (isTouch) {
      setVolume(100)
      setIsMuted(false)
    }
  }, [isTouch])

  const handleVolumeChange = useCallback((_, newValue) => {
    const val = Number(newValue)
    setVolume(val)

    if (val > 0) {
      setIsMuted(false)
      if (val >= MIN_LISTENABLE_VOLUME) {
        setPrevVolume(val)
        try {
          setCookie('audio_playback_prev_volume', String(val))
          localStorage.setItem('audio_playback_prev_volume', String(val))
        } catch {}
      }
    } else {
      setIsMuted(true)
    }

    try {
      setCookie('audio_playback_volume', String(val))
      localStorage.setItem('audio_playback_volume', String(val))
      setCookie('audio_playback_muted', String(val === 0))
      localStorage.setItem('audio_playback_muted', String(val === 0))
    } catch {}
  }, [])

  const handleToggleMute = useCallback(() => {
    if (isMuted) {
      setIsMuted(false)
      const restoreVol = prevVolume >= MIN_LISTENABLE_VOLUME ? prevVolume : DEFAULT_UNMUTE_VOLUME
      setVolume(restoreVol)
      try {
        setCookie('audio_playback_volume', String(restoreVol))
        localStorage.setItem('audio_playback_volume', String(restoreVol))
        setCookie('audio_playback_muted', 'false')
        localStorage.setItem('audio_playback_muted', 'false')
      } catch {}
    } else {
      setIsMuted(true)
      try {
        setCookie('audio_playback_muted', 'true')
        localStorage.setItem('audio_playback_muted', 'true')
      } catch {}
    }
  }, [isMuted, prevVolume])

  const effectiveVolume = isMuted ? 0 : volume

  const VolumeIconComponent = useMemo(() => {
    if (isMuted || effectiveVolume === 0) return VolumeOffRoundedIcon
    if (effectiveVolume < 50) return VolumeDownRoundedIcon
    return VolumeUpRoundedIcon
  }, [isMuted, effectiveVolume])

  return {
    volume,
    prevVolume,
    isMuted,
    effectiveVolume,
    handleVolumeChange,
    handleToggleMute,
    VolumeIconComponent,
  }
}
