const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const { spawn, execSync } = require('child_process');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');

// Set fluent-ffmpeg paths for bundled executables
const basePath = app.isPackaged ? process.resourcesPath : app.getAppPath();
const ffmpegPath = path.join(basePath, 'ffmpeg', 'ffmpeg.exe');
const ffprobePath = path.join(basePath, 'ffmpeg', 'ffprobe.exe');

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

let mainWindow;
let activeStitchProcess = null;
let activeSingleDownloadProcess = null;
let logsWindow = null;

function sendLog(line) {
    if (logsWindow && !logsWindow.isDestroyed()) {
        logsWindow.webContents.send('log-update', line);
    }
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 900,
        height: 700,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            nodeIntegration: false,
            contextIsolation: true
        },
        autoHideMenuBar: true,
    });

    const startUrl = process.env.ELECTRON_START_URL || `file://${path.join(__dirname, '../dist/index.html')}`;
    mainWindow.loadURL(startUrl);

    if (process.env.ELECTRON_START_URL) {
        mainWindow.webContents.openDevTools();
    }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// Helper to find the correct python command
function getPythonCommand() {
    try {
        execSync('py --version');
        return 'py';
    } catch (e) {
        try {
            execSync('python --version');
            return 'python';
        } catch (e2) {
            try {
                execSync('python3 --version');
                return 'python3';
            } catch (e3) {
                return 'python'; // Fallback
            }
        }
    }
}

function getBackendExe() {
    const isDev = process.env.ELECTRON_START_URL ? true : false;
    
    if (isDev) {
        const exePath1 = path.join(__dirname, '../dist_backend/backend/backend.exe');
        const exePath2 = path.join(__dirname, '../dist_backend/backend.exe');
        if (fs.existsSync(exePath1)) {
            return { cmd: exePath1, args: [] };
        }
        if (fs.existsSync(exePath2)) {
            return { cmd: exePath2, args: [] };
        }
        // Fall back to running the .py script directly with Python
        const pyCmd = getPythonCommand();
        return { cmd: pyCmd, args: [path.join(__dirname, '../backend.py')] };
    } else {
        // In production, electron-builder places extraResources under:
        // <install>/resources/app.asar.unpacked/<to>/
        const backendPath1 = path.join(process.resourcesPath, 'app.asar.unpacked', 'dist_backend', 'backend', 'backend.exe');
        const backendPath2 = path.join(process.resourcesPath, 'app.asar.unpacked', 'dist_backend', 'backend.exe');
        const backendPath3 = path.join(process.resourcesPath, 'dist_backend', 'backend', 'backend.exe');

        if (fs.existsSync(backendPath1)) return { cmd: backendPath1, args: [] };
        if (fs.existsSync(backendPath2)) return { cmd: backendPath2, args: [] };
        if (fs.existsSync(backendPath3)) return { cmd: backendPath3, args: [] };

        // Default candidate (used later for error reporting)
        return { cmd: backendPath1, args: [] };
    }
}

