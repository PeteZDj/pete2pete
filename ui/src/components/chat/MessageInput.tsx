import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Send, Paperclip, ChevronDown } from 'lucide-react';
import CommandPalette, { COMMANDS } from './CommandPalette.tsx';

interface MessageInputProps {
  onSend: (message: string) => void;
  onCommand: (command: string, args: string[]) => void;
  disabled: boolean;
}

export default function MessageInput({ onSend, onCommand, disabled }: MessageInputProps) {
  const [text, setText] = useState('');
  const [showCommands, setShowCommands] = useState(false);
  const [cmdIndex, setCmdIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isCommand = text.startsWith('/');
  const shouldShowPalette = isCommand && text.length > 0;

  const filteredCommands = COMMANDS.filter((c) =>
    c.command.toLowerCase().startsWith(text.toLowerCase())
  );

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;

    if (trimmed.startsWith('/')) {
      const parts = trimmed.split(/\s+/);
      const cmd = parts[0];
      const args = parts.slice(1);
      onCommand(cmd, args);
    } else {
      onSend(trimmed);
    }

    setText('');
    setShowCommands(false);
    setCmdIndex(0);
  }, [text, onSend, onCommand]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (shouldShowPalette) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setCmdIndex((i) => Math.min(i + 1, filteredCommands.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setCmdIndex((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === 'Tab' || (e.key === 'Enter' && !e.shiftKey)) {
        if (filteredCommands[cmdIndex]) {
          e.preventDefault();
          setText(filteredCommands[cmdIndex].command + ' ');
          setShowCommands(false);
          return;
        }
      }
    }

    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey || !e.shiftKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    setCmdIndex(0);
    setShowCommands(e.target.value.startsWith('/'));

    // Auto-resize
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  const selectCommand = (cmd: string) => {
    setText(cmd + ' ');
    setShowCommands(false);
    textareaRef.current?.focus();
  };

  return (
    <div
      className="relative border-t px-4 py-3"
      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)' }}
    >
      <CommandPalette
        open={shouldShowPalette}
        filter={text}
        onSelect={selectCommand}
        selectedIndex={cmdIndex}
      />

      <div
        className="flex items-end gap-2 rounded-xl border px-3 py-2 transition-colors focus-within:border-[var(--color-accent)]"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          borderColor: 'var(--color-border)',
        }}
      >
        {/* Attach placeholder */}
        <button
          className="p-1.5 rounded-lg transition-colors hover:bg-[var(--color-bg-tertiary)] shrink-0 mb-0.5"
          style={{ color: 'var(--color-text-tertiary)' }}
          title="Attach (coming soon)"
        >
          <Paperclip size={16} />
        </button>

        {/* Text area */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message or / for commands..."
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none bg-transparent outline-none text-sm leading-relaxed"
          style={{
            color: 'var(--color-text-primary)',
            maxHeight: '120px',
          }}
        />

        {/* Commands button */}
        <button
          onClick={() => setShowCommands(!showCommands)}
          className="p-1.5 rounded-lg transition-colors hover:bg-[var(--color-bg-tertiary)] shrink-0 mb-0.5"
          style={{ color: 'var(--color-text-tertiary)' }}
          title="Commands"
        >
          <ChevronDown size={16} />
        </button>

        {/* Send */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleSend}
          disabled={disabled || !text.trim()}
          className="p-2 rounded-lg shrink-0 mb-0.5 transition-colors disabled:opacity-30"
          style={{
            backgroundColor: text.trim() ? 'var(--color-accent)' : 'var(--color-bg-tertiary)',
            color: text.trim() ? '#fff' : 'var(--color-text-tertiary)',
          }}
          title="Send (Ctrl+Enter)"
        >
          <Send size={14} />
        </motion.button>
      </div>

      <p className="text-[10px] mt-1.5 text-center" style={{ color: 'var(--color-text-tertiary)' }}>
        Press <kbd className="px-1 py-0.5 rounded text-[9px] border" style={{ borderColor: 'var(--color-border)' }}>Enter</kbd> to send · <kbd className="px-1 py-0.5 rounded text-[9px] border" style={{ borderColor: 'var(--color-border)' }}>Shift+Enter</kbd> for new line
      </p>
    </div>
  );
}
