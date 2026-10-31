# Hermanos Forge — Subframe Studio Design Specification

**Document Status:** Living Design Specification (v2.0 — Subframe Studio Edition)  
**Design Direction:** Subframe Studio Media Forge  
**Subframe Project Reference:** `d45f34a03785` (Team `47753`)  
**Subframe Canvas Reference:** `https://app.subframe.com/d45f34a03785/canvas/3a8dc8e7-ed58-4ccc-bfe1-5e68e69840dd/edit`  
**Platform Focus:** Windows Desktop (Electron + React 19 + Tailwind CSS)  
**Quality Gate:** `npm run lint` and `npm run build` passing with 0 errors and 0 warnings.

---

## 1. Executive Summary & Vision

Hermanos Forge is a premier desktop media forge engineered for high-throughput video downloading, audio extraction, lossless video concatenation (stitching), and selective keyframe trimming.

This specification re-architects the visual design system around **Subframe Studio** — an ultra-clean, pitch-dark cyber-minimalist studio workbench with deep obsidian canvas surfaces (`#0b0b10`), structured studio panels (`#12121a`), solid hairline borders (`#1e1e2a`), and vivid electric violet accents (`#7c3aed` / `#8b5cf6`).

### Core Design Pillars

1. **Subframe Precision Geometry**:
   - Clean, mathematical spacing and sharp 8px/12px corner radii.
   - Distinct elevation separation between canvas (`#0b0b10`), sidebar (`#0f0f16`), panels (`#12121a`), and inset wells (`#0b0b10`).
   - Hairline borders in `#1e1e2a` (subdued) and `#2a2a3a` (inputs/borders).

2. **Electric Violet Studio Identity**:
   - Primary Brand Violet (`#7c3aed`) for interactive triggers, primary buttons, and focus halos.
   - Glow Violet (`#8b5cf6`) for active progress indicators and live beacons.
   - Light Amethyst (`#ede9fe` / `#c4b5fd`) for active navigation states, badges, and tag chips.

3. **High-Density Studio Workspaces**:
   - Command-bar inputs with integrated quick-paste and clear buttons.
   - Segmented pill switches for container formats (MP4 vs. MP3).
   - Real-time diagnostic monitors and status log boxes with colored status pills (`OK`, `INFO`, `WARN`, `ERR`).

4. **Zero Compromise on Runtime Mechanics**:
   - All Electron IPC channel contracts (`window.electronAPI`, `window.stitchAPI`) and backend process lifecycles remain completely intact.
   - Form states, entered URLs, queued downloads, and local histories are strictly preserved across view switches.

---

## 2. Color System & Design Tokens

### 2.1 Surfaces & Canvas (Pitch Obsidian)

| Token Name | Hex Code | Purpose |
| :--- | :--- | :--- |
| `bg-base` | `#0b0b10` | Primary application canvas, inset input wells, code boxes |
| `surface-1` (Sidebar) | `#0f0f16` | Left navigation sidebar and dialog footers |
| `surface-2` (Card/Panel) | `#12121a` | Main feature cards, setting sections, media preview containers |
| `surface-3` (Elevated) | `#14141d` | Sidebar output folder card, hovered items, dropdowns |
| `surface-hover` | `#1e1e2a` | Hover states on interactive cards and buttons |

### 2.2 Borders & Dividers

| Token Name | Hex Code | Purpose |
| :--- | :--- | :--- |
| `border-subdued` | `#1e1e2a` | Primary structural borders, card edges, sidebar separator |
| `border-strong` | `#2a2a3a` | Inset well outlines, input borders, button outlines |
| `border-focus` | `#7c3aed` | Active focus borders and command-bar rings |
| `border-brand` | `rgba(124, 58, 237, 0.3)` | Active tab border, selection borders |

### 2.3 Brand & Accent Colors

| Token Name | Hex Code | Purpose |
| :--- | :--- | :--- |
| `brand-600` (Primary) | `#7c3aed` | Primary action buttons, active format pills, brand marks |
| `brand-500` (Glow) | `#8b5cf6` | Progress bar fills, key action hovers, glowing beacon dots |
| `brand-700` (Active) | `#6d28d9` | Pressed button states, active triggers |
| `brand-light` | `#ede9fe` | High-contrast text on brand surfaces, active tab text |
| `brand-muted` | `#c4b5fd` | Secondary text chips, paste button text, subtext accents |
| `brand-surface` | `rgba(124, 58, 237, 0.12)` | Active tab backgrounds, brand badge backgrounds |

### 2.4 Status Colors

| State | Text / Icon | Surface / Pill Background | Border |
| :--- | :--- | :--- | :--- |
| **Success** | `#86efac` (`#22c55e`) | `rgba(34, 197, 94, 0.08)` | `rgba(34, 197, 94, 0.2)` |
| **Warning** | `#fde047` (`#facc15`) | `rgba(250, 204, 21, 0.08)` | `rgba(250, 204, 21, 0.2)` |
| **Danger / Error** | `#fca5a5` (`#ef4444`) | `rgba(239, 68, 68, 0.1)` | `rgba(239, 68, 68, 0.3)` |
| **Info / Cyan** | `#7dd3fc` (`#38bdf8`) | `rgba(56, 189, 248, 0.1)` | `rgba(56, 189, 248, 0.25)` |

