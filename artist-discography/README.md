# Artist Discography App

This directory contains the Next.js application source code, API routes, and content data for **Artist Discography**.

For full project documentation, technology stack, and comprehensive operator content guides, please refer to the main [Root README](../README.md).

## 🗂️ App Architecture & Subdirectories

- **`app/`**: Next.js App Router root layout, dynamic SPA route `[[...slug]]/page.js`, theme configuration (`theme.js`), and server API routes:
  - `app/api/admin/`: CRUD routes for `analytics`, `artist`, `auth`, `copy-track`, `logo`, `media-jobs`, `project`, and `upload`.
  - `app/api/analytics/`: Public lightweight beacon/fetch event tracker (`track`).
  - `app/api/auth/`: Private gated access verification (`private-access`).
  - `app/api/dev/`: Developer utilities (`openapi`).
  - `app/api/audio/`: HTTP 206 partial content audio streaming endpoint with automated bandwidth tracking.
  - `app/api/media/`: Responsive image and cover artwork server endpoint with bandwidth tracking.
  - `app/api/logo` & `app/api/icon`: Dynamic logo asset and favicon suite streaming endpoints.
  - `app/favicon.ico` & `app/apple-touch-icon.png`: Dynamic root favicon and mobile touch icon route handlers.
- **`components/`**: Modular, single-responsibility UI components organized by domain:
  - `components/admin/`: Operator administration dashboard & project manager:
    - `auth/`: Admin login view & password challenge.
    - `common/`: Standardized text inputs, date pickers, and form controls.
    - `dialogs/`: Delete project, delete track, and cross-project track copy dialogs.
    - `hooks/`: Domain hooks (`useAdminAuth`, `useAdminRouting`, `useAutoSave`, `useArtistProfile`, `useProjectsManager`, `useCreateProjectForm`, `useEditProjectForm`, `useProjectValidation`, `useProjectOperations`, `useMediaJobs`).
    - `layout/`: Admin header, navigation tabs, notifications, and media drawer.
    - `media/`: Background media processing drawer and active job cards.
    - `profile/`: Server security credentials, branding logo, biography, and social links cards.
    - `project/`: Shared project metadata fields and cover artwork uploader.
    - `projects/`: Project create form, project edit form, and sidebar project list.
    - `sidebar/`: Project sidebar item rows.
    - `tabs/`: Projects management tab container.
    - `tools/`: Diagnostic, analytics, and developer tools (`analytics/`, `audit/`, `apiExplorer/`, `overview/`, `raw/`, `platforms/`, `hooks/`).
    - `track/`: Audio file drag-drop uploader, streaming links accordion, and platform input rows.
    - `tracks/`: Individual track creation and track editing cards.
  - `components/auth/`: Private access passcode modal and unlock indicator.
  - `components/discography/`: Public discography catalog interface:
    - `banners/`: Platform and theme onboarding floating banners.
    - `header/`: Streaming platform buttons row and album artwork lightbox modal.
    - `hooks/`: Custom state hooks (`useDiscographyRouting`, `useDiscographyFilterSort`, `useDiscographyPlayback`, `useDiscographyKeyboardShortcuts`).
    - `modals/`: Streaming platform selector modal.
    - `views/`: Dedicated views (`SingleProjectView`, `AllProjectsGridView`, `DiscographyHeaderSection`).
  - `components/layout/`: Responsive branding and layout wrappers:
    - `header/`: Compact artist header action pill bar (`CompactHeaderActions`).
    - `navbar/`: Floating navigation toolbars (`NavBarMainToolbar`, `NavBarSearchBar`, `NavBarFilterBar`, `NavBarSortBar`, `NavBarSettingsBar`).
    - `AmbientBackground`: Full-viewport responsive background lighting.
    - `CompactArtistHeader`: Single project view branding header.
    - `FloatingNavBar`: Filter, search, and preferences floating navigation bar.
  - `components/player/`: Continuous audio player system:
    - `desktop/`: Desktop player left info, center transport controls, and right action buttons.
    - `fullscreen/`: Fullscreen mobile modal header, artwork hero, track meta, transport controls, and swipe-to-dismiss gesture hook.
    - `hooks/`: Audio playback engine (`useAudioElementEngine`) and volume state (`useAudioVolume`).
    - `queue/`: Touch drag-drop gestures hook, individual track rows, and section lists.
  - `components/ui/`: Shared primitives (`ProgressiveImage`, `SubduedText`).
