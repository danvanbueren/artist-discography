# 🗄️ Phase 14 Architecture Plan: Admin Dashboard Reliability & CRUD Refinements

**Status**: ✅ **COMPLETED & ARCHIVED**  
**Completed Date**: August 2026  
**Focus Area**: Admin Dashboard Reliability, Media Pipeline Synchronization & CRUD Integrity

---

## 📋 Executive Summary

Phase 14 resolved a series of interrelated issues across the **Admin Dashboard**, backend media processing engine, file storage operations, form hooks, and routing logic. These refinements ensure zero data loss during project editing, responsive real-time feedback during media uploads, type-safe operations across all form inputs, and smooth navigation across desktop and mobile devices.

---

## 📂 Categorized Situation & Resolution Log

### Category 1: Track Management & Field Inheritance

#### 1. Track-Level Artist Override & Deletion Edge Cases
- **Situation**:
  - The track-level *Artist (Optional Override)* field displayed the global artist name from Settings instead of falling back to the project-level artist if customized.
  - When users cleared text out of the track artist input, deleting the entire string previously triggered unhandled errors or left invalid states in form memory.
- **Resolution**:
  - Implemented the fallback chain in [`TrackEditCard.js`](../../components/admin/tracks/TrackEditCard.js) and [`TrackCreateCard.js`](../../components/admin/tracks/TrackCreateCard.js): `editArtist?.trim() || artistNameInput?.trim() || defaultArtistName`.
  - The placeholder text renders the project artist (or settings artist) in light gray when the override is empty.
  - Sanitized track artist updates with `(t.artist || '').trim()`, allowing full deletion to cleanly pass `""` and restore project inheritance without error.

#### 2. Track Copying System Across Projects
- **Situation**:
  - The Copy Track modal failed to perform copy operations, did not allow destination selection changes, displayed `"Untitled Track"` in dialog headers, and remained stuck on screen after clicking *Copy Track*.
- **Resolution**:
  - Unified mismatched prop conventions across [`CopyTrackDialog.js`](../../components/admin/dialogs/CopyTrackDialog.js), [`AdminDashboard.js`](../../components/admin/AdminDashboard.js), and [`useProjectsManager.js`](../../components/admin/hooks/useProjectsManager.js).
  - Preselected the current project by default in the Destination Project dropdown with a `(Current Project)` label.
  - Wired `handleCopyTrack` to update destination project state, refresh the local track list when copying to the current project, close the modal, and dispatch floating confirmation toasts.

#### 3. Track Reordering Type Safety (`k.startsWith is not a function`)
- **Situation**:
  - Moving tracks up or down threw a runtime `TypeError: k.startsWith is not a function` inside `useAutoSave.js` because an array was passed into `markFieldDirty` instead of a string field key.
- **Resolution**:
  - Corrected callback signatures in [`ProjectEditForm.js`](../../components/admin/projects/ProjectEditForm.js) to pass explicit string key `'edit_tracks_order'`.
  - Added defensive `typeof k === 'string'` guards across `useAutoSave.js` and stringified all snapshot keys to prevent non-string dirty field entries from causing exceptions.

---

### Category 2: Media Pipeline, Staging & Queue Feedback

#### 4. Audio Upload Staged State & Media Warming Queue Feedback
- **Situation**:
  - Uploading a new audio file saved to disk and updated discography data, but the card remained stuck on the green `"Staged for Upload: <filename>"` status with `"File will be uploaded and transcoded on save"`.
  - The Media Processing Center displayed 0 active jobs and no history because `/api/admin/project` was invoked with a raw string slug rather than a file list with target maps.
- **Resolution**:
  - Updated `syncProjectTrackFiles` in [`projectRouteHelpers.js`](../../lib/api/projectRouteHelpers.js) to collect and return `newlyUploadedFiles` with target/details metadata.
  - Wired `/api/admin/project` to pass `filesToWarm` and `{ targetMap, detailsMap }` to `warmMediaFiles()`, broadcasting real-time progress to `jobTracker` and SSE listeners.
  - Configured [`useEditProjectForm.js`](../../components/admin/hooks/useEditProjectForm.js) to reset `track.audioFile` on save success and populate saved track URLs, immediately flipping the UI to blue `"Audio Attached: <filename>"`.

#### 5. Project Artwork Deletion & Windows File Lock Release
- **Situation**:
  - Clicking delete on project art reported success, but the artwork file was not removed from the filesystem and re-appeared upon page refresh.
- **Resolution**:
  - Configured `sharpInstance.cache(false)` in [`mediaOptimizer.js`](../../lib/media/mediaOptimizer.js) to release native file descriptors on Windows (`EBUSY` error prevention).
  - Updated `saveProjectFile` in [`projectStorage.js`](../../lib/data/projectStorage.js) to avoid falling back to `"art.jpg"` when `cover` is intentionally empty.
  - Cleaned up all `art.*` and cover variants in `app/api/admin/project/route.js` and scheduled automated cache pruning.

#### 6. Artwork & Audio Upload Box Color Theming
- **Situation**:
  - Missing artwork or audio files lacked clear visual distinction from attached media files.