function runBackendCommand(action, extraArgs = [], event) {
    return new Promise((resolve, reject) => {
        const backend = getBackendExe();
            // If the backend executable (or fallback) doesn't exist, fail fast with a clear message
            // We only check if the command is an absolute path. For system commands like 'py', fs.existsSync will be false
            if (path.isAbsolute(backend.cmd) && !fs.existsSync(backend.cmd)) {
                const msg = `Backend not found at ${backend.cmd}. Ensure you ran 'npm run package-backend' before building, or include the backend in extraResources.`;
                console.error(msg);
                if (event && event.sender) event.sender.send('status-update', msg);
                return reject(new Error(msg));
            }
        const args = [...backend.args, '--action', action, ...extraArgs];
        
        console.log(`Running backend: ${backend.cmd} ${args.join(' ')}`);
        
        // If available, locate bundled ffmpeg under the app resources and pass it to the backend
        let ffPath = ffmpegPath;
        if (!fs.existsSync(ffPath)) {
            ffPath = null;
        }

        // If we found a resource ffmpeg, pass it as a CLI override too so backend uses it deterministically
        try {
            if (ffPath) {
                args.push('--ffmpeg-path', ffPath);
            }
        } catch (e) {}

        const child = spawn(backend.cmd, args, {
            windowsHide: true,
            env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1', ELECTRON_RESOURCES_PATH: process.resourcesPath, ...(ffPath ? { FFMPEG_PATH: ffPath } : {}) },
            cwd: path.dirname(backend.cmd) || undefined
        });

        activeSingleDownloadProcess = child;

        // Track state so we never double-resolve/reject
        let settled = false;
        let lastSuccess = null;
        let lastError = null;

        const doResolve = (val) => {
            if (!settled) { settled = true; resolve(val); }
        };
        const doReject = (err) => {
            if (!settled) { settled = true; reject(err); }
        };

        child.stdout.on('data', (data) => {
            // Decode as UTF-8 explicitly from the raw buffer
            const text = data.toString('utf8');
            const lines = text.split('\n');
            lines.forEach(line => {
                line = line.trim();
                if (!line) return;
                
                sendLog(`[STDOUT] ${line}`);
                
                if (line.startsWith('PROGRESS:')) {
                    const percent = parseFloat(line.split(':')[1]);
                    if (event && !isNaN(percent)) event.sender.send('progress-update', percent);
                } else if (line.startsWith('STATUS:')) {
                    const status = line.substring(7);
                    if (event) event.sender.send('status-update', status);
                } else if (line.startsWith('FORMATS:')) {
                    try {
                        const formats = JSON.parse(line.substring(8));
                        lastSuccess = formats;
                        doResolve(formats);
                    } catch (e) {}
                } else if (line.startsWith('METADATA:')) {
                    try {
                        const metadata = JSON.parse(line.substring(9));
                        lastSuccess = metadata;
                        doResolve(metadata);
                    } catch (e) {}
                } else if (line.startsWith('INSPECT:')) {
                    try {
                        const result = JSON.parse(line.substring(8));
                        lastSuccess = result;
                        doResolve(result);
                    } catch (e) {}
                } else if (line.startsWith('SUCCESS:')) {
                    const filepath = line.substring(8).trim();
                    lastSuccess = { success: true, filepath };
                    doResolve(lastSuccess);
                } else if (line.startsWith('ERROR:')) {
                    lastError = new Error(line.substring(6).trim());
                    doReject(lastError);
                } else {
                    console.log(`Backend output: ${line}`);
                }
            });
        });

        child.stderr.on('data', (data) => {
            const errText = data.toString('utf8');
            console.error(`Backend error: ${errText}`);
            sendLog(`[STDERR] ${errText.trim()}`);
        });

        child.on('close', (code) => {
            activeSingleDownloadProcess = null;
            if (settled) return; // Already resolved/rejected by SUCCESS/ERROR line

            if (code === 0) {
                // Process finished cleanly but we never got a SUCCESS line
                // This can happen if the charmap error happened AFTER the file was written
                // Resolve gracefully — the file is on disk
                doResolve(lastSuccess || { success: true, filepath: null });
            } else {
                doReject(lastError || new Error(`Process exited with code ${code}`));
            }
        });
        
        child.on('error', (err) => {
            activeSingleDownloadProcess = null;
            doReject(new Error(`Failed to start backend process: ${err.message}`));
        });
    });
}

