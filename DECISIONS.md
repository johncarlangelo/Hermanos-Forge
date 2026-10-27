# Hermanos Forge — Architectural Decision Records (ADRs)

This document records key technical, architectural, and design decisions made throughout the evolution of **Hermanos Forge**, detailing their context, rationale, and consequences.

---

## Index of Decisions

- [ADR-001: Two-Process Architecture (Electron + Standalone Python)](#adr-001-two-process-architecture-electron--standalone-python)
- [ADR-002: PyInstaller Compilation for Zero-Dependency End-User Distribution](#adr-002-pyinstaller-compilation-for-zero-dependency-end-user-distribution)
- [ADR-003: Windows Subprocess Console Suppression (`0x08000000`)](#adr-003-windows-subprocess-console-suppression-0x08000000)
- [ADR-004: Local Bundling of FFmpeg Binaries & Shared DLLs](#adr-004-local-bundling-of-ffmpeg-binaries--shared-dlls)
- [ADR-005: Line-Prefixed stdout Streaming Protocol for IPC](#adr-005-line-prefixed-stdout-streaming-protocol-for-ipc)
- [ADR-006: Local-Only Cookie Storage with Strict Domain Whitelisting](#adr-006-local-only-cookie-storage-with-strict-domain-whitelisting)
- [ADR-007: Tailwind CSS Design System & Dark Mode Primacy](#adr-007-tailwind-css-design-system--dark-mode-primacy)
- [ADR-008: Native Splash Window for Cold-Boot Mitigation](#adr-008-native-splash-window-for-cold-boot-mitigation)

---

### ADR-001: Two-Process Architecture (Electron + Standalone Python)

* **Status**: Accepted
* **Date**: 2026-06-28

#### Context
Initial versions of Hermanos Forge utilized a Python Tkinter GUI. As UI/UX requirements grew (timeline scrubbers, responsive dark mode, glassmorphism, fluid animations), Tkinter became a bottleneck. Node.js media scrapers lack the robust extractor ecosystem and constant updates that `yt-dlp` provides in Python.

#### Decision
Decouple the application into two dedicated runtimes:
1. **Frontend / Desktop Shell**: Electron + React 19 + Tailwind CSS + Framer Motion.
2. **Backend Engine**: Python 3 leveraging `yt-dlp` and FFmpeg.

#### Consequences
- **Positive**: State-of-the-art UI capabilities while retaining the world's most resilient media extraction engine.
- **Negative**: Requires inter-process communication (IPC) and separate compilation pipelines.

---

### ADR-002: PyInstaller Compilation for Zero-Dependency End-User Distribution

* **Status**: Accepted
* **Date**: 2026-06-28

#### Context
End users downloading the Windows installer cannot be expected to install Python, configure environment variables, or run `pip install`.

#### Decision
Compile `backend.py` into a standalone binary (`dist_backend/backend.exe`) via PyInstaller, bundled as an `extraResource` inside the NSIS installer. In development mode, Electron falls back to executing the system `py` command on `backend.py` for instant iteration.

#### Consequences
- **Positive**: Zero-configuration experience for end users. No external Python installation required.
- **Negative**: Adds a compilation step (`npm run package-backend`) to the build pipeline and increases final installer size.

---

### ADR-003: Windows Subprocess Console Suppression (`0x08000000`)

* **Status**: Accepted
* **Date**: 2026-07-02

#### Context
Whenever Python or yt-dlp invoked FFmpeg or external subprocesses on Windows, black Command Prompt windows flashed across the user's screen.

#### Decision
Monkey-patch `subprocess.Popen` in `backend.py` to unconditionally apply `creationflags = 0x08000000` (`CREATE_NO_WINDOW`) when running on `nt` platforms.

#### Consequences
- **Positive**: Completely eliminates terminal window flashing during downloads, format conversions, and clip cuts.
- **Negative**: Suppressed processes must stream stdout/stderr through pipes rather than relying on terminal visibility.

---

### ADR-004: Local Bundling of FFmpeg Binaries & Shared DLLs

* **Status**: Accepted
* **Date**: 2026-06-29

#### Context
Relying on system PATH for `ffmpeg.exe` resulted in frequent failure on end-user machines where FFmpeg was not installed. Furthermore, partial builds missing required DLLs (e.g. `avcodec.dll`, `avutil.dll`) failed silently.

#### Decision
Bundle complete FFmpeg and FFprobe executables alongside all required shared `.dll` libraries inside the `ffmpeg/` folder. Electron dynamically calculates the absolute path to this folder and passes it explicitly to `backend.py` via `--ffmpeg-path`.

#### Consequences
- **Positive**: Guaranteed availability of FFmpeg across all installations without touching system PATH.
- **Negative**: Increases installer footprint by ~70MB.

---

### ADR-005: Line-Prefixed stdout Streaming Protocol for IPC

* **Status**: Accepted
* **Date**: 2026-06-28

#### Context
Electron needs real-time progress, status updates, metadata, and error details from the Python process. WebSockets or local HTTP servers introduce port conflict risks, firewall warnings, and security overhead.

#### Decision
Use standard stdout/stderr unbuffered line streaming. All output from `backend.py` follows a strict prefix contract (`PROGRESS:`, `STATUS:`, `SUCCESS:`, `ERROR:`, `AUTH_ERROR:`, `CLIP:`, `FORMATS:`, `METADATA:`, `INSPECT:`).

#### Consequences
- **Positive**: Zero networking overhead, no port collisions, cross-platform stability.
- **Negative**: Unprefixed `print()` statements break parsing; strict logging discipline is mandatory.

---

### ADR-006: Local-Only Cookie Storage with Strict Domain Whitelisting

* **Status**: Accepted
* **Date**: 2026-08-19

#### Context
Age-restricted and private videos require authentication cookies. Users exporting Netscape cookie files often include sensitive sessions (banking, email, social networks).

#### Decision
1. Persist cookies strictly within local operating system storage (`%AppData%\Hermanos Forge\cookies.txt`).
2. Implement a strict parser in `electron/main.cjs` that inspects incoming files and discards every cookie entry except `.youtube.com` and `.google.com`.
3. Never send cookie data or download history to any remote server or analytics endpoint.

#### Consequences
- **Positive**: Protects user privacy and eliminates the security risk of storing unrelated session tokens.
- **Negative**: Users must periodically re-export cookies as YouTube session tokens expire.

---

### ADR-007: Tailwind CSS Design System & Dark Mode Primacy

* **Status**: Accepted
* **Date**: 2026-06-28

#### Context
Media workbench tools are predominantly used in dark environments for visual clarity during video trimming and downloading.

#### Decision
Adopt `#09090B` (deep charcoal black) as the primary background aesthetic, paired with translucent glassmorphic surfaces (`rgba(255, 255, 255, 0.035)`), hairline borders (`rgba(255, 255, 255, 0.06)`), and electric blue accents (`#3B82F6`). Define these in CSS custom properties and map them through `tailwind.config.js`.

#### Consequences
- **Positive**: Distinct, modern, and unified visual identity matching the specifications in `DESIGN.md`.
- **Negative**: Requires strict adherence to design tokens to avoid arbitrary utility sprawl.

---

### ADR-008: Native Splash Window for Cold-Boot Mitigation

* **Status**: Accepted (Planned for v1.1.0)
* **Date**: 2026-07-01

#### Context
During initial cold boot, Electron takes 2–3 seconds to initialize Chromium, load bundles into RAM, and mount React, resulting in a brief white flash. An in-app React spinner cannot solve this because the DOM has not yet mounted.

#### Decision
Instantiate a small, frameless native splash window loading a lightweight `splash.html` immediately upon `app.whenReady()`. Load the main window hidden (`show: false`) and swap them on `ready-to-show`.

#### Consequences
- **Positive**: Eliminates cold-boot white flashes and delivers instantaneous visual feedback.
- **Negative**: Requires lifecycle management between two `BrowserWindow` instances in `electron/main.cjs`.
