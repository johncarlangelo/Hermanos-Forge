# Hermanos Forge --- Design Specification

**Document status:** Living design specification (v1.1.0-pro)\
**Design direction:** Obsidian Forge Media Studio (evolved from Precision Studio)\
**Application:** Hermanos Forge desktop application\
**Platform focus:** Windows desktop (Electron)\
**Implementation status:** Implemented in `dev` (committed in `b885179`)\
**Source of truth:** This document defines the active visual design tokens,
layout hierarchy, and shared component specifications for Hermanos Forge.
Existing source code and architecture documents remain authoritative for
runtime and IPC details.

------------------------------------------------------------------------

## 1. Purpose and Scope

Hermanos Forge is a desktop media utility for downloading media,
converting local MP4 files to MP3, downloading selected video segments,
processing multiple clip URLs, stitching clips, reviewing download
history, and configuring application settings and browser-cookie
authentication.

The design elevates Forge into a deliberate, premium desktop
workbench—**Obsidian Forge Media Studio**—combining cyber-luminescent
accents, deep obsidian surfaces, and high-precision media controls.

The design delivers:

-   Visual hierarchy, brand identity, and multi-layer depth.
-   Workflow clarity, discoverability, and command-bar input aesthetics.
-   Efficient use of the desktop viewport at default 900 × 700 and scaled sizes.
-   Feedback during inspection, downloads, conversions, stitching, and
    authentication barriers.
-   Accessibility, keyboard use, and visible focus rings.
-   First-class Dark mode (Obsidian Forge) and Light mode (Obsidian Slate Studio).
-   Cohesion across the main window, modals, and auxiliary developer logs window.

### In scope

-   Application shell, navigation sidebar, frameless title bar, bottom status strip, and workspace layout.
-   Design tokens, themes, typography, spacing, borders, radii, shadows, and ambient lighting.
-   Shared UI primitives and consistent interaction states.
-   Existing downloader, mass-clip, selective-duration, history,
    settings, and diagnostics views.
-   Existing dialogs and the auxiliary logs window.
-   Visual treatment of loading, progress, empty, success, warning, and
    error states.
-   UI-level usability improvements specifically approved in this
    document.

### Out of scope unless separately approved

-   Replacing or rewriting the Python backend.
-   Changing yt-dlp, FFmpeg, cookie extraction, or media-processing
    logic.
-   Changing Electron IPC channel names, method signatures, payloads,
    event semantics, or lifecycle.
-   Introducing unrelated new product features.
-   Changing persisted data formats or existing localStorage keys.
-   Automatically clearing or rewriting user inputs, history, or queued
    work as part of a visual refresh.
-   Migrating the project to TypeScript or Tailwind CSS v4.
-   Purchasing a UI kit or introducing paid dependencies.

**Core principle:** Improve the interface around existing capabilities.
Do not break or silently change the behavior that makes those
capabilities work.

------------------------------------------------------------------------

## 2. Product and Design Principles

### 2.1 Obsidian Forge Media Studio

Forge communicates focus, control, and technical reliability wrapped in a
sleek cyber-studio visual language.

The visual language uses:

-   **Deep Obsidian Core**: Deep canvas surfaces (`#09090C`), structured panel
    layers (`#0E0E13`), elevated cards (`#16161F` / `obsidian-850` `#13131A`), and hover states (`#222230`).
-   **Specular Top Edge Highlights**: Subtle hairline top highlights
    (`.surface-panel::before`) providing physical realism and surface depth.
-   **Cyber-Luminescent Accents**: Electric Violet (`#9D4EDD`), Amethyst Magenta
    (`#B5179E`), Electric Neon (`#C084FC`), and Radiant Cyan (`#00F0FF`).
-   **Ambient Lighting & Texture**: Soft radial violet glow (`.ambient-glow-purple`,
    `.studio-ambient-bg`) and cybernetic dot noise overlay (`.noise-overlay`).
-   **High-Contrast Typography**: Display headings in `Space Grotesk`, UI body in
    `DM Sans`, and timecodes/durations/code in `JetBrains Mono` with `tabular-nums`.
-   **Consistent Rectangular Controls**: Standardized 6px-12px corner radii,
    subdued purple borders, and command-bar focus halos.
-   **Clear Status & Feedback**: Visible status labels, live engine activity
    beacons, and real-time progress indicators.
-   **Purposeful Micro-Interactions**: Framer Motion physics for tabs,
    button presses, and collapsible panels without decorative delays.

### 2.2 Utility before decoration

Every screen makes its main task and next action obvious. Avoid fake
dashboard metrics or decorative clutter that does not serve media workflows.

### 2.3 Clear hierarchy

Each view features a dedicated module header, supporting context, a
spotlight input area, and distinct primary vs. secondary actions.

### 2.4 Honest feedback

Long-running operations clearly communicate state. Progress, errors,
cancellation, and completion reflect real backend events rather than
synthetic timers.

### 2.5 Preserve user work

Never clear URLs, queue rows, clip ranges, or other user-entered work
merely because an animation finished or a timeout elapsed. Destructive
actions require explicit confirmation.

### 2.6 Consistency without forcing sameness

Shared components look and behave consistently. Specialized controls—especially
the selective-duration timeline—retain purpose-built layouts for precision trimming.

------------------------------------------------------------------------

## 3. Confirmed Design Decisions

The following decisions have been confirmed and implemented:

1.  **Window frame:** Custom frameless Electron window with application-owned
    title-bar controls (`TitleBar.jsx`), macOS-inspired traffic dots, brand emblem,
    and native Windows minimize/maximize/close buttons.
2.  **Playlist detection:** Detect and communicate playlist URLs inline with
    a dedicated notification card; provide an explicit action to open the
    playlist-selection dialog without intrusive interruptions.
3.  **Fresh-install theme:** Default to Dark mode (Obsidian Forge Media Suite).
4.  **Theme support:** Provide both Dark mode and Light mode (Obsidian Slate Studio).
5.  **Accent:** Cyber-luminescent Violet (`#9D4EDD`), Amethyst (`#B5179E`),
    and Neon Purple (`#C084FC`), with Radiant Cyan (`#00F0FF`) secondary highlights.
