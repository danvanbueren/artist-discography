'use client'

import { useState, useMemo, useCallback } from 'react'

/**
 * Custom hook to manage release type filtering, text search querying,
 * and sorting for the Discography projects and tracks.
 *
 * @param {Object} params
 * @param {Array} params.projects - Full projects array
 * @returns {{
 *   activeTypes: string[],
 *   sortOrder: 'newest'|'oldest'|'title-asc'|'title-desc',
 *   searchQuery: string,
 *   setSearchQuery: React.Dispatch<React.SetStateAction<string>>,
 *   setSortOrder: React.Dispatch<React.SetStateAction<string>>,
 *   handleToggleType: (type: string) => void,
 *   handleResetTypes: () => void,
 *   filteredProjects: Array<Object>,
 *   displayedDiscographyTracks: Array<Object>
 * }}
 */
export function useDiscographyFilterSort({ projects = [] }) {
  const [activeTypes, setActiveTypes] = useState([]) // e.g. ['LP', 'EP']
  const [sortOrder, setSortOrder] = useState('newest') // 'newest' | 'oldest' | 'title-asc' | 'title-desc'
  const [searchQuery, setSearchQuery] = useState('')

  const handleToggleType = useCallback((type) => {
    setActiveTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    )
  }, [])

  const handleResetTypes = useCallback(() => {
    setActiveTypes([])
  }, [])

  // Filter projects by release type, search query, and sort
  const filteredProjects = useMemo(() => {
    let result = [...(projects || [])]

    // 1. Filter by active types
    if (activeTypes.length > 0) {
      result = result.filter((p) => activeTypes.includes(p.type))
    }

    // 2. Filter by search query (matches project title, artist, or any track title)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter((p) => {
        const matchTitle = (p.name || '').toLowerCase().includes(q)
        const matchArtist = (p.artist || '').toLowerCase().includes(q)
        const matchTracks = (p.tracks || []).some(
          (t) =>
            (t.name || '').toLowerCase().includes(q) || (t.artist || '').toLowerCase().includes(q),
        )
        return matchTitle || matchArtist || matchTracks
      })
    }

    // 3. Sort projects
    result.sort((a, b) => {
      if (sortOrder === 'newest') {
        const timeA = a.date ? new Date(a.date).getTime() : 0
        const timeB = b.date ? new Date(b.date).getTime() : 0
        const validA = !isNaN(timeA) ? timeA : 0
        const validB = !isNaN(timeB) ? timeB : 0
        return validB - validA
      }
      if (sortOrder === 'oldest') {
        const timeA = a.date ? new Date(a.date).getTime() : 0
        const timeB = b.date ? new Date(b.date).getTime() : 0
        const validA = !isNaN(timeA) ? timeA : 0
        const validB = !isNaN(timeB) ? timeB : 0
        return validA - validB
      }
      if (sortOrder === 'title-asc') {
        return (a.name || '').localeCompare(b.name || '')
      }
      if (sortOrder === 'title-desc') {
        return (b.name || '').localeCompare(a.name || '')
      }
      return 0
    })

    return result
  }, [projects, activeTypes, searchQuery, sortOrder])

  // Flattened tracks from the filtered projects in current display order
  const displayedDiscographyTracks = useMemo(() => {
    const list = []
    for (const proj of filteredProjects) {
      if (proj.tracks && Array.isArray(proj.tracks)) {
        for (const track of proj.tracks) {
          list.push({
            track,
            project: proj.name,
            projectCover: proj.cover,
            projectArtist: proj.artist,
          })
        }
      }
    }
    return list
  }, [filteredProjects])

  return {
    activeTypes,
    sortOrder,
    searchQuery,
    setSearchQuery,
    setSortOrder,
    handleToggleType,
    handleResetTypes,
    filteredProjects,
    displayedDiscographyTracks,
  }
}
