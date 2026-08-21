# Artist Discography

A high-performance, modern Single Page Application (SPA) designed to showcase an artist's complete music discography—including albums, EPs, singles, collaborations, flips, and remixes—with direct links to listen across all major streaming platforms and built-in audio preview playback.

---

## 🌟 Key Features

- **Full Catalog Showcase**: Browse an artist's complete discography categorized by albums (`LP`), EPs, singles, remixes, bootlegs, and features.
- **Private Access System & Permission Flags**:
  - **Private Access Code Authentication**: Operators configure an access code in `config.json` / Admin Profile; visitors unlock VIP/unreleased projects and gated audio in `Navbar` -> `Settings`.
  - **Project Visibility (`public` vs. `private`)**: Private releases are completely hidden from public browsing, search, and type filters until authenticated.
  - **Copyright Playback Gating (`cleared` vs. `uncleared`)**: Uncleared projects display full metadata and streaming platform links, but in-site audio streams are withheld from unauthenticated users. Entering the code unlocks audio playback with subtle `UNLOCKED` badges and zero "locked" clutter for public visitors.
  - **Defense in Depth**: Endpoint `/api/audio/[...path]` returns HTTP 403 Forbidden if unauthenticated visitors attempt direct streaming of gated tracks.
- **Multi-Platform Streaming Links**: Direct links to listen on all major platforms (Spotify, Apple Music, YouTube, SoundCloud, Bandcamp, Tidal, Deezer, Pandora, Amazon Music, iTunes).
- **Contained Audio Player Bar & Progressive Streaming**:
  - Direct in-app streaming with play/pause, seek scrubber, volume control, manual queueing, autoplay derivation, shuffle, and repeat modes.
  - **Network-Aware Quality Modes & User Settings**: Initial network performance probe detects optimal starting tier (High Quality 320 kbps, Lossless FLAC, or Compressed 128 kbps), with user-configurable settings and uninterrupted playback.
  - **Unified Hover & Click Container**: Cover art, song title, and artist name scale and highlight together; clicking anywhere navigates directly to the track page.
  - **Volume Persistence & 10% Floor Guard**: Storage-backed volume settings (`MIN_LISTENABLE_VOLUME = 10%`) ensure unmuting always restores audio to a listenable level.
  - **Elevated Button Z-Index & Expanded Hit Targets**: Mute icon button (`zIndex: 2`) is elevated above the volume slider thumb (`zIndex: 1`), and expanded hit targets (`theme.js`) make icon buttons effortless to click.
  - **Spacebar Play/Pause Shortcut**: Global capture-phase Spacebar listener toggles playback reliably without scroll or button accidental clicks while preserving text input fields.
  - **Loop Modes (`off`, `one`, `all`) & Shuffle**: `Repeat ALL` auto-replenishes autoplay queues for continuous playback; `Shuffle` visually reorganizes the queue list in real time.
- **Manual Queue & Inter-Track Drag-and-Drop**: Reorder queue tracks in `PlaybackQueueDialog` by dragging items directly into inter-track padding gaps with visual insertion indicators. Dedicated play buttons prevent accidental auto-play on row clicks.
- **Progressive Media Delivery & Caching**:
  - **Immediate Post-Upload Media Compression & Pre-Caching**: All uploaded covers and audio tracks are immediately pre-compressed into standard WebP resolutions and audio quality tiers (320k, 192k, 128k, Lossless FLAC) upon upload/edit/copy, ready to serve with zero latency.
  - **Automatic Site-Load Cache Readiness Fallback**: Background readiness coordinator (`mediaWarmer.js`) verifies all catalog media on site load, auto-generating any missing cache variants as a seamless fallback.
  - **Automated Unused Cache File Removal & Lifecycle Management**: Automated cleanup engine (`cacheCleaner.js`) periodically scans and prunes orphaned, superseded, and temporary cache files from `data/cache/images/` and `data/cache/audio/` without blocking HTTP requests or generating excessive overhead.
  - **Server-Side Dynamic Image Optimization**: Sharp-powered on-the-fly image transcoding (`/api/media/[...path]` and `/api/logo`) supporting WebP/AVIF formatting, responsive sizing (`?w=...&q=...`), and in-memory LRU caching.
  - **HTTP 304 ETags & Partial Content Streaming**: Fast HTTP 304 cache validation for unchanged assets, plus full HTTP 206 `Range` byte-range audio streaming with `If-Range` header handling.
  - **Background Chunk Preloader & Single-Slot Memory Management**: Client `mediaPreloader` pre-buffers initial bytes for the immediate upcoming queue track during browser idle time (`requestIdleCallback`) using the active audio quality tier for instant playback start, while strictly bounding preloads to 1 slot and explicitly releasing old media buffers to maintain lean client memory footprint (<100MB).
  - **Progressive Image Delivery**: `ProgressiveImage` component with blur-up placeholders, intersection-observer lazy loading, and smooth transitions.
