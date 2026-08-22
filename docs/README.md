# 📚 Artist Discography — Documentation Hub

Welcome to the central documentation hub for **Artist Discography**. This directory contains comprehensive technical architecture blueprints, operational guides, API specifications, and historical engineering plans.

---

## 🗺️ Documentation Directory Map

```
docs/
├── README.md                           # Documentation Hub & Sitemap (this file)
├── content-management.md               # Operator Content Guide (managing data/, JSON, audio, art)
├── api-reference.md                    # REST API routes, OpenAPI sandbox, & endpoints
├── design/                             # Full breakdown of system architecture & design philosophy
│   ├── architecture-overview.md        # Next.js 16 SPA hybrid model, routing, & server boundaries
│   ├── audio-engine.md                 # HTML5 Audio lifecycle, byte-range streaming, preloading, casting
│   ├── media-pipeline.md               # Sharp image resizing, FFmpeg transcoding, cache warming/pruning
│   ├── data-storage-and-resilience.md  # Zero-data-loss storage, atomic swap writes, rolling backups
│   ├── security-and-permissions.md     # Private access code, release visibility & copyright flags
│   └── ui-and-theme-system.md          # Obsidian glassmorphism design, MUI 9 standards, interaction hooks
└── plans/                              # Implementation blueprints & engineering roadmap
    ├── README.md                       # Roadmap master index, active plans & guidelines
    └── archive/                        # Completed & verified plans (Phases 1 through 12)
        ├── README.md                   # Archive index table
        └── 01-12-*.md                  # Individual historical phase plans
```

---

## 📑 Quick Navigation by Topic

### 📐 1. Architecture & System Design (`docs/design/`)
Detailed deep-dives into how Artist Discography is designed and engineered:

- **[Architecture Overview](./design/architecture-overview.md)**: Dynamic catch-all SPA routing (`[[...slug]]`), system routes isolation (`/_sys/*`), component boundaries, and request lifecycles.
- **[Audio Playback Engine](./design/audio-engine.md)**: Memory-safe audio element management, multi-tier quality streaming (FLAC, 320k, 128k), drag-and-drop queue reordering, loop/shuffle algorithms, OS MediaSession sync, and Google Cast / Apple AirPlay.
- **[Media Pipeline & Transcoding](./design/media-pipeline.md)**: On-the-fly Sharp image resizing, non-blocking FFmpeg transcoding over SSE, background cache warming, automated cache lifecycle pruner, and dynamic favicons.
- **[Data Storage & Resilience](./design/data-storage-and-resilience.md)**: Modular per-project JSON storage, atomic swap writes (`fs.renameSync`), automated rolling backups, corrupted file quarantine, and heuristic auto-healing.
- **[Security & Access Control](./design/security-and-permissions.md)**: Private access system, release visibility flags (`public`/`private`), copyright audio playback gating (`cleared`/`uncleared`), and defense-in-depth API protection.
- **[UI Architecture & Theme System](./design/ui-and-theme-system.md)**: Obsidian glassmorphism design philosophy, Material UI 9 standards (`sx`/`slotProps`), horizontal drag & wheel scrolling (`useDragScroll`), and touch ergonomics.

---

### 🛠️ 2. Content Management & APIs
- **[Operator Content Management Guide](./content-management.md)**: How to structure `data/config.json`, project folders (`project.json`), artwork dimensions, audio filenames, and using the Web Admin Portal (`/_sys/_admin`).
- **[Backend API Reference](./api-reference.md)**: Complete catalog of REST endpoints for authentication, uploads, project CRUD, audio streaming, Sharp media optimization, and developer sandbox tools.

---

### 📋 3. Plans & Roadmap (`docs/plans/`)
- **[Roadmap & Plans Hub](./plans/README.md)**: Overview of current roadmap status, future feature concepts (synchronized lyrics, multi-disc box sets, visualizer presets), and plan authoring standards.
- **[Archived Implementation Plans](./plans/archive/README.md)**: Preserved blueprints and implementation logs for all completed milestones (Phases 1 through 12).

---

### 🚀 4. Deployment & Developer Standards
- **[Deployment & DevOps Guide](../DEPLOYMENT.md)**: End-to-end guide for self-hosting with Docker Compose, Cloudflare Zero Trust Tunnels, domain setup, permissions, and backups.
- **[Agent Rules & Core Standards](../AGENTS.md)**: Architectural guidelines, Material UI 9 patterns, React hook dependency rules, zero-data-loss standards, and code formatting rules.
