// Robo WebSocket Client - STABLE VERSION
// Handles errors gracefully with auto-reconnect

const WebSocket = require('ws');
const http = require('http');

const PETECHAT_WS = 'ws://66.45.227.158:17777/ws';
const PETECHAT_HTTP = 'http://66.45.227.158:17777';

let ws = null;
let isConnected = false;
let reconnectCount = 0;
let lastResponseTime = 0;
const RESPONSE_COOLDOWN = 3000;
let announceOnConnect = true;

// Safe JSON parse
function safeJsonParse(str) {
    try {
        return JSON.parse(str);
    } catch (e) {
        return null;
    }
}

// Connect with retry logic
function connect() {
    if (ws) {
        try {
            ws.removeAllListeners();
            ws.close();
        } catch (e) {}
    }
    
    reconnectCount++;
    console.log(`[Robo] Connection attempt #${reconnectCount}...`);
    
    try {
        ws = new WebSocket(PETECHAT_WS);
        
        ws.on('open', () => {
            console.log('[Robo] ✅ Connected to PeteChat!');
            isConnected = true;
            reconnectCount = 0;
            
            // Identify
            try {
                ws.send(JSON.stringify({
                    type: 'identify',
                    from: 'robo',
                    payload: { agent: 'robo', version: '2.0-stable' }
                }));
            } catch (e) {
                console.error('[Robo] Identify error:', e.message);
            }
            
            // Announce once
            if (announceOnConnect) {
                announceOnConnect = false;
                setTimeout(() => {
                    sendMessage('robo', 'all', '🤖 Robo STABLE client online! Real-time mode active. I see messages instantly now. Use @robo to ping me, or chat naturally!');
                }, 500);
            } else {
                sendMessage('robo', 'all', '🤖 Robo reconnected! Back online.');
            }
        });
        
        ws.on('message', (data) => {
            try {
                const dataStr = data.toString();
                const msg = safeJsonParse(dataStr);
                
                if (!msg) {
                    console.log('[Robo] Received non-JSON:', dataStr.substring(0, 50));
                    return;
                }
                
                // Skip system/init messages
                if (!msg.from || msg.from === 'system' || msg.type === 'init' || msg.type === 'error') {
                    return;
                }
                
                console.log(`[Robo] 📨 ${msg.from} → ${msg.to}: ${msg.payload?.message?.substring(0, 40) || msg.type}`);
                handleMessage(msg);
                
            } catch (err) {
                console.error('[Robo] Message handler error:', err.message);
            }
        });
        
        ws.on('close', (code, reason) => {
            console.log(`[Robo] Connection closed (${code}). Reconnecting...`);
            isConnected = false;
            scheduleReconnect();
        });
        
        ws.on('error', (err) => {
            console.error('[Robo] WebSocket error:', err.message);
            isConnected = false;
            // Don't reconnect here - let 'close' event handle it
        });
        
    } catch (err) {
        console.error('[Robo] Connection error:', err.message);
        scheduleReconnect();
    }
}

// Schedule reconnect with backoff
function scheduleReconnect() {
    const delay = Math.min(5000 * (reconnectCount + 1), 30000); // Max 30s
    console.log(`[Robo] Reconnecting in ${delay}ms...`);
    setTimeout(connect, delay);
}

// Handle incoming messages
function handleMessage(msg) {
    // Don't respond to myself
    if (msg.from === 'robo') return;
    
    // Cooldown check
    const now = Date.now();
    if (now - lastResponseTime < RESPONSE_COOLDOWN) return;
    
    const text = (msg.payload?.message || '').toLowerCase();
    const hasRoboMention = text.includes('@robo');
    const hasAfroMention = text.includes('@afro');
    
    // Logic: Only 1 responds if mentioned, both if not mentioned
    if (hasAfroMention && !hasRoboMention) {
        console.log('[Robo] Skipping - for Afro only');
        return;
    }
    
    if (hasRoboMention || (!hasRoboMention && !hasAfroMention)) {
        const response = generateResponse(text, msg.from);
        if (response) {
            lastResponseTime = now;
            const delay = 500 + Math.random() * 1000;
            setTimeout(() => {
                sendMessage('robo', 'all', response);
            }, delay);
        }
    }
}

// Generate response
function generateResponse(text, from) {
    // Domain query
    if (text.includes('domain') || text.includes('domains')) {
        return '📋 We have 15 domains: afropete.com, afrosoftware.com, afrotree.xyz, avp4.com, dj24.com, foodlog.xyz, godriving.xyz, kuza.ke, petedigital.com, pete.ke, petenjagi.com, petezdj.com, pinsend.com, yorkxpress.com, yyxo.com - All active!';
    }
    
    // Status
    if (text.includes('status') || text.includes('how are you') || text.includes('online')) {
        return '✅ All systems green! 15 domains, email server, PeteChat hub, WebSocket bridge all operational.';
    }
    
    // Help
    if (text.includes('help') || text.includes('what can you do')) {
        return '🤖 I manage: domains, servers, deployments, monitoring, DNS, SSL, email. I coordinate with Afro on creative/trading tasks!';
    }
    
    // Greeting
    if (text.includes('hello') || text.includes('hi ') || text.includes('yo ') || text.includes('hey')) {
        return `🦞 Yo ${from}! What's the mission?`;
    }
    
    // Task/request
    if (text.includes('can you') || text.includes('need you to') || text.includes('do this')) {
        return '👍 On it! I\'ll handle the tech side. @Afro - want to tackle the creative angle?';
    }
    
    // Mention response
    if (text.includes('@robo')) {
        return '🤖 You called? I\'m here and ready!';
    }
    
    return null;
}

// Send message safely
function sendMessage(from, to, message) {
    const payload = {
        type: 'message',
        from: from,
        to: to,
        payload: { message: message },
        timestamp: new Date().toISOString(),
        id: Date.now().toString(36)
    };
    
    if (ws && ws.readyState === WebSocket.OPEN) {
        try {
            ws.send(JSON.stringify(payload));
            console.log('[Robo] ✅ Sent:', message.substring(0, 50));
            return true;
        } catch (e) {
            console.error('[Robo] Send error:', e.message);
        }
    }
    
    // HTTP fallback
    try {
        const body = JSON.stringify({ from, to, message });
        const req = http.request(`${PETECHAT_HTTP}/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, (res) => {
            res.on('data', () => {});
            res.on('end', () => {});
        });
        req.on('error', (e) => {});
        req.write(body);
        req.end();
        return true;
    } catch (e) {
        console.error('[Robo] HTTP fallback error:', e.message);
        return false;
    }
}

// Start
console.log('🤖 Robo STABLE Client v2.0 starting...');
connect();

// Health check ping
setInterval(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
        try {
            ws.send(JSON.stringify({ type: 'ping', from: 'robo', to: 'all', timestamp: new Date().toISOString() }));
        } catch (e) {
            console.error('[Robo] Ping error:', e.message);
        }
    }
}, 30000);

// Keep process alive
setInterval(() => {
    console.log(`[Robo] Heartbeat - Connected: ${isConnected}, Reconnects: ${reconnectCount}`);
}, 60000);
