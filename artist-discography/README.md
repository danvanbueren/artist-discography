# Artist Discography App

This directory contains the Next.js application source code, API routes, and content data for **Artist Discography**.

For full project documentation, technology stack, and comprehensive operator content guides, please refer to the main [Root README](../README.md).

## 🗂️ App Architecture & Subdirectories

- **`app/`**: Next.js App Router root layout, dynamic SPA route `[[...slug]]/page.js`, theme configuration (`theme.js`), and server API routes (`app/api/` for `admin` [artist, auth, copy-track, logo, project, upload], `auth` [private-access], `dev` [openapi, seed-dummy], `audio` streaming, dynamic `logo`, and `media` optimization).
- **`components/`**: Modular UI components organized by domain:
  - `components/admin/`: Operator administration dashboard & project manager subcomponents (`auth/`, `common/`, `dialogs/`, `hooks/`, `layout/`, `profile/`, `projects/`, `tracks/`).
  - `components/artist/`: Artist hero header, biography, and social links.
  - `components/auth/`: Private access code authentication dialog and session locking controls.
  - `components/common/`: Responsive progressive image loaders & media utilities.
  - `components/dev/`: Developer preview suite (`apiExplorer/`, `audit/`, `hooks/`, `layout/`, `overview/`, `platforms/`, `raw/`).
  - `components/discography/`: Catalog grid, filter bar, project cards, and track lists.
  - `components/layout/`: Sticky headers, floating navigation bar, ambient dynamic background, and responsive logo.
  - `components/player/`: Continuous audio player bar with progressive buffer indicator, volume persistence, and drag-and-drop queue dialog.
  - `components/ui/`: Shared primitive components.
- **`lib/`**: Business logic, data parsing (`artistData.js`), URL slugs (`slugs.js`), logo utilities (`logoUtils.js`), Sharp image pipeline (`mediaOptimizer.js`), audio transcoding (`audioOptimizer.js`), automated cache cleanup coordinator (`cacheCleaner.js`), media cache warmer coordinator (`mediaWarmer.js`), client LRU preloader (`mediaPreloader.js`), OpenAPI schema (`apiSpec.js`), and custom React hooks (`lib/hooks/`).
- **`data/`**: Operator content directory containing `artist-data.json`, project covers, track audio files, and cached media variants (`data/cache/images/` and `data/cache/audio/`). All media files uploaded via admin are immediately pre-compressed and cached on disk, verified via an automatic fallback check when users load the site, and kept lean by an automated background pruning system that purges unused/orphaned cache files from deleted or replaced projects. Automatic timestamped snapshots are saved to `data/backups/` to guarantee zero data loss.

## 🔐 System Routes

- **Admin Portal**: `/_sys/_admin` (rewritten internally to `/sys/admin`)
- **Developer Preview & OpenAPI**: `/_sys/_dev` (rewritten internally to `/sys/dev`)

## Managing Artist Content (`data/`)

All site content is stored in `artist-discography/data/`:

- `data/artist-data.json` - Discography JSON metadata (artist bio, social links, projects, tracks, streaming URLs).
- `data/logo.png` (or `.jpg`, `.webp`, `.svg`, `.avif`) - *Optional*. Place a custom logo file here or upload, replace, and reset it directly in `/_sys/_admin` (Artist Profile -> Artist Logo) to override the default logo in `public/logo.png`.
- `data/projects/` - Project folders organized by project slug (`data/projects/<project-slug>/`), containing `art.<ext>` for cover artwork and `<track-slug>.<ext>` for track audio.

For full JSON schema instructions and file naming conventions, see the [Operator Content Guide in Root README](../README.md#operator-content-guide-managing--updating-discography-data).

## Quick Start

### Local Development (Bun)
```bash
# Run the development server
bun dev

# Build for production verification
bun run build
```

### Containerized Deployment (Docker)
```bash
# Run from repository root with Docker Compose
docker compose up -d

# Or build the Docker image directly from this folder
docker build -t artist-discography .
docker run -d -p 3000:3000 -v "$(pwd)/data:/app/data" artist-discography
```


