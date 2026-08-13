# Plan 04: SPA Routing & History Navigation

## 1. Executive Summary & Objectives

This plan addresses client-side SPA routing and browser history navigation (back/forward arrows) in the application.

### Key Objectives:
1. **Zero Full-Page Reloads**: Ensure browser back (`Alt + LeftArrow` / Back Button) and forward (`Alt + RightArrow` / Forward Button) navigation update the URL and page view seamlessly without triggering a full page reload or component unmounting.
2. **Uninterrupted Audio Playback**: Audio playback must continue playing smoothly across view switches, project navigation, track selection, and browser history popstate events.
3. **State Synchronization**: Guarantee that URL state (`/`, `/[project-slug]`, `/[project-slug]/[track-slug]`) stays 100% in sync with `currentView`, `selectedProject`, and `highlightedTrackSlug`.

---

## 2. Current Navigation Flow & Vulnerabilities

In `MainDiscographyApp.js`:
- Navigation to projects and tracks uses `window.history.pushState({}, '', path)` to change the URL without browser reloads.
- The `popstate` event listener triggers `syncStateFromLocation()`:

```javascript
useEffect(() => {
  syncStateFromLocation()
  setMounted(true)

  const handlePopState = () => {
    syncStateFromLocation()
  }
  window.addEventListener('popstate', handlePopState)
  return () => window.removeEventListener('popstate', handlePopState)
}, [syncStateFromLocation])
```

### Potential Risk Points to Validate:
- If any standard `<a href="...">` anchor tag is clicked without `e.preventDefault()`, the browser will trigger a hard HTTP GET request to the Next.js server, unmounting the application and stopping audio.
- Admin (`/admin`) and Dev (`/dev`) alert banners currently use `<Button component="a" href="/admin">`. These are intended to open separate admin/dev sub-routes, but main discography routes (`/[project-slug]` and `/[project-slug]/[track-slug]`) must use virtualized SPA state navigation.

---

## 3. Virtualized SPA Navigation Specification

```
[Browser History Action (Push or PopState)]
                    │
                    ▼
         Extract Path Segments
                    │
   ┌────────────────┴────────────────┐
   │                                 │
   ▼                                 ▼
Path == '/'               Path == '/[proj]' or '/[proj]/[track]'
   │                                 │
   ├── currentView = 'ALL_PROJECTS'  ├── currentView = 'SINGLE_PROJECT'
   ├── selectedProject = null        ├── selectedProject = matchedProject
   └── highlightedTrack = null       └── highlightedTrack = matchedTrackSlug
```

---

## 4. Proposed Code Refinements

### Target File: [`MainDiscographyApp.js`](file:///c:/Users/Dan/App%20Dev/artist-discography/artist-discography/components/MainDiscographyApp.js)

Ensure `syncStateFromLocation` memoization is rock-solid and `popstate` state updates do not re-render unnecessary parent trees:

```javascript
const syncStateFromLocation = useCallback(() => {
  if (typeof window === 'undefined') return
  const path = window.location.pathname
  const pathSegments = path.split('/').filter(Boolean)

  if (pathSegments.length === 0) {
    setCurrentView('ALL_PROJECTS')
    setSelectedProject(null)
    setHighlightedTrackSlug(null)
    return
  }

  const projSlug = pathSegments[0]
  const matchedProject = findProjectBySlug(projects, projSlug)

  if (matchedProject) {
    setCurrentView('SINGLE_PROJECT')
    setSelectedProject(matchedProject)

    if (pathSegments.length > 1) {
      const trkSlug = pathSegments[1]
      const matchedTrack = findTrackBySlug(matchedProject.tracks, trkSlug)
      if (matchedTrack) {
        setHighlightedTrackSlug(slugify(matchedTrack.name))
      } else {
        const validProjSlug = slugify(matchedProject.name) || projSlug
        window.history.replaceState({}, '', `/${validProjSlug}`)
        setHighlightedTrackSlug(null)
      }
    } else {
      setHighlightedTrackSlug(null)
    }
  } else {
    window.history.replaceState({}, '', '/')
    setCurrentView('ALL_PROJECTS')
    setSelectedProject(null)
    setHighlightedTrackSlug(null)
  }
}, [projects])
```

