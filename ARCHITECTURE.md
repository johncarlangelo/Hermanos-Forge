# Hermanos Forge — System Architecture & Technical Specifications

This document details the architectural layout, cross-process communication protocols, background execution models, and compilation pipelines of **Hermanos Forge**.

---

## 1. High-Level System Architecture

Hermanos Forge is split into two decoupled runtime layers:
1. **Desktop Shell & Presentation Layer** ([Electron](https://www.electronjs.org/) + [React 19](https://react.dev/)): Runs the graphical user interface, manages application lifecycle and window states, performs file-system dialogs, and securely bridges system actions via IPC.
2. **Media Engine Layer** ([Python 3](https://www.python.org/) + [yt-dlp](https://github.com/yt-dlp/yt-dlp) + [FFmpeg](https://ffmpeg.org/)): Executes media downloads, format queries, selective timeline trimming, audio conversion, and clip concatenation.

```
┌────────────────────────────────────────────────────────┐
│                      React 19 UI                       │
│  (src/App.jsx Coordinator, TitleBar, Navigation)      │
│  ├── Views: SingleDownloaderView, MassClipView, etc.  │
│  ├── Modals: CookieWizard, PlaylistSelector, etc.     │
│  └── UI Primitives: Button, Input, Dialog, etc.       │
└───────────────────────────┬────────────────────────────┘
                            │ window.electronAPI / window.stitchAPI
                            ▼
┌────────────────────────────────────────────────────────┐
│              Electron Preload (preload.cjs)            │
│         contextBridge (Secure IPC isolation)           │
│         - Media & Stitch APIs                          │
│         - Window control APIs (minimize/maximize/close)│
└───────────────────────────┬────────────────────────────┘
                            │ ipcRenderer.invoke / ipcRenderer.on
                            ▼
┌────────────────────────────────────────────────────────┐
│              Electron Main (main.cjs)                  │
│       Child process spawner, OS dialogs & helpers      │
│       Frameless window lifecycle & maximize events     │
└───────────────────────────┬────────────────────────────┘
                            │ CLI Arguments & stdout/stderr Line Streaming
                            ▼
┌────────────────────────────────────────────────────────┐
│             Python Backend (backend.py)                │
│       yt-dlp + Bundled FFmpeg / FFprobe Subprocesses   │
└────────────────────────────────────────────────────────┘
```

### UI Component Architecture (Obsidian Forge Media Studio)
- **Application Shell Coordinator** (`src/App.jsx`): Manages active navigation tabs, global state persistence, notifications, default output directory, ambient ceiling spotlight (`.ambient-glow-purple`), noise texture backdrop (`.noise-overlay`), and modal display.
- **Frameless Window Title Bar** (`src/components/ui/TitleBar.jsx`): Draggable header region with traffic preview dots, purple-amethyst gradient brand emblem, pulsing `Engine Active • yt-dlp core` status beacon, release tag (`v1.1.0-pro`), and native Windows minimize/maximize/close controls.
- **Obsidian Navigation Sidebar** (`data-purpose="workspace-navigation"`): Frosted obsidian surface (`dark:bg-obsidian-950/85 backdrop-blur-md border-r border-purple-900/25`) coordinating tool destinations, tab pills with `layoutId` animation, theme toggle ("Obsidian UI" / "Studio Light"), and developer logs launcher (`>_ Logs`).
- **Persistent Bottom Status Strip** (`data-purpose="window-bottom-status-strip"`): Fixed 28px (`h-7`) footer bar displaying destination directory path, live engine beacon, and version tag.
- **Dedicated View Containers** (`src/components/views/`):
  - `SingleDownloaderView.jsx`: Spotlight URL command bar with `Enter ↵` analysis, quick resolution chips (4K, 2K, FHD, HD, MP3), 16:9 rich preview with duration chip, quality dropdown, format toggle, inline playlist prompt, audio/video downloads, and progress telemetry.
  - `MassClipView.jsx`: Batch clipboard paste (`Paste Batch`), card-based clip queue with drag-handle styling, live per-clip status badges (Queued, Downloading, Done, Error, Canceled), and FFmpeg concatenation stitching demuxer.
  - `SelectiveDurationView.jsx`: High-precision duration trimming, interactive dual-handle timeline ruler, monospace timecodes in `JetBrains Mono`, zoom controls, multi-clip segment queue, and precise keyframe cut option.
  - `HistoryView.jsx`: Categorized media download records, format filter tabs (All, MP4, MP3, Clips, Stitched), search filtering, and direct file revelation in Windows Explorer (`shell.showItemInFolder`).
  - `SettingsView.jsx`: Bento-grid layout, theme switcher with Obsidian Dark and Studio Light preview tiles, default destination directory selector, browser cookie authentication card, and live diagnostic system probes.
- **Overlays & Dialogs** (`src/components/modals/`): Modals encapsulated in the shared `Dialog` primitive for accessible focus trapping, keyboard dismissal, and clean state isolation (`CookieWizardModal`, `PlaylistSelectorModal`, `OutputFolderModal`, `ClearHistoryModal`, `CancelConfirmModal`).
- **Design Primitives** (`src/components/ui/`): Button, Input, Select, Dialog, Tabs, Badge, Progress, Tooltip, Card, TitleBar.

---

## 2. Process Separation & Security Model

- **Context Isolation**: `contextIsolation: true` is strictly enforced in `electron/main.cjs`. The React frontend has no direct access to Node.js internals or arbitrary child process execution.
- **Controlled Bridge**: Only explicit methods exposed through `electron/preload.cjs` via `contextBridge.exposeInMainWorld('electronAPI', ...)` and `'stitchAPI'` can trigger system calls.
- **Backend Process Execution**:
  - **In Development**: Electron invokes `py` (or `python`) to run `backend.py` directly with live reload support.
  - **In Production**: Electron spawns the compiled standalone executable located in `resources/app.asar.unpacked/dist_backend/backend.exe`.

---

## 3. Inter-Process Communication (IPC) & Streaming Protocol

Communication from `backend.py` back to Electron occurs through unbuffered stdout line streaming using structured prefix tags.

> [!IMPORTANT]
> **No Arbitrary `print()`**: Any unstructured `print()` in `backend.py` will corrupt the stdout stream parser in Electron. All output must follow the prefixed protocol.

### Protocol Reference

| Output Prefix | Payload Type | Description | Handled In |
|---|---|---|---|
| `PROGRESS:<float>` | Float (`0.00`–`100.00`) | Real-time download progress percent | `ipcRenderer.on('progress-update')` |
| `STATUS:<string>` | Text message | Informational status (e.g., "Merging video and audio...") | `ipcRenderer.on('status-update')` |
| `SUCCESS:<string>` | File path | Operation succeeded; returns saved output path | Resolves IPC Promise |
| `ERROR:<string>` | Error description | Non-fatal or fatal error; rejects caller Promise | Rejects IPC Promise / emits error |
| `AUTH_ERROR:<string>` | Auth barrier text | Intercepts YouTube sign-in, bot-check, or age-gates | Emits `'auth-error'` to prompt Cookie Wizard |
| `CLIP:<index>:<state>:<title>::<path>` | Delimited string | Mass clip downloader stage update (`queued`, `done`, `error`) | `ipcRenderer.on('stitch-clip-update')` |
| `FORMATS:<json>` | JSON array | Available video heights and resolution options | Resolves `getAvailableFormats` |
| `METADATA:<json>` | JSON object | Video duration, title, formats, extractor details | Resolves `getVideoMetadata` |
| `INSPECT:<json>` | JSON object | Identifies whether URL is a single video or a playlist | Resolves `inspectUrl` |

---

## 4. Media Processing Engine & Dependencies

### 1. Bundled FFmpeg & FFprobe Resolution
- Packaged binaries are bundled inside the `ffmpeg/` directory at the project root (`ffmpeg.exe`, `ffprobe.exe`, and required shared `.dll` files such as `avcodec`, `avformat`, `avutil`, etc.).
- Electron calculates the explicit absolute path to `ffmpeg.exe` and passes it to `backend.py` via the `--ffmpeg-path` command-line argument.
- `fluent-ffmpeg` in the main process and `backend.py` configure their binary locations dynamically using this resolved path.

### 2. Video Codec Transcoding (H.264 Compatibility)
- Certain platforms deliver videos in modern VP9 or AV1 codecs. For maximum Windows media player compatibility, `backend.py` inspects stream codecs using FFprobe:
  - AVC/H.264 streams are multiplexed directly without unnecessary re-encoding (`-c:a copy`).
  - Non-H.264 streams are transcoded in-place to `libx264` (`-preset medium -crf 23`).

### 3. Selective Duration Cutting
- Downloader ranges are passed via `download_ranges` to avoid downloading full files when only partial clips are requested.
- Precise cutting mode forces keyframe alignment and audio re-encoding (`external_downloader_args = {'ffmpeg_o': ['-c:v', 'libx264', '-preset', 'fast', '-c:a', 'aac']}`).

### 4. Clip Concatenation
- The Mass Clip Downloader creates an FFmpeg concat demuxer file listing all downloaded clips sequentially and merges them into a unified `.mp4` container.

---

## 5. Authentication, Cookies & Privacy Pipeline

To download age-restricted, members-only, or private media without exposing user credentials:

```
[Browser / Netscape File]
            │
            ▼
[Drag-and-Drop / File Dialog in React]
            │
            ▼
[Electron Main Process: import-cookies-file]
      ├── 1. Validate Netscape HTTP Cookie File header
      ├── 2. Whitelist Filter: Keep ONLY .youtube.com & .google.com
      └── 3. Save strictly to %AppData%\Hermanos Forge\cookies.txt
            │
            ▼
[Python Backend: apply_cookie_opts]
      ├── Injected via --app-data-path
      ├── YouTube client spoofing ('web_embedded', 'web')
      └── Node.js JS challenge solver ('ejs:github')
```

- **Local Storage Isolation**: Cookies are strictly persisted in the user's local operating system directory (`%AppData%\Hermanos Forge\cookies.txt`).
- **Domain Sanitization**: Non-YouTube/non-Google session cookies (e.g. banking, social) are immediately stripped from memory and never written to disk.
- **Zero Remote Telemetry**: Download queries, URLs, and authentication tokens are never sent to external third-party servers.

---

## 6. Build & Packaging Pipelines

### Step 1: Python Engine Compilation
```powershell
npm run package-backend
```
- Spawns PyInstaller to compile `backend.py` into a self-contained executable at `dist_backend/backend.exe`.
- Includes `--noconsole` and patches Windows `subprocess.Popen` with `creationflags = 0x08000000` (`CREATE_NO_WINDOW`) to eliminate flashing command prompt windows during download operations.

### Step 2: Frontend Bundle
```powershell
npm run build
```
- Vite compiles React 19 JSX, Tailwind CSS tokens, and assets into production-ready static assets in `dist/`.

### Step 3: Electron Builder Distribution
```powershell
npm run electron:build
```
- Combines `dist/`, `electron/`, `dist_backend/`, and `ffmpeg/` (configured in `package.json` under `extraResources`) into an NSIS installer in `dist_electron/`.