6.  **Typography:** Space Grotesk (display/headings), DM Sans (body/labels),
    JetBrains Mono (durations, paths, logs, code).
7.  **Density:** Balanced desktop density with command-palette style spotlight inputs.
8.  **Branding:** Obsidian Forge emblem with purple-amethyst gradient ring and
    `v1.1.0-pro` release tag.
9.  **Component direction:** Source-owned, customizable React components in
    `src/components/ui/` styled with Tailwind CSS 3.4 tokens and Framer Motion.
10. **Persistent Bottom Status Strip:** Dedicated 28px (`h-7`) footer bar
    reporting ready state, destination directory path, and core engine activity.
11. **Implementation language and styling:** JavaScript/JSX with Tailwind CSS 3.4.

## 4. Technical Constraints and Integration Boundaries

The repository audit identifies React 19, Vite 8, Tailwind CSS 3.4,
Electron, a Python backend, FFmpeg, yt-dlp-related tooling, Lucide
React, Framer Motion, and react-hot-toast.

Verify exact versions and current implementation details in the
repository before implementation.

### 4.1 Contracts that must remain intact

The UI redesign must preserve existing IPC methods, channel names,
arguments, return values, and event semantics. In particular, preserve
the existing contracts for:

-   Single MP3 and MP4 downloads.
-   Clip downloads and cancellation.
-   URL inspection and format retrieval.
-   Video metadata retrieval.
-   Local MP4-to-MP3 conversion.
-   Mass clip stitching and cancellation.
-   Cookie extraction and cookie-file import.
-   Directory and file selection.
-   Opening a file location.
-   Unique output-folder creation.
-   System-status checks.
-   Opening the developer logs window.
-   External URL opening.
-   Download progress and status listeners.
-   Authentication errors.
-   Per-clip and stitch status, success, and error listeners.

The current bridge is exposed through the Electron preload layer,
including `window.electronAPI` and `window.stitchAPI`. Do not bypass
this bridge from React or introduce direct Node.js access into the
renderer.

Do not rename, remove, consolidate, or change these contracts as part of
UI work.

### 4.2 Persisted state

Preserve existing localStorage keys and their current data formats
unless a separate migration is explicitly planned and approved:

-   `download-history`
-   `global-outputDir`
-   `cookie-browser`
-   `cookie-status`
-   `cookie-sync-date`
-   `mass-clips`
-   `theme`

Do not silently reset history, output preferences, authentication
status, queued clips, or the selected theme.

### 4.3 Keep the logs window functional

The developer logs window should visually belong to Forge, but must
remain useful for inspecting technical output. Use a theme-aware console
surface and readable monospace text. Do not remove log content, change
its data source, or introduce decorative formatting that makes logs
harder to read.

### 4.4 Dependency policy

Before adding or configuring UI dependencies:

1.  Inspect the existing package manifest, lockfile, and configuration.
2.  Confirm compatibility with React 19, Vite 8, JavaScript/JSX, and
    Tailwind CSS 3.4.
3.  Avoid unnecessary framework migrations.
4.  Reuse existing Lucide React, Framer Motion, and toast infrastructure
    where appropriate.
5.  Add only dependencies that support an identified need.

The shared component architecture is built on source-owned primitives in `src/components/ui/` (`Button`, `Input`, `Select`, `Dialog`, `Tabs`, `Badge`, `Progress`, `Tooltip`, `Card`, `TitleBar`) combining Tailwind CSS 3.4 tokens, `cn()` (`clsx` + `tailwind-merge`), and Framer Motion micro-interactions, configured with the `@/` path alias in `vite.config.js`. This provides complete design control without external component library baggage or unwanted CSS resets.

------------------------------------------------------------------------

## 5. Visual Foundation

### 5.1 Color system

Semantic CSS custom properties and configured Tailwind tokens ensure UI components bind to structural roles rather than hard-coded hex codes.

#### Dark Theme — Default (Obsidian Forge Media Suite)

| Token | Hex / RGBA Value | Role / Purpose |
|---|---|---|
| `--bg-base` | `#09090C` | Main application canvas (Obsidian 950) |
| `--surface-1` | `#0E0E13` | Sidebar, primary panels, command container (Obsidian 900) |
| `--surface-2` | `#16161F` | Elevated cards, nested inputs, secondary chips |
| `--surface-hover` | `#222230` | Hovered interactive elements and table rows |
| `--border-subdued` | `rgba(168, 85, 247, 0.16)` | Low-emphasis borders, dividers, subtle card outlines |
| `--border-strong` | `rgba(168, 85, 247, 0.32)` | Inputs, focus boundaries, prominent cards |
| `--text-primary` | `#F3F0F5` | Main headings and high-emphasis prose |
| `--text-secondary` | `#A99FB2` | Supporting text, metadata, input labels |
| `--text-tertiary` | `#6E6478` | Disabled text, subtle hints, muted icons |
| `--accent-primary` | `#9D4EDD` | Electric Violet primary action and focus ring |
| `--accent-hover` | `#8B3DD0` | Hover and active state for primary actions |
| `--accent-muted` | `rgba(157, 78, 221, 0.16)` | Subtle violet selection and badge backgrounds |
| `--accent-neon` | `#C084FC` | Luminescent lavender/neon highlights, active beacons |
| `--accent-cyan` | `#00F0FF` | Radiant cyan secondary accents, direct stream tags |
| `--focus-ring` | `#9D4EDD` | Electric violet focus ring halo |
| `--status-success` | `#10B981` | Success notifications and completion badges |
| `--status-warning` | `#F59E0B` | Attention, cancellation, and cautionary alerts |
| `--status-danger` | `#EF4444` | Errors, destructive buttons, and auth wall alerts |
| `--status-info` | `#00F0FF` | Informational callouts and engine inspection status |

#### Light Theme — Obsidian Slate Studio

