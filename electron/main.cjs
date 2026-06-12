const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const { spawn, execSync } = require('child_process');
const fs = require('fs');

let mainWindow;

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
        const exePath = path.join(__dirname, '../dist_backend/backend.exe');
        if (fs.existsSync(exePath)) {
            return { cmd: exePath, args: [] };
        }
        // Fall back to running the .py script directly with Python
        const pyCmd = getPythonCommand();
        return { cmd: pyCmd, args: [path.join(__dirname, '../backend.py')] };
    } else {
        // In production, electron-builder places extraResources under:
        // <install>/resources/app.asar.unpacked/<to>/
        const backendPath1 = path.join(process.resourcesPath, 'app.asar.unpacked', 'dist_backend', 'backend.exe');
        const backendPath2 = path.join(process.resourcesPath, 'dist_backend', 'backend.exe');

        if (fs.existsSync(backendPath1)) return { cmd: backendPath1, args: [] };
        if (fs.existsSync(backendPath2)) return { cmd: backendPath2, args: [] };

        // Default candidate (used later for error reporting)
        return { cmd: backendPath1, args: [] };
    }
}

function runBackendCommand(action, extraArgs = [], event) {
    return new Promise((resolve, reject) => {
        const backend = getBackendExe();
            // If the backend executable (or fallback) doesn't exist, fail fast with a clear message
            if (!fs.existsSync(backend.cmd)) {
                const msg = `Backend not found at ${backend.cmd}. Ensure you ran 'npm run package-backend' before building, or include the backend in extraResources.`;
                console.error(msg);
                if (event && event.sender) event.sender.send('status-update', msg);
                return reject(new Error(msg));
            }
        const args = [...backend.args, '--action', action, ...extraArgs];
        
        console.log(`Running backend: ${backend.cmd} ${args.join(' ')}`);
        
        const child = spawn(backend.cmd, args, {
            windowsHide: true,
            env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' },
            cwd: path.dirname(backend.cmd) || undefined
        });

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
            console.error(`Backend error: ${data.toString('utf8')}`);
        });

        child.on('close', (code) => {
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
            doReject(new Error(`Failed to start backend process: ${err.message}`));
        });
    });
}

// IPC Handlers
ipcMain.handle('download-mp3', async (event, url, outdir) => {
    return runBackendCommand('download_mp3', ['--url', url, '--outdir', outdir], event);
});

ipcMain.handle('download-mp4', async (event, url, outdir, quality) => {
    let args = ['--url', url, '--outdir', outdir];
    if (quality) args.push('--quality', quality.toString());
    return runBackendCommand('download_mp4', args, event);
});

ipcMain.handle('convert-mp4', async (event, file, outdir) => {
    return runBackendCommand('convert_mp4', ['--file', file, '--outdir', outdir], event);
});

ipcMain.handle('get-formats', async (event, url) => {
    return runBackendCommand('get_formats', ['--url', url], event);
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
