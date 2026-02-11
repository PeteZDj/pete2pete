import { motion, AnimatePresence } from 'framer-motion';

interface Command {
  command: string;
  description: string;
}

const COMMANDS: Command[] = [
  { command: '/ping afro', description: 'Ping Afro agent' },
  { command: '/ping robo', description: 'Ping Robo agent' },
  { command: '/status', description: 'Fetch server status' },
  { command: '/clear', description: 'Clear local messages' },
  { command: '/help', description: 'Show available commands' },
];

interface CommandPaletteProps {
  open: boolean;
  filter: string;
  onSelect: (cmd: string) => void;
  selectedIndex: number;
}

export default function CommandPalette({ open, filter, onSelect, selectedIndex }: CommandPaletteProps) {
  const filtered = COMMANDS.filter((c) =>
    c.command.toLowerCase().startsWith(filter.toLowerCase())
  );

  return (
    <AnimatePresence>
      {open && filtered.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.12 }}
          className="absolute bottom-full left-0 right-0 mb-1 rounded-xl border overflow-hidden shadow-lg"
          style={{
            backgroundColor: 'var(--color-bg-elevated)',
            borderColor: 'var(--color-border)',
            boxShadow: '0 8px 24px var(--color-shadow-lg)',
          }}
        >
          <div className="p-1.5">
            <p
              className="text-[10px] font-medium uppercase tracking-wider px-2.5 py-1.5"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              Commands
            </p>
            {filtered.map((cmd, i) => (
              <button
                key={cmd.command}
                onClick={() => onSelect(cmd.command)}
                className="w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm transition-colors"
                style={{
                  backgroundColor: i === selectedIndex ? 'var(--color-bg-tertiary)' : 'transparent',
                  color: 'var(--color-text-primary)',
                }}
              >
                <code
                  className="text-xs font-mono px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-accent)' }}
                >
                  {cmd.command}
                </code>
                <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                  {cmd.description}
                </span>
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export { COMMANDS };
