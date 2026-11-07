import { create } from 'zustand';
import type { Theme } from '../types';

const readTheme = (): Theme => {
  if (typeof window === 'undefined') return 'light';
  const saved = localStorage.getItem('theme');
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const applyTheme = (theme: Theme) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
};

interface ThemeStore {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const initialTheme = readTheme();
applyTheme(initialTheme);

export const useThemeStore = create<ThemeStore>((set, get) => ({
  theme: initialTheme,
  toggleTheme: () => {
    const nextTheme: Theme = get().theme === 'light' ? 'dark' : 'light';
    applyTheme(nextTheme);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('theme', nextTheme);
    }
    set({ theme: nextTheme });
  },
  setTheme: (theme: Theme) => {
    applyTheme(theme);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('theme', theme);
    }
    set({ theme });
  },
}));
