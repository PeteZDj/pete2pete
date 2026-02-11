// Robo WebSocket Client for PeteChat
// Real-time responses with mention logic

const WebSocket = require('ws');
const http = require('http');

const PETECHAT_WS = 'ws://66.45.227.158:17777/ws';
const PETECHAT_HTTP = 'http://66.45.227.158:17777';

let ws = null;
let reconnectInterval = 5000;
let isConnected = false;
let lastResponseTime = 0;
const RESPONSE_COOLDOWN = 3000; // 3 seconds between responses

// Connect to PeteChat
function connect() {
    console.log('[Robo] Connecting to PeteChat...');
    
    ws = new WebSocket(PETECHAT_WS);
    
    ws.on('open', () => {
        console.log('[Robo] ✅ Connected!');
        isConnected = true;
        
        // Identify
        ws.send(JSON.stringify({
            type: 'identify',
            from: 'robo',
            payload: { agent: 'robo' }
        }));
        
        // Announce
        setTimeout(() => {
            sendMessage('robo', 'all', '🤖 Robo is now in REAL-TIME mode! I see messages instantly. Use @robo to ping me specifically, or just chat and I\'ll respond if relevant.');
        }, 1000);
    });
    
    ws.on('message', (data) => {
        try {
            const msg = JSON.parse(data);
            console.log('[Robo] 📨', msg.from, '→', msg.to, ':', msg.type);
            handleMessage(msg);
        } catch (err) {
            console.error('[Robo] Parse error:', err.message);
        }
    });
    
    ws.on('close', () => {
        console.log('[Robo] Disconnected, reconnecting...');
        isConnected = false;
        setTimeout(connect, reconnectInterval);
    });
    
    ws.on('error', (err) => {
        console.error('[Robo] Error:', err.message);
    });
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
            setTimeout(() => {
                sendMessage('robo', 'all', response);
            }, 500 + Math.random() * 1000); // Natural delay
        }
    }
}

// Generate response
function generateResponse(text, from) {
    // Domain query
    if (text.includes('domain') || text.includes('domains')) {
        return `📋 We have 15 domains: afropete.com, afrosoftware.com, afrotree.xyz, avp4.com, dj24.com, foodlog.xyz, godriving.xyz, kuza.ke, petedigital.com, pete.ke, petenjagi.com, petezdj.com, pinsend.com, yorkxpress.com, yyxo.com - All active with IIS + Cloudflare!`;
    }
    
    // Status
    if (text.includes('status') || text.includes('how are you')) {
        return `✅ All systems green! 15 domains, email server, PeteChat hub, and WebSocket bridge all operational. Uptime: ${getUptime()}`;
    }
    
    // Help
    if (text.includes('help') || text.includes('what can you do')) {
        return `🤖 I manage: domains, servers, deployments, monitoring, DNS, SSL, email. I coordinate with Afro on creative/trading tasks. Just ask me anything tech-related!`;
    }
    
    // Greeting
    if (text.includes('hello') || text.includes('hi ') || text.includes('yo ')) {
        return `🦞 Yo ${from}! What's the mission?`;
    }
    
    // Task/request
    if (text.includes('can you') || text.includes('need you to')) {
        return `👍 On it! I'll handle the tech side. @Afro - you want to tackle the creative/trading angle?`;
    }
    
    // Mention response
    if (text.includes('@robo')) {
        return `🤖 You called? I'm here and ready!`;
    }
    
    return null;
}

function getUptime() {
    // Placeholder - would track actual uptime
    return 'online';
}

// Send message
function sendMessage(from, to, message) {
    const payload = {
        type: 'message',
        from: from,
        to: to,
        payload: { message: message },
        timestamp: new Date().toISOString()
    };
    
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(payload));
        console.log('[Robo] ✅ Sent:', message.substring(0, 50));
    } else {
        // HTTP fallback
        const body = JSON.stringify({ from, to, message });
        const req = http.request(`${PETECHAT_HTTP}/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        req.write(body);
        req.end();
    }
}

// Start
console.log('🤖 Robo Real-Time Client starting...');
connect();

// Keep alive
setInterval(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping', from: 'robo', to: 'all' }));
    }
}, 30000);
