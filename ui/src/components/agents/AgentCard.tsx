import { motion } from 'framer-motion';
import type { AgentId, AgentInfo, AgentMeta } from '../../types/krew.ts';
import { AGENTS } from '../../types/krew.ts';
import { relativeTime, connectionUptime } from '../../lib/time.ts';

interface AgentCardProps {
  agentId: AgentId;
  info: AgentInfo;
  isSelected: boolean;
  onClick: () => void;
}

export default function AgentCard({ agentId, info, isSelected, onClick }: AgentCardProps) {
  const meta: AgentMeta = AGENTS[agentId];

  return (
    <motion.button
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full text-left p-3 rounded-xl border transition-all duration-150"
      style={{
        backgroundColor: isSelected ? 'var(--color-accent-subtle)' : 'var(--color-bg-elevated)',
        borderColor: isSelected ? 'var(--color-accent)' : 'var(--color-border)',
        boxShadow: isSelected ? '0 0 0 1px var(--color-accent)' : 'none',
      }}
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
          style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
        >
          {meta.emoji}
        </div>

        <div className="flex-1 min-w-0">
          {/* Name + Status */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
              {meta.name}
            </span>
            <StatusDot online={info.online} />
          </div>

          {/* Last seen */}
          <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--color-text-tertiary)' }}>
            {info.online
              ? `Up ${connectionUptime(info.connectedAt)}`
              : `Last seen ${relativeTime(info.lastSeen)}`
            }
          </p>
        </div>
      </div>
    </motion.button>
  );
}

function StatusDot({ online }: { online: boolean }) {
  if (online) {
    return (
      <span className="relative flex h-2 w-2">
        <span className="animate-status-pulse absolute inline-flex h-full w-full rounded-full opacity-75 bg-[var(--color-success)]" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-success)]" />
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full h-2 w-2 bg-[var(--color-text-tertiary)] opacity-50" />
  );
}
