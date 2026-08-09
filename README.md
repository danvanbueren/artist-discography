# Artist Discography

A web app designed to showcase an artist's complete music discography, including albums, EPs, singles, and collaborations, with direct links to listen across all published streaming platforms and built-in audio preview playback.

## Key Features

- **Full Discography Showcase**: Browse an artist's complete catalog categorized by albums, EPs, singles, and collaborations.
- **Multi-Platform Streaming Links**: Quick-access links to listen on all major platforms (Spotify, Apple Music, YouTube Music, Tidal, Bandcamp, SoundCloud, Amazon Music, and more).
- **Integrated Audio Player Bar**: Stream track audio previews directly within the web app with play/pause, seek scrubber, volume control, queueing, and shuffle/repeat modes.
- **Dynamic Content Management (`data/`)**: Operators manage all site content (JSON metadata, logo, audio files, and album art) in a single `data/` directory without touching code.
- **Responsive & Modern UI**: Optimized for mobile, tablet, and desktop listening experiences.

## Project Structure

- `artist-discography/` - The Next.js application directory containing components, pages, and static assets.
- `artist-discography/data/` - Site operator directory containing `artist-data.json`, `logo.png`, `audio/`, and `covers/`.
- `AGENTS.md` - Development guidelines and core project standards.
- `.github/` - GitHub repository configurations and funding details.

## Operator Content Guide: Managing & Updating Discography Data

All user-managed content belongs strictly in the `artist-discography/data/` directory.

### Directory Layout

```
artist-discography/data/
├── artist-data.json                  # Main discography JSON configuration
├── logo.png (or .jpg, .webp, .svg)   # Artist logo image
├── audio/                            # Track audio preview files
│   ├── <project-slug>/
│   │   └── <track-slug>.mp3          # e.g. audio/starlight-odyssey/midnight-genesis.mp3
│   └── <track-slug>.mp3              # Flat option: e.g. audio/orbit.mp3
└── covers/                           # Album & project cover artwork
    ├── <project-slug>.jpg            # e.g. covers/starlight-odyssey.jpg
    └── <project-slug>.png
```

---

### How to Update `artist-data.json`

The `data/artist-data.json` file is the central source of truth for all artist info, social links, projects, and tracks.

#### JSON Structure Example

```json
{
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

##### 1. `artist` Object
- **`name`**: The primary artist name.
- **`bio`**: Short artist biography displayed in the hero banner.
- **`links.platforms`**: Main platform URLs (`spotify`, `apple`, `youtube`, `soundcloud`, `bandcamp`, `deezer`, `tidal`, `pandora`, `amazon`, `itunes`).
- **`links.socials`**: Social media URLs (`instagram`, `x`, `discord`, `facebook`, `tiktok`, `snapchat`).

##### 2. `projects` Array
- **`name`**: Title of the project/album (e.g. `"Starlight Odyssey"`).
- **`type`**: Type classification (e.g. `"LP"`, `"EP"`, `"Single"`, `"Remix"`, `"Feature"`, `"Bootleg"`, `"Flip"`, `"Edit"`).
- **`artist`**: Project artist credit (defaults to main artist if blank).
- **`date`**: Release date in `YYYY-MM-DD` format.
- **`cover`** *(Optional)*:
  - Leave blank (`""`) to auto-detect `data/covers/<project-slug>.<jpg|png|webp|svg>` (e.g. `data/covers/starlight-odyssey.jpg`).
  - Specify a relative filename inside `data/` (e.g. `"my-cover.jpg"`).
  - Or specify an external image URL (e.g. `"https://images.example.com/cover.jpg"`).

##### 3. `tracks` Array (inside each project)
- **`name`**: Title of the track (e.g. `"Midnight Genesis"`).
- **`artist`**: Track-level artist credit (e.g. `"Lunar Echoes feat. Neon Horizon"`).
- **`audio`** *(Optional)*:
  - Leave blank (`""`) to auto-detect `data/audio/<project-slug>/<track-slug>.<mp3|m4a|wav|ogg>` (e.g. `data/audio/starlight-odyssey/midnight-genesis.mp3`).
  - Specify a relative filename inside `data/audio/` (e.g. `"track1.mp3"`).
  - Or specify an external streaming URL (e.g. `"https://cdn.example.com/song.mp3"`).
- **`links`**: Direct streaming links for this specific track.

---

### Audio Files & Album Art Rules

1. **Audio File Placement**: Place `.mp3`, `.m4a`, `.wav`, or `.ogg` files in `data/audio/<project-slug>/<track-slug>.mp3`.
   - **Play & Queue Buttons**: When an audio file exists, Play and "+ Queue" buttons automatically appear in the track row.
   - **Missing Audio**: If no audio file exists, Play and "+ Queue" buttons are hidden automatically to prevent unplayable audio errors.

2. **Album Art Placement**: Place `.jpg`, `.png`, `.webp`, or `.svg` images in `data/covers/<project-slug>.jpg`.
   - **Missing Covers**: If no cover image exists, a styled vinyl placeholder icon is automatically displayed.

---

## Getting Started

To run the application locally:

1. Navigate to the application folder:
   ```bash
   cd artist-discography
   ```

2. Install the dependencies:
   ```bash
   bun install
   ```

3. Start the local development server:
   ```bash
   bun run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

## Technology Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **UI Library**: [Material UI](https://mui.com/)
- **Package Manager & Runtime**: [Bun](https://bun.sh/)
