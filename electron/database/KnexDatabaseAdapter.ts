import type { Knex } from 'knex';
import knex from 'knex';
import type { DatabaseAdapter } from './DatabaseAdapter';
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

export abstract class KnexDatabaseAdapter implements DatabaseAdapter {
  protected readonly config: DatabaseConfig;
  protected readonly db: Knex;
  private connected = false;

  protected constructor(
    config: DatabaseConfig,
    client: Knex.Config['client'],
    connection: Knex.Config['connection'],
  ) {
    this.config = config;
    this.db = knex({
      client,
      connection,
      useNullAsDefault: client === 'better-sqlite3',
    });
  }

  async connect(): Promise<void> {
    await this.db.raw('SELECT 1');
    await this.ensureSchema();
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    await this.db.destroy();
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }

  async testConnection(): Promise<DatabaseInfo> {
    await this.db.raw('SELECT 1');
    return this.getDatabaseInfo();
  }

  async getDatabaseInfo(): Promise<DatabaseInfo> {
    let tableCount = 0;
    try {
      const tables = await this.db.raw(
        "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
      );
      tableCount = Number(tables[0]?.count || 0);
    } catch {
      // Ignora falha não crítica
    }

    return {
      provider: this.config.provider,
      connected: this.connected,
      databaseName: this.config.filename || 'lumiax.db',
      tableCount,
    };
  }

  async getSystemHealthMetrics(): Promise<SystemHealthMetrics> {
    const tableNames = [
      'demanda_metodos_graficos',
      'demanda_radiografia',
      'clientes',
      'import_operations',
      'system_access',
      'settings',
    ];
    const tables: Array<{ name: string; rows: number }> = [];

    for (const name of tableNames) {
      try {
        const has = await this.db.schema.hasTable(name);
        if (has) {
          const res = await this.db(name).count({ count: '*' }).first();
          tables.push({ name, rows: Number(res?.count || 0) });
        }
      } catch {
        tables.push({ name, rows: 0 });
      }
    }

    const recentImports = await this.getImportHistory(10);
    const memory = process.memoryUsage();

    return {
      database: await this.getDatabaseInfo(),
      uptimeSeconds: Math.floor(process.uptime()),
      memoryUsageMb: Math.round(memory.heapUsed / 1024 / 1024),
      tables,
      recentImports,
    };
  }

  async recordImportOperation(op: ImportOperation): Promise<number> {
    const [id] = await this.db('import_operations').insert({
      operation: op.operation,
      file_name: op.fileName || null,
      period: op.period || null,
      records: op.records,
      status: op.status,
      error_message: op.errorMessage || null,
      created_at: this.db.fn.now(),
    });
    return Number(id);
  }

  async getImportHistory(limit = 20): Promise<ImportOperation[]> {
    const rows = await this.db('import_operations')
      .select(
        'id',
        'operation',
        'file_name as fileName',
        'period',
        'records',
        'status',
        'error_message as errorMessage',
        'created_at as createdAt',
      )
      .orderBy('id', 'desc')
      .limit(limit);

    return rows.map((r: any) => ({
      id: Number(r.id),
      operation: String(r.operation),
      fileName: r.fileName ? String(r.fileName) : undefined,
      period: r.period ? String(r.period) : undefined,
      records: Number(r.records),
      status: r.status as ImportOperation['status'],
      errorMessage: r.errorMessage ? String(r.errorMessage) : undefined,
      createdAt: r.createdAt ? String(r.createdAt) : undefined,
    }));
  }

