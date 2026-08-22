# 🔌 Backend API Reference & Endpoints

This document provides a complete reference for all server-side Next.js route handlers and REST API endpoints in **Artist Discography**.

---

## 🔐 1. Authentication Endpoints

### `POST /api/admin/auth`
Validates the master administrator password and sets an HTTP-only authenticated session cookie.
- **Request Body**:
  ```json
  { "password": "yourAdminPassword" }
  ```
- **Response `200 OK`**:
  ```json
  { "success": true, "message": "Authenticated successfully" }
  ```
- **Response `401 Unauthorized`**:
  ```json
  { "error": "Invalid administrator password" }
  ```

### `POST /api/auth/private-access`
Validates the private access code for VIP visitors to unlock private releases and gated uncleared audio streams.
- **Request Body**:
  ```json
  { "accessCode": "yourAccessCode" }
  ```
- **Response `200 OK`**:
  ```json
  { "success": true, "message": "Access granted" }
  ```

---

## 🛠️ 2. Administration Endpoints (`/api/admin/*`)

All `/api/admin/*` endpoints require an authenticated admin session cookie.

### `GET /api/admin/artist`
Returns global artist profile, streaming links, social links, and server flags from `data/config.json`.

### `PUT /api/admin/artist`
Updates global artist profile and configuration. Uses the Atomic Swap protocol and creates a rolling backup.

### `GET /api/admin/project`
Returns an array of all project metadata objects from `data/projects/`.

### `POST /api/admin/project`
Creates a new release directory under `data/projects/<slug>/` and writes initial `project.json`.

### `PUT /api/admin/project`
Updates an existing release's metadata, release date, flags, or tracklist. Triggers automated backup.

### `DELETE /api/admin/project`
Deletes a project directory and its media files, triggering cache pruning in `cacheCleaner.js`.
- **Query Parameter**: `?slug=<project-slug>`

### `POST /api/admin/upload`
Multipart form upload handler for cover artwork (`art.<ext>`) and track master audio files. Automatically stages files and registers background media transcoding jobs.

### `POST /api/admin/copy-track`
Duplicates a track (metadata, streaming links, and audio file) from a source project to a destination project without re-uploading.
- **Request Body**:
  ```json
  {
    "sourceProject": "starlight-odyssey",
    "sourceTrackIndex": 0,
    "targetProject": "remixes-vol-1"
  }
  ```

### `GET /api/admin/media-jobs`
Server-Sent Events (SSE) stream broadcasting live progress percentages and completion states for background FFmpeg transcoding and Sharp image generation jobs.

### `POST /api/admin/logo`
Uploads, replaces, or resets the custom branding logo (`data/logo.png`), re-analyzing perceived luminance and triggering cache busting.

---

## 🎵 3. Media & Audio Streaming Endpoints

### `GET /api/audio/[...path]`
High-performance byte-range audio streaming endpoint.
- **Route Format**: `/api/audio/<project-slug>/<track-filename>`
- **Optional Query Parameter**: `?tier=lossless|high|compressed`
- **Headers Handled**: `Range`, `If-Range`, `If-None-Match`.
- **Responses**:
  - `206 Partial Content`: Byte-range chunk with `Content-Range` and `Accept-Ranges: bytes`.
  - `304 Not Modified`: When client ETag matches server asset modtime.
  - `403 Forbidden`: When requesting private/uncleared audio without authorization.
  - `OPTIONS` / `HEAD`: HTTP 204 with complete CORS headers for external casting devices.

### `GET /api/media/[...path]`
Dynamic Sharp image optimization endpoint.
- **Route Format**: `/api/media/<project-slug>/<image-filename>`
- **Query Parameters**:
  - `w`: Target width in pixels (e.g. `?w=320`).
  - `q`: Quality (e.g. `?q=85`).
  - `format`: Format override (`webp`, `avif`, `jpeg`, `png`).
  - `v`: Cache-busting timestamp (e.g. `?v=1716000000`).

### `GET /api/logo`
Optimized artist logo streaming endpoint with dynamic width/quality options and cache validation.

### `GET /api/icon`
Dynamic favicon suite endpoint serving luminance-adjusted, high-contrast favicons (`16px`, `32px`, `180px`, `192px`, `512px`).

### `GET /manifest.webmanifest`
Dynamic Progressive Web App (PWA) manifest pointing to luminance-adjusted dynamic favicons.

---

## 🧪 4. Developer & Inspection Endpoints (`/api/dev/*`)

### `GET /api/dev/openapi`
Returns the complete OpenAPI 3.1 schema specification (`lib/apiSpec.js`) describing all system routes.

### `POST /api/dev/seed-dummy`
Generates randomized mock releases, albums, tracks, and platform links for testing UI responsiveness and large discography scaling without modifying production masters.

---

## 🔍 Interactive OpenAPI 3.1 Live Explorer

The Admin Portal includes a live API sandbox (`Tab 4 — OpenAPI 3.1 Live Tester`):
- Browse interactive accordions for every endpoint.
- Generate and copy live `cURL` commands.
- Execute real requests directly from the browser and inspect formatted JSON responses, headers, and status codes in real time.
