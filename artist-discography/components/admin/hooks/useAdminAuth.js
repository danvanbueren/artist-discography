'use client'

import { useState, useEffect } from 'react'

export function useAdminAuth(initialData = {}) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => initialData?.adminPassword === '')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [isAuthLoading, setIsAuthLoading] = useState(false)

  // Auto-dismiss transient auth error
  useEffect(() => {
    if (!authError) return
    const timer = setTimeout(() => {
      setAuthError('')
    }, 5000)
    return () => clearTimeout(timer)
  }, [authError])

  // Check stored auth session or auto-authenticate if password is empty
  useEffect(() => {
    try {
      if (initialData?.adminPassword === '') {
        setIsAuthenticated(true)
        setPassword('')
        sessionStorage.setItem('admin_authenticated', 'true')
        sessionStorage.setItem('admin_password', '')
      } else {
        const storedAuth = sessionStorage.getItem('admin_authenticated')
        const storedPass = sessionStorage.getItem('admin_password')
        if (storedAuth === 'true' && storedPass !== null) {
          setIsAuthenticated(true)
          setPassword(storedPass)
        }
      }
    } catch (err) { }
  }, [initialData])

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
        setIsAuthenticated(true)
        try {
          sessionStorage.setItem('admin_authenticated', 'true')
          sessionStorage.setItem('admin_password', password)
        } catch (e) { }
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
    if (initialData?.adminPassword === '') return
    setIsAuthenticated(false)
    setPassword('')
    try {
      sessionStorage.removeItem('admin_authenticated')
      sessionStorage.removeItem('admin_password')
    } catch (e) { }
  }

  return {
    isAuthenticated,
    setIsAuthenticated,
    password,
    setPassword,
    authError,
    setAuthError,
    isAuthLoading,
    handleLogin,
    handleLogout,
  }
}
