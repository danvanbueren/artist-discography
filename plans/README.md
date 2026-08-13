# Artist Discography — Optimization & Feature Blueprint Master Plan

This directory contains the comprehensive, technical implementation plans for optimizing performance, audio playback state, queue behavior, repeat/shuffle mechanics, progressive media caching/streaming, and virtualized SPA navigation in the Artist Discography application.

---

## 📋 Table of Contents & Plan Index

| Plan File | Focus Area | Key Objectives |
| :--- | :--- | :--- |
| **[01-playback-queue-and-autoplay.md](./01-playback-queue-and-autoplay.md)** | Playback Queue & Autoplay Engine | Reset manual queue on direct track play; dynamically populate autoplay queue; support drag-and-drop into inter-track padding space; add dedicated play button for queue tracks (no auto-play on row click). |
| **[02-repeat-and-shuffle-modes.md](./02-repeat-and-shuffle-modes.md)** | Repeat, Shuffle & Volume Controls | Robust Repeat OFF/ONCE/ALL modes; visual shuffle sync; persistent volume bar loading and mute toggle restoration; bulletproof global Spacebar play/pause keybindings. |
| **[03-media-caching-and-adaptive-streaming.md](./03-media-caching-and-adaptive-streaming.md)** | Media Caching & Adaptive Streaming | ETag/MD5 hash validation (HTTP 304), range-based initial audio chunk preloading (LRU capped), YouTube-style progressive quality, adaptive WebP/AVIF image sizing, and immediate vs. background media prioritization. |
| **[04-spa-routing-and-history-navigation.md](./04-spa-routing-and-history-navigation.md)** | SPA Routing & History Navigation | Virtualized SPA history navigation without page reloads; track background click selection (no URL change on main page vs. URL update on project page); instant `redirect('/')` when `/admin` or `/dev` are disabled in config. |

---

## 🎯 High-Level Architectural Goals

1. **Seamless Audio Experience**: Playing a track immediately clears stale manual queue items and builds a clean autoplay list derived from the user's current view context and active sort order.
2. **Deterministic Playback & Volume Controls**:
   - **Volume Persistence & Unmute**: Storage-backed volume level and mute toggle state that correctly applies to the underlying `<audio>` element on mount and toggles back to the originally loaded volume state.
   - **Ultra-Reliable Spacebar Control**: Capture-phase keydown listener that toggles audio play/pause consistently without interfering with active text fields or breaking when UI elements are focused.
   - **Repeat OFF**: Plays remaining tracks in current view scope until end of list, automatically skipping non-playable tracks.
   - **Repeat ONCE**: Locks playback on current track. Pressing Next or Prev restarts the same track without altering manual queue or autoplay lists.
   - **Repeat ALL**: Continuously loops current scope (project or full discography) without duplicating items or growing array memory infinitely.
   - **Shuffle**: Visually reorganizes the autoplay queue list in the UI when toggled ON and restores original sort order when toggled OFF.
3. **Optimized Queue & Inter-Track Dragging**:
   - Inter-track padding space recognised as drop targets so dragging queued songs requires no precise aiming.
   - Dedicated play button on queue rows prevents accidental playback on generic row clicks.
4. **High-Performance Media Delivery**:
   - Server-side ETag/hash generation for instant HTTP 304 validation on unchanged audio and images.
   - Progressive audio streaming: Initial 256KB-512KB chunks preloaded for next 2-3 tracks in queue using LRU cache.
   - Smart image delivery: WebP/AVIF compression with resolution sizing query parameters (`?w=...&q=...`) to optimize bandwidth.
   - Immediate media priority over background preloading.
5. **Virtualized Single Page Application (SPA) & Route Guards**:
   - Track background clicks highlight tracks locally on the main page without altering the URL, while song name links open project pages.
   - On single project pages, clicking any part of the track updates the URL state without changing page views.
   - Navigating to disabled `/admin` or `/dev` routes redirects instantly to home (`/`) instead of displaying unauthorized error pages.
   - Full browser back/forward history compatibility with zero full-page reloads and zero audio interruptions.

