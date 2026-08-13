# Artist Discography

A high-performance, modern Single Page Application (SPA) designed to showcase an artist's complete music discography—including albums, EPs, singles, collaborations, flips, and remixes—with direct links to listen across all major streaming platforms and built-in audio preview playback.

---

## 🌟 Key Features

- **Full Catalog Showcase**: Browse an artist's complete discography categorized by albums (`LP`), EPs, singles, remixes, bootlegs, and features.
- **Multi-Platform Streaming Links**: Direct links to listen on all major platforms (Spotify, Apple Music, YouTube, SoundCloud, Bandcamp, Tidal, Deezer, Pandora, Amazon Music, iTunes).
- **Contained Audio Player Bar**: Stream track audio previews directly within the app with play/pause, seek scrubber, volume control, manual queueing, autoplay derivation, shuffle, and repeat modes.
- **Unified Interactive Player Controls**:
  - **Unified Hover & Click Container**: Cover art, song title, and artist name scale and highlight together; clicking anywhere navigates directly to the track page.
  - **Volume Persistence & 10% Floor Guard**: Storage-backed volume settings (`MIN_LISTENABLE_VOLUME = 10%`) ensure unmuting always restores audio to a listenable level.
  - **Elevated Button Z-Index & Expanded Hit Targets**: Mute icon button (`zIndex: 2`) is elevated above the volume slider thumb (`zIndex: 1`), and expanded hit targets (`theme.js`) make icon buttons effortless to click.
  - **Spacebar Play/Pause Shortcut**: Global capture-phase Spacebar listener toggles playback reliably without scroll or button accidental clicks while preserving text input fields.
  - **Loop Modes (`off`, `one`, `all`) & Shuffle**: `Repeat ALL` auto-replenishes autoplay queues for continuous playback; `Shuffle` visually reorganizes the queue list in real time.
- **Manual Queue & Inter-Track Drag-and-Drop**: Reorder queue tracks in `PlaybackQueueDialog` by dragging items directly into inter-track padding gaps with visual insertion indicators. Dedicated play buttons prevent accidental auto-play on row clicks.
- **Virtualized SPA Routing & History**:
  - **Main Discography Page (`/`)**: Row background clicks do not trigger track selection (`onSelectTrackRow={null}`), keeping browsing clean. Song title / artist links open single project pages (`/[project-slug]/[track-slug]`).
  - **Single Project Page (`/[project-slug]`)**: Row clicks highlight tracks and update URL state (`/[project-slug]/[track-slug]`) without reloading the page or stopping audio.
  - **Uninterrupted Audio Playback**: Navigating across pages or using browser Back/Forward arrows (`popstate`) preserves active audio playback seamlessly.
- **Collision-Free System Routes (`/_sys/_admin` & `/_sys/_dev`)**:
  - System tools are namespaced under **`/_sys/_admin`** (Admin Portal) and **`/_sys/_dev`** (Dev Preview Dashboard) using Next.js rewrites.
  - Prevents URL routing collisions with music projects titled "admin" or "dev".
  - Floating warning chips open system pages in a **new browser tab** (`target="_blank"`).
  - Disabled system routes (`adminAccess: false` or `devAccess: false` in `artist-data.json`) automatically redirect users back to the home page (`/`).
- **Zero-Code Content Management (`data/`)**: Operators manage all site metadata, logos, audio files, and album artwork inside a single `data/` directory without touching code.

---

## 📁 Project Structure

```
artist-discography/
├── plans/                              # Architecture blueprints & implementation status logs
│   ├── README.md                       # Master Plan Index & Progress Log
│   ├── 01-playback-queue-and-autoplay.md
│   ├── 02-repeat-and-shuffle-modes.md
│   ├── 03-media-caching-and-adaptive-streaming.md
│   └── 04-spa-routing-and-history-navigation.md
├── artist-discography/
│   ├── app/                            # Next.js App Router pages & global theme
│   │   ├── [[...slug]]/page.js         # Single Page App dynamic route handler
│   │   ├── sys/admin/page.js           # Admin Portal route (rewritten from /_sys/_admin)
│   │   ├── sys/dev/page.js             # Dev Preview Dashboard route (rewritten from /_sys/_dev)
│   │   └── theme.js                    # Material UI theme & expanded hit target overrides
│   ├── components/                     # React components (AudioPlayerBar, TrackRow, etc.)
│   ├── data/                           # Operator content directory (JSON, audio, covers)
│   │   ├── artist-data.json            # Central discography configuration
│   │   ├── logo.png                    # Optional custom artist logo override
│   │   └── projects/                   # Project folders organized by project slug
│   ├── lib/                            # Data loading & slugification helpers
│   ├── next.config.mjs                 # Next.js configuration & route rewrites
│   └── package.json
├── AGENTS.md                           # Development rules & core code standards
├── LICENSE
└── README.md                           # Root documentation (this file)
```

---

## 🛠️ Operator Content Guide: Managing & Updating Discography Data

All user-managed content belongs strictly in `artist-discography/data/`.

### Directory Layout

```
artist-discography/data/
├── artist-data.json                    # Main discography JSON configuration
├── logo.png (or .jpg, .webp, .svg)     # Optional custom artist logo override
└── projects/                           # Project folders organized by project slug
    ├── <project-slug>/
    │   ├── art.png (or .jpg, .webp, .svg, .gif, .avif) # Cover artwork for the project
    │   ├── <track-slug>.flac                           # Track audio files (e.g. hydrolock.flac)
    │   ├── <track-slug>.wav
    │   └── <track-slug>.mp3
```

