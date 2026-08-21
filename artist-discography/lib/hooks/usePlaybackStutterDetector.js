'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

const MIN_ALERT_HOLD_MS = 8000
const SMOOTH_RECOVERY_MS = 7500
const STALL_WINDOW_MS = 20000
const STALL_TRIGGER_DURATION_MS = 1000

/**
 * usePlaybackStutterDetector
 * Monitors HTML5 audio playback for stalls, buffering delays, and stuttering.
 * Implements a debounced hysteresis system to prevent flickering alert states.
 */
export function usePlaybackStutterDetector({ isPlaying, audioQuality, trackKey } = {}) {
  const [isStuttering, setIsStuttering] = useState(false)

  const isStutteringRef = useRef(false)
  isStutteringRef.current = isStuttering

  const stallHistoryRef = useRef([])
  const currentStallStartRef = useRef(null)
  const alertStartTimeRef = useRef(0)
  const isSeekingRef = useRef(false)
  const recoveryTimerRef = useRef(null)
  const stallCheckTimerRef = useRef(null)
  const smoothStartRef = useRef(null)

  const clearRecoveryTimer = useCallback(() => {
    if (recoveryTimerRef.current) {
      clearTimeout(recoveryTimerRef.current)
      recoveryTimerRef.current = null
    }
  }, [])

  const clearStallCheckTimer = useCallback(() => {
    if (stallCheckTimerRef.current) {
      clearTimeout(stallCheckTimerRef.current)
      stallCheckTimerRef.current = null
    }
  }, [])

  const triggerStutterAlert = useCallback(() => {
    clearRecoveryTimer()
    if (!isStutteringRef.current) {
      isStutteringRef.current = true
      alertStartTimeRef.current = Date.now()
      setIsStuttering(true)
    }
  }, [clearRecoveryTimer])

  const scheduleRecoveryCheck = useCallback(() => {
    clearRecoveryTimer()
    if (!isStutteringRef.current) return

    const now = Date.now()
    const elapsedSinceAlert = now - alertStartTimeRef.current
    const elapsedSinceSmooth = smoothStartRef.current ? now - smoothStartRef.current : 0

    const timeUntilAlertMin = Math.max(0, MIN_ALERT_HOLD_MS - elapsedSinceAlert)
    const timeUntilSmoothMin = Math.max(0, SMOOTH_RECOVERY_MS - elapsedSinceSmooth)
    const delay = Math.max(timeUntilAlertMin, timeUntilSmoothMin, 500)

    recoveryTimerRef.current = setTimeout(() => {
      if (!isStutteringRef.current) return
      const curNow = Date.now()
      const canDismiss =
        curNow - alertStartTimeRef.current >= MIN_ALERT_HOLD_MS &&
        smoothStartRef.current &&
        curNow - smoothStartRef.current >= SMOOTH_RECOVERY_MS

      if (canDismiss) {
        isStutteringRef.current = false
        setIsStuttering(false)
        stallHistoryRef.current = []
      } else {
        scheduleRecoveryCheck()
      }
    }, delay)
  }, [clearRecoveryTimer])

  const handleWaitingOrStalled = useCallback(() => {
    if (isSeekingRef.current) return

    const now = Date.now()
    smoothStartRef.current = null
    clearRecoveryTimer()

    if (!currentStallStartRef.current) {
      currentStallStartRef.current = now
    }

    // Prune old stalls from window
    stallHistoryRef.current = stallHistoryRef.current.filter((ts) => now - ts < STALL_WINDOW_MS)
    stallHistoryRef.current.push(now)

    // Multiple stalls within window trigger alert immediately
    if (stallHistoryRef.current.length >= 2) {
      triggerStutterAlert()
      return
    }

    // Otherwise trigger if stall persists longer than threshold
    clearStallCheckTimer()
    stallCheckTimerRef.current = setTimeout(() => {
      if (currentStallStartRef.current) {
        triggerStutterAlert()
      }
    }, STALL_TRIGGER_DURATION_MS)
  }, [clearRecoveryTimer, clearStallCheckTimer, triggerStutterAlert])

  const handlePlayingOrCanPlay = useCallback(() => {
    currentStallStartRef.current = null
    clearStallCheckTimer()

    if (!isSeekingRef.current) {
      smoothStartRef.current = Date.now()
      if (isStutteringRef.current) {
        scheduleRecoveryCheck()
      }
    }
  }, [clearStallCheckTimer, scheduleRecoveryCheck])

  const handleSeeking = useCallback(() => {
    isSeekingRef.current = true
    currentStallStartRef.current = null
    clearStallCheckTimer()
  }, [clearStallCheckTimer])

  const handleSeeked = useCallback(() => {
    isSeekingRef.current = false
    smoothStartRef.current = Date.now()
    if (isStutteringRef.current) {
      scheduleRecoveryCheck()
    }
  }, [scheduleRecoveryCheck])

  const reset = useCallback(() => {
    clearRecoveryTimer()
    clearStallCheckTimer()
    currentStallStartRef.current = null
    smoothStartRef.current = null
    stallHistoryRef.current = []
    isSeekingRef.current = false
    if (isStutteringRef.current) {
      isStutteringRef.current = false
      setIsStuttering(false)
    }
  }, [clearRecoveryTimer, clearStallCheckTimer])

  // Reset when quality changes, track changes, or user pauses
  useEffect(() => {
    reset()
  }, [audioQuality, trackKey, isPlaying, reset])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearRecoveryTimer()
      clearStallCheckTimer()
    }
  }, [clearRecoveryTimer, clearStallCheckTimer])

  return {
    isStuttering,
    onWaiting: handleWaitingOrStalled,
    onStalled: handleWaitingOrStalled,
    onPlaying: handlePlayingOrCanPlay,
    onCanPlay: handlePlayingOrCanPlay,
    onSeeking: handleSeeking,
    onSeeked: handleSeeked,
    reset,
  }
}
