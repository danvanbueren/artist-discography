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

## 5. Verification Checklist

- [ ] Start audio playback on main discography page.
- [ ] Click a project card to navigate to `/[project-slug]`. Verify audio continues playing without interruption and no page reload occurs.
- [ ] Click a track to navigate to `/[project-slug]/[track-slug]`.
- [ ] Click the browser **Back** button. Verify URL returns to `/[project-slug]`, view updates to project page, and audio continues playing uninterrupted.
- [ ] Click the browser **Forward** button. Verify URL returns to `/[project-slug]/[track-slug]`, track highlights, and audio continues playing.
- [ ] Click the logo to return home (`/`). Verify smooth transition to main discography view without page reload.
