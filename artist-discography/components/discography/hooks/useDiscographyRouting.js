'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { slugify, findProjectBySlug, findTrackBySlug } from '@/lib/data/slugs'

/**
 * Custom hook to manage Discography URL routing, browser history,
 * view transitions (ALL_PROJECTS vs SINGLE_PROJECT), and highlighted tracks.
 *
 * @param {Object} params
 * @param {Array} params.projects - Filtered/authorized projects list
 * @param {Array} [params.initialSlug=[]] - Server-rendered initial slug segments
 * @returns {{
 *   currentView: 'ALL_PROJECTS'|'SINGLE_PROJECT',
 *   selectedProject: Object|null,
 *   highlightedTrackSlug: string|null,
 *   pendingScrollProjectSlug: string|null,
 *   clearPendingScrollProjectSlug: () => void,
 *   handleSelectProject: (project: Object) => void,
 *   handleSelectTrackRow: (track: Object, project: Object) => void,
 *   handleSelectTrackTitle: (track: Object, project: Object) => void,
 *   handleNavigateHome: (targetProject?: Object|null) => void,
 *   navigateToCurrentTrack: () => void
 * }}
 */
export function useDiscographyRouting({ projects = [], initialSlug = [] }) {
  // Resolve initial project & track from initialSlug or window.location
  const initialResolved = useMemo(() => {
    let slugArr = initialSlug
    if (typeof window !== 'undefined' && (!slugArr || slugArr.length === 0)) {
      const pathSegments = window.location.pathname.split('/').filter(Boolean)
      slugArr = pathSegments
    }
    if (slugArr && slugArr.length > 0) {
      const matchedProject = findProjectBySlug(projects, slugArr[0])
      if (matchedProject) {
        let matchedTrackSlug = null
        if (slugArr.length > 1) {
          const matchedTrack = findTrackBySlug(matchedProject.tracks ?? [], slugArr[1])
          if (matchedTrack) {
            matchedTrackSlug = slugify(matchedTrack.name)
          }
        }
        return {
          view: 'SINGLE_PROJECT',
          project: matchedProject,
          trackSlug: matchedTrackSlug,
        }
      }
    }
    return { view: 'ALL_PROJECTS', project: null, trackSlug: null }
  }, [initialSlug, projects])

  const [currentView, setCurrentView] = useState(() => initialResolved.view)
  const [selectedProject, setSelectedProject] = useState(() => initialResolved.project)
  const [highlightedTrackSlug, setHighlightedTrackSlug] = useState(() => initialResolved.trackSlug)
  const [pendingScrollProjectSlug, setPendingScrollProjectSlug] = useState(null)

  const clearPendingScrollProjectSlug = useCallback(() => {
    setPendingScrollProjectSlug(null)
  }, [])

  // Parse path and sync SPA state with URL
  const syncStateFromLocation = useCallback(() => {
    if (typeof window === 'undefined') return
    const path = window.location.pathname
    const pathSegments = path.split('/').filter(Boolean)

    if (pathSegments.length === 0) {
      setCurrentView('ALL_PROJECTS')
      setSelectedProject(null)
      setHighlightedTrackSlug(null)
      return
    }

    const projSlug = pathSegments[0]
    const matchedProject = findProjectBySlug(projects, projSlug)

    if (matchedProject) {
      setCurrentView('SINGLE_PROJECT')
      setSelectedProject(matchedProject)

      if (pathSegments.length > 1) {
        const trkSlug = pathSegments[1]
        const matchedTrack = findTrackBySlug(matchedProject.tracks, trkSlug)
        if (matchedTrack) {
          setHighlightedTrackSlug(slugify(matchedTrack.name))
        } else {
          const validProjSlug = slugify(matchedProject.name) || projSlug
          window.history.replaceState({}, '', `/${validProjSlug}`)
          setHighlightedTrackSlug(null)
        }
      } else {
        setHighlightedTrackSlug(null)
      }
    } else {
      window.history.replaceState({}, '', '/')
      setCurrentView('ALL_PROJECTS')
      setSelectedProject(null)
      setHighlightedTrackSlug(null)
    }
  }, [projects])

  // Sync on location popstate
  useEffect(() => {
    syncStateFromLocation()
    const handlePopState = () => syncStateFromLocation()
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [syncStateFromLocation])

  const handleSelectProject = useCallback((project) => {
    const slug = slugify(project.name)
    if (slug) {
      window.history.pushState({}, '', `/${slug}`)
    }
    setSelectedProject(project)
    setCurrentView('SINGLE_PROJECT')
    setHighlightedTrackSlug(null)
    setPendingScrollProjectSlug(null)
  }, [])

  const handleSelectTrackRow = useCallback((track, project) => {
    const pSlug = slugify(project?.name || '')
    const tSlug = slugify(track?.name || '')
    if (pSlug && tSlug) {
      window.history.pushState({}, '', `/${pSlug}/${tSlug}`)
    } else if (pSlug) {
      window.history.pushState({}, '', `/${pSlug}`)
    }
    setSelectedProject(project)
    setCurrentView('SINGLE_PROJECT')
    setHighlightedTrackSlug(tSlug || null)
    setPendingScrollProjectSlug(null)
  }, [])

  const handleSelectTrackTitle = useCallback((track, project) => {
    const pSlug = slugify(project?.name || '')
    const tSlug = slugify(track?.name || '')
    if (pSlug && tSlug) {
      window.history.pushState({}, '', `/${pSlug}/${tSlug}`)
    } else if (pSlug) {
      window.history.pushState({}, '', `/${pSlug}`)
    }
    setSelectedProject(project)
    setCurrentView('SINGLE_PROJECT')
    setHighlightedTrackSlug(tSlug || null)
    setPendingScrollProjectSlug(null)
  }, [])

  const handleNavigateHome = useCallback(
    (targetProject = null) => {
      const projectToScroll = targetProject || selectedProject
      const targetSlug = projectToScroll?.name
        ? slugify(projectToScroll.name)
        : projectToScroll?.id
          ? `project-${projectToScroll.id}`
          : null

      window.history.pushState({}, '', '/')
      setCurrentView('ALL_PROJECTS')
      setSelectedProject(null)
      setHighlightedTrackSlug(null)

      if (targetSlug) {
        setPendingScrollProjectSlug(targetSlug)
      }
    },
    [selectedProject],
  )

  const navigateToCurrentTrack = useCallback(
    (playingTrack) => {
      if (!playingTrack) return
      const projectSlug = slugify(playingTrack.project || '')
      const trackSlug = slugify(playingTrack.name || '')
      const matchedProj = findProjectBySlug(projects, projectSlug)

      if (matchedProj) {
        setSelectedProject(matchedProj)
        setCurrentView('SINGLE_PROJECT')
        setHighlightedTrackSlug(trackSlug)
        setPendingScrollProjectSlug(null)
        if (typeof window !== 'undefined') {
          window.history.pushState({}, '', `/${projectSlug}${trackSlug ? `/${trackSlug}` : ''}`)
        }
      }
    },
    [projects],
  )

  return {
    currentView,
    selectedProject,
    highlightedTrackSlug,
    pendingScrollProjectSlug,
    clearPendingScrollProjectSlug,
    handleSelectProject,
    handleSelectTrackRow,
    handleSelectTrackTitle,
    handleNavigateHome,
    navigateToCurrentTrack,
  }
}
