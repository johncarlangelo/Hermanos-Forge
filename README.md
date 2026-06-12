# Hermanos Forge 🎬

A sleek, modern YouTube video and audio downloader built with Electron + React. Download YouTube videos as **MP4** or **MP3**, select your preferred quality, and manage your download history — all from a beautiful dark-mode interface.

---

## ✨ Features

- 📥 **Download YouTube videos** as MP4 (with quality selection: 360p, 720p, 1080p, 4K)
- 🎵 **Download YouTube videos** as MP3 audio
- 🔄 **Convert local MP4 files** to MP3
- 📊 **Smooth, accurate progress bar** — no more janky progress
- 📁 **Download history** with file type tags (MP3/MP4)
- 📂 **Open in File Location** button for every history entry
- 🗑️ **Delete individual history items** or clear all at once
- 🔔 **Toast notifications** for success and errors

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
- ✅ FFmpeg for video/audio processing
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
> - **electron-builder** then bundles Electron + `backend.exe` + ffmpeg into the final Setup installer.
>
> End users get one installer. Zero Python. Zero CMD. Everything is pre-packaged inside.

### Step 4 — Build the Windows Installer

```powershell
npm run electron:build
```

This packages the entire app (React UI + Electron + backend.exe + ffmpeg) into a ready-to-distribute Windows Setup installer located in:

```
dist_electron/
  Hermanos Forge Setup 1.0.0.exe  <- THIS IS THE .exe FILE, RUN THIS
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
├── backend.py              # Python backend (yt-dlp + ffmpeg logic)
├── electron/
│   ├── main.cjs            # Electron main process + IPC handlers
│   └── preload.cjs         # Context bridge for renderer ↔ main IPC
├── src/
│   └── App.jsx             # React UI (all pages and logic)
├── ffmpeg/
│   ├── ffmpeg.exe          # Bundled FFmpeg binary
│   └── ffprobe.exe         # Bundled FFprobe binary
├── package.json
└── vite.config.js
```

---

## ⚠️ Troubleshooting

| Problem | Solution |
|---------|----------|
| Download says "ffmpeg not found" | Make sure `ffmpeg/ffmpeg.exe` is inside the project folder. |
| Video qualities don't appear | yt-dlp may be outdated. Run `py -m pip install --upgrade yt-dlp`. |
| "Python was not found" error | Ensure Python is installed and your system uses `py` or `python` as the command. |
| App opens but backend fails | Run `npm run package-backend` first to compile `backend.py`. |

---

## 📦 Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS v3, Framer Motion, Lucide Icons
- **Desktop Shell**: Electron
- **Backend**: Python 3, yt-dlp, pydub, ffmpeg
- **Build**: PyInstaller (backend), electron-builder (installer)

---

```

 █████   █████ ██████████ ███████████   ██████   ██████   █████████   ██████   █████    ███████     █████████       █████████     ███████   
▒▒███   ▒▒███ ▒▒███▒▒▒▒▒█▒▒███▒▒▒▒▒███ ▒▒██████ ██████   ███▒▒▒▒▒███ ▒▒██████ ▒▒███   ███▒▒▒▒▒███  ███▒▒▒▒▒███     ███▒▒▒▒▒███  ███▒▒▒▒▒███ 
 ▒███    ▒███  ▒███  █ ▒  ▒███    ▒███  ▒███▒█████▒███  ▒███    ▒███  ▒███▒███ ▒███  ███     ▒▒███▒███    ▒▒▒     ███     ▒▒▒  ███     ▒▒███
 ▒███████████  ▒██████    ▒██████████   ▒███▒▒███ ▒███  ▒███████████  ▒███▒▒███▒███ ▒███      ▒███▒▒█████████    ▒███         ▒███      ▒███
 ▒███▒▒▒▒▒███  ▒███▒▒█    ▒███▒▒▒▒▒███  ▒███ ▒▒▒  ▒███  ▒███▒▒▒▒▒███  ▒███ ▒▒██████ ▒███      ▒███ ▒▒▒▒▒▒▒▒███   ▒███         ▒███      ▒███
 ▒███    ▒███  ▒███ ▒   █ ▒███    ▒███  ▒███      ▒███  ▒███    ▒███  ▒███  ▒▒█████ ▒▒███     ███  ███    ▒███   ▒▒███     ███▒▒███     ███ 
 █████   █████ ██████████ █████   █████ █████     █████ █████   █████ █████  ▒▒█████ ▒▒▒███████▒  ▒▒█████████     ▒▒█████████  ▒▒▒███████▒  
▒▒▒▒▒   ▒▒▒▒▒ ▒▒▒▒▒▒▒▒▒▒ ▒▒▒▒▒   ▒▒▒▒▒ ▒▒▒▒▒     ▒▒▒▒▒ ▒▒▒▒▒   ▒▒▒▒▒ ▒▒▒▒▒    ▒▒▒▒▒    ▒▒▒▒▒▒▒     ▒▒▒▒▒▒▒▒▒       ▒▒▒▒▒▒▒▒▒     ▒▒▒▒▒▒▒    
                                                                                                                                            
                                                                                                                                            
                                                                                                                                            

```