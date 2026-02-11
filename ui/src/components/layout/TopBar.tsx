import { useState } from 'react';
import { Search, Settings, Sun, Moon, Monitor, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ConnectionState } from '../../types/krew.ts';
import type { ThemeMode } from '../../lib/storage.ts';

interface TopBarProps {
  connectionState: ConnectionState;
  theme: ThemeMode;
  onThemeCycle: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

const connectionStyles: Record<ConnectionState, { bg: string; dot: string; text: string; label: string }> = {
  connected: {
    bg: 'bg-[var(--color-success-subtle)] border-[var(--color-success)]/20',
    dot: 'bg-[var(--color-success)] animate-status-pulse',
    text: 'text-[var(--color-success)]',
    label: 'Connected',
  },
  reconnecting: {
    bg: 'bg-[var(--color-warning-subtle)] border-[var(--color-warning)]/20',
    dot: 'bg-[var(--color-warning)] animate-spin-slow',
    text: 'text-[var(--color-warning)]',
    label: 'Reconnecting',
  },
  offline: {
    bg: 'bg-[var(--color-danger-subtle)] border-[var(--color-danger)]/20',
    dot: 'bg-[var(--color-danger)]',
    text: 'text-[var(--color-danger)]',
    label: 'Offline',
  },
};

const themeIcons: Record<ThemeMode, typeof Sun> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

export default function TopBar({ connectionState, theme, onThemeCycle, searchQuery, onSearchChange }: TopBarProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const conn = connectionStyles[connectionState];
  const ThemeIcon = themeIcons[theme];

  return (
    <header
      className="sticky top-0 z-50 flex items-center justify-between gap-3 px-4 md:px-6 h-14 border-b glass"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--color-bg) 85%, transparent)',
        borderColor: 'var(--color-border)',
      }}
    >
      {/* Left: Brand */}
      <div className="flex items-center gap-3">
        <h1 className="text-base font-semibold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
          PeteChat
        </h1>
        <span className="hidden sm:inline text-xs font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
          The Krew Real-Time Hub
        </span>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 220, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <input
                type="text"
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                autoFocus
                className="w-full h-8 px-3 text-sm rounded-lg border outline-none"
                style={{
                  backgroundColor: 'var(--color-bg-secondary)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)',
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => { setSearchOpen(!searchOpen); if (searchOpen) onSearchChange(''); }}
          className="p-2 rounded-lg transition-colors hover:bg-[var(--color-bg-tertiary)]"
          style={{ color: 'var(--color-text-secondary)' }}
          title="Search"
        >
          {searchOpen ? <X size={16} /> : <Search size={16} />}
        </button>

        {/* Connection status */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${conn.bg}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${conn.dot}`} />
          <span className={conn.text}>{conn.label}</span>
        </div>

        {/* Theme toggle */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onThemeCycle}
          className="p-2 rounded-lg transition-colors hover:bg-[var(--color-bg-tertiary)]"
          style={{ color: 'var(--color-text-secondary)' }}
          title={`Theme: ${theme}`}
        >
          <ThemeIcon size={16} />
        </motion.button>

        {/* Settings placeholder */}
        <button
          className="p-2 rounded-lg transition-colors hover:bg-[var(--color-bg-tertiary)]"
          style={{ color: 'var(--color-text-secondary)' }}
          title="Settings"
        >
          <Settings size={16} />
        </button>
      </div>
    </header>
  );
}
