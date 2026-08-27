'use client'

import { useState, useEffect, useCallback, useRef, useSyncExternalStore } from 'react'

const emptySubscribe = () => () => {}

function getClientStoredSession(isPasswordless) {
  if (isPasswordless) return { isAuthenticated: true, password: '' }
  if (typeof window === 'undefined') return { isAuthenticated: false, password: '' }
  try {
    const storedAuth = sessionStorage.getItem('admin_authenticated') === 'true'
    const storedPass = sessionStorage.getItem('admin_password')
    if (storedAuth && storedPass !== null) {
      return { isAuthenticated: true, password: storedPass }
    }
  } catch {}
  return { isAuthenticated: false, password: '' }
}

const CHECK_COOLDOWN_MS = 15000
const HEARTBEAT_INTERVAL_MS = 45000

export function useAdminAuth(initialData = {}) {
  const isPasswordless = initialData?.adminPassword === ''
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  )

  const [adminAccess, setAdminAccess] = useState(initialData?.adminAccess !== false)
  const [sessionAuth, setSessionAuth] = useState(null)
  const [authError, setAuthError] = useState('')
  const [isAuthLoading, setIsAuthLoading] = useState(false)

  const activeSession = sessionAuth ?? getClientStoredSession(isPasswordless)
  const isAuthenticated = isPasswordless || activeSession.isAuthenticated
  const password = activeSession.password
  const isCheckingAuth = !isMounted && !isPasswordless

  const passwordRef = useRef(password)
  passwordRef.current = password

  const isAuthenticatedRef = useRef(isAuthenticated)
  isAuthenticatedRef.current = isAuthenticated

  const isCheckingRef = useRef(false)
  const lastCheckTimestampRef = useRef(0)

  // Auto-dismiss transient auth error
  useEffect(() => {
    if (!authError) return
    const timer = setTimeout(() => {
      setAuthError('')
    }, 5000)
    return () => clearTimeout(timer)
  }, [authError])

  const setPassword = useCallback(
    (newPass) => {
      setSessionAuth((prev) => ({
        ...(prev ?? getClientStoredSession(isPasswordless)),
        password: newPass,
      }))
    },
    [isPasswordless],
  )

  const setIsAuthenticated = useCallback(
    (authStatus) => {
      setSessionAuth((prev) => ({
        ...(prev ?? getClientStoredSession(isPasswordless)),
        isAuthenticated: authStatus,
      }))
    },
    [isPasswordless],
  )

  /**
   * Directly handles API auth violations (401/403) from mutations across the portal.
   */
  const handleApiAuthStatus = useCallback(
    (status, errorMsg) => {
      if (status === 403) {
        setAdminAccess(false)
        if (errorMsg) setAuthError(errorMsg)
      } else if (status === 401) {
        setIsAuthenticated(false)
        try {
          sessionStorage.removeItem('admin_authenticated')
          sessionStorage.removeItem('admin_password')
        } catch {}
        setAuthError(errorMsg || 'Session expired or password was changed.')
      }
    },
    [setIsAuthenticated],
  )

  /**
   * Lightweight session and access verification.
   * Throttled to avoid excess network traffic unless force is true.
   */
  const checkAuthSession = useCallback(
    async ({ force = false } = {}) => {
      if (isCheckingRef.current) return
      const now = Date.now()
      if (!force && now - lastCheckTimestampRef.current < CHECK_COOLDOWN_MS) {
        return
      }

      isCheckingRef.current = true
      lastCheckTimestampRef.current = now

      try {
        const currentPass = passwordRef.current || ''
        const res = await fetch('/api/admin/auth', {
          method: 'GET',
          headers: {
            'x-admin-password': currentPass,
          },
          cache: 'no-store',
          signal: AbortSignal.timeout(8000),
        })

        const data = await res.json().catch(() => ({}))

        if (res.status === 403 || data?.adminAccess === false) {
          setAdminAccess(false)
          return
        }

        if (res.status === 401 || !data?.authenticated) {
          setAdminAccess(true)
          if (isAuthenticatedRef.current) {
            setIsAuthenticated(false)
            try {
              sessionStorage.removeItem('admin_authenticated')
              sessionStorage.removeItem('admin_password')
            } catch {}
            setAuthError(data?.error || 'Session expired or password was changed.')
          }
          return
        }

        if (res.ok && data?.authenticated) {
          setAdminAccess(true)
          if (!isAuthenticatedRef.current) {
            setIsAuthenticated(true)
          }
        }
      } catch {
        // Fail gracefully on transient network blip without locking user out
      } finally {
        isCheckingRef.current = false
      }
    },
    [setIsAuthenticated],
  )

  // 1. Initial verification on mount
  useEffect(() => {
    checkAuthSession({ force: true })
  }, [checkAuthSession])

  // 2. Visibility change and window focus listeners (lazy check when user returns)
  useEffect(() => {
    const handleActivity = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        checkAuthSession()
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleActivity)
      document.addEventListener('visibilitychange', handleActivity)
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', handleActivity)
        document.removeEventListener('visibilitychange', handleActivity)
      }
    }
  }, [checkAuthSession])

  // 3. Periodic heartbeat check while tab is visible
  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        checkAuthSession()
      }
    }, HEARTBEAT_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [checkAuthSession])

  // Authentication submit
  const handleLogin = async (e) => {
    if (e?.preventDefault) {
      e.preventDefault()
    }
    setAuthError('')
    setIsAuthLoading(true)

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json().catch(() => ({}))

      if (res.status === 403 || data.adminAccess === false) {
        setAdminAccess(false)
        setAuthError(data.error || 'Admin access is disabled in config.json')
        return
      }

      if (res.ok && data.authenticated) {
        setAdminAccess(true)
        setSessionAuth({ isAuthenticated: true, password })
        try {
          sessionStorage.setItem('admin_authenticated', 'true')
          sessionStorage.setItem('admin_password', password)
        } catch (e) {}
      } else {
        setAuthError(data.error || 'Authentication failed')
      }
    } catch {
      setAuthError('Network error during authentication')
    } finally {
      setIsAuthLoading(false)
    }
  }

  const handleLogout = () => {
    if (isPasswordless) return
    setSessionAuth({ isAuthenticated: false, password: '' })
    try {
      sessionStorage.removeItem('admin_authenticated')
      sessionStorage.removeItem('admin_password')
    } catch (e) {}
  }

  const updateSessionPassword = useCallback(
    (newPass) => {
      setSessionAuth((prev) => ({
        ...(prev ?? getClientStoredSession(isPasswordless)),
        password: newPass,
      }))
      try {
        sessionStorage.setItem('admin_password', newPass)
      } catch (e) {}
    },
    [isPasswordless],
  )

  return {
    adminAccess,
    setAdminAccess,
    checkAuthSession,
    handleApiAuthStatus,
    isAuthenticated,
    setIsAuthenticated,
    isCheckingAuth,
    password,
    setPassword,
    updateSessionPassword,
    authError,
    setAuthError,
    isAuthLoading,
    handleLogin,
    handleLogout,
  }
}
