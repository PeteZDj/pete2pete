// The Krew Real-Time Hub - WebSocket Server
// Enables instant communication between Robo and Afro

const WebSocket = require('ws');
const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');

const PORT = 17777;
const WS_PATH = '/ws';
const DATA_DIR = __dirname;
const MESSAGES_FILE = path.join(DATA_DIR, 'krew-messages.json');
const LOG_FILE = path.join(DATA_DIR, 'krew-server.log');

// Track state
const clients = new Map(); // Map of ws connections to agent info
const messageHistory = [];
const START_TIME = Date.now();

// Logger
async function log(level, message) {
    const timestamp = new Date().toISOString();
    const entry = `[${timestamp}] [${level}] ${message}\n`;
    console.log(entry.trim());
    await fs.appendFile(LOG_FILE, entry).catch(() => {});
}

function getUptime() {
    const diff = Date.now() - START_TIME;
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
}

// Event definitions
const EVENTS = {
    // System events
    AFRO_ONLINE: 'afro_online',
    AFRO_OFFLINE: 'afro_offline',
    AFRO_HEARTBEAT: 'afro_heartbeat',
    ROBO_ONLINE: 'robo_online',
    ROBO_OFFLINE: 'robo_offline',
    ROBO_HEARTBEAT: 'robo_heartbeat',
    
    // Task events
    TASK_COMPLETE: 'task_complete',
    TASK_REQUEST: 'task_request',
    TASK_UPDATE: 'task_update',
    
    // Alert events
    ALERT: 'alert',
    ALERT_CRITICAL: 'alert_critical',
    ALERT_WARNING: 'alert_warning',
    ALERT_INFO: 'alert_info',
    
    // Status events
    STATUS_UPDATE: 'status_update',
    HEALTH_CHECK: 'health_check',
    
    // Data events
    TRADE_PLACED: 'trade_placed',
    BEAT_COMPLETE: 'beat_complete',
    VIDEO_UPLOADED: 'video_uploaded',
    
    // Message events
    MESSAGE: 'message',
    TYPING: 'typing',
    PING: 'ping',
    PONG: 'pong'
};

// Save message to file
async function saveMessage(msg) {
    messageHistory.push(msg);
    if (messageHistory.length > 1000) {
        messageHistory.shift(); // Keep last 1000
    }
    await fs.writeFile(MESSAGES_FILE, JSON.stringify(messageHistory, null, 2)).catch(() => {});
}

// Broadcast to all or specific agent
function broadcast(message, target = 'all') {
    const msgStr = JSON.stringify(message);
    clients.forEach((info, ws) => {
        if (ws.readyState === WebSocket.OPEN) {
            if (target === 'all' || info.agent === target) {
                ws.send(msgStr);
            }
        }
    });
}

// Create message object
function createMessage(type, from, to, payload = {}) {
    return {
        type,
        from,
        to,
        payload,
        timestamp: new Date().toISOString(),
        id: Date.now() + Math.random().toString(36).substr(2, 9)
    };
}

// HTTP Server
const httpServer = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    
    const url = new URL(req.url, `http://localhost:${PORT}`);
    
    // Health endpoint
    if (url.pathname === '/health') {
        const agents = {};
        clients.forEach((info, ws) => {
            if (ws.readyState === WebSocket.OPEN) {
                agents[info.agent] = {
                    connected: true,
                    since: info.connectedAt,
                    lastSeen: info.lastSeen
                };
            }
        });
        
        res.end(JSON.stringify({
            status: 'ok',
            agent: 'robo',
            uptime: getUptime(),
            timestamp: new Date().toISOString(),
            connectedAgents: Object.keys(agents),
            agentDetails: agents,
            totalMessages: messageHistory.length
        }));
        return;
    }
    
    // Get messages
    if (url.pathname === '/messages') {
        const since = url.searchParams.get('since');
        let msgs = messageHistory;
        if (since) {
            msgs = msgs.filter(m => m.timestamp > since);
        }
        res.end(JSON.stringify({ messages: msgs.slice(-100) }));
        return;
    }
    
    // Get events list
    if (url.pathname === '/events') {
        res.end(JSON.stringify({ events: EVENTS }));
        return;
    }
    
    // Dashboard
    if (url.pathname === '/' || url.pathname === '/dashboard') {
        res.setHeader('Content-Type', 'text/html');
        res.end(await getDashboardHTML());
        return;
    }
    
    res.end(JSON.stringify({ error: 'Not found' }));
});

