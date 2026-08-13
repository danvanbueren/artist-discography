# Artist Discography — Optimization & Feature Blueprint Master Plan

This directory contains the comprehensive, technical implementation plans for optimizing performance, audio playback state, queue behavior, repeat/shuffle mechanics, progressive media caching/streaming, and virtualized SPA navigation in the Artist Discography application.

---

## 📋 Table of Contents & Plan Index

## 📋 Table of Contents & Plan Index

| Plan File | Focus Area | Key Objectives |
| :--- | :--- | :--- |
| **[01-playback-queue-and-autoplay.md](./01-playback-queue-and-autoplay.md)** | Playback Queue & Autoplay Engine | Reset manual queue on direct track play; dynamically populate autoplay queue; support drag-and-drop into inter-track padding space; add dedicated play button for queue tracks (no auto-play on row click). |
| **[02-repeat-and-shuffle-modes.md](./02-repeat-and-shuffle-modes.md)** | Repeat, Shuffle, Volume & Hit Targets | Robust Repeat OFF/ONCE/ALL modes; visual shuffle sync; persistent volume bar loading, mute toggle restoration, and `MIN_LISTENABLE_VOLUME = 10%` guard; bulletproof global Spacebar play/pause keybindings; z-index elevation for mute icon above slider thumb; expanded `IconButton` clickable hit target areas app-wide (`theme.js`, `AudioPlayerBar.js`, `TrackRow.js`). |
| **[03-media-caching-and-adaptive-streaming.md](./03-media-caching-and-adaptive-streaming.md)** | Media Caching & Adaptive Streaming | ETag/MD5 hash validation (HTTP 304), range-based initial audio chunk preloading (LRU capped), YouTube-style progressive quality, adaptive WebP/AVIF image sizing, and immediate vs. background media prioritization. |
| **[04-spa-routing-and-history-navigation.md](./04-spa-routing-and-history-navigation.md)** | SPA Routing & Namespaced System Routes | Virtualized SPA history navigation without page reloads; track background click selection (no selection on main page vs. URL update on project page); namespaced system routes (`/_sys/_admin` and `/_sys/_dev` via Next.js rewrites to `/sys/admin` and `/sys/dev`) to prevent collisions with music projects named `admin` or `dev`; warning chips open portal links in a new tab (`target="_blank"`); instant `redirect('/')` when system routes are disabled in config. |

---

## 🎯 High-Level Architectural Goals

1. **Seamless Audio Experience**: Playing a track immediately clears stale manual queue items and builds a clean autoplay list derived from the user's current view context and active sort order.
2. **Deterministic Playback & Volume Controls**:
   - **Volume Persistence & Unmute Floor**: Storage-backed volume level and mute toggle state that correctly applies to the underlying `<audio>` element on mount. Muting never restarts audio playback (`currentTime` is preserved). Unmuting enforces a `10%` minimum listenable volume floor (`MIN_LISTENABLE_VOLUME = 10%`).
   - **Elevated Button Z-Index & Hit Targets**: Mute icon button is z-index elevated above the volume slider thumb to prevent thumb overlap click obstruction. App-wide `MuiIconButton` style overrides (`theme.js`) and generous padding ensure effortless clicking without precision aiming.
   - **Ultra-Reliable Spacebar Control**: Capture-phase keydown listener that toggles audio play/pause consistently without interfering with active text fields or breaking when UI elements are focused.
   - **Repeat OFF / ONCE / ALL**: Complete loop modes supporting track restart or discography replenishment without array memory leakage.
   - **Shuffle Sync**: Visually reorganizes the autoplay queue list in the UI when toggled ON and restores original sort order when toggled OFF.
3. **Player Bar UI & Unified Hover Layout**:
   - Cover art, song title, and artist name are unified into a single interactive click & hover container. Hovering anywhere inside the container scales cover art and highlights text simultaneously; clicking anywhere navigates to the track page.
   - Song title sits directly on top of artist name with clean vertical spacing. Share button is vertically centered as its own element immediately following the title/artist text group.
4. **Optimized Queue & Inter-Track Dragging**:
   - Inter-track padding space recognised as drop targets so dragging queued songs requires no precise aiming.
   - Dedicated play button on queue rows prevents accidental playback on generic row clicks.
5. **High-Performance Media Delivery**:
   - Server-side ETag/hash generation for instant HTTP 304 validation on unchanged audio and images.
   - Progressive audio streaming: Initial 256KB-512KB chunks preloaded for next 2-3 tracks in queue using LRU cache.
   - Smart image delivery: WebP/AVIF compression with resolution sizing query parameters (`?w=...&q=...`) to optimize bandwidth.
6. **Virtualized SPA & Namespaced System Routes**:
   - Track background clicks do not trigger selection on the main page (`onSelectTrackRow={null}`), preserving clean browsing.
   - On single project pages, clicking any part of the track updates the URL state without changing page views.
   - System routes are safely namespaced at `/_sys/_admin` and `/_sys/_dev` (rewritten to `/sys/admin` and `/sys/dev`) to eliminate routing collisions with music projects named `admin` or `dev`.
   - Alert warning chips open system routes in a new browser tab (`target="_blank"`).
   - Navigating to disabled system routes redirects instantly to home (`/`) instead of displaying unauthorized error pages.
   - Full browser back/forward history compatibility with zero full-page reloads and zero audio interruptions.

