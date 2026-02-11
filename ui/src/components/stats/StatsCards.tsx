import { MessageSquare, Users, Clock, Zap } from 'lucide-react';
import type { KrewEvent, AgentsMap } from '../../types/krew.ts';
import { uptimeString } from '../../lib/time.ts';

interface StatsCardsProps {
  messages: KrewEvent[];
  agents: AgentsMap;
  serverUptime: number;
  loading: boolean;
}

export default function StatsCards({ messages, agents, serverUptime, loading }: StatsCardsProps) {
  // Count messages today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayMessages = messages.filter(
    (m) => new Date(m.timestamp).getTime() >= today.getTime() && (m.type === 'message' || m.type === 'code')
  );

  const onlineCount = Object.values(agents).filter((a) => a.online).length;

  // Last event
  const lastEvent = messages.length > 0 ? messages[messages.length - 1] : null;

  const stats = [
    {
      icon: MessageSquare,
      label: 'Messages today',
      value: todayMessages.length.toString(),
      color: 'var(--color-accent)',
    },
    {
      icon: Users,
      label: 'Agents online',
      value: `${onlineCount}/3`,
      color: 'var(--color-success)',
    },
    {
      icon: Clock,
      label: 'Server uptime',
      value: uptimeString(serverUptime),
      color: 'var(--color-warning)',
    },
    {
      icon: Zap,
      label: 'Last event',
      value: lastEvent ? lastEvent.type.replace(/_/g, ' ') : '—',
      color: 'var(--color-afro)',
    },
  ];

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-16 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex items-center gap-3 p-3 rounded-xl border"
          style={{
            backgroundColor: 'var(--color-bg-elevated)',
            borderColor: 'var(--color-border)',
          }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
          >
            <stat.icon size={14} style={{ color: stat.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
              {stat.label}
            </p>
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
              {stat.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