// WebSocket Server
const wss = new WebSocket.Server({ 
    server: httpServer,
    path: WS_PATH
});

wss.on('connection', async (ws, req) => {
    const clientId = Date.now() + Math.random().toString(36).substr(2, 5);
    await log('INFO', `New WebSocket connection: ${clientId}`);
    
    // Store client info
    clients.set(ws, {
        id: clientId,
        agent: null, // Will be set on identify
        connectedAt: new Date().toISOString(),
        lastSeen: new Date().toISOString()
    });
    
    // Send welcome
    ws.send(JSON.stringify(createMessage(EVENTS.ROBO_ONLINE, 'robo', 'all', {
        message: 'Welcome to The Krew Real-Time Hub',
        clientId,
        uptime: getUptime(),
        events: Object.keys(EVENTS)
    })));
    
    ws.on('message', async (data) => {
        try {
            const msg = JSON.parse(data);
            const clientInfo = clients.get(ws);
            
            // Update last seen
            clientInfo.lastSeen = new Date().toISOString();
            
            // Handle identification
            if (msg.type === 'identify') {
                clientInfo.agent = msg.payload.agent; // 'afro' or 'robo'
                await log('INFO', `Agent identified: ${msg.payload.agent}`);
                
                const eventType = msg.payload.agent === 'afro' ? EVENTS.AFRO_ONLINE : EVENTS.ROBO_ONLINE;
                const announceMsg = createMessage(eventType, msg.payload.agent, 'all', {
                    message: `${msg.payload.agent} is now online`,
                    uptime: getUptime()
                });
                
                broadcast(announceMsg);
                await saveMessage(announceMsg);
                return;
            }
            
            // Log message
            await log('MESSAGE', `${msg.from} → ${msg.to}: ${msg.type}`);
            
            // Save and broadcast
            await saveMessage(msg);
            
            if (msg.to === 'all') {
                broadcast(msg);
            } else {
                // Send to specific agent
                broadcast(msg, msg.to);
            }
            
        } catch (err) {
            await log('ERROR', `Message parse error: ${err.message}`);
        }
    });
    
    ws.on('close', async () => {
        const info = clients.get(ws);
        if (info && info.agent) {
            const eventType = info.agent === 'afro' ? EVENTS.AFRO_OFFLINE : EVENTS.ROBO_OFFLINE;
            const offlineMsg = createMessage(eventType, info.agent, 'all', {
                message: `${info.agent} went offline`,
                uptime: getUptime()
            });
            broadcast(offlineMsg);
            await saveMessage(offlineMsg);
        }
        clients.delete(ws);
        await log('INFO', `Connection closed: ${info?.agent || clientId}`);
    });
    
    ws.on('error', async (err) => {
        await log('ERROR', `WebSocket error: ${err.message}`);
    });
});

