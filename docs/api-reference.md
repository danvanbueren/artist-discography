# 🔌 Backend API Reference & Endpoints

This document provides a complete reference for all server-side Next.js route handlers and REST API endpoints in **Artist Discography**.

---

## 🔐 1. Authentication & Private Access Endpoints (`/api/auth/*` & `/api/admin/auth`)

### `POST /api/admin/auth`
Validates the master administrator password.
- **Request Body**:
  ```json
  { "password": "admin" }
  ```
- **Response `200 OK`**: `{ "authenticated": true }`
- **Response `401 Unauthorized`**: `{ "authenticated": false, "error": "Incorrect password" }`

### `GET /api/auth/private-access`
Checks if the client session has active private gated access clearance.
- **Response `200 OK`**: `{ "success": true, "authenticated": true }`

### `POST /api/auth/private-access`
Validates the private access code and sets a 30-day authenticated cookie (`private_access_auth`).
- **Request Body**:
  ```json
  { "accessCode": "access123" }
  ```
- **Response `200 OK`**: `{ "success": true, "authenticated": true, "message": "Private access unlocked successfully!" }`

### `DELETE /api/auth/private-access`
Clears the private access authorization cookie, relocking private catalog releases.
- **Response `200 OK`**: `{ "success": true, "authenticated": false, "message": "Private access locked successfully" }`

---

## 🛠️ 2. Administration Endpoints (`/api/admin/*`)

Privileged data mutation endpoints require the `x-admin-password` HTTP header or `password` in the request body/form-data.

### `POST /api/admin/artist`
Updates artist metadata, platform/social streaming links, site URL, gated access code, and security settings in `data/config.json`.
- **Request Body (JSON)**:
  ```json
  {
    "password": "admin",
    "name": "Artist",
    "bio": "Composer and sound designer.",
    "siteUrl": "http://localhost:3000",
    "privateAccessCode": "access123",
    "adminAccess": true,
    "adminPassword": "admin",
    "platforms": { "spotify": "https://open.spotify.com/...", "apple": "..." },
    "socials": { "instagram": "https://instagram.com/...", "x": "..." }
  }
  ```

### `GET /api/admin/logo`
Returns metadata and status for the active branding logo (dimensions, format, custom vs default).

### `POST /api/admin/logo`
Uploads and optimizes a custom artist branding logo or vector SVG, automatically generating dynamic favicon and web manifest icon suites.
- **Request Format**: `multipart/form-data`
- **Fields**: `password` (required), `action` ("upload" or "delete"), `logoFile` (binary image).

### `DELETE /api/admin/logo`
Removes the custom branding logo and purges cached assets, reverting to the default placeholder logo.

### `POST /api/admin/upload`
Creates a new release directory under `data/projects/<slug>/`, writing initial `project.json` and staging cover artwork and audio files.
- **Request Format**: `multipart/form-data`
- **Fields**: `password`, `name`, `type`, `artist`, `date`, `visibility`, `copyright`, `tracks`, `coverFile`.

### `POST /api/admin/project`
Performs in-place updates, metadata synchronization, or atomic removal for a release in `data/projects/<slug>/project.json`.
- **Request Format**: `multipart/form-data`
- **Fields**: `password`, `action` ("update" or "delete"), `projectIndex`, `name`, `type`, `artist`, `date`, `visibility`, `copyright`, `tracks`, `coverFile`.

### `POST /api/admin/copy-track`
Duplicates a track (metadata, streaming links, audio master, and artwork) from a source project to a destination project.
- **Request Body (JSON)**:
  ```json
  {
    "password": "admin",
    "sourceProjectIndex": 0,
    "sourceTrackIndex": 0,
    "targetProjectIndex": 1
  }
  ```

### `GET /api/admin/media-jobs`
Returns the list of active and completed background audio/image transcoding tasks.
- **Query Parameter**: `?stream=1` (for live Server-Sent Events stream).

### `POST /api/admin/media-jobs`
Triggers full catalog pre-transcoding and media warming (`action: "warm-all"`) or clears finished jobs (`action: "clear-completed"`).

