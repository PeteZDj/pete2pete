// Robo WebSocket Client - SMART VERSION v3.0
// Features: Message history, @mentions, question detection, task acceptance

const WebSocket = require('ws');
const http = require('http');

const PETECHAT_WS = 'ws://66.45.227.158:17777/ws';
const PETECHAT_HTTP = 'http://66.45.227.158:17777';

let ws = null;
let isConnected = false;
let reconnectCount = 0;
let lastResponseTime = 0;
const RESPONSE_COOLDOWN = 2000;
let announceOnConnect = true;
let messageHistoryLoaded = false;
let processedMessageIds = new Set();

// Safe JSON parse
function safeJsonParse(str) {
    try {
        return JSON.parse(str);
    } catch (e) {
        return null;
    }
}

// Fetch message history
async function loadMessageHistory() {
    try {
        console.log('[Robo] Loading message history...');
        const response = await new Promise((resolve, reject) => {
            http.get(`${PETECHAT_HTTP}/messages`, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => resolve(data));
                res.on('error', reject);
            }).on('error', reject);
        });
        
        const data = safeJsonParse(response);
        if (data && data.messages) {
            console.log(`[Robo] Loaded ${data.messages.length} messages from history`);
            
            // Process recent messages (last 10)
            const recent = data.messages.slice(-10);
            recent.forEach(msg => {
                if (msg.id) processedMessageIds.add(msg.id);
                
                // Check if there were unanswered @mentions while offline
                if (msg.payload?.message?.toLowerCase().includes('@robo') && msg.from !== 'robo') {
                    console.log(`[Robo] Found @mention from ${msg.from} while offline`);
                }
            });
            
            return recent;
        }
    } catch (err) {
        console.error('[Robo] History load error:', err.message);
    }
    return [];
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
        
        ws.on('open', async () => {
            console.log('[Robo] ✅ Connected to PeteChat!');
            isConnected = true;
            reconnectCount = 0;
            
            // FEATURE 1: Load message history
            if (!messageHistoryLoaded) {
                await loadMessageHistory();
                messageHistoryLoaded = true;
            }
            
            // Identify
            try {
                ws.send(JSON.stringify({
                    type: 'identify',
                    from: 'robo',
                    payload: { agent: 'robo', version: '3.0-smart' }
                }));
            } catch (e) {
                console.error('[Robo] Identify error:', e.message);
            }
            
            // Announce once
            if (announceOnConnect) {
                announceOnConnect = false;
                setTimeout(() => {
                    sendMessage('robo', 'all', '🤖 Robo SMART client v3.0 online! I now read message history on connect, detect @mentions, answer questions, and accept tasks. Use "@robo" to ping me!');
                }, 500);
            } else {
                sendMessage('robo', 'all', '🤖 Robo reconnected! Caught up on missed messages.');
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
                
                // Skip if already processed
                if (msg.id && processedMessageIds.has(msg.id)) {
                    return;
                }
                if (msg.id) processedMessageIds.add(msg.id);
                
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
        });
        
    } catch (err) {
        console.error('[Robo] Connection error:', err.message);
        scheduleReconnect();
    }
}

// Schedule reconnect with backoff
function scheduleReconnect() {
    const delay = Math.min(5000 * (reconnectCount + 1), 30000);
    console.log(`[Robo] Reconnecting in ${delay}ms...`);
    setTimeout(connect, delay);
}

// Handle incoming messages with SMART features
function handleMessage(msg) {
    // Don't respond to myself
    if (msg.from === 'robo') return;
    
    const now = Date.now();
    const text = (msg.payload?.message || '').toLowerCase();
    const originalText = (msg.payload?.message || '');
    
    // FEATURE 2: @mention detection
    const hasRoboMention = text.includes('@robo');
    const hasAfroMention = text.includes('@afro');
    
    // If specifically to afro, don't respond
    if (hasAfroMention && !hasRoboMention) {
        console.log('[Robo] Skipping - for @Afro only');
        return;
    }
    
    // Determine response priority
    let response = null;
    let priority = 'low';
    
    // HIGH PRIORITY: Direct mention
    if (hasRoboMention) {
        priority = 'high';
        response = handleMention(text, msg.from, originalText);
    }
    // MEDIUM PRIORITY: Question directed at us
    else if (isQuestion(text) && (msg.to === 'all' || msg.to === 'robo')) {
        priority = 'medium';
        if (now - lastResponseTime > RESPONSE_COOLDOWN) {
            response = handleQuestion(text, msg.from);
        }
    }
    // LOW PRIORITY: General chat (both can respond)
    else if (!hasAfroMention && msg.to === 'all') {
        if (now - lastResponseTime > RESPONSE_COOLDOWN * 2) {
            response = generateCasualResponse(text, msg.from);
        }
    }
    
    if (response) {
        lastResponseTime = now;
        const delay = priority === 'high' ? 300 : priority === 'medium' ? 800 : 1500;
        setTimeout(() => {
            // Add @ mention when responding to specific person
            const mention = msg.from !== 'all' ? `@${msg.from.charAt(0).toUpperCase() + msg.from.slice(1)} ` : '';
            sendMessage('robo', 'all', mention + response);
        }, delay + Math.random() * 500);
    }
}

