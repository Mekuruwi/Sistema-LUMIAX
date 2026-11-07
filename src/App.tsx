import { lazy, Suspense, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AppTitleBar } from './components/AppTitleBar';

const DashboardPage = lazy(() =>
  import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })),
);
const ImportPage = lazy(() =>
  import('./pages/ImportPage').then((m) => ({ default: m.ImportPage })),
);
const SystemHealthPage = lazy(() =>
  import('./pages/SystemHealthPage').then((m) => ({ default: m.SystemHealthPage })),
);
const TablesPage = lazy(() =>
  import('./pages/TablesPage').then((m) => ({ default: m.TablesPage })),
);
const SettingsPage = lazy(() =>
  import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })),
);

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'importacao':
        return <ImportPage />;
      case 'saude':
        return <SystemHealthPage />;
      case 'tabelas':
        return <TablesPage />;
      case 'configuracoes':
        return <SettingsPage />;
      case 'dashboard':
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <AppTitleBar />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
        <main className="min-w-0 flex-1 overflow-hidden">
          <ErrorBoundary>
            <Suspense
              fallback={
                <div className="flex h-full items-center justify-center p-6 text-sm text-[var(--text-secondary)]">
                  Carregando visualização...
                </div>
              }
            >
              {renderPage()}
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

export default App;