| Token | Hex / RGBA Value | Role / Purpose |
|---|---|---|
| `--bg-base` | `#F8F7FA` | Slate pearl main canvas |
| `--surface-1` | `#FFFFFF` | Clean white primary panels and dialogs |
| `--surface-2` | `#F1EFF5` | Secondary input surfaces, cards, and toolbars |
| `--surface-hover` | `#E6E2EE` | Hovered interactive elements |
| `--border-subdued` | `rgba(100, 70, 130, 0.14)` | Subtle purple slate borders and dividers |
| `--border-strong` | `rgba(100, 70, 130, 0.26)` | Prominent borders and inputs |
| `--text-primary` | `#17151D` | Charcoal-violet text and titles |
| `--text-secondary` | `#635C6E` | Subdued slate text and secondary labels |
| `--text-tertiary` | `#958D9E` | Subtle labels, placeholders, and disabled cues |
| `--accent-primary` | `#8433C4` | Deep violet primary action |
| `--accent-hover` | `#7124AF` | Hovered violet accent |
| `--accent-muted` | `rgba(132, 51, 196, 0.12)` | Subtle lavender wash |
| `--accent-neon` | `#9D4EDD` | Bright violet indicator |
| `--accent-cyan` | `#0099A8` | High-contrast cyan accent for light backgrounds |
| `--focus-ring` | `#8433C4` | Deep violet focus ring |
| `--status-success` | `#059669` | Success status |
| `--status-warning` | `#D97706` | Amber warning status |
| `--status-danger` | `#DC2626` | Red error status |
| `--status-info` | `#0284C7` | Sky/cyan info status |

#### Obsidian Color Hierarchy (Tailwind `colors.obsidian`)

- `obsidian-950`: `#09090C` — Base canvas, title bar, and bottom status strip.
- `obsidian-900`: `#0E0E13` — Sidebar background, panel backdrops.
- `obsidian-850`: `#13131A` — Elevated cards, command containers, nested inputs.
- `obsidian-800`: `#181824` — Secondary buttons, dropdown menus, popovers.
- `obsidian-750`: `#1F1F2E` — Hovered item backgrounds, active chips.
- `obsidian-700`: `#28283D` — Structural borders and dividing rules.
- `obsidian-600`: `#3D3D5C` — Outer bounding strokes, disabled edges.

#### Accent Color Hierarchy (Tailwind `colors.accent`)

- `accent-violet`: `#9D4EDD` — Primary action gradient start, brand hallmark.
- `accent-purple`: `#A855F7` — Primary action gradient midpoint.
- `accent-amethyst`: `#B5179E` — Primary action gradient end, specular glow.
- `accent-neon`: `#C084FC` — High-visibility status beacons, active text accents.
- `accent-cyan`: `#00F0FF` — Secondary stream badges, live bitrate badges.
- `accent-glow`: `rgba(157, 78, 221, 0.25)` — Radial spotlight and volumetric haze.

#### Box Shadows & Ambient Glows (Tailwind `boxShadow`)

- `shadow-glow-violet`: `0 0 25px -4px rgba(157, 78, 221, 0.45)` — Primary action buttons, active indicator beacons.
- `shadow-glow-amethyst`: `0 0 20px -3px rgba(181, 23, 158, 0.4)` — High-priority badge halos.
- `shadow-glow-cyan`: `0 0 20px -3px rgba(0, 240, 255, 0.35)` — Live inspection pills, audio stream tags.
- `shadow-inner-glow`: `inset 0 1px 1px 0 rgba(255, 255, 255, 0.08), inset 0 -1px 1px 0 rgba(0, 0, 0, 0.4)` — Tactical surface inset depth.
- `shadow-window-frame`: `0 25px 65px -15px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(168, 85, 247, 0.18)` — Frameless window drop shadow.

### 5.2 Accent usage

Electric Violet, Amethyst, and Neon Purple are the hallmark visual accents:
- **Primary Action**: Buttons use the linear gradient `from-accent-violet via-accent-purple to-accent-amethyst` with `shadow-glow-violet` and a top hairline highlight (`before:bg-gradient-to-r before:via-white/35`).
- **Active Navigation**: Active sidebar and tab items receive purple border illumination, subtle glow wash, and `layoutId` animated indicator pills.
- **Command Bar Halos**: Active inputs project an `accent-violet/30` outer focus ring.
- **Live Engine Beacons**: Pulsing double-circle beacon with ping animation indicating active backend runtime.

Avoid using raw accent colors on large unbroken background fields without gradient or opacity masking.

### 5.3 Typography

Hermanos Forge uses three specialized Google Fonts:

1. **Display & Headings** (`font-heading`): `Space Grotesk`, sans-serif. Used for view titles, brand emblems, and module headers. Delivers futuristic, cyber-mechanical authority.
2. **Body & UI** (`font-sans`): `DM Sans`, `Inter`, ui-sans-serif, system-ui, -apple-system, sans-serif. Used for form labels, descriptions, body prose, and buttons. Clean, geometric, and highly legible.
3. **Technical & Monospace** (`font-mono`): `JetBrains Mono`, `Consolas`, `Menlo`, monospace. Used for URLs, timecodes, durations, bitrates, file sizes, format tags, and developer logs. Rendered with `tabular-nums` for precise columnar alignment.

| Role | Font Stack | Size | Weight | Typical Use |
|---|---|---|---|---|
| Application brand | `Space Grotesk` | 14–15px | 600–700 | TitleBar emblem, brand tag |
| View title / Module header | `Space Grotesk` | 20–22px | 700 | Main screen heading (`tracking-tight`) |
| Section heading | `Space Grotesk` | 14–16px | 600 | Panel and bento-card headings |
| Body & UI controls | `DM Sans` | 12–14px | 400–500 | Inputs, labels, button text, options |
| Metadata & Helper text | `DM Sans` | 11–12px | 400–500 | Secondary labels, descriptions |
| Technical & Durations | `JetBrains Mono` | 11–12px | 500–600 | Timecodes, durations, bitrates, URLs |
| Keyboard hints (`Kbd`) | `JetBrains Mono` | 10px | 600 | Keybindings (`Enter ↵`, `Ctrl+V`) |
| Developer logs | `JetBrains Mono` | 12px | 400–500 | Engine stdout/stderr stream |

