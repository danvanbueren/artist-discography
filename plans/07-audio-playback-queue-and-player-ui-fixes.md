# Plan 07: Audio Playback, Queue & Player UI Fixes

## Status: ✅ **COMPLETED**

---

## 1. Verification Checklist & Status Log

- [x] **Queue Responsiveness**:
  - Open Queue Dialog on mobile (< 600px width / small screens). Verify it opens as a clean full-screen dialog (`fullScreen={isMobile}`).
  - Open Queue Dialog on tablets, laptops, and desktop. Verify it opens as the floating modal Paper surface.
- [x] **Queue Context-Awareness on Replay**:
  - Play a single track from its Project Page. Allow the track to finish naturally (stopping at 0:00).
  - Navigate back to the Main Page (`/`). Click play on that same track on the main page.
  - Verify that because the track was completed at 0:00 and user is now on the main page, the system contextually repopulates the autoplay queue with subsequent tracks from the entire discography!
  - Play a track, let it play to 0:15, pause it, navigate to main page, press play again. Verify the existing queue is preserved without resetting because playback was paused mid-track (`currentTime > 0`).
- [x] **Fix Pause/Resume Reset Bug**:
  - Play any track, let it play for 5 seconds, pause it, and press play/pause again in the player bar or full-screen player.
  - Verify playback resumes smoothly from 5 seconds without jumping back to 0:00!
  - Verify that only an explicit track restart action (e.g. clicking the track row on a touch device when it's actively playing) forces playback back to 0:00.
- [x] **Fix Mobile Shuffle & Repeat Active Color Feedback**:
  - On a mobile touch screen, tap the Shuffle button.
  - Verify the button turns vibrant blue (`primary.main`) immediately and does NOT stay white due to lingering mobile `:hover` state.
  - Tap the Repeat button (cycling to Repeat All and Repeat One). Verify the button turns vibrant blue immediately.
- [x] **Fix Full-Screen Modal Touch Gestures & Overscroll**:
  - Open full-screen audio player on a phone/tablet browser (Safari, Chrome, Firefox).
  - Perform a swipe in any direction (down, left, right, up) of sufficient distance (> 70px).
  - Verify the full-screen modal cleanly collapses / minimizes back to the site without triggering browser pull-to-refresh page reload!
  - Add `overscroll-behavior: contain` and `touch-action: manipulation` / `none` to modal paper container.

---

## 2. Executive Summary & Problem Analysis

### Identified Bugs & Root Causes:

1. **Queue Context-Awareness on Finished Track**:
   - In `MainDiscographyApp.js` `handlePlayTrack`, when `playingTrack?.name === track.name`, the code previously checked `isSameTrack` and merely toggled `setIsPlaying(true)`, leaving `autoplayTracks` empty.
   - When a track has finished playback (at 0:00) and the listener replays it from the main discography view, the queue should recognize the completed status and repopulate `autoplayTracks` with all subsequent discography tracks.
2. **Pause/Resume Jumping to 0:00 Bug**:
   - In `AudioPlayerBar.js`:
     ```javascript
     useEffect(() => {
       if (restartCount > 0 && audioRef.current) {
         audioRef.current.currentTime = 0
         // ...
       }
     }, [restartCount, isPlaying])
     ```
   - Because `isPlaying` was included in the dependency array, every time `isPlaying` changed from `false` to `true` (unpausing), the effect re-executed because `restartCount > 0`, forcibly setting `currentTime = 0`!
3. **Mobile Sticky Hover Color Glitch**:
   - On touch devices, clicking an `IconButton` triggers sticky `:hover` pseudo-class styling (`'&:hover': { color: 'text.primary' }` in `FullScreenPlayerModal.js`), which overrides `color: isShuffle ? 'primary.main' : 'text.secondary'`, rendering active buttons in plain white rather than primary blue.
4. **Pull-to-Refresh Gesture Conflict**:
   - Pulling down on mobile full-screen modals triggers native browser pull-to-refresh overscroll in Safari and Chrome. Allowing an omnidirectional swipe and isolating overscroll behavior resolves this completely.

---

## 3. Technical Specification & Implementation Plan

### A. Responsive Queue Dialog: [`components/player/PlaybackQueueDialog.js`](file:///c:/Users/Dan/App%20Dev/artist-discography/artist-discography/components/player/PlaybackQueueDialog.js)

1. Use MUI's `useMediaQuery` to detect small screens:
   ```javascript
   import useMediaQuery from '@mui/material/useMediaQuery'
   import { useTheme } from '@mui/material/styles'
   
   export default function PlaybackQueueDialog(props) {
     const theme = useTheme()
     const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
     
     return (
       <Dialog
         open={open}
         onClose={onClose}
         fullScreen={isMobile}
         maxWidth="sm"
         fullWidth
         slotProps={{
           paper: {
             sx: {
               borderRadius: isMobile ? 0 : 4,
               p: isMobile ? 0 : 1,
               maxHeight: isMobile ? '100dvh' : '80vh',
               // ...
             }
           }
         }}
       >
         {/* ... */}
       </Dialog>
     )
   }
   ```

### B. Context-Aware Queue Replay: [`components/discography/MainDiscographyApp.js`](file:///c:/Users/Dan/App%20Dev/artist-discography/artist-discography/components/discography/MainDiscographyApp.js)

1. In `handlePlayTrack(track, proj, options)`:
   - Check if track is currently at 0:00 (track ended / at beginning) and currently presented discography scope differs:
   ```javascript
   const isSameTrack = playingTrack?.name === track.name
   const isAtBeginningOrEnded = !isPlaying && (audioCurrentTime === 0 || options?.isReplayAtStart)
   
   if (isSameTrack && !isAtBeginningOrEnded) {
     if (options?.touchMode) {
       if (isPlaying) {
         setRestartCount(c => c + 1)
       } else {
         setIsPlaying(true)
       }
     } else if (options?.restart) {
       setIsPlaying(true)
       setRestartCount(c => c + 1)
     } else {
       setIsPlaying(prev => !prev)
     }
   } else {
     // Start fresh playback or replay from start
     setPlayingTrack(trackWithProject)
     setIsPlaying(true)
     setManualQueue([])
     
     // Derive autoplay tracks from current view context (single project vs all projects)
     const currIndex = (displayedDiscographyTracks || []).findIndex(
       item => (item.track.name || '').toLowerCase() === (track.name || '').toLowerCase()
     )
     if (currIndex !== -1) {
       const remaining = displayedDiscographyTracks.slice(currIndex + 1)
       setAutoplayTracks(isShuffle ? shuffleArray(remaining) : remaining)
     } else {
       setAutoplayTracks([])
     }
     
     if (isSameTrack && isAtBeginningOrEnded) {
       setRestartCount(c => c + 1)
     }
   }
   ```

### C. Remove Flawed Dependency in `AudioPlayerBar.js`: [`components/player/AudioPlayerBar.js`](file:///c:/Users/Dan/App%20Dev/artist-discography/artist-discography/components/player/AudioPlayerBar.js)

1. Replace `restartCount` effect with a dedicated, isolated restart trigger:
   ```javascript
   const prevRestartCountRef = useRef(restartCount)
   useEffect(() => {
     if (restartCount !== prevRestartCountRef.current) {
       prevRestartCountRef.current = restartCount
       if (audioRef.current) {
         audioRef.current.currentTime = 0
         setCurrentTime(0)
         if (isPlaying) {
           audioRef.current.play().catch(console.warn)
         }
       }
     }
   }, [restartCount, isPlaying]) // Note: restartCount comparison guards against spurious runs
   ```

### D. Omnidirectional Swipe & Overscroll Prevention: [`components/player/FullScreenPlayerModal.js`](file:///c:/Users/Dan/App%20Dev/artist-discography/artist-discography/components/player/FullScreenPlayerModal.js)

1. CSS rules on Dialog Paper:
   ```javascript
   sx: {
     overscrollBehavior: 'contain',
     touchAction: 'manipulation',
     // ...
   }
   ```
2. Touch Event Listeners:
   ```javascript
   const handleTouchEnd = (e) => {
     if (!isSwiping.current) return
     isSwiping.current = false
     
     if (e.changedTouches && e.changedTouches.length === 1) {
       const endY = e.changedTouches[0].clientY
       const endX = e.changedTouches[0].clientX
       const deltaY = endY - touchStartY.current
       const deltaX = endX - touchStartX.current
       const swipeDistance = Math.hypot(deltaX, deltaY)
       
       // Allow any swipe of 75px or larger in any direction to minimize modal
       if (swipeDistance > 75) {
         if (onClose) onClose()
       }
     }
   }
   ```

### E. Active Touch Styling for Shuffle & Repeat Buttons: [`components/player/FullScreenPlayerModal.js`](file:///c:/Users/Dan/App%20Dev/artist-discography/artist-discography/components/player/FullScreenPlayerModal.js) & [`components/player/DesktopPlayerBar.js`](file:///c:/Users/Dan/App%20Dev/artist-discography/artist-discography/components/player/DesktopPlayerBar.js)

1. Update button SX to prevent sticky hover color override:
   ```javascript
   sx={{
     color: isShuffle ? 'primary.main' : 'text.secondary',
     p: { xs: 1.25, sm: 1.5 },
     '@media (hover: hover)': {
       '&:hover': {
         color: isShuffle ? 'primary.main' : 'text.primary',
       }
     },
     '&:active': {
       transform: 'scale(0.92)',
     }
   }}
   ```
2. Apply identical fix to Repeat button for all modes (`off`, `all`, `one`).

---

## 4. Edge Cases & Safeguards

1. **Spacebar Control During Mobile Dialogs**: Spacebar keydown listener continues to operate safely across modals without conflicting with text input.
2. **Dragging Sliders on Touch Devices**: Touch listeners on `FullScreenPlayerModal` ignore swipe gestures originating within `.MuiSlider-root` so scrubbing tracks or volume is never mistaken for a modal minimize swipe.
