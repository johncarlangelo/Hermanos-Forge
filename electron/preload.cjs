const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    downloadYoutubeAsMp3: (url, outdir) => ipcRenderer.invoke('download-mp3', url, outdir),
    downloadYoutubeAsMp4: (url, outdir, quality) => ipcRenderer.invoke('download-mp4', url, outdir, quality),
    convertLocalMp4: (file, outdir) => ipcRenderer.invoke('convert-mp4', file, outdir),
    getAvailableFormats: (url) => ipcRenderer.invoke('get-formats', url),
    onProgressUpdate: (callback) => ipcRenderer.on('progress-update', callback),
    onStatusUpdate: (callback) => ipcRenderer.on('status-update', callback),
    openFileLocation: (filePath) => ipcRenderer.invoke('open-location', filePath),
    chooseDirectory: () => ipcRenderer.invoke('choose-directory'),
    chooseFile: () => ipcRenderer.invoke('choose-file'),
    getDefaultDownloadPath: () => ipcRenderer.invoke('get-default-download-path'),
});
