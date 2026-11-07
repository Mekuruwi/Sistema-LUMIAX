import React, { useState } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Layers,
  FileText,
  X,
} from 'lucide-react';

type ImportTab = 'demanda' | 'apoio';

export function ImportPage() {
  const [activeTab, setActiveTab] = useState<ImportTab>('demanda');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedMonth, setSelectedMonth] = useState('10');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [baseType, setBaseType] = useState('clientes');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [operationResult, setOperationResult] = useState<{
    status: 'idle' | 'success' | 'warning' | 'error';
    message: string;
    details?: string[];
  }>({ status: 'idle', message: '' });

  const months = [
    { value: '01', label: 'Janeiro' },
    { value: '02', label: 'Fevereiro' },
    { value: '03', label: 'Março' },
    { value: '04', label: 'Abril' },
    { value: '05', label: 'Maio' },
    { value: '06', label: 'Junho' },
    { value: '07', label: 'Julho' },
    { value: '08', label: 'Agosto' },
    { value: '09', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' },
  ];

  const years = ['2024', '2025', '2026', '2027'];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const lowerName = file.name.toLowerCase();
    const isValid = validExtensions.some((ext) => lowerName.endsWith(ext));

    if (!isValid) {
      setOperationResult({
        status: 'error',
        message: 'Formato de arquivo inválido. Selecione um arquivo .xlsx, .xls ou .csv.',
      });
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    setOperationResult({ status: 'idle', message: '' });
  };

  const handleProcessImport = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setOperationResult({ status: 'idle', message: '' });

    try {
      const period = activeTab === 'demanda' ? `${selectedYear}-${selectedMonth}` : undefined;
      const opName =
        activeTab === 'demanda'
          ? `Importação de Demanda (${selectedMonth}/${selectedYear})`
          : `Importação de Base de Apoio (${baseType})`;

      // Simulação do fluxo de envio ao processo principal (a validação e gravação real
      // das planilhas será conectada assim que os modelos de dados forem aprovados)
      if (window.electronAPI) {
        await window.electronAPI.imports.recordOperation({
          operation: opName,
          fileName: selectedFile.name,
          period,
          records: 0,
          status: 'warning',
          errorMessage:
            'Arquivo recebido na interface. Aguardando alinhamento do layout de colunas aprovado para persistência.',
        });
      }

      setOperationResult({
        status: 'warning',
        message:
          'Arquivo selecionado com sucesso! A persistência final depende da confirmação das colunas reais e regras de negócio com o responsável (Etapa 1 do roteiro).',
        details: [
          `Arquivo: ${selectedFile.name} (${(selectedFile.size / 1024).toFixed(1)} KB)`,
          activeTab === 'demanda'
            ? `Período selecionado: ${selectedMonth}/${selectedYear}`
            : `Tipo de base: ${baseType}`,
          'Status do motor: Validação de estrutura preparada no processo principal.',
        ],
      });
    } catch (err: any) {
      setOperationResult({
        status: 'error',
        message: err?.message || 'Falha ao processar o arquivo.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-8">
      {/* Cabeçalho */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
          Importação de Dados
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Fluxo central de importação e validação de bases de apoio e demandas mensais.
        </p>
      </div>

      {/* Abas de Navegação */}
      <div className="mb-6 flex border-b border-[var(--border-color)]">
        <button
          type="button"
          onClick={() => {
            setActiveTab('demanda');
            setSelectedFile(null);
            setOperationResult({ status: 'idle', message: '' });
          }}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-medium transition-colors ${
            activeTab === 'demanda'
              ? 'border-[var(--accent-color)] text-[var(--accent-color)]'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Calendar size={18} />
          Demanda Mensal
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('apoio');
            setSelectedFile(null);
            setOperationResult({ status: 'idle', message: '' });
          }}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-medium transition-colors ${
            activeTab === 'apoio'
              ? 'border-[var(--accent-color)] text-[var(--accent-color)]'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Layers size={18} />
          Bases de Apoio
        </button>
      </div>

      {/* Painel do Formulário */}
      <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-6 shadow-sm">
        {activeTab === 'demanda' ? (
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Mês de Referência
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                disabled={isProcessing}
                className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-color)] focus:outline-none"
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Ano de Referência
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                disabled={isProcessing}
                className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-color)] focus:outline-none"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div className="mb-6">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Tipo de Base de Apoio
            </label>
            <select
              value={baseType}
              onChange={(e) => setBaseType(e.target.value)}
              disabled={isProcessing}
              className="w-full max-w-md rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-color)] focus:outline-none"
            >
              <option value="clientes">Tabela de Clientes</option>
              <option value="regionais">Tabela de Regiões / Representantes</option>
              <option value="produtos">Catálogo de Produtos / Serviços</option>
            </select>
          </div>
        )}

        {/* Zona de Drop / Seleção de Arquivo */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
            isDragging
              ? 'border-[var(--accent-color)] bg-[var(--accent-color)]/5'
              : 'border-[var(--border-color)] bg-[var(--bg-secondary)]/50 hover:bg-[var(--bg-secondary)]'
          }`}
        >
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent-color)]/10 text-[var(--accent-color)]">
            <UploadCloud size={28} />
          </div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            Arraste e solte o arquivo aqui, ou clique para selecionar
          </p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Formatos suportados: <strong>.xlsx</strong>, <strong>.xls</strong> e <strong>.csv</strong>
          </p>

          <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[var(--accent-color)] px-4 py-2 text-xs font-semibold text-white shadow-sm transition-opacity hover:opacity-90">
            <FileSpreadsheet size={16} />
            Selecionar Planilha
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              disabled={isProcessing}
              className="hidden"
            />
          </label>
        </div>

        {/* Arquivo Selecionado */}
        {selectedFile && (
          <div className="mt-4 flex items-center justify-between rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] p-3">
            <div className="flex items-center gap-3">
              <FileText size={20} className="text-[var(--accent-color)]" />
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-[var(--text-secondary)]">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            {!isProcessing && (
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                className="rounded-md p-1.5 text-[var(--text-secondary)] hover:bg-[var(--border-color)] hover:text-red-500"
                title="Remover arquivo"
              >
                <X size={16} />
              </button>
            )}
          </div>
        )}

        {/* Botão de Ação */}
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={handleProcessImport}
            disabled={!selectedFile || isProcessing}
            className={`flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all ${
              !selectedFile || isProcessing
                ? 'cursor-not-allowed bg-gray-400 opacity-60'
                : 'bg-[var(--accent-color)] hover:opacity-95'
            }`}
          >
            {isProcessing ? 'Validando e Processando...' : 'Validar e Processar'}
          </button>
        </div>

        {/* Resultado da Operação */}
        {operationResult.status !== 'idle' && (
          <div
            className={`mt-6 rounded-xl border p-4 ${
              operationResult.status === 'success'
                ? 'border-emerald-200 bg-emerald-50/70 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-300'
                : operationResult.status === 'warning'
                ? 'border-amber-200 bg-amber-50/70 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-300'
                : 'border-red-200 bg-red-50/70 text-red-900 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-300'
            }`}
          >
            <div className="flex items-start gap-3">
              {operationResult.status === 'success' ? (
                <CheckCircle2 size={20} className="mt-0.5 shrink-0" />
              ) : (
                <AlertCircle size={20} className="mt-0.5 shrink-0" />
              )}
              <div className="text-sm">
                <p className="font-semibold">{operationResult.message}</p>
                {operationResult.details && (
                  <ul className="mt-2 list-inside list-disc space-y-1 text-xs opacity-90">
                    {operationResult.details.map((detail, idx) => (
                      <li key={idx}>{detail}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
