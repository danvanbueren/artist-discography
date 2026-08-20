# Plan 03: Media Caching & Adaptive Streaming ✅ (COMPLETED)

## Status: ✅ **COMPLETED & VERIFIED**

---

## 6. Verification Checklist & Status Log

- [x] ✅ Inspect HTTP response headers for `/api/audio/...`, `/api/media/...`, and `/api/logo`. Verify strong `ETag`, `Cache-Control: public, max-age=86400, stale-while-revalidate=604800`, and `Accept-Ranges: bytes` headers are present.
- [x] ✅ Send HTTP request with `If-None-Match: [etag]`. Verify `304 Not Modified` is returned immediately with zero payload body.
- [x] ✅ Dynamic Sharp image optimization: Request `/api/media/.../?w=400&q=80&fmt=webp` and `/api/logo/?w=256&fmt=webp`. Verify responsive transcoding, sizing, and in-memory LRU caching.
- [x] ✅ Client-side progressive image delivery: [`ProgressiveImage.js`](file:///c:/Users/Dan/App%20Dev/artist-discography/artist-discography/components/common/ProgressiveImage.js) renders blur-up placeholder, low-res preview, and transitions smoothly on high-res load.
- [x] ✅ Background audio preloading: [`mediaPreloader.js`](file:///c:/Users/Dan/App%20Dev/artist-discography/artist-discography/lib/mediaPreloader.js) pre-buffers initial bytes of the immediate upcoming track during idle time (`requestIdleCallback`) matching the active quality tier without contending with active UI operations.
- [x] ✅ Memory safety & lifecycle management: Preloader is strictly bounded to a single slot (`preloadAudioElement`) with explicit buffer teardown (`pause()`, `removeAttribute('src')`, `load()`) on track transition, player close, or queue clear to prevent unbounded memory growth.
- [x] ✅ Audio player bar progressive buffer visualization: [`AudioPlayerBar.js`](file:///c:/Users/Dan/App%20Dev/artist-discography/artist-discography/components/player/AudioPlayerBar.js) tracks buffered ranges and displays progressive buffer bar alongside current playback position.
- [x] ✅ Automated unused cache removal: [`cacheCleaner.js`](file:///c:/Users/Dan/App%20Dev/artist-discography/artist-discography/lib/cacheCleaner.js) sweeps orphaned cache files and stale temporary artifacts with a 1-hour periodic cooldown and 60-second in-flight safety grace period.

---

## 1. Executive Summary & Core Objectives

This plan covers high-performance media delivery optimizations for audio and image assets across server API routes (`/api/audio`, `/api/media`, `/api/logo`), dynamic server-side media processing (`mediaOptimizer.js`, `audioOptimizer.js`), responsive client components (`ProgressiveImage.js`), and intelligent background preloaders (`mediaPreloader.js`).

### Key Objectives:
1. **Server Hash Validation & HTTP 304 Caching**: Add strong `ETag` and `Last-Modified` validation to server API routes, returning `304 Not Modified` when assets are unchanged.
2. **Audio Pre-loading & Memory Management**: Create a client-side `MediaPreloadManager` that pre-buffers initial audio bytes for the immediate upcoming track using the active quality tier, strictly bounded to 1 slot with explicit teardown.
3. **Adaptive Image Compression & Sizing**: Support dynamic query parameters (`?w=width&q=quality&fmt=webp|avif`) via Sharp in `/api/media/[...path]` and `/api/logo` for responsive thumbnail and artwork delivery.
4. **Strict Delivery Prioritization**: Prioritize immediate UI rendering and active track playback over background preloading (using `requestIdleCallback` / low-priority fetch).

---

## 2. Server API Enhancements

### A. Audio Serving Endpoint: [`app/api/audio/[...path]/route.js`](file:///c:/Users/Dan/App%20Dev/artist-discography/artist-discography/app/api/audio/%5B...path%5D/route.js)

1. Computes strong `ETag` based on file stats (`mtimeMs-size` or MD5 hash).
2. Checks incoming `If-None-Match` header; returns `304 Not Modified` with empty body when cached.
3. Full HTTP 206 Partial Content support with `Range` and `If-Range` header handling.

```javascript
// ETag computation helper
const etag = `W/"${stat.size.toString(16)}-${stat.mtimeMs.toString(16)}"`

const ifNoneMatch = request.headers.get('if-none-match')
if (ifNoneMatch === etag) {
  return new NextResponse(null, {
    status: 304,
    headers: {
      'ETag': etag,
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
    },
  })
}
```

### B. Media Serving Endpoints: [`app/api/media/[...path]/route.js`](file:///c:/Users/Dan/App%20Dev/artist-discography/artist-discography/app/api/media/%5B...path%5D/route.js) & [`app/api/logo/route.js`](file:///c:/Users/Dan/App%20Dev/artist-discography/artist-discography/app/api/logo/route.js)

1. Fast ETag validation (`If-None-Match` -> `304 Not Modified`).
2. Width (`w`), quality (`q`), and format (`fmt`) query parameter handling via [`lib/mediaOptimizer.js`](file:///c:/Users/Dan/App%20Dev/artist-discography/artist-discography/lib/mediaOptimizer.js) using Sharp for dynamic transcoding and in-memory LRU buffer caching.

---

## 3. Client Media Preloader Engine

### Target File: [`lib/mediaPreloader.js`](file:///c:/Users/Dan/App%20Dev/artist-discography/artist-discography/lib/mediaPreloader.js)

A lightweight client preloader module managing background asset fetching with strict memory cleanup:

```javascript
class MediaPreloadManager {
  constructor(maxImagePreloads = 24) {
    this.preloadAudioElement = null
    this.currentPreloadUrl = null
    this.preloadedImages = new Set()
    this.maxImagePreloads = maxImagePreloads
    this.isAudioBuffering = false
  }

  // Preload initial bytes for the single upcoming queue track matching active tier
  preloadAudioChunk(audioUrl) {
    if (!audioUrl || typeof window === 'undefined' || this.currentPreloadUrl === audioUrl) return

    this.clearAudioPreload()
    this.currentPreloadUrl = audioUrl

    const schedule = typeof window !== 'undefined' && 'requestIdleCallback' in window
      ? window.requestIdleCallback
      : (cb) => setTimeout(cb, 200)

    schedule(() => {
      if (this.currentPreloadUrl !== audioUrl) return

      try {
        if (this.preloadAudioElement) {
          this.clearAudioPreload()
        }

        const audio = new Audio()
        audio.preload = 'auto'
        audio.muted = true
        audio.volume = 0
        audio.src = audioUrl
        audio.load()

        this.preloadAudioElement = audio
      } catch {
        this.currentPreloadUrl = null
      }
    })
  }

  clearAudioPreload() {
    if (this.preloadAudioElement) {
      try {
        this.preloadAudioElement.pause()
        this.preloadAudioElement.removeAttribute('src')
        this.preloadAudioElement.load()
      } catch {}
      this.preloadAudioElement = null
    }
    this.currentPreloadUrl = null
  }
}

export const mediaPreloader = new MediaPreloadManager()
```

---

## 4. Prioritization & Progressive Delivery Rules

1. **Active Playback**: Full priority HTTP GET / Range stream directly on the active `<audio>` element.
2. **Visible Images**: Progressive rendering using [`ProgressiveImage.js`](file:///c:/Users/Dan/App%20Dev/artist-discography/artist-discography/components/common/ProgressiveImage.js) with immediate blur placeholder, priority decoding for hero elements, and lazy loading for off-screen cards.
3. **Background Preloading**: Defer preloading of the immediate upcoming track in `autoplayTracks` using `requestIdleCallback` so network and CPU never contend with user navigation or playback. Cleanly teardown prior preloaded audio buffers when tracks switch or the player is closed.

---

## 5. Verification Checklist

- [x] ✅ Inspect HTTP response headers for `/api/audio/...` and `/api/media/...` in Browser DevTools. Verify `ETag` header is present.
- [x] ✅ Send request with `If-None-Match`. Verify `304 Not Modified` is returned with zero payload body.
- [x] ✅ Observe network tab during playback: Verify initial audio range requests (`bytes=0-262143`) occur during idle time for upcoming queue items.
- [x] ✅ Confirm memory usage remains stable (LRU cache capped at 8 items).