---

### Managing `artist-data.json`

`artist-discography/data/artist-data.json` is the central source of truth for artist metadata, social links, system flags, projects, and tracks.

#### JSON Configuration Example

```json
{
  "adminAccess": true,
  "devAccess": true,
  "artist": {
    "name": "Lunar Echoes",
    "bio": "Atmospheric electronic and synthwave producer crafting celestial soundscapes.",
    "links": {
      "platforms": {
        "spotify": "https://spotify.com",
        "apple": "https://music.apple.com",
        "bandcamp": "https://bandcamp.com",
        "soundcloud": "https://soundcloud.com",
        "youtube": "https://youtube.com"
      },
      "socials": {
        "instagram": "https://instagram.com/lunarechoes",
        "x": "https://x.com/lunarechoes",
        "discord": "https://discord.gg/lunarechoes"
      }
    }
  },
  "projects": [
    {
      "name": "Starlight Odyssey",
      "type": "LP",
      "artist": "Lunar Echoes",
      "date": "2026-05-15",
      "cover": "",
      "tracks": [
        {
          "name": "Midnight Genesis",
          "artist": "Lunar Echoes",
          "audio": "",
          "links": {
            "spotify": "https://spotify.com/track/genesis",
            "apple": "https://music.apple.com/track/genesis",
            "youtube": "https://youtube.com/watch?v=genesis"
          }
        }
      ]
    }
  ]
}
```

#### Field Specifications

##### 1. System Access Flags
- **`adminAccess`** *(Boolean, default: true)*: Enabled (`true`) by default on initial scaffold to allow operators setup access to the Admin Portal (`/_sys/_admin`). Set to `false` in production to lock access and auto-redirect visitors home (`/`).
- **`devAccess`** *(Boolean, default: false)*: Disabled (`false`) by default on initial scaffold. Set to `true` to enable access to the Dev Preview Dashboard (`/_sys/_dev`).

##### 2. `artist` Object
- **`name`**: The primary artist name.
- **`bio`**: Short artist biography displayed in the hero banner.
- **`links.platforms`**: Main platform URLs (`spotify`, `apple`, `youtube`, `soundcloud`, `bandcamp`, `deezer`, `tidal`, `pandora`, `amazon`, `itunes`).
- **`links.socials`**: Social media URLs (`instagram`, `x`, `discord`, `facebook`, `tiktok`, `snapchat`).

##### 3. `projects` Array
- **`name`**: Title of the project/album (e.g. `"Starlight Odyssey"`).
- **`type`**: Type classification (e.g. `"LP"`, `"EP"`, `"Single"`, `"Remix"`, `"Feature"`, `"Bootleg"`, `"Flip"`, `"Edit"`).
- **`artist`**: Project artist credit (defaults to main artist if blank).
- **`date`**: Release date in `YYYY-MM-DD` format (formatted and displayed as "May 15, 2026").
- **`cover`** *(Optional)*:
  - Leave blank (`""`) to auto-detect `data/projects/<project-slug>/art.<jpg|jpeg|png|webp|svg|gif|avif>`.
  - Or specify a relative filename inside the project folder (e.g. `"cover.jpg"`), or an external image URL.

##### 4. `tracks` Array (inside each project)
- **`name`**: Title of the track (e.g. `"Midnight Genesis"`).
- **`artist`**: Track-level artist credit (e.g. `"Lunar Echoes feat. Neon Horizon"`).
- **`audio`** *(Optional)*:
  - Leave blank (`""`) to auto-detect `data/projects/<project-slug>/<track-slug>.<mp3|m4a|wav|ogg|flac|aac|mp4|webm>`.
  - Or specify a relative filename or external audio URL.
- **`links`**: Direct streaming links for this specific track.

---

### Audio Files & Album Art Rules

1. **Audio File Placement**: Place audio files (`.mp3`, `.m4a`, `.wav`, `.ogg`, `.flac`, `.aac`, `.mp4`, or `.webm`) in `data/projects/<project-slug>/<track-slug>.<ext>`.
   - **Play & Queue Buttons**: When audio exists, Play and "+ Queue" buttons automatically render in the track row.
   - **Missing Audio**: If no audio file exists, play buttons are gracefully hidden to prevent unplayable audio errors.

2. **Album Art Placement**: Place image files (`.jpg`, `.jpeg`, `.png`, `.webp`, `.svg`, `.gif`, or `.avif`) in `data/projects/<project-slug>/art.<ext>`.
   - **Missing Covers**: If no cover image exists, a styled vinyl placeholder icon is automatically displayed.

---

## 🚀 Getting Started

To run the application locally using [Bun](https://bun.sh/):

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

---

## 🛠️ Technology Stack & Standards

- **Framework**: [Next.js](https://nextjs.org/) (App Router v16+ with Turbopack)
- **UI Library**: [Material UI (MUI 9)](https://mui.com/)
- **Styling**: Emotion & HSL design system (`theme.js`)
- **Package Manager & Runtime**: [Bun](https://bun.sh/)
- **Code Standards**: Strictly follows [`AGENTS.md`](./AGENTS.md) (MUI 9 `sx`/`slotProps` patterns, no trailing semicolons, defensive data sanitization, zero full-page reloads).
