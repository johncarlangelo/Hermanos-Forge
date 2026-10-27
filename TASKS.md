# Hermanos Forge — Task Board & Project Backlog

This document tracks active engineering priorities, open GitHub issues, near-term enhancements, and historical milestones for **Hermanos Forge**.

---

## 1. Active & Immediate Work

| Priority | Task | Target Branch | Status | Description |
|---|---|---|---|---|
| **P0** | Video Quality Fetch & 403 Bypass | `bug-fix/video-quality-fetch` | In Review | Switch YouTube player client to `['web_embedded', 'web']` to resolve 403 Forbidden errors when extracting formats. Verify format list rendering in UI and open PR to `dev`. |
| **P1** | Frontend ESLint Cleanup | `dev` / bugfix | Pending | Eliminate 9 ESLint errors in [src/App.jsx](file:///d:/Comsci%20things/Python/Quick%20Tools%20Project/Hermanos%20Forge/src/App.jsx), [src/MassClipDownloader.jsx](file:///d:/Comsci%20things/Python/Quick%20Tools%20Project/Hermanos%20Forge/src/MassClipDownloader.jsx), and [src/SelectiveDownloader.jsx](file:///d:/Comsci%20things/Python/Quick%20Tools%20Project/Hermanos%20Forge/src/SelectiveDownloader.jsx) (unused imports, unused catch vars, synchronous `setState` in effect). |

---

## 2. GitHub Issues Backlog

| Issue | Title | Priority | Labels | Proposed Solution |
|---|---|---|---|---|
| **[#4](https://github.com/johncarlangelo/Hermanos-Forge/issues/4)** | Toast notification clicks open file directory | Low | `enhancement`, `nice to have` | Update toast callback to trigger `shell.showItemInFolder(filePath)` on click so users are taken directly to the downloaded file. |
| **[#10](https://github.com/johncarlangelo/Hermanos-Forge/issues/10)** | Security assurance and VirusTotal results in README | Mid | `documentation`, `security` | Add a dedicated security section in [README.md](file:///d:/Comsci%20things/Python/Quick%20Tools%20Project/Hermanos%20Forge/README.md) addressing Windows SmartScreen warnings on unsigned binaries, accompanied by VirusTotal scan verification. |
| **[#11](https://github.com/johncarlangelo/Hermanos-Forge/issues/11)** | Startup loading progress bar / Splash screen | Mid | `enhancement`, `performance` | Add a native, lightweight `splash.html` window during cold boot to eliminate white screen flashes before React mounts. Swap on `ready-to-show`. |
| **[#13](https://github.com/johncarlangelo/Hermanos-Forge/issues/13)** | Custom frameless window and title bar | Low | `enhancement`, `nice to have` | Set `frame: false` on `BrowserWindow`, build a custom React `CustomTitleBar.jsx` with window controls (minimize/maximize/close) and `-webkit-app-region: drag/no-drag`. |
| **[#18](https://github.com/johncarlangelo/Hermanos-Forge/issues/18)** | Dynamic Island for background jobs | Low | `enhancement`, `nice to have` | Implement a persistent Dynamic Island component to display background progress and allow multitasking across tabs during downloads. |
| **[#20](https://github.com/johncarlangelo/Hermanos-Forge/issues/20)** | Video playback and preview | Mid | `enhancement`, `nice to have` | Integrate [Vidstack](https://vidstack.io/) with the YouTube IFrame API in [SelectiveDownloader.jsx](file:///d:/Comsci%20things/Python/Quick%20Tools%20Project/Hermanos%20Forge/src/SelectiveDownloader.jsx) for visual timeline scrubbing and start/end clip verification. |
| **[#22](https://github.com/johncarlangelo/Hermanos-Forge/issues/22)** | Gemini watermark remover | Low | `enhancement` | Integrate [GeminiWatermarkTool](https://github.com/allenk/GeminiWatermarkTool) CLI to remove Google flow/nano banana watermarks from images and videos. |

---

## 3. Future Roadmap & Ideas

- [ ] **Multi-platform build targets**: Explore macOS and Linux packaging once Windows stability benchmarks are met.
- [ ] **Multi-site preset configurations**: Tailored extraction presets for TikTok, Twitter/X, and Instagram media.
- [ ] **Audio Metadata Tagging**: Automatic ID3 tag injection (artist, album, thumbnail artwork) for MP3 downloads.
- [ ] **Batch Queue Manager**: Global multi-item download queue with concurrency controls, pauses, and re-ordering.

---

## 4. Completed Milestones

- [x] **Browser Cookie Authentication Wizard** (PR #23, Issue #15): 1-click Firefox sync, Netscape file drag-and-drop import, local domain sanitization.
- [x] **Selective Duration Downloader** (PR #19, PR #21, Issue #9): Interactive clip timeline, multi-clip batch downloading, precise FFmpeg cutting.
- [x] **Selective Playlist Download** (PR #16, Issue #6): Playlist URL inspection with multi-video checklist dialog.
- [x] **Mass Clip Downloader & Developer Logs** (PR #12, PR #14): Sequential batch downloading, FFmpeg concat stitching, and real-time logs window.
- [x] **Terminal Flash Elimination** (Issue #3): Windows `creationflags = 0x08000000` applied to all subprocesses.
- [x] **Production FFmpeg & Python Pathing** (PR #2, Issue #1): Dynamic binary path resolution in packaged environments.
