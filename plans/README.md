# Artist Discography — Optimization & Feature Blueprint Master Plan

This directory contains the comprehensive, technical implementation plans for optimizing performance, audio playback state, queue behavior, repeat/shuffle mechanics, progressive media caching/streaming, and virtualized SPA navigation in the Artist Discography application.

---

## 📋 Table of Contents & Plan Index

| Plan File | Focus Area | Key Objectives |
| :--- | :--- | :--- |
| **[01-playback-queue-and-autoplay.md](./01-playback-queue-and-autoplay.md)** | Playback Queue & Autoplay Engine | Reset manual queue on direct track play; dynamically populate autoplay queue matching active scope (single project vs. main discography) and current sort/filter settings. |
| **[02-repeat-and-shuffle-modes.md](./02-repeat-and-shuffle-modes.md)** | Repeat & Shuffle Modes | Implement robust Repeat OFF, Repeat ONCE (stay on current track even when skipping), and Repeat ALL (continuous single-pass cycling without queue duplication); sync visual shuffle state with active queue order. |
| **[03-media-caching-and-adaptive-streaming.md](./03-media-caching-and-adaptive-streaming.md)** | Media Caching & Adaptive Streaming | ETag/MD5 hash validation (HTTP 304), range-based initial audio chunk preloading (LRU capped), YouTube-style progressive quality, adaptive WebP/AVIF image sizing, and immediate vs. background media prioritization. |
| **[04-spa-routing-and-history-navigation.md](./04-spa-routing-and-history-navigation.md)** | SPA Routing & History Navigation | Validate browser history popstate navigation, prevent full page reloads, and ensure seamless state sync across back/forward navigation while preserving uninterrupted audio playback. |

---

## 🎯 High-Level Architectural Goals

1. **Seamless Audio Experience**: Playing a track immediately clears stale manual queue items and builds a clean autoplay list derived from the user's current view context and active sort order.
2. **Deterministic Playback Controls**:
   - **Repeat OFF**: Plays remaining tracks in current view scope until end of list, automatically skipping non-playable tracks.
   - **Repeat ONCE**: Locks playback on current track. Pressing Next or Prev restarts the same track without altering manual queue or autoplay lists.
   - **Repeat ALL**: Continuously loops current scope (project or full discography) without duplicating items or growing array memory infinitely.
   - **Shuffle**: Visually reorganizes the autoplay queue list in the UI when toggled ON and restores original sort order when toggled OFF.
3. **High-Performance Media Delivery**:
   - Server-side ETag/hash generation for instant HTTP 304 validation on unchanged audio and images.
   - Progressive audio streaming: Initial 256KB-512KB chunks preloaded for next 2-3 tracks in queue using LRU cache.
   - Smart image delivery: WebP/AVIF compression with resolution sizing query parameters (`?w=...&q=...`) to optimize bandwidth.
   - Immediate media priority over background preloading.
4. **Virtualized Single Page Application (SPA)**:
   - Full browser back/forward history compatibility with zero full-page reloads and zero audio interruptions.
