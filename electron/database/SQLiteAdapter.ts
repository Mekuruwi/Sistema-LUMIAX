import type { DatabaseConfig } from './types';
import { KnexDatabaseAdapter } from './KnexDatabaseAdapter';
import path from 'path';

function resolveDatabasePath(config: DatabaseConfig): string {
  if (config.filename) {
    return config.filename;
  }
  try {
    // Electron runtime
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { app } = require('electron');
    if (app && typeof app.getPath === 'function') {
      return path.join(app.getPath('userData'), 'lumiax.db');
    }
  } catch {
    // Node.js test environment or fallback
  }
  return path.join(process.cwd(), 'lumiax.db');
}

export class SQLiteAdapter extends KnexDatabaseAdapter {
  constructor(config: DatabaseConfig) {
    const filename = resolveDatabasePath(config);
    super(
      { ...config, provider: 'sqlite', filename },
      'better-sqlite3',
      { filename },
    );
  }
}