// IPC Handlers
ipcMain.handle('stitch-clips', async (event, { urls, outputDir, noStitch }) => {
    return new Promise((resolve, reject) => {
        const backend = getBackendExe();
        if (!fs.existsSync(backend.cmd)) {
            const msg = `Backend not found at ${backend.cmd}. Ensure you ran 'npm run package-backend' before building, or include the backend in extraResources.`;
            console.error(msg);
            return reject(new Error(msg));
        }

        const args = [...backend.args, '--action', 'stitch_clips', '--urls', JSON.stringify(urls), '--outdir', outputDir];
        if (noStitch) args.push('--no-stitch');

        let ffPath = null;
        try {
            const candidates = [
                path.join(process.resourcesPath, 'app.asar.unpacked', 'ffmpeg', 'bin', 'ffmpeg.exe'),
                path.join(process.resourcesPath, 'app.asar.unpacked', 'ffmpeg', 'ffmpeg.exe'),
                path.join(process.resourcesPath, 'ffmpeg', 'bin', 'ffmpeg.exe'),
                path.join(process.resourcesPath, 'ffmpeg', 'ffmpeg.exe')
            ];
            for (const c of candidates) {
                if (fs.existsSync(c)) { ffPath = c; break; }
            }
        } catch (e) {
            ffPath = null;
        }

        if (ffPath) args.push('--ffmpeg-path', ffPath);

        activeStitchProcess = spawn(backend.cmd, args, {
            windowsHide: true,
            env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1', ELECTRON_RESOURCES_PATH: process.resourcesPath, ...(ffPath ? { FFMPEG_PATH: ffPath } : {}) },
            cwd: path.dirname(backend.cmd) || undefined
        });

        activeStitchProcess.stdout.on('data', (data) => {
            const text = data.toString('utf8');
            const lines = text.split('\n').map(line => line.trim()).filter(Boolean);

            for (const line of lines) {
                sendLog(`[STITCH-STDOUT] ${line}`);
                if (line.startsWith('CLIP:')) {
                    const parts = line.split(':');
                    const index = parseInt(parts[1], 10);
                    const state = parts[2];
                    const message = parts.slice(3).join(':');
                    event.sender.send('stitch-clip-update', { index, state, message });
                } else if (line.startsWith('STATUS:')) {
                    event.sender.send('stitch-status', line.slice('STATUS:'.length));
                } else if (line.startsWith('SUCCESS:')) {
                    event.sender.send('stitch-success', line.slice('SUCCESS:'.length));
                } else if (line.startsWith('ERROR:')) {
                    event.sender.send('stitch-error', line.slice('ERROR:'.length));
                } else {
                    console.log(`Backend output: ${line}`);
                }
            }
        });

        activeStitchProcess.stderr.on('data', (data) => {
            const errText = data.toString('utf8');
            console.error(`Backend error: ${errText}`);
            sendLog(`[STITCH-STDERR] ${errText.trim()}`);
        });

        activeStitchProcess.on('close', (code) => {
            activeStitchProcess = null;
            resolve({ canceled: false, code });
        });

        activeStitchProcess.on('error', (err) => {
            activeStitchProcess = null;
            reject(err);
        });
    });
});

ipcMain.handle('cancel-stitch', async (event, { outputDir }) => {
    if (activeStitchProcess) {
        activeStitchProcess.kill();
        activeStitchProcess = null;
    }

    try {
        const files = fs.readdirSync(outputDir);
        for (const file of files) {
            if (file.startsWith('clip_') && file.endsWith('.part')) {
                fs.unlinkSync(path.join(outputDir, file));
            }
        }
    } catch (e) {
        console.error('Cleanup after cancel failed:', e);
    }

    return { canceled: true };
});

ipcMain.handle('cancel-single-download', async () => {
    if (activeSingleDownloadProcess) {
        activeSingleDownloadProcess.kill();
        activeSingleDownloadProcess = null;
        return { canceled: true };
    }
    return { canceled: false };
});

ipcMain.handle('select-output-folder', async () => {
    const result = await dialog.showOpenDialog(mainWindow, { properties: ['openDirectory'] });
    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0];
});

ipcMain.handle('download-mp3', async (event, url, outdir, noPlaylist) => {
    let args = ['--url', url, '--outdir', outdir];
    if (noPlaylist) args.push('--no-playlist');
    return runBackendCommand('download_mp3', args, event);
});

ipcMain.handle('download-mp4', async (event, url, outdir, quality, noPlaylist) => {
    let args = ['--url', url, '--outdir', outdir];
    if (quality) args.push('--quality', quality.toString());
    if (noPlaylist) args.push('--no-playlist');
    return runBackendCommand('download_mp4', args, event);
});

ipcMain.handle('convert-mp4', async (event, file, outdir) => {
    return runBackendCommand('convert_mp4', ['--file', file, '--outdir', outdir], event);
});

ipcMain.handle('get-formats', async (event, url) => {
    return runBackendCommand('get_formats', ['--url', url], event);
});

