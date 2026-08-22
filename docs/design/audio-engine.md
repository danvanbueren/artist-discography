# 🎵 Audio Playback Engine & Streaming Architecture

This document details the audio playback architecture of **Artist Discography**, including memory-safe audio element management, byte-range progressive streaming, client-side preloading, queue management, OS integration, and cross-device casting.

---

## 🏗️ Core Audio Pipeline Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                             Client Browser                               │
│                                                                          │
│   ┌──────────────────────────────────────────────────────────────────┐   │
│   │                      Persistent Audio Context                    │   │
│   │   - Active Track State, Scrubber Progress, Volume (10% Guard)     │   │
│   │   - Playback Queue (Manual Priority + Autoplay Fallback)         │   │
│   │   - Repeat Modes (OFF / ONE / ALL) & Real-time Shuffle           │   │
│   └──────────────────────────────────┬───────────────────────────────┘   │
│                                      │                                   │
│              ┌───────────────────────┴───────────────────────┐           │
│              ▼                                               ▼           │
│   ┌─────────────────────┐                         ┌──────────────────┐   │
│   │ Managed HTML5 Audio │                         │ Media Preloader  │   │
│   │ - Single Reuse Slot │                         │ - Idle Pre-fetch │   │
│   │ - Strict Teardown   │                         │ - Bounded Slot   │   │
│   │ - crossOrigin: anon │                         │ - Tier Aware     │   │
│   └──────────┬──────────┘                         └────────┬─────────┘   │
└──────────────┼─────────────────────────────────────────────┼─────────────┘
               │                                             │
               │ HTTP GET (Range: bytes=0-...)               │
               ▼                                             ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                   Next.js Server: /api/audio/[...path]                   │
│   ├── Authentication & Gating Check (403 Forbidden for uncleared)        │
│   ├── ETag & HTTP 304 Not Modified Validation                            │
│   ├── Dynamic Multi-Tier Selector (Lossless, High 320k, Medium 128k)     │
│   └── Byte-Range HTTP 206 Partial Content Streamer                       │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 🧹 HTML5 Audio Lifecycle & Memory Management

### The Chromium / WebKit Demuxer Leak Problem
In modern browsers (Chromium/Blink, WebKit/Safari), instantiating disposable `new Audio()` elements with `preload="auto"` causes the underlying native media demuxer buffers and decoded PCM streams to remain locked in memory even after JavaScript garbage collection. In long listening sessions across hundreds of tracks, this can cause browser tabs to bloat past 1GB and stutter or crash.

### Singleton Managed Slot & Strict Teardown Protocol
Artist Discography solves this by maintaining a **single, managed HTML5 Audio element instance** across the entire application lifecycle.

When switching tracks, pausing, or tearing down the player:
```javascript
// Strict native buffer deallocation
const teardownAudioElement = (audio) => {
  if (!audio) return
  audio.pause()
  audio.removeAttribute('src') // Detaches the media demuxer pipeline
  audio.load() // Forces the browser to flush all decoded chunk buffers
}
```

### Bounded Single-Slot Background Preloading (`mediaPreloader.js`)
To achieve zero-latency track transitions without unbounded memory growth:
1. The preloader only pre-buffers bytes for **exactly one upcoming track** in the active queue.
2. Preload fetches are scheduled during browser idle time using `window.requestIdleCallback`.
3. When the active track finishes, the pre-buffered data is immediately available from the browser cache, starting playback instantaneously.
4. Total audio memory footprint remains bounded below **< 100 MB** regardless of playlist length.

---

## 📶 Dynamic Network Quality Tiers & Performance Probing

The audio engine supports multi-tier quality selection tailored to user preferences and network speed:

| Tier Key | Format / Bitrate | Description | Target Use Case |
| :--- | :--- | :--- | :--- |
| **`lossless`** | Original Master FLAC / WAV | Bit-perfect, uncompressed audio | High-speed Wi-Fi, audiophile listening |
| **`high`** | MP3 320 kbps (CBR/VBR0) | High fidelity with broad compatibility | Standard desktop & home audio |
| **`compressed`** | AAC / MP3 128 kbps | Highly optimized, compact stream | Mobile cellular data, low-bandwidth |

### Automatic Network Probing (`networkProbe.js`)
On first visit, the client performs a lightweight latency/throughput probe against a small test chunk. If network latency is high or connection bandwidth is constrained, the player selects the high-efficiency compressed tier to prevent buffering stutter, with the option for the user to manually override the quality setting anytime in the player bar.

---

## 🔀 Queue Management, Autoplay & Loop Engine

The playback queue operates on a dual-tier priority model:

```
[ Active Track ]
       │
       ▼ (Track Finishes)
[ Manual Queue ] ──── (Has Items?) ────► Play Next Manual Track & Pop
       │ (Empty)
       ▼
[ Autoplay Queue ] ── (Derived from Catalog Context) ──► Play Next Contextual Track
```