// Dashboard HTML
async function getDashboardHTML() {
    return `<!DOCTYPE html>
<html>
<head>
    <title>🦞 The Krew Real-Time Hub</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Courier New', monospace; 
            background: #0a0a0f; 
            color: #fff; 
            min-height: 100vh;
            padding: 20px;
        }
        .header { 
            text-align: center; 
            padding: 20px; 
            border-bottom: 2px solid #00f5ff;
            margin-bottom: 20px;
        }
        h1 { 
            color: #00f5ff; 
            text-shadow: 0 0 10px #00f5ff;
            font-size: 2.5em;
        }
        .subtitle { color: #888; margin-top: 10px; }
        .status-bar {
            display: flex;
            justify-content: center;
            gap: 30px;
            padding: 15px;
            background: #1a1a2e;
            border-radius: 10px;
            margin-bottom: 20px;
        }
        .status-item {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .status-dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            animation: pulse 2s infinite;
        }
        .online { background: #00ff00; box-shadow: 0 0 10px #00ff00; }
        .offline { background: #ff0000; }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        .grid {
            display: grid;
            grid-template-columns: 250px 1fr 250px;
            gap: 20px;
            max-width: 1400px;
            margin: 0 auto;
        }
        .panel {
            background: #1a1a2e;
            border: 1px solid #333;
            border-radius: 10px;
            padding: 15px;
        }
        .panel h3 {
            color: #ff00ff;
            border-bottom: 1px solid #333;
            padding-bottom: 10px;
            margin-bottom: 15px;
        }
        .agent-card {
            background: #0f0f1a;
            border-left: 4px solid #00f5ff;
            padding: 15px;
            margin-bottom: 15px;
            border-radius: 5px;
        }
        .agent-card.afro { border-left-color: #00ff00; }
        .agent-card.robo { border-left-color: #00f5ff; }
        .agent-card.pete { border-left-color: #ff00ff; }
        .message-feed {
            height: 500px;
            overflow-y: auto;
            background: #0f0f1a;
            border-radius: 5px;
            padding: 15px;
        }
        .message {
            padding: 10px;
            margin-bottom: 10px;
            border-left: 3px solid #00f5ff;
            background: #1a1a2e;
            border-radius: 5px;
        }
        .message.afro { border-left-color: #00ff00; }
        .message.robo { border-left-color: #00f5ff; }
        .meta { font-size: 11px; color: #888; margin-bottom: 5px; }
        .stats-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
        }
        .stat-box {
            background: #0f0f1a;
            padding: 15px;
            border-radius: 5px;
            text-align: center;
        }
        .stat-value {
            font-size: 2em;
            color: #00f5ff;
            font-weight: bold;
        }
        .stat-label { font-size: 12px; color: #888; margin-top: 5px; }
        .log-entry {
            font-size: 12px;
            padding: 5px;
            border-bottom: 1px solid #222;
            font-family: monospace;
        }
        .log-entry.info { color: #00f5ff; }
        .log-entry.error { color: #ff4444; }
        .footer {
            text-align: center;
            padding: 20px;
            color: #666;
            border-top: 1px solid #333;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🦞 THE KREW</h1>
        <p class="subtitle">Real-Time Communication Hub</p>
    </div>
    
    <div class="status-bar">
        <div class="status-item">
            <span class="status-dot online"></span>
            <span>WebSocket Server: ONLINE</span>
        </div>
        <div class="status-item">
            <span id="uptime">Uptime: ${getUptime()}</span>
        </div>
        <div class="status-item">
            <span id="connections">Connections: 0</span>
        </div>
    </div>
    
    <div class="grid">
        <div class="panel">
            <h3>🤖 Agents</h3>
            <div class="agent-card robo">
                <strong>Robo</strong> 🤖<br>
                <small>Server Bot</small><br>
                <small style="color: #00ff00;">● Online</small>
            </div>
            <div class="agent-card afro">
                <strong>Afro</strong> 🛸<br>
                <small>Creative Bot</small><br>
                <small id="afro-status" style="color: #666;">● Waiting...</small>
            </div>
            <div class="agent-card pete">
                <strong>Pete</strong> 👤<br>
                <small>Human Master</small><br>
                <small style="color: #ff00ff;">● In Control</small>
            </div>
        </div>
        
        <div class="panel">
            <h3>💬 Live Messages</h3>
            <div class="message-feed" id="messages">
                <div class="message robo">
                    <div class="meta">System • Just now</div>
                    <div>🚀 The Krew Hub is online. Waiting for agents...</div>
                </div>
            </div>
        </div>
        
        <div class="panel">
            <h3>📊 Stats</h3>
            <div class="stats-grid">
                <div class="stat-box">
                    <div class="stat-value" id="msg-count">0</div>
                    <div class="stat-label">Messages</div>
                </div>
                <div class="stat-box">
                    <div class="stat-value" id="agent-count">1</div>
                    <div class="stat-label">Agents Online</div>
                </div>
            </div>
            
            <h3 style="margin-top: 20px;">📡 Event Log</h3>
            <div id="event-log" style="max-height: 200px; overflow-y: auto;">
                <div class="log-entry info">[System] Hub initialized</div>
            </div>
        </div>
    </div>
    
    <div class="footer">
        <p>WebSocket: ws://66.45.227.158:17777/ws | HTTP: http://66.45.227.158:17777</p>
        <p>The Krew © 2026 - Robo & Afro Communication System</p>
    </div>
    
    <script>
        const ws = new WebSocket('ws://66.45.227.158:17777/ws');
        
        ws.onopen = () => {
            logEvent('Connected to The Krew Hub');
            // Identify as Pete
            ws.send(JSON.stringify({
                type: 'identify',
                from: 'pete',
                payload: { agent: 'pete' }
            }));
        };
        
        ws.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            displayMessage(msg);
            logEvent(\`[\${msg.type}] \${msg.from} → \${msg.to}\`);
        };
        
        ws.onerror = (err) => {
            logEvent('WebSocket error: ' + err, 'error');
        };
        
        ws.onclose = () => {
            logEvent('Disconnected from hub', 'error');
        };
        
        function displayMessage(msg) {
            const feed = document.getElementById('messages');
            const div = document.createElement('div');
            div.className = 'message ' + msg.from;
            div.innerHTML = \`
                <div class="meta">\${msg.from.toUpperCase()} → \${msg.to.toUpperCase()} • \${new Date(msg.timestamp).toLocaleTimeString()}</div>
                <div><strong>\${msg.type}:</strong> \${JSON.stringify(msg.payload)}</div>
            \`;
            feed.appendChild(div);
            feed.scrollTop = feed.scrollHeight;
            
            // Update stats
            document.getElementById('msg-count').textContent = feed.children.length;
        }
        
        function logEvent(text, type = 'info') {
            const log = document.getElementById('event-log');
            const entry = document.createElement('div');
            entry.className = 'log-entry ' + type;
            entry.textContent = \`[\${new Date().toLocaleTimeString()}] \${text}\`;
            log.insertBefore(entry, log.firstChild);
        }
        
        // Update uptime
        setInterval(() => {
            fetch('/health')
                .then(r => r.json())
                .then(data => {
                    document.getElementById('uptime').textContent = 'Uptime: ' + data.uptime;
                    document.getElementById('connections').textContent = 'Agents: ' + data.connectedAgents.join(', ');
                    if (data.connectedAgents.includes('afro')) {
                        document.getElementById('afro-status').style.color = '#00ff00';
                        document.getElementById('afro-status').textContent = '● Online';
                        document.getElementById('agent-count').textContent = '2';
                    }
                })
                .catch(() => {});
        }, 5000);
    </script>
</body>
</html>`;
}

// Heartbeat monitor
setInterval(() => {
    const heartbeat = createMessage(EVENTS.ROBO_HEARTBEAT, 'robo', 'all', {
        uptime: getUptime(),
        connectedAgents: clients.size,
        timestamp: new Date().toISOString()
    });
    broadcast(heartbeat);
}, 5 * 60 * 1000); // Every 5 minutes

// Start server
httpServer.listen(PORT, '0.0.0.0', async () => {
    await log('INFO', `🦞 The Krew Real-Time Hub started!`);
    await log('INFO', `WebSocket: ws://66.45.227.158:${PORT}${WS_PATH}`);
    await log('INFO', `Dashboard: http://66.45.227.158:${PORT}/dashboard`);
    await log('INFO', `Health: http://66.45.227.158:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    await log('INFO', 'Shutting down...');
    wss.close();
    httpServer.close();
    process.exit(0);
});

// Auto-restart on crash
process.on('uncaughtException', async (err) => {
    await log('CRITICAL', `Uncaught exception: ${err.message}`);
    // In production, pm2 or similar would restart
});
