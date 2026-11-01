# Hermanos Forge — Development Progress & Release Log

This document chronicles historical releases, merged capabilities, active sprint milestones, and forward momentum for **Hermanos Forge**.

---

## 1. Project Status Dashboard

- **Current Version**: `v1.1.0-pro` (In Development)
- **Active Release Branch**: `dev`
- **Active Task Branch**: `dev`
- **Latest Production Release**: `v1.0.1` ([Releases](https://github.com/johncarlangelo/Hermanos-Forge/releases))
- **Engine Status**: Electron 42 + React 19 + Python 3 (yt-dlp + FFmpeg)

---

## 2. Release & Milestone History

### [Unreleased] `v1.1.0` / `v1.1.0-pro` — Obsidian Forge Media Studio UI Redesign & Architecture Modernization
- **Studio Workbench 3-Zone Spatial Architecture (Branch `test/subframe-mcp`)**:
  - Implemented the complete structural departure from the old 5 stacked card tabs into a professional DAW/NLE studio layout:
    1. **Left Activity Dock (`ActivityDock.jsx`)**: Sleek vertical tool dock (`w-16`) with Forge brand mark, primary studio tools (Media Workbench, Multi-Track Stitcher, Timeline Trimmer), utility drawers (History Ledger, Studio Settings), Cookie Auth status capsule, destination folder picker, and Inspector toggle (`Ctrl+I`).
    2. **Center Stage (The Studio Canvas)**:
       - **Header: Global Spotlight / Command Bar (`CommandBar.jsx`)**: `Ctrl+K` hotkey listener, instant clipboard paste button, URL stream detection pills, playlist detection counter, and breadcrumb navigation.
       - **Main Viewport**: Rich, interactive canvas stage for media cards, batch sequence blocks, visual waveform bed, and history ledger.
       - **Bottom Dock: Persistent Studio Timeline Ruler (`TimelineRuler.jsx`)**: Interactive start/end trim handles with minimum gap clamping, draggable playhead scrubber, transport scrub controls, zoom scrubbers (`-`, `100%`, `+`), calibrated timecode ticks, and sequence duration tallies.
    3. **Right Inspector & Telemetry Rail (`InspectorRail.jsx`)**: Collapsible panel (`w-80`/`w-84`, toggled via `Ctrl+I`) housing stream format toggles (MP4 Video / MP3 Master), resolution selectors, live stream codec chips (`H.264`, `AAC 320k`, `60 FPS`), output destination, speed gauges with dynamic level bars, ETA countdown card, dual transfer progress bar, live terminal console stream, and primary glowing "Forge Media Stream" action button.
  - Retained 100% Electron IPC compatibility (`window.electronAPI`, `window.stitchAPI`), full form state preservation in DOM across tab switches, 0 ESLint errors/warnings, and passing unit test suite (`npm test`).
- **Subframe Studio Precision Redesign (Branch `test/subframe-mcp`)**:
  - Full precision DAW studio redesign utilizing Subframe MCP server and motion patterns (`filmstrip-scrubber`, `cue-scrubber`, `tool-call-stack`, `activity-capsule`, `schedule-ripple`, `queue-reorder`, `region-splice`).
  - TitleBar & Frameless Header: Dynamic studio breadcrumbs (`STUDIO / WORKBENCH / SINGLE STREAM`), live pulse engine diagnostics beacon (`ENGINE ACTIVE • yt-dlp core`), and tactile window controls.
  - Studio Navigation Sidebar: Fluid active blade indicators, keyboard shortcuts `Ctrl+1` through `Ctrl+5` (`⌘1`–`⌘5` pills), live Cookie Auth Status Dock capsule, and storage path quick trigger.
  - Single Downloader Workbench: High-density Media Command Bar, live download telemetry HUD (transfer speed meter, ETA countdown, byte tracker, stream container tag), resilient yt-dlp telemetry parsing (`%` and `MiB` size matches), and expandable tool-call terminal log stack.
  - Mass Clip Stitcher Studio: Proportional visual timeline sequence preview minimap, drag-and-drop and 1-click accessible reordering (`ChevronUp`/`ChevronDown` buttons and `ArrowUp`/`ArrowDown` keyboard controls via `queue-reorder`), per-clip status badges, zero destructive resets (eliminated 5s auto-wipe timer per `AGENTS.md`), and batch health diagnostics (H.264/AAC concat compatibility).
  - Selective Duration Trimmer: Interactive zoomable timeline ruler (1x–50x), synthetic SVG audio waveform peaks bed (`region-splice`), dual draggable start/end scrubbing handles with pointer capture (`setPointerCapture`) and keyboard arrow nudging, non-clipped floating timecode tooltips, robust multi-format timecode parsing (`h:mm:ss`, `mm:ss`, `ss`), short-video (<5s) boundary support, and bottom "Add Another Segment" button.
  - Download Ledger & Settings: Tabular archive ledger with search query filter, storage usage summary, and updated cookie authentication wizard dialog.
  - Automated Unit Test Suite (`scripts/verify_redesign_logic.test.mjs`): 4 comprehensive tests covering timecode parsing, short video trimmer boundaries, status string telemetry extraction, and clip queue reordering logic. Wired to `npm test`.
  - 100% preservation of Electron IPC channels (`window.electronAPI`, `window.stitchAPI`), form state preservation across tab switches, 0 ESLint errors and 0 warnings, and clean Vite production builds.
- **Obsidian Forge Media Studio Overhaul (Commit `b885179`)**:
  - Upgraded design system to the *Obsidian Forge Media Studio* aesthetic: deep obsidian backgrounds (`#09090C`, `#0E0E13`, `#16161F`), cyber-luminescent violet (`#9D4EDD`), amethyst (`#B5179E`), neon purple (`#C084FC`), and radiant cyan (`#00F0FF`).
  - Added specialized Google Fonts typography: `Space Grotesk` (display & headings), `DM Sans` (body & form UI), and `JetBrains Mono` with `tabular-nums` (durations, bitrates, URLs, and timecodes).
  - Ambient studio lighting & surfaces: `.surface-panel` with top specular edge highlight (`.surface-panel::before`), micro-dot noise overlay (`.noise-overlay`), and top ceiling spotlight (`.ambient-glow-purple`, `.studio-ambient-bg`).
  - Custom Frameless TitleBar: macOS-inspired traffic dots (red, amber, purple), branded "H" mark with gradient ring, release tag (`v1.1.0-pro`), central live engine activity beacon (`Engine Active • yt-dlp core`), and native Windows controls.
  - Persistent Bottom Status Strip (`window-bottom-status-strip`): 28px (`h-7`) footer bar with "Ready to Forge" beacon, active destination directory path, engine status, and release tag.
  - Single Downloader View: Spotlight URL command bar with `Enter ↵` analysis keybinding, Sparkles beacon, paste shortcut hint (`Ctrl+V`), quick resolution chips (4K, 2K, FHD, HD, MP3), 16:9 rich preview with monospace duration pill and quality tags, custom quality select, format toggle, and live progress telemetry.
  - Mass Clip Stitcher: Batch clipboard paste (`Paste Batch`), card-based clip queue with drag-handle styling, live per-clip status badges (Queued, Downloading, Done, Error, Canceled), and FFmpeg concat demuxer stitching.
  - Selective Duration: High-precision timeline ruler with dual draggable start/end handles, zoom controls, and monospace timecode readouts (`00:01:23.450`).
  - Download History & Settings: Filterable media history with Explorer reveal, bento-grid settings with theme preview tiles (Obsidian Dark vs. Studio Light), and live diagnostic probes.
  - Verified with 0 ESLint errors and 0 warnings (`npm run lint`), and clean production build (`vite build`).

- **Browser Cookie Authentication Wizard** (PR #23 / Issue #15):
  - Added multi-step Cookie Wizard modal in `src/App.jsx`.
  - 1-click automatic extraction for Firefox using `yt_dlp.cookiejar`.
  - Drag-and-drop / manual import for Netscape format `cookies.txt` (Chromium extension export).
  - Strict domain sanitization in `electron/main.cjs` discarding everything outside `.youtube.com` and `.google.com`.
  - Auth-wall interception in `backend.py` (`AUTH_ERROR:`) prompting actionable in-app alerts.
  - Added user privacy and cookie lifecycle guidance in `tutorial_disclaimer.md`.
- **YouTube 403 Forbidden Client Spoofing**:
  - Injected Node.js JS challenge solver components (`ejs:github`).
  - Switched player client to `['web_embedded', 'web']` to restore video quality format fetching.

---

### [v1.0.1] — Production Stability & Path Fixes (2026-06-29)
- **FFmpeg & Python Path Resolution** (PR #2 / PR #5 / Issue #1):
  - Resolved missing FFmpeg detection on external Windows machines by bundling binary and shared DLL dependencies under `ffmpeg/`.
  - Replaced ad-hoc system calls with dynamic `process.resourcesPath` calculations in Electron.
  - Added standalone diagnostic verification script `scripts/test_ffmpeg_detect.py`.

---

### [v1.0.0] — Modern Desktop Architecture (2026-06-28)
- Replaced legacy Tkinter prototype with an Electron + React 19 desktop shell.
- Implemented core MP4 (video + audio merging) and MP3 (audio extraction) pipelines.
- Integrated Tailwind CSS v3 dark-mode design system with `.glass-panel` and smooth interactive states.
- Implemented download history tracking with local file location launcher (`shell.showItemInFolder`).

---

### Feature Epics Merged into `dev`

#### 1. Selective Duration Downloader (PR #19, PR #21 / Issue #9)
- Visual interactive timeline scrubber with draggable start and end handles.
- Multi-clip batch queue supporting individual lock/exclude controls.
- Precise cutting mode using FFmpeg re-encoding for clean keyframe cuts.
- Dynamic progress bar parsing FFmpeg stderr output in real time.

#### 2. Selective Playlist Extraction (PR #16 / Issue #6)
- URL inspection mode (`inspect_url`) identifying playlist links before initiating downloads.
- Playlist inspection modal allowing granular selection of specific tracks/videos.
- Individual progress tracking and detection of private/unavailable playlist items.

#### 3. Mass Clip Stitching & Developer Logs (PR #12, PR #14 / Issue #12)
- Mass Clip Downloader interface for sequential multi-source downloading.
- Automated video concatenation using FFmpeg concat demuxer (`--action stitch_clips`).
- Developer Logs window (`src/LogsWindow.jsx`) streaming real-time stdout lines directly from the backend engine.

#### 4. Terminal Flash Elimination (Issue #3)
- Windows subprocess monkey-patch applying `creationflags = 0x08000000` (`CREATE_NO_WINDOW`) across all Python child processes and FFmpeg wrappers.

---

## 3. Sprint Roadmap to `v1.1.0` GA

- [ ] Complete validation of `bug-fix/video-quality-fetch` and merge into `dev`.
- [x] Resolve all ESLint warnings/errors across frontend components (Completed: 0 errors, 0 warnings).
- [ ] Implement cold-boot startup splash window to eliminate white screen delay (Issue #11).
- [ ] Add security assurance and VirusTotal documentation to `README.md` (Issue #10).
- [ ] Package production installer via `npm run electron:build` and tag release `v1.1.0`.