### 5.4 Spacing and density

Use a consistent 4px-increment spacing scale:
- 4px (`gap-1`, `p-1`): Micro-spacing between icon and text.
- 8px (`gap-2`, `p-2`): Compact control internals, chip spacing, window controls.
- 12px (`gap-3`, `p-3`): Field gaps, metadata rows, list items.
- 16px (`gap-4`, `p-4`): Standard component gaps, card content padding.
- 20–24px (`space-y-5`, `space-y-6`): Module separation, view spacing.
- 28px (`h-7`): Fixed height for the persistent bottom status strip.
- 44px (`h-11`): TitleBar height.

The layout is balanced to ensure all critical controls fit comfortably in the 900 × 700 default desktop window without requiring unnecessary vertical scrolling.

### 5.5 Radius and elevation

- **16px (`rounded-xl` / `rounded-2xl`):** Spotlight URL input container and modal dialogs.
- **12px (`rounded-lg`):** Surface panels (`.surface-panel`), thumbnail cards, bento-grid modules.
- **8px (`rounded-md`):** Buttons, secondary inputs, resolution chips, dropdown menus.
- **6px (`rounded-sm`):** Window control buttons, small status badges.
- **4px (`rounded-xs`):** Keyboard hints (`.kbd-hint`), miniature indicators.

Surfaces achieve elevation through:
1. **Hairline top specular highlight** (`.surface-panel::before`) creating physical edge reflections.
2. **Translucent borders** (`border border-purple-900/40` or `var(--border-subdued)`).
3. **Subtle directional drops** (`shadow-md`, `shadow-glow-violet`).
4. **Ambient lighting** (`.ambient-glow-purple` top ceiling spotlight and `.noise-overlay`).

------------------------------------------------------------------------

## 6. Application Shell and Frameless Window

### 6.1 Overall layout

The application shell organizes the workbench into a 3-tier desktop layout:
1. **Top Title Bar (`h-11` / 44px)**: Frameless window header with window dragging, brand emblem, live engine status beacon, and window controls.
2. **Center Split Workspace**:
   - **Left Navigation Sidebar (`w-60` to `w-64`)**: Frosted obsidian surface (`bg-obsidian-950/85 backdrop-blur-md border-r border-purple-900/25`), destination navigation with active purple glow borders, badge indicators (`Batch`), theme switch pill ("Obsidian UI" / "Studio Light"), and developer logs button (`>_ Logs`).
   - **Main Workspace Container**: Fluid, scrollable workspace bounded by `max-w-4xl mx-auto w-full pb-8`, with ambient ceiling spotlight (`.ambient-glow-purple`) and noise texture backdrop (`.noise-overlay`).
3. **Persistent Bottom Status Strip (`h-7` / 28px)**: Fixed footer strip (`bg-obsidian-950/90 border-t border-purple-900/30`) with ready status beacon, destination directory path display, and core engine activity indicator.

### 6.2 Custom title bar requirements

The custom title bar (`src/components/ui/TitleBar.jsx`) delivers native desktop control with obsidian styling:
- **Left Region (`no-drag-region`)**:
  - macOS-inspired traffic preview dots: Red (`bg-rose-500/80`), Amber (`bg-amber-500/80`), and Purple (`bg-purple-500/80`).
  - Vertical divider (`w-[1px] bg-purple-900/40`).
  - Branded "H" emblem inside a rounded square with purple-amethyst gradient ring.
  - Application title: `Hermanos Forge` (`text-xs font-semibold text-slate-100`).
  - Release tag pill: `v1.1.0-pro` (`text-[10px] text-purple-300 bg-purple-950/70 border border-purple-700/40 font-mono`).
- **Center Region (`drag-region`)**:
  - Allows natural window dragging across monitors and workspaces.
  - Pill badge: `Engine Active • yt-dlp core` with pulsing violet radar beacon.
- **Right Region (`no-drag-region`)**:
  - Minimize (`Minus`), Maximize/Restore (`Copy`/`Square`), and Close (`X`) buttons.
  - Hover states: Subtle purple wash (`hover:bg-purple-950/40`) for minimize/maximize, destructive crimson (`hover:bg-rose-600 text-white`) for close.
  - Synchronized maximize/restore state listening to `window-maximize-change` IPC events.

### 6.3 Obsidian Navigation Sidebar

The sidebar (`data-purpose="workspace-navigation"`) groups core tools and system controls:
- **Workspace Tools Group**:
  - `Single Media Downloader` (Icon: `Download`)
  - `Mass Clip Stitcher` (Icon: `Scissors`, Badge: `Batch`)
  - `Selective Duration` (Icon: `Film`)
  - `Download History` (Icon: `Clock`, Badge: History count)
  - `Settings & Engine` (Icon: `Settings`)
- **Active Tab Visual Cue**:
  - Glowing active border (`border-purple-500/30 bg-gradient-to-r from-accent-violet/15 via-purple-950/20 to-transparent`).
  - Specular top highlight (`before:bg-gradient-to-r before:via-purple-400/30`).
  - Framer Motion `layoutId="sidebar-active-tab-indicator"` for smooth spring transitions.
- **Bottom Sidebar Controls**:
  - Theme Switcher Button: Toggles between `Obsidian UI` (Moon icon) and `Studio Light` (Sun icon).
  - Developer Logs Launcher: Terminal button with neon cyan `>_` indicator.

### 6.4 Main Workspace

- **Container Constraint**: `max-w-4xl mx-auto w-full pb-8 px-6 sm:px-8` ensures ergonomic eye scan lines on widescreen displays.
- **Atmospheric Depth**: `.noise-overlay` provides subtle cybernetic tactile depth, while `.ambient-glow-purple` casts a soft gradient from the top edge.
- **Form State Preservation**: Switching navigation tabs preserves all entered URLs, clip queues, timeline selections, and download states.