### 1. Manual Queue with Inter-Track Drag-and-Drop
- Users can click `+ Queue` on any track to add it to their custom listening queue.
- In `PlaybackQueueDialog`, tracks can be reordered by dragging them directly into visual drop-zones between track rows.
- Manual queue items take absolute priority over autoplay derivation.

### 2. Autoplay Derivation
- When the manual queue is empty, the player automatically derives the next logical track based on browsing context (e.g., the remaining tracks on the active album, or chronological discography sequence).

### 3. Repeat Modes (`off`, `one`, `all`)
- **`off`**: Plays through manual queue and autoplay sequence, stopping when the catalog ends.
- **`one`**: Seamlessly loops the currently playing track from `0:00` indefinitely.
- **`all`**: When the queue or album reaches the final track, the player automatically re-seeds the queue from track 1 for continuous listening.

### 4. Real-time Shuffle
- Toggling Shuffle reorganizes upcoming queue tracks using the Fisher-Yates shuffle algorithm while preserving the currently playing track at index 0.

---

## ⌨️ Global Shortcuts & Volume Persistence

### Spacebar Play/Pause Capture Phase Listener
- A global `keydown` event listener attached in the capture phase intercepts Spacebar presses.
- If the user is actively typing in an `<input>`, `<textarea>`, or content-editable field, the event is passed through.
- When outside form fields, Spacebar immediately toggles playback and prevents native page scroll jumps.

### Persistent Volume with 10% Floor Guard
- User volume level and mute state are automatically persisted in `localStorage`.
- **10% Floor Guard (`MIN_LISTENABLE_VOLUME`)**: If a user un-mutes after previously sliding the volume to 0%, the engine restores volume to at least 10% to prevent "silent playback" confusion.

---

## 📱 OS MediaSession & Hardware Media Keys

The audio engine synchronizes directly with the OS media subsystem via `navigator.mediaSession`:

```javascript
navigator.mediaSession.metadata = new MediaMetadata({
  title: currentTrack.name,
  artist: currentTrack.artist || artistConfig.name,
  album: currentProject.name,
  artwork: [
    { src: '/api/media/' + projectSlug + '/art.jpg?w=96&q=85', sizes: '96x96' },
    { src: '/api/media/' + projectSlug + '/art.jpg?w=192&q=85', sizes: '192x192' },
    { src: '/api/media/' + projectSlug + '/art.jpg?w=512&q=85', sizes: '512x512' },
  ],
})
```

### Supported Hardware Controls
- **Desktop Keyboard Media Keys**: Play, Pause, Next Track, Previous Track, Stop.
- **Mobile Lockscreen & Dynamic Island**: Full playback scrubber sync, track metadata, and skipping.
- **Headphone & Bluetooth Action Clicks**: Single-tap toggle, double-tap skip.

---

## 📺 Dual-Engine Casting & Remote Playback

Artist Discography supports native wireless casting to external speakers, smart TVs, and receivers via a dual-engine architecture:

```
                          ┌────────────────────────┐
                          │   Active Audio Track   │
                          └───────────┬────────────┘
                                      │
                 ┌────────────────────┴────────────────────┐
                 ▼                                         ▼
   [ Chromium / Android / Desktop ]             [ Apple Safari / iOS / macOS ]
         W3C Remote Playback API                      WebKit AirPlay API
       `audio.remote.prompt()`             `audio.webkitShowPlaybackTargetPicker()`
                 │                                         │
                 ▼                                         ▼
   Google Cast / Chromecast / TVs               Apple AirPlay / HomePod / Apple TV
```

### Strict CORS Compliance for External Media Receivers
External cast receivers (Chromecast, Google Home, smart TVs) run sandboxed receiver runtimes that enforce strict CORS:
- Audio endpoint `/api/audio/[...path]` exports explicit `OPTIONS` and `HEAD` handlers returning `HTTP 204` and `Access-Control-Allow-Origin: *`.
- `<audio>` elements include `crossOrigin="anonymous"`.
- Range streaming headers (`Accept-Ranges`, `Content-Range`, `Content-Length`) are fully exposed.
- For private access releases, authenticated sessions attach temporary signed query tokens so external receivers (which do not share browser session cookies) can stream authorized gated tracks without authentication failure.

---

## 🖼️ Picture-in-Picture Mini-Player

For desktop multi-tasking, the audio engine includes a Canvas-driven Picture-in-Picture mini-player:
- A hidden `<canvas>` element continuously renders cover artwork, animated visualizer bars, and track progress.
- `canvas.captureStream()` feeds a floating `<video>` element invoking `video.requestPictureInPicture()`.
- Automatically hidden on mobile/touch devices and cleanly torn down when playback stops.