  async importDemandaMetodosGraficos(
    periodo: string,
    records: DemandaMetodosGraficosRecord[],
    fileName: string,
    policy: ReimportPolicy,
  ): Promise<ImportResult> {
    return this.db.transaction(async (trx) => {
      let recordsReplaced = 0;

      if (policy === 'replace') {
        recordsReplaced = await trx('demanda_metodos_graficos')
          .where({ periodo })
          .delete();
      }

      const opId = await trx('import_operations').insert({
        operation: 'Demanda Métodos Gráficos',
        file_name: fileName,
        period: periodo,
        records: records.length,
        status: 'success',
        created_at: this.db.fn.now(),
      });
      const operationId = Number(opId[0]);

      // Mapeamento e extração de clientes únicos para a tabela de clientes
      const clientesMap = new Map<string, { nome: string; codigoOrigem?: string }>();

      // Inserção em lotes de 400 registros
      const chunkSize = 400;
      for (let i = 0; i < records.length; i += chunkSize) {
        const chunk = records.slice(i, i + chunkSize);
        const mappedRows = chunk.map((r) => {
          if (r.nomeCliente) {
            clientesMap.set(r.nomeCliente, {
              nome: r.nomeCliente,
              codigoOrigem: r.clienteId,
            });
          }
          return {
            periodo,
            import_operation_id: operationId,
            nome_paciente: r.nomePaciente || null,
            chave_integracao_paciente: r.chaveIntegracaoPaciente || null,
            codigo_exame: r.codigoExame,
            chave_integracao_exame: r.chaveIntegracaoExame || null,
            nome_tipo_exame: r.nomeTipoExame || null,
            nome_medico: r.nomeMedico || null,
            nome_unidade: r.nomeUnidade || null,
            nome_cliente: r.nomeCliente || null,
            cliente_id: r.clienteId || null,
            data_criacao_exame: r.dataCriacaoExame || null,
            data_criacao_laudo: r.dataCriacaoLaudo || null,
            status_exame: r.statusExame || null,
            complemento_recusa: r.complementoRecusa || null,
            motivo_recusa: r.motivoRecusa || null,
            nome_operador: r.nomeOperador || null,
            created_at: this.db.fn.now(),
          };
        });

        await trx('demanda_metodos_graficos').insert(mappedRows);
      }

      // Atualizar base de clientes
      for (const client of clientesMap.values()) {
        const existing = await trx('clientes')
          .where({ nome: client.nome })
          .first();
        if (!existing) {
          await trx('clientes').insert({
            codigo_origem: client.codigoOrigem || null,
            nome: client.nome,
            tipo_servico: 'METODOS_GRAFICOS',
            ativo: true,
            created_at: this.db.fn.now(),
            updated_at: this.db.fn.now(),
          });
        }
      }

      return {
        operationId,
        recordsInserted: records.length,
        recordsReplaced,
        status: 'success',
        message: `Importação de Métodos Gráficos concluída: ${records.length} exames salvos para o período ${periodo}.`,
      };
    });
  }

