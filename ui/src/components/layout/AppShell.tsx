import { useState } from 'react';
import { MessageSquare, Users, BarChart3 } from 'lucide-react';
import type { ReactNode } from 'react';

interface AppShellProps {
  sidebar: ReactNode;
  feed: ReactNode;
  input: ReactNode;
  rightPanel: ReactNode;
}

type MobileTab = 'messages' | 'agents' | 'stats';

export default function AppShell({ sidebar, feed, input, rightPanel }: AppShellProps) {
  const [mobileTab, setMobileTab] = useState<MobileTab>('messages');

  return (
    <>
      {/* Desktop layout */}
      <div className="hidden md:grid h-[calc(100vh-3.5rem)]" style={{ gridTemplateColumns: '240px 1fr 280px' }}>
        {/* Left sidebar */}
        <div className="overflow-hidden">{sidebar}</div>

        {/* Center: feed + input */}
        <div
          className="flex flex-col overflow-hidden border-x"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="flex-1 overflow-hidden">{feed}</div>
          {input}
        </div>

        {/* Right panel */}
        <div className="overflow-hidden">{rightPanel}</div>
      </div>

      {/* Mobile layout */}
      <div className="md:hidden flex flex-col h-[calc(100vh-3.5rem)]">
        <div className="flex-1 overflow-hidden">
          {mobileTab === 'messages' && (
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-hidden">{feed}</div>
              {input}
            </div>
          )}
          {mobileTab === 'agents' && <div className="h-full overflow-y-auto">{sidebar}</div>}
          {mobileTab === 'stats' && <div className="h-full overflow-y-auto">{rightPanel}</div>}
        </div>

        {/* Mobile tab bar */}
        <nav
          className="flex items-center border-t shrink-0"
          style={{
            backgroundColor: 'var(--color-bg)',
            borderColor: 'var(--color-border)',
          }}
        >
          <TabButton
            icon={MessageSquare}
            label="Messages"
            active={mobileTab === 'messages'}
            onClick={() => setMobileTab('messages')}
          />
          <TabButton
            icon={Users}
            label="Agents"
            active={mobileTab === 'agents'}
            onClick={() => setMobileTab('agents')}
          />
          <TabButton
            icon={BarChart3}
            label="Stats"
            active={mobileTab === 'stats'}
            onClick={() => setMobileTab('stats')}
          />
        </nav>
      </div>
    </>
  );
}

function TabButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof MessageSquare;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex-1 flex flex-col items-center gap-0.5 py-2 transition-colors"
      style={{
        color: active ? 'var(--color-accent)' : 'var(--color-text-tertiary)',
      }}
    >
      <Icon size={18} />
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}
