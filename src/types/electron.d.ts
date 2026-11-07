import type { DatabaseInfo, ImportOperation, SystemHealthMetrics } from './index';

declare global {
  interface Window {
    electronAPI: {
      logError: (context: string, message: string, stack?: string) => Promise<boolean>;
      windowControls: {
        minimize: () => Promise<void>;
        toggleMaximize: () => Promise<void>;
        toggleFullscreen: () => Promise<void>;
        close: () => Promise<void>;
        editCommand: (command: string) => Promise<void>;
      };
      database: {
        getInfo: () => Promise<DatabaseInfo>;
        testConnection: () => Promise<DatabaseInfo>;
      };
      systemHealth: {
        getMetrics: () => Promise<SystemHealthMetrics>;
      };
      imports: {
        getHistory: (limit?: number) => Promise<ImportOperation[]>;
        recordOperation: (op: ImportOperation) => Promise<boolean>;
      };
      settings: {
        getSettings: () => Promise<Record<string, unknown>>;
        updateSettings: (data: Record<string, unknown>) => Promise<boolean>;
      };
    };
  }
}

export {};
