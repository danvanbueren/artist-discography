# Artist Discography App

This directory contains the Next.js application source code and content data for **Artist Discography**.

For full project documentation, technology stack, and user content guide, please refer to the main [Root README](../README.md).

## Managing Artist Content (`data/`)

All site content is stored in `artist-discography/data/`:

- `data/artist-data.json` - Discography JSON metadata (artist bio, social links, projects, tracks, streaming URLs).
- `data/logo.png` - Artist logo image.
- `data/audio/` - Track preview audio files (`data/audio/<project-slug>/<track-slug>.mp3`).
- `data/covers/` - Album cover artwork (`data/covers/<project-slug>.jpg`).

For full JSON schema instructions and file naming conventions, see the [Operator Content Guide in Root README](../README.md#operator-content-guide-managing--updating-discography-data).

## Quick Start

Run the development server from this directory:

```bash
bun dev
```

Or from the repository root:

```bash
cd artist-discography
bun dev
```