- **Virtualized SPA Routing & History**:
  - **Main Discography Page (`/`)**: Row background clicks do not trigger track selection (`onSelectTrackRow={null}`), keeping browsing clean. Song title / artist links open single project pages (`/[project-slug]/[track-slug]`).
  - **Single Project Page (`/[project-slug]`)**: Row clicks highlight tracks and update URL state (`/[project-slug]/[track-slug]`) without reloading the page or stopping audio.
  - **Uninterrupted Audio Playback**: Navigating across pages or using browser Back/Forward arrows (`popstate`) preserves active audio playback seamlessly.
- **Unified Admin Dashboard (`/_sys/_admin`)**:
  - **Modular Architecture & Centralized Access**: All management, developer inspection, and testing tools are consolidated into a password-protected dashboard namespaced at `/_sys/_admin` (internally rewritten to `/sys/admin`). Legacy `/_sys/_dev` routes seamlessly redirect here.
  - **Tab 1 — Profile & Server Settings**: Manage artist identity, bio, branding logos, streaming/social links, and server/security credentials (`adminAccess`, `adminPassword`, `privateAccessCode`, `siteUrl`) in a unified card layout.
  - **Tab 2 — Projects & Releases**: Full CRUD workflow for projects and tracks with real-time media processing, drag-and-drop track reordering, track duplication across projects (`/api/admin/copy-track`), and dark-themed MUI X Date Pickers (`@mui/x-date-pickers` + `dayjs`).
  - **Tab 3 — Catalog & Media Audit (`DevDiscographyAuditView`)**: Comprehensive audit matrix displaying streaming links, audio presence, cover artwork resolution, and density controls across all releases.
  - **Tab 4 — OpenAPI 3.1 Live Tester (`DevApiExplorer`)**: Interactive API sandbox testing GET, POST, PUT, and DELETE endpoints with live execution, cURL generation, and formatted JSON response viewer.
  - **Tab 5 — System Health & Utilities (`DevOverviewTab` & `RawJsonInspectorTab`)**: Real-time coverage metrics, telemetry, data repair log, modular raw JSON inspector (`config.json`, per-project `project.json`, and combined state), and randomized dummy data seeder (`/api/dev/seed-dummy`).
  - **Artist Logo Management**: Upload, preview, replace, and reset custom artist logos (`/api/admin/logo`) with live dimensions, aspect ratio, file size telemetry, and automatic client cache busting.
  - **Collision-Free Routing & Protected Slugs**: Automatically blocks project URLs colliding with system routes (`_sys`, `admin`, `dev`, `api`) and auto-repairs legacy conflicting slugs on startup.
- **Rich Discord & OpenGraph Embedded Link Previews**:
  - Full OpenGraph and Twitter Card metadata generation (`lib/metadata.js` & dynamic route metadata) tailoring titles, descriptions, and high-resolution artwork for Tracks (`<track> - <artist> (<project>)`), Projects (`<project> - <artist>`), and Root/Catalog (`<artist> - Artist Discography`).
  - Absolute URL base normalization (`normalizeSiteUrl`) with automatic fallback handling.
- **Smooth Drag & Mouse Wheel Horizontal Scrolling (`useDragScroll`)**:
  - Smooth mouse click-and-drag panning and automatic translation of vertical mouse wheel ticks to horizontal scroll motion across streaming platform button groups, navigation tabs, and filter pills.
