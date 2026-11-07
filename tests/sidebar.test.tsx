// @vitest-environment happy-dom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { Sidebar } from '../src/components/Sidebar';

describe('Sidebar Component', () => {
  afterEach(() => {
    cleanup();
  });
  it('deve renderizar as 5 páginas oficiais do escopo do Sistema Lumiax', () => {
    const onPageChange = vi.fn();
    render(<Sidebar currentPage="dashboard" onPageChange={onPageChange} />);

    expect(screen.getByText('Dashboard')).toBeTruthy();
    expect(screen.getByText('Importação')).toBeTruthy();
    expect(screen.getByText('Saúde do sistema')).toBeTruthy();
    expect(screen.getByText('Tabelas')).toBeTruthy();
    expect(screen.getByText('Configurações')).toBeTruthy();
  });

  it('deve acionar onPageChange ao clicar em uma página', () => {
    const onPageChange = vi.fn();
    render(<Sidebar currentPage="dashboard" onPageChange={onPageChange} />);

    const importButton = screen.getByText('Importação');
    fireEvent.click(importButton);

    expect(onPageChange).toHaveBeenCalledWith('importacao');
  });

  it('deve alternar estado recolhido ao clicar no botão de colapso', () => {
    const onPageChange = vi.fn();
    render(<Sidebar currentPage="dashboard" onPageChange={onPageChange} />);

    const collapseButton = screen.getByLabelText('Recolher barra lateral');
    fireEvent.click(collapseButton);

    expect(screen.getByLabelText('Expandir barra lateral')).toBeTruthy();
  });
});
