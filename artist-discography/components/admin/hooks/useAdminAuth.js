'use client'

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react'

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

export function useAdminAuth(initialData = {}) {
  const isPasswordless = initialData?.adminPassword === ''
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  )

  const [sessionAuth, setSessionAuth] = useState(null)
  const [authError, setAuthError] = useState('')
  const [isAuthLoading, setIsAuthLoading] = useState(false)

  const activeSession = sessionAuth ?? getClientStoredSession(isPasswordless)
  const isAuthenticated = isPasswordless || activeSession.isAuthenticated
  const password = activeSession.password
  const isCheckingAuth = !isMounted && !isPasswordless

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

      if (res.ok && data.authenticated) {
        setSessionAuth({ isAuthenticated: true, password })
        try {
          sessionStorage.setItem('admin_authenticated', 'true')
          sessionStorage.setItem('admin_password', password)
        } catch (e) {}
      } else {
        setAuthError(data.error || 'Authentication failed')
      }
    } catch (err) {
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
