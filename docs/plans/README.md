# 📋 Engineering Roadmap & Implementation Plans Hub

This directory is the central hub for all historical, active, and future architectural implementation plans for **Artist Discography**.

---

## 🗺️ Architectural Roadmap Status

All major foundation and enhancement phases (Phases 1 through 12) have been successfully engineered, verified, and archived:

```
Phase 01: Playback Queue & Autoplay Engine          ──> ✅ [COMPLETED & ARCHIVED]
Phase 02: Repeat, Shuffle, Volume & Hit Targets     ──> ✅ [COMPLETED & ARCHIVED]
Phase 03: Media Caching & Adaptive Streaming        ──> ✅ [COMPLETED & ARCHIVED]
Phase 04: SPA Routing & System Routes               ──> ✅ [COMPLETED & ARCHIVED]
Phase 05: Private Access System & Project Flags     ──> ✅ [COMPLETED & ARCHIVED]
Phase 06: Dynamic Favicons & Media Invalidation     ──> ✅ [COMPLETED & ARCHIVED]
Phase 07: Queue Context & Player UI Evolution       ──> ✅ [COMPLETED & ARCHIVED]
Phase 08: Navigation UX & Floating Banners          ──> ✅ [COMPLETED & ARCHIVED]
Phase 09: Discord & OpenGraph Rich Metadata         ──> ✅ [COMPLETED & ARCHIVED]
Phase 10: Admin Streaming Links Power Tools         ──> ✅ [COMPLETED & ARCHIVED]
Phase 11: OS Media Session & Hardware Keys          ──> ✅ [COMPLETED & ARCHIVED]
Phase 12: Data Resilience & JSON Recovery           ──> ✅ [COMPLETED & ARCHIVED]
Phase 13: Simple Analytics & Bandwidth System       ──> ✅ [COMPLETED & ARCHIVED]
```

👉 **View Full Phase Archive**: See [`archive/README.md`](./archive/README.md) for the complete table of archived phase blueprints and implementation logs.

---

## 💡 Future Roadmap & Feature Concepts

Potential future initiatives under consideration for upcoming phases:

1. **Synchronized Timed Lyrics (.lrc Support)**:
   - Parse standard `.lrc` lyrics files located in `data/projects/<slug>/<track-slug>.lrc`.
   - Display auto-scrolling karaoke-style synchronized lyrics in the mobile fullscreen player and desktop view.

2. **Multi-Disc / Box Set Grouping**:
   - Support disc subdivision schemas (`disc: 1`, `disc: 2`) within `project.json` for double albums and deluxe editions.

3. **Audio Spectrum Visualizer Presets**:
   - Web Audio API canvas visualizer modes (oscilloscope, frequency bars, circular spectrum) integrated into the full-screen modal and Picture-in-Picture feeds.

4. **Public RSS & Podcast Feeds (`/feed.xml`)**:
   - Automated RSS 2.0 XML feed generator enabling fans to subscribe to new music releases in podcast apps and RSS readers.

---

## 📝 Guidelines for Writing New Implementation Plans

When authoring a new implementation plan in `docs/plans/`:

1. **File Naming**: Use zero-padded phase numbering with kebab-case titles:
   `docs/plans/13-feature-name-description.md`
2. **Plan Structure**:
   - **Executive Summary & Problem Statement**: What problem is being solved?
   - **User Review & Breaking Changes**: Document any breaking schema changes or design trade-offs.
   - **Technical Implementation Steps**: Break down changes by file and domain (`lib/`, `components/`, `app/api/`).
   - **Verification & QA Matrix**: Specific automated commands and manual verification test cases.
3. **Archival**:
   - Once all code is written, tests pass, and functionality is verified in production, move the plan to `docs/plans/archive/` and update [`archive/README.md`](./archive/README.md).