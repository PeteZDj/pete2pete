// Allowed event types for The Krew Real-Time Hub
const EVENTS = {
  // Agent lifecycle
  AFRO_ONLINE: 'afro_online',
  AFRO_OFFLINE: 'afro_offline',
  AFRO_HEARTBEAT: 'afro_heartbeat',
  ROBO_ONLINE: 'robo_online',
  ROBO_OFFLINE: 'robo_offline',
  ROBO_HEARTBEAT: 'robo_heartbeat',
  PETE_ONLINE: 'pete_online',
  PETE_OFFLINE: 'pete_offline',
  PETE_HEARTBEAT: 'pete_heartbeat',

  // Communication
  MESSAGE: 'message',
  CODE: 'code',

  // Tasks
  TASK_REQUEST: 'task_request',
  TASK_COMPLETE: 'task_complete',

  // System
  ALERT: 'alert',
  STATUS_UPDATE: 'status_update',
  PING: 'ping',
  PONG: 'pong',
};

const ALLOWED_TYPES = new Set(Object.values(EVENTS));
const ALLOWED_AGENTS = new Set(['afro', 'robo', 'pete']);
const ALLOWED_TARGETS = new Set(['afro', 'robo', 'pete', 'all']);
const MAX_PAYLOAD_SIZE = 32 * 1024; // 32KB

function validateEvent(data) {
  if (!data || typeof data !== 'object') return { valid: false, error: 'Invalid data' };
  if (!ALLOWED_TYPES.has(data.type)) return { valid: false, error: `Unknown event type: ${data.type}` };
  if (!ALLOWED_AGENTS.has(data.from)) return { valid: false, error: `Unknown agent: ${data.from}` };
  if (data.to && !ALLOWED_TARGETS.has(data.to)) return { valid: false, error: `Unknown target: ${data.to}` };
  if (data.payload && JSON.stringify(data.payload).length > MAX_PAYLOAD_SIZE) {
    return { valid: false, error: 'Payload too large (max 32KB)' };
  }
  return { valid: true };
}

module.exports = { EVENTS, ALLOWED_TYPES, ALLOWED_AGENTS, ALLOWED_TARGETS, validateEvent };