- **OS Media Session, Hardware Keys & Cast Integration**:
  - **`navigator.mediaSession` Synchronization**: Live sync of track title, artist, album name, and multi-resolution artwork (`96px` to `512px`).
  - **Hardware Keyboard Media Keys**: Native desktop media key controls (Play/Pause, Skip Next, Skip Previous, Stop, and Position Seeking) and mobile lockscreen/Dynamic Island scrubbing.
  - **Google Cast & Apple AirPlay Multi-Platform Streaming**: Dual-engine casting supporting W3C Remote Playback API (Google Cast on Android/Chrome/Edge) and Apple WebKit AirPlay (iOS/Safari/macOS) with full CORS compliance (`Access-Control-Allow-Origin: *`, `OPTIONS`/`HEAD` preflights) for Chromecast, Google Home, Nest Audio, smart speakers, Android TVs, HomePod, and Apple TVs.
  - **Desktop Picture-in-Picture Mini-Player**: Synchronized Canvas video stream pops out a floating desktop player with album artwork, track title, and progress. Automatically hidden on mobile/touch devices and destroyed on player close.
- **Zero-Data-Loss & Modular Data Architecture**:
  - **Atomic Swap Writes**: Write operations serialize to temporary swap files (`.<filename>.tmp.<pid>.<timestamp>.<rand>`) before performing atomic renames (`fs.renameSync`), eliminating write corruption from server reboots.
  - **Automated Rolling Backups**: Timestamped snapshots in `data/backups/config-<timestamp>.json` and `data/backups/project-<slug>-<timestamp>.json` before destructive save or repair operations, bounded to the latest 15 snapshots.
  - **Non-Destructive Corrupted File Archival**: If JSON fails parsing, the raw file is immediately preserved in `data/config.corrupted-<timestamp>.json` or `data/projects/<slug>/project.corrupted-<timestamp>.json` with zero data loss before initializing safe scaffolding.
  - **Heuristic Syntax Auto-Healing**: Automatic recovery for minor JSON syntax issues (JavaScript comments, trailing commas, unbalanced braces/brackets, and unclosed quotes).
  - **Per-Project Metadata Isolation**: Each release stores its own metadata in `data/projects/<slug>/project.json` alongside artwork and audio, eliminating huge monolithic files.
- **Adaptive High-Contrast Dynamic Favicons**:
  - **Perceived Luminance Detection**: Evaluates non-transparent pixel lightness of the artist logo (`0.299*R + 0.587*G + 0.114*B`).
  - **Contrasting Background Compositing**: Light/white logos receive a dark obsidian background (`#0f0f14`); dark logos receive a crisp white background (`#ffffff`), with 8% inset padding to guarantee high visibility across light and dark browser tabs.
- **Collision-Free System Routes (`/_sys/_admin` & `/_sys/_dev`)**:
  - System tools are namespaced under **`/_sys/_admin`** (Admin Portal) and **`/_sys/_dev`** (Dev Preview Dashboard) using Next.js rewrites.
  - Prevents URL routing collisions with music projects titled "admin" or "dev".
  - Floating warning chips open system pages in a **new browser tab** (`target="_blank"`).
  - Disabled system routes (`adminAccess: false` or `devAccess: false` in `config.json`) automatically redirect users back to the home page (`/`).
- **Zero-Code Content Management (`data/`)**: Operators manage all site metadata, logos, audio files, and album artwork inside a structured `data/` directory without touching code.

---

## 📁 Project Structure

