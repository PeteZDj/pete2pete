import { motion } from 'framer-motion';
import { Wifi, WifiOff, Heart, AlertTriangle } from 'lucide-react';
import type { KrewEvent } from '../../types/krew.ts';
import { AGENTS, type AgentId } from '../../types/krew.ts';
import { relativeTime } from '../../lib/time.ts';

interface ActivityTimelineProps {
  messages: KrewEvent[];
}

const eventConfig: Record<string, { icon: typeof Wifi; color: string }> = {
  _online: { icon: Wifi, color: 'var(--color-success)' },
  _offline: { icon: WifiOff, color: 'var(--color-danger)' },
  _heartbeat: { icon: Heart, color: 'var(--color-text-tertiary)' },
  alert: { icon: AlertTriangle, color: 'var(--color-warning)' },
};

function getEventConfig(type: string) {
  if (type.endsWith('_online')) return eventConfig['_online'];
  if (type.endsWith('_offline')) return eventConfig['_offline'];
  if (type.endsWith('_heartbeat')) return eventConfig['_heartbeat'];
  if (type === 'alert') return eventConfig['alert'];
  return null;
}

export default function ActivityTimeline({ messages }: ActivityTimelineProps) {
  // Filter to activity events only
  const activities = messages
    .filter((m) => {
      const type = m.type;
      return (
        type.endsWith('_online') ||
        type.endsWith('_offline') ||
        type.endsWith('_heartbeat') ||
        type === 'alert' ||
        type === 'status_update'
      );
    })
    .slice(-15)
    .reverse();

  if (activities.length === 0) {
    return (
      <div
        className="flex items-center justify-center h-24 rounded-xl border"
        style={{
          backgroundColor: 'var(--color-bg-elevated)',
          borderColor: 'var(--color-border)',
        }}
      >
        <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
          No activity yet
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0.5 max-h-64 overflow-y-auto">
      {activities.map((event, i) => {
        const config = getEventConfig(event.type);
        const Icon = config?.icon || Wifi;
        const agent = AGENTS[event.from as AgentId];

        return (
          <motion.div
            key={event.id || i}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03, duration: 0.15 }}
            className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg transition-colors hover:bg-[var(--color-bg-tertiary)]/50"
          >
            <Icon
              size={12}
              className="shrink-0"
              style={{ color: config?.color || 'var(--color-text-tertiary)' }}
            />
            <span className="text-[11px] flex-1 truncate" style={{ color: 'var(--color-text-secondary)' }}>
              <span style={{ color: agent?.color || 'var(--color-text-primary)' }}>
                {agent?.name || event.from}
              </span>
              {' '}
              {event.type.replace(/_/g, ' ')}
            </span>
            <span className="text-[10px] shrink-0" style={{ color: 'var(--color-text-tertiary)' }}>
              {relativeTime(event.timestamp)}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}
