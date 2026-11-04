const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const { spawn, execSync } = require('child_process');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const engineUpdater = require('./engine-updater.cjs');

// Set fluent-ffmpeg paths for bundled executables
const basePath = app.isPackaged ? process.resourcesPath : app.getAppPath();
const ffmpegPath = path.join(basePath, 'ffmpeg', 'ffmpeg.exe');
const ffprobePath = path.join(basePath, 'ffmpeg', 'ffprobe.exe');

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

let mainWindow;
let splashWindow = null;
let activeStitchProcess = null;
let activeSingleDownloadProcess = null;
let logsWindow = null;
let cachedBundledYtdlpVer = null;

function sendLog(line) {
    if (logsWindow && !logsWindow.isDestroyed()) {
        logsWindow.webContents.send('log-update', line);
    }
}

let splashLoaded = false;
let pendingSplashStatus = null;

function sendSplashStatus(message, percent) {
    pendingSplashStatus = { message, percent };
    if (splashWindow && !splashWindow.isDestroyed() && splashLoaded) {
        splashWindow.webContents.send('splash-status', pendingSplashStatus);
    }
}

function createSplashWindow() {
    splashLoaded = false;
    pendingSplashStatus = null;
    splashWindow = new BrowserWindow({
        width: 980,
        height: 720,
        minWidth: 800,
        minHeight: 600,
        frame: false,
        resizable: false,
        center: true,
        show: true,
        backgroundColor: '#09090C',
        webPreferences: {
            preload: path.join(__dirname, 'splash-preload.cjs'),
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    splashWindow.webContents.once('did-finish-load', () => {
        splashLoaded = true;
        if (pendingSplashStatus && splashWindow && !splashWindow.isDestroyed()) {
            splashWindow.webContents.send('splash-status', pendingSplashStatus);
        }
    });

    splashWindow.loadFile(path.join(__dirname, 'splash.html'));
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 980,
        height: 720,
        minWidth: 800,
        minHeight: 600,
        frame: false,
        show: false,
        backgroundColor: '#09090C',
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            nodeIntegration: false,
            contextIsolation: true
        },
        autoHideMenuBar: true,
    });

    mainWindow.on('maximize', () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('window-maximized-change', true);
        }
    });

    mainWindow.on('unmaximize', () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('window-maximized-change', false);
        }
    });

    const startUrl = process.env.ELECTRON_START_URL || `file://${path.join(__dirname, '../dist/index.html')}`;
    mainWindow.loadURL(startUrl);

    if (process.env.ELECTRON_START_URL) {
        mainWindow.webContents.openDevTools();
    }
}

async function getBundledYtdlpVersion() {
    if (cachedBundledYtdlpVer) return cachedBundledYtdlpVer;
    try {
        const backend = getBackendExe();
        const res = await new Promise((resolve) => {
            let settled = false;
            const doResolve = (ver) => {
                if (!settled) {
                    settled = true;
                    resolve(ver);
                }
            };
            const timer = setTimeout(() => {
                doResolve('2026.06.09');
            }, 3000);

            try {
                const child = spawn(backend.cmd, [...backend.args, '--action', 'get_engine_version', '--ytdlp-bin', 'bundled'], {
                    windowsHide: true,
                    env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' }
                });
                let out = '';
                child.stdout.on('data', d => { out += d.toString(); });
                child.on('close', () => {
                    clearTimeout(timer);
                    const match = out.match(/VERSION:(\{.*\})/);
                    if (match) {
                        try {
                            const parsed = JSON.parse(match[1]);
                            doResolve(parsed.version);
                            return;
                        } catch { }
                    }
                    doResolve('2026.06.09');
                });
                child.on('error', () => {
                    clearTimeout(timer);
                    doResolve('2026.06.09');
                });
            } catch {
                clearTimeout(timer);
                doResolve('2026.06.09');
            }
        });
        cachedBundledYtdlpVer = res || '2026.06.09';
        return cachedBundledYtdlpVer;
    } catch {
        return '2026.06.09';
    }
}

