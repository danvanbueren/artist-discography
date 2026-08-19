'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'

const EMPTY_JOBS_ARRAY = []

export function useMediaJobs() {
  const [activeJobs, setActiveJobs] = useState(EMPTY_JOBS_ARRAY)
  const [completedJobs, setCompletedJobs] = useState(EMPTY_JOBS_ARRAY)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isTriggeringWarm, setIsTriggeringWarm] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(0)

  const activeJobsRef = useRef(EMPTY_JOBS_ARRAY)
  const completedJobsRef = useRef(EMPTY_JOBS_ARRAY)
  activeJobsRef.current = activeJobs
  completedJobsRef.current = completedJobs

  const applySnapshot = useCallback((data) => {
    if (!data) return
    const nextActive = Array.isArray(data.active) ? data.active : EMPTY_JOBS_ARRAY
    const nextCompleted = Array.isArray(data.completed) ? data.completed : EMPTY_JOBS_ARRAY

    setActiveJobs(nextActive)
    setCompletedJobs(nextCompleted)
    setLastUpdated(Date.now())
  }, [])

  const applyJobUpdate = useCallback((payload) => {
    if (!payload) return
    if (payload.summary) {
      applySnapshot(payload.summary)
      return
    }

    if (payload.job) {
      const updatedJob = payload.job
      if (updatedJob.status === 'processing' || updatedJob.status === 'queued') {
        setActiveJobs((prev) => {
          const idx = prev.findIndex((j) => j.id === updatedJob.id)
          if (idx >= 0) {
            const next = [...prev]
            next[idx] = updatedJob
            return next
          }
          return [updatedJob, ...prev]
        })
      } else {
        // Move to completed
        setActiveJobs((prev) => prev.filter((j) => j.id !== updatedJob.id))
        setCompletedJobs((prev) => {
          const exists = prev.some((j) => j.id === updatedJob.id)
          if (exists) {
            return prev.map((j) => (j.id === updatedJob.id ? updatedJob : j))
          }
          return [updatedJob, ...prev.slice(0, 49)]
        })
      }
      setLastUpdated(Date.now())
    }
  }, [applySnapshot])

  // Real-Time SSE Stream with Polling Fallback
  useEffect(() => {
    let eventSource = null
    let pollTimer = null
    let isSubscribed = true

    const fetchSnapshot = async () => {
      try {
        const res = await fetch('/api/admin/media-jobs', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          if (isSubscribed && data.success) {
            applySnapshot(data)
          }
        }
      } catch (err) {
        // Non-fatal fetch error
      }
    }

    // Initial snapshot fetch
    fetchSnapshot()

    // Setup SSE if supported in browser
    if (typeof window !== 'undefined' && window.EventSource) {
      try {
        eventSource = new EventSource('/api/admin/media-jobs?stream=1')

        eventSource.onmessage = (event) => {
          if (!isSubscribed || !event.data) return
          try {
            const parsed = JSON.parse(event.data)
            if (parsed.type === 'snapshot') {
              applySnapshot(parsed)
            } else if (parsed.type === 'update') {
              applyJobUpdate(parsed)
            }
          } catch (e) {}
        }

        eventSource.onerror = () => {
          // SSE connection dropped, fall back to interval polling
          if (eventSource) {
            eventSource.close()
            eventSource = null
          }
        }
      } catch (e) {
        eventSource = null
      }
    }

    // Polling interval as resilient sync mechanism
    const runPolling = () => {
      pollTimer = setInterval(() => {
        if (!isSubscribed) return
        fetchSnapshot()
      }, 2500)
    }
    runPolling()

    return () => {
      isSubscribed = false
      if (eventSource) {
        eventSource.close()
        eventSource = null
      }
      if (pollTimer) {
        clearInterval(pollTimer)
        pollTimer = null
      }
    }
  }, [applySnapshot, applyJobUpdate])

  // Overall aggregate progress across all active jobs
  const overallProgress = useMemo(() => {
    if (activeJobs.length === 0) return 0
    const total = activeJobs.reduce((sum, j) => sum + (j.progress || 0), 0)
    return Math.round(total / activeJobs.length)
  }, [activeJobs])

  const isProcessing = activeJobs.length > 0

  // Trigger Catalog Optimization
  const triggerWarmAll = useCallback(async (password) => {
    setIsTriggeringWarm(true)
    try {
      const res = await fetch('/api/admin/media-jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password || '',
        },
        body: JSON.stringify({ action: 'warm-all', password }),
      })
      const result = await res.json().catch(() => ({}))
      if (res.ok && result.success) {
        setIsDrawerOpen(true)
        return true
      }
      return false
    } catch (err) {
      console.error('Error triggering catalog media warming:', err)
      return false
    } finally {
      setIsTriggeringWarm(false)
    }
  }, [])

  // Clear Completed / Failed Jobs
  const clearCompleted = useCallback(async (password) => {
    try {
      const res = await fetch('/api/admin/media-jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password || '',
        },
        body: JSON.stringify({ action: 'clear-completed', password }),
      })
      const result = await res.json().catch(() => ({}))
      if (res.ok && result.success) {
        setCompletedJobs(EMPTY_JOBS_ARRAY)
        return true
      }
      return false
    } catch (err) {
      console.error('Error clearing media jobs:', err)
      return false
    }
  }, [])

  // Helper to match an active or completed job for a specific track
  const getJobForTrack = useCallback(({ projectSlug, trackSlug, trackName, fileName } = {}) => {
    const pSlug = (projectSlug || '').toLowerCase()
    const tSlug = (trackSlug || '').toLowerCase()
    const tName = (trackName || '').toLowerCase()
    const fName = (fileName || '').toLowerCase()

    if (!pSlug && !tSlug && !tName && !fName) return null

    const matchFn = (j) => {
      const details = j.details || {}
      const jProjSlug = (details.projectSlug || '').toLowerCase()
      const jTrackSlug = (details.trackSlug || '').toLowerCase()
      const jTrackName = (details.trackName || '').toLowerCase()
      const jFileName = (details.fileName || j.file || '').toLowerCase()
      const jTarget = (j.target || '').toLowerCase()

      // Exact structured match
      if (pSlug && jProjSlug && pSlug === jProjSlug) {
        if (tSlug && jTrackSlug && tSlug === jTrackSlug) return true
        if (tName && jTrackName && tName === jTrackName) return true
        if (fName && jFileName && fName === jFileName) return true
        if (tName && jTarget.includes(`"${tName}"`)) return true
        if (tSlug && jFileName.startsWith(tSlug)) return true
      }

      // Filename exact match if provided
      if (fName && (jFileName === fName || j.file?.toLowerCase() === fName)) {
        return true
      }

      return false
    }

    // Check active jobs first
    const active = activeJobsRef.current.find(matchFn)
    if (active) return active

    // Check completed jobs
    return completedJobsRef.current.find(matchFn) || null
  }, [])

  // Helper to match an active or completed job for project cover art
  const getJobForCover = useCallback(({ projectSlug, fileName } = {}) => {
    const pSlug = (projectSlug || '').toLowerCase()
    const fName = (fileName || '').toLowerCase()

    if (!pSlug && !fName) return null

    const matchFn = (j) => {
      const details = j.details || {}
      const jProjSlug = (details.projectSlug || '').toLowerCase()
      const jFileName = (details.fileName || j.file || '').toLowerCase()
      const jTarget = (j.target || '').toLowerCase()

      if (pSlug && jProjSlug && pSlug === jProjSlug) {
        if (details.isCover || jTarget.includes('cover art')) return true
        if (jFileName.startsWith('art.')) return true
      }

      if (fName && (jFileName === fName || j.file?.toLowerCase() === fName)) {
        return true
      }

      return false
    }

    const active = activeJobsRef.current.find(matchFn)
    if (active) return active

    return completedJobsRef.current.find(matchFn) || null
  }, [])

  // Helper to match an active or completed job for a specific file or track slug
  const getJobForFile = useCallback((filePattern) => {
    if (!filePattern) return null
    const patternLower = String(filePattern).toLowerCase()
    
    // Check active jobs first
    const active = activeJobsRef.current.find((j) => {
      const fileLower = (j.file || '').toLowerCase()
      const targetLower = (j.target || '').toLowerCase()
      return fileLower === patternLower || fileLower.includes(patternLower) || targetLower.includes(patternLower)
    })
    if (active) return active

    // Check completed jobs
    return completedJobsRef.current.find((j) => {
      const fileLower = (j.file || '').toLowerCase()
      const targetLower = (j.target || '').toLowerCase()
      return fileLower === patternLower || fileLower.includes(patternLower) || targetLower.includes(patternLower)
    }) || null
  }, [])

  return {
    activeJobs,
    completedJobs,
    isProcessing,
    overallProgress,
    isDrawerOpen,
    setIsDrawerOpen,
    isTriggeringWarm,
    triggerWarmAll,
    clearCompleted,
    getJobForTrack,
    getJobForCover,
    getJobForFile,
    lastUpdated,
  }
}
