import type { DatabaseAdapter } from './DatabaseAdapter';
import type { DatabaseConfig } from './types';
import { SQLiteAdapter } from './SQLiteAdapter';

export class DatabaseFactory {
  static createAdapter(config: DatabaseConfig): DatabaseAdapter {
    if (config.provider === 'sqlite') {
      return new SQLiteAdapter(config);
    }
    throw new Error(`Provedor de banco de dados não suportado: ${config.provider}`);
  }
}