---

## 3. Typography & Hierarchy

- **Heading Font Stack**: `Space Grotesk`, Inter, sans-serif (`font-heading font-bold tracking-tight text-[#f4f4f7]`).
- **Body & UI Font Stack**: `DM Sans`, Inter, system-ui, sans-serif (`text-[#b4b4c2] text-sm`).
- **Monospace & Metadata Stack**: `JetBrains Mono`, Consolas, monospace (`font-mono text-xs text-[#a78bfa] tabular-nums`).

### Type Scales

- **Page Title**: `text-2xl font-bold tracking-tight text-[#f4f4f7]`
- **Section Heading**: `text-sm font-bold text-[#f4f4f7] font-heading`
- **Field / Upper Label**: `text-xs font-bold uppercase tracking-wider text-[#9a9aac]`
- **Body Text**: `text-sm text-[#b4b4c2] leading-relaxed`
- **Caption Text**: `text-xs text-[#7a7a8c]`
- **Monospace Code / Timecode**: `font-mono text-xs font-bold`

---

## 4. Component Design Specifications

### 4.1 Navigation Sidebar & Window Frame
- **Window TitleBar**:
  - Height: `h-11`, background `#0f0f16`, border-b `#1e1e2a`.
  - Left: Logo icon + "Hermanos Forge" + "Studio v1.1" badge.
  - Center: "Engine Ready" status pill with pulsating green beacon (`#22c55e`).
  - Right: Frameless window controls (minimize, maximize, close).
- **Sidebar**:
  - Width: `w-60 sm:w-64` (collapsed: `w-16`), background `#0f0f16`, border-r `#1e1e2a`.
  - Header: Section title "WORKSPACE" in `text-xs font-bold font-mono uppercase tracking-wider text-[#5c5c6e]`.
  - Nav Items: Rounded-md with smooth hover transition. Active is `border border-[#7c3aed4d] bg-[#7c3aed1f] text-[#ede9fe] font-semibold` with `#a78bfa` icon and glowing dot.
  - Lower Area: Side-by-side History and Settings buttons, Output Destination box with "Change" button pill.

### 4.2 Single Media Downloader View
- **Header**: Workspace title, subtitle, and live engine status beacon.
- **Source URL Card**:
  - Surface: `#12121a`, border `#1e1e2a`, rounded-xl, padding 24px.
  - URL Input: `#0b0b10` background, `#2a2a3a` border, focus `#7c3aed`, integrated "Paste" button pill (`bg-[#1e1e2a] text-[#c4b5fd]`).
  - Format Selector: Pill group container with MP4 and MP3 options.
  - Quality Selector: Inset trigger with resolution label, size badge, and dropdown options.
  - Action Button: Large primary button `bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold`.
- **Live Progress & Status Card**:
  - Displays video title, downloading badge, cancel button (`border border-[#ef444455] text-[#ef4444]`).
  - Large percentage display (`64%`) with Subframe progress bar (`#8b5cf6` on `#1e1e2a`).
  - Integrated status log console showing engine events with colored tags (`OK`, `INFO`, `WARN`).

### 4.3 Mass Clip Stitcher View
- **Header**: Breadcrumbs "Studio > Batch Tools", title, "Engine ready" badge.
- **Clip Queue**:
  - Numbered sequence markers (`01`, `02`, `03`...) in `#0b0b10` boxes.
  - Clip cards in `#0f0f16` with drag handles, URL inputs, and status badges (`Ready`, `Trimming`, `Done`, `Error`).
  - Action buttons: "Download Separate Files" (secondary) and "Stitch into Single Video" (primary).

### 4.4 Selective Trimming View
- **Header**: Breadcrumbs "Clip Studio > Selective Duration Trimmer", title, "Engine ready" badge.
- **Source Video Card**: URL input with "Load Video" primary button.
- **Preview & Metadata**: Video thumbnail, duration indicator, channel tag, resolution selector.
- **Segments List**: Start and End timecode inputs, timeline scrubbers, Add Another Segment button, and Download Selected Clips action.

### 4.5 History & Settings Views
- **History**: Subtabs for Single Media, Selective Duration, and Mass Clips; search input well; history item cards with copy URL and open file location triggers; pagination controls.
- **Settings**: Output destination directory selector; browser cookie authentication status card with one-click launch wizard; system diagnostics grid (Python, FFmpeg, FFprobe, and bundled DLLs); developer logs button.

---

## 5. Verification & Compliance Record

1. **Subframe Design Alignment**: All components and views strictly match the generated Subframe canvases and components.
2. **IPC Channel Integrity**: Confirmed 100% preservation of `window.electronAPI` and `window.stitchAPI` channels.
3. **State Preservation**: Switching views, collapsing the sidebar, or opening dialogs preserves all active inputs, queues, and job states.
4. **Code Quality**: Passes `npm run lint` and `npm run build` with 0 errors and 0 warnings.
