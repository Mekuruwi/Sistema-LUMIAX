import type {
  Cliente,
  DatabaseConfig,
  DatabaseInfo,
  DemandaMetodosGraficosRecord,
  DemandaRadiografiaRecord,
  ImportOperation,
  ImportResult,
  ReimportPolicy,
  SystemHealthMetrics,
} from './types';

export interface DatabaseAdapter {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  testConnection(): Promise<DatabaseInfo>;
  getDatabaseInfo(): Promise<DatabaseInfo>;
  getSystemHealthMetrics(): Promise<SystemHealthMetrics>;

  // Importações e Auditoria
  recordImportOperation(op: ImportOperation): Promise<number>;
  getImportHistory(limit?: number): Promise<ImportOperation[]>;

  // Demanda Métodos Gráficos
  importDemandaMetodosGraficos(
    periodo: string,
    records: DemandaMetodosGraficosRecord[],
    fileName: string,
    policy: ReimportPolicy,
  ): Promise<ImportResult>;
  getDemandaMetodosGraficos(options?: {
    periodo?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ total: number; rows: DemandaMetodosGraficosRecord[] }>;

  // Demanda Radiografia
  importDemandaRadiografia(
    periodo: string,
    records: DemandaRadiografiaRecord[],
    fileName: string,
    policy: ReimportPolicy,
  ): Promise<ImportResult>;
  getDemandaRadiografia(options?: {
    periodo?: string;
    modalidade?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ total: number; rows: DemandaRadiografiaRecord[] }>;

  // Clientes e Bases de Apoio
  getClientes(tipoServico?: string): Promise<Cliente[]>;
  getPeriodos(): Promise<string[]>;

  // Configurações
  getSettings(): Promise<Record<string, unknown>>;
  updateSettings(data: Record<string, unknown>): Promise<void>;
}

export type DatabaseAdapterConfig = DatabaseConfig;
