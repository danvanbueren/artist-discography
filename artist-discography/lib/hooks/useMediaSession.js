'use client'

import { useEffect, useRef } from 'react'

const ARTWORK_SIZES = [96, 128, 192, 256, 384, 512]

/**
 * Custom hook to synchronize HTML5 audio playback with the browser & OS Media Session API.
 * Provides full integration with Chrome Global Media Controls, Windows SMTC, macOS Control Center,
 * mobile lockscreen widgets, and hardware media keys.
 */
export function useMediaSession({
  playingTrack,
  isPlaying,
  currentTime,
  duration,
  onTogglePlay,
  onSkipNext,
  onSkipPrev,
  onSeek,
}) {
  const onTogglePlayRef = useRef(onTogglePlay)
  onTogglePlayRef.current = onTogglePlay

  const onSkipNextRef = useRef(onSkipNext)
  onSkipNextRef.current = onSkipNext

  const onSkipPrevRef = useRef(onSkipPrev)
  onSkipPrevRef.current = onSkipPrev

  const onSeekRef = useRef(onSeek)
  onSeekRef.current = onSeek

  const currentTimeRef = useRef(currentTime)
  currentTimeRef.current = currentTime

  const durationRef = useRef(duration)
  durationRef.current = duration

  const isPlayingRef = useRef(isPlaying)
  isPlayingRef.current = isPlaying

  // 1. Synchronize Metadata (Track Title, Artist, Album, Multi-Resolution Artwork)
  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !('mediaSession' in navigator) ||
      !window.MediaMetadata ||
      !playingTrack
    ) {
      return
    }

    const title = playingTrack.name || 'Untitled Track'
    const artist = playingTrack.artist || playingTrack.projectArtist || 'Artist'
    const album = playingTrack.project || 'Discography'
    const rawCover =
      playingTrack.cover ||
      playingTrack.image ||
      playingTrack.projectCover ||
      '/api/logo?w=512&fmt=png'

    const artworkList = []

    if (
      typeof rawCover === 'string' &&
      (rawCover.startsWith('/api/media') ||
        rawCover.startsWith('/api/logo') ||
        rawCover.startsWith('/'))
    ) {
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const sep = rawCover.includes('?') ? '&' : '?'
      for (const sz of ARTWORK_SIZES) {
        artworkList.push({
          src: origin + rawCover + sep + 'w=' + sz + '&q=85&fmt=png',
          sizes: sz + 'x' + sz,
          type: 'image/png',
        })
      }
    } else if (typeof rawCover === 'string' && rawCover) {
      artworkList.push({
        src: rawCover,
        sizes: '512x512',
        type: 'image/png',
      })
    }

    try {
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title,
        artist,
        album,
        artwork: artworkList,
      })
    } catch (err) {
      console.warn('Failed to set MediaSession metadata:', err)
    }
  }, [
    playingTrack?.name,
    playingTrack?.artist,
    playingTrack?.projectArtist,
    playingTrack?.project,
    playingTrack?.cover,
    playingTrack?.image,
    playingTrack?.projectCover,
  ])

  // 2. Synchronize Playback State (playing vs. paused vs. none)
  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return

    try {
      if (playingTrack) {
        navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused'
      } else {
        navigator.mediaSession.playbackState = 'none'
      }
    } catch (err) {
      console.warn('Failed to set MediaSession playbackState:', err)
    }
  }, [isPlaying, Boolean(playingTrack)])

  // 3. Synchronize Position State (Timeline / Scrubber)
  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return
    if (!playingTrack || !duration || isNaN(duration) || duration <= 0) return

    try {
      if ('setPositionState' in navigator.mediaSession) {
        const safePosition = Math.min(Math.max(0, currentTime || 0), duration)
        navigator.mediaSession.setPositionState({
          duration: Math.max(1, duration),
          playbackRate: 1.0,
          position: safePosition,
        })
      }
    } catch (err) {
      // Ignored if invoked during stream buffer transitions
    }
  }, [currentTime, duration, Boolean(playingTrack)])

  // 4. Register Action Handlers (Hardware Keys & OS Widget Buttons)
  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator) || !playingTrack) {
      return
    }

    const actionHandlers = [
      [
        'play',
        () => {
          if (onTogglePlayRef.current && !isPlayingRef.current) {
            onTogglePlayRef.current()
          }
        },
      ],
      [
        'pause',
        () => {
          if (onTogglePlayRef.current && isPlayingRef.current) {
            onTogglePlayRef.current()
          }
        },
      ],
      [
        'previoustrack',
        () => {
          if (onSkipPrevRef.current) {
            onSkipPrevRef.current()
          }
        },
      ],
      [
        'nexttrack',
        () => {
          if (onSkipNextRef.current) {
            onSkipNextRef.current()
          }
        },
      ],
      [
        'seekbackward',
        (details) => {
          const skipTime = details?.seekOffset || 10
          const current = currentTimeRef.current || 0
          const target = Math.max(0, current - skipTime)
          if (onSeekRef.current) onSeekRef.current(target)
        },
      ],
      [
        'seekforward',
        (details) => {
          const skipTime = details?.seekOffset || 10
          const current = currentTimeRef.current || 0
          const dur = durationRef.current || 0
          const target = Math.min(dur, current + skipTime)
          if (onSeekRef.current) onSeekRef.current(target)
        },
      ],
      [
        'seekto',
        (details) => {
          if (details?.seekTime !== undefined && !isNaN(details.seekTime) && onSeekRef.current) {
            onSeekRef.current(details.seekTime)
          }
        },
      ],
      [
        'stop',
        () => {
          if (onTogglePlayRef.current && isPlayingRef.current) {
            onTogglePlayRef.current()
          }
        },
      ],
    ]

    for (const [action, handler] of actionHandlers) {
      try {
        navigator.mediaSession.setActionHandler(action, handler)
      } catch (err) {
        // Some actions may not be supported by all browser versions
      }
    }

    return () => {
      for (const [action] of actionHandlers) {
        try {
          navigator.mediaSession.setActionHandler(action, null)
        } catch (err) {}
      }
    }
  }, [Boolean(playingTrack)])
}