- **`lib/`**: Business logic, algorithms, and domain-grouped utilities:
  - `lib/data/`: Data storage and persistence (`analyticsStorage.js`, `atomicStorage.js`, `artistConfig.js`, `projectStorage.js`, `artistData.js`, `slugs.js`, `cookies.js`, `dateUtils.js`, `urlNormalization.js`).
  - `lib/media/`: Image/audio processing and caching (`ffmpegRunner.js`, `audioOptimizer.js`, `logoConstants.js`, `logoProcessor.js`, `logoUtils.js`, `mediaOptimizer.js`, `mediaWarmer.js`, `cacheCleaner.js`, `mediaPreloader.js`, `metadata.js`).
  - `lib/api/`: API routing specifications and SSE background job tracker (`apiSpec.js`, `projectRouteHelpers.js`, `jobTracker.js`, `specs/adminRoutesSpec.js`, `specs/mediaRoutesSpec.js`, `specs/utilityRoutesSpec.js`).
  - `lib/network/`: Dynamic network tier detection and audio quality probing (`networkProbe.js`).
  - `lib/hooks/`: Reusable React interaction hooks (`useAnalyticsTracker.js`, `usePictureInPicture.js`, `useRemotePlayback.js`, `useMediaCastAndPip.js`, `useFitTextWidth.js`, `useDragScroll.js`, `useDynamicThemeGradients.js`, `useLogoAnalysis.js`, `useMediaSession.js`, `useTouchDevice.js`).
- **`data/`**: Operator content directory containing `config.json`, `analytics/` (`daily.json`, `events.json`, `totals.json`), project folders with `project.json` metadata, project covers, track audio files, and cached media variants (`data/cache/images/`, `data/cache/audio/`, `data/cache/favicons/`). All media files uploaded via admin are immediately pre-compressed and cached on disk, verified via an automatic fallback check when users load the site, and kept lean by an automated background pruning system that purges unused/orphaned cache files from deleted or replaced projects. Automatic timestamped snapshots are saved to `data/backups/` to guarantee zero data loss.

## 🔐 System Routes

- **Admin Dashboard**: `/_sys/_admin` (rewritten internally to `/sys/admin`). Consolidates artist profile settings, server security, project management, catalog & media audit, OpenAPI interactive explorer, and system health & seeder tools into a unified password-protected dashboard. Legacy `/_sys/_dev` requests are automatically redirected here.
  - `/_sys/_admin/settings` - Artist profile, site URL, branding logo, and server credentials.
  - `/_sys/_admin/projects/<project-slug>` - Direct deep-link to edit a specific catalog release.
  - `/_sys/_admin/projects?action=new` - Direct deep-link to the new project creation draft form.
  - `/_sys/_admin/audit` - Catalog health overview, audio streaming status, and artwork resolution checks.
  - `/_sys/_admin/utilities` - Telemetry analytics, traffic metrics, and raw JSON configuration inspector.
  - `/_sys/_admin/api` - Interactive OpenAPI Explorer and API endpoint documentation.

## Managing Artist Content (`data/`)

All site content is stored in `artist-discography/data/`:

- `data/config.json` - Global discography JSON configuration (artist bio, streaming platforms, social links, access credentials, site URL).
- `data/logo.png` (or `.jpg`, `.webp`, `.svg`, `.avif`) - _Optional_. Place a custom logo file here or upload, replace, and reset it directly in `/_sys/_admin` (Profile & Settings -> Artist Logo) to override the default logo in `public/logo.png`.
- `data/projects/` - Project folders organized by project slug (`data/projects/<project-slug>/`), containing `project.json` for release metadata, `art.<ext>` for cover artwork, and `<track-slug>.<ext>` for track audio. All projects are discovered automatically and sorted chronologically by release date.

For full JSON schema instructions and file naming conventions, see the [Operator Content Management Guide](../docs/content-management.md) and the [Documentation Hub](../docs/README.md).

## Quick Start

### Local Development (Bun)

```bash
# Run the development server
bun dev

# Build for production verification
bun run build

# Lint source files with ESLint
bun run lint

# Format code with Prettier
bun run format
```

### Containerized Deployment (Docker)

```bash
# Run from repository root with Docker Compose
docker compose up -d

# Or build the Docker image directly from this folder
docker build -t artist-discography .
docker run -d -p 3000:3000 -v "$(pwd)/data:/app/data" artist-discography
```
