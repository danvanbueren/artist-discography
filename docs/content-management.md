# 🛠️ Operator Content Management Guide

This guide provides complete instructions for artists, operators, and developers on how to manage, edit, and add releases, tracks, artwork, and branding assets to **Artist Discography**.

---

## 🗂️ Content Storage Directory (`data/`)

All content and configuration files live exclusively inside `artist-discography/data/`:

```
artist-discography/data/
├── config.json                       # Global artist profile, streaming links, social links, and security settings
├── logo.png (or .jpg, .webp, .svg)   # Optional custom branding logo override
├── backups/                          # Automated rolling snapshot backups (managed automatically)
├── cache/                            # Generated WebP images & audio tiers (managed automatically)
└── projects/                         # Project directories organized by URL slug
    ├── starlight-odyssey/
    │   ├── project.json              # Project metadata, release date, flags & tracklist
    │   ├── art.jpg                   # Cover artwork image (1:1 square ratio)
    │   ├── 01-midnight-genesis.mp3   # Master audio file (named <track-slug>.<ext>)
    │   └── 02-celestial-drift.flac
    └── hydrolock/
        ├── project.json
        ├── art.png
        └── hydrolock.flac
```

You can manage discography content using either of two methods:
1. **The Web Admin Portal** (`/_sys/_admin`): Interactive UI for creating releases, uploading tracks, reordering playlists, and editing profiles.
2. **Direct Disk File Management**: Creating and editing JSON files and media directly on the filesystem.

---

## ⚙️ 1. Global Discography Configuration (`data/config.json`)

`data/config.json` stores high-level artist identity, global streaming platforms, social channels, and server authentication settings:

```json
{
  "adminAccess": true,
  "adminPassword": "YourStrongSecretPassphrase",
  "privateAccessCode": "VIP2026",
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

### Global Configuration Fields

| Key | Type | Description |
| :--- | :--- | :--- |
| **`adminAccess`** | Boolean | Controls whether the Admin Portal (`/_sys/_admin`) is accessible. If `false`, system routes redirect to home. |
| **`adminPassword`** | String | Secret password required to log into the Admin Portal. Change this before public deployment. |
| **`privateAccessCode`** | String | Code visitors enter in `Navbar` -> `Settings` to unlock private releases and gated uncleared audio. |
| **`siteUrl`** | String | Canonical base URL used for OpenGraph social link embeds (e.g. `https://polybitmusic.com`). |
| **`artist.name`** | String | The artist or producer name displayed across the hero header, player bar, and metadata. |
| **`artist.bio`** | String | Short artist biography displayed in the hero section. |
| **`artist.links.platforms`** | Object | Direct URLs to the artist's main artist profiles across streaming platforms. |
| **`artist.links.socials`** | Object | URLs to social media profiles and community channels. |

---

## 💿 2. Managing Releases (`data/projects/<slug>/project.json`)

Each album, EP, single, remix, or feature is stored in its own folder under `data/projects/<project-slug>/`. The directory name matches the URL slug of the release.

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
    },
    {
      "name": "Celestial Drift",
      "artist": "Lunar Echoes feat. Solis",
      "links": {
        "spotify": "https://open.spotify.com/track/celestial",
        "soundcloud": "https://soundcloud.com/example/celestial"
      }
    }
  ]
}
```

### Release Metadata Fields

| Field | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| **`name`** | String | Yes | Title of the release (e.g. `"Starlight Odyssey"`). |
| **`type`** | String | Yes | Release classification: `"LP"`, `"EP"`, `"Single"`, `"Remix"`, `"Feature"`, `"Bootleg"`, `"Flip"`, or `"Edit"`. Used for catalog filtering. |
| **`artist`** | String | No | Release artist credit. If left blank, inherits `artist.name` from `config.json`. |
| **`date`** | String | Yes | Release date in `YYYY-MM-DD` format. Releases are sorted newest first. |
| **`visibility`** | String | No | `"public"` (default) or `"private"`. Private releases are hidden from unauthenticated visitors. |
| **`copyright`** | String | No | `"cleared"` (default) or `"uncleared"`. Uncleared releases mask in-site audio playback for unauthenticated users. |
| **`cover`** | String | No | Filename of the cover artwork image inside this folder (default: `"art.jpg"`). |
| **`tracks`** | Array | Yes | Ordered array of track objects. |

---

## 🎵 3. Audio Files & Matching Conventions

1. **File Location**: Place audio files inside the project folder: `data/projects/<project-slug>/<track-slug>.<ext>`.
2. **Supported Formats**: `.flac`, `.wav`, `.mp3`, `.m4a`, `.ogg`, `.aac`, `.webm`.
3. **Naming Convention**: The audio filename must match the URL slug of the track name.
   - Example: Track name `"Midnight Genesis"` → Audio file `01-midnight-genesis.mp3` or `midnight-genesis.flac`.
   - The slug engine handles track number prefixes (e.g. `01-`, `02-`) automatically.
4. **Automatic Button Rendering**:
   - When matching audio exists on disk, Play and `+ Queue` buttons render automatically on the track row.
   - If audio is missing, play buttons are gracefully hidden without error messages.

---

## 🎨 4. Album Artwork & Logo Specifications

### Album Artwork
- **Location**: `data/projects/<project-slug>/art.<ext>` (e.g. `art.jpg`, `art.png`, `art.webp`).
- **Aspect Ratio**: Must be **1:1 square**.
- **Recommended Resolution**: `1000x1000 px` to `2000x2000 px`.
- **Placeholder**: If no image is provided, a styled vinyl placeholder icon is displayed.

### Custom Artist Logo
- **Location**: `data/logo.png` (or `.jpg`, `.webp`, `.svg`, `.avif`).
- **Recommended Format**: Transparent `.png` or `.svg` with minimum width `512px`.
- **Dynamic Luminance**: The system analyzes the logo's pixel lightness and automatically generates high-contrast dynamic favicons for both dark and light browser tabs.

---

## 💻 5. Using the Admin Portal (`/_sys/_admin`)

The Admin Portal provides a graphical interface for managing content without manual file editing:

1. Navigate to `http://localhost:3000/_sys/_admin` (or `https://yourdomain.com/_sys/_admin`).
2. Enter your `adminPassword`.
3. **Tab 1 (Profile & Settings)**: Edit bio, social links, streaming URLs, site URL, and artist logo.
4. **Tab 2 (Projects & Releases)**:
   - Click **+ New Release** to create a project with live drag-and-drop track reordering.
   - Upload cover art and master audio files directly through the browser.
   - Use the **Auto-Search** button (`AutoAwesomeIcon`) on streaming fields to quickly locate track URLs on Spotify/YouTube.
   - Duplicate tracks between releases using the Copy Track tool (`/api/admin/copy-track`).
5. **Tab 3 (Catalog Audit)**: Review audio coverage, missing streaming links, and cover artwork dimensions across all releases.
6. **Tab 4 (API Explorer)**: Test server endpoints with live cURL generation and interactive responses.
7. **Tab 5 (System Health)**: Inspect raw JSON files, view backup logs, and run telemetry checks.
