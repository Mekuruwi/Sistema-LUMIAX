import { contextBridge, ipcRenderer } from 'electron';
import type { ImportOperation } from './database/types';

contextBridge.exposeInMainWorld('electronAPI', {
  logError: (context: string, message: string, stack?: string) =>
    ipcRenderer.invoke('app:logError', context, message, stack),
  windowControls: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    toggleMaximize: () => ipcRenderer.invoke('window:toggleMaximize'),
    toggleFullscreen: () => ipcRenderer.invoke('window:toggleFullscreen'),
    close: () => ipcRenderer.invoke('window:close'),
    editCommand: (command: string) => ipcRenderer.invoke('window:editCommand', command),
  },
  database: {
    getInfo: () => ipcRenderer.invoke('database:getInfo'),
    testConnection: () => ipcRenderer.invoke('database:testConnection'),
  },
  systemHealth: {
    getMetrics: () => ipcRenderer.invoke('systemHealth:getMetrics'),
  },
  imports: {
    getHistory: (limit?: number) => ipcRenderer.invoke('imports:getHistory', limit),
    recordOperation: (op: ImportOperation) => ipcRenderer.invoke('imports:recordOperation', op),
  },
  settings: {
    getSettings: () => ipcRenderer.invoke('settings:getSettings'),
    updateSettings: (data: Record<string, unknown>) => ipcRenderer.invoke('settings:updateSettings', data),
  },
});

export type ElectronAPI = typeof window.electronAPI;
