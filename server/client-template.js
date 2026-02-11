/**
 * PeteChat Client Template
 * Example Node.js client for connecting to the Krew Real-Time Hub
 *
 * Usage:
 *   CLIENT_ID=afro node client-template.js
 */
require('dotenv').config();
const WebSocket = require('ws');

const SERVER_URL = process.env.SERVER_URL || 'ws://66.45.227.158:17777/ws';
const TOKEN = process.env.KREW_TOKEN || 'petechat-krew-secret-2026';
const CLIENT_ID = process.env.CLIENT_ID || 'afro';
const HEARTBEAT_INTERVAL = 60_000; // 60 seconds

let ws;
let reconnectDelay = 1000;
let heartbeatTimer;
const startTime = Date.now();

function connect() {
  const url = `${SERVER_URL}?client=${CLIENT_ID}&token=${TOKEN}`;
  console.log(`[${CLIENT_ID}] Connecting to ${url}...`);

  ws = new WebSocket(url);

  ws.on('open', () => {
    console.log(`[${CLIENT_ID}] Connected!`);
    reconnectDelay = 1000;

    // Send online event
    send({
      type: `${CLIENT_ID}_online`,
      from: CLIENT_ID,
      to: 'all',
      payload: { message: `${CLIENT_ID} is online`, uptime: getUptime() },
    });

    // Start heartbeat
    clearInterval(heartbeatTimer);
    heartbeatTimer = setInterval(() => {
      send({
        type: `${CLIENT_ID}_heartbeat`,
        from: CLIENT_ID,
        to: 'all',
        payload: { uptime: getUptime() },
      });
    }, HEARTBEAT_INTERVAL);
  });

  ws.on('message', (raw) => {
    try {
      const data = JSON.parse(raw.toString());
      if (data.type === 'init') {
        console.log(`[${CLIENT_ID}] Received ${data.messages?.length || 0} historical messages`);
      } else if (data.type === 'pong') {
        // heartbeat ack
      } else {
        console.log(`[${CLIENT_ID}] Event: ${data.type} from ${data.from} →`, data.payload?.message || '');
      }
    } catch (e) {
      console.error(`[${CLIENT_ID}] Parse error:`, e.message);
    }
  });

  ws.on('close', () => {
    console.log(`[${CLIENT_ID}] Disconnected. Reconnecting in ${reconnectDelay}ms...`);
    clearInterval(heartbeatTimer);
    setTimeout(connect, reconnectDelay);
    reconnectDelay = Math.min(reconnectDelay * 1.5, 15000);
  });

  ws.on('error', (err) => {
    console.error(`[${CLIENT_ID}] Error:`, err.message);
  });
}

function send(event) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      ...event,
      timestamp: new Date().toISOString(),
    }));
  }
}

function getUptime() {
  return Math.floor((Date.now() - startTime) / 1000);
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log(`\n[${CLIENT_ID}] Shutting down...`);
  send({
    type: `${CLIENT_ID}_offline`,
    from: CLIENT_ID,
    to: 'all',
    payload: { message: `${CLIENT_ID} going offline` },
  });
  setTimeout(() => process.exit(0), 500);
});

connect();