### `GET /api/admin/analytics`
Fetches aggregated analytics, timeline distributions, project/track rankings, and recent activity log from `data/analytics/`.
- **Query Parameters**: `range` (`7d`, `30d`, or `all`, default: `30d`).
- **Headers**: `x-admin-password` (or `?password=...`).
- **Response `200 OK`**:
  ```json
  {
    "summary": {
      "totalStreams": 142,
      "totalPageViews": 380,
      "totalBandwidthBytes": 52428800,
      "totalBandwidthFormatted": "50.0 MB",
      "audioBandwidthBytes": 47185920,
      "audioBandwidthFormatted": "45.0 MB",
      "mediaBandwidthBytes": 5242880,
      "mediaBandwidthFormatted": "5.0 MB",
      "topProjectName": "Starlight Odyssey",
      "topProjectStreams": 89
    },
    "timeline": [...],
    "projectBreakdown": [...],
    "trackBreakdown": [...],
    "pageBreakdown": [...],
    "recentEvents": [...]
  }
  ```

### `DELETE /api/admin/analytics`
Archives existing analytics data into a timestamped snapshot under `data/backups/` and resets all metrics counters.
- **Headers**: `x-admin-password` (or `?password=...`).
- **Response `200 OK`**: `{ "success": true, "message": "Analytics data reset and archived successfully" }`

---

## 🎵 3. Media & Audio Streaming Endpoints

### `GET /api/audio/[...path]`
High-performance byte-range audio streaming endpoint with automatic transferred bandwidth tracking.
- **Route Format**: `/api/audio/projects/<project-slug>/<track-filename>`
- **Query Parameters**:
  - `b`: Bitrate tier (`320k`, `192k`, `128k`).
  - `t`: Cache-busting timestamp.
  - `token`: Private access token for casting.
- **Headers Handled**: `Range`, `If-Range`, `If-None-Match`.
- **Responses**: `200 OK`, `206 Partial Content`, `403 Forbidden`, `404 Not Found`.

### `GET /api/media/[...path]`
Dynamic Sharp image optimization endpoint with WebP/AVIF transcoding, immutable caching, and bandwidth tracking.
- **Route Format**: `/api/media/projects/<project-slug>/<image-filename>`
- **Query Parameters**: `w` (width), `q` (quality), `fmt` (format), `blur` (blur radius).

### `GET /api/logo`
Optimized artist logo streaming endpoint with dynamic width/format conversion.

### `GET /api/icon`
Dynamic favicon suite endpoint serving luminance-adjusted, high-contrast favicons (`16px`, `32px`, `48px`, `192px`, `512px`).

---

## 📊 4. Public Analytics Tracking Endpoints (`/api/analytics/*`)

### `POST /api/analytics/track`
Lightweight public endpoint accepting beacon and JSON payloads for recording client page views and audio stream events with atomic persistence.
- **Request Body (JSON / Beacon)**:
  ```json
  {
    "type": "stream",
    "project": "Starlight Odyssey",
    "projectSlug": "starlight-odyssey",
    "track": "Midnight Genesis",
    "path": "/starlight-odyssey/midnight-genesis"
  }
  ```
- **Response `200 OK`**: `{ "success": true }`

---

## 🧪 5. Developer & Inspection Endpoints (`/api/dev/*`)

### `GET /api/dev/openapi`
Returns the complete, real-time OpenAPI 3.1 schema specification (`lib/api/apiSpec.js`) describing all system routes.

---

## 🔍 Interactive OpenAPI 3.1 Live Explorer

The Admin Portal includes a live API sandbox (`Tab 4 — OpenAPI 3.1 Live Tester`):
- Browse interactive accordions for all routes across Admin, Auth, Media, and Dev Utilities.
- Auto-populated required fields with live validation.
- Generate and copy live `cURL` commands.
- Execute real requests directly from the browser and inspect formatted JSON responses, headers, and status codes in real time.
