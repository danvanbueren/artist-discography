'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

/**
 * Custom hook to manage W3C Remote Playback API (Google Cast / Chrome)
 * and Apple WebKit AirPlay API (Safari iOS / macOS).
 *
 * @param {Object} params
 * @param {React.RefObject<HTMLAudioElement>} params.audioRef - Ref to active HTML5 audio element
 * @param {Function} [params.onShowToast] - Toast message callback
 * @returns {{
 *   isCasting: boolean,
 *   isCastAvailable: boolean,
 *   castError: boolean,
 *   castType: 'remote' | 'airplay' | 'none',
 *   handlePromptCast: () => Promise<void>
 * }}
 */
export function useRemotePlayback({ audioRef, onShowToast }) {
  const [isCasting, setIsCasting] = useState(false)
  const [isCastAvailable, setIsCastAvailable] = useState(true)
  const [castError, setCastError] = useState(false)
  const [castType, setCastType] = useState('remote') // 'remote' | 'airplay' | 'none'

  const castErrorTimeoutRef = useRef(null)

  // Remote Playback API & WebKit AirPlay Listeners
  useEffect(() => {
    const audio = audioRef?.current
    if (!audio) return

    // A. W3C Remote Playback API (Chromium, Chrome on Android, Edge)
    if ('remote' in audio && audio.remote) {
      setCastType('remote')
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
          audio.remote
            .watchAvailability((available) => {
              setIsCastAvailable(available)
            })
            .then((id) => {
              watchId = id
            })
            .catch(() => {
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
    }

    // B. Apple WebKit AirPlay API (iOS Safari, iPadOS, macOS Safari)
    if (typeof audio.webkitShowPlaybackTargetPicker === 'function') {
      setCastType('airplay')

      const handleAirPlayAvailability = (event) => {
        setIsCastAvailable(event.availability === 'available')
      }

      const handleAirPlayTargetChanged = () => {
        const isWireless = Boolean(audio.webkitCurrentPlaybackTargetIsWireless)
        setIsCasting(isWireless)
        if (onShowToast && isWireless) {
          onShowToast('Connected to AirPlay device')
        }
      }

      audio.addEventListener('webkitplaybacktargetavailabilitychanged', handleAirPlayAvailability)
      audio.addEventListener(
        'webkitcurrentplaybacktargetiswirelesschanged',
        handleAirPlayTargetChanged,
      )

      return () => {
        audio.removeEventListener(
          'webkitplaybacktargetavailabilitychanged',
          handleAirPlayAvailability,
        )
        audio.removeEventListener(
          'webkitcurrentplaybacktargetiswirelesschanged',
          handleAirPlayTargetChanged,
        )
      }
    }

    setCastType('none')
  }, [audioRef, onShowToast])

  const triggerCastErrorVisual = useCallback(
    (message) => {
      setCastError(true)
      if (castErrorTimeoutRef.current) clearTimeout(castErrorTimeoutRef.current)
      castErrorTimeoutRef.current = setTimeout(() => {
        setCastError(false)
      }, 1200)
      if (onShowToast && message) {
        onShowToast(message)
      }
    },
    [onShowToast],
  )

  // Prompt Cast / AirPlay Device Picker
  const handlePromptCast = useCallback(async () => {
    const audio = audioRef?.current

    if (!audio) {
      triggerCastErrorVisual('Audio engine not initialized')
      return
    }

    // 1. Google Chrome / Chromium Remote Playback API
    if ('remote' in audio && typeof audio.remote?.prompt === 'function') {
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
          triggerCastErrorVisual('Casting is not supported by this receiver.')
          return
        }

        if (
          typeof window !== 'undefined' &&
          (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ) {
          triggerCastErrorVisual(
            'Cast devices cannot connect to "localhost". Access via your local network IP (e.g. 192.168.x.x) or domain.',
          )
          return
        }

        console.warn('Remote playback prompt error:', err)
        triggerCastErrorVisual(err.message || 'Unable to connect to Cast device.')
      }
      return
    }

    // 2. Apple WebKit AirPlay Picker
    if (typeof audio.webkitShowPlaybackTargetPicker === 'function') {
      try {
        audio.webkitShowPlaybackTargetPicker()
      } catch (err) {
        console.warn('AirPlay prompt error:', err)
        triggerCastErrorVisual('Unable to open AirPlay device picker.')
      }
      return
    }

    triggerCastErrorVisual(
      'Casting is not supported by your current browser. Use Google Chrome, Edge, or Safari to stream to external speakers.',
    )
  }, [audioRef, triggerCastErrorVisual])

  return {
    isCasting,
    isCastAvailable,
    castError,
    castType,
    handlePromptCast,
  }
}
