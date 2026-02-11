import { motion } from 'framer-motion';
import { Radio, Activity, Trash2, Download } from 'lucide-react';
import type { KrewEvent, AgentsMap } from '../../types/krew.ts';
import StatsCards from '../stats/StatsCards.tsx';
import MessagesChart from '../stats/MessagesChart.tsx';
import ActivityTimeline from '../stats/ActivityTimeline.tsx';
import { getHealth, getStatus } from '../../lib/api.ts';

interface RightPanelProps {
  messages: KrewEvent[];
  agents: AgentsMap;
  serverUptime: number;
  loading: boolean;
  onClearMessages: () => void;
  onExportMessages: () => void;
}

export default function RightPanel({
  messages,
  agents,
  serverUptime,
  loading,
  onClearMessages,
  onExportMessages,
}: RightPanelProps) {
  const handlePingRobo = async () => {
    try {
      const res = await getHealth();
      alert(`Robo says: ${res.status} (uptime: ${Math.floor(res.uptime)}s, connections: ${res.connections})`);
    } catch {
      alert('Failed to reach Robo');
    }
  };

  const handleFetchStatus = async () => {
    try {
      const res = await getStatus();
      alert(
        `Server: ${Math.floor(res.server.uptime)}s uptime, ${res.server.connections} connections, ${res.server.totalMessages} messages`
      );
    } catch {
      alert('Failed to fetch status');
    }
  };

  return (
    <aside
      className="flex flex-col gap-4 p-4 border-l h-full overflow-y-auto"
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        borderColor: 'var(--color-border)',
      }}
    >
      {/* Stats */}
      <section>
        <h2
          className="text-xs font-semibold uppercase tracking-wider mb-2 px-1"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          Stats
        </h2>
        <StatsCards messages={messages} agents={agents} serverUptime={serverUptime} loading={loading} />
      </section>

      {/* Chart */}
      <section>
        <h2
          className="text-xs font-semibold uppercase tracking-wider mb-2 px-1"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          Messages
        </h2>
        <MessagesChart messages={messages} />
      </section>

      {/* Activity */}
      <section>
        <h2
          className="text-xs font-semibold uppercase tracking-wider mb-2 px-1"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          Activity
        </h2>
        <ActivityTimeline messages={messages} />
      </section>

      {/* Quick Actions */}
      <section>
        <h2
          className="text-xs font-semibold uppercase tracking-wider mb-2 px-1"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 gap-2">
          <ActionButton icon={Radio} label="Ping Robo" onClick={handlePingRobo} />
          <ActionButton icon={Activity} label="Fetch Status" onClick={handleFetchStatus} />
          <ActionButton icon={Trash2} label="Clear Messages" onClick={onClearMessages} />
          <ActionButton icon={Download} label="Export JSON" onClick={onExportMessages} />
        </div>
      </section>
    </aside>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Radio;
  label: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium transition-colors hover:bg-[var(--color-bg-tertiary)]"
      style={{
        backgroundColor: 'var(--color-bg-elevated)',
        borderColor: 'var(--color-border)',
        color: 'var(--color-text-secondary)',
      }}
    >
      <Icon size={13} />
      {label}
    </motion.button>
  );
}