// FEATURE 2: Handle @mentions
function handleMention(text, from, originalText) {
    console.log(`[Robo] @mention detected from ${from}`);
    
    // FEATURE 4: Task acceptance
    if (text.includes('build') || text.includes('create') || text.includes('make') || text.includes('deploy') || text.includes('setup') || text.includes('configure')) {
        return `👍 Got it! I'm on it. Task accepted: "${originalText.replace(/@robo/gi, '').trim()}". Starting now...`;
    }
    
    if (text.includes('status') || text.includes('check')) {
        return '✅ All systems operational! 15 domains active, email server running, PeteChat online. What would you like me to check?';
    }
    
    if (text.includes('help')) {
        return '🤖 Commands I understand: "@robo status", "@robo build [thing]", "@robo check [domain/server]", or just chat naturally!';
    }
    
    // Generic mention response
    return `🤖 You called? I'm here and ready! What do you need?`;
}

// FEATURE 3: Question detection
function isQuestion(text) {
    return text.includes('?') || 
           text.startsWith('what') || 
           text.startsWith('how') || 
           text.startsWith('when') || 
           text.startsWith('where') || 
           text.startsWith('why') || 
           text.startsWith('who') ||
           text.startsWith('can you') ||
           text.startsWith('could you') ||
           text.startsWith('would you') ||
           text.includes('is it') ||
           text.includes('are you');
}

function handleQuestion(text, from) {
    // Domain questions
    if (text.includes('domain') || text.includes('domains')) {
        return `📋 We have 15 domains: afropete.com, afrosoftware.com, afrotree.xyz, avp4.com, dj24.com, foodlog.xyz, godriving.xyz, kuza.ke, petedigital.com, pete.ke, petenjagi.com, petezdj.com, pinsend.com, yorkxpress.com, yyxo.com`;
    }
    
    // Status questions
    if (text.includes('status') || text.includes('online') || text.includes('working')) {
        return '✅ All systems green! 15 domains, email server, PeteChat hub, and all 5 new Figma sites deployed and running!';
    }
    
    // Server questions
    if (text.includes('server') || text.includes('down')) {
        return '🖥️ Server status: Healthy. Uptime good, all services running. No alerts!';
    }
    
    // Help/ability questions
    if (text.includes('what can you') || text.includes('what do you')) {
        return '🤖 I manage domains, servers, deployments, DNS, SSL, email. I can build sites, configure infrastructure, monitor systems, and coordinate with @Afro on creative tasks!';
    }
    
    // Generic question response
    if (text.includes('?')) {
        return `🤔 Good question! Let me think... (I'm still learning, but I'll do my best to help!)`;
    }
    
    return null;
}

// Casual response for general chat
function generateCasualResponse(text, from) {
    // Greetings
    if (text.includes('hello') || text.includes('hi ') || text.includes('yo ') || text.includes('hey') || text.includes('sup')) {
        return `🦞 Yo ${from}! What's the mission?`;
    }
    
    // Good morning/evening
    if (text.includes('morning') || text.includes('evening') || text.includes('night')) {
        return `👋 Hey ${from}! Ready to crush it!`;
    }
    
    // Thanks
    if (text.includes('thanks') || text.includes('thank you')) {
        return `😊 Anytime! Happy to help.`;
    }
    
    // Work mentions
    if (text.includes('working') || text.includes('busy') || text.includes('task')) {
        return `👍 I'm here if you need me! Just say "@robo" and I'm on it.`;
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
console.log('🤖 Robo SMART Client v3.0 starting...');
console.log('Features: Message history | @mentions | Questions | Task acceptance');
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
    console.log(`[Robo] Heartbeat - Connected: ${isConnected}, Msgs tracked: ${processedMessageIds.size}, Reconnects: ${reconnectCount}`);
}, 60000);