  async getDemandaMetodosGraficos(options: {
    periodo?: string;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ total: number; rows: DemandaMetodosGraficosRecord[] }> {
    const { periodo, search, limit = 50, offset = 0 } = options;

    let query = this.db('demanda_metodos_graficos');
    if (periodo) {
      query = query.where('periodo', periodo);
    }
    if (search) {
      query = query.where((b) => {
        b.where('nome_paciente', 'like', `%${search}%`)
          .orWhere('codigo_exame', 'like', `%${search}%`)
          .orWhere('nome_cliente', 'like', `%${search}%`)
          .orWhere('nome_tipo_exame', 'like', `%${search}%`);
      });
    }

    const countRes = await query.clone().count({ count: '*' }).first();
    const total = Number(countRes?.count || 0);

    const rows = await query
      .clone()
      .select(
        'id',
        'periodo',
        'import_operation_id as importOperationId',
        'nome_paciente as nomePaciente',
        'chave_integracao_paciente as chaveIntegracaoPaciente',
        'codigo_exame as codigoExame',
        'chave_integracao_exame as chaveIntegracaoExame',
        'nome_tipo_exame as nomeTipoExame',
        'nome_medico as nomeMedico',
        'nome_unidade as nomeUnidade',
        'nome_cliente as nomeCliente',
        'cliente_id as clienteId',
        'data_criacao_exame as dataCriacaoExame',
        'data_criacao_laudo as dataCriacaoLaudo',
        'status_exame as statusExame',
        'complemento_recusa as complementoRecusa',
        'motivo_recusa as motivoRecusa',
        'nome_operador as nomeOperador',
        'created_at as createdAt',
      )
      .orderBy('id', 'desc')
      .limit(limit)
      .offset(offset);

    return { total, rows };
  }

  async importDemandaRadiografia(
    periodo: string,
    records: DemandaRadiografiaRecord[],
    fileName: string,
    policy: ReimportPolicy,
  ): Promise<ImportResult> {
    return this.db.transaction(async (trx) => {
      let recordsReplaced = 0;

      if (policy === 'replace') {
        recordsReplaced = await trx('demanda_radiografia')
          .where({ periodo })
          .delete();
      }

      const opId = await trx('import_operations').insert({
        operation: 'Demanda Radiografia',
        file_name: fileName,
        period: periodo,
        records: records.length,
        status: 'success',
        created_at: this.db.fn.now(),
      });
      const operationId = Number(opId[0]);

      const unidadesMap = new Map<string, { nome: string; codigoOrigem?: string }>();

      const chunkSize = 400;
      for (let i = 0; i < records.length; i += chunkSize) {
        const chunk = records.slice(i, i + chunkSize);
        const mappedRows = chunk.map((r) => {
          if (r.unidade) {
            unidadesMap.set(r.unidade, {
              nome: r.unidade,
              codigoOrigem: r.unidadeId,
            });
          }
          return {
            periodo,
            import_operation_id: operationId,
            id_paciente: r.idPaciente,
            nome_paciente: r.nomePaciente || null,
            data_captura: r.dataCaptura || null,
            data_envio: r.dataEnvio || null,
            modalidade: r.modalidade,
            descricao_exame: r.descricaoExame || null,
            tipo_estudo: r.tipoEstudo || null,
            unidade: r.unidade || null,
            unidade_id: r.unidadeId || null,
            status: r.status || null,
            medico_assina: r.medicoAssina || null,
            medico_atribuido: r.medicoAtribuido || null,
            data_assinatura: r.dataAssinatura || null,
            tecnico_radiologia: r.tecnicoRadiologia || null,
            birads: r.birads || null,
            idade_paciente: r.idadePaciente || null,
            data_nascimento_paciente: r.dataNascimentoPaciente || null,
            sexo_paciente: r.sexoPaciente || null,
            medico_referencia: r.medicoReferencia || null,
            medico_solicitante: r.medicoSolicitante || null,
            canal_venda: r.canalVenda || null,
            prioridade: r.prioridade || null,
            numero_registro: r.numeroRegistro || null,
            sla: r.sla || null,
            resultados_ai: r.resultadosAi || null,
            pendente: r.pendente || null,
            reconvocado: r.reconvocado || null,
            created_at: this.db.fn.now(),
          };
        });

        await trx('demanda_radiografia').insert(mappedRows);
      }

      for (const unit of unidadesMap.values()) {
        const existing = await trx('clientes')
          .where({ nome: unit.nome })
          .first();
        if (!existing) {
          await trx('clientes').insert({
            codigo_origem: unit.codigoOrigem || null,
            nome: unit.nome,
            tipo_servico: 'RADIOGRAFIA',
            ativo: true,
            created_at: this.db.fn.now(),
            updated_at: this.db.fn.now(),
          });
        }
      }

      return {
        operationId,
        recordsInserted: records.length,
        recordsReplaced,
        status: 'success',
        message: `Importação de Radiografia concluída: ${records.length} exames salvos para o período ${periodo}.`,
      };
    });
  }

  async getDemandaRadiografia(options: {
    periodo?: string;
    modalidade?: string;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ total: number; rows: DemandaRadiografiaRecord[] }> {
    const { periodo, modalidade, search, limit = 50, offset = 0 } = options;

    let query = this.db('demanda_radiografia');
    if (periodo) {
      query = query.where('periodo', periodo);
    }
    if (modalidade) {
      query = query.where('modalidade', modalidade);
    }
    if (search) {
      query = query.where((b) => {
        b.where('nome_paciente', 'like', `%${search}%`)
          .orWhere('id_paciente', 'like', `%${search}%`)
          .orWhere('unidade', 'like', `%${search}%`)
          .orWhere('descricao_exame', 'like', `%${search}%`);
      });
    }

    const countRes = await query.clone().count({ count: '*' }).first();
    const total = Number(countRes?.count || 0);

    const rows = await query
      .clone()
      .select(
        'id',
        'periodo',
        'import_operation_id as importOperationId',
        'id_paciente as idPaciente',
        'nome_paciente as nomePaciente',
        'data_captura as dataCaptura',
        'data_envio as dataEnvio',
        'modalidade',
        'descricao_exame as descricaoExame',
        'tipo_estudo as tipoEstudo',
        'unidade',
        'unidade_id as unidadeId',
        'status',
        'medico_assina as medicoAssina',
        'medico_atribuido as medicoAtribuido',
        'data_assinatura as dataAssinatura',
        'tecnico_radiologia as tecnicoRadiologia',
        'birads',
        'idade_paciente as idadePaciente',
        'data_nascimento_paciente as dataNascimentoPaciente',
        'sexo_paciente as sexoPaciente',
        'medico_referencia as medicoReferencia',
        'medico_solicitante as medicoSolicitante',
        'canal_venda as canalVenda',
        'prioridade',
        'numero_registro as numeroRegistro',
        'sla',
        'resultados_ai as resultadosAi',
        'pendente',
        'reconvocado',
        'created_at as createdAt',
      )
      .orderBy('id', 'desc')
      .limit(limit)
      .offset(offset);

    return { total, rows };
  }

  async getClientes(tipoServico?: string): Promise<Cliente[]> {
    let query = this.db('clientes');
    if (tipoServico) {
      query = query.where('tipo_servico', tipoServico);
    }
    const rows = await query.select(
      'id',
      'codigo_origem as codigoOrigem',
      'nome',
      'tipo_servico as tipoServico',
      'ativo',
      'created_at as createdAt',
      'updated_at as updatedAt',
    ).orderBy('nome', 'asc');

    return rows.map((r: any) => ({
      id: Number(r.id),
      codigoOrigem: r.codigoOrigem ? String(r.codigoOrigem) : undefined,
      nome: String(r.nome),
      tipoServico: String(r.tipoServico),
      ativo: Boolean(r.ativo),
      createdAt: r.createdAt ? String(r.createdAt) : undefined,
      updatedAt: r.updatedAt ? String(r.updatedAt) : undefined,
    }));
  }

  async getPeriodos(): Promise<string[]> {
    const mgPeriods = await this.db('demanda_metodos_graficos')
      .distinct('periodo')
      .pluck('periodo');
    const radPeriods = await this.db('demanda_radiografia')
      .distinct('periodo')
      .pluck('periodo');

    const set = new Set<string>([...mgPeriods, ...radPeriods].filter(Boolean));
    return Array.from(set).sort().reverse();
  }

  async getSettings(): Promise<Record<string, unknown>> {
    const rows = await this.db('settings').select('key', 'value');
    const result: Record<string, unknown> = {};
    for (const row of rows) {
      try {
        result[row.key] = JSON.parse(row.value);
      } catch {
        result[row.key] = row.value;
      }
    }
    return result;
  }

  async updateSettings(data: Record<string, unknown>): Promise<void> {
    await this.db.transaction(async (trx) => {
      for (const [key, val] of Object.entries(data)) {
        const strVal = JSON.stringify(val);
        await trx('settings')
          .insert({ key, value: strVal })
          .onConflict('key')
          .merge({ value: strVal });
      }
    });
  }

  protected async ensureSchema(): Promise<void> {
    if (!(await this.db.schema.hasTable('settings'))) {
      await this.db.schema.createTable('settings', (table) => {
        table.string('key').primary();
        table.text('value').notNullable();
      });
    }

    if (!(await this.db.schema.hasTable('import_operations'))) {
      await this.db.schema.createTable('import_operations', (table) => {
        table.increments('id').primary();
        table.text('operation').notNullable();
        table.text('file_name');
        table.text('period');
        table.integer('records').notNullable().defaultTo(0);
        table.text('status').notNullable();
        table.text('error_message');
        table.timestamp('created_at').notNullable().defaultTo(this.db.fn.now());
      });
    }

    if (!(await this.db.schema.hasTable('clientes'))) {
      await this.db.schema.createTable('clientes', (table) => {
        table.increments('id').primary();
        table.text('codigo_origem');
        table.text('nome').notNullable().unique();
        table.text('tipo_servico').notNullable();
        table.boolean('ativo').defaultTo(true);
        table.timestamp('created_at').notNullable().defaultTo(this.db.fn.now());
        table.timestamp('updated_at').notNullable().defaultTo(this.db.fn.now());
      });
    }

    if (!(await this.db.schema.hasTable('demanda_metodos_graficos'))) {
      await this.db.schema.createTable('demanda_metodos_graficos', (table) => {
        table.increments('id').primary();
        table.string('periodo').notNullable().index();
        table.integer('import_operation_id').references('id').inTable('import_operations');
        table.text('nome_paciente');
        table.text('chave_integracao_paciente');
        table.text('codigo_exame').notNullable().index();
        table.text('chave_integracao_exame');
        table.text('nome_tipo_exame');
        table.text('nome_medico');
        table.text('nome_unidade');
        table.text('nome_cliente');
        table.text('cliente_id').index();
        table.text('data_criacao_exame');
        table.text('data_criacao_laudo');
        table.text('status_exame');
        table.text('complemento_recusa');
        table.text('motivo_recusa');
        table.text('nome_operador');
        table.timestamp('created_at').notNullable().defaultTo(this.db.fn.now());
      });
    }

    if (!(await this.db.schema.hasTable('demanda_radiografia'))) {
      await this.db.schema.createTable('demanda_radiografia', (table) => {
        table.increments('id').primary();
        table.string('periodo').notNullable().index();
        table.integer('import_operation_id').references('id').inTable('import_operations');
        table.text('id_paciente').notNullable().index();
        table.text('nome_paciente');
        table.text('data_captura');
        table.text('data_envio');
        table.text('modalidade').notNullable().index();
        table.text('descricao_exame');
        table.text('tipo_estudo');
        table.text('unidade');
        table.text('unidade_id').index();
        table.text('status');
        table.text('medico_assina');
        table.text('medico_atribuido');
        table.text('data_assinatura');
        table.text('tecnico_radiologia');
        table.text('birads');
        table.text('idade_paciente');
        table.text('data_nascimento_paciente');
        table.text('sexo_paciente');
        table.text('medico_referencia');
        table.text('medico_solicitante');
        table.text('canal_venda');
        table.text('prioridade');
        table.text('numero_registro');
        table.text('sla');
        table.text('resultados_ai');
        table.text('pendente');
        table.text('reconvocado');
        table.timestamp('created_at').notNullable().defaultTo(this.db.fn.now());
      });
    }

    if (!(await this.db.schema.hasTable('system_access'))) {
      await this.db.schema.createTable('system_access', (table) => {
        table.integer('id').primary();
        table.timestamp('last_access_at').notNullable();
      });
    }

    await this.db('system_access')
      .insert({ id: 1, last_access_at: this.db.fn.now() })
      .onConflict('id')
      .merge({ last_access_at: this.db.fn.now() });
  }
}
