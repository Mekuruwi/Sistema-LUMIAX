import React, { useState } from 'react';
import {
  LayoutDashboard,
  Upload,
  Activity,
  Table2,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
} from 'lucide-react';
import { useThemeStore } from '../store/themeStore';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'importacao', label: 'Importação', icon: Upload },
  { id: 'saude', label: 'Saúde do sistema', icon: Activity },
  { id: 'tabelas', label: 'Tabelas', icon: Table2 },
  { id: 'configuracoes', label: 'Configurações', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onPageChange }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { theme, toggleTheme } = useThemeStore();

  return (
    <aside
      className={`
        flex h-full flex-col border-r border-[var(--border-color)] bg-[var(--bg-secondary)]
        transition-all duration-300
        ${collapsed ? 'w-20' : 'w-64'}
      `}
    >
      {/* Cabeçalho */}
      <div className="flex items-center justify-between border-b border-[var(--border-color)] p-4">
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-[var(--text-primary)]">
              Sistema Lumiax
            </span>
            <span className="text-xs text-[var(--text-secondary)]">
              Controle de Demanda
            </span>
          </div>
        )}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
          className="rounded-lg p-2 text-[var(--text-secondary)] transition-colors hover:bg-[var(--border-color)] hover:text-[var(--text-primary)]"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navegação Principal */}
      <nav className="flex-1 space-y-1.5 p-3">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onPageChange(item.id)}
              className={`
                flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium
                transition-colors duration-150
                ${
                  isActive
                    ? 'bg-[var(--accent-color)] text-white shadow-sm'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--border-color)] hover:text-[var(--text-primary)]'
                }
              `}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={19} className="shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Alternância de Tema Claro/Escuro */}
      <div className="border-t border-[var(--border-color)] p-3">
        <button
          type="button"
          onClick={toggleTheme}
          className="flex w-full items-center justify-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] transition-colors duration-150 hover:bg-[var(--border-color)] hover:text-[var(--text-primary)]"
          title={theme === 'light' ? 'Mudar para Tema Escuro' : 'Mudar para Tema Claro'}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          {!collapsed && <span>{theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}</span>}
        </button>
      </div>
    </aside>
  );
};
