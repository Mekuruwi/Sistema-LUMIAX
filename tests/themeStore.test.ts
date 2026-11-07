import { describe, it, expect, beforeEach } from 'vitest';
import { useThemeStore } from '../src/store/themeStore';

describe('themeStore', () => {
  beforeEach(() => {
    useThemeStore.getState().setTheme('light');
  });

  it('deve inicializar com tema claro e alternar para escuro', () => {
    expect(useThemeStore.getState().theme).toBe('light');

    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe('dark');

    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe('light');
  });

  it('deve permitir definir o tema diretamente', () => {
    useThemeStore.getState().setTheme('dark');
    expect(useThemeStore.getState().theme).toBe('dark');

    useThemeStore.getState().setTheme('light');
    expect(useThemeStore.getState().theme).toBe('light');
  });
});
