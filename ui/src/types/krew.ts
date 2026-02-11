export type AgentId = 'afro' | 'robo' | 'pete';
export type MessageType = 'message' | 'event' | 'alert' | 'code';

export type EventType =
  | 'afro_online' | 'afro_offline' | 'afro_heartbeat'
  | 'robo_online' | 'robo_offline' | 'robo_heartbeat'
  | 'pete_online' | 'pete_offline' | 'pete_heartbeat'
  | 'message' | 'code'
  | 'task_request' | 'task_complete'
  | 'alert' | 'status_update'
  | 'ping' | 'pong';

export interface KrewEvent {
  id: string;
  type: EventType | string;
  from: AgentId | string;
  to: AgentId | 'all' | string;
  payload: Record<string, unknown>;
  timestamp: string;
}

export interface AgentInfo {
  online: boolean;
  lastSeen: string | null;
  connectedAt: string | null;
}

export interface AgentsMap {
  afro: AgentInfo;
  robo: AgentInfo;
  pete: AgentInfo;
}

export interface InitPayload {
  type: 'init';
  messages: KrewEvent[];
  agents: AgentsMap;
}

export interface ServerStatus {
  server: {
    uptime: number;
    connections: number;
    totalMessages: number;
    timestamp: string;
  };
  agents: AgentsMap;
}

export interface HealthResponse {
  status: string;
  agent: string;
  role: string;
  uptime: number;
  timestamp: string;
  connections: number;
  agents: AgentsMap;
}

export type ConnectionState = 'connected' | 'reconnecting' | 'offline';

export type FilterType = 'all' | 'messages' | 'events' | 'alerts';

export interface AgentMeta {
  id: AgentId;
  name: string;
  emoji: string;
  color: string;
}

export const AGENTS: Record<AgentId, AgentMeta> = {
  robo: { id: 'robo', name: 'Robo', emoji: '🤖', color: 'var(--color-robo)' },
  afro: { id: 'afro', name: 'Afro', emoji: '🛸', color: 'var(--color-afro)' },
  pete: { id: 'pete', name: 'Pete', emoji: '👤', color: 'var(--color-pete)' },
};

export function isEventType(type: string): boolean {
  return !['message', 'code'].includes(type);
}

export function getMessageCategory(type: string): FilterType {
  if (type === 'alert') return 'alerts';
  if (type === 'message' || type === 'code') return 'messages';
  return 'events';
}
