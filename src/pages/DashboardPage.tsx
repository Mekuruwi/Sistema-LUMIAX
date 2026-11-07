import { useEffect, useState } from 'react';
import { Database, FileSpreadsheet, History, Info, CheckCircle2 } from 'lucide-react';
import type { DatabaseInfo, ImportOperation } from '../types';

export function DashboardPage() {
  const [dbInfo, setDbInfo] = useState<DatabaseInfo | null>(null);
  const [recentImports, setRecentImports] = useState<ImportOperation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        if (window.electronAPI) {
          const [info, history] = await Promise.all([
            window.electronAPI.database.getInfo().catch(() => null),
            window.electronAPI.imports.getHistory(5).catch(() => []),
          ]);
          setDbInfo(info);
          setRecentImports(history || []);
        }
      } catch (err) {
        console.error('Falha ao carregar dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="h-full overflow-y-auto p-8">
      {/* Cabeçalho */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Visão geral do estado das importações e integridade do Sistema Lumiax.
        </p>
      </div>

      {/* Cartões de Status Real */}
      <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {/* Status da Base */}
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-color)]/10 text-[var(--accent-color)]">
              <Database size={20} />
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                Banco de Dados Local
              </div>
              <div className="text-lg font-semibold text-[var(--text-primary)]">
                {dbInfo?.connected ? 'Conectado (SQLite)' : 'Inicializando...'}
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            <span
              className={`h-2 w-2 rounded-full ${
                dbInfo?.connected ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
            {dbInfo?.databaseName || 'lumiax.db'}
          </div>
        </div>

        {/* Lotes de Demanda */}
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-color)]/10 text-[var(--accent-color)]">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                Lotes Processados
              </div>
              <div className="text-lg font-semibold text-[var(--text-primary)]">
                {recentImports.length} {recentImports.length === 1 ? 'lote' : 'lotes'}
              </div>
            </div>
          </div>
          <div className="mt-4 text-xs text-[var(--text-secondary)]">
            Histórico recente de importações
          </div>
        </div>

        {/* Estado Operacional */}
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                Estado do Sistema
              </div>
              <div className="text-lg font-semibold text-[var(--text-primary)]">
                Operacional
              </div>
            </div>
          </div>
          <div className="mt-4 text-xs text-[var(--text-secondary)]">
            Fluxo de dados ativo e pronto para importação
          </div>
        </div>
      </div>

      {/* Nota Informativa sobre o Escopo */}
      <div className="mb-8 flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50/60 p-4 text-sky-900 dark:border-sky-900/60 dark:bg-sky-950/20 dark:text-sky-300">
        <Info size={20} className="mt-0.5 shrink-0" />
        <div className="text-sm">
          <span className="font-semibold">Fluxo de Dados Inicial:</span> A prioridade
          desta fase é a importação, validação e persistência dos dados de demanda e
          bases de apoio. Indicadores analíticos e relatórios serão ativados após a
          consolidação e validação dos dados reais.
        </div>
      </div>

      {/* Histórico Recente de Importações */}
      <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History size={18} className="text-[var(--text-secondary)]" />
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Últimas Importações
            </h2>
          </div>
        </div>

        {loading ? (
          <div className="py-8 text-center text-sm text-[var(--text-secondary)]">
            Carregando histórico...
          </div>
        ) : recentImports.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[var(--border-color)] py-12 text-center">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              Nenhuma importação registrada até o momento
            </p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              Acesse a página de <strong>Importação</strong> para carregar as bases de
              apoio ou o arquivo de demanda mensal.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[var(--border-color)] text-xs uppercase text-[var(--text-secondary)]">
                <tr>
                  <th className="pb-3 font-semibold">Operação</th>
                  <th className="pb-3 font-semibold">Arquivo</th>
                  <th className="pb-3 font-semibold">Período</th>
                  <th className="pb-3 font-semibold">Registros</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {recentImports.map((imp, idx) => (
                  <tr key={imp.id || idx} className="hover:bg-[var(--bg-secondary)]/50">
                    <td className="py-3 font-medium text-[var(--text-primary)]">
                      {imp.operation}
                    </td>
                    <td className="py-3 text-[var(--text-secondary)]">
                      {imp.fileName || '—'}
                    </td>
                    <td className="py-3 text-[var(--text-secondary)]">
                      {imp.period || '—'}
                    </td>
                    <td className="py-3 text-[var(--text-primary)]">
                      {imp.records}
                    </td>
                    <td className="py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          imp.status === 'success'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : imp.status === 'warning'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                        }`}
                      >
                        {imp.status === 'success'
                          ? 'Sucesso'
                          : imp.status === 'warning'
                          ? 'Atenção'
                          : 'Erro'}
                      </span>
                    </td>
                    <td className="py-3 text-xs text-[var(--text-secondary)]">
                      {imp.createdAt
                        ? new Date(imp.createdAt).toLocaleString('pt-BR')
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
