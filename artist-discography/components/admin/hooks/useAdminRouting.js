'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { slugify, findProjectBySlug } from '@/lib/data/slugs'

export const TAB_SLUGS = {
  0: 'settings',
  1: 'projects',
  2: 'audit',
  3: 'utilities',
  4: 'api',
}

export const SLUG_TO_TAB = {
  settings: 0,
  profile: 0,
  config: 0,
  projects: 1,
  project: 1,
  releases: 1,
  audit: 2,
  health: 2,
  check: 2,
  utilities: 3,
  tools: 3,
  overview: 3,
  system: 3,
  api: 4,
  docs: 4,
  explorer: 4,
}

/**
 * Returns the active admin base path ('/_sys/_admin' or '/sys/admin').
 *
 * @returns {string}
 */
export function getAdminBasePrefix() {
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/sys/admin')) {
    return '/sys/admin'
  }
  return '/_sys/_admin'
}

/**
 * Resolves active tab and project states from initial slugs or location pathname.
 *
 * @param {Object} params
 * @param {Array<string>} [params.initialSlug=[]]
 * @param {Array<Object>} [params.projectsList=[]]
 * @param {boolean} [params.hasArtistName=true]
 * @returns {{ tab: number, isCreatingNew: boolean, projectIndex: number }}
 */
export function resolveAdminRoute({ initialSlug = [], projectsList = [], hasArtistName = true }) {
  let segments = Array.isArray(initialSlug) ? initialSlug : []
  let search = ''

  if (typeof window !== 'undefined') {
    if (segments.length === 0) {
      const prefix = getAdminBasePrefix()
      const path = window.location.pathname
      if (path.startsWith(prefix)) {
        const subPath = path.slice(prefix.length).replace(/^\/+/, '')
        segments = subPath ? subPath.split('/').filter(Boolean) : []
      }
    }
    search = window.location.search || ''
  }

  if (segments.length === 0) {
    const defaultTab = hasArtistName && projectsList.length > 0 ? 1 : 0
    return {
      tab: defaultTab,
      isCreatingNew: projectsList.length === 0,
      projectIndex: projectsList.length > 0 ? 0 : -1,
    }
  }

  const rootSegment = (segments[0] || '').toLowerCase()
  const matchedTab = SLUG_TO_TAB[rootSegment] ?? (hasArtistName && projectsList.length > 0 ? 1 : 0)

  if (matchedTab === 1) {
    const isNewDraftParam = search.includes('action=new') || search.includes('new=true')
    if (segments.length > 1) {
      const targetSlug = segments[1]
      const matchedProj = findProjectBySlug(projectsList, targetSlug)
      if (matchedProj) {
        const pIdx = projectsList.findIndex((p) => p === matchedProj)
        return {
          tab: 1,
          isCreatingNew: false,
          projectIndex: pIdx >= 0 ? pIdx : 0,
          isInvalidSlug: false,
        }
      } else {
        return { tab: 1, isCreatingNew: false, projectIndex: 0, isInvalidSlug: true }
      }
    }

    if (isNewDraftParam || projectsList.length === 0) {
      return { tab: 1, isCreatingNew: true, projectIndex: -1, isInvalidSlug: false }
    }

    return { tab: 1, isCreatingNew: false, projectIndex: 0, isInvalidSlug: false }
  }

  return {
    tab: matchedTab,
    isCreatingNew: false,
    projectIndex: projectsList.length > 0 ? 0 : -1,
    isInvalidSlug: false,
  }
}

/**
 * useAdminRouting
 * Custom hook orchestrating Admin Dashboard URL routing, browser history,
 * deep linking to tabs and projects, and real-time popstate synchronization.
 */
