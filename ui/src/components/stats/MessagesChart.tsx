import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import type { KrewEvent, AgentId } from '../../types/krew.ts';
import { AGENTS } from '../../types/krew.ts';

interface MessagesChartProps {
  messages: KrewEvent[];
}

export default function MessagesChart({ messages }: MessagesChartProps) {
  // Count messages by agent
  const counts: Record<string, number> = { robo: 0, afro: 0, pete: 0 };
  for (const m of messages) {
    if (m.type === 'message' || m.type === 'code') {
      if (m.from in counts) {
        counts[m.from]++;
      }
    }
  }

  const data = (['robo', 'afro', 'pete'] as AgentId[]).map((id) => ({
    name: AGENTS[id].name,
    messages: counts[id] || 0,
    fill: `var(--color-${id})`,
  }));

  if (data.every((d) => d.messages === 0)) {
    return (
      <div
        className="flex items-center justify-center h-32 rounded-xl border"
        style={{
          backgroundColor: 'var(--color-bg-elevated)',
          borderColor: 'var(--color-border)',
        }}
      >
        <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
          No message data yet
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl border p-3"
      style={{
        backgroundColor: 'var(--color-bg-elevated)',
        borderColor: 'var(--color-border)',
      }}
    >
      <p className="text-[11px] font-medium mb-2" style={{ color: 'var(--color-text-tertiary)' }}>
        Messages by agent
      </p>
      <ResponsiveContainer width="100%" height={100}>
        <BarChart data={data} barSize={24}>
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: 'var(--color-text-tertiary)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              fontSize: '12px',
              color: 'var(--color-text-primary)',
            }}
          />
          <Bar dataKey="messages" radius={[4, 4, 0, 0]} fill="var(--color-accent)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
