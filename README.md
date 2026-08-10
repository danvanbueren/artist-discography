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
└── projects/                         # Project folders organized by project slug
    ├── <project-slug>/
    │   ├── art.png (or .jpg, .webp)  # Cover artwork for the project
    │   ├── <track-slug>.wav          # Track audio files (e.g. hydrolock.wav)
    │   └── <track-slug>.mp3
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
- **`name`**: Title of the project/album (e.g. `"Monomyth"`).
- **`type`**: Type classification (e.g. `"LP"`, `"EP"`, `"Single"`, `"Remix"`, `"Feature"`, `"Bootleg"`, `"Flip"`, `"Edit"`).
- **`artist`**: Project artist credit (defaults to main artist if blank).
- **`date`**: Release date in `YYYY-MM-DD` format.
- **`cover`** *(Optional)*:
  - Leave blank (`""`) to auto-detect `data/projects/<project-slug>/art.<jpg|png|webp|svg>`.
  - Specify a relative filename inside the project folder (e.g. `"cover.jpg"`).
  - Or specify an external image URL (e.g. `"https://images.example.com/cover.jpg"`).

##### 3. `tracks` Array (inside each project)
- **`name`**: Title of the track (e.g. `"Hydrolock"`).
- **`artist`**: Track-level artist credit (e.g. `"Lunar Echoes feat. Neon Horizon"`).
- **`audio`** *(Optional)*:
  - Leave blank (`""`) to auto-detect `data/projects/<project-slug>/<track-slug>.<wav|mp3|m4a|ogg>`.
  - Specify a relative filename inside the project folder (e.g. `"track1.wav"`).
  - Or specify an external streaming URL (e.g. `"https://cdn.example.com/song.mp3"`).
- **`links`**: Direct streaming links for this specific track.

---

### Audio Files & Album Art Rules

1. **Audio File Placement**: Place `.wav`, `.mp3`, `.m4a`, or `.ogg` files in `data/projects/<project-slug>/<track-slug>.<ext>`.
   - **Play & Queue Buttons**: When an audio file exists, Play and "+ Queue" buttons automatically appear in the track row.
   - **Missing Audio**: If no audio file exists, Play and "+ Queue" buttons are hidden automatically to prevent unplayable audio errors.

2. **Album Art Placement**: Place `.png`, `.jpg`, `.webp`, or `.svg` images in `data/projects/<project-slug>/art.<ext>`.
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
