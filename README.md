
<p align="center">
  <img src="src/assets/icon.ico" alt="Hermanos Forge Logo" width="64" />
  <br />
  <br />
  <img alt="GitHub Release" src="https://img.shields.io/github/v/release/johncarlangelo/Hermanos-Forge?style=for-the-badge">

</p>

# <p align="center">Hermanos Forge</p>

A sleek, modern video and audio desktop studio built with Electron + React 19. Download media as **MP4** or **MP3** from thousands of supported websites, select your preferred quality, trim selective durations, stitch clips, and manage your download history — all wrapped in the **Obsidian Forge Media Studio** cybernetic aesthetic with dual-theme support (Obsidian Dark and Studio Light).

---

### 📚 Architecture & Engineering Documentation

For deep technical specifications, design tokens, active tasks, and decision records, refer to:
- 🎨 **Design System & Visual Tokens**: [DESIGN.md](file:///d:/Comsci%20things/Python/Quick%20Tools%20Project/Hermanos%20Forge/DESIGN.md)
- 🤖 **Agent Rules & Engineering Standards**: [AGENTS.md](file:///d:/Comsci%20things/Python/Quick%20Tools%20Project/Hermanos%20Forge/AGENTS.md)
- 🏗️ **Technical Architecture & IPC Protocol**: [ARCHITECTURE.md](file:///d:/Comsci%20things/Python/Quick%20Tools%20Project/Hermanos%20Forge/ARCHITECTURE.md)
- 📋 **Task Board & Issue Backlog**: [TASKS.md](file:///d:/Comsci%20things/Python/Quick%20Tools%20Project/Hermanos%20Forge/TASKS.md)
- 📈 **Milestones & Release Progress**: [PROGRESS.md](file:///d:/Comsci%20things/Python/Quick%20Tools%20Project/Hermanos%20Forge/PROGRESS.md)
- 🧠 **Architectural Decision Records (ADRs)**: [DECISIONS.md](file:///d:/Comsci%20things/Python/Quick%20Tools%20Project/Hermanos%20Forge/DECISIONS.md)

---

## ✨ Features

- 📥 **Download videos** as MP4 (with quality selection up to 1440p and 4K)
- 🎵 **Download audio** as MP3
- 🔄 **Convert local MP4 files** to MP3
- ✂️ **Mass Clip Downloader**: Download multiple clips and automatically stitch them into a single video.
- ⏱️ **Selective Duration**: Download specific timeframes of a video with support for multiple clips, batch queueing, and precise cutting.
- 💻 **Developer Logs Window**: View real-time background logs directly within the app.
- 🌐 **Supports thousands of websites** (not just YouTube!). See the full list of [supported sites here](https://github.com/yt-dlp/yt-dlp/blob/master/supportedsites.md).
- 📁 **Download history** with file type tags (MP3/MP4/Mass Clip/Selective Duration)
- 📂 **Open in File Location** button for every history entry

---

## 🖥️ For End Users — Installing the App

> This is how someone on another device installs Hermanos Forge. They **do not** need Python, Node.js, or any command line tools.

### Step 1 — Download the Installer

Get the latest `Hermanos Forge Setup X.X.X.exe` installer file (Located in the folder).

### Step 2 — Run the Installer

Double-click the `.exe` file and follow the on-screen installation steps. That's it!

The installer bundles everything inside:
- ✅ The app UI
- ✅ The Python backend (compiled to a single `.exe`, no Python needed)
- ✅ FFmpeg for video/audio processing (including all required `.dll` shared libraries)
- ✅ yt-dlp for downloading

**No Command Prompt. No pip install. No Python. Just click and install.**

---

## 🛠️ For Developers — Building the App

Follow these steps **once** on your development machine to produce the distributable installer.

### Prerequisites

Make sure you have the following installed on your PC:

| Tool | How to check | Install link |
|------|-------------|--------------|
| **Node.js** (v18+) | `node --version` | [nodejs.org](https://nodejs.org/) |
| **Python** (3.10+) | `py --version` | [python.org](https://www.python.org/downloads/) |
| **Git** (optional) | `git --version` | [git-scm.com](https://git-scm.com/) |

### Step 1 — Install Python dependencies

Open a terminal in the `Hermanos Forge` project folder and run:

```powershell
py -m pip install yt-dlp pydub pyinstaller
```

> These are only needed **on your machine** to build the app. End users will **not** need to run this.

### Step 2 — Install Node.js dependencies

```powershell
npm install
```

### Step 3 — Build the Python backend into a standalone `.exe`

```powershell
npm run package-backend
```

This compiles `backend.py` into `dist_backend/backend.exe` using PyInstaller.

> **Why PyInstaller if we're using Electron?** They serve completely different roles:
> - **Electron** is the *window and UI shell* — it replaced Tkinter and renders the React interface.
> - **PyInstaller** compiles *only the Python download engine* (`backend.py` + yt-dlp + pydub) into a single invisible `backend.exe`. Electron cannot run `.py` files directly, so it silently spawns `backend.exe` in the background whenever you click Download.
> - **electron-builder** then bundles Electron + `backend.exe` + ffmpeg (and its `.dll` libraries) into the final Setup installer.
>
> End users get one installer. Zero Python. Zero CMD. Everything is pre-packaged inside.

### Step 4 — Build the Windows Installer

```powershell
npm run electron:build
```

This packages the entire app (React UI + Electron + backend.exe + ffmpeg + shared `.dll` libraries) into a ready-to-distribute Windows Setup installer located in:

```
dist_electron/
  Hermanos Forge Setup X.X.X.exe  <- THIS IS THE .exe FILE, RUN THIS
```

---

## 🔧 Development Mode

To run the app locally without building (for testing and development):

```powershell
npm run electron:dev
```

This starts the Vite dev server and Electron simultaneously with hot-reload enabled.

---

## 📂 Project Structure

```
Hermanos Forge/
├── backend.py                  # Python backend (yt-dlp + FFmpeg logic)
├── electron/
│   ├── main.cjs                # Electron main process + IPC handlers + window lifecycle
│   └── preload.cjs             # Context bridge for renderer ↔ main IPC isolation
├── src/
│   ├── App.jsx                 # Application shell & navigation coordinator
│   ├── LogsWindow.jsx          # Developer logs auxiliary window
│   ├── components/
│   │   ├── ui/                 # Shared primitives (Button, Input, Select, Dialog, TitleBar, etc.)
│   │   ├── views/              # Feature views (SingleDownloader, MassClip, SelectiveDuration, etc.)
│   │   └── modals/             # Overlays (CookieWizard, PlaylistSelector, OutputFolder, etc.)
│   ├── lib/
│   │   └── utils.js            # Class merge utility (cn)
│   ├── assets/                 # Icons and media assets
│   ├── index.css               # Obsidian Forge Media Studio design tokens & utilities
│   └── main.jsx                # React root entry point
├── ffmpeg/                     # Bundled FFmpeg & FFprobe binaries + shared DLLs
├── package.json
├── tailwind.config.js
└── vite.config.js
```

---

## ⚠️ Troubleshooting

| Problem | Solution |
|---------|----------|
| Download says "ffmpeg not found" | Make sure `ffmpeg/ffmpeg.exe` and all its required `.dll` files are inside the project folder. |
| Video qualities don't appear | yt-dlp may be outdated. Run `py -m pip install --upgrade yt-dlp`. |
| "Python was not found" error | Ensure Python is installed and your system uses `py` or `python` as the command. |
| App opens but backend fails | Run `npm run package-backend` first to compile `backend.py`. |

---

## 📦 Tech Stack

- **Frontend**: React 19, Vite 8, Tailwind CSS 3.4, Framer Motion, Lucide React
- **Design System**: Obsidian Forge Media Studio (Obsidian Dark & Studio Light)
- **Typography**: Space Grotesk (display), DM Sans (body), JetBrains Mono (data)
- **Desktop Shell**: Electron (Frameless custom window with native controls)
- **Backend**: Python 3, yt-dlp, pydub, FFmpeg
- **Build**: PyInstaller (backend standalone binary), electron-builder (Windows NSIS installer)

---

```

██╗  ██╗███████╗██████╗ ███╗   ███╗ █████╗ ███╗   ██╗ ██████╗ ███████╗     ██████╗ ██████╗    
██║  ██║██╔════╝██╔══██╗████╗ ████║██╔══██╗████╗  ██║██╔═══██╗██╔════╝    ██╔════╝██╔═══██╗   
███████║█████╗  ██████╔╝██╔████╔██║███████║██╔██╗ ██║██║   ██║███████╗    ██║     ██║   ██║   
██╔══██║██╔══╝  ██╔══██╗██║╚██╔╝██║██╔══██║██║╚██╗██║██║   ██║╚════██║    ██║     ██║   ██║   
██║  ██║███████╗██║  ██║██║ ╚═╝ ██║██║  ██║██║ ╚████║╚██████╔╝███████║    ╚██████╗╚██████╔╝██╗
╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝ ╚══════╝     ╚═════╝ ╚═════╝ ╚═╝

```

*© Hermanos 2026 - For Hermanos. By Hermanos*
