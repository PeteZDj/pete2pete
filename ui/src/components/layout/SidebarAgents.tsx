import type { AgentId, AgentsMap } from '../../types/krew.ts';
import AgentCard from '../agents/AgentCard.tsx';

interface SidebarAgentsProps {
  agents: AgentsMap;
  selectedAgent: AgentId | null;
  onSelectAgent: (id: AgentId | null) => void;
}

export default function SidebarAgents({ agents, selectedAgent, onSelectAgent }: SidebarAgentsProps) {
  const agentIds: AgentId[] = ['robo', 'afro', 'pete'];

  return (
    <aside
      className="flex flex-col gap-2 p-4 border-r h-full overflow-y-auto"
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        borderColor: 'var(--color-border)',
      }}
    >
      <h2
        className="text-xs font-semibold uppercase tracking-wider mb-2 px-1"
        style={{ color: 'var(--color-text-tertiary)' }}
      >
        Agents
      </h2>

      {agentIds.map((id) => (
        <AgentCard
          key={id}
          agentId={id}
          info={agents[id]}
          isSelected={selectedAgent === id}
          onClick={() => onSelectAgent(selectedAgent === id ? null : id)}
        />
      ))}

      {/* Filter info */}
      {selectedAgent && (
        <button
          onClick={() => onSelectAgent(null)}
          className="mt-2 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors"
          style={{
            color: 'var(--color-accent)',
            borderColor: 'var(--color-border)',
            backgroundColor: 'var(--color-bg-elevated)',
          }}
        >
          Clear filter
        </button>
      )}
    </aside>
  );
}
