# Open Graph & Discord 1200×630 Rich Link Preview System

## Overview

This system dynamically renders high-resolution (1200×630 px) Open Graph / Twitter card preview images for social platforms (Discord, Twitter/X, iMessage, Telegram, WhatsApp, Facebook, LinkedIn, Slack) when URLs to your discography are shared.

It uses a high-performance hybrid architecture combining **Next.js `ImageResponse` (Satori layout engine)** for declarative typography, flexbox alignment, and vector SVG rendering with **Sharp** for ambient background blurring and vibrant color extraction.

---

## Supported URL Previews & Card Layouts

### 1. General Discography Preview (`/`)

- **Background**: Ambient dark blurred backdrop derived from the personalized background image (or newest release artwork fallback).
- **Left Column**:
  - Top: Large artist logo (or stylized initial badge fallback).
  - Bottom: Bold `"Discography"` header.
- **Right Column**:
  - Artist Name with dynamic color-sampled text gradient.
  - Artist Bio (truncated cleanly with multi-line ellipsis).
  - Row of active streaming/social platform icons (up to 8 icons).
  - Bottom Stats Row: `<AlbumIcon> N projects    <MusicNoteIcon> N tracks    <LinkIcon> N platforms`.

### 2. Single Project / Album Preview (`/[project-slug]`)

- **Background**: Ambient dark blurred backdrop sampled directly from the project's cover art.
- **Left Column**:
  - Top: High-contrast 1:1 square cover art with rounded corners and subtle shadow.
  - Bottom: Scaled artist logo.
- **Right Column**:
  - Project Name with dynamic color-sampled text gradient.
  - Project Artist name.
  - Release Date and Project Type (e.g. `May 19, 2026 · Feature`).
  - Bottom Stats Row: `<MusicNoteIcon> N tracks    <ClockIcon> MM:SS total duration`.

### 3. Individual Track Preview (`/[project-slug]/[track-slug]`)

- **Background**: Ambient dark blurred backdrop sampled from the track/project cover art.
- **Left Column**:
  - Top: 1:1 square cover art.
  - Bottom: Scaled artist logo.
- **Right Column**:
  - Track Name with dynamic color-sampled text gradient.
  - Track Artist.
  - Release Date.
  - Bottom Stats Row: `<AlbumIcon> Project Name · Project Type    <ClockIcon> M:SS track duration`.

---

## Metadata Sidecar Files (`data/cache/og/<hash>.json`)

For every generated card (`data/cache/og/<hash>.png`), a lightweight JSON sidecar is written atomically alongside it:

```json
{
  "entityType": "track",
  "slug": "post-mortem/rest",
  "imageFileName": "<hash>.png",
  "generatedAt": "2026-08-30T05:25:00.000Z",
  "themeColorHex": "#e08b52",
  "palette": {
    "colors": ["hsl(24, 75%, 60%)", "..."],
    "primaryGradient": "linear-gradient(135deg, ...)",
    "secondaryGradient": "linear-gradient(135deg, ...)",
    "isMonochrome": false
  },
  "sourceFingerprint": {
    "entityType": "track",
    "version": "v1",
    "slug": "post-mortem/rest",
    "text": { ... },
    "files": {
      "artwork": { "exists": true, "mtimeMs": 1740000000000, "size": 3173786 },
      "logo": { "exists": true, "mtimeMs": 1730000000000, "size": 45020 },
      "audio": { "exists": true, "mtimeMs": 1740000000000, "size": 69586804 }
    }
  },
  "metadata": {
    "title": "Rest",
    "artist": "Neon December, Polybit, Kros",
    "formattedDuration": "2:54"
  }
}
```

### Benefits of the Sidecar Architecture:

1. **Sub-Millisecond `generateMetadata`**: The page server reads the pre-computed sidecar JSON to immediately populate `theme-color`, titles, and descriptions without invoking Sharp or `ffprobe` during HTTP page requests.
2. **Instant Cache Fingerprint Checks**: Cache validation compares file modification timestamps (`mtimeMs`) and sizes in microseconds without parsing binary images.
3. **Atomic Safety**: Written atomically to prevent race conditions or corrupted cache state.

---

## Cache Management & Admin Dashboard Integration

- **Disk Location**: `data/cache/og/`
- **Admin Dashboard "Validate Media Cache"**: Clicking **"Validate Media Cache"** in the Media Processing drawer triggers `validateAndWarmAllOgCards()`, which:
  1. Validates all Open Graph cards against live project and config state.
  2. Re-generates any stale or missing preview cards.
  3. Prunes orphaned cache files.
  4. Broadcasts live step progress over Server-Sent Events (SSE).
- **Automatic Invalidation**: Any change to `project.json`, `config.json`, artwork files, logo files, or audio files changes the source fingerprint, immediately generating a fresh card on the next request.

---

## Open Graph & Discord Tags Reference

When delivering HTML responses, `generateMetadata` outputs:

```html
<!-- Open Graph -->
<meta property="og:title" content="Rest - Neon December, Polybit, Kros (Post Mortem)" />
<meta
  property="og:description"
  content="Listen to 'Rest' by Neon December, Polybit, Kros on Post Mortem."
/>
<meta
  property="og:image"
  content="https://yourdomain.com/api/og?proj=post-mortem&track=rest&v=1a2b3c4d"
/>
<meta property="og:image:type" content="image/png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="Rest Artwork" />

<!-- Twitter / X Cards -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Rest - Neon December, Polybit, Kros (Post Mortem)" />
<meta
  name="twitter:description"
  content="Listen to 'Rest' by Neon December, Polybit, Kros on Post Mortem."
/>
<meta
  name="twitter:image"
  content="https://yourdomain.com/api/og?proj=post-mortem&track=rest&v=1a2b3c4d"
/>

<!-- Discord Left Stripe Theme Color -->
<meta name="theme-color" content="#e08b52" />
```

---

## Testing Previews on Discord & Social Networks

Discord caches unfurled link metadata aggressively. When testing locally or on live domains:

1. **Append a query parameter**: Add a random test parameter to your URL (e.g. `https://yourdomain.com/post-mortem?test=1`) to bypass Discord's cached card.
2. **Inspect via API**: Visit `/api/og` or `/api/og?proj=<slug>&track=<trackSlug>` directly in your browser to inspect the rendered 1200×630 PNG card in real time.
