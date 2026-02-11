import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  KrewEvent,
  AgentsMap,
  AgentId,
  FilterType,
  ConnectionState,
} from '../types/krew.ts';
import { KrewWebSocket } from '../lib/ws.ts';
import { getMessages, getStatus } from '../lib/api.ts';
import { saveMessages, clearMessages as clearLocalMessages, exportMessages } from '../lib/storage.ts';
import { useTheme } from '../lib/theme.ts';
import TopBar from '../components/layout/TopBar.tsx';
import AppShell from '../components/layout/AppShell.tsx';
import SidebarAgents from '../components/layout/SidebarAgents.tsx';
import RightPanel from '../components/layout/RightPanel.tsx';
import MessageFeed from '../components/chat/MessageFeed.tsx';
import MessageInput from '../components/chat/MessageInput.tsx';

const defaultAgents: AgentsMap = {
  afro: { online: false, lastSeen: null, connectedAt: null },
  robo: { online: false, lastSeen: null, connectedAt: null },
  pete: { online: false, lastSeen: null, connectedAt: null },
};

export default function App() {
  const [messages, setMessages] = useState<KrewEvent[]>([]);
  const [agents, setAgents] = useState<AgentsMap>(defaultAgents);
  const [connectionState, setConnectionState] = useState<ConnectionState>('offline');
  const [selectedAgent, setSelectedAgent] = useState<AgentId | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [serverUptime, setServerUptime] = useState(0);
  const [loading, setLoading] = useState(true);
  const { theme, cycle: cycleTheme } = useTheme();
  const wsRef = useRef<KrewWebSocket | null>(null);

  // WebSocket setup
  useEffect(() => {
    const ws = new KrewWebSocket({
      onInit: (data) => {
        setMessages(data.messages || []);
        setAgents(data.agents || defaultAgents);
        setLoading(false);
        saveMessages(data.messages || []);
      },
      onMessage: (event) => {
        setMessages((prev) => {
          const next = [...prev, event];
          saveMessages(next);
          return next;
        });

        // Update agent status on online/offline events
        if (event.type.endsWith('_online') || event.type.endsWith('_offline')) {
          refreshStatus();
        }
      },
      onStateChange: (state) => {
        setConnectionState(state);
        if (state === 'connected') {
          refreshStatus();
        }
      },
    });

    ws.connect();
    wsRef.current = ws;

    return () => {
      ws.disconnect();
    };
  }, []);

  // Periodic status refresh
  useEffect(() => {
    const interval = setInterval(() => {
      if (connectionState === 'connected') {
        refreshStatus();
      }
    }, 30_000);
    return () => clearInterval(interval);
  }, [connectionState]);

  const refreshStatus = useCallback(async () => {
    try {
      const status = await getStatus();
      setAgents(status.agents);
      setServerUptime(status.server.uptime);
    } catch {
      // silent fail
    }
  }, []);

  // Fallback: fetch messages via REST if WS is down
  useEffect(() => {
    if (connectionState !== 'connected') {
      const fallback = setInterval(async () => {
        try {
          const data = await getMessages(200);
          setMessages(data.messages || []);
          setLoading(false);
        } catch {
          // silent
        }
      }, 5000);
      return () => clearInterval(fallback);
    }
  }, [connectionState]);

  // Send message
  const handleSend = useCallback((message: string) => {
    wsRef.current?.sendMessage(message);
  }, []);

  // Handle commands
  const handleCommand = useCallback(
    (cmd: string, args: string[]) => {
      switch (cmd) {
        case '/ping': {
          const target = args[0];
          if (target === 'afro' || target === 'robo') {
            wsRef.current?.sendPing(target);
          }
          break;
        }
        case '/status':
          refreshStatus();
          break;
        case '/clear':
          setMessages([]);
          clearLocalMessages();
          break;
        case '/help':
          // Add a local help message
          setMessages((prev) => [
            ...prev,
            {
              id: `help-${Date.now()}`,
              type: 'event',
              from: 'robo',
              to: 'pete',
              payload: {
                message:
                  'Available commands: /ping afro, /ping robo, /status, /clear, /help',
              },
              timestamp: new Date().toISOString(),
            },
          ]);
          break;
        default:
          // Unknown command — send as message
          handleSend(`${cmd} ${args.join(' ')}`);
      }
    },
    [refreshStatus, handleSend]
  );

  const handleClearMessages = useCallback(() => {
    setMessages([]);
    clearLocalMessages();
  }, []);

  const handleExportMessages = useCallback(() => {
    exportMessages(messages);
  }, [messages]);

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--color-bg)' }}>
      <TopBar
        connectionState={connectionState}
        theme={theme}
        onThemeCycle={cycleTheme}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <AppShell
        sidebar={
          <SidebarAgents
            agents={agents}
            selectedAgent={selectedAgent}
            onSelectAgent={setSelectedAgent}
          />
        }
        feed={
          <MessageFeed
            messages={messages}
            filter={filter}
            onFilterChange={setFilter}
            agentFilter={selectedAgent}
            searchQuery={searchQuery}
            loading={loading}
          />
        }
        input={
          <MessageInput
            onSend={handleSend}
            onCommand={handleCommand}
            disabled={connectionState !== 'connected'}
          />
        }
        rightPanel={
          <RightPanel
            messages={messages}
            agents={agents}
            serverUptime={serverUptime}
            loading={loading}
            onClearMessages={handleClearMessages}
            onExportMessages={handleExportMessages}
          />
        }
      />
    </div>
  );
}