```
artist-discography/
├── plans/                              # Architecture blueprints & implementation status logs
│   ├── README.md                       # Master Plan Index & Progress Log
│   ├── 05-private-access-system-and-project-flags.md
│   ├── 06-media-delivery-reliability-and-dynamic-favicons.md
│   ├── 07-audio-playback-queue-and-player-ui-fixes.md
│   ├── 08-navigation-project-ui-and-onboarding-banners.md
│   ├── 09-rich-discord-and-opengraph-link-previews.md
│   ├── 10-admin-streaming-links-power-tools.md
│   ├── 11-os-media-session-and-hardware-key-integration.md
│   ├── 12-data-resilience-and-graceful-json-recovery.md
│   └── archive/                        # Completed & archived plans (Phases 1 - 4)
├── artist-discography/
│   ├── app/                            # Next.js App Router pages & global theme
│   │   ├── [[...slug]]/page.js         # Single Page App dynamic route & OpenGraph metadata
│   │   ├── api/                        # Next.js Server Route Handlers
│   │   │   ├── admin/                  # Admin APIs (artist, auth, copy-track, logo, media-jobs, project, upload)
│   │   │   ├── audio/[...path]/route.js# Byte-range audio streaming & ETag validator
│   │   │   ├── auth/private-access/    # Private access code authentication API
│   │   │   ├── dev/                    # Dev APIs (openapi, seed-dummy)
│   │   │   ├── logo/route.js           # Dynamic logo optimizer & fallback handler
│   │   │   └── media/[...path]/route.js# Sharp dynamic image resizer & transcoder
│   │   ├── sys/admin/page.js           # Admin Dashboard route (rewritten from /_sys/_admin)
│   │   ├── layout.js                   # Root layout, fonts, & metadata
│   │   └── theme.js                    # Material UI theme & expanded hit target overrides
│   ├── components/                     # Modular React UI components
│   │   ├── admin/                      # Modular Admin Dashboard (auth, common, dialogs, hooks, layout, media, profile, projects, tracks)
│   │   ├── artist/                     # Artist hero banner & social links
│   │   ├── auth/                       # Private access authentication modal & session controls
│   │   ├── common/                     # Shared progressive media & asset loaders
│   │   ├── dev/                        # Audit matrix, API explorer, and health tools integrated into Admin Dashboard
│   │   ├── discography/                # Main app container, catalog grid, & track lists
│   │   ├── layout/                     # Sticky headers, navbar, logos, & background ambience
│   │   ├── player/                     # Audio player bar, queue dialog, fullscreen modal, & modular controls
│   │   └── ui/                         # Shared primitive UI components
│   ├── data/                           # Operator content directory (JSON, audio, covers)
│   │   ├── config.json                 # Global discography configuration & artist profile
│   │   ├── logo.png                    # Optional custom artist logo override
│   │   ├── backups/                    # Timestamped rolling snapshot backups
│   │   ├── cache/                      # Pre-compressed WebP images, favicons, and audio quality tiers
│   │   └── projects/                   # Project folders organized by project slug
│   │       └── <project-slug>/
│   │           ├── project.json        # Individual project metadata and track definitions
│   │           ├── art.jpg             # Project cover artwork
│   │           └── <track-slug>.mp3    # Master audio files
│   ├── lib/                            # Core data & utility functions
│   │   ├── hooks/                      # Custom React hooks (dynamic colors, drag scroll, touch, logo analysis, media session, cast)
│   │   ├── apiSpec.js                  # OpenAPI 3.1 endpoint specification schema
│   │   ├── artistData.js               # Data loading, sanitization, & disk persistence
│   │   ├── audioOptimizer.js           # Audio transcoding, quality tiers, & range validation
│   │   ├── cacheCleaner.js             # Automated unused media cache removal & lifecycle coordinator
│   │   ├── logoUtils.js                # Artist logo inspection, disk persistence, & fallback handler
│   │   ├── mediaOptimizer.js           # Sharp dynamic image resizing & format conversion
│   │   ├── mediaPreloader.js           # Client-side LRU cache media preloader engine
│   │   ├── mediaWarmer.js              # Media pre-caching & site-load fallback readiness coordinator
│   │   ├── metadata.js                 # Dynamic root metadata & favicon generator
│   │   └── slugs.js                    # URL slug generation & matching utilities
│   ├── .prettierrc                     # Prettier formatting configuration
│   ├── eslint.config.mjs               # Flat ESLint configuration
│   ├── next.config.mjs                 # Next.js configuration & route rewrites
│   └── package.json
├── AGENTS.md                           # Development rules & core code standards
├── DEPLOYMENT.md                       # DevOps, Docker, & Cloudflare Tunnel guide
├── LICENSE
└── README.md                           # Root documentation (this file)
```

