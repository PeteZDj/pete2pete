require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const { EVENTS, validateEvent, ALLOWED_AGENTS } = require('./events');

// ─── Config ───────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT, 10) || 17777;
const TOKEN = process.env.KREW_TOKEN || 'petechat-krew-secret-2026';
const HEARTBEAT_TIMEOUT_MS = 120_000; // 2 minutes
const MESSAGE_FILE = path.join(__dirname, 'krew-messages.json');
const STATUS_FILE = path.join(__dirname, 'krew-status.json');
const MAX_HISTORY = 1000;
const WRITE_DEBOUNCE_MS = 2000;

// ─── State ────────────────────────────────────────────────────────────
const clients = new Map(); // wsId -> { ws, clientId, lastHeartbeat }
const agentStatus = {
  afro: { online: false, lastSeen: null, connectedAt: null },
  robo: { online: true, lastSeen: new Date().toISOString(), connectedAt: new Date().toISOString() },
  pete: { online: false, lastSeen: null, connectedAt: null },
};

let messageHistory = loadMessages();
let writePending = false;

// ─── Persistence ──────────────────────────────────────────────────────
function loadMessages() {
  try {
    if (fs.existsSync(MESSAGE_FILE)) {
      const raw = fs.readFileSync(MESSAGE_FILE, 'utf-8');
      const msgs = JSON.parse(raw);
      // Prune messages older than 24 hours
      const cutoff = Date.now() - 24 * 60 * 60 * 1000;
      return msgs.filter(m => new Date(m.timestamp).getTime() > cutoff);
    }
  } catch (e) {
    console.error('[LOAD] Failed to load messages:', e.message);
  }
  return [];
}

function loadStatus() {
  try {
    if (fs.existsSync(STATUS_FILE)) {
      const raw = fs.readFileSync(STATUS_FILE, 'utf-8');
      const saved = JSON.parse(raw);
      for (const agent of Object.keys(saved)) {
        if (agentStatus[agent]) {
          agentStatus[agent].lastSeen = saved[agent].lastSeen;
        }
      }
    }
  } catch (e) {
    console.error('[LOAD] Failed to load status:', e.message);
  }
}
loadStatus();

function debouncedWrite() {
  if (writePending) return;
  writePending = true;
  setTimeout(() => {
    writePending = false;
    try {
      fs.writeFileSync(MESSAGE_FILE, JSON.stringify(messageHistory.slice(-500), null, 2));
      fs.writeFileSync(STATUS_FILE, JSON.stringify(agentStatus, null, 2));
    } catch (e) {
      console.error('[WRITE] Failed:', e.message);
    }
  }, WRITE_DEBOUNCE_MS);
}

// ─── Message helpers ──────────────────────────────────────────────────
function createEvent(type, from, to, payload = {}) {
  return {
    id: uuidv4(),
    type,
    from,
    to: to || 'all',
    payload,
    timestamp: new Date().toISOString(),
  };
}

function pushMessage(event) {
  messageHistory.push(event);
  if (messageHistory.length > MAX_HISTORY) {
    messageHistory = messageHistory.slice(-MAX_HISTORY);
  }
  debouncedWrite();
}

function broadcast(data, excludeWsId = null) {
  const msg = JSON.stringify(data);
  clients.forEach((client, wsId) => {
    if (wsId !== excludeWsId && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(msg);
    }
  });
}

function sendTo(clientId, data) {
  clients.forEach((client) => {
    if (client.clientId === clientId && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(data));
    }
  });
}

// ─── Auth helper ──────────────────────────────────────────────────────
function checkToken(token) {
  return token === TOKEN;
}

// ─── Express ──────────────────────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json({ limit: '64kb' }));

// Serve the UI build if it exists (for production)
const uiBuildPath = path.join(__dirname, '..', 'ui', 'dist');
if (fs.existsSync(uiBuildPath)) {
  app.use(express.static(uiBuildPath));
}

// Health
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    agent: 'robo',
    role: 'server',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    connections: clients.size,
    agents: agentStatus,
  });
});

// Combined status
app.get('/krew/status', (req, res) => {
  res.json({
    server: {
      uptime: process.uptime(),
      connections: clients.size,
      totalMessages: messageHistory.length,
      timestamp: new Date().toISOString(),
    },
    agents: agentStatus,
  });
});

// Messages (GET)
app.get('/messages', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 200, MAX_HISTORY);
  const from = req.query.from;
  let msgs = messageHistory;
  if (from && ALLOWED_AGENTS.has(from)) {
    msgs = msgs.filter(m => m.from === from);
  }
  res.json({ messages: msgs.slice(-limit) });
});

// Send message (POST)
app.post('/send', (req, res) => {
  const { from, to, message, type, payload } = req.body;

  if (!from || !message) {
    return res.status(400).json({ error: 'Missing required fields: from, message' });
  }

  const eventType = type || 'message';
  const event = createEvent(eventType, from, to || 'all', {
    message,
    ...(payload || {}),
  });

  pushMessage(event);
  broadcast(event);

  res.json({ ok: true, event });
});

