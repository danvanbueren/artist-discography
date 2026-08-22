# 🛡️ Data Storage, Modular Architecture & Resilience

This document details the data storage model, file organization, zero-data-loss architecture, and self-healing resilience systems implemented in **Artist Discography**.

---

## 📁 Modular Per-Project Data Isolation

Rather than storing the entire catalog in a single monolithic database or massive JSON file, Artist Discography isolates data modularly on the local filesystem:

```
artist-discography/data/
├── config.json                       # Global artist profile, links, credentials & settings
├── logo.png (or .jpg, .webp, .svg)   # Optional custom branding logo
├── analytics/                        # Privacy-focused local metrics & bandwidth logs
│   ├── daily.json                    # Daily aggregation of streams, visits, and bytes
│   ├── events.json                   # Sliding window of latest 200 activity events
│   └── totals.json                   # Lifetime cumulative counters
├── backups/                          # Timestamped rolling snapshot backups
│   ├── config-2026-05-15T10-30-00.json
│   └── project-hydrolock-2026-05-15T10-30-00.json
├── cache/                            # Generated WebP images and audio tiers
└── projects/                         # Isolated project directories
    ├── starlight-odyssey/
    │   ├── project.json              # Project metadata & tracklist
    │   ├── art.jpg                   # Cover artwork
    │   ├── 01-midnight-genesis.mp3   # Master audio file
    │   └── 02-celestial-drift.mp3
    └── hydrolock/
        ├── project.json
        ├── art.png
        └── hydrolock.flac
```

### Key Architectural Advantages
1. **Zero Monolith Risk**: A syntax error or corruption in one project file never affects other albums or the global artist profile.
2. **Self-Contained Portability**: An entire release (metadata, artwork, masters) is stored in a single folder that can be zipped, moved, or backed up independently.
3. **Dynamic Discovery & Sorting**: The backend discovers project directories dynamically on disk, reading their `project.json` files and sorting them chronologically by release date (`date` field, newest first).

---

## ⚡ Zero-Data-Loss Principle & Atomic Writes

When writing configuration or project updates to disk, power outages, server reboots, or process termination during a standard `fs.writeFileSync` can result in truncated, empty, or corrupted JSON files.

### Atomic Swap Protocol
To guarantee data integrity, all write operations in [`lib/artistData.js`](file:///c:/Users/Dan/App%20Dev/artist-discography/artist-discography/lib/artistData.js) adhere to the **Atomic Swap Protocol**:

```
[ In-Memory Updated State ]
            │
            ▼
[ Step 1: Create Adjacent Temporary Swap File ]
   Path: data/projects/hydrolock/.project.json.tmp.<pid>.<timestamp>.<rand>
            │
            ▼
[ Step 2: Write Serialized JSON & Flush to Physical Disk ]
   `fs.writeFileSync(tmpPath, formattedJson, 'utf-8')`
            │
            ▼
[ Step 3: Atomic Rename Swap ]
   `fs.renameSync(tmpPath, finalPath)`
            │
            ▼
[ Target File Replaced in a Single POSIX Filesystem Inode Operation ]
```

Because `fs.renameSync` is atomic at the filesystem level, the target JSON file is either completely updated or completely untouched—it can never be left in a half-written or corrupted state.

---

## 📦 Automated Rolling Snapshot Backups

Before performing any potentially destructive modification (such as saving new project data, editing tracks, or running recovery routines), the system automatically creates a timestamped snapshot backup:

```
Target File: data/projects/hydrolock/project.json
Backup File: data/backups/project-hydrolock-2026-05-15T12-00-00-000Z.json
```

### Bounded Retention
To prevent uncontrolled disk growth over years of operation:
- The backup manager inspects `data/backups/` after every snapshot.
- Backups are grouped by target entity (`config`, `project-<slug>`).
- Only the **latest 15 snapshots** per target are retained; older snapshots are pruned automatically.

---

## ☣️ Non-Destructive Corrupted File Quarantine

If an operator manually edits a JSON file on disk and introduces unrecoverable syntax errors:

```
[ Error Detected Reading JSON File ]
                  │
                  ▼
[ Step 1: Quarantine Corrupted File Immediately ]
   Copy to: data/projects/<slug>/project.corrupted-2026-05-15T12-00-00Z.json
                  │
                  ▼
[ Step 2: NEVER Overwrite with Blank Defaults ]
   Operator's original work and notes are completely preserved in the quarantine file.
                  │
                  ▼
[ Step 3: Attempt Heuristic Auto-Healing (See Below) ]
   ├── Success ──► Save Repaired File & Log Event
   └── Failure ──► Restore Most Recent Snapshot from data/backups/
```

---

## 🩹 Heuristic JSON Syntax Auto-Healing

When reading JSON files with syntax errors, `lib/artistData.js` passes the unparseable string through an intelligent heuristic repair engine before falling back to backups:

1. **Strips Trailing Commas**: Removes trailing commas before closing `}` or `]` brackets (e.g. `{"name": "test",}`).
2. **Strips JavaScript Comments**: Removes single-line (`// ...`) and multi-line (`/* ... */`) comments.
3. **Balancing Braces & Brackets**: Detects and appends missing closing braces `}` or brackets `]` at end-of-file.
4. **Smart Quote Normalization**: Converts smart/curly quotes (`“`, `”`, `‘`, `’`) into standard ASCII quotes (`"`).

---

## 🛡️ Defensive Data Sanitization & Fallbacks

Following the **Fail Gracefully** standard, `lib/artistData.js` never assumes input objects from disk, network, or API requests are perfectly formed.

- Missing arrays (e.g. `tracks`) default to `[]`.
- Missing objects (e.g. `links.platforms`) default to full schema dictionaries with empty strings.
- Missing dates default to the current date `YYYY-MM-DD`.
- Missing strings default to empty strings rather than `undefined` or `null`.
- Missing visibility/copyright flags default to `"public"` and `"cleared"`.

This ensures that even partially completed or legacy JSON files load smoothly in the frontend without triggering React rendering crashes.

---

## 📊 Privacy-First Analytics Storage & High-Frequency Buffering

The built-in analytics engine (`lib/data/analyticsStorage.js`) records basic streams, page views, and bandwidth usage directly to local JSON files (`data/analytics/`):

1. **Daily Aggregation (`daily.json`)**:
   Tracks daily counts of total streams, page visits, audio bandwidth bytes, media bandwidth bytes, and per-project/per-track breakdowns.
2. **Recent Activity Stream (`events.json`)**:
   Maintains a sliding window of the latest 200 activity events (stream play starts and page visits) with ISO timestamps, paths, project titles, and referrer sources.
3. **Lifetime Totals (`totals.json`)**:
   Preserves cumulative all-time metrics for streams, pageviews, and bandwidth consumption.
4. **Non-Blocking In-Memory Bandwidth Buffering**:
   Because audio and image streaming involve high-frequency chunk requests, transferring bytes does not trigger synchronous disk writes. Byte counts are incremented in an in-memory buffer (`recordBandwidthUsage`) and flushed atomically to disk on a debounced schedule.
5. **Zero-Data-Loss Resets**:
   When an administrator resets analytics from the Admin Dashboard, the existing data is automatically archived into a rolling backup (`data/backups/analytics-daily-<timestamp>.json`) before zeroing active counters.
