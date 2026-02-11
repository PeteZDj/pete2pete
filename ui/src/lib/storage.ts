import type { KrewEvent } from '../types/krew.ts';

const STORAGE_KEY = 'petechat_messages';
const THEME_KEY = 'petechat_theme';

export function saveMessages(messages: KrewEvent[]): void {
  try {
    const trimmed = messages.slice(-500);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // Storage full or unavailable
  }
}

export function loadMessages(): KrewEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as KrewEvent[];
  } catch {
    // Corrupt data
  }
  return [];
}

export function clearMessages(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function exportMessages(messages: KrewEvent[]): void {
  const blob = new Blob([JSON.stringify(messages, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `petechat-export-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export type ThemeMode = 'light' | 'dark' | 'system';

export function saveTheme(mode: ThemeMode): void {
  localStorage.setItem(THEME_KEY, mode);
}

export function loadTheme(): ThemeMode {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
  return 'light';
}

export function applyTheme(mode: ThemeMode): void {
  const root = document.documentElement;
  if (mode === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', prefersDark);
  } else {
    root.classList.toggle('dark', mode === 'dark');
  }
}
