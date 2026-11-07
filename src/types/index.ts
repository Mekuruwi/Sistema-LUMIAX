export type Theme = 'light' | 'dark';

export interface ImportOperation {
  id?: number;
  operation: string;
  fileName?: string;
  period?: string;
  records: number;
  status: 'success' | 'warning' | 'error';
  errorMessage?: string;
  createdAt?: string;
}

export interface DatabaseInfo {
  provider: string;
  connected: boolean;
  databaseName?: string;
  tableCount?: number;
}

export interface SystemHealthMetrics {
  database: DatabaseInfo;
  uptimeSeconds: number;
  memoryUsageMb: number;
  tables: Array<{
    name: string;
    rows: number;
  }>;
  recentImports: ImportOperation[];
}
