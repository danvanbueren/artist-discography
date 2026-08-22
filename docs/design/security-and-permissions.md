# 🔒 Security, Permissions & Private Access Architecture

This document details the access control systems, permission flags, streaming defense-in-depth, and administrative security architecture of **Artist Discography**.

---

## 🎭 Philosophy: The Friction-Free Public Experience

Many platforms lock content behind intrusive paywalls, warning modals, or prominent padlock icons that disrupt the user experience for general listeners.

### The Friction-Free Standard
- **Clean for Public Visitors**: Unauthenticated visitors never see "locked" banners, warning messages, or padlock icons on the discography. The site appears as a polished, complete artist discography.
- **Subtle VIP Indicators**: When an authorized user (such as a Patreon supporter, collaborator, or industry contact) enters the private access code, releases simply appear in their rightful chronological position, and gated tracks display subtle `UNLOCKED` badges.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Unauthenticated Visitor                         │
├────────────────────────────────────────────────────────────────────────┤
│  • Public Releases: Full browsing, artwork, links, and audio stream.   │
│  • Uncleared Releases: Displays metadata & streaming platform links;   │
│    in-site audio playback is gracefully masked without error banners. │
│  • Private Releases: Completely hidden from catalog, search & filters. │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│                        Authenticated VIP User                          │
├────────────────────────────────────────────────────────────────────────┤
│  • All Public Releases: Full playback and browsing.                    │
│  • All Uncleared Releases: Audio streams unlocked with UNLOCKED badge. │
│  • All Private Releases: Fully revealed in catalog, search, & player.  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🏷️ Release Permission Flags

Each project's `project.json` defines two independent access flags:

```json
{
  "name": "Unreleased Bootleg EP",
  "visibility": "private",
  "copyright": "uncleared"
}
```

### 1. `visibility` (`"public"` | `"private"`)
- **`"public"`** *(default)*: The release is visible to everyone in the catalog grid, project deep links, type filters, and search.
- **`"private"`**: The release is completely omitted from frontend catalog arrays, search indexes, and type filters for unauthenticated visitors. Attempting to navigate directly to `/[project-slug]` returns a graceful 404. When authenticated, the project appears normally.

### 2. `copyright` (`"cleared"` | `"uncleared"`)
- **`"cleared"`** *(default)*: Full audio streaming is enabled for all visitors across the site.
- **`"uncleared"`**: Intended for unofficial remixes, DJ flips, sample-heavy bootlegs, or unreleased demos.
  - Public visitors can see track titles, credits, artwork, and links to external platforms (SoundCloud, YouTube, Bandcamp).
  - In-site audio stream URLs and play buttons are withheld from unauthenticated clients.
  - Authenticated visitors can play and queue the audio seamlessly.

---

## 🛡️ Defense-in-Depth: API Route Streaming Gating

Client-side hiding is never sufficient for true access control. The streaming endpoint `/api/audio/[...path]` enforces rigorous server-side authorization:

```
[ Incoming Audio Request: GET /api/audio/unreleased-demo/track-1.mp3 ]
                                │
                                ▼
         [ 1. Server Loads Project Metadata & Resolves Flags ]
                                │
                                ▼
         [ 2. Is Release Public & Cleared? ]
          ├── YES ──► Proceed to Range Streaming (HTTP 200/206)
          └── NO (Private or Uncleared)
                                │
                                ▼
         [ 3. Validate Session Cookie or Signed Query Token ]
          ├── Authenticated ──► Proceed to Range Streaming
          └── Unauthenticated
                                │
                                ▼
         [ 4. Return HTTP 403 Forbidden ]
          {"error": "Unauthorized: Audio stream requires private access authorization."}
```

Even if a user inspects network traffic or guesses the file path, direct requests to `/api/audio/` for gated tracks are rejected at the server level.

---

## 📺 External Cast Receiver Authentication

When casting audio to Google Cast devices (Chromecast, Google Home, Nest Audio) or smart TVs, the receiver device runs a separate browser instance that **does not share the user's browser session cookies**.

To enable seamless casting of authorized private tracks:
1. When an authenticated user triggers Cast playback, the client generates a short-lived, cryptographically signed token.
2. The stream URL passed to the Cast receiver includes this query token:
   `/api/audio/unreleased-demo/track-1.mp3?auth_token=...`
3. The server endpoint validates the query token and allows the remote speaker to stream the authorized track without interruption.

---

## 🔐 Admin Dashboard Security (`/_sys/_admin`)

The administration portal provides complete control over catalog metadata, server configurations, file uploads, and system diagnostics.

### Security Layers
1. **Namespaced Route**: Located at `/_sys/_admin` (rewritten internally to `/sys/admin`), isolated from public discography routes.
2. **Master Admin Password**: Configured in `data/config.json` (`adminPassword`).
3. **Session Cookie**: Successful authentication issues an encrypted HTTP-only session cookie.
4. **Master Access Switch (`adminAccess`)**: If `adminAccess: false` is set in `config.json`, the entire admin route is immediately disabled, redirecting all requests to `/`.
5. **Cloudflare Zero Trust Protection (Recommended for Production)**:
   For internet-exposed deployments, administrators can add a Cloudflare Access policy requiring a one-time email PIN before any request reaches the server (see [DEPLOYMENT.md](file:///c:/Users/Dan/App%20Dev/artist-discography/DEPLOYMENT.md)).