### 6.5 Persistent Bottom Status Strip

The footer (`data-purpose="window-bottom-status-strip"`) provides real-time ambient awareness:
- Left: Live beacon (`Ready to Forge` with neon pulse) and destination path (`Dest: C:\Downloads...`).
- Right: Engine indicator (`Engine: yt-dlp core`) and build version (`Hermanos Forge v1.1.0`).

------------------------------------------------------------------------

## 7. Shared Component Standards

All reusable UI primitives reside in `src/components/ui/` and adhere to strict design token compliance.

### 7.1 Button (`src/components/ui/Button.jsx`)

- **Variants**:
  - `primary`: Linear gradient `from-accent-violet via-accent-purple to-accent-amethyst hover:brightness-110 text-white shadow-glow-violet border border-purple-400/30 before:top-hairline`.
  - `secondary`: `bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] border border-[var(--border-subdued)] hover:border-purple-600/50 shadow-sm`.
  - `outline`: `bg-transparent hover:bg-purple-950/30 text-[var(--text-primary)] border border-[var(--border-strong)] hover:border-purple-500/50`.
  - `ghost`: `bg-transparent hover:bg-purple-950/30 text-[var(--text-secondary)] hover:text-[var(--text-primary)]`.
  - `destructive`: `bg-gradient-to-b from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white shadow-sm border border-rose-500/30`.
  - `accentMuted`: `bg-[var(--accent-muted)] hover:bg-[var(--accent-primary)]/20 text-[var(--accent-neon)] border border-purple-700/50`.
- **Sizes**:
  - `xs`: `h-7 px-2 text-[11px] rounded-[6px] gap-1`
  - `sm`: `h-8 px-2.5 text-xs rounded-[6px] gap-1.5`
  - `md`: `h-9 px-3.5 text-xs rounded-[8px] gap-2`
  - `lg`: `h-11 px-5 text-sm rounded-[10px] gap-2.5 font-semibold`
- **Micro-Interactions**: Framer Motion `whileHover={{ scale: 1.01 }}` and `whileTap={{ scale: 0.98 }}` for tactile desktop responsiveness.

### 7.2 Input (`src/components/ui/Input.jsx`)

- **Appearance**: `bg-[var(--surface-2)] border border-[var(--border-strong)] text-[var(--text-primary)] rounded-[8px]` with focus halo `focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]`.
- **Hero Spotlight Input**: Integrated command-bar container (`SingleDownloaderView`) with `bg-obsidian-950/90 border-purple-900/40 rounded-xl`, Sparkles beacon, Clear button, Paste link button with `Ctrl+V` shortcut hint, and Enter keybinding (`Enter ↵`).

### 7.3 Select & Segmented Controls (`src/components/ui/Select.jsx`)

- **Dropdown Select**: Obsidian panel surface (`bg-obsidian-900 border-purple-800/40 shadow-xl rounded-lg`) with checkmark indicator for active option.
- **Quick Resolution Chips**: Segmented chips for instant resolution selection: `2160p (4K)`, `1440p (2K)`, `1080p FHD`, `720p HD`, and `Audio Only (MP3)`. Unavailable resolutions are gracefully disabled or dimmed based on probed streams.
- **Format Toggle**: Segmented pill switch between `MP4 (Video + Audio)` and `MP3 (Audio Only)`.

### 7.4 Dialog & Modals (`src/components/ui/Dialog.jsx`)

- **Backdrop**: Semi-transparent black scrim with blur (`bg-black/60 backdrop-blur-sm`).
- **Surface**: Surface panel (`bg-obsidian-900 border border-purple-800/40 rounded-xl shadow-window-frame`) with top specular highlight.
- **Accessibility**: Focus trapping, Escape key dismissal, click outside to close, and return focus to triggering element.

### 7.5 Badge & Status Pill (`src/components/ui/Badge.jsx`)

- **Variants**:
  - `default`: `bg-[var(--surface-2)] text-[var(--text-secondary)] border border-[var(--border-subdued)]`
  - `accent`: `bg-purple-950/70 text-purple-200 border border-purple-700/50 font-semibold`
  - `cyan`: `bg-cyan-950/70 text-cyan-300 border border-cyan-800/50 font-semibold`
  - `rose`: `bg-rose-950/70 text-rose-300 border border-rose-800/50 font-semibold`
  - `success`: `bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 font-semibold`
  - `warning`: `bg-amber-950/60 text-amber-300 border border-amber-800/40 font-semibold`
  - `danger`: `bg-rose-950/70 text-rose-300 border border-rose-800/50 font-semibold`
  - `info`: `bg-cyan-950/60 text-cyan-300 border border-cyan-800/40 font-semibold`
  - `outline`: `bg-transparent text-[var(--text-secondary)] border border-[var(--border-strong)]`

### 7.6 Progress (`src/components/ui/Progress.jsx`)

- **Indeterminate Mode**: Animated sweep across bar with `via-accent-violet`.
- **Determinate Mode**: Real percentage fill with gradient `from-accent-violet via-purple-500 to-accent-neon` with soft glow leading edge (`shadow-glow-violet`).
- **Telemetry Readout**: Live download speed (`MB/s`), elapsed time, and ETA displayed alongside the progress bar.

### 7.7 Card & Surface Panel (`src/components/ui/Card.jsx`)

- **`.surface-panel`**: Obsidian surface with physical realism top specular highlight (`.surface-panel::before`) created via `linear-gradient(90deg, transparent, rgba(168, 85, 247, 0.25), transparent)`.
- **`.noise-overlay`**: Micro-dot background pattern (`radial-gradient(rgba(168, 85, 247, 0.04) 1px, transparent 0)`).

### 7.8 Tooltip & Keyboard Hints (`.kbd-hint`)

- Keyboard shortcut hints use the `.kbd-hint` utility class: monospace font, `bg-[var(--surface-2)]`, subtle border, and 10px bold text.

