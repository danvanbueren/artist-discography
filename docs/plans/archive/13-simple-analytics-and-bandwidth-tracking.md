# Phase 13 — Simple Analytics & Bandwidth Tracking System

## Executive Summary & Objectives

The goal of Phase 13 was to engineer a privacy-focused, zero-database, JSON-backed analytics and bandwidth monitoring system for **Artist Discography**.

Key objectives:
1. **Local Atomic JSON Storage**: Store all metrics locally inside `data/analytics/` across `daily.json`, `events.json`, and `totals.json` with atomic swap writes (`.tmp.<pid>.<timestamp>.<rand>`) and automated rolling backups.
2. **Bandwidth Instrumentation**: Capture actual transferred bytes for audio streaming (`/api/audio/[...path]`) and media/cover delivery (`/api/media/[...path]`) using non-blocking in-memory batching to prevent disk contention.
3. **Client Event Tracking**: Non-blocking client-side tracking hook utilizing `navigator.sendBeacon` and `fetch(..., { keepalive: true })` with debouncing for page views and stream starts.
4. **Admin Dashboard Utilities Tab**: Embed a comprehensive visualization suite with mutually exclusive accordions for **Catalog Analytics & Insights** and the **Raw Configuration & Projects Inspector**.

---

## Technical Architecture

### 1. Data Persistence (`lib/data/analyticsStorage.js`)
- **`daily.json`**: Aggregates daily metrics:
  - `pageViews`: Number of page visits.
  - `streams`: Number of audio playback starts.
  - `audioBandwidthBytes` & `mediaBandwidthBytes`: Transferred byte volumes.
  - `projects`: Per-project stream and bandwidth breakdown.
  - `tracks`: Per-track stream counts.
  - `pages`: Per-route visit counts.
- **`events.json`**: Rolling buffer of the latest 200 activity events.
- **`totals.json`**: Cumulative lifetime counters.
- **`analyticsUtils.js`**: Isomorphic client-safe formatting and math utilities (`formatBytes`, `getTodayDateString`).

### 2. Streaming Bandwidth Capture
- **`app/api/audio/[...path]/route.js`**: Calls `recordBandwidthUsage({ bytes: chunkSize, type: 'audio', projectSlug })`.
- **`app/api/media/[...path]/route.js`**: Calls `recordBandwidthUsage({ bytes: size, type: 'media', projectSlug })`.

### 3. API Endpoints
- **`POST /api/analytics/track`**: Public tracking beacon route.
- **`GET /api/admin/analytics`**: Password-authorized endpoint returning 7-day, 30-day, or all-time summaries.
- **`DELETE /api/admin/analytics`**: Archives existing data to `data/backups/` and resets metrics.

### 4. Admin Interface (`components/admin/tools/analytics/`)
- **`AnalyticsMetricsCards.js`**: 4 stat cards (Total Streams, Total Page Views, Bandwidth Usage, Top Project).
- **`AnalyticsTimelineChart.js`**: SVG interactive timeline chart for activity and bandwidth with hover tooltips.
- **`AnalyticsBreakdownCards.js`**: Project share progress bars, top tracks list, and top pages list.
- **`AnalyticsRecentFeed.js`**: Live activity event feed with badges.
- **`SystemOverviewTab.js`**: Houses Analytics & Insights and Raw JSON Inspector in mutually exclusive accordions.

---

## Verification & Validation

- **Storage Test Suite**: Verified end-to-end event recording, bandwidth incrementing, 30-day summary calculation, and automated backup creation during resets.
- **ESLint & Prettier**: 100% clean formatting and 0 lint warnings.
- **Production Build**: Successfully compiled with Next.js 16 App Router.
