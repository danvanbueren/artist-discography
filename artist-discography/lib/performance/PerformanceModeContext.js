'use client'

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { detectHardwareAcceleration } from './performanceDetector'

const STORAGE_KEY = 'discography_perf_mode_override'
const VALID_OVERRIDES = new Set(['auto', 'high', 'lite'])

const DEFAULT_DIAGNOSTICS = {
  isHardwareAccelerated: true,
  isLowEndDevice: false,
  prefersReducedMotion: false,
  recommendedTier: 'high',
  reason: 'ssr',
  renderer: '',
}

const DEFAULT_CONTEXT_VALUE = {
  modeOverride: 'auto',
  effectiveTier: 'high',
  isLiteMode: false,
  diagnostics: DEFAULT_DIAGNOSTICS,
  setModeOverride: () => {},
  cycleModeOverride: () => {},
}

const PerformanceModeContext = createContext(DEFAULT_CONTEXT_VALUE)

/**
 * Safely reads persisted performance mode override from localStorage.
 *
 * @returns {'auto' | 'high' | 'lite'}
 */
function readStoredOverride() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw && VALID_OVERRIDES.has(raw) ? raw : 'auto'
  } catch {
    return 'auto'
  }
}

/**
 * Provides hardware-acceleration diagnostics and adaptive performance tier ('high' | 'lite')
 * across the application, allowing manual user override via localStorage.
 *
 * @param {{ children: import('react').ReactNode }} props
 */
export function PerformanceModeProvider({ children }) {
  const [modeOverride, setModeOverrideState] = useState('auto')
  const [diagnostics, setDiagnostics] = useState(DEFAULT_DIAGNOSTICS)

  useEffect(() => {
    setModeOverrideState(readStoredOverride())
    const detected = detectHardwareAcceleration()
    setDiagnostics(detected)

    const mediaQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!mediaQuery) return

    const handleMotionChange = (event) => {
      setDiagnostics((prev) => {
        const prefersReduced = Boolean(event.matches)
        const nextTier =
          !prev.isHardwareAccelerated || prefersReduced || prev.isLowEndDevice ? 'lite' : 'high'
        const nextReason = !prev.isHardwareAccelerated
          ? prev.reason
          : prefersReduced
            ? 'prefers-reduced-motion'
            : prev.isLowEndDevice
              ? 'low-end-device'
              : 'hardware-accelerated'
        return {
          ...prev,
          prefersReducedMotion: prefersReduced,
          recommendedTier: nextTier,
          reason: nextReason,
        }
      })
    }

    mediaQuery.addEventListener?.('change', handleMotionChange)
    return () => mediaQuery.removeEventListener?.('change', handleMotionChange)
  }, [])

  const effectiveTier = modeOverride === 'auto' ? diagnostics.recommendedTier : modeOverride
  const isLiteMode = effectiveTier === 'lite'

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.perfMode = effectiveTier
    }
  }, [effectiveTier])

  const setModeOverride = useCallback((nextMode) => {
    const validated = VALID_OVERRIDES.has(nextMode) ? nextMode : 'auto'
    setModeOverrideState(validated)
    try {
      window.localStorage.setItem(STORAGE_KEY, validated)
    } catch {
      // Ignore storage quota or private browsing errors
    }
  }, [])

  const cycleModeOverride = useCallback(() => {
    setModeOverrideState((prev) => {
      const next = prev === 'auto' ? 'lite' : prev === 'lite' ? 'high' : 'auto'
      try {
        window.localStorage.setItem(STORAGE_KEY, next)
      } catch {
        // Ignore storage errors
      }
      return next
    })
  }, [])

  const contextValue = useMemo(
    () => ({
      modeOverride,
      effectiveTier,
      isLiteMode,
      diagnostics,
      setModeOverride,
      cycleModeOverride,
    }),
    [modeOverride, effectiveTier, isLiteMode, diagnostics, setModeOverride, cycleModeOverride],
  )

  return (
    <PerformanceModeContext.Provider value={contextValue}>
      {children}
    </PerformanceModeContext.Provider>
  )
}

/**
 * Returns the active performance tier, hardware diagnostics, and override controls.
 */
export function usePerformanceMode() {
  return useContext(PerformanceModeContext)
}
