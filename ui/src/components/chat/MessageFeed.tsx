import { useRef, useEffect, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDown } from 'lucide-react';
import type { KrewEvent, FilterType, AgentId } from '../../types/krew.ts';
import { getMessageCategory } from '../../types/krew.ts';
import MessageBubble from './MessageBubble.tsx';

interface MessageFeedProps {
  messages: KrewEvent[];
  filter: FilterType;
  onFilterChange: (f: FilterType) => void;
  agentFilter: AgentId | null;
  searchQuery: string;
  loading: boolean;
}

const filters: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'messages', label: 'Messages' },
  { key: 'events', label: 'Events' },
  { key: 'alerts', label: 'Alerts' },
];

export default function MessageFeed({
  messages,
  filter,
  onFilterChange,
  agentFilter,
  searchQuery,
  loading,
}: MessageFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showJump, setShowJump] = useState(false);
  const [userScrolled, setUserScrolled] = useState(false);

  // Filter messages
  const filtered = messages.filter((m) => {
    if (agentFilter && m.from !== agentFilter) return false;
    if (filter !== 'all' && getMessageCategory(m.type) !== filter) return false;
    if (searchQuery && searchQuery.length >= 2) {
      const text = ((m.payload?.message as string) || m.type).toLowerCase();
      if (!text.includes(searchQuery.toLowerCase())) return false;
    }
    return true;
  });

  // Auto-scroll
  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowJump(false);
    setUserScrolled(false);
  }, []);

  useEffect(() => {
    if (!userScrolled) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [filtered.length, userScrolled]);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setShowJump(!atBottom);
    setUserScrolled(!atBottom);
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Filter chips */}
      <div
        className="flex items-center gap-1 px-4 py-2 border-b shrink-0"
        style={{ borderColor: 'var(--color-border)' }}
      >
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => onFilterChange(f.key)}
            className="px-3 py-1 rounded-full text-xs font-medium transition-colors"
            style={{
              backgroundColor: filter === f.key ? 'var(--color-accent-subtle)' : 'transparent',
              color: filter === f.key ? 'var(--color-accent)' : 'var(--color-text-tertiary)',
              border: `1px solid ${filter === f.key ? 'var(--color-accent)' : 'transparent'}`,
            }}
          >
            {f.label}
          </button>
        ))}
        {agentFilter && (
          <span className="ml-2 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            Filtered by: <span className="font-medium" style={{ color: 'var(--color-text-secondary)' }}>{agentFilter}</span>
          </span>
        )}
      </div>

      {/* Messages */}
      <div ref={containerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto py-2">
        {loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="skeleton w-7 h-7 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-3 w-20 rounded" />
                  <div className="skeleton h-4 rounded" style={{ width: `${40 + Math.random() * 50}%` }} />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 opacity-60">
            <span className="text-4xl">💬</span>
            <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
              {searchQuery ? 'No messages match your search' : 'No messages yet'}
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              {searchQuery ? 'Try a different search term' : 'Messages will appear here when sent'}
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {filtered.map((msg) => (
              <MessageBubble key={msg.id} event={msg} searchQuery={searchQuery} />
            ))}
          </AnimatePresence>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Jump to latest */}
      <AnimatePresence>
        {showJump && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            onClick={scrollToBottom}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border shadow-lg"
            style={{
              backgroundColor: 'var(--color-bg-elevated)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-accent)',
              boxShadow: '0 4px 12px var(--color-shadow-lg)',
            }}
          >
            <ArrowDown size={12} />
            Jump to latest
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