### 7.9 Toasts and inline feedback

Use toasts (`react-hot-toast`) for brief, dismissible operational notices (e.g., "Copied to clipboard"). Use inline alerts and badges for permanent feedback, validation errors, and authentication warnings.

### 7.10 Motion and Ambient Lighting

- Short, physical transitions with `framer-motion` (durations: 150ms–250ms).
- Respect `prefers-reduced-motion` media queries.
- Zero layout shift during state changes.

------------------------------------------------------------------------

## 8. Screen Specifications

### 8.1 Single Media Downloader (`src/components/views/SingleDownloaderView.jsx`)

- **Module Header**:
  - Title: `Single Media Downloader` (`font-heading font-bold text-xl`).
  - Badge: `Lossless 4K / 8K HDR` (`text-[10px] text-purple-200 bg-purple-950/70 border border-purple-700/50`).
  - Pipeline Status: `Pipeline: Direct Stream` tag.
- **Spotlight URL Command Bar**:
  - Input container: `bg-obsidian-950/90 border border-purple-900/40 rounded-xl`.
  - Sparkles icon beacon with pulsing purple glow.
  - Monospace URL input with Enter keybinding support (`Enter ↵ to analyze`).
  - Clear button (`X`) when input has text.
  - Paste link button with `Ctrl+V` shortcut hint.
- **Quick Resolution Chips**:
  - Instant selection for `2160p (4K)`, `1440p (2K)`, `1080p FHD`, `720p HD`, and `Audio Only (MP3)`.
  - Auto-detection: Chips reflect available stream heights probed from the backend.
- **Media Preview Card**:
  - 16:9 thumbnail preview with live duration badge (`JetBrains Mono`).
  - Quality badges (`4K`, `FHD`, `HDR`).
  - Video title and channel/author metadata.
- **Advanced Format Options**:
  - Quality dropdown: Lists all available resolutions, FPS, and container extensions (`2160p 60fps [mp4]`).
  - Format toggle: `MP4` (Video + Audio) vs. `MP3` (Audio Only).
- **Destination & Actions**:
  - Output folder row with folder icon, current path, Browse button, and Reveal in Explorer action.
  - Primary Action Button: "Download Video (4K)" / "Download Audio (MP3)" with violet-amethyst gradient and glow effect.
  - Secondary Action Button: "Convert Local MP4 to MP3".
- **Real-Time Progress & Telemetry**:
  - Live percentage readout, progress bar with glowing leading edge, download speed, and Cancel button.
- **Inline Playlist Notification**:
  - Dedicated notification card when a playlist URL is detected.
  - Video count display and explicit "Select Videos" button opening `PlaylistSelectorModal`.

### 8.2 Mass Clip Downloader & Stitcher (`src/components/views/MassClipView.jsx`)

- **Module Header**:
  - Title: `Batch Clip Downloader & Stitcher`.
  - Badge: Clip queue counter (`X Clips Queued`).
  - Batch Actions: `Paste Batch` (parses clipboard URLs), `Add URL`, and `Clear`.
- **Clip Queue Cards**:
  - Individual cards per URL with index number, drag handle styling, and URL input field.
  - Real-time status badge per clip: `Queued` (Clock), `Downloading` (Spinning loader), `Done` (CheckCircle), `Error` (AlertCircle), `Canceled` (XCircle).
  - Delete row button per clip.
- **Stitch Automation**:
  - Toggle switch: "Stitch into single video via FFmpeg concat".
  - Output directory verification.
- **Footer Controls**:
  - Primary "Start Batch Download" / "Start Stitching" button with glow shadow.
  - Cancel button for aborting active batch operations.
  - Queue persistence: State preserved in `mass-clips` localStorage key.

### 8.3 Selective Duration Downloader (`src/components/views/SelectiveDurationView.jsx`)

- **Module Header**:
  - Title: `Selective Duration Downloader` with duration trimming description.
- **URL Inspection**:
  - Source URL input with "Fetch Details" inspection button.
  - Video preview strip with title, duration, and thumbnail.
- **Interactive Dual-Handle Timeline**:
  - Time ruler with draggable Start and End slider handles.
  - Timecode display: High-precision start and end readouts in `JetBrains Mono` (`00:01:23.450`).
  - Zoom controls: Zoom In / Zoom Out buttons for frame-accurate timeline scrubbing.
- **Multi-Clip Segment Queue**:
  - "Add Segment" action allowing multiple trimmed clips from the same source video.
  - Segment table: Start time, End time, Duration, Lock/Exclude toggle, and Delete action.
- **Cutting Controls**:
  - Precise Cut Toggle: Enables FFmpeg re-encoding (`-c:v libx264 -preset fast -c:a aac`) for exact keyframe boundaries.
  - "Download All Clips" primary action with live download progress.

### 8.4 Download History (`src/components/views/HistoryView.jsx`)

- **Module Header**:
  - Title: `Download History` with item counter.
  - Clear History action opening destructive confirmation dialog.
- **Filtering & Search**:
  - Filter Tabs: `All`, `MP4`, `MP3`, `Clips`, `Stitched`.
  - Search input with real-time title and URL filtering.
- **Media History Cards**:
  - File format badge (`MP4`, `MP3`, `Clip`, `Stitch`).
  - Title, duration, file path, and relative timestamp.
  - Actions: "Open in Folder" (`shell.showItemInFolder`), "Copy Link", and "Remove from History".
- **Empty State**:
  - Tactical empty state with download icon, helpful guidance, and link back to Downloader.

### 8.5 Settings & Engine Diagnostics (`src/components/views/SettingsView.jsx`)

- **Bento-Grid Module Architecture**:
  - **Theme Selection Card**: Side-by-side preview tiles for `Obsidian Dark` (default) and `Studio Light`.
  - **Output Destination Card**: Current path display, Browse directory button, and Open in Explorer action.
  - **Cookie Authentication Card**: Current browser indicator, sync status (`Active`, `Stale`, `Missing`), last sync date, and "Configure Cookies" button opening `CookieWizardModal`.
  - **System Diagnostics Probes**: Live health cards for Python engine runtime, Bundled FFmpeg, FFprobe, and yt-dlp core, with a "Refresh Probes" button.
  - **Developer Tools Card**: "Open Developer Logs" button launching the auxiliary logs window.