export function useAdminRouting({ initialSlug = [], projectsList = [], hasArtistName = true }) {
  const initialResolved = useMemo(() => {
    return resolveAdminRoute({ initialSlug, projectsList, hasArtistName })
  }, [initialSlug, projectsList, hasArtistName])

  const [activeTab, setActiveTabState] = useState(() => initialResolved.tab)
  const [selectedProjIndex, setSelectedProjIndex] = useState(() => initialResolved.projectIndex)
  const [isCreatingNew, setIsCreatingNew] = useState(() => initialResolved.isCreatingNew)

  const projectsListRef = useRef(projectsList)
  useEffect(() => {
    projectsListRef.current = projectsList
  }, [projectsList])

  // If initial URL had an invalid project slug, rewrite to base /projects route
  useEffect(() => {
    if (initialResolved.isInvalidSlug && typeof window !== 'undefined') {
      const prefix = getAdminBasePrefix()
      window.history.replaceState({}, '', `${prefix}/projects`)
    }
  }, [initialResolved.isInvalidSlug])

  // Synchronize state when browser Back/Forward buttons are pressed
  const syncFromLocation = useCallback(() => {
    const resolved = resolveAdminRoute({
      initialSlug: [],
      projectsList: projectsListRef.current,
      hasArtistName,
    })
    if (resolved.isInvalidSlug && typeof window !== 'undefined') {
      const prefix = getAdminBasePrefix()
      window.history.replaceState({}, '', `${prefix}/projects`)
    }
    setActiveTabState(resolved.tab)
    setSelectedProjIndex(resolved.projectIndex)
    setIsCreatingNew(resolved.isCreatingNew)
  }, [hasArtistName])

  useEffect(() => {
    window.addEventListener('popstate', syncFromLocation)
    return () => window.removeEventListener('popstate', syncFromLocation)
  }, [syncFromLocation])

  const navigateToTab = useCallback(
    (tabIndex) => {
      setActiveTabState(tabIndex)
      const prefix = getAdminBasePrefix()
      if (tabIndex === 1) {
        const currentList = projectsListRef.current
        if (isCreatingNew) {
          window.history.pushState({}, '', `${prefix}/projects?action=new`)
        } else if (selectedProjIndex >= 0 && currentList[selectedProjIndex]) {
          const pSlug = slugify(currentList[selectedProjIndex].name)
          window.history.pushState({}, '', `${prefix}/projects/${pSlug}`)
        } else {
          window.history.pushState({}, '', `${prefix}/projects`)
        }
      } else {
        const slug = TAB_SLUGS[tabIndex] || 'settings'
        window.history.pushState({}, '', `${prefix}/${slug}`)
      }
    },
    [isCreatingNew, selectedProjIndex],
  )

  const navigateToProject = useCallback((projectIndex) => {
    const currentList = projectsListRef.current
    if (projectIndex < 0 || projectIndex >= currentList.length) return
    const proj = currentList[projectIndex]
    const pSlug = slugify(proj?.name || '')
    const prefix = getAdminBasePrefix()

    setActiveTabState(1)
    setIsCreatingNew(false)
    setSelectedProjIndex(projectIndex)

    if (pSlug) {
      window.history.pushState({}, '', `${prefix}/projects/${pSlug}`)
    } else {
      window.history.pushState({}, '', `${prefix}/projects`)
    }
  }, [])

  const navigateToNewProject = useCallback(() => {
    const prefix = getAdminBasePrefix()
    setActiveTabState(1)
    setIsCreatingNew(true)
    setSelectedProjIndex(-1)
    window.history.pushState({}, '', `${prefix}/projects?action=new`)
  }, [])

  const replaceProjectSlug = useCallback((newSlug) => {
    if (!newSlug) return
    const prefix = getAdminBasePrefix()
    window.history.replaceState({}, '', `${prefix}/projects/${newSlug}`)
  }, [])

  const replaceDeletedProject = useCallback((nextProject) => {
    const prefix = getAdminBasePrefix()
    if (nextProject?.name) {
      const pSlug = slugify(nextProject.name)
      window.history.replaceState({}, '', `${prefix}/projects/${pSlug}`)
    } else {
      window.history.replaceState({}, '', `${prefix}/projects?action=new`)
    }
  }, [])

  return {
    activeTab,
    setActiveTab: navigateToTab,
    selectedProjIndex,
    setSelectedProjIndex,
    isCreatingNew,
    setIsCreatingNew,
    navigateToProject,
    navigateToNewProject,
    replaceProjectSlug,
    replaceDeletedProject,
  }
}
