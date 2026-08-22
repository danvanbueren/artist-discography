# 📐 System Architecture Overview

This document provides a comprehensive overview of the technical architecture and design philosophy of **Artist Discography**, explaining how the frontend, server runtime, routing engine, and storage layers interact.

---

## 🏛️ High-Level Architectural Model

Artist Discography is engineered as a **hybrid Single Page Application (SPA)** powered by the **Next.js 16 App Router** with Turbopack. It combines the seamless, uninterrupted audio playback of a client-side SPA with the server-side rendering, dynamic metadata generation, and robust API capabilities of Next.js.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                             Client Browser                               │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                     Root Layout & Providers                        │  │
│  │   - ThemeProvider (MUI 9 Dark Glassmorphism Design System)         │  │
│  │   - DragScrollProvider / Audio Context & Persistent Player         │  │
│  │   - Private Access Session State (Client Cookie / LocalStorage)    │  │
│  └─────────────────────────────────┬──────────────────────────────────┘  │
│                                    │                                     │
│            ┌───────────────────────┴───────────────────────┐             │
│            ▼                                               ▼             │
│  ┌───────────────────────────┐           ┌────────────────────────────┐  │
│  │   SPA Discography Views   │           │   Namespaced Admin Portal  │  │
│  │   - Catalog Grid (/)      │           │   - /_sys/_admin           │  │
│  │   - Project Page (/[slug])│           │   - Profile, Projects,     │  │
│  │   - Track Page (/[p]/[t]) │           │     Audit, API, Health     │  │
│  └─────────────┬─────────────┘           └─────────────┬──────────────┘  │
└────────────────┼───────────────────────────────────────┼─────────────────┘
                 │                                       │
                 │ HTTP (Fetch, Range Streaming, SSE)    │
                 ▼                                       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                   Next.js 16 Server Runtime (Node.js)                    │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                       Server Route Handlers                        │  │
