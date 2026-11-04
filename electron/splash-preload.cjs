const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('splashAPI', {
  onStatus: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('splash-status', handler);
    return () => ipcRenderer.removeListener('splash-status', handler);
  },
  onClosing: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('splash-closing', handler);
    return () => ipcRenderer.removeListener('splash-closing', handler);
  },
});