### 8.6 Modals & Dialogs (`src/components/modals/`)

All modals use the shared `Dialog` primitive with frosted obsidian backdrops:
- **`CookieWizardModal`**: Guided browser cookie extraction with 1-click Firefox sync and Chromium extension Netscape drag-and-drop file import.
- **`PlaylistSelectorModal`**: Video checklist dialog for selective downloading from playlists.
- **`OutputFolderModal`**: Directory path verification dialog.
- **`ClearHistoryModal`**: Destructive confirmation modal for clearing download records.
- **`CancelConfirmModal`**: Confirmation modal before aborting in-flight download or stitching operations.

### 8.7 Developer Logs Window (`src/LogsWindow.jsx`)

- Dedicated auxiliary window streaming real-time stdout/stderr lines from `backend.py`.
- Monospace font (`JetBrains Mono`), dark obsidian console background (`#09090C`), and color-coded prefix tags (`PROGRESS:`, `STATUS:`, `SUCCESS:`, `ERROR:`, `AUTH_ERROR:`).

------------------------------------------------------------------------

## 9. Theme Behavior

### 9.1 Initial theme

On fresh installation, Hermanos Forge defaults to **Dark Mode (Obsidian Forge Media Suite)**.

### 9.2 Dual-Theme Support

- **Obsidian Dark (Default)**: Deep obsidian background (`#09090C`), violet accents (`#9D4EDD`), and neon status beacons.
- **Obsidian Slate Light**: Slate pearl canvas (`#F8F7FA`), white panels (`#FFFFFF`), deep violet accents (`#8433C4`), and high-contrast status colors.
- **Persistence**: Theme preference is persisted in the `theme` localStorage key (`'dark'` | `'light'`).
- **Zero Flash**: Pre-mount theme initialization script in `index.html` prevents white screen flashes during application launch.


------------------------------------------------------------------------

## 10. Accessibility and Interaction Requirements

-   All interactive controls must be keyboard reachable.
-   Use visible focus indicators.
-   Maintain logical focus order.
-   Return focus appropriately after closing dialogs.
-   Provide accessible names for icon buttons and custom window
    controls.
-   Use labels for inputs and descriptive text for validation.
-   Do not communicate state by color alone.
-   Respect reduced-motion preferences where practical.
-   Ensure disabled and loading states are understandable.
-   Keep hit targets comfortably usable in a desktop environment.
-   Avoid hover-only essential actions.
-   Ensure custom controls preserve appropriate keyboard interaction.
-   Verify that title-bar drag regions do not intercept buttons or
    inputs.

Accessibility should be built into shared primitives rather than patched
separately on every screen.

------------------------------------------------------------------------

## 11. Responsive Desktop Behavior

Forge is a desktop application, but the user can resize its window.

At the existing 900 × 700 default size:

-   Keep the primary action visible on the Download view whenever
    practical.
-   Keep navigation labels and active state clear.
-   Avoid horizontal overflow in ordinary workflows.
-   Let the selective timeline remain usable without crushing its time
    controls.
-   Reflow mass-clip rows when a table would become too narrow.
-   Keep dialogs within window bounds.
-   Preserve access to footer actions when content scrolls.

At smaller sizes, prioritize essential content and actions rather than
shrinking every control indefinitely. At larger sizes, use additional
space to improve alignment and readability, not to inflate cards
unnecessarily.

------------------------------------------------------------------------

## 12. Motion and State Transitions

Motion should reinforce cause and effect.

Appropriate uses include:

-   Subtle view transitions.
-   Small hover/press feedback.
-   Dropdown and dialog transitions.
-   Progress feedback tied to real operations.
-   Expanding/collapsing secondary diagnostics.

Avoid:

-   Long blocking animations.
-   Large entrance animations on every card.
-   Decorative continuous movement.
-   Motion that causes layout jumps.
-   Resetting queues or clearing inputs after an animation or timeout.
-   Animations that make status text or controls difficult to track.

Critical operations must remain responsive while transitions occur.

------------------------------------------------------------------------

## 13. Behavior Change Policy

Separate visual changes from workflow changes.

### Safe visual changes, provided behavior is preserved

-   Replacing glassmorphic surfaces with solid theme-aware surfaces.
-   Standardizing spacing, typography, radii, and button styles.
-   Improving layout and information hierarchy.
-   Making existing actions visible by default.
-   Improving focus indicators, contrast, labels, and responsive layout.
-   Restyling existing progress and status feedback without changing its
    source.

### Changes requiring explicit approval and regression testing

-   Changing when URL inspection is triggered.
-   Changing playlist modal behavior.
-   Removing the mass-clip auto-reset timer.
-   Adding history search, new filters, or adjustable pagination.
-   Adding new timeline zoom controls or changing zoom behavior.
-   Changing cancellation, confirmation, or close-window behavior.
-   Changing theme options or persistence format.
-   Changing queue state transitions, default stitch behavior, or output
    selection.
-   Changing metadata-fetch timing or retry behavior.

The playlist detection card, default Dark mode, and custom frameless title bar (`frame: false` in `electron/main.cjs` and `TitleBar.jsx`) are approved and fully implemented in `dev`.

No behavior change may silently alter IPC contracts, backend processing,
persisted data formats, or user-entered work.

------------------------------------------------------------------------

## 14. Implementation Guidance & Milestone Status

### Current Status: Shipped in `dev` (Milestone v1.1.0-pro)

The Obsidian Forge Media Studio redesign has been implemented and committed to the repository (commit `b885179`):