- **Resolution**:
  - Missing media: styled [`ProjectCoverUploader.js`](../../components/admin/project/ProjectCoverUploader.js) and [`TrackAudioUploader.js`](../../components/admin/track/TrackAudioUploader.js) with warning yellow background (`rgba(255, 179, 0, 0.08)`), border (`warning.main`), yellow indicator icons, and `"Missing Artwork"` / `"No Audio File Attached"` badges.
  - Attached media: styled with primary blue background (`rgba(144, 202, 249, 0.08)`), border (`primary.main`), blue indicator icons, and `"Active Cover"` / `"Audio Attached"` badges.

---

### Category 3: Project Lifecycle & Storage Operations

#### 7. Project Renaming Folder & File Transfer Integrity
- **Situation**:
  - Renaming a project title created a new folder and `project.json`, but left the old folder with media files behind, or failed when locked.
- **Resolution**:
  - Implemented atomic rename in [`app/api/admin/project/route.js`](../../app/api/admin/project/route.js) via `safeRenameSync`.
  - Added robust fallback migration: if rename is locked, it creates the destination directory, copies all existing files, and purges the old directory via `deleteProjectData(oldSlug)`.

#### 8. Delete Project Action & Media Cache Pruning
- **Situation**:
  - The Delete Project confirmation dialog did not execute deletions due to an `onConfirm` vs `onConfirmDelete` prop discrepancy.
- **Resolution**:
  - Updated [`DeleteProjectDialog.js`](../../components/admin/dialogs/DeleteProjectDialog.js) to accept either `onConfirm` or `onConfirmDelete`.
  - Ensured `/api/admin/project` deletes project directories atomically and calls `scheduleAutomatedCachePrune()` to remove cached thumbnails.

---

### Category 4: Autosave, Form State & Navigation Resilience

#### 9. Autosave Debounce Isolation & Staged File Reset
- **Situation**:
  - Autosave fired mid-word while users were still typing.
  - Uploading artwork followed by an audio upload caused 500 errors attempting to re-read the staged cover file.
- **Resolution**:
  - Set `debounceMs = 0` in [`AdminTextInput.js`](../../components/admin/common/AdminTextInput.js) to ensure keystrokes reset `useAutoSave`'s 1-second idle timer on every keypress.
  - Reset `editCoverFile` to `null` upon save so subsequent saves never re-submit processed cover files.

#### 10. Flush Unsaved Changes on Fast Navigation
- **Situation**:
  - Editing a field and immediately navigating to another project discarded unsaved changes.
- **Resolution**:
  - Added `flushPendingAutoSave()` to [`useAutoSave.js`](../../components/admin/hooks/useAutoSave.js).
  - Awaited `flushPendingAutoSave()` in [`useProjectsManager.js`](../../components/admin/hooks/useProjectsManager.js) before switching projects or creating new drafts.

#### 11. Persistent Error Notification Toast & Copy Action
- **Situation**:
  - Error messages disappeared automatically after a few seconds, preventing operators from inspecting or copying stack traces.
- **Resolution**:
  - Removed auto-hide timer (`autoHideDuration={null}`) in [`AdminHeader.js`](../../components/admin/layout/AdminHeader.js) for errors so they stay until explicitly dismissed via the close button.
  - Added a Copy button to the error Alert that copies the error text to the clipboard with animated checkmark feedback.

---

### Category 5: Navigation, Sidebar UX & Routing Fallbacks

#### 12. Project Sidebar Auto-Scroll & `+ Add Project` Button
- **Situation**:
  - Selecting a project from the sidebar or loading deep links did not scroll the selected item into view.
  - The `+ New` button lacked contrast and clear action wording.
- **Resolution**:
  - Added `listContainerRef` and auto-scrolling via `scrollIntoView({ block: 'nearest', behavior: 'smooth' })` in [`ProjectSidebarList.js`](../../components/admin/projects/ProjectSidebarList.js).
  - Clicking `+ Add Project` smoothly scrolls the list to the top.
  - Renamed the button to `+ Add Project` and styled it with `variant="contained"` (filled blue).

#### 13. Project Slug URL Synchronization & Fallback Route
- **Situation**:
  - Renaming a project did not sync the browser URL slug, and navigating to invalid project URLs left the dashboard in an inconsistent state.
- **Resolution**:
  - Added automatic URL slug replacement on rename in [`useAdminRouting.js`](../../components/admin/hooks/useAdminRouting.js).
  - When navigating to non-existent project slugs (e.g. `/_sys/_admin/projects/nonexistent`), the system selects the first project and cleanly rewrites the URL to `/_sys/_admin/projects` via `window.history.replaceState`.

---

## 🧪 Verification Matrix

| Verification Step | Command / Procedure | Result |
| :--- | :--- | :--- |
| **ESLint Validation** | `bun run lint` | ✅ **0 errors, 0 warnings** |
| **Next.js Production Build** | `bun run build` | ✅ **Compiled successfully in 1.6s with Turbopack** |
| **Form Debounce Verification** | Rapid typing in Project & Track fields | ✅ **1-second idle delay respected, zero mid-word saves** |
| **Media Warming Feedback** | Upload FLAC / WAV audio track | ✅ **Staged state cleared, jobs appear in Media Queue** |
| **Sidebar & Modal UX** | Select project & open Copy Track dialog | ✅ **Autoscrolls to selection, copy preselects current project** |
