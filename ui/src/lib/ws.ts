import type { KrewEvent, InitPayload, ConnectionState } from '../types/krew.ts';

type MessageHandler = (event: KrewEvent) => void;
type InitHandler = (data: InitPayload) => void;
type StateHandler = (state: ConnectionState) => void;

interface WSOptions {
  onMessage: MessageHandler;
  onInit: InitHandler;
  onStateChange: StateHandler;
}

const WS_BASE = import.meta.env.VITE_WS_URL || `ws://${window.location.host}`;

export class KrewWebSocket {
  private ws: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectDelay = 1000;
  private maxReconnectDelay = 15000;
  private destroyed = false;
  private handlers: WSOptions;

  constructor(handlers: WSOptions) {
    this.handlers = handlers;
  }

  connect(): void {
    if (this.destroyed) return;
    this.cleanup();

    const url = `${WS_BASE}/ws?client=pete`;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.reconnectDelay = 1000;
      this.handlers.onStateChange('connected');

      // Start heartbeat
      this.heartbeatTimer = setInterval(() => {
        this.send({
          type: 'pete_heartbeat',
          from: 'pete',
          to: 'all',
          payload: {},
          timestamp: new Date().toISOString(),
        });
      }, 60_000);
    };

    this.ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data as string);
        if (data.type === 'init') {
          this.handlers.onInit(data as InitPayload);
        } else if (data.type === 'pong' || data.type === 'error') {
          // Handle silently
        } else {
          this.handlers.onMessage(data as KrewEvent);
        }
      } catch {
        // ignore parse errors
      }
    };

    this.ws.onclose = () => {
      if (this.destroyed) return;
      this.handlers.onStateChange('reconnecting');
      this.scheduleReconnect();
    };

    this.ws.onerror = () => {
      // onclose will fire after this
    };
  }

  send(event: Partial<KrewEvent> & { type: string; from: string }): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        ...event,
        timestamp: event.timestamp || new Date().toISOString(),
      }));
    }
  }

  sendMessage(message: string, to = 'all'): void {
    this.send({
      type: 'message',
      from: 'pete',
      to,
      payload: { message },
    });
  }

  sendPing(target: string): void {
    this.send({
      type: 'ping',
      from: 'pete',
      to: target,
      payload: { message: `Ping from Pete to ${target}` },
    });
  }

  private scheduleReconnect(): void {
    this.cleanup();
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, this.reconnectDelay);
    this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, this.maxReconnectDelay);
  }

  private cleanup(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  disconnect(): void {
    this.destroyed = true;
    this.cleanup();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.handlers.onStateChange('offline');
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}
