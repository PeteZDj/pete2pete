import type { HealthResponse, KrewEvent, ServerStatus } from '../types/krew.ts';

const BASE_URL = import.meta.env.VITE_API_URL || '';

async function fetchJSON<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export async function getHealth(): Promise<HealthResponse> {
  return fetchJSON<HealthResponse>('/health');
}

export async function getStatus(): Promise<ServerStatus> {
  return fetchJSON<ServerStatus>('/krew/status');
}

export async function getMessages(limit = 200): Promise<{ messages: KrewEvent[] }> {
  return fetchJSON<{ messages: KrewEvent[] }>(`/messages?limit=${limit}`);
}

export async function sendMessage(
  from: string,
  to: string,
  message: string,
  type = 'message'
): Promise<{ ok: boolean; event: KrewEvent }> {
  return fetchJSON<{ ok: boolean; event: KrewEvent }>('/send', {
    method: 'POST',
    body: JSON.stringify({ from, to, message, type }),
  });
}
