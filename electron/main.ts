import { app, BrowserWindow, ipcMain, type IpcMainInvokeEvent } from 'electron';
import log from 'electron-log/main';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { DatabaseFactory } from './database/DatabaseFactory';
import type { DatabaseAdapter } from './database/DatabaseAdapter';
import type { ImportOperation } from './database/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
log.initialize();

let mainWindow: BrowserWindow | null = null;
let databaseAdapter: DatabaseAdapter | null = null;

function handleIpc(
  channel: string,
  handler: (event: IpcMainInvokeEvent, ...args: any[]) => unknown,
) {
  ipcMain.handle(channel, (event, ...args) => {
    if (
      !mainWindow ||
      event.sender.id !== mainWindow.webContents.id ||
      event.senderFrame !== event.sender.mainFrame
    ) {
      throw new Error('Origem inválida para chamada IPC.');
    }
    return handler(event, ...args);
  });
}

function resolvePreloadPath(): string {
  const distPreload = path.join(__dirname, 'preload.cjs');
  if (fs.existsSync(distPreload)) {
    return distPreload;
  }
  const sourcePreload = path.join(__dirname, '../electron/preload.cjs');
  if (fs.existsSync(sourcePreload)) {
    return sourcePreload;
  }
  return path.join(__dirname, 'preload.js');
}

async function initializeDatabase(): Promise<void> {
  try {
    databaseAdapter = DatabaseFactory.createAdapter({
      provider: 'sqlite',
    });
    await databaseAdapter.connect();
    log.info('Banco de dados SQLite inicializado com sucesso.');
  } catch (error) {
    log.error('Falha ao inicializar o banco de dados:', error);
  }
}

function registerIpcHandlers() {
  handleIpc('app:logError', (_event, context: string, message: string, stack?: string) => {
    log.error(`[${context}] ${message}`, stack);
    return true;
  });

  handleIpc('window:minimize', () => {
    mainWindow?.minimize();
  });

  handleIpc('window:toggleMaximize', () => {
    if (!mainWindow) return;
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });

  handleIpc('window:toggleFullscreen', () => {
    if (!mainWindow) return;
    mainWindow.setFullScreen(!mainWindow.isFullScreen());
  });

  handleIpc('window:close', () => {
    mainWindow?.close();
  });

  handleIpc('window:editCommand', (_event, command: string) => {
    if (!mainWindow) return;
    const contents = mainWindow.webContents;
    switch (command) {
      case 'undo':
        contents.undo();
        break;
      case 'redo':
        contents.redo();
        break;
      case 'cut':
        contents.cut();
        break;
      case 'copy':
        contents.copy();
        break;
      case 'paste':
        contents.paste();
        break;
      case 'selectAll':
        contents.selectAll();
        break;
    }
  });

  handleIpc('database:getInfo', async () => {
    if (!databaseAdapter) {
      return { provider: 'sqlite', connected: false };
    }
    return databaseAdapter.getDatabaseInfo();
  });

  handleIpc('database:testConnection', async () => {
    if (!databaseAdapter) {
      throw new Error('Banco de dados não configurado.');
    }
    return databaseAdapter.testConnection();
  });

  handleIpc('systemHealth:getMetrics', async () => {
    if (!databaseAdapter) {
      throw new Error('Banco de dados não configurado.');
    }
    return databaseAdapter.getSystemHealthMetrics();
  });

  handleIpc('imports:getHistory', async (_event, limit?: number) => {
    if (!databaseAdapter) return [];
    return databaseAdapter.getImportHistory(limit);
  });

  handleIpc('imports:recordOperation', async (_event, op: ImportOperation) => {
    if (!databaseAdapter) throw new Error('Banco não conectado.');
    await databaseAdapter.recordImportOperation(op);
    return true;
  });

  handleIpc('settings:getSettings', async () => {
    if (!databaseAdapter) return {};
    return databaseAdapter.getSettings();
  });

  handleIpc('settings:updateSettings', async (_event, data: Record<string, unknown>) => {
    if (!databaseAdapter) throw new Error('Banco não conectado.');
    await databaseAdapter.updateSettings(data);
    return true;
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    frame: false,
    backgroundColor: '#FFFFFF',
    webPreferences: {
      preload: resolvePreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    mainWindow.loadURL(devUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', (event, targetUrl) => {
    const isDev = Boolean(devUrl);
    if (!isDev || !devUrl || !targetUrl.startsWith(devUrl)) {
      event.preventDefault();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

const singleInstanceLock = app.requestSingleInstanceLock();
if (!singleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    registerIpcHandlers();
    await initializeDatabase();
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });

  app.on('window-all-closed', async () => {
    if (databaseAdapter) {
      await databaseAdapter.disconnect();
    }
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
}