---

## 🛠️ Operator Content Guide: Managing & Updating Discography Data

All user-managed content belongs strictly in `artist-discography/data/`.

### Directory Layout

```
artist-discography/data/
├── config.json                         # Global artist profile, links, & server settings
├── logo.png (or .jpg, .webp, .svg)     # Optional custom artist logo override
└── projects/                           # Project folders organized by project slug
    ├── <project-slug>/
    │   ├── project.json                # Project-specific metadata, release date, & tracks
    │   ├── art.png (or .jpg, .webp)    # Cover artwork for the project
    │   ├── <track-slug>.flac           # Track audio files (e.g. hydrolock.flac)
    │   ├── <track-slug>.wav
    │   └── <track-slug>.mp3
```

---

### 1. Managing Global Settings (`data/config.json`)

`artist-discography/data/config.json` stores global artist metadata, platform links, social channels, and security settings:

```json
{
  "adminAccess": true,
  "adminPassword": "adminPassword123",
  "devAccess": false,
  "privateAccessCode": "access123",
  "siteUrl": "https://polybitmusic.com",
  "artist": {
    "name": "Lunar Echoes",
    "bio": "Atmospheric electronic and synthwave producer crafting celestial soundscapes.",
    "links": {
      "platforms": {
        "amazon": "https://music.amazon.com/artists/example",
        "apple": "https://music.apple.com/artist/example",
        "bandcamp": "https://example.bandcamp.com",
        "deezer": "https://deezer.com/artist/example",
        "itunes": "",
        "pandora": "https://pandora.com/artist/example",
        "soundcloud": "https://soundcloud.com/example",
        "spotify": "https://open.spotify.com/artist/example",
        "tidal": "https://tidal.com/artist/example",
        "youtube": "https://youtube.com/@example"
      },
      "socials": {
        "discord": "https://discord.gg/example",
        "facebook": "",
        "instagram": "https://instagram.com/example",
        "snapchat": "",
        "tiktok": "",
        "x": "https://x.com/example"
      }
    }
  }
}
```

---

### 2. Managing Projects (`data/projects/<project-slug>/project.json`)

Each release is contained in its own folder under `data/projects/<project-slug>/` alongside its cover artwork and audio files. Projects are automatically discovered and sorted by release date descending (newest first).

```json
{
  "name": "Starlight Odyssey",
  "type": "LP",
  "artist": "Lunar Echoes",
  "date": "2026-05-15",
  "visibility": "public",
  "copyright": "cleared",
  "cover": "art.jpg",
  "tracks": [
    {
      "name": "Midnight Genesis",
      "artist": "Lunar Echoes",
      "links": {
        "amazon": "",
        "apple": "https://music.apple.com/track/genesis",
        "bandcamp": "",
        "deezer": "",
        "itunes": "",
        "pandora": "",
        "soundcloud": "",
        "spotify": "https://open.spotify.com/track/genesis",
        "tidal": "",
        "youtube": "https://youtube.com/watch?v=genesis"
      }
    }
  ]
}
```

#### Project Field Specifications
- **`name`**: Title of the project/album (e.g. `"Starlight Odyssey"`).
- **`type`**: Type classification (e.g. `"LP"`, `"EP"`, `"Single"`, `"Remix"`, `"Feature"`, `"Bootleg"`, `"Flip"`, `"Edit"`).
- **`artist`**: Project artist credit (defaults to main artist if blank).
- **`date`**: Release date in `YYYY-MM-DD` format (formatted and displayed as "May 15, 2026").
- **`visibility`** *(String, default: "public")*:
  - `"public"`: Always visible to all visitors.
  - `"private"`: Completely hidden from public browsing, search, and type filters until the user authenticates with `privateAccessCode`.
- **`copyright`** *(String, default: "cleared")*:
  - `"cleared"`: Full in-site audio playback enabled for all visitors.
  - `"uncleared"`: In-site audio playback is disabled for unauthenticated visitors (audio streams are withheld). Streaming platform links remain visible. Authenticating with `privateAccessCode` unlocks audio playback and shows an `UNLOCKED` status badge.
