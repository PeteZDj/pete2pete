import { motion } from 'framer-motion';
import type { KrewEvent, AgentId } from '../../types/krew.ts';
import { AGENTS, isEventType } from '../../types/krew.ts';
import { relativeTime, exactTime, shortTime } from '../../lib/time.ts';
import { Activity, CheckCircle2, AlertTriangle, Zap, ArrowUpDown } from 'lucide-react';

interface MessageBubbleProps {
  event: KrewEvent;
  searchQuery?: string;
}

const eventIcons: Record<string, typeof Activity> = {
  task_complete: CheckCircle2,
  alert: AlertTriangle,
  status_update: Activity,
  ping: Zap,
  pong: Zap,
};

export default function MessageBubble({ event, searchQuery }: MessageBubbleProps) {
  const agent = AGENTS[event.from as AgentId];
  const isEvent = isEventType(event.type);
  const message = (event.payload?.message as string) || event.type;
  const isOnlineOffline = event.type.endsWith('_online') || event.type.endsWith('_offline');

  // Online/offline events: render as compact system line
  if (isOnlineOffline) {
    const isOnline = event.type.endsWith('_online');
    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="flex items-center justify-center gap-2 py-1.5"
      >
        <ArrowUpDown size={11} style={{ color: 'var(--color-text-tertiary)' }} />
        <span className="text-[11px] font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
          <span style={{ color: agent?.color || 'var(--color-text-secondary)' }}>{agent?.name || event.from}</span>
          {' '}{isOnline ? 'came online' : 'went offline'}
        </span>
        <span className="text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>{shortTime(event.timestamp)}</span>
      </motion.div>
    );
  }

  // Event-type messages (task_complete, alert, etc.)
  if (isEvent) {
    const IconComp = eventIcons[event.type] || Activity;
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex items-start gap-2.5 px-3 py-2 mx-2 my-1 rounded-lg border-l-2"
        style={{
          backgroundColor: event.type === 'alert' ? 'var(--color-warning-subtle)' : 'var(--color-bg-tertiary)',
          borderLeftColor: event.type === 'alert' ? 'var(--color-warning)' : 'var(--color-accent)',
        }}
      >
        <IconComp size={14} className="mt-0.5 shrink-0" style={{ color: 'var(--color-text-tertiary)' }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-xs font-semibold" style={{ color: agent?.color || 'var(--color-text-secondary)' }}>
              {agent?.name || event.from}
            </span>
            <span className="text-[10px] uppercase font-medium tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
              {event.type.replace(/_/g, ' ')}
            </span>
          </div>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            {highlightText(message, searchQuery)}
          </p>
        </div>
        <span className="text-[10px] shrink-0 mt-0.5" title={exactTime(event.timestamp)} style={{ color: 'var(--color-text-tertiary)' }}>
          {relativeTime(event.timestamp)}
        </span>
      </motion.div>
    );
  }

  // Code message
  if (event.type === 'code') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex items-start gap-2.5 px-3 py-2 mx-2 my-1"
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0"
          style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
        >
          {agent?.emoji || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-xs font-semibold" style={{ color: agent?.color || 'var(--color-text-secondary)' }}>
              {agent?.name || event.from}
            </span>
            <span className="text-[10px]" title={exactTime(event.timestamp)} style={{ color: 'var(--color-text-tertiary)' }}>
              {relativeTime(event.timestamp)}
            </span>
          </div>
          <pre
            className="mt-1.5 p-3 rounded-lg text-xs overflow-x-auto font-mono"
            style={{
              backgroundColor: 'var(--color-bg-tertiary)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border)',
            }}
          >
            {message}
          </pre>
        </div>
      </motion.div>
    );
  }

  // Regular message
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex items-start gap-2.5 px-3 py-2 mx-2 my-1 rounded-lg transition-colors hover:bg-[var(--color-bg-tertiary)]/50"
    >
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0"
        style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
      >
        {agent?.emoji || '?'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-semibold" style={{ color: agent?.color || 'var(--color-text-secondary)' }}>
            {agent?.name || event.from}
          </span>
          <span className="text-[10px]" title={exactTime(event.timestamp)} style={{ color: 'var(--color-text-tertiary)' }}>
            {relativeTime(event.timestamp)}
          </span>
        </div>
        <p className="text-sm mt-0.5 break-words" style={{ color: 'var(--color-text-primary)' }}>
          {highlightText(message, searchQuery)}
        </p>
      </div>
    </motion.div>
  );
}

function highlightText(text: string, query?: string) {
  if (!query || query.length < 2) return text;
  const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark
        key={i}
        className="rounded px-0.5"
        style={{ backgroundColor: 'var(--color-warning)', color: '#000' }}
      >
        {part}
      </mark>
    ) : (
      part
    )
  );
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
