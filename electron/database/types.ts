export interface DatabaseConfig {
  provider: 'sqlite';
  filename?: string;
}

export interface DatabaseInfo {
  provider: string;
  connected: boolean;
  databaseName?: string;
  tableCount?: number;
}

export type ReimportPolicy = 'replace' | 'append';

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

export interface Cliente {
  id?: number;
  codigoOrigem?: string;
  nome: string;
  tipoServico: string;
  ativo: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface DemandaMetodosGraficosRecord {
  id?: number;
  periodo: string;
  importOperationId?: number;
  nomePaciente?: string;
  chaveIntegracaoPaciente?: string;
  codigoExame: string;
  chaveIntegracaoExame?: string;
  nomeTipoExame?: string;
  nomeMedico?: string;
  nomeUnidade?: string;
  nomeCliente?: string;
  clienteId?: string;
  dataCriacaoExame?: string;
  dataCriacaoLaudo?: string;
  statusExame?: string;
  complementoRecusa?: string;
  motivoRecusa?: string;
  nomeOperador?: string;
  createdAt?: string;
}

export interface DemandaRadiografiaRecord {
  id?: number;
  periodo: string;
  importOperationId?: number;
  idPaciente: string;
  nomePaciente?: string;
  dataCaptura?: string;
  dataEnvio?: string;
  modalidade: string;
  descricaoExame?: string;
  tipoEstudo?: string;
  unidade?: string;
  unidadeId?: string;
  status?: string;
  medicoAssina?: string;
  medicoAtribuido?: string;
  dataAssinatura?: string;
  tecnicoRadiologia?: string;
  birads?: string;
  idadePaciente?: string;
  dataNascimentoPaciente?: string;
  sexoPaciente?: string;
  medicoReferencia?: string;
  medicoSolicitante?: string;
  canalVenda?: string;
  prioridade?: string;
  numeroRegistro?: string;
  sla?: string;
  resultadosAi?: string;
  pendente?: string;
  reconvocado?: string;
  createdAt?: string;
}

export interface ValidationIssue {
  rowNumber: number;
  field: string;
  error: string;
  value?: unknown;
}

export interface FileValidationResult<T = unknown> {
  fileType: 'metodos_graficos' | 'radiografia' | 'clientes';
  totalRows: number;
  validCount: number;
  invalidCount: number;
  validRows: T[];
  issues: ValidationIssue[];
  summary: Record<string, unknown>;
}

export interface ImportResult {
  operationId: number;
  recordsInserted: number;
  recordsReplaced: number;
  status: 'success' | 'warning' | 'error';
  message: string;
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
