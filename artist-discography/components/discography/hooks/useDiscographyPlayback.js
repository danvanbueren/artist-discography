'use client'

import { useState, useCallback } from 'react'

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
      (item) => (item.track.name || '').toLowerCase() === nameA,
    )
    const indexB = discographyList.findIndex(
      (item) => (item.track.name || '').toLowerCase() === nameB,
    )
    if (indexA === -1) return 1
    if (indexB === -1) return -1
    return indexA - indexB
  })
}

/**
 * Custom hook managing the master audio player queue, shuffle, repeat,
 * and track playback transition handlers.
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
  const [isShuffle, setIsShuffle] = useState(false)
  const [repeatMode, setRepeatMode] = useState('off') // 'off' | 'all' | 'one'
  const [restartCount, setRestartCount] = useState(0)

  const handleToggleShuffle = useCallback(() => {
    setIsShuffle((prev) => {
      const nextShuffle = !prev
      if (nextShuffle) {
        setAutoplayTracks((current) => shuffleArray(current))
      } else {
        setAutoplayTracks((current) =>
          sortTracksByDiscographyOrder(current, displayedDiscographyTracks),
        )
      }
      return nextShuffle
    })
  }, [displayedDiscographyTracks])

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
        setPlayingTrack(trackWithProject)
        setIsPlaying(true)
        setManualQueue([])

        // Populate autoplay queue with subsequent tracks
        const clickedIndex = displayedDiscographyTracks.findIndex(
          (item) => (item.track.name || '').toLowerCase() === (track.name || '').toLowerCase(),
        )

        let remaining = []
        if (clickedIndex !== -1) {
          remaining = displayedDiscographyTracks.slice(clickedIndex + 1)
        }

        if (isShuffle) {
          setAutoplayTracks(shuffleArray(remaining))
        } else {
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
    if (manualQueue.length > 0) {
      const nextItem = manualQueue[0]
      const updatedQueue = manualQueue.slice(1)
      setManualQueue(updatedQueue)

      const nextTrack = nextItem.track || nextItem
      const parentProj = nextItem.project || selectedProject
      const projName =
        typeof parentProj === 'string' ? parentProj : parentProj?.name || nextTrack.project || ''
      const projCover =
        nextTrack.cover ||
        (typeof parentProj === 'object' ? parentProj?.cover || parentProj?.image : '') ||
        nextTrack.projectCover ||
        ''

      setPlayingTrack({
        ...nextTrack,
        project: projName,
        projectCover: projCover,
        artist:
          nextTrack.artist ||
          (typeof parentProj === 'object' ? parentProj?.artist : '') ||
          artist.name ||
          '',
      })
      setIsPlaying(true)
    } else if (autoplayTracks.length > 0) {
      const nextItem = autoplayTracks[0]
      const updatedAutoplay = autoplayTracks.slice(1)
      setAutoplayTracks(updatedAutoplay)

      const nextTrack = nextItem.track || nextItem
      const parentProj = nextItem.project || selectedProject
      const projName =
        typeof parentProj === 'string' ? parentProj : parentProj?.name || nextTrack.project || ''
      const projCover =
        nextTrack.cover ||
        (typeof parentProj === 'object' ? parentProj?.cover || parentProj?.image : '') ||
        nextTrack.projectCover ||
        ''

      setPlayingTrack({
        ...nextTrack,
        project: projName,
        projectCover: projCover,
        artist:
          nextTrack.artist ||
          (typeof parentProj === 'object' ? parentProj?.artist : '') ||
          artist.name ||
          '',
      })
      setIsPlaying(true)
    } else if (repeatMode === 'all') {
      if (displayedDiscographyTracks.length > 0) {
        const firstItem = displayedDiscographyTracks[0]
        const firstTrack = firstItem.track
        const parentProj = firstItem.project
        setPlayingTrack({
          ...firstTrack,
          project: parentProj?.name || firstTrack.project || '',
          projectCover: firstTrack.cover || parentProj?.cover || parentProj?.image || '',
          artist: firstTrack.artist || parentProj?.artist || artist.name || '',
        })
        setIsPlaying(true)
        setAutoplayTracks(displayedDiscographyTracks.slice(1))
      }
    } else {
      setIsPlaying(false)
    }
  }, [
    manualQueue,
    autoplayTracks,
    repeatMode,
    selectedProject,
    artist.name,
    displayedDiscographyTracks,
  ])

  const handleSkipPrev = useCallback(() => {
    if (displayedDiscographyTracks.length > 0 && playingTrack) {
      const currentIndex = displayedDiscographyTracks.findIndex(
        (item) => (item.track.name || '').toLowerCase() === (playingTrack.name || '').toLowerCase(),
      )
      if (currentIndex > 0) {
        const prevItem = displayedDiscographyTracks[currentIndex - 1]
        const prevTrack = prevItem.track
        const parentProj = prevItem.project
        setPlayingTrack({
          ...prevTrack,
          project: parentProj?.name || prevTrack.project || '',
          projectCover: prevTrack.cover || parentProj?.cover || parentProj?.image || '',
          artist: prevTrack.artist || parentProj?.artist || artist.name || '',
        })
        setIsPlaying(true)
        const subsequent = displayedDiscographyTracks.slice(currentIndex)
        setAutoplayTracks(isShuffle ? shuffleArray(subsequent) : subsequent)
      } else {
        setRestartCount((c) => c + 1)
      }
    } else {
      setRestartCount((c) => c + 1)
    }
  }, [displayedDiscographyTracks, playingTrack, artist.name, isShuffle])

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
      const parentProj = item.project || selectedProject
      const projName =
        typeof parentProj === 'string' ? parentProj : parentProj?.name || track.project || ''
      const projCover =
        track.cover ||
        (typeof parentProj === 'object' ? parentProj?.cover || parentProj?.image : '') ||
        track.projectCover ||
        ''

      setPlayingTrack({
        ...track,
        project: projName,
        projectCover: projCover,
        artist:
          track.artist ||
          (typeof parentProj === 'object' ? parentProj?.artist : '') ||
          artist.name ||
          '',
      })
      setIsPlaying(true)

      if (isQueueType) {
        setManualQueue((prev) => prev.filter((_, i) => i !== index))
      } else {
        setAutoplayTracks((prev) => prev.slice(index + 1))
      }
    },
    [selectedProject, artist.name],
  )

  const handleClosePlayer = useCallback(() => {
    setIsPlaying(false)
    setPlayingTrack(null)
    setManualQueue([])
    setAutoplayTracks([])
  }, [])

  return {
    playingTrack,
    setPlayingTrack,
    isPlaying,
    setIsPlaying,
    manualQueue,
    autoplayTracks,
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
