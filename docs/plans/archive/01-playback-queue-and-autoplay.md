# Plan 01: Playback Queue & Autoplay Engine ✅ (COMPLETED)

## Status: ✅ **COMPLETED & VERIFIED**

---

## 1. Verification Checklist & Status Log

- [x] ✅ Click play on track 2 of a 5-track project. Verify manual queue is `[]` and autoplay has tracks 3, 4, 5.
- [x] ✅ Add 2 tracks to manual queue, then click play on another track. Verify manual queue clears instantly.
- [x] ✅ Drag a track in the Queue Dialog into the padding space between two tracks. Verify the insertion line highlights and dropping moves the track to that exact position.
- [x] ✅ Click on a queue item row or cover art in the Queue Dialog; verify audio does NOT start playing.
- [x] ✅ Click the dedicated Play button on a queued track; verify playback starts immediately for that track.
- [x] ✅ Verify that single project view limits autoplay strictly to that project's tracks.
- [x] ✅ Verify that main discography view autoplays across projects according to active sort settings.
- [x] ✅ Verify that skipping backwards restores the previously playing song and remaining tracklist into the autoplay queue.

---

## 2. Executive Summary & Overview

This plan details the restructuring of track playback initialization, manual queue management, and autoplay list derivation in [`MainDiscographyApp.js`](file:///c:/Users/Dan/App%20Dev/artist-discography/artist-discography/components/discography/MainDiscographyApp.js) and [`AudioPlayerBar.js`](file:///c:/Users/Dan/App%20Dev/artist-discography/artist-discography/components/player/AudioPlayerBar.js).

When a user initiates playback by clicking "Play" on any track:
1. The **manual immediate queue** is immediately cleared (`setManualQueue([])`).
2. The **autoplay queue** is populated with all subsequent tracks in the currently displayed view context, following the exact active sort/filter settings.
3. Audio playback begins immediately for the selected track.

---

## 2. Current Architecture & Limitations

In the current implementation:
- `handlePlayTrack` in `MainDiscographyApp.js` slices `displayedDiscographyTracks` to build `autoplayTracks`.
- However, `manualQueue` is **not cleared** when clicking play on a track, causing items manually added previously to unexpectedly play before autoplay tracks.
- Furthermore, `displayedDiscographyTracks` relies on `filteredProjects`, which correctly handles single project view vs. main discography, but needs explicit validation when filters or search queries change while a track is playing.

---

## 3. Technical Specification

### A. State Management & Lifecycle

```
[User Clicks Play on Track X]
           │
           ├──> Set active track: setPlayingTrack(trackWithProject)
           ├──> Clear manual queue: setManualQueue([])
           ├──> Determine Scope & Order:
           │      - Single Project View -> filter to selectedProject.tracks
           │      - Main Discography -> use displayedDiscographyTracks (respects activeTypes, searchQuery, sortOrder)
           ├──> Extract tracks following Track X -> remaining = tracks.slice(trackXIndex + 1)
           └──> Apply Shuffle check:
                  - If isShuffle == true  -> setAutoplayTracks(shuffleArray(remaining))
                  - If isShuffle == false -> setAutoplayTracks(remaining)
```

### B. View Scope Rules

| View Mode | Scope of Autoplay | Non-Playable Tracks |
| :--- | :--- | :--- |
| **Main Discography (`ALL_PROJECTS`)** | All tracks across `filteredProjects` in the active sort order (e.g. newest first). | Automatically skipped (`hasAudio === false` or missing `audioUrl`). |
| **Single Project Page (`SINGLE_PROJECT`)** | Only tracks belonging to `selectedProject` in project tracklist order. | Automatically skipped (`hasAudio === false` or missing `audioUrl`). |

---

## 4. Proposed Code Changes

### Target File: [`MainDiscographyApp.js`](file:///Users/danvanbueren/App%20Dev/artist-discography/artist-discography/components/discography/MainDiscographyApp.js)

Update `handlePlayTrack`:

```javascript
const handlePlayTrack = useCallback((track, proj) => {
  if (!track) return
  if (!track.hasAudio || !track.audioUrl) {
    showToast(`No audio available for "${track.name || 'this track'}"`)
    return
  }

  const parentProj = proj || selectedProject || projects.find(p => (p.tracks || []).some(t => (t.name || '').toLowerCase() === (track.name || '').toLowerCase()))
  const projName = parentProj?.name || track.project || ''
  const projCover = track.cover || parentProj?.cover || parentProj?.image || ''

  if (playingTrack?.name === track.name && isPlaying) {
    setIsPlaying(false)
  } else if (playingTrack?.name === track.name && !isPlaying) {
    setIsPlaying(true)
  } else {
    const trackWithProject = {
      ...track,
      project: projName,
      projectCover: projCover,
      artist: track.artist || parentProj?.artist || artist.name,
    }
    
    // 1. Set current playing track
    setPlayingTrack(trackWithProject)
    setIsPlaying(true)

    // 2. Clear manual queue immediately on direct track play
    setManualQueue([])

    // 3. Populate autoplay tracks matching current view context & sort
    const currIndex = (displayedDiscographyTracks || []).findIndex(
      item => (item.track.name || '').toLowerCase() === (track.name || '').toLowerCase()
    )

    if (currIndex !== -1) {
      const remaining = displayedDiscographyTracks.slice(currIndex + 1)
      setAutoplayTracks(isShuffle ? shuffleArray(remaining) : remaining)
    } else {
      setAutoplayTracks([])
    }
  }
}, [playingTrack, isPlaying, selectedProject, projects, artist.name, showToast, displayedDiscographyTracks, isShuffle])
```

---

## 5. Edge Cases & Safeguards

1. **Filtering/Sorting changes during playback**: Changing sort order or search query while a song is playing should update `displayedDiscographyTracks` without interrupting the currently playing song.
2. **Missing audio streams**: Tracks without audio are excluded at the `displayedDiscographyTracks` creation level (`track.hasAudio && track.audioUrl`).
3. **Empty queue state**: When the last track in `autoplayTracks` finishes, if `repeatMode` is `off`, playback pauses gracefully (`setIsPlaying(false)`).
4. **Skipping backwards restoration**: When skipping backwards to a previous track in `handleSkipPrev`, the autoplay queue is reconstructed with `displayedDiscographyTracks.slice(prevIndex + 1)` so that the previously playing track (and subsequent tracks) are placed back into the autoplay queue in proper playback order.

---

## 7. Queue Dialog Interaction & Drag/Drop Enhancements

### Target File: [`PlaybackQueueDialog.js`](file:///c:/Users/Dan/App%20Dev/artist-discography/artist-discography/components/player/PlaybackQueueDialog.js)

#### A. Inter-Track Drag & Drop Padding Target Recognition
- **Problem**: Dragging items requires precise mouse cursor targeting directly over pre-existing track row elements. Dropping onto the padding gaps between tracks fails to reorder items.
- **Solution**:
  - Enhance `onDragOver` handlers on the list container and item wrappers to calculate mouse pointer vertical offset (`clientY`) relative to item midpoints and padding boundaries.
  - Expose padding areas between `ListItem` components as valid drop zones by attaching container-level `onDragOver` detection that maps Y-coordinates to nearest insertion index (`targetIndex`).
  - Provide visual feedback (top/bottom insertion indicator lines) when dragging over spacing gaps between items.

#### B. Dedicated Play Button for Queue Items (No Auto-Play on Row Click)
- **Problem**: Clicking anywhere on a queue track row (cover art or title text) currently starts playback automatically.
- **Solution**:
  - Disable automatic playback on generic row/cover/text clicks in `PlaybackQueueDialog.js`.
  - Add a dedicated `<IconButton>` featuring `<PlayArrowRoundedIcon>` to each queue row in both the **Manual Queue** and **Autoplay** sections.
  - Clicking this dedicated play button triggers `onPlayQueuedTrack(item, idx, isManual)`, while clicking row text or background performs item selection or remains passive without forcing playback.

