import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SQLiteAdapter } from '../electron/database/SQLiteAdapter';
import fs from 'fs';
import path from 'path';

describe('SQLiteAdapter', () => {
  const testDbPath = path.join(__dirname, 'test_lumiax.db');
  let adapter: SQLiteAdapter;

  beforeEach(async () => {
    if (fs.existsSync(testDbPath)) {
      try {
        fs.unlinkSync(testDbPath);
      } catch {
        // Ignora se ocupado
      }
    }
    adapter = new SQLiteAdapter({
      provider: 'sqlite',
      filename: testDbPath,
    });
    await adapter.connect();
  });

  afterEach(async () => {
    if (adapter.isConnected()) {
      await adapter.disconnect();
    }
    if (fs.existsSync(testDbPath)) {
      try {
        fs.unlinkSync(testDbPath);
      } catch {
        // Ignora se ocupado
      }
    }
  });

  it('deve conectar e confirmar status conectado', async () => {
    expect(adapter.isConnected()).toBe(true);
    const info = await adapter.getDatabaseInfo();
    expect(info.connected).toBe(true);
    expect(info.provider).toBe('sqlite');
  });

  it('deve registrar operação de importação e recuperá-la no histórico', async () => {
    await adapter.recordImportOperation({
      operation: 'Importação Teste Demanda',
      fileName: 'demanda_outubro.xlsx',
      period: '2026-10',
      records: 150,
      status: 'success',
    });

    const history = await adapter.getImportHistory(5);
    expect(history.length).toBe(1);
    expect(history[0].operation).toBe('Importação Teste Demanda');
    expect(history[0].fileName).toBe('demanda_outubro.xlsx');
    expect(history[0].period).toBe('2026-10');
    expect(history[0].records).toBe(150);
    expect(history[0].status).toBe('success');
  });

  it('deve salvar e carregar configurações na tabela settings', async () => {
    await adapter.updateSettings({
      temaPadrao: 'corporativo',
      limiteImportacao: 5000,
    });

    const settings = await adapter.getSettings();
    expect(settings.temaPadrao).toBe('corporativo');
    expect(settings.limiteImportacao).toBe(5000);
  });

  it('deve retornar métricas de saúde com as tabelas criadas', async () => {
    const health = await adapter.getSystemHealthMetrics();
    expect(health.database.connected).toBe(true);
    expect(health.tables.some((t) => t.name === 'import_operations')).toBe(true);
    expect(health.tables.some((t) => t.name === 'system_access')).toBe(true);
  });
});