- **Phase 1 (Foundations)**: Obsidian and accent color scales, dark/light token mappings, Space Grotesk / DM Sans / JetBrains Mono typography stacks, and ambient utilities (`.surface-panel`, `.noise-overlay`, `.ambient-glow-purple`, `.studio-ambient-bg`).
- **Phase 2 (Shell & Primitives)**: Frameless title bar with window controls and traffic lights, obsidian navigation sidebar, bottom status strip, Button, Input, Select, Badge, Progress, Card, and Dialog primitives.
- **Phase 3 (View Modernization)**:
  - `SingleDownloaderView`: Spotlight command bar, quick chips, 16:9 rich preview, custom quality select, format toggle, progress meter.
  - `MassClipView`: Batch clipboard paste, clip queue cards, stitch toggle, status badges.
  - `SelectiveDurationView`: Dual-handle timeline ruler, high-precision monospace timecodes, zoom controls, multi-clip queue.
  - `HistoryView`: Filter tabs, real-time search, file revelation in Explorer.
  - `SettingsView`: Bento-grid layout, theme preview tiles, cookie status, diagnostic probes.
- **Phase 4 (Quality Verification)**: Clean build (`vite build`), zero ESLint errors and warnings (`npm run lint`), and runtime integrity preserved.

------------------------------------------------------------------------

## 15. Acceptance Checklist

### Visual & Brand Identity
- [x] Obsidian Forge Media Studio design language applied consistently across all screens.
- [x] Dark mode (`#09090C` canvas) is the fresh-install default.
- [x] Light mode (`#F8F7FA` canvas) fully styled with high contrast.
- [x] Electric Violet, Amethyst, and Neon Purple accents used consistently.
- [x] Surface panels use top specular highlights (`.surface-panel::before`).
- [x] Typography uses Space Grotesk (headings), DM Sans (body), and JetBrains Mono (data).
- [x] Ambient ceiling glow and micro-dot noise overlay enhance atmosphere.

### Frameless Window & Chrome
- [x] Window drag regions function across monitors.
- [x] Minimize, Maximize/Restore, and Close buttons function with proper hover states.
- [x] TitleBar features traffic preview dots, branded "H" mark, and `v1.1.0-pro` tag.
- [x] Engine status beacon pulses with neon violet ping animation.
- [x] Bottom status strip displays destination directory and engine status.

### Media Workflows
- [x] Single MP4 video download with resolution selection.
- [x] Single MP3 audio download.
- [x] Local MP4-to-MP3 conversion.
- [x] Inline playlist detection with explicit selection modal.
- [x] Mass clip batch downloading and FFmpeg concat stitching.
- [x] Selective timeline duration trimming with multi-clip queue.
- [x] Download history with search, filtering, and Explorer file reveal.
- [x] Cookie wizard for browser authentication.
- [x] System diagnostics probes and real-time developer logs.

### Technical Integrity
- [x] Electron IPC contracts and preload bridge preserved.
- [x] localStorage schemas preserved (`download-history`, `global-outputDir`, `cookie-browser`, `mass-clips`, `theme`).
- [x] Zero ESLint errors and zero warnings (`npm run lint`).
- [x] Clean production bundle build (`npm run build`).


------------------------------------------------------------------------

## 16. Resolved Architectural Decisions & Implementation Notes

The implementation in `dev` (commit `b885179`) resolved the earlier architectural questions as follows:

1. **Custom Frameless Window Controls**:
   - Implemented via `frame: false` in `electron/main.cjs`.
   - IPC channels in `electron/preload.cjs`: `minimizeWindow`, `maximizeWindow`, `closeWindow`, `isMaximizedWindow`, and `onMaximizedChange`.
   - Styled and controlled via `src/components/ui/TitleBar.jsx` with dragging regions (`drag-region` / `no-drag-region`) and synchronized maximize/restore state.

2. **Theme Application & CSS Variables**:
   - The active theme is applied via both `data-theme` and `.dark`/`.light` classes on `document.documentElement`.
   - Pre-mount initialization script in `index.html` inspects `localStorage.getItem('theme')` to prevent cold-boot flash.
   - All components consume Obsidian Forge CSS variables (`var(--bg-base)`, `var(--surface-1)`, `var(--surface-2)`, `var(--accent-primary)`, etc.) or configured Tailwind tokens.

3. **Playlist Metadata & Inline Detection**:
   - Handled by `window.electronAPI.inspectUrl(url)`, which resolves `{ isPlaylist, entries, title }`.
   - If a playlist is detected, `SingleDownloaderView` renders an inline alert card with video count and a trigger to open `PlaylistSelectorModal`.

4. **Cookie Authentication Flow**:
   - Implemented in `src/components/modals/CookieWizardModal.jsx`.
   - Supports 1-click automatic Firefox cookie extraction (`yt_dlp.cookiejar`) and Chromium Netscape `cookies.txt` file drag-and-drop.
   - Domain whitelisting strictly filters out all cookies except `.youtube.com` and `.google.com`.

5. **Queue State Preservation & Stitching**:
   - Mass clip state is persisted to `localStorage` under `mass-clips`.
   - No auto-wipe is performed on completion; user inputs, queue items, and download states are preserved until explicitly cleared.

6. **View Decomposition**:
   - Cleanly extracted into dedicated containers under `src/components/views/`: `SingleDownloaderView`, `MassClipView`, `SelectiveDurationView`, `HistoryView`, and `SettingsView`.
   - Shell coordination and tab switching remain in `src/App.jsx`.

7. **Shared UI Primitives**:
   - Implemented 10 source-owned primitives in `src/components/ui/` (`Button`, `Input`, `Select`, `Dialog`, `Tabs`, `Badge`, `Progress`, `Tooltip`, `Card`, `TitleBar`) using Tailwind 3.4 and Framer Motion, avoiding third-party UI framework bloat.

------------------------------------------------------------------------

## 17. Final Rule

**Forge should look new while remaining recognizably and reliably
Forge.**

Prioritize clarity, control, consistency, and technical reliability.
Keep the interface compact enough for a desktop utility, make important
actions discoverable, respect user work, and preserve the existing
application contracts.

When a design choice conflicts with reliable existing behavior, preserve
behavior and propose the change separately for approval.