function initializeApp() {
    createSplashWindow();
    createWindow();

    let isAppReady = false;
    let isEngineReady = false;

    let hasTransitioned = false;
    function tryShowMainWindow() {
        if (isAppReady && isEngineReady && !hasTransitioned) {
            hasTransitioned = true;
            sendSplashStatus('Forge Media Engine ready', 100);

            // Synchronize mainWindow bounds to match splash exactly
            if (splashWindow && !splashWindow.isDestroyed()) {
                try {
                    splashWindow.webContents.send('splash-closing');
                    const bounds = splashWindow.getBounds();
                    if (mainWindow && !mainWindow.isDestroyed()) {
                        mainWindow.setBounds(bounds);
                    }
                } catch {}
            }

            // Allow 420ms for splash exit animation before showing main window
            setTimeout(() => {
                if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.show();
                    mainWindow.focus();
                }
                if (splashWindow && !splashWindow.isDestroyed()) {
                    splashWindow.close();
                    splashWindow = null;
                }
            }, 420);
        }
    }

    mainWindow.once('ready-to-show', () => {
        isAppReady = true;
        tryShowMainWindow();
    });

    // Fallback safety timer so app never hangs indefinitely
    setTimeout(() => {
        if (!isAppReady) {
            isAppReady = true;
            tryShowMainWindow();
        }
        if (!isEngineReady) {
            isEngineReady = true;
            tryShowMainWindow();
        }
    }, 8000);

    engineUpdater.startupCheckAndUpdate({
        appDataPath: app.getPath('userData'),
        fallbackBundledResolver: () => getBundledYtdlpVersion(),
        onStatus: (message, percent) => {
            sendSplashStatus(message, percent);
        }
    }).then(() => {
        isEngineReady = true;
        tryShowMainWindow();
    }).catch((err) => {
        console.warn('Startup engine check warning:', err);
        isEngineReady = true;
        tryShowMainWindow();
    });
}

app.whenReady().then(initializeApp);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
        if (mainWindow) mainWindow.show();
    }
});

// Helper to find the correct python command
let cachedPythonCmd = undefined;
function getPythonCommand() {
    if (cachedPythonCmd !== undefined) return cachedPythonCmd;
    const opts = { windowsHide: true, stdio: 'ignore' };
    try {
        execSync('py --version', opts);
        cachedPythonCmd = 'py';
        return cachedPythonCmd;
    } catch (e) {
        try {
            execSync('python --version', opts);
            cachedPythonCmd = 'python';
            return cachedPythonCmd;
        } catch (e2) {
            try {
                execSync('python3 --version', opts);
                cachedPythonCmd = 'python3';
                return cachedPythonCmd;
            } catch (e3) {
                cachedPythonCmd = null;
                return null;
            }
        }
    }
}