ipcMain.handle('get-video-metadata', async (event, url) => {
    return runBackendCommand('get_metadata', ['--url', url], event);
});

ipcMain.handle('download-clip', async (event, url, outdir, start, end, quality, precise, titleOverride) => {
    let args = ['--url', url, '--outdir', outdir, '--start', start.toString(), '--end', end.toString()];
    if (quality) args.push('--quality', quality.toString());
    if (precise) args.push('--precise');
    if (titleOverride) args.push('--title-override', titleOverride);
    return runBackendCommand('download_clip', args, event);
});

ipcMain.handle('inspect-url', async (event, url) => {
    return runBackendCommand('inspect_url', ['--url', url], event);
});

ipcMain.handle('open-location', async (event, filePath) => {
    try {
        if (fs.existsSync(filePath)) {
            shell.showItemInFolder(filePath);
            return true;
        } else {
            shell.openPath(path.dirname(filePath));
            return false;
        }
    } catch (e) {
        console.error(e);
        return false;
    }
});

ipcMain.handle('get-unique-folder', async (event, baseDir, folderName) => {
    let targetDir = path.join(baseDir, folderName);
    let counter = 1;
    while (fs.existsSync(targetDir)) {
        targetDir = path.join(baseDir, `${folderName} ${counter}`);
        counter++;
    }
    return targetDir;
});

ipcMain.handle('choose-directory', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory']
    });
    if (!result.canceled) {
        return result.filePaths[0];
    }
    return null;
});

ipcMain.handle('get-default-download-path', async () => {
    try {
        return app.getPath('downloads');
    } catch (e) {
        return app.getPath('home');
    }
});

ipcMain.handle('choose-file', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [{ name: 'Videos', extensions: ['mp4', 'mkv', 'avi'] }]
    });
    if (!result.canceled) {
        return result.filePaths[0];
    }
    return null;
});

ipcMain.handle('open-logs-window', () => {
    if (logsWindow && !logsWindow.isDestroyed()) {
        logsWindow.focus();
        return;
    }
    logsWindow = new BrowserWindow({
        width: 800,
        height: 600,
        title: 'Developer Logs',
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            nodeIntegration: false,
            contextIsolation: true
        },
        autoHideMenuBar: true,
    });

    const startUrl = process.env.ELECTRON_START_URL 
        ? `${process.env.ELECTRON_START_URL}#logs` 
        : `file://${path.join(__dirname, '../dist/index.html')}#logs`;
    
    logsWindow.loadURL(startUrl);

    logsWindow.on('closed', () => {
        logsWindow = null;
    });
});

ipcMain.handle('check-system-status', async () => {
    const backend = getBackendExe();
    let bState = 'MISSING';
    if (path.isAbsolute(backend.cmd)) {
        bState = fs.existsSync(backend.cmd) ? 'ONLINE' : 'MISSING';
    } else {
        // e.g. 'py' system fallback
        bState = 'ONLINE (System)';
    }

    const basePath = app.isPackaged ? process.resourcesPath : app.getAppPath();
    const ffmpegDir = path.join(basePath, 'ffmpeg');
    const ffPath = path.join(ffmpegDir, 'ffmpeg.exe');
    const probePath = path.join(ffmpegDir, 'ffprobe.exe');
    
    // Find all .dll files in ffmpeg directory
    const dlls = [];
    try {
        if (fs.existsSync(ffmpegDir)) {
            const files = fs.readdirSync(ffmpegDir);
            for (const file of files) {
                if (file.toLowerCase().endsWith('.dll')) {
                    dlls.push({
                        name: file,
                        state: 'ONLINE',
                        path: path.join(ffmpegDir, file)
                    });
                }
            }
        }
    } catch (e) {
        console.error('Error scanning DLLs', e);
    }
    
    return {
        backend: { state: bState, path: backend.cmd },
        ffmpeg: { state: fs.existsSync(ffPath) ? 'ONLINE' : 'MISSING', path: ffPath },
        ffprobe: { state: fs.existsSync(probePath) ? 'ONLINE' : 'MISSING', path: probePath },
        dlls: dlls
    };
});
