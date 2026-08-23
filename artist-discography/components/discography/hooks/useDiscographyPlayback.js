'use client'

import { useState, useCallback, useMemo } from 'react'

function shuffleArray(array) {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function sortTracksByDiscographyOrder(tracks, discographyList) {
  return [...tracks].sort((a, b) => {
    const nameA = (a.track?.name || a.name || '').toLowerCase()
    const nameB = (b.track?.name || b.name || '').toLowerCase()
    const indexA = discographyList.findIndex(
      (item) => (item.track?.name || item.name || '').toLowerCase() === nameA,
    )
    const indexB = discographyList.findIndex(
      (item) => (item.track?.name || item.name || '').toLowerCase() === nameB,
    )
    if (indexA === -1) return 1
    if (indexB === -1) return -1
    return indexA - indexB
  })
}

function formatTrackItem(track, parentProj, artistName) {
  if (!track) return null
  const projName =
    typeof parentProj === 'string' ? parentProj : parentProj?.name || track.project || ''
  const projCover =
    track.cover ||
    (typeof parentProj === 'object' ? parentProj?.cover || parentProj?.image : '') ||
    track.projectCover ||
    ''
  const projArtist =
    (typeof parentProj === 'object' ? parentProj?.artist : '') ||
    track.projectArtist ||
    artistName ||
    ''

  return {
    ...track,
    project: projName,
    projectCover: projCover,
    projectArtist: projArtist,
    artist: track.artist || projArtist,
  }
}

/**
 * Custom hook managing the master audio player queue, shuffle, repeat,
 * playback history stack, and track playback transition handlers.
 *
 * @param {Object} params
 * @param {Array} params.projects - Projects array
 * @param {Object} params.artist - Artist metadata
 * @param {Array} params.displayedDiscographyTracks - Ordered list of tracks in current view
 * @param {Object|null} params.selectedProject - Currently active project if in single view
 * @param {Function} [params.showToast] - Toast message callback
 * @returns {{
 *   playingTrack: Object|null,
 *   setPlayingTrack: React.Dispatch<React.SetStateAction<Object|null>>,
 *   isPlaying: boolean,
 *   setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>,
 *   manualQueue: Array<Object>,
 *   autoplayTracks: Array<Object>,
 *   playbackHistory: Array<Object>,
 *   isShuffle: boolean,
 *   repeatMode: 'off'|'all'|'one',
 *   restartCount: number,
 *   handlePlayTrack: (track: Object, proj?: Object, options?: Object) => void,
 *   handleTogglePlayPause: () => void,
 *   handleToggleShuffle: () => void,
 *   handleCycleRepeatMode: () => void,
 *   handleSkipNext: () => void,
 *   handleSkipPrev: () => void,
 *   handleQueueDragDrop: (details: Object) => void,
 *   handleRemoveFromManualQueue: (index: number) => void,
 *   handleRemoveFromAutoplay: (index: number) => void,
 *   handleAddToQueue: (track: Object, project?: Object) => void,
 *   handlePlayQueuedTrack: (item: Object, index: number, isQueueType: boolean) => void,
 *   handleClosePlayer: () => void
 * }}
 */
export function useDiscographyPlayback({
  projects = [],
  artist = {},
  displayedDiscographyTracks = [],
  selectedProject = null,
  showToast,
}) {
  const [playingTrack, setPlayingTrack] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [manualQueue, setManualQueue] = useState([])
  const [autoplayTracks, setAutoplayTracks] = useState([])
  const [playbackHistory, setPlaybackHistory] = useState([])
  const [activeTrackPool, setActiveTrackPool] = useState([])
  const [isShuffle, setIsShuffle] = useState(false)
  const [repeatMode, setRepeatMode] = useState('off') // 'off' | 'all' | 'one'
  const [restartCount, setRestartCount] = useState(0)

  // Current fallback pool
  const currentFallbackPool = useMemo(() => {
    if (activeTrackPool.length > 0) return activeTrackPool
    if (selectedProject?.tracks && Array.isArray(selectedProject.tracks)) {
      return selectedProject.tracks
        .filter((t) => t?.hasAudio && Boolean(t?.audioUrl))
        .map((t) => ({
          track: t,
          project: selectedProject.name,
          projectCover: selectedProject.cover || selectedProject.image || '',
          projectArtist: selectedProject.artist || artist.name || '',
        }))
    }
    return displayedDiscographyTracks
  }, [activeTrackPool, selectedProject, displayedDiscographyTracks, artist.name])

  const handleToggleShuffle = useCallback(() => {
    setIsShuffle((prev) => {
      const nextShuffle = !prev
      if (nextShuffle) {
        setAutoplayTracks((current) => shuffleArray(current))
      } else {
        const pool = currentFallbackPool.length > 0 ? currentFallbackPool : displayedDiscographyTracks
        setAutoplayTracks((current) => sortTracksByDiscographyOrder(current, pool))
      }
      return nextShuffle
    })
  }, [currentFallbackPool, displayedDiscographyTracks])

  const handleCycleRepeatMode = useCallback(() => {
    setRepeatMode((prev) => {
      if (prev === 'off') return 'all'
      if (prev === 'all') return 'one'
      return 'off'
    })
  }, [])

  const handlePlayTrack = useCallback(
    (track, proj, options = {}) => {
      if (!track) return
      if (!track.hasAudio || !track.audioUrl) {
        if (showToast) showToast(`No audio available for "${track.name || 'this track'}"`)
        return
      }
      const parentProj =
        proj ||
        selectedProject ||
        projects.find((p) =>
          (p.tracks || []).some(
            (t) => (t.name || '').toLowerCase() === (track.name || '').toLowerCase(),
          ),
        )
      const projName = parentProj?.name || track.project || ''
      const projCover = track.cover || parentProj?.cover || parentProj?.image || ''

      const isSameTrack =
        (playingTrack?.name || '').toLowerCase() === (track.name || '').toLowerCase()

      if (isSameTrack && isPlaying) {
        if (options?.touchMode || options?.restart || options?.restartIfSame) {
          setRestartCount((c) => c + 1)
        } else {
          setIsPlaying(false)
        }
      } else {
        const trackWithProject = {
          ...track,
          project: projName,
          projectType: parentProj?.type || track.projectType || '',
          projectArtist: parentProj?.artist || artist.name || '',
          projectCover: projCover,
          artist: track.artist || parentProj?.artist || artist.name || '',
        }

        // Determine context pool (single project vs all discography)
        let pool = []
        if (selectedProject?.tracks && Array.isArray(selectedProject.tracks)) {
          pool = selectedProject.tracks
            .filter((t) => t?.hasAudio && Boolean(t?.audioUrl))
            .map((t) => ({
              track: t,
              project: selectedProject.name,
              projectCover: selectedProject.cover || selectedProject.image || '',
              projectArtist: selectedProject.artist || artist.name || '',
            }))
        } else {
          pool = displayedDiscographyTracks
        }

        setActiveTrackPool(pool)
        setPlayingTrack(trackWithProject)
        setIsPlaying(true)
        setManualQueue([])
        setPlaybackHistory([])

        const clickedIndex = pool.findIndex(
          (item) =>
            (item.track?.name || item.name || '').toLowerCase() ===
            (track.name || '').toLowerCase(),
        )

        if (isShuffle) {
          // Shuffle all other playable tracks in the pool
          const otherTracks =
            clickedIndex !== -1
              ? pool.filter((_, idx) => idx !== clickedIndex)
              : pool.filter(
                  (item) =>
                    (item.track?.name || item.name || '').toLowerCase() !==
                    (track.name || '').toLowerCase(),
                )
          setAutoplayTracks(shuffleArray(otherTracks))
        } else {
          // Subsequent tracks in linear order
          const remaining = clickedIndex !== -1 ? pool.slice(clickedIndex + 1) : []
          setAutoplayTracks(remaining)
        }
      }
    },
    [
      playingTrack,
      isPlaying,
      selectedProject,
      projects,
      artist.name,
      displayedDiscographyTracks,
      isShuffle,
      showToast,
    ],
  )

  const handleTogglePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev)
  }, [])

  const handleSkipNext = useCallback(() => {
    // Capture current track into history before navigating forward
    if (playingTrack) {
      setPlaybackHistory((prev) => [...prev, playingTrack])
    }

    // 1. Check manual queue for next playable item
    if (manualQueue.length > 0) {
      const validIndex = manualQueue.findIndex(
        (item) => (item.track || item)?.hasAudio && Boolean((item.track || item)?.audioUrl),
      )
      if (validIndex !== -1) {
        const nextItem = manualQueue[validIndex]
        const updatedQueue = manualQueue.slice(validIndex + 1)
        setManualQueue(updatedQueue)

        const nextTrack = nextItem.track || nextItem
        const parentProj = nextItem.project || selectedProject
        setPlayingTrack(formatTrackItem(nextTrack, parentProj, artist.name))
        setIsPlaying(true)
        return
      }
      setManualQueue([])
    }

    // 2. Check autoplay tracks for next playable item
    if (autoplayTracks.length > 0) {
      const validIndex = autoplayTracks.findIndex(
        (item) => (item.track || item)?.hasAudio && Boolean((item.track || item)?.audioUrl),
      )
      if (validIndex !== -1) {
        const nextItem = autoplayTracks[validIndex]
        const updatedAutoplay = autoplayTracks.slice(validIndex + 1)
        setAutoplayTracks(updatedAutoplay)

        const nextTrack = nextItem.track || nextItem
        const parentProj = nextItem.project || selectedProject
        setPlayingTrack(formatTrackItem(nextTrack, parentProj, artist.name))
        setIsPlaying(true)
        return
      }
      setAutoplayTracks([])
    }

    // 3. Loop if repeat all is active
    if (repeatMode === 'all') {
      const poolToLoop = currentFallbackPool.filter(
        (item) => (item.track || item)?.hasAudio && Boolean((item.track || item)?.audioUrl),
      )
      if (poolToLoop.length > 0) {
        if (isShuffle) {
          const shuffledPool = shuffleArray(poolToLoop)
          const firstItem = shuffledPool[0]
          const firstTrack = firstItem.track || firstItem
          const parentProj = firstItem.project
          setPlayingTrack(formatTrackItem(firstTrack, parentProj, artist.name))
          setIsPlaying(true)
          setAutoplayTracks(shuffledPool.slice(1))
          return
        } else {
          const firstItem = poolToLoop[0]
          const firstTrack = firstItem.track || firstItem
          const parentProj = firstItem.project
          setPlayingTrack(formatTrackItem(firstTrack, parentProj, artist.name))
          setIsPlaying(true)
          setAutoplayTracks(poolToLoop.slice(1))
          return
        }
      }
    }

    setIsPlaying(false)
  }, [
    playingTrack,
    manualQueue,
    autoplayTracks,
    repeatMode,
    currentFallbackPool,
    selectedProject,
    artist.name,
    isShuffle,
  ])

  const handleSkipPrev = useCallback(() => {
    // 1. If we have play history, pop previous track and push current track to upcoming queue
    if (playbackHistory.length > 0) {
      const prevTrack = playbackHistory[playbackHistory.length - 1]
      setPlaybackHistory((prev) => prev.slice(0, -1))
      if (playingTrack) {
        setAutoplayTracks((curr) => [playingTrack, ...curr])
      }
      setPlayingTrack(prevTrack)
      setIsPlaying(true)
      return
    }

    // 2. In shuffle mode with no history, restart the current track
    if (isShuffle) {
      setRestartCount((c) => c + 1)
      return
    }

    // 3. In linear mode with no history: navigate to previous track in active pool
    const pool = currentFallbackPool.length > 0 ? currentFallbackPool : displayedDiscographyTracks
    if (pool.length > 0 && playingTrack) {
      const currentIndex = pool.findIndex(
        (item) =>
          (item.track?.name || item.name || '').toLowerCase() ===
          (playingTrack.name || '').toLowerCase(),
      )
      if (currentIndex > 0) {
        const prevItem = pool[currentIndex - 1]
        const prevTrack = prevItem.track || prevItem
        const parentProj = prevItem.project
        if (playingTrack) {
          setAutoplayTracks((curr) => [playingTrack, ...curr])
        }
        setPlayingTrack(formatTrackItem(prevTrack, parentProj, artist.name))
        setIsPlaying(true)
      } else if (currentIndex === 0 && repeatMode === 'all' && pool.length > 0) {
        // Wrap to the last track in the active pool
        const lastItem = pool[pool.length - 1]
        const lastTrack = lastItem.track || lastItem
        const parentProj = lastItem.project
        if (playingTrack) {
          setAutoplayTracks((curr) => [playingTrack, ...curr])
        }
        setPlayingTrack(formatTrackItem(lastTrack, parentProj, artist.name))
        setIsPlaying(true)
      } else {
        setRestartCount((c) => c + 1)
      }
    } else {
      setRestartCount((c) => c + 1)
    }
  }, [
    playbackHistory,
    playingTrack,
    isShuffle,
    currentFallbackPool,
    displayedDiscographyTracks,
    repeatMode,
    artist.name,
  ])

  const handleQueueDragDrop = useCallback(
    ({ fromList, fromIndex, toList, toIndex }) => {
      let sourceItem = null
      let newManual = [...manualQueue]
      let newAutoplay = [...autoplayTracks]

      if (fromList === 'queue') {
        if (fromIndex >= 0 && fromIndex < newManual.length) {
          sourceItem = newManual.splice(fromIndex, 1)[0]
        }
      } else {
        if (fromIndex >= 0 && fromIndex < newAutoplay.length) {
          sourceItem = newAutoplay.splice(fromIndex, 1)[0]
        }
      }

      if (!sourceItem) return

      if (toList === 'queue') {
        let insertIndex = toIndex
        if (fromList === 'queue' && fromIndex < toIndex) {
          insertIndex = Math.max(0, toIndex - 1)
        }
        insertIndex = Math.max(0, Math.min(newManual.length, insertIndex))
        newManual.splice(insertIndex, 0, sourceItem)
      } else {
        let insertIndex = toIndex
        if (fromList === 'autoplay' && fromIndex < toIndex) {
          insertIndex = Math.max(0, toIndex - 1)
        }
        insertIndex = Math.max(0, Math.min(newAutoplay.length, insertIndex))
        newAutoplay.splice(insertIndex, 0, sourceItem)
      }

      setManualQueue(newManual)
      setAutoplayTracks(newAutoplay)
    },
    [manualQueue, autoplayTracks],
  )

  const handleRemoveFromManualQueue = useCallback((index) => {
    setManualQueue((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleRemoveFromAutoplay = useCallback((index) => {
    setAutoplayTracks((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleAddToQueue = useCallback(
    (track, project) => {
      if (!track) return
      if (!track.hasAudio || !track.audioUrl) {
        if (showToast) showToast(`No audio stream available for "${track.name || 'this track'}"`)
        return
      }
      const parentProj =
        project ||
        selectedProject ||
        projects.find((p) =>
          (p.tracks || []).some(
            (t) => (t.name || '').toLowerCase() === (track.name || '').toLowerCase(),
          ),
        )
      const queueItem = {
        track: {
          ...track,
          project: parentProj?.name || track.project || '',
          projectCover: track.cover || parentProj?.cover || parentProj?.image || '',
          projectArtist: parentProj?.artist || artist.name || '',
          artist: track.artist || parentProj?.artist || artist.name || '',
        },
        project: parentProj,
      }
      setManualQueue((prev) => [...prev, queueItem])
      if (showToast) showToast(`Added "${track.name || 'track'}" to Queue`)
    },
    [selectedProject, projects, artist.name, showToast],
  )

  const handlePlayQueuedTrack = useCallback(
    (item, index, isQueueType) => {
      if (!item) return
      const track = item.track || item
      if (!track?.hasAudio || !track?.audioUrl) {
        if (showToast) showToast(`No audio available for "${track?.name || 'this track'}"`)
        if (isQueueType) {
          setManualQueue((prev) => prev.filter((_, i) => i !== index))
        } else {
          setAutoplayTracks((prev) => prev.filter((_, i) => i !== index))
        }
        return
      }
      const parentProj = item.project || selectedProject

      if (playingTrack) {
        setPlaybackHistory((prev) => [...prev, playingTrack])
      }

      setPlayingTrack(formatTrackItem(track, parentProj, artist.name))
      setIsPlaying(true)

      if (isQueueType) {
        setManualQueue((prev) => prev.filter((_, i) => i !== index))
      } else {
        setAutoplayTracks((prev) => prev.slice(index + 1))
      }
    },
    [playingTrack, selectedProject, artist.name, showToast],
  )

  const handleClosePlayer = useCallback(() => {
    setIsPlaying(false)
    setPlayingTrack(null)
    setManualQueue([])
    setAutoplayTracks([])
    setPlaybackHistory([])
    setActiveTrackPool([])
  }, [])

  return {
    playingTrack,
    setPlayingTrack,
    isPlaying,
    setIsPlaying,
    manualQueue,
    autoplayTracks,
    playbackHistory,
    isShuffle,
    repeatMode,
    restartCount,
    handlePlayTrack,
    handleTogglePlayPause,
    handleToggleShuffle,
    handleCycleRepeatMode,
    handleSkipNext,
    handleSkipPrev,
    handleQueueDragDrop,
    handleRemoveFromManualQueue,
    handleRemoveFromAutoplay,
    handleAddToQueue,
    handlePlayQueuedTrack,
    handleClosePlayer,
  }
}
