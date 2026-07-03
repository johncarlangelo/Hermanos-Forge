const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    downloadYoutubeAsMp3: (url, outdir, noPlaylist) => ipcRenderer.invoke('download-mp3', url, outdir, noPlaylist),
    downloadYoutubeAsMp4: (url, outdir, quality, noPlaylist) => ipcRenderer.invoke('download-mp4', url, outdir, quality, noPlaylist),
    inspectUrl: (url) => ipcRenderer.invoke('inspect-url', url),
    cancelDownload: () => ipcRenderer.invoke('cancel-single-download'),
    convertLocalMp4: (file, outdir) => ipcRenderer.invoke('convert-mp4', file, outdir),
    getAvailableFormats: (url) => ipcRenderer.invoke('get-formats', url),
    onProgressUpdate: (callback) => ipcRenderer.on('progress-update', callback),
    onStatusUpdate: (callback) => ipcRenderer.on('status-update', callback),
    openFileLocation: (filePath) => ipcRenderer.invoke('open-location', filePath),
    chooseDirectory: () => ipcRenderer.invoke('choose-directory'),
    chooseFile: () => ipcRenderer.invoke('choose-file'),
    getDefaultDownloadPath: () => ipcRenderer.invoke('get-default-download-path'),
    openLogsWindow: () => ipcRenderer.invoke('open-logs-window'),
    onLogUpdate: (callback) => {
        const handler = (_event, line) => callback(line);
        ipcRenderer.on('log-update', handler);
        return () => ipcRenderer.removeListener('log-update', handler);
    },
    checkSystemStatus: () => ipcRenderer.invoke('check-system-status')
});

contextBridge.exposeInMainWorld('stitchAPI', {
    stitchClips: (urls, outputDir, noStitch = false) => ipcRenderer.invoke('stitch-clips', { urls, outputDir, noStitch }),
    cancelStitch: (outputDir) => ipcRenderer.invoke('cancel-stitch', { outputDir }),
    selectOutputFolder: () => ipcRenderer.invoke('select-output-folder'),

    onClipUpdate: (callback) => {
        const handler = (_event, data) => callback(data);
        ipcRenderer.on('stitch-clip-update', handler);
        return () => ipcRenderer.removeListener('stitch-clip-update', handler);
    },
    onStatus: (callback) => {
        const handler = (_event, msg) => callback(msg);
        ipcRenderer.on('stitch-status', handler);
        return () => ipcRenderer.removeListener('stitch-status', handler);
    },
    onSuccess: (callback) => {
        const handler = (_event, path) => callback(path);
        ipcRenderer.on('stitch-success', handler);
        return () => ipcRenderer.removeListener('stitch-success', handler);
    },
    onError: (callback) => {
        const handler = (_event, msg) => callback(msg);
        ipcRenderer.on('stitch-error', handler);
        return () => ipcRenderer.removeListener('stitch-error', handler);
    }
});