function getBackendExe() {
    const isDev = Boolean(process.env.ELECTRON_START_URL || !app.isPackaged);

    if (isDev) {
        // In dev mode, prioritize live backend.py script with Python
        const backendPy = path.join(__dirname, '../backend.py');
        const pyCmd = getPythonCommand();
        if (pyCmd && fs.existsSync(backendPy)) {
            return { cmd: pyCmd, args: [backendPy] };
        }

        // Fall back to compiled exe if Python is not found
        const exePath1 = path.join(__dirname, '../dist_backend/backend/backend.exe');
        const exePath2 = path.join(__dirname, '../dist_backend/backend.exe');
        if (fs.existsSync(exePath1)) {
            return { cmd: exePath1, args: [] };
        }
        if (fs.existsSync(exePath2)) {
            return { cmd: exePath2, args: [] };
        }

        return { cmd: pyCmd || 'python', args: [backendPy] };
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
        } catch (e) { }

        try {
            const ytdlpBin = engineUpdater.resolveYtdlpBinary(app.getPath('userData'));
            if (ytdlpBin) {
                args.push('--ytdlp-bin', ytdlpBin);
            }
        } catch (e) { }

        let expectedDuration = null;
        try {
            const startIndex = extraArgs.indexOf('--start');
            const endIndex = extraArgs.indexOf('--end');
            if (startIndex !== -1 && endIndex !== -1) {
                const s = parseFloat(extraArgs[startIndex + 1]);
                const e = parseFloat(extraArgs[endIndex + 1]);
                if (!isNaN(s) && !isNaN(e)) {
                    expectedDuration = e - s;
                }
            }
        } catch (e) { }

        const cwd = path.isAbsolute(backend.cmd)
            ? path.dirname(backend.cmd)
            : (backend.args && backend.args[0] && path.isAbsolute(backend.args[0]) ? path.dirname(backend.args[0]) : undefined);

        const child = spawn(backend.cmd, args, {
            windowsHide: true,
            env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1', ELECTRON_RESOURCES_PATH: process.resourcesPath, ...(ffPath ? { FFMPEG_PATH: ffPath } : {}) },
            cwd
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

        let stdoutBuffer = '';

        const handleStdoutLine = (line) => {
            line = line.trim();
            if (!line) return;

            sendLog(`[STDOUT] ${line}`);

            let handled = false;

            const telemetryIdx = line.indexOf('TELEMETRY:');
            if (telemetryIdx !== -1) {
                handled = true;
                try {
                    let jsonStr = line.substring(telemetryIdx + 10).trim();
                    const firstBrace = jsonStr.indexOf('{');
                    const lastBrace = jsonStr.lastIndexOf('}');
                    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
                        jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
                    }
                    const telemetryData = JSON.parse(jsonStr);
                    if (event) event.sender.send('telemetry-update', telemetryData);
                } catch (e) {
                    console.error('Failed to parse telemetry JSON:', e);
                }
            }

            const progressIdx = line.indexOf('PROGRESS:');
            if (progressIdx !== -1) {
                handled = true;
                const afterProgress = line.substring(progressIdx + 9).trim();
                const match = afterProgress.match(/^(\d+(?:\.\d+)?)/);
                const percent = match ? parseFloat(match[1]) : parseFloat(afterProgress);
                if (event && !isNaN(percent)) event.sender.send('progress-update', percent);
            }

            const statusIdx = line.indexOf('STATUS:');
            if (statusIdx !== -1) {
                handled = true;
                let status = line.substring(statusIdx + 7).trim();
                const nextTag = status.search(/(?:TELEMETRY|PROGRESS|SUCCESS|ERROR|AUTH_ERROR|FORMATS|METADATA|INSPECT):/);
                if (nextTag !== -1) status = status.substring(0, nextTag).trim();
                if (event && status) event.sender.send('status-update', status);
            }

            // SUCCESS, FORMATS, METADATA, INSPECT are checked before ERROR/AUTH_ERROR
            // so payload strings (e.g. video titles containing "ERROR:") do not trigger false rejections
            const successIdx = line.indexOf('SUCCESS:');
            if (successIdx !== -1) {
                handled = true;
                const filepath = line.substring(successIdx + 8).trim();
                lastSuccess = { success: true, filepath };
                doResolve(lastSuccess);
                return;
            }

            const formatsIdx = line.indexOf('FORMATS:');
            if (formatsIdx !== -1) {
                handled = true;
                try {
                    let jsonStr = line.substring(formatsIdx + 8).trim();
                    const fb = jsonStr.indexOf('[');
                    const lb = jsonStr.lastIndexOf(']');
                    if (fb !== -1 && lb !== -1 && lb >= fb) jsonStr = jsonStr.substring(fb, lb + 1);
                    const formats = JSON.parse(jsonStr);
                    lastSuccess = formats;
                    doResolve(formats);
                    return;
                } catch (e) { }
            }

            const metadataIdx = line.indexOf('METADATA:');
            if (metadataIdx !== -1) {
                handled = true;
                try {
                    let jsonStr = line.substring(metadataIdx + 9).trim();
                    const fb = jsonStr.indexOf('{');
                    const lb = jsonStr.lastIndexOf('}');
                    if (fb !== -1 && lb !== -1 && lb >= fb) jsonStr = jsonStr.substring(fb, lb + 1);
                    const metadata = JSON.parse(jsonStr);
                    lastSuccess = metadata;
                    doResolve(metadata);
                    return;
                } catch (e) { }
            }

            const inspectIdx = line.indexOf('INSPECT:');
            if (inspectIdx !== -1) {
                handled = true;
                try {
                    let jsonStr = line.substring(inspectIdx + 8).trim();
                    const fb = jsonStr.indexOf('{');
                    const lb = jsonStr.lastIndexOf('}');
                    if (fb !== -1 && lb !== -1 && lb >= fb) jsonStr = jsonStr.substring(fb, lb + 1);
                    const result = JSON.parse(jsonStr);
                    lastSuccess = result;
                    doResolve(result);
                    return;
                } catch (e) { }
            }

            const authIdx = line.indexOf('AUTH_ERROR:');
            if (authIdx !== -1) {
                handled = true;
                const msg = line.substring(authIdx + 11).trim();
                if (event) event.sender.send('auth-error', msg);
                lastError = new Error(`AUTH_ERROR: ${msg}`);
                doReject(lastError);
                return;
            }

            const errorIdx = line.indexOf('ERROR:');
            if (errorIdx !== -1) {
                handled = true;
                lastError = new Error(line.substring(errorIdx + 6).trim());
                doReject(lastError);
                return;
            }

            if (!handled) {
                console.log(`Backend output: ${line}`);
            }
        };

        child.stdout.on('data', (data) => {
            // Decode as UTF-8 explicitly from raw buffer and handle stream line chunking
            stdoutBuffer += data.toString('utf8');
            const lines = stdoutBuffer.split(/[\r\n]+/);
            stdoutBuffer = lines.pop(); // Keep partial trailing segment
            lines.forEach(handleStdoutLine);
        });

        let stderrBuffer = '';

        child.stderr.on('data', (data) => {
            stderrBuffer += data.toString('utf8');

            // split by \r or \n
            const lines = stderrBuffer.split(/[\r\n]+/);
            // keep the last segment in the buffer (might be incomplete)
            stderrBuffer = lines.pop();

            lines.forEach(line => {
                line = line.trim();
                if (!line) return;

                if (expectedDuration && expectedDuration > 0) {
                    const timeMatch = line.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/);
                    if (timeMatch) {
                        const hours = parseInt(timeMatch[1], 10);
                        const minutes = parseInt(timeMatch[2], 10);
                        const seconds = parseFloat(timeMatch[3]);
                        const currentSeconds = (hours * 3600) + (minutes * 60) + seconds;

                        let percent = (currentSeconds / expectedDuration) * 100;
                        if (percent > 100) percent = 100;
                        if (event && !isNaN(percent)) event.sender.send('progress-update', percent);
                    }
                }

                if (line.includes('time=') && line.includes('bitrate=')) {
                    // Suppress ffmpeg progress line from flooding terminal and UI logs
                } else {
                    console.error(`Backend error: ${line}`);
                    sendLog(`[STDERR] ${line}`);
                }
            });
        });

        child.on('close', (code) => {
            if (stdoutBuffer && stdoutBuffer.trim()) {
                handleStdoutLine(stdoutBuffer);
                stdoutBuffer = '';
            }
            activeSingleDownloadProcess = null;
            if (settled) return; // Already resolved/rejected by SUCCESS/ERROR line

            if (code === 0) {
                // Process finished cleanly but we never got a SUCCESS line
                // This can happen if the charmap error happened AFTER the file was written
                // Resolve gracefully — the file is on disk
                doResolve(lastSuccess || { success: true, filepath: null });
            } else if (child.killed || code === null) {
                doResolve({ success: false, error: 'Process was cancelled' });
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
        if (path.isAbsolute(backend.cmd) && !fs.existsSync(backend.cmd)) {
            const msg = `Backend not found at ${backend.cmd}. Ensure you ran 'npm run package-backend' before building, or include the backend in extraResources.`;
            console.error(msg);
            return reject(new Error(msg));
        }

        const args = [...backend.args, '--action', 'stitch_clips', '--urls', JSON.stringify(urls), '--outdir', outputDir, '--app-data-path', app.getPath('userData')];
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

        try {
            const ytdlpBin = engineUpdater.resolveYtdlpBinary(app.getPath('userData'));
            if (ytdlpBin) args.push('--ytdlp-bin', ytdlpBin);
        } catch (e) { }

        const cwd = path.isAbsolute(backend.cmd)
            ? path.dirname(backend.cmd)
            : (backend.args && backend.args[0] && path.isAbsolute(backend.args[0]) ? path.dirname(backend.args[0]) : undefined);

        activeStitchProcess = spawn(backend.cmd, args, {
            windowsHide: true,
            env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1', ELECTRON_RESOURCES_PATH: process.resourcesPath, ...(ffPath ? { FFMPEG_PATH: ffPath } : {}) },
            cwd
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
                } else if (line.startsWith('AUTH_ERROR:')) {
                    event.sender.send('auth-error', line.slice('AUTH_ERROR:'.length));
                    event.sender.send('stitch-error', 'Authentication failed: ' + line.slice('AUTH_ERROR:'.length));
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
    let args = ['--url', url, '--outdir', outdir, '--app-data-path', app.getPath('userData')];
    if (noPlaylist) args.push('--no-playlist');
    return runBackendCommand('download_mp3', args, event);
});

ipcMain.handle('download-mp4', async (event, url, outdir, quality, noPlaylist) => {
    let args = ['--url', url, '--outdir', outdir, '--app-data-path', app.getPath('userData')];
    if (quality) args.push('--quality', quality.toString());
    if (noPlaylist) args.push('--no-playlist');
    return runBackendCommand('download_mp4', args, event);
});

ipcMain.handle('convert-mp4', async (event, file, outdir) => {
    return runBackendCommand('convert_mp4', ['--file', file, '--outdir', outdir], event);
});

ipcMain.handle('get-formats', async (event, url) => {
    return runBackendCommand('get_formats', ['--url', url, '--app-data-path', app.getPath('userData')], event);
});

ipcMain.handle('get-video-metadata', async (event, url) => {
    return runBackendCommand('get_metadata', ['--url', url, '--app-data-path', app.getPath('userData')], event);
});

ipcMain.handle('download-clip', async (event, url, outdir, start, end, quality, precise, titleOverride) => {
    let args = ['--url', url, '--outdir', outdir, '--start', start.toString(), '--end', end.toString(), '--app-data-path', app.getPath('userData')];
    if (quality) args.push('--quality', quality.toString());
    if (precise) args.push('--precise');
    if (titleOverride) args.push('--title-override', titleOverride);
    return runBackendCommand('download_clip', args, event);
});

ipcMain.handle('inspect-url', async (event, url) => {
    return runBackendCommand('inspect_url', ['--url', url, '--app-data-path', app.getPath('userData')], event);
});

ipcMain.handle('extract-cookies', async (event, browser) => {
    let args = ['--browser', browser, '--app-data-path', app.getPath('userData')];
    return runBackendCommand('extract_cookies', args, event);
});

ipcMain.handle('import-cookies-file', async (event, filePath, browserName) => {
    try {
        let finalPath = filePath;
        if (!finalPath) {
            const result = await dialog.showOpenDialog(mainWindow, {
                title: 'Select cookies.txt',
                properties: ['openFile'],
                filters: [{ name: 'Text Files', extensions: ['txt'] }]
            });
            if (result.canceled || result.filePaths.length === 0) return { success: false };
            finalPath = result.filePaths[0];
        }

        const content = fs.readFileSync(finalPath, 'utf8');
        const lines = content.split(/\r?\n/);

        if (!lines[0] || (!lines[0].includes('# HTTP Cookie File') && !lines[0].includes('# Netscape HTTP Cookie File'))) {
            throw new Error('Invalid format: File does not appear to be a valid Netscape cookies.txt file.');
        }

        const filteredLines = lines.filter(line => {
            if (line.trim() === '') return false;
            if (line.startsWith('#') && !line.startsWith('#HttpOnly_')) return true; // keep comments/headers
            return line.includes('.youtube.com') || line.includes('.google.com') || line.includes('#HttpOnly_.youtube.com') || line.includes('#HttpOnly_.google.com');
        });

        const userDataPath = app.getPath('userData');
        const cookiesPath = path.join(userDataPath, 'cookies.txt');
        fs.writeFileSync(cookiesPath, filteredLines.join('\n'), 'utf8');

        const metaPath = path.join(userDataPath, 'cookies_meta.json');
        fs.writeFileSync(metaPath, JSON.stringify({ browserName, syncedAt: Date.now() }), 'utf8');

        return { success: true };
    } catch (err) {
        console.error('importCookiesFile error:', err);
        throw err;
    }
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

ipcMain.handle('open-external', async (event, url) => {
    return shell.openExternal(url);
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

    let ytdlpDiagnostics = null;
    try {
        const ytdlpInfo = await engineUpdater.checkEngineVersion(app.getPath('userData'), getBundledYtdlpVersion, 1500);
        ytdlpDiagnostics = {
            state: ytdlpInfo.source === 'AppData Updated' ? 'ONLINE (Updated)' : 'ONLINE (Bundled)',
            version: ytdlpInfo.currentVersion,
            source: ytdlpInfo.source,
            path: ytdlpInfo.path,
            updateAvailable: ytdlpInfo.updateAvailable,
            latestVersion: ytdlpInfo.latestVersion
        };
    } catch (e) {
        ytdlpDiagnostics = {
            state: 'ONLINE (Bundled)',
            version: 'Bundled',
            source: 'Bundled',
            path: 'Bundled Python Package',
            updateAvailable: false,
            latestVersion: null
        };
    }

    return {
        backend: { state: bState, path: backend.cmd },
        ffmpeg: { state: fs.existsSync(ffPath) ? 'ONLINE' : 'MISSING', path: ffPath },
        ffprobe: { state: fs.existsSync(probePath) ? 'ONLINE' : 'MISSING', path: probePath },
        ytdlp: ytdlpDiagnostics,
        dlls: dlls
    };
});

ipcMain.handle('check-engine-version', async () => {
    return engineUpdater.checkEngineVersion(app.getPath('userData'), getBundledYtdlpVersion);
});

ipcMain.handle('update-engine', async (event) => {
    return engineUpdater.performEngineUpdate({
        appDataPath: app.getPath('userData'),
        onProgress: (pct) => {
            if (event && event.sender && !event.sender.isDestroyed()) {
                event.sender.send('engine-update-progress', pct);
            }
        }
    });
});

// Window control handlers for custom title bar
ipcMain.handle('window-minimize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) win.minimize();
});

ipcMain.handle('window-maximize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
        if (win.isMaximized()) {
            win.unmaximize();
        } else {
            win.maximize();
        }
    }
    return win ? win.isMaximized() : false;
});

ipcMain.handle('window-close', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) win.close();
});

ipcMain.handle('window-is-maximized', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    return win ? win.isMaximized() : false;
});
