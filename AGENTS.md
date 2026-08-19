<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Agent Rules & Core Standards

Welcome! This document outlines the core guidelines, architectural rules, and lessons learned for working on this project.

## Table of Contents
1. [Core Development Rules & Frameworks](#core-development-rules--frameworks)
   - [Material UI (MUI 9) Guidelines](#material-ui-mui-9-guidelines)
   - [React Effects & Hook Dependencies](#react-effects-and-hook-dependencies)
   - [Code Formatting & Styling](#code-formatting-and-styling)
2. [Lessons Learned & Core Design Standards](#lessons-learned--core-design-standards)
   - [Fail Gracefully](#fail-gracefully)
   - [React State Updates in Event Handlers, Not Render/Dispatch Callbacks](#react-state-updates-in-event-handlers-not-renderdispatch-callbacks)
3. [Project Workflows & Processes](#project-workflows--processes)
   - [Pull Requests (Keep Scope Unified)](#pull-requests)
   - [Documentation](#documentation)

---

## Core Development Rules & Frameworks

### Material UI (MUI 9) Guidelines

Use the Material UI version installed in this project. Check `package.json` before writing or updating MUI code; it is the source of truth for the exact installed packages.

When using Material UI APIs, verify patterns against the installed version's documentation or local package types. Avoid deprecated imports, props, styling APIs, or theming patterns from earlier MUI versions.

#### MUI 9 slots, `slotProps`, and styling (read before writing JSX)

This project is on **MUI 9**. Training data from MUI v4–v8 is a common source of bugs here. The most frequent mistake is passing **layout/style props directly on a component** when MUI 9 only forwards a small, explicit prop surface to the underlying DOM node.

##### The React warning you must avoid
If you see:
`React does not recognize the 'alignItems' prop on a DOM element`
…you almost certainly put a style/layout prop on the JSX tag instead of in `sx` or `slotProps`. Fix the callsite; do not work around it with native `<span style={…}>` unless there is a strong reason.

##### Rule 1 — `Box`, `Paper`, `Typography`: use `sx`, not system props
In MUI 9 these components accept **`sx`** (and `component`) for styling. They do **not** accept `alignItems`, `justifyContent`, `flexWrap`, `gap`, `display`, etc. as top-level JSX props.

```jsx
// Wrong — alignItems leaks to the DOM <div>
<Box display='flex' alignItems='center' gap={1}>

// Right
<Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
```

##### Rule 2 — composite components use `slotProps`, not legacy `*Props`
MUI 9 replaced most `FooProps` passthrough APIs with **`slotProps`**. Each key names an internal **slot** (sub-component). Props under that key are forwarded to that slot's component.

Common slots in this codebase:

| Parent | Slot key | Forwards to | Typical use |
|--------|----------|-------------|-------------|
| `Menu`, `Select` | `paper` | `Paper` | Menu surface styling (`maxHeight`, `zIndex`, nested selectors) |
| `TextField` | `htmlInput` | native `<input>` | `min` / `max` / `step`, `onKeyDown`, etc. |
| `Popover`, `Dialog`, `Drawer` | `paper` | `Paper` | Surface layout and theme overrides |
| `Modal` | `backdrop` | `Backdrop` | Backdrop behavior/styles |

Legacy names like `PaperProps`, `BackdropProps`, and `InputProps` are **not** the v9 pattern. Use `slotProps` instead.

##### Rule 3 — verify against installed types
Before adding unfamiliar MUI props, check the component's `.d.ts` under `node_modules/@mui/material/<Component>/` or grep this repo for an existing pattern. If a prop is not listed in the component's public API, assume it will leak to the DOM.

---

### React Effects and Hook Dependencies

Infinite re-render loops (`Maximum update depth exceeded`) usually come from `useEffect` calling `setState` while a dependency gets a **new reference every render**. Follow these rules when adding or reviewing hooks.

#### Do not put unstable objects in effect dependency arrays
Objects, arrays, and inline functions from context hooks or `useMemo` without stable deps are compared by **reference**. If a parent re-renders and recreates the value, the effect tears down and re-runs on every tick — often calling `setState` again and hitting React's update limit.

**Prefer refs for values the effect body must read but that should not restart the effect:**

```javascript
const valueRef = useRef(someValue)
valueRef.current = someValue

useEffect(() => {
    const doSomething = () => {
        process(valueRef.current)
    }
    // ...
}, [stableCallback]) // primitives + stable refs only
```

#### Avoid `?? []` and `?? {}` in dependency lists
`value ?? []` creates a **new empty array every render** when `value` is nullish, which makes any hook that lists it as a dependency run every render.

```javascript
// Wrong — new [] every render when items is undefined
useEffect(() => { ... }, [items ?? []])

// Right — module-level constant
const EMPTY_ITEMS = []
useEffect(() => { ... }, [items ?? EMPTY_ITEMS])
```

#### Do not call time-varying functions during render for effect deps
Calling `Date.now()` or similar **during render** produces a new value every render and re-triggers effects unnecessarily.

```javascript
// Wrong — timestamp changes every render
useAlarm(items, Date.now())

// Right — pass a stable timestamp or evaluate inside the hook/effect
```

#### Keep long-lived subscriptions stable
Subscriptions, loops, and event handlers should use **stable callbacks** (`useCallback` with refs for changing data). Re-subscribing on every render wastes work and can amplify re-render bugs.

When `setState` runs inside an effect, bail out if nothing changed:

```javascript
setItems((previous) => (
    itemsAreEqual(previous, nextItems) ? previous : nextItems
))
```

#### Checklist before merging hook changes
- Effect deps are primitives, stable callbacks, or module-level constants — not context objects recreated each render.
- Refs hold latest objects/functions when the effect body needs them but restart would be harmful.
- No `?? []` / `?? {}` fallbacks in dependency arrays.
- No time-varying values sampled during render solely to feed a `useEffect` dependency.
- Long-lived subscriptions (events, animation loops, listeners) use stable handler references.

---

### Code Formatting and Styling

Prioritize readability and standardized best practices throughout the codebase. Keep formatting consistent with the surrounding file, use clear names, and prefer straightforward control flow over clever or densely packed code.

Avoid excessively long components, hooks, or files. Split large front-end components into smaller focused components, and move reusable component logic into separate hook files when that improves readability. Prefer clear file boundaries over large files that mix rendering, state management, data shaping, and side effects.

Use React context where it fits the domain and reduces long prop chains through intermediate components. Keep context values focused and stable; do not introduce context for state that is only used by a narrow parent-child pair.

#### Semicolons
Do not use optional semicolons ending lines. Leave them off for a cleaner, modern style (e.g., `const value = 1` instead of `const value = 1;`).

#### Component Line Breaks
Prefer vertical formatting with line breaks to improve readability in JSX/TSX components. Keep tags, attributes, properties (especially `sx` or styling arrays), and closing tags on separate lines rather than collapsed horizontally. For example:
```jsx
<Box
  sx={{
    borderBottom: '1px solid',
    borderColor: 'divider',
    backdropFilter: 'blur(12px)',
    backgroundColor: 'rgba(18, 18, 18, 0.7)',
    position: 'sticky',
    top: 0,
    zIndex: 1100,
    py: 2,
  }}
>
```


---

## Lessons Learned & Core Design Standards

Future agents should automatically update this section to capture new lessons learned, design patterns, or user preferences as they are identified. Always review existing standards and adhere to them during development:

### Fail Gracefully

Design all systems to fail gracefully. Never assume that input values from `localStorage`, network requests, database queries, or user inputs are perfectly structured or initialized. Always use defensive defaults, nullish coalescing, optional chaining, and proper array/object sanitization to ensure that partial or corrupted data never crashes the application.

### React State Updates in Event Handlers, Not Render/Dispatch Callbacks
- **Standard**: Do not dispatch external callbacks that trigger state updates for other components (e.g., parent update callbacks like `onCommit`, `onLayoutCommit`, etc.) inside a React state updater callback function (e.g. `setValue((c) => { onCommit(c); return c; })`). This results in React warnings (`Cannot update a component while rendering a different component`).
- **Implementation**: Calculate state values first, trigger local state updates (e.g., `setValue(value)`), and then invoke the parent callbacks directly from within event handlers (like click, change, or finish listeners).

### Non-Blocking Media Pipelines & Ephemeral Overlays
- **Standard**: Heavy background transcoding tasks (such as FFmpeg and Sharp batch generations) should never block synchronous HTTP CRUD responses. Persist metadata and raw staged files immediately, return HTTP 200, and broadcast live transcoding progress over Server-Sent Events (SSE).
- **Layout Integrity**: Notification banners (success / error alerts) in dashboard views must use floating ephemeral toast overlays (such as MUI `Snackbar`) rather than in-flow block elements that push down tabs or induce vertical layout shifts.
- **Album Art Consistency**: All album art across admin panels, cards, headers, and media players must strictly enforce a 1:1 square aspect ratio (`aspectRatio: '1 / 1'`, `objectFit: 'cover'`) and request scaled thumbnail variants (`?w=80` or `?w=160`) for preview rendering.

---

## Project Workflows & Processes

### Pull Requests (Keep Scope Unified)

**Keep related work in a single PR.** Do not split one user request, feature, or polish pass across multiple stacked PRs unless the user explicitly asks for separate reviews.

Opening several PRs for the same area (for example copy edits, then input behavior, then layout tweaks) creates painful rebase chains, duplicate review, and merge-order dependencies. Instead:
- Use **one branch and one PR** for the full scope of the task.
- Add commits to that branch as the work evolves.
- If a prior PR from the same session is still open and touches the same feature, **extend that branch/PR** rather than opening another.

### Documentation

Treat documentation (like README.md or contributor docs) as part of every change, not a separate follow-up task. Whenever you add, remove, rename, or materially change code or functionality, validate whether the documentation still accurately describes the project. Update it in the same work session when anything is out of date or missing.
