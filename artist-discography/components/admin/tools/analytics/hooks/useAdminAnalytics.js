'use client'

import { useState, useEffect, useCallback } from 'react'

/**
 * Custom hook to manage Admin Analytics fetching, time-range state,
 * metric toggles, and clear data actions.
 *
 * @param {Object} params
 * @param {string} [params.adminPassword='']
 * @returns {Object}
 */
export function useAdminAnalytics({ adminPassword = '' } = {}) {
  const [range, setRange] = useState('30d') // '7d' | '30d' | 'all'
  const [metricMode, setMetricMode] = useState('activity') // 'activity' | 'bandwidth'
  const [analyticsData, setAnalyticsData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [clearDialogOpen, setClearDialogOpen] = useState(false)
  const [isClearing, setIsClearing] = useState(false)

  const fetchAnalytics = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) setIsRefreshing(true)
      else setIsLoading(true)
      setError('')

      try {
        const url = `/api/admin/analytics?range=${encodeURIComponent(range)}${
          adminPassword ? `&password=${encodeURIComponent(adminPassword)}` : ''
        }`
        const res = await fetch(url, {
          headers: adminPassword ? { 'x-admin-password': adminPassword } : {},
          cache: 'no-store',
        })
        const json = await res.json()

        if (res.ok && json.success) {
          setAnalyticsData(json.analytics)
        } else {
          setError(json.error || 'Failed to load analytics')
        }
      } catch (err) {
        setError('Network error loading analytics')
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [range, adminPassword],
  )

  useEffect(() => {
    fetchAnalytics(false)
  }, [fetchAnalytics])

  const handleClearAnalytics = useCallback(async () => {
    setIsClearing(true)
    setError('')

    try {
      const res = await fetch('/api/admin/analytics', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPassword }),
      })
      const json = await res.json()

      if (res.ok && json.success) {
        setClearDialogOpen(false)
        await fetchAnalytics(true)
      } else {
        setError(json.error || 'Failed to reset analytics')
      }
    } catch (err) {
      setError('Network error resetting analytics')
    } finally {
      setIsClearing(false)
    }
  }, [adminPassword, fetchAnalytics])

  return {
    range,
    setRange,
    metricMode,
    setMetricMode,
    analyticsData,
    isLoading,
    isRefreshing,
    error,
    clearDialogOpen,
    setClearDialogOpen,
    isClearing,
    fetchAnalytics: () => fetchAnalytics(true),
    handleClearAnalytics,
  }
}
