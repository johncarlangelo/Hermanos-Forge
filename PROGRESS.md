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
- **Subframe Studio Redesign (Branch `test/subframe-mcp`)**:
  - Synthesized designs directly with the newly connected Subframe MCP server across Project `d45f34a03785` and Canvas `3a8dc8e7-ed58-4ccc-bfe1-5e68e69840dd`.
  - Upgraded design tokens to Subframe Studio v2.0: obsidian canvas (`#0b0b10`), sidebar (`#0f0f16`), panels (`#12121a`), elevated cards (`#14141d`), hairline borders (`#1e1e2a`, `#2a2a3a`), and electric violet accents (`#7c3aed`, `#8b5cf6`, `#c4b5fd`).
  - Single Downloader: Command bar with `Input` primitive, adaptive `Enter ↵` shortcut hint, format switches, live telemetry indicators (speed, ETA, stream container), and clipboard-copyable status log.
  - Mass Clip Stitcher: Sequence queue cards with two-digit sequence indexing, batch status pills (ready, processing, queued, error), proportional sequence timeline preview, and drag-and-drop ordering.
  - Selective Duration: Timeline trimmer with Subframe styling, timecode input wells, and tokenized metadata inspectors.
  - Strict preservation of all Electron IPC channels (`window.electronAPI`, `window.stitchAPI`) and working backend mechanics.
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