- **`cover`** *(Optional, default: "art.jpg")*: Cover image filename located inside the project folder.
- **`tracks`**: Array of track objects with `name`, `artist` credit, and platform `links`. Track audio files in the folder matching `<track-slug>.<ext>` are automatically linked and streamed.

---

### Audio Files & Album Art Rules

1. **Audio File Placement**: Place audio files (`.mp3`, `.m4a`, `.wav`, `.ogg`, `.flac`, `.aac`, `.mp4`, or `.webm`) in `data/projects/<project-slug>/<track-slug>.<ext>`.
   - **Play & Queue Buttons**: When audio exists, Play and "+ Queue" buttons automatically render in the track row.
   - **Missing Audio**: If no audio file exists, play buttons are gracefully hidden to prevent unplayable audio errors.

2. **Album Art Placement**: Place image files (`.jpg`, `.jpeg`, `.png`, `.webp`, `.svg`, `.gif`, or `.avif`) in `data/projects/<project-slug>/art.<ext>`.
   - **Missing Covers**: If no cover image exists, a styled vinyl placeholder icon is automatically displayed.

---

## 🚀 Getting Started

### Option 1: Local Development with Bun

1. **Navigate to the application directory**:
   ```bash
   cd artist-discography
   ```

2. **Install dependencies**:
   ```bash
   bun install
   ```

3. **Start the local development server**:
   ```bash
   bun dev
   ```

4. **Open in browser**: Navigate to [http://localhost:3000](http://localhost:3000).

5. **Build for production verification**:
   ```bash
   bun run build
   ```

6. **Linting and code formatting**:
   ```bash
   # Run ESLint validation
   bun run lint

   # Automatically fix ESLint issues
   bun run lint:fix

   # Format all source files with Prettier
   bun run format

   # Verify Prettier code formatting
   bun run format:check
   ```

---

### Option 2: Docker & Docker Compose (Containerized Deployment)

The application includes a multi-stage production Docker setup with built-in `ffmpeg` support for audio transcoding, dynamic `sharp` image optimization, and non-root process security.

> 📖 **Full DevOps & Homelab Guide**: For complete end-to-end setup instructions (including Cloudflare Tunnel, domain configuration, host permissions, and troubleshooting), see [DEPLOYMENT.md](./DEPLOYMENT.md).

#### Running with Docker Compose (Recommended)

From the repository root:
```bash
# Start the container in the background
docker compose up -d

# View live logs
docker compose logs -f

# Stop the container
docker compose down
```

#### Building and Running Manually with Docker

```bash
# Build the production image
docker build -t artist-discography ./artist-discography

# Run the container with persistent data mapping and port 3000
docker run -d \
  --name artist-discography \
  -p 3000:3000 \
  -v "$(pwd)/artist-discography/data:/app/data" \
  artist-discography
```

#### Persistent Data Storage in Docker
The container maps the host `data/` directory to `/app/data`. This ensures that:
- `config.json` and `project.json` configuration updates persist across restarts and rebuilds.
- Uploaded tracks, albums, covers, and logos are safely retained on the host.
- Transcoded audio variations (`data/cache/audio/`) and optimized WebP/AVIF images (`data/cache/images/`) are cached on disk without re-transcoding.

---

## 🛠️ Technology Stack & Standards

- **Framework**: [Next.js](https://nextjs.org/) (App Router v16+ with Turbopack)
- **UI Library**: [Material UI (MUI 9)](https://mui.com/)
- **Date Picking**: [MUI X Date Pickers](https://mui.com/x/react-date-pickers/) & [Dayjs](https://day.js.org/)
- **Styling**: Emotion & HSL design system (`theme.js`)
- **Package Manager & Runtime**: [Bun](https://bun.sh/)
- **Image Pipeline**: [Sharp](https://sharp.pixelplumbing.com/)
- **Code Standards**: Strictly follows [`AGENTS.md`](./AGENTS.md) (MUI 9 `sx`/`slotProps` patterns, no trailing semicolons, defensive data sanitization, zero full-page reloads, Prettier, ESLint).