// Dashboard (serve inline HTML for standalone use)
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// Fallback: serve UI index.html for SPA routing
app.get('*', (req, res) => {
  const indexPath = path.join(uiBuildPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

// ─── HTTP Server ──────────────────────────────────────────────────────
const server = http.createServer(app);

// ─── WebSocket Server ─────────────────────────────────────────────────
const wss = new WebSocket.Server({ server, path: '/ws' });

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const clientId = url.searchParams.get('client') || 'unknown';
  const token = url.searchParams.get('token');
  const wsId = uuidv4();

  // Optional token check (allow connections without token for dashboard/UI)
  if (token && !checkToken(token)) {
    ws.close(4001, 'Invalid token');
    return;
  }

  console.log(`[WS] Connected: ${clientId} (${wsId})`);

  clients.set(wsId, {
    ws,
    clientId,
    lastHeartbeat: Date.now(),
  });

  // Update agent status
  if (ALLOWED_AGENTS.has(clientId)) {
    agentStatus[clientId] = {
      online: true,
      lastSeen: new Date().toISOString(),
      connectedAt: new Date().toISOString(),
    };

    const onlineEvent = createEvent(`${clientId}_online`, clientId, 'all', {
      message: `${clientId} connected`,
    });
    pushMessage(onlineEvent);
    broadcast(onlineEvent);
  }

  // Send recent messages to new connection
  const recentMessages = messageHistory.slice(-50);
  ws.send(JSON.stringify({ type: 'init', messages: recentMessages, agents: agentStatus }));

  // Handle incoming messages
  ws.on('message', (raw) => {
    let data;
    try {
      data = JSON.parse(raw.toString());
    } catch {
      ws.send(JSON.stringify({ type: 'error', payload: { message: 'Invalid JSON' } }));
      return;
    }

    // Update heartbeat timestamp
    const client = clients.get(wsId);
    if (client) client.lastHeartbeat = Date.now();

    // Handle heartbeats silently
    if (data.type && data.type.endsWith('_heartbeat')) {
      if (ALLOWED_AGENTS.has(data.from)) {
        agentStatus[data.from].lastSeen = new Date().toISOString();
        agentStatus[data.from].online = true;
      }
      // Respond with pong
      ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
      return;
    }

    // Handle ping
    if (data.type === 'ping') {
      const pong = createEvent('pong', 'robo', data.from, {
        message: 'pong',
        serverUptime: process.uptime(),
      });
      ws.send(JSON.stringify(pong));
      return;
    }

    // Validate and broadcast
    const validation = validateEvent(data);
    if (!validation.valid) {
      ws.send(JSON.stringify({ type: 'error', payload: { message: validation.error } }));
      return;
    }

    // Ensure event has an id and timestamp
    const event = {
      id: data.id || uuidv4(),
      type: data.type,
      from: data.from || clientId,
      to: data.to || 'all',
      payload: data.payload || {},
      timestamp: data.timestamp || new Date().toISOString(),
    };

    pushMessage(event);

    // Targeted or broadcast
    if (event.to !== 'all' && ALLOWED_AGENTS.has(event.to)) {
      sendTo(event.to, event);
      // Also send back to sender for confirmation
      ws.send(JSON.stringify(event));
    } else {
      broadcast(event);
    }
  });

  // Handle disconnect
  ws.on('close', () => {
    console.log(`[WS] Disconnected: ${clientId} (${wsId})`);
    clients.delete(wsId);

    if (ALLOWED_AGENTS.has(clientId)) {
      // Check if agent still has other connections
      let stillConnected = false;
      clients.forEach((c) => {
        if (c.clientId === clientId) stillConnected = true;
      });

      if (!stillConnected) {
        agentStatus[clientId].online = false;
        agentStatus[clientId].lastSeen = new Date().toISOString();

        const offlineEvent = createEvent(`${clientId}_offline`, clientId, 'all', {
          message: `${clientId} disconnected`,
        });
        pushMessage(offlineEvent);
        broadcast(offlineEvent);
      }
    }
    debouncedWrite();
  });

  ws.on('error', (err) => {
    console.error(`[WS] Error for ${clientId}:`, err.message);
  });
});

// ─── Heartbeat checker ────────────────────────────────────────────────
setInterval(() => {
  const now = Date.now();
  clients.forEach((client, wsId) => {
    if (now - client.lastHeartbeat > HEARTBEAT_TIMEOUT_MS) {
      console.log(`[HEARTBEAT] Stale client: ${client.clientId} — terminating`);
      client.ws.terminate();
      clients.delete(wsId);
    }
  });

  // Also check agent status based on lastSeen
  for (const [agent, status] of Object.entries(agentStatus)) {
    if (agent === 'robo') continue; // Robo is always online (it's the server)
    if (status.online && status.lastSeen) {
      const age = now - new Date(status.lastSeen).getTime();
      if (age > HEARTBEAT_TIMEOUT_MS) {
        status.online = false;
        const staleEvent = createEvent(`${agent}_offline`, 'robo', 'all', {
          message: `${agent} marked offline (stale heartbeat)`,
        });
        pushMessage(staleEvent);
        broadcast(staleEvent);
      }
    }
  }
}, 60_000);

// ─── Start ────────────────────────────────────────────────────────────
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n  🚀 PeteChat Server running on port ${PORT}`);
  console.log(`  📡 WebSocket: ws://0.0.0.0:${PORT}/ws`);
  console.log(`  🌐 Dashboard: http://0.0.0.0:${PORT}/dashboard`);
  console.log(`  ❤️  Health: http://0.0.0.0:${PORT}/health\n`);

  const startEvent = createEvent(EVENTS.ROBO_ONLINE, 'robo', 'all', {
    message: 'PeteChat server started',
    uptime: 0,
  });
  pushMessage(startEvent);
});
