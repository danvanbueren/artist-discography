# 🎨 UI Architecture, Theme System & Design Standards

This document details the visual design philosophy, theme architecture, Material UI 9 standards, custom interaction hooks, and responsive UX patterns in **Artist Discography**.

---

## 🌌 Visual Design Philosophy: Obsidian Glassmorphism

Artist Discography is styled with an immersive, dark aesthetic designed to let album artwork and music take center stage.

```
┌────────────────────────────────────────────────────────────────────────┐
│  Dynamic Ambient Canvas (HSL Color Blooming from Active Album Art)      │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Sticky Navbar (Glassmorphic Blur 16px, Obsidian 70% Alpha)       │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │                                                                  │  │
│  │  Catalog Grid & Project Cards (1:1 Ratio, Hover Glow, Lift)      │  │
│  │                                                                  │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │  Persistent Floating Audio Bar (Bottom Docked, Glassmorphic Blur)│  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### Core Visual Principles
1. **Obsidian Palette**: Deep background base (`#07070a` to `#0f0f14`) that prevents eye fatigue and highlights vibrant album artwork.
2. **Glassmorphic Translucency**: Sticky navigation headers, audio player bars, and dropdown menus utilize backdrop blur (`backdropFilter: 'blur(16px)'`) with 70–80% opacity dark fills.
3. **Dynamic Ambient Lighting (`useDynamicThemeGradients.js`)**:
   As tracks play or projects are selected, vibrant dominant and accent colors are extracted from the album artwork and subtly bloomed into the background canvas with smooth transitions.

---

## ⚛️ Material UI (MUI 9) Code Standards

The codebase strictly adheres to modern MUI 9 architectural rules as specified in [`AGENTS.md`](file:///c:/Users/Dan/App%20Dev/artist-discography/AGENTS.md).

### 1. Style via `sx`, Not Top-Level System Props
In MUI 9, components (`Box`, `Paper`, `Typography`, etc.) accept the `sx` prop for styling. Passing system layout props directly to JSX tags causes React DOM attribute leakage warnings.

```jsx
// ❌ WRONG — leaks alignItems and gap to DOM <div>
<Box display='flex' alignItems='center' gap={2}>

// ✅ CORRECT — styled via sx prop
<Box
  sx={{
    display: 'flex',
    alignItems: 'center',
    gap: 2,
  }}
>
```

### 2. Composite Slots via `slotProps`
Legacy `*Props` (e.g. `PaperProps`, `InputProps`, `BackdropProps`) are replaced by `slotProps`:

```jsx
<Menu
  anchorEl={anchorEl}
  open={open}
  onClose={handleClose}
  slotProps={{
    paper: {
      sx: {
        backgroundColor: 'rgba(15, 15, 20, 0.95)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 2,
      },
    },
  }}
>
```

### 3. Vertical JSX Formatting
Components, `sx` style objects, and nested props maintain vertical formatting with clean line breaks to ensure scannability and avoid dense horizontal lines.

---

## 🖱️ Horizontal Drag & Mouse Wheel Scrolling (`useDragScroll`)

Horizontal filter lists, navigation tabs, and streaming platform button rows can be awkward to navigate on desktop with standard mouse wheels.

### The `useDragScroll` Custom Hook
Components wrap horizontal scrolling containers with `useDragScroll`:
1. **Click-and-Drag Panning**: Desktop users can click and drag anywhere in the container to smoothly pan left and right.
2. **Vertical Mouse Wheel Translation**: Converts standard vertical mouse wheel ticks (`deltaY`) into horizontal scroll velocity (`scrollLeft`).
3. **Accidental Click Suppression**: Detects whether a pointer interaction was a drag gesture (>5px movement) or a deliberate click, suppressing accidental link clicks when dragging.

---

## 📱 Responsive Ergonomics & Touch Devices

### Expanded Hit Targets (`theme.js`)
On mobile devices and high-DPI touchscreens, small icon buttons are difficult to tap accurately. The theme configuration (`app/theme.js`) extends touch targets for all `IconButton` and interactive elements to a minimum of **44x44px** while retaining compact visual icons.

### Sticky Hover Suppression (`useTouchDevice.js`)
On mobile browsers, tapping a button frequently triggers a "sticky hover" CSS state that remains active until another element is tapped. The `useTouchDevice` hook detects touch capabilities and suppresses desktop hover styles across the audio player and catalog cards.

### Mobile Fullscreen Player & Omnidirectional Swipe Minimization
- On mobile screens, tapping the bottom audio bar expands a dedicated fullscreen player modal (`FullscreenPlayerModal.js`).
- Users can swipe down (or left/right) on the player header/cover art to minimize the player back to the floating bottom bar.

---

## 🍞 Ephemeral Overlays vs In-Flow Layout Shifts

To preserve layout stability and prevent Cumulative Layout Shift (CLS):
- Status messages, copy-to-clipboard alerts, and media processing updates use floating ephemeral overlays (MUI `Snackbar` / toasts).
- Notification banners never push down navigation tabs or catalog grids.
