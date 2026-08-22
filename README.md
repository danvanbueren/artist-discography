# [Artist Discography](https://github.com/danvanbueren/artist-discography) &middot; [![License](https://img.shields.io/badge/license-GPL--3.0-blue)](https://github.com/danvanbueren/artist-discography/blob/main/LICENSE) [![Repo Size](https://img.shields.io/github/repo-size/danvanbueren/artist-discography?color=blue)](https://github.com/danvanbueren/artist-discography) [![Issues](https://img.shields.io/github/issues/danvanbueren/artist-discography)](https://github.com/danvanbueren/artist-discography/issues) [![Last Commit](https://img.shields.io/github/last-commit/danvanbueren/artist-discography)](https://github.com/danvanbueren/artist-discography/commits/main/)

A high-performance, modern Single Page Application (SPA) designed to showcase an artist's complete music discography—including albums, EPs, singles, collaborations, flips, and remixes—with direct links to listen across all major streaming platforms and built-in audio preview playback.

---

## ✨ Key Highlights

- 🎧 **Continuous Audio Streaming SPA**: Built-in player bar with persistent audio across page navigation, lossless to 128 kbps multi-tier quality streaming, dynamic network probing, manual queue drag-and-drop, shuffle, repeat modes, and Spacebar shortcuts.
- 📱 **OS Media Session & Wireless Casting**: Native lockscreen controls, hardware media keys, synchronized album artwork, and dual-engine wireless streaming via **Google Cast** and **Apple AirPlay**.
- 🔒 **Private Access System & VIP Releases**: Hide unreleased projects or gate uncleared bootleg audio behind a private access code, keeping the public interface sleek and friction-free with zero locked clutter.
- 🛡️ **Zero-Data-Loss Modular Architecture**: Each release is isolated in its own folder under `data/projects/<slug>/` with atomic swap writes, automated rolling backups, corrupted file quarantine, and heuristic auto-repair.
- 🖼️ **Progressive Media Pipelines**: Sharp-powered dynamic image optimization, blur-up progressive images, non-blocking FFmpeg transcoding over SSE, background cache warming, and dynamic adaptive favicons.
- 🎛️ **Unified Admin Dashboard (`/_sys/_admin`)**: Web-based release manager with track uploads, playlist drag-and-drop, link auto-search, OpenAPI 3.1 live explorer, and catalog health audits.
- 🐳 **Docker & Cloudflare Tunnel Ready**: Multi-stage production container with unprivileged user security, persistent host storage, and outbound encrypted Cloudflare Zero Trust tunnel support.

---

## 🚀 Quick Start

### 1. Local Development (with Bun)

```bash
# 1. Clone the repository and navigate to the app folder
cd artist-discography

# 2. Install dependencies
bun install

# 3. Launch the development server
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Containerized Deployment (Docker Compose)

From the repository root:

```bash
# Start the production stack in the background
docker compose up -d

# View live application logs
docker compose logs -f
```

---

## 📚 Documentation & Deep Dives

All technical architecture blueprints, operational guides, and implementation plans are organized in the [`docs/`](./docs/) directory:

| Guide | Description |
| :--- | :--- |
| 📖 **[Documentation Hub](./docs/README.md)** | Central index and sitemap for all documentation. |
| 🛠️ **[Content Management Guide](./docs/content-management.md)** | Complete guide to adding releases, configuring `data/config.json`, audio file specs, and cover artwork. |
| 📐 **[System Architecture Overview](./docs/design/architecture-overview.md)** | Next.js 16 App Router SPA hybrid model, catch-all routing (`[[...slug]]`), and system route isolation. |
| 🎵 **[Audio Playback Engine](./docs/design/audio-engine.md)** | HTML5 audio element lifecycle, byte-range streaming, preloading, queue logic, casting, and OS MediaSession. |
| 🖼️ **[Media Pipeline & Caching](./docs/design/media-pipeline.md)** | Dynamic Sharp image processing, FFmpeg audio transcoding, cache warming, and dynamic favicons. |
| 🛡️ **[Data Storage & Resilience](./docs/design/data-storage-and-resilience.md)** | Zero-data-loss principles, atomic swap writes, rolling backups, and heuristic JSON recovery. |
| 🔒 **[Security & Private Access](./docs/design/security-and-permissions.md)** | Private access passcodes, release visibility flags (`public`/`private`), and defense-in-depth API stream protection. |
| 🎨 **[UI & Theme System](./docs/design/ui-and-theme-system.md)** | Obsidian glassmorphism design, Material UI 9 standards, and horizontal drag scrolling (`useDragScroll`). |
| 🔌 **[Backend API Reference](./docs/api-reference.md)** | Complete REST endpoint catalog and OpenAPI 3.1 live explorer guide. |
| 📋 **[Roadmap & Plans Hub](./docs/plans/README.md)** | Engineering roadmap, future concepts, and archived milestone blueprints (Phases 1–12). |
| 🚀 **[Deployment & DevOps Guide](./DEPLOYMENT.md)** | End-to-end self-hosting guide with Docker, Cloudflare Zero Trust, domain setup, and permissions. |
| 📜 **[Agent Rules & Standards](./AGENTS.md)** | Core code standards, MUI 9 guidelines, React hook rules, and contribution practices. |

---

## 🛠️ Technology Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router with Turbopack)
- **UI & Components**: [Material UI (MUI 9)](https://mui.com/)
- **Date Pickers**: [MUI X Date Pickers](https://mui.com/x/react-date-pickers/) with [Dayjs](https://day.js.org/)
- **Runtime & Package Manager**: [Bun](https://bun.sh/)
- **Image Pipeline**: [Sharp](https://sharp.pixelplumbing.com/)
- **Audio Transcoder**: [FFmpeg](https://ffmpeg.org/)
- **Styling**: Emotion & HSL Obsidian Glassmorphism (`theme.js`)

---

## 📄 License

This project is licensed under the terms of the [LICENSE](./LICENSE) file.
