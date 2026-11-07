const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  logError: (context, message, stack) =>
    ipcRenderer.invoke('app:logError', context, message, stack),
  windowControls: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    toggleMaximize: () => ipcRenderer.invoke('window:toggleMaximize'),
    toggleFullscreen: () => ipcRenderer.invoke('window:toggleFullscreen'),
    close: () => ipcRenderer.invoke('window:close'),
    editCommand: (command) => ipcRenderer.invoke('window:editCommand', command),
  },
  database: {
    getInfo: () => ipcRenderer.invoke('database:getInfo'),
    testConnection: () => ipcRenderer.invoke('database:testConnection'),
  },
  systemHealth: {
    getMetrics: () => ipcRenderer.invoke('systemHealth:getMetrics'),
  },
  imports: {
    getHistory: (limit) => ipcRenderer.invoke('imports:getHistory', limit),
    recordOperation: (op) => ipcRenderer.invoke('imports:recordOperation', op),
  },
  settings: {
    getSettings: () => ipcRenderer.invoke('settings:getSettings'),
    updateSettings: (data) => ipcRenderer.invoke('settings:updateSettings', data),
  },
});
