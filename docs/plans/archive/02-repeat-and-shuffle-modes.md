# Plan 02: Repeat & Shuffle Modes ✅ (COMPLETED)

## Status: ✅ **COMPLETED & VERIFIED**

---

## 1. Verification Checklist & Status Log

- [x] ✅ Set volume slider to 40%, refresh page, and play a track. Confirm actual audio volume level matches 40% immediately.
- [x] ✅ Click Mute icon (volume becomes 0, icon changes to muted). Click Mute icon again; confirm volume restores to 40% (or enforces `MIN_LISTENABLE_VOLUME = 10%` floor).
- [x] ✅ Refresh page while muted. Click Mute icon; confirm volume restores to the pre-muted saved level.
- [x] ✅ Mute icon button is z-index elevated (`zIndex: 2`) above the volume slider thumb (`zIndex: 1`), preventing click obstruction.
- [x] ✅ Expanded `MuiIconButton` hit target areas (`theme.js`) and button paddings allow effortless clicking app-wide.
- [x] ✅ Press Spacebar while focus is on a button or slider in the UI; verify audio toggles play/pause reliably without triggering unintended button clicks or page scrolls.
- [x] ✅ Press Spacebar while typing in a text field or search input; verify space character is inserted normally without pausing playback.
- [x] ✅ Enable **Repeat ONCE**: Verify track restarts when finishing. Click Next / Prev and verify track restarts without popping items from queue or autoplay.
- [x] ✅ Enable **Repeat ALL**: Play through to end of project/discography. Verify autoplay queue auto-replenishes without creating infinite arrays.
- [x] ✅ Disable Repeat (set to **OFF**): Verify playback stops at the end of the current displayed tracks.
- [x] ✅ Toggle **Shuffle ON**: Open Queue Dialog and verify autoplay tracks list visually rearranges.
- [x] ✅ Toggle **Shuffle OFF**: Open Queue Dialog and verify autoplay tracks list restores to discography order.

---

## 2. Executive Summary & Behavioral Matrix

This plan outlines the architecture for managing audio playback loop modes (`off`, `one`, `all`) and shuffle state in [`MainDiscographyApp.js`](file:///c:/Users/Dan/App%20Dev/artist-discography/artist-discography/components/discography/MainDiscographyApp.js) and [`AudioPlayerBar.js`](file:///c:/Users/Dan/App%20Dev/artist-discography/artist-discography/components/player/AudioPlayerBar.js).

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

### A. [`MainDiscographyApp.js`](file:///Users/danvanbueren/App%20Dev/artist-discography/artist-discography/components/discography/MainDiscographyApp.js)

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

### B. [`AudioPlayerBar.js`](file:///Users/danvanbueren/App%20Dev/artist-discography/artist-discography/components/player/AudioPlayerBar.js)

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

## 4. Volume Bar & Mute State Persistence Architecture

### Target File: [`AudioPlayerBar.js`](file:///Users/danvanbueren/App%20Dev/artist-discography/artist-discography/components/player/AudioPlayerBar.js)

#### A. Persistence & Initial Audio Element Sync
- **Problem**: Volume slider visually loads saved state from storage on refresh, but is not applied to the actual `<audio>` element playback volume when playback begins.
- **Solution**:
  - Save three distinct storage keys: `audio_playback_volume` (chosen level 0-100), `audio_playback_muted` (boolean string `'true'`/`'false'`), and `audio_playback_prev_volume` (last non-zero level).
  - Explicitly sync `<audio>` element's `volume` and `muted` properties in:
    1. The initial mount `useEffect` after reading saved values from storage.
    2. An `onLoadedMetadata` / `onPlay` / `onCanPlay` handler on the `<audio>` element so every newly loaded track applies the saved volume immediately.
    3. The state sync `useEffect` whenever `volume` or `isMuted` changes.

#### B. Mute & Unmute State Restoration
- **Problem**: Clicking the muted icon fails to toggle back to the visually loaded pre-muted volume state; it remains muted or stuck at 0.
- **Solution**:
  - When clicking mute (`handleToggleMute`):
    - If `isMuted` is `true` or `volume === 0`: Restore `volume` to `prevVolume > 0 ? prevVolume : 100` and set `isMuted(false)`. Update storage with the restored volume and set `audio_playback_muted` to `'false'`.
    - If unmuted: Save current `volume` to `prevVolume`, set `volume = 0` and `isMuted = true`. Update storage with `audio_playback_muted` = `'true'` and preserve `audio_playback_prev_volume`.

---

## 5. Spacebar Shortcut Reliability & Focus Handling

### Target File: [`AudioPlayerBar.js`](file:///c:/Users/Dan/App%20Dev/artist-discography/artist-discography/components/player/AudioPlayerBar.js)

- **Problem**: Spacebar shortcut for Play/Pause is occasionally ignored or triggers default element behaviors when interactive UI elements have browser focus.
- **Solution**:
  - Register global capture-phase `keydown` event listener (`window.addEventListener('keydown', handleKeyDown, true)`).
  - Inspect `document.activeElement` and `event.target`:
    - Exempt inputs where typing space is required: `textarea`, editable text `input` (`text`, `search`, `password`, `url`, `email`, `number`), and elements with `isContentEditable === true`.
    - Allow spacebar play/pause even when non-editable elements (such as buttons, sliders, links, or modal wrappers) hold focus by invoking `e.preventDefault()` and `e.stopPropagation()`.
  - Check both `e.code === 'Space'` and fallback keys (`e.key === ' '`, `e.key === 'Spacebar'`, `e.keyCode === 32`).
  - Guarantee `handleDirectTogglePlay()` executes synchronously to control the `<audio>` element immediately.

