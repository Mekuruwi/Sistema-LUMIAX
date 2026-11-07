import { useEffect, useState } from 'react';
import { Table2, Search, RefreshCw, FileText } from 'lucide-react';
import type { ImportOperation } from '../types';

export function TablesPage() {
  const [activeTable, setActiveTable] = useState<'import_operations' | 'settings'>('import_operations');
  const [operations, setOperations] = useState<ImportOperation[]>([]);
  const [settings, setSettings] = useState<Record<string, unknown>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      if (window.electronAPI) {
        if (activeTable === 'import_operations') {
          const rows = await window.electronAPI.imports.getHistory(50);
          setOperations(rows || []);
        } else {
          const s = await window.electronAPI.settings.getSettings();
          setSettings(s || {});
        }
      }
    } catch (err) {
      console.error('Falha ao carregar tabela:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTable]);

  const filteredOperations = operations.filter((op) => {
    const term = searchTerm.toLowerCase();
    return (
      op.operation.toLowerCase().includes(term) ||
      (op.fileName && op.fileName.toLowerCase().includes(term)) ||
      (op.period && op.period.toLowerCase().includes(term))
    );
  });

  return (
    <div className="h-full overflow-y-auto p-8">
      {/* Cabeçalho */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Tabelas e Dados
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Consulta e manutenção de tabelas do sistema e registros importados.
          </p>
        </div>
        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 self-start rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-3.5 py-2 text-xs font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--border-color)]"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Atualizar Tabela
        </button>
      </div>

      {/* Seletor de Tabelas */}
      <div className="mb-6 flex border-b border-[var(--border-color)]">
        <button
          type="button"
          onClick={() => setActiveTable('import_operations')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-medium transition-colors ${
            activeTable === 'import_operations'
              ? 'border-[var(--accent-color)] text-[var(--accent-color)]'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <FileText size={16} />
          Histórico de Importações (import_operations)
        </button>
        <button
          type="button"
          onClick={() => setActiveTable('settings')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-medium transition-colors ${
            activeTable === 'settings'
              ? 'border-[var(--accent-color)] text-[var(--accent-color)]'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Table2 size={16} />
          Configurações do Banco (settings)
        </button>
      </div>

      {/* Barra de Pesquisa */}
      {activeTable === 'import_operations' && (
        <div className="mb-6 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]"
            />
            <input
              type="text"
              placeholder="Pesquisar por operação, arquivo ou período..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] py-2 pl-9 pr-4 text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:border-[var(--accent-color)] focus:outline-none"
            />
          </div>
          <span className="text-xs text-[var(--text-secondary)]">
            Total: <strong>{filteredOperations.length}</strong> registros
          </span>
        </div>
      )}

      {/* Conteúdo da Tabela */}
      <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-6 shadow-sm">
        {loading ? (
          <div className="py-12 text-center text-sm text-[var(--text-secondary)]">
            Carregando dados da tabela...
          </div>
        ) : activeTable === 'import_operations' ? (
          filteredOperations.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm font-medium text-[var(--text-primary)]">
                Nenhum registro encontrado
              </p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                Realize importações para visualizar o log operacional detalhado aqui.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[var(--border-color)] uppercase text-[var(--text-secondary)]">
                  <tr>
                    <th className="pb-3 font-semibold">ID</th>
                    <th className="pb-3 font-semibold">Operação</th>
                    <th className="pb-3 font-semibold">Arquivo</th>
                    <th className="pb-3 font-semibold">Período</th>
                    <th className="pb-3 font-semibold">Registros</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold">Detalhes / Erro</th>
                    <th className="pb-3 font-semibold">Data / Hora</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {filteredOperations.map((op) => (
                    <tr key={op.id} className="hover:bg-[var(--bg-secondary)]/50">
                      <td className="py-2.5 font-mono text-[var(--text-secondary)]">
                        #{op.id}
                      </td>
                      <td className="py-2.5 font-medium text-[var(--text-primary)]">
                        {op.operation}
                      </td>
                      <td className="py-2.5 text-[var(--text-secondary)]">
                        {op.fileName || '—'}
                      </td>
                      <td className="py-2.5 font-mono text-[var(--text-secondary)]">
                        {op.period || '—'}
                      </td>
                      <td className="py-2.5 text-[var(--text-primary)] font-medium">
                        {op.records}
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            op.status === 'success'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : op.status === 'warning'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                          }`}
                        >
                          {op.status === 'success'
                            ? 'Sucesso'
                            : op.status === 'warning'
                            ? 'Atenção'
                            : 'Erro'}
                        </span>
                      </td>
                      <td className="py-2.5 max-w-xs truncate text-[var(--text-secondary)]" title={op.errorMessage}>
                        {op.errorMessage || '—'}
                      </td>
                      <td className="py-2.5 text-[var(--text-secondary)]">
                        {op.createdAt ? new Date(op.createdAt).toLocaleString('pt-BR') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          <div>
            {Object.keys(settings).length === 0 ? (
              <div className="py-8 text-center text-xs text-[var(--text-secondary)]">
                Nenhuma configuração salva na tabela settings.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-[var(--border-color)] uppercase text-[var(--text-secondary)]">
                    <tr>
                      <th className="pb-3 font-semibold">Chave</th>
                      <th className="pb-3 font-semibold">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-color)]">
                    {Object.entries(settings).map(([k, v]) => (
                      <tr key={k} className="hover:bg-[var(--bg-secondary)]/50">
                        <td className="py-2.5 font-mono font-medium text-[var(--text-primary)]">
                          {k}
                        </td>
                        <td className="py-2.5 font-mono text-[var(--text-secondary)]">
                          {JSON.stringify(v)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
