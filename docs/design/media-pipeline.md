# 🖼️ Media Pipeline, Transcoding & Caching Engine

This document details the image and audio media processing pipelines of **Artist Discography**, covering on-the-fly Sharp image optimization, progressive image rendering, non-blocking FFmpeg audio transcoding over SSE, background cache warming, automated cache lifecycle cleanup, and dynamic favicon generation.

---

## 🎨 Image Processing Pipeline (Sharp)

Cover artwork and branding logos are dynamically optimized and served via dedicated route handlers:
- `/api/media/[...path]` (Album cover artwork)
- `/api/logo` (Dynamic artist logo)

```
[ Incoming Image Request: /api/media/hydrolock/art.jpg?w=320&q=85&format=webp ]
                                │
                                ▼
                   [ In-Memory LRU Cache Check ]
                    ├── Cache Hit ──► Return Buffered WebP (HTTP 200/304)
                    └── Cache Miss
                                │
                                ▼
                   [ Disk Cache Check (data/cache/images/) ]
                    ├── Cache Hit ──► Stream from Disk & Populate LRU
                    └── Cache Miss
                                │
                                ▼
                   [ Sharp Processing Pipeline ]
                    ├── Read Original Master (data/projects/hydrolock/art.jpg)
                    ├── Extract Embedded Color Profile (sRGB)
                    ├── Resize (w=320, fit=cover, withoutEnlargement=true)
                    ├── Transcode to WebP / AVIF (q=85, effort=4)
                    ├── Write to Disk Cache (atomic rename)
                    └── Stream Response (Cache-Control: public, max-age=31536000, immutable)
```

### Key Capabilities of Image Optimizer
1. **Dynamic Resizing**: Standard responsive breakpoints (`w=80`, `w=160`, `w=320`, `w=640`, `w=1024`).
2. **Next-Gen Formatting**: Converts JPEG/PNG to WebP and AVIF automatically based on browser `Accept` headers.
3. **Aspect Ratio Enforcement**: Strictly enforces a 1:1 square aspect ratio for release covers.
4. **Cache Invalidation via Modtime (`?v=mtime`)**: Queries append file modification timestamps to invalidate CDN/browser caches immediately when an artwork file is replaced.

---

## 👁️ Progressive Image Component (`ProgressiveImage.js`)

To prevent layout shift (CLS) and ensure instant visual feedback on slow connections:
1. **Blur-Up Micro-Placeholders**: Renders a tiny `16px` base64 blurred preview or SVG placeholder while the high-resolution image loads.
2. **Intersection Observer Lazy-Loading**: Images off-screen are not requested until the user scrolls within `200px` of the viewport.
3. **Smooth Cross-Fade Transition**: Once the high-resolution asset loads in memory, it smoothly fades in over `300ms` with zero popping.

---

## ⚡ Non-Blocking Audio Transcoding Pipeline (FFmpeg + SSE)

When an operator uploads or edits audio tracks in the Admin Portal, transcoding multiple high-resolution master files into streaming tiers can take several minutes.

### Non-Blocking Architectural Standard
Heavy background transcoding tasks **never block synchronous HTTP CRUD responses**.

```
[ Admin Portal / User Action ]
               │
               ▼ (POST /api/admin/upload)
[ 1. Stage Raw Audio Files & Save Project JSON Immediately ]
               │
               ▼ (HTTP 200 OK - Instant UI Response)
[ 2. Register Background Job in JobTracker ]
               │
               ▼
[ 3. Worker Spawns FFmpeg Transcoder ]
    ├── Tier 1: FLAC Master (Lossless Archive)
    ├── Tier 2: 320 kbps MP3 (CBR, Stereo)
    ├── Tier 3: 192 kbps MP3 (VBR 2)
    └── Tier 4: 128 kbps AAC/MP3 (Low Latency)
               │
               ▼
[ 4. Broadcast Progress Updates via Server-Sent Events (SSE) ]
               │
               ▼ (/api/admin/media-jobs)
[ Admin Media Processing Drawer Displays Live Progress Bar ]
```

---

## 🔥 Site-Load Cache Warmer (`mediaWarmer.js`)

To eliminate initial cold-start latency for visitors:
1. When the server starts or visitors load the catalog, `mediaWarmer.js` runs a low-priority background verification scan.
2. It audits all existing projects in `data/projects/` against `data/cache/`.
3. If any release is missing standard WebP thumbnail variants or audio tiers, it queues and generates them in the background without degrading active web server performance.

---

## 🧹 Automated Cache Lifecycle Cleaner (`cacheCleaner.js`)

Over time, deleting projects, updating covers, or removing tracks leaves orphaned cached files taking up disk space.

### Cleanup Coordinator Standard
`cacheCleaner.js` runs periodically and after project deletion events:
1. Compares disk files in `data/cache/images/` and `data/cache/audio/` against the active catalog index in `data/projects/`.
2. Identifies orphaned cache files with no corresponding project slug or matching modification timestamp.
3. Atomically removes stale files, maintaining a lean disk footprint.

---

## 🌓 Adaptive High-Contrast Dynamic Favicons

Standard static favicons are often invisible when browser tabs switch between dark and light OS themes. Artist Discography generates intelligent dynamic favicons from the artist logo:

```
                  [ Artist Logo (data/logo.png) ]
                                │
                                ▼
             [ Perceived Luminance Pixel Analysis ]
                 Formula: 0.299*R + 0.587*G + 0.114*B
                                │
               ┌────────────────┴────────────────┐
               ▼ (Luminance > 0.5)               ▼ (Luminance <= 0.5)
         [ Light / White Logo ]            [ Dark / Black Logo ]
               │                                 │
               ▼                                 ▼
   Obsidian Dark Base (#0f0f14)       Crisp White Base (#ffffff)
               │                                 │
               └────────────────┬────────────────┘
                                │
                                ▼ (Composited with 8% Inset Padding)
                 [ Dynamic Favicon Generation Suite ]
                  ├── 16x16 px   (Standard Browser Tab)
                  ├── 32x32 px   (High-DPI Retina Tab)
                  ├── 180x180 px (Apple Touch Icon)
                  ├── 192x192 px (Android PWA Icon)
                  └── 512x512 px (PWA Splash Icon)
```

The dynamic web manifest (`/manifest.webmanifest`) and `/api/icon` endpoint serve these luminance-adjusted icons automatically, guaranteeing crisp visibility across all devices and OS color schemes.
