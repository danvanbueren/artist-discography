# Plan 03: Media Caching & Adaptive Streaming

## 1. Executive Summary & Core Objectives

This plan covers performance optimizations for media assets (audio & images) across server API routes (`/api/audio` and `/api/media`) and client component preloaders.

### Key Objectives:
1. **Server Hash Validation & HTTP Caching**: Add strong `ETag` and `Last-Modified` validation to server API routes, returning `304 Not Modified` when assets are unchanged.
2. **Audio Pre-loading & Chunk Buffering**: Create a client-side `AudioPreloaderManager` that fetches initial 256KB-512KB audio chunks of upcoming queue tracks using `Range: bytes=0-262143` headers, stored in a memory-capped LRU cache (max 8 tracks).
3. **Adaptive Image Compression & Sizing**: Support dynamic query parameters (`?w=width&q=quality&fmt=webp`) in `/api/media/[...path]` for thumbnail/icon sizing.
4. **Strict Delivery Prioritization**: Prioritize immediate UI rendering and active track playback over background preloading (using `requestIdleCallback` / low-priority fetch).

---

## 2. Server API Enhancements

### A. Audio Serving Endpoint: [`app/api/audio/[...path]/route.js`](file:///c:/Users/Dan/App%20Dev/artist-discography/artist-discography/app/api/audio/%5B...path%5D/route.js)

1. Compute strong `ETag` based on file stats (`mtimeMs-size` or MD5 hash).
2. Check incoming `If-None-Match` header. If match, return `304 Not Modified` with empty body.
3. Validate `If-Range` header on HTTP 206 Range requests.

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

### B. Media Serving Endpoint: [`app/api/media/[...path]/route.js`](file:///c:/Users/Dan/App%20Dev/artist-discography/artist-discography/app/api/media/%5B...path%5D/route.js)

1. Add ETag validation (`If-None-Match` -> `304 Not Modified`).
2. Add width (`w`) and quality (`q`) parameter handling to resize images dynamically (using `sharp` or optimized canvas when requested) for low-bandwidth icons and album art thumbnails.

---

## 3. Client Media Preloader Engine

### Target File: `lib/mediaPreloader.js` [NEW]

Create a lightweight client LRU cache preloader module:

```javascript
class MediaPreloadManager {
  constructor(maxAudioChunks = 8) {
    this.audioCache = new Map() // url -> Blob
    this.maxAudioChunks = maxAudioChunks
    this.activePreloads = new Set()
  }

  // Preload initial byte range (first 256KB) for quick audio start
  async preloadAudioChunk(audioUrl) {
    if (!audioUrl || this.audioCache.has(audioUrl) || this.activePreloads.has(audioUrl)) return

    this.activePreloads.add(audioUrl)

    // Run when browser is idle to avoid blocking UI rendering
    const schedule = typeof window !== 'undefined' && 'requestIdleCallback' in window
      ? window.requestIdleCallback
      : (cb) => setTimeout(cb, 200)

    schedule(async () => {
      try {
        const res = await fetch(audioUrl, {
          headers: { Range: 'bytes=0-262143' },
          priority: 'low',
        })
        if (res.status === 200 || res.status === 206) {
          const blob = await res.blob()
          
          // Enforce LRU cap
          if (this.audioCache.size >= this.maxAudioChunks) {
            const oldestKey = this.audioCache.keys().next().value
            this.audioCache.delete(oldestKey)
          }

          this.audioCache.set(audioUrl, blob)
        }
      } catch (err) {
        console.warn('Background audio chunk preload failed:', err)
      } finally {
        this.activePreloads.delete(audioUrl)
      }
    })
  }

  getCachedChunk(audioUrl) {
    return this.audioCache.get(audioUrl) || null
  }
}

export const mediaPreloader = new MediaPreloadManager()
```

---

## 4. Prioritization Rules

1. **Active Playback**: Full priority HTTP GET to `<audio src="...">` element.
2. **Visible Images**: Immediate `loading="eager"` for hero logo, active cover art, and visible project headers.
3. **Background Preloading**: Defer preloading of upcoming 2-3 tracks in `autoplayTracks` using `requestIdleCallback` so network and CPU never contend with immediate user actions.

---

## 5. Verification Plan

- [ ] Inspect HTTP response headers for `/api/audio/...` and `/api/media/...` in Browser DevTools. Verify `ETag` header is present.
- [ ] Send request with `If-None-Match`. Verify `304 Not Modified` is returned with zero payload body.
- [ ] Observe network tab during playback: Verify initial audio range requests (`bytes=0-262143`) occur during idle time for upcoming queue items.
- [ ] Confirm memory usage remains stable (LRU cache capped at 8 items).