---

## 5. Track Row Click & Selection Routing Rules

### Target Files: [`TrackRow.js`](file:///c:/Users/Dan/App%20Dev/artist-discography/artist-discography/components/TrackRow.js), [`ProjectCard.js`](file:///c:/Users/Dan/App%20Dev/artist-discography/artist-discography/components/ProjectCard.js), [`MainDiscographyApp.js`](file:///c:/Users/Dan/App%20Dev/artist-discography/artist-discography/components/MainDiscographyApp.js)

#### A. Main Discography View (`/`) Behavior
- **Track Row Background Click**:
  - Clicking the background `<Box>` of any `TrackRow` does **NOT** select or highlight a track (`onSelectTrackRow={null}`).
  - **Does NOT update or change the browser URL** (`window.location.pathname` remains `/`).
- **Song Name / Artist Field Click**:
  - Acts as an explicit navigation button/link.
  - Switches view mode to Single Project View (`SINGLE_PROJECT`), sets `selectedProject`, updates browser URL to `/[project-slug]/[track-slug]` via `window.history.pushState`, and automatically highlights that track on the project page.

#### B. Single Project Page (`/[project-slug]`) Behavior
- **Track Row Background or Title Click**:
  - Clicking any part of the track row (background or title/artist stack) selects that track and updates the URL state to `/[project-slug]/[track-slug]`.
  - **Does NOT link/navigate to a different page view** (remains on Single Project View without page reload).

---

## 6. Disabled Admin & Dev Route Redirection & Conflict Prevention

### Target Files: [`app/sys/admin/page.js`](file:///c:/Users/Dan/App%20Dev/artist-discography/artist-discography/app/sys/admin/page.js), [`app/sys/dev/page.js`](file:///c:/Users/Dan/App%20Dev/artist-discography/artist-discography/app/sys/dev/page.js)

- **Problem & Collision Prevention**: Accessing `/admin` or `/dev` directly could conflict with public music projects named "admin" or "dev". System management utilities are namespaced under `/sys/admin` and `/sys/dev` to prevent routing collisions.
- **Redirection Solution**:
  - Import `redirect` from `'next/navigation'` in `app/sys/admin/page.js` and `app/sys/dev/page.js`.
  - When loading configuration in server components, if `adminAccess === false` on `/sys/admin` or `devAccess === false` on `/sys/dev`:
    - Call `redirect('/')` immediately.
    - Eliminates unauthorized error landing pages and redirects users directly back to the main discography view home page (`/`).
  - Alert warning chips open system portal links in a **new browser tab** (`target="_blank" rel="noopener noreferrer"`).

---

## 7. Verification Checklist

- [ ] On Main Page (`/`): Click any track background. Confirm track row background does NOT select track, and the URL does NOT change.
- [ ] On Main Page (`/`): Click song name or artist text. Confirm view transitions to Project Page (`/[project-slug]/[track-slug]`), URL updates, and track is highlighted.
- [ ] On Project Page (`/[project-slug]`): Click any part of a track row background or title. Confirm track is selected, URL updates to `/[project-slug]/[track-slug]`, and page does not reload or switch views.
- [ ] Set `"adminAccess": false` in `data/artist-data.json` and navigate to `/sys/admin`. Verify user is automatically redirected back to `/` without showing unauthorized page.
- [ ] Set `"devAccess": false` in `data/artist-data.json` and navigate to `/sys/dev`. Verify user is automatically redirected back to `/` without showing unauthorized page.
- [ ] Start audio playback on main discography page.
- [ ] Click a project card to navigate to `/[project-slug]`. Verify audio continues playing without interruption and no page reload occurs.
- [ ] Click the browser **Back** button. Verify URL returns to `/[project-slug]`, view updates to project page, and audio continues playing uninterrupted.
- [ ] Click the browser **Forward** button. Verify URL returns to `/[project-slug]/[track-slug]`, track highlights, and audio continues playing.
- [ ] Click the logo to return home (`/`). Verify smooth transition to main discography view without page reload.

