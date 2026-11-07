import { useEffect, useState } from 'react';
import {
  Activity,
  Database,
  Cpu,
  Clock,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import type { SystemHealthMetrics } from '../types';

export function SystemHealthPage() {
  const [metrics, setMetrics] = useState<SystemHealthMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      if (window.electronAPI) {
        const data = await window.electronAPI.systemHealth.getMetrics();
        setMetrics(data);
      }
    } catch (err: any) {
      console.error('Falha ao obter métricas de saúde:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      if (window.electronAPI) {
        await window.electronAPI.database.testConnection();
        setTestResult('Conexão com o banco SQLite validada com sucesso!');
        await loadMetrics();
      }
    } catch (err: any) {
      setTestResult(`Falha no teste: ${err?.message || 'Erro de conexão'}`);
    } finally {
      setTesting(false);
    }
  };

  const formatUptime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  return (
    <div className="h-full overflow-y-auto p-8">
      {/* Cabeçalho */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Saúde do Sistema
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Diagnóstico operacional e integridade do banco de dados local.
          </p>
        </div>
        <button
          type="button"
          onClick={loadMetrics}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-3.5 py-2 text-xs font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--border-color)]"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Atualizar Diagnóstico
        </button>
      </div>

      {/* Cartões de Indicadores Técnicos */}
      <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-3">
        {/* Conexão com SQLite */}
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Database size={20} />
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                Banco de Dados
              </div>
              <div className="text-base font-bold text-[var(--text-primary)]">
                {metrics?.database.connected ? 'SQLite Ativo' : 'Desconectado'}
              </div>
            </div>
          </div>
          <div className="mt-4 border-t border-[var(--border-color)] pt-3 text-xs text-[var(--text-secondary)]">
            Arquivo: <span className="font-mono">{metrics?.database.databaseName || 'lumiax.db'}</span>
          </div>
        </div>

        {/* Uso de Memória */}
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-color)]/10 text-[var(--accent-color)]">
              <Cpu size={20} />
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                Memória Alocada
              </div>
              <div className="text-base font-bold text-[var(--text-primary)]">
                {metrics?.memoryUsageMb ?? '—'} MB
              </div>
            </div>
          </div>
          <div className="mt-4 border-t border-[var(--border-color)] pt-3 text-xs text-[var(--text-secondary)]">
            Heap do processo Node.js / Electron
          </div>
        </div>

        {/* Tempo de Execução */}
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Clock size={20} />
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                Tempo Ativo
              </div>
              <div className="text-base font-bold text-[var(--text-primary)]">
                {metrics ? formatUptime(metrics.uptimeSeconds) : '—'}
              </div>
            </div>
          </div>
          <div className="mt-4 border-t border-[var(--border-color)] pt-3 text-xs text-[var(--text-secondary)]">
            Desde a inicialização da aplicação
          </div>
        </div>
      </div>

      {/* Teste de Conexão */}
      <div className="mb-8 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Validação da Conexão Local
            </h2>
            <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
              Executa uma consulta de integridade no motor SQLite via Knex Database Adapter.
            </p>
          </div>
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing}
            className="flex items-center gap-2 rounded-lg bg-[var(--accent-color)] px-4 py-2 text-xs font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <Activity size={15} className={testing ? 'animate-pulse' : ''} />
            {testing ? 'Testando...' : 'Testar Conexão'}
          </button>
        </div>

        {testResult && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-[var(--bg-primary)] p-3 text-xs font-medium text-[var(--text-primary)] border border-[var(--border-color)]">
            <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
            <span>{testResult}</span>
          </div>
        )}
      </div>

      {/* Tabelas de Infraestrutura */}
      <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-[var(--text-primary)]">
          Tabelas do Banco de Dados
        </h2>
        {metrics?.tables && metrics.tables.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[var(--border-color)] text-xs uppercase text-[var(--text-secondary)]">
                <tr>
                  <th className="pb-3 font-semibold">Nome da Tabela</th>
                  <th className="pb-3 font-semibold">Finalidade</th>
                  <th className="pb-3 font-semibold text-right">Registros</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {metrics.tables.map((tbl) => (
                  <tr key={tbl.name} className="hover:bg-[var(--bg-secondary)]/50">
                    <td className="py-3 font-mono font-medium text-[var(--text-primary)]">
                      {tbl.name}
                    </td>
                    <td className="py-3 text-xs text-[var(--text-secondary)]">
                      {tbl.name === 'import_operations'
                        ? 'Auditoria de lotes e importações de dados'
                        : tbl.name === 'system_access'
                        ? 'Registro de inicialização e integridade do app'
                        : tbl.name === 'settings'
                        ? 'Preferências de configuração locais'
                        : 'Tabela do domínio'}
                    </td>
                    <td className="py-3 text-right font-medium text-[var(--text-primary)]">
                      {tbl.rows}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-4 text-center text-xs text-[var(--text-secondary)]">
            Nenhuma tabela encontrada.
          </div>
        )}
      </div>
    </div>
  );
}
