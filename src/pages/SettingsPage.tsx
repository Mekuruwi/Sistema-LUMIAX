import { useEffect, useState } from 'react';
import { Sun, Moon, Database, Info, ShieldCheck, Check } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';
import type { DatabaseInfo } from '../types';

export function SettingsPage() {
  const { theme, setTheme } = useThemeStore();
  const [dbInfo, setDbInfo] = useState<DatabaseInfo | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    async function loadConfig() {
      if (window.electronAPI) {
        try {
          const info = await window.electronAPI.database.getInfo();
          setDbInfo(info);
        } catch (err) {
          console.error('Falha ao carregar configurações:', err);
        }
      }
    }
    loadConfig();
  }, []);

  const handleSelectTheme = (selectedTheme: 'light' | 'dark') => {
    setTheme(selectedTheme);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div className="h-full overflow-y-auto p-8">
      {/* Cabeçalho */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
          Configurações
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Preferências visuais, integridade do ambiente e configurações locais.
        </p>
      </div>

      <div className="max-w-4xl space-y-6">
        {/* Aparência e Tema */}
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
            <div>
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                Aparência da Aplicação
              </h2>
              <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                Selecione o tema corporativo da interface de usuário.
              </p>
            </div>
            {saveSuccess && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <Check size={14} /> Preferência salva
              </span>
            )}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Opção Claro */}
            <button
              type="button"
              onClick={() => handleSelectTheme('light')}
              className={`flex items-start gap-4 rounded-xl border p-4 text-left transition-all ${
                theme === 'light'
                  ? 'border-[var(--accent-color)] bg-[var(--accent-color)]/5 ring-1 ring-[var(--accent-color)]'
                  : 'border-[var(--border-color)] bg-[var(--bg-secondary)]/50 hover:bg-[var(--bg-secondary)]'
              }`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
                <Sun size={20} />
              </div>
              <div>
                <div className="text-sm font-semibold text-[var(--text-primary)]">
                  Corporativo Claro
                </div>
                <div className="mt-1 text-xs text-[var(--text-secondary)]">
                  Fundo limpo e neutro (#FFFFFF), alto contraste e detalhes na cor corporativa (#1B2A4E).
                </div>
              </div>
            </button>

            {/* Opção Escuro */}
            <button
              type="button"
              onClick={() => handleSelectTheme('dark')}
              className={`flex items-start gap-4 rounded-xl border p-4 text-left transition-all ${
                theme === 'dark'
                  ? 'border-[var(--accent-color)] bg-[var(--accent-color)]/5 ring-1 ring-[var(--accent-color)]'
                  : 'border-[var(--border-color)] bg-[var(--bg-secondary)]/50 hover:bg-[var(--bg-secondary)]'
              }`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                <Moon size={20} />
              </div>
              <div>
                <div className="text-sm font-semibold text-[var(--text-primary)]">
                  Corporativo Escuro
                </div>
                <div className="mt-1 text-xs text-[var(--text-secondary)]">
                  Superfície escura balanceada (#111827 / #1F2937) e destaque índigo suave (#818CF8).
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Configurações de Banco de Dados */}
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-6 shadow-sm">
          <div className="flex items-center gap-2 border-b border-[var(--border-color)] pb-4">
            <Database size={18} className="text-[var(--accent-color)]" />
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Banco de Dados Local (SQLite)
            </h2>
          </div>

          <div className="mt-4 space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-[var(--border-color)]/60">
              <span className="text-[var(--text-secondary)]">Provedor Ativo</span>
              <span className="font-semibold text-[var(--text-primary)]">
                Knex.js + better-sqlite3
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-[var(--border-color)]/60">
              <span className="text-[var(--text-secondary)]">Status da Conexão</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {dbInfo?.connected ? 'Conectado e Inicializado' : 'Conectando...'}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-[var(--border-color)]/60">
              <span className="text-[var(--text-secondary)]">Arquivo de Banco</span>
              <span className="font-mono text-[var(--text-primary)]">
                {dbInfo?.databaseName || 'lumiax.db'}
              </span>
            </div>
          </div>
        </div>

        {/* Informações da Aplicação */}
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-6 shadow-sm">
          <div className="flex items-center gap-2 border-b border-[var(--border-color)] pb-4">
            <ShieldCheck size={18} className="text-[var(--accent-color)]" />
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Segurança e Arquitetura
            </h2>
          </div>

          <div className="mt-4 flex items-start gap-3 rounded-lg bg-[var(--bg-secondary)] p-4 text-xs text-[var(--text-secondary)]">
            <Info size={16} className="shrink-0 text-[var(--text-primary)] mt-0.5" />
            <div>
              <p className="font-semibold text-[var(--text-primary)]">Isolamento de Contexto</p>
              <p className="mt-0.5">
                Esta aplicação opera sob o padrão seguro do Electron (contextIsolation ativado,
                sandbox habilitado e sem acesso direto a chamadas nativas de SO pelo processo
                visual).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