│  │  - /api/audio/[...path]   (Byte-range audio streaming & 403 gates) │  │
│  │  - /api/media/[...path]   (Sharp dynamic image resizing & WebP)    │  │
│  │  - /api/logo              (Dynamic logo optimizer & cache buster)  │  │
│  │  - /api/admin/*           (CRUD, upload, copy-track, media-jobs)   │  │
│  │  - /api/auth/*            (Private access code verification)       │  │
│  │  - /api/dev/*             (OpenAPI 3.1 live explorer, seeder)      │  │
│  └─────────────────────────────────┬──────────────────────────────────┘  │
│                                    │                                     │
│  ┌─────────────────────────────────┴──────────────────────────────────┐  │
│  │                       Data & Background Engines                    │  │
│  │  - lib/data/atomicStorage.js (Atomic JSON reads, writes & repair)  │  │
│  │  - lib/data/artistData.js    (Canonical data facade & scan)        │  │
│  │  - lib/media/mediaOptimizer.js (Sharp image transcoding pipeline)  │  │
│  │  - lib/media/audioOptimizer.js (FFmpeg background transcoding)     │  │
│  │  - lib/media/mediaWarmer.js  (Site-load cache pre-warming)         │  │
│  │  - lib/media/cacheCleaner.js (Automated cache lifecycle pruner)    │  │
│  └─────────────────────────────────┬──────────────────────────────────┘  │
└────────────────────────────────────┼─────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                       Host Filesystem (`data/`)                          │
│  ├── config.json               (Artist profile, links & server auth)     │
│  ├── projects/<slug>/          (Per-project metadata, cover art, audio)  │
│  ├── backups/                  (Rolling timestamped JSON snapshots)      │
│  └── cache/                    (Generated WebP images & audio tiers)     │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 🔀 Routing Architecture: The Catch-All SPA Engine

### Dynamic Catch-All Route (`app/[[...slug]]/page.js`)

Traditional multi-page navigation causes full browser reloads, tearing down the DOM and interrupting active audio playback. To deliver a seamless listening experience while retaining deep-linkable URLs and rich social media previews:

1. **Client-Side Virtualized Navigation**:
   The entire public user interface lives inside a single dynamic catch-all route: `app/[[...slug]]/page.js`.
   - `/` resolves to the main catalog grid showcasing all releases (`AllProjectsGridView`).
   - `/[project-slug]` resolves to the detailed project view with tracklist and artwork (`SingleProjectView`).
   - `/[project-slug]/[track-slug]` highlights and focuses a specific track within the project.

2. **Uninterrupted Audio Across Page Transitions**:
   When visitors click a project card, artist header, or track link, the application updates the browser URL via Next.js client routing and `window.history.pushState` without remounting the root layout or restarting the persistent audio player bar.

3. **Server-Side Dynamic OpenGraph & Twitter Metadata**:
   Although the frontend acts as an SPA, `app/[[...slug]]/page.js` exports a server-side `generateMetadata({ params })` function. When Discord, Twitter/X, iMessage, or search engine crawlers fetch any deep link, the server resolves the URL parameters against the local discography data and generates fully-qualified OpenGraph meta tags, titles, descriptions, and high-resolution cover artwork embeds.

---

## 🛡️ Collision-Free System Routing (`/_sys/*`)

To prevent collisions between system administration routes and artist releases titled "admin", "dev", "api", or "sys":

1. **Namespaced Public URIs**:
   All operator and development tools are namespaced behind the `/_sys/` prefix:
   - `/_sys/_admin`: Unified Administration Dashboard & Project Manager.
   - `/_sys/_dev`: Legacy developer preview route (automatically redirects to `/_sys/_admin`).

2. **Next.js Internal Rewrites (`next.config.mjs`)**:
   In `next.config.mjs`, URL rewrites map `/_sys/_admin` to the internal server page `app/sys/admin/page.js`. This keeps URL patterns clean, predictable, and isolated from dynamic catalog slugs.

3. **Collision Detection & Reserved Slugs**:
   The slug generation engine (`lib/data/slugs.js`) explicitly reserves system keywords (`_sys`, `admin`, `dev`, `api`, `sys`, `app`). If an operator titles an album "Admin", the slug generator safely sanitizes the project slug (e.g. `admin-release`) to prevent URL route collisions.

---

## 📦 Modular Component Breakdown

The frontend codebase is strictly chunked into single-responsibility components and custom hooks (<150–200 lines each):

```
components/
├── admin/            # Operator administration portal & project manager
│   ├── auth/         # Admin login view & password challenge
│   ├── common/       # Admin text inputs, date pickers, form controls
│   ├── dialogs/      # Confirmation dialogs (delete project, delete track, copy track)
│   ├── hooks/        # Dedicated hooks (useProjectsManager, useCreateProjectForm, useEditProjectForm, useProjectValidation, useProjectOperations)
│   ├── layout/       # AdminHeader, AdminDashboardTabs, MediaProcessingDrawer
│   ├── media/        # Background media processing drawer & job cards
│   ├── profile/      # ServerSecurityCard, ArtistLogoCard, ArtistBioCard, ArtistSocialsCard
│   ├── project/      # ProjectMetadataFields, ProjectCoverUploader
│   ├── projects/     # ProjectCreateForm, ProjectEditForm, ProjectSidebarList
│   ├── sidebar/      # ProjectSidebarItem rows
│   ├── tabs/         # AdminProjectsTab
│   ├── tools/        # Integrated diagnostic tabs (audit, apiExplorer, overview, raw, platforms)
│   ├── track/        # TrackStreamingPlatformInput, TrackLinksGrid, TrackAudioUploader
│   └── tracks/       # TrackCreateCard, TrackEditCard
├── auth/             # Private access passcode modal and unlock indicator
├── discography/      # Public catalog browsing interface
│   ├── banners/      # OnboardingPlatformBanner, OnboardingThemeBanner
│   ├── header/       # PlatformButtonsRow, ProjectArtLightboxModal
│   ├── hooks/        # useDiscographyRouting, useDiscographyFilterSort, useDiscographyPlayback, useDiscographyKeyboardShortcuts
│   ├── modals/       # PlatformSelectorModal
│   └── views/        # SingleProjectView, AllProjectsGridView, DiscographyHeaderSection
├── layout/           # Responsive layout wrappers
│   ├── header/       # CompactHeaderActions
│   └── navbar/       # NavBarMainToolbar, NavBarSearchBar, NavBarFilterBar, NavBarSortBar, NavBarSettingsBar
└── player/           # Continuous audio player system
    ├── desktop/      # DesktopPlayerLeftInfo, DesktopPlayerTransport, DesktopPlayerRightControls
    ├── fullscreen/   # FullScreenHeader, FullScreenArtwork, FullScreenTrackMeta, FullScreenTransportControls, FullScreenVolumeAndActions, useSwipeToDismiss
    ├── hooks/        # useAudioElementEngine, useAudioVolume
    └── queue/        # QueueTrackRow, QueueSectionList, useQueueDragAndDrop
```

---

## ⚡ Server-Side Business Logic (`lib/`)

The backend and utility layer (`artist-discography/lib/`) coordinates all data storage, caching, media processing, and streaming:

| Utility Module | Primary Responsibility |
| :--- | :--- |
| **[`lib/data/atomicStorage.js`](file:///c:/Users/Dan/App%20Dev/artist-discography/artist-discography/lib/data/atomicStorage.js)** | Core disk persistence engine. Handles atomic temporary swap writes (`fs.renameSync`), rolling backups (`data/backups/`), corrupted file quarantine, and heuristic JSON auto-repair. |
| **[`lib/data/artistConfig.js`](file:///c:/Users/Dan/App%20Dev/artist-discography/artist-discography/lib/data/artistConfig.js)** | Configuration storage coordinator for `data/config.json`. |
| **[`lib/data/projectStorage.js`](file:///c:/Users/Dan/App%20Dev/artist-discography/artist-discography/lib/data/projectStorage.js)** | Project directory scanner and metadata coordinator for `data/projects/<slug>/project.json`. |
| **[`lib/data/artistData.js`](file:///c:/Users/Dan/App%20Dev/artist-discography/artist-discography/lib/data/artistData.js)** | High-level data facade re-exporting canonical data storage APIs. |
| **[`lib/media/audioOptimizer.js`](file:///c:/Users/Dan/App%20Dev/artist-discography/artist-discography/lib/media/audioOptimizer.js)** | Audio streaming engine. Supports HTTP 206 byte-range streaming, ETag generation, and FFmpeg multi-tier transcoding (FLAC, 320k, 192k, 128k). |
| **[`lib/media/ffmpegRunner.js`](file:///c:/Users/Dan/App%20Dev/artist-discography/artist-discography/lib/media/ffmpegRunner.js)** | FFmpeg binary probe and subprocess execution wrapper. |
| **[`lib/media/mediaOptimizer.js`](file:///c:/Users/Dan/App%20Dev/artist-discography/artist-discography/lib/media/mediaOptimizer.js)** | Sharp dynamic image processing. Generates responsive WebP/AVIF images with width, height, and quality parameters, backed by an in-memory LRU cache. |
| **[`lib/media/logoProcessor.js`](file:///c:/Users/Dan/App%20Dev/artist-discography/artist-discography/lib/media/logoProcessor.js)** | Sharp luminance calculations and multi-size favicon suite generation. |
| **[`lib/media/mediaWarmer.js`](file:///c:/Users/Dan/App%20Dev/artist-discography/artist-discography/lib/media/mediaWarmer.js)** | Site-load cache warmer. Scans catalog assets in the background to ensure all media variants are generated and cached without blocking user requests. |
| **[`lib/media/cacheCleaner.js`](file:///c:/Users/Dan/App%20Dev/artist-discography/artist-discography/lib/media/cacheCleaner.js)** | Automated cache lifecycle manager. Identifies and prunes orphaned, superseded, and temporary cache files from `data/cache/`. |
| **[`lib/api/apiSpec.js`](file:///c:/Users/Dan/App%20Dev/artist-discography/artist-discography/lib/api/apiSpec.js)** | OpenAPI 3.0.3 specification generator composing modular endpoint specs (`specs/adminRoutesSpec.js`, `specs/mediaRoutesSpec.js`, `specs/utilityRoutesSpec.js`). |
| **[`lib/api/projectRouteHelpers.js`](file:///c:/Users/Dan/App%20Dev/artist-discography/artist-discography/lib/api/projectRouteHelpers.js)** | Windows-resilient file rename/unlink retry operations and track audio file sync. |
| **[`lib/hooks/useFitTextWidth.js`](file:///c:/Users/Dan/App%20Dev/artist-discography/artist-discography/lib/hooks/useFitTextWidth.js)** | HTML5 Canvas and ResizeObserver text dimension solver for responsive brand titles. |

---

## 🔄 Lifecycle of a Visitor Request

1. **Page Load (`/`)**:
   - Next.js server executes `app/[[...slug]]/page.js`, loading sanitized artist metadata from `lib/data/artistData.js`.
   - HTML with pre-rendered SEO metadata and initial DOM structure is streamed to the browser.
   - Client initializes React context, restores volume and playback settings from `localStorage`, and mounts the ambient background and catalog grid.
   - In the background, `/api/icon` and `/api/logo` serve cached, luminance-optimized branding assets.

2. **Track Playback Triggered**:
   - The user clicks Play on a track row or the main album banner.
   - The audio player bar instantiates/reuses the managed HTML5 Audio element via `useAudioElementEngine`.
   - The player requests `/api/audio/[project-slug]/[track-slug]?tier=...`.
   - The server validates byte ranges, generates ETags, streams the requested chunk (`HTTP 206`), and the client preloader queues the next track in the playlist.

3. **Catalog Navigation (`/[project-slug]`)**:
   - User clicks an album card.
   - Client router transitions to `SingleProjectView` without tearing down the audio player or re-requesting assets.
   - Browser URL updates to `/[project-slug]` and `window.history` records the navigation event.
