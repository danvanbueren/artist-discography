# Plan 02: Repeat & Shuffle Modes

## 1. Executive Summary & Behavioral Matrix

This plan outlines the architecture for managing audio playback loop modes (`off`, `one`, `all`) and shuffle state in `MainDiscographyApp.js` and `AudioPlayerBar.js`.

### Behavioral Matrix

| Mode / Control | On Track End (`onEnded`) | On Skip Next Button | On Skip Prev Button | Queue / Autoplay Impact |
| :--- | :--- | :--- | :--- | :--- |
| **Repeat OFF** | Plays next track in `manualQueue` or `autoplayTracks`. Stops when empty. | Plays next track in `manualQueue` or `autoplayTracks`. | Plays previous track in `displayedDiscographyTracks` (or restarts if `currentTime > 3s`). | `manualQueue` and `autoplayTracks` are consumed normally. |
| **Repeat ONCE (`one`)** | Restarts current track (`currentTime = 0`). | Restarts current track (`currentTime = 0`). | Restarts current track (`currentTime = 0`). | `manualQueue` and `autoplayTracks` remain untouched. |
| **Repeat ALL (`all`)** | Plays next track. When `autoplayTracks` empties, refills `autoplayTracks` from `displayedDiscographyTracks`. | Plays next track. Refills `autoplayTracks` if empty. | Plays previous track in `displayedDiscographyTracks`. | Memory-safe single pass in array; auto-replenished on exhaustion. |
| **Shuffle ON** | Plays next track in visually shuffled `autoplayTracks`. | Plays next track in visually shuffled `autoplayTracks`. | Plays previous track. | `autoplayTracks` array is shuffled in state and rendered shuffled in UI. |
| **Shuffle OFF** | Plays next track in sorted `autoplayTracks`. | Plays next track in sorted `autoplayTracks`. | Plays previous track. | `autoplayTracks` is restored to natural discography sort order in state and UI. |

---

## 2. State Lifting & Architecture

Currently, `repeatMode` is stored locally inside `AudioPlayerBar.js`, which prevents `MainDiscographyApp` handlers (`handleSkipNext`, `handleSkipPrev`) from knowing the active repeat mode.

### Refactoring Strategy:
1. **Lift `repeatMode` State**: Move `const [repeatMode, setRepeatMode] = useState('off')` to `MainDiscographyApp.js` and pass `repeatMode` and `onSetRepeatMode` / `onCycleRepeatMode` as props to `AudioPlayerBar.js`.
2. **Unified Control Handlers**:
   - `handleSkipNext`:
     - If `repeatMode === 'one'`: Reset `currentTime = 0` on current track. Do not mutate queues.
     - Else: Consume top track from `manualQueue` or `autoplayTracks`. If `autoplayTracks` is empty and `repeatMode === 'all'`, rebuild `autoplayTracks` from `displayedDiscographyTracks`.
   - `handleSkipPrev`:
     - If `repeatMode === 'one'`: Reset `currentTime = 0` on current track. Do not mutate queues.
     - Else if `currentTime > 3s`: Reset `currentTime = 0`.
     - Else: Play previous track in `displayedDiscographyTracks`.
3. **Visual & Audio Shuffle Sync**:
   - `handleToggleShuffle` in `MainDiscographyApp.js` updates `isShuffle` state AND updates `autoplayTracks`:
     - `nextShuffle === true`  -> `setAutoplayTracks(prev => shuffleArray(prev))`
     - `nextShuffle === false` -> `setAutoplayTracks(prev => sortTracksByDiscographyOrder(prev, displayedDiscographyTracks))`
   - Because `autoplayTracks` is passed directly to `PlaybackQueueDialog`, the UI list instantly updates to reflect the visual and audio playback order.

---

## 3. Proposed Code Modifications

### A. [`MainDiscographyApp.js`](file:///c:/Users/Dan/App%20Dev/artist-discography/artist-discography/components/MainDiscographyApp.js)

Add `repeatMode` state and update skip handlers:

```javascript
const [repeatMode, setRepeatMode] = useState('off') // 'off' | 'all' | 'one'

const handleCycleRepeatMode = useCallback(() => {
  setRepeatMode(prev => {
    if (prev === 'off') {
      showToast('Repeat ALL')
      return 'all'
    }
    if (prev === 'all') {
      showToast('Repeat ONE')
      return 'one'
    }
    showToast('Repeat OFF')
    return 'off'
  })
}, [showToast])

const handleSkipNext = useCallback(() => {
  if (repeatMode === 'one' && playingTrack) {
    // Restart current track without altering queue
    return 'RESTART_CURRENT'
  }

  if (manualQueue.length > 0) {
    const [nextItem, ...restQueue] = manualQueue
    setManualQueue(restQueue)
    setPlayingTrack(nextItem.track)
    setIsPlaying(true)
    return
  }

  if (autoplayTracks.length > 0) {
    const [nextItem, ...restAutoplay] = autoplayTracks
    setAutoplayTracks(restAutoplay)
    setPlayingTrack(nextItem.track)
    setIsPlaying(true)
  } else if (repeatMode === 'all' && displayedDiscographyTracks.length > 0) {
    // Replenish autoplay queue for continuous looping
    const freshTracks = isShuffle ? shuffleArray(displayedDiscographyTracks) : [...displayedDiscographyTracks]
    const [firstItem, ...rest] = freshTracks
    setAutoplayTracks(rest)
    setPlayingTrack(firstItem.track)
    setIsPlaying(true)
  } else {
    setIsPlaying(false)
  }
}, [repeatMode, playingTrack, manualQueue, autoplayTracks, repeatMode, displayedDiscographyTracks, isShuffle])
```

### B. [`AudioPlayerBar.js`](file:///c:/Users/Dan/App%20Dev/artist-discography/artist-discography/components/AudioPlayerBar.js)

Update `<audio>` `onEnded` and button click handlers to delegate to lifted props:

```javascript
onEnded={() => {
  if (repeatMode === 'one') {
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play()
    }
  } else {
    const res = onSkipNext()
    if (res === 'RESTART_CURRENT' && audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play()
    }
  }
}}
```

---

## 4. Verification Checklist

- [ ] Enable **Repeat ONCE**: Verify track restarts when finishing. Click Next / Prev and verify track restarts without popping items from queue or autoplay.
- [ ] Enable **Repeat ALL**: Play through to end of project/discography. Verify autoplay queue auto-replenishes without creating infinite arrays.
- [ ] Disable Repeat (set to **OFF**): Verify playback stops at the end of the current displayed tracks.
- [ ] Toggle **Shuffle ON**: Open Queue Dialog and verify autoplay tracks list visually rearranges.
- [ ] Toggle **Shuffle OFF**: Open Queue Dialog and verify autoplay tracks list restores to discography order.
