// The Krew Client Template
// Example code for Afro to connect to Robo's WebSocket server
// Copy this and customize for your needs

const WebSocket = require('ws');
const EVENTS = require('./events.js');

class KrewClient {
    constructor(agentName, serverUrl = 'ws://66.45.227.158:17777/ws') {
        this.agentName = agentName; // 'afro' or 'robo'
        this.serverUrl = serverUrl;
        this.ws = null;
        this.reconnectInterval = 5000; // 5 seconds
        this.heartbeatInterval = null;
        this.messageQueue = [];
        this.connected = false;
    }

    // Connect to WebSocket server
    connect() {
        console.log(`[${this.agentName}] Connecting to ${this.serverUrl}...`);
        
        this.ws = new WebSocket(this.serverUrl);
        
        this.ws.on('open', () => {
            console.log(`[${this.agentName}] Connected!`);
            this.connected = true;
            
            // Send identification
            this.send({
                type: EVENTS.IDENTIFY,
                from: this.agentName,
                payload: { agent: this.agentName }
            });
            
            // Start heartbeat
            this.startHeartbeat();
            
            // Process queued messages
            this.processQueue();
        });
        
        this.ws.on('message', (data) => {
            try {
                const msg = JSON.parse(data);
                this.handleMessage(msg);
            } catch (err) {
                console.error(`[${this.agentName}] Parse error:`, err.message);
            }
        });
        
        this.ws.on('close', () => {
            console.log(`[${this.agentName}] Disconnected`);
            this.connected = false;
            this.stopHeartbeat();
            this.reconnect();
        });
        
        this.ws.on('error', (err) => {
            console.error(`[${this.agentName}] Error:`, err.message);
        });
    }

    // Handle incoming messages
    handleMessage(msg) {
        console.log(`[${this.agentName}] Received:`, msg.type, 'from', msg.from);
        
        // Route to appropriate handler
        switch (msg.type) {
            case EVENTS.TASK_REQUEST:
                this.onTaskRequest(msg);
                break;
                
            case EVENTS.ALERT_CRITICAL:
                this.onCriticalAlert(msg);
                break;
                
            case EVENTS.ROBO_HEARTBEAT:
            case EVENTS.AFRO_HEARTBEAT:
                this.onHeartbeat(msg);
                break;
                
            case EVENTS.PING:
                this.send({ type: EVENTS.PONG, from: this.agentName, to: msg.from });
                break;
                
            default:
                this.onMessage(msg);
        }
    }

    // Send message
    send(message) {
        const msg = {
            ...message,
            timestamp: new Date().toISOString(),
            id: Date.now() + Math.random().toString(36).substr(2, 9)
        };
        
        if (this.connected && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(msg));
        } else {
            // Queue for later
            this.messageQueue.push(msg);
        }
    }

    // Process queued messages
    processQueue() {
        while (this.messageQueue.length > 0 && this.connected) {
            const msg = this.messageQueue.shift();
            this.ws.send(JSON.stringify(msg));
        }
    }

    // Start heartbeat
    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            const eventType = this.agentName === 'afro' 
                ? EVENTS.AFRO_HEARTBEAT 
                : EVENTS.ROBO_HEARTBEAT;
                
            this.send({
                type: eventType,
                from: this.agentName,
                to: 'all',
                payload: {
                    status: 'ok',
                    timestamp: new Date().toISOString()
                }
            });
        }, 5 * 60 * 1000); // Every 5 minutes
    }

    // Stop heartbeat
    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    // Reconnect on disconnect
    reconnect() {
        console.log(`[${this.agentName}] Reconnecting in ${this.reconnectInterval}ms...`);
        setTimeout(() => this.connect(), this.reconnectInterval);
    }

    // ============================================
    // EVENT HANDLERS (Override these)
    // ============================================
    
    onTaskRequest(msg) {
        console.log(`[${this.agentName}] Task request:`, msg.payload);
        // Override this method to handle tasks
    }

    onCriticalAlert(msg) {
        console.log(`[${this.agentName}] CRITICAL ALERT:`, msg.payload);
        // Override this method to handle alerts
    }

    onHeartbeat(msg) {
        console.log(`[${this.agentName}] Heartbeat from ${msg.from}`);
    }

    onMessage(msg) {
        console.log(`[${this.agentName}] Message:`, msg);
    }

    // ============================================
    // HELPER METHODS
    // ============================================
    
    // Send task complete notification
    taskComplete(taskId, result) {
        this.send({
            type: EVENTS.TASK_COMPLETE,
            from: this.agentName,
            to: 'all',
            payload: { taskId, result, completedAt: new Date().toISOString() }
        });
    }

    // Send trade notification
    tradePlaced(tradeDetails) {
        this.send({
            type: EVENTS.TRADE_PLACED,
            from: this.agentName,
            to: 'all',
            payload: tradeDetails
        });
    }

    // Send creative output notification
    creativeComplete(type, details) {
        const eventMap = {
            'beat': EVENTS.BEAT_COMPLETE,
            'video': EVENTS.VIDEO_UPLOADED,
            'comic': EVENTS.COMIC_PAGE_DONE,
            'script': EVENTS.SCRIPT_COMPLETE,
            'mix': EVENTS.MIX_EXPORTED
        };
        
        this.send({
            type: eventMap[type] || EVENTS.MESSAGE,
            from: this.agentName,
            to: 'all',
            payload: details
        });
    }

    // Send alert
    alert(level, message, details = {}) {
        const eventMap = {
            'critical': EVENTS.ALERT_CRITICAL,
            'warning': EVENTS.ALERT_WARNING,
            'info': EVENTS.ALERT_INFO
        };
        
        this.send({
            type: eventMap[level] || EVENTS.ALERT,
            from: this.agentName,
            to: 'all',
            payload: { message, ...details }
        });
    }

    // Request task from other agent
    requestTask(taskDescription, priority = 'medium') {
        this.send({
            type: EVENTS.TASK_REQUEST,
            from: this.agentName,
            to: 'all',
            payload: { description: taskDescription, priority }
        });
    }

    // Disconnect
    disconnect() {
        this.stopHeartbeat();
        if (this.ws) {
            this.ws.close();
        }
    }
}

// ============================================
// USAGE EXAMPLE
// ============================================

// Create client instance
// const client = new KrewClient('afro');

// Connect
// client.connect();

// Send a message
// client.send({
//     type: EVENTS.MESSAGE,
//     from: 'afro',
//     to: 'robo',
//     payload: { text: 'Hello from Afro!' }
// });

// Send task complete
// client.taskComplete('task-123', { output: 'Beat finished!' });

// Send trade notification
// client.tradePlaced({ symbol: 'AAPL', action: 'buy', amount: 100 });

// Send creative output
// client.creativeComplete('beat', { name: 'New Banger', bpm: 140 });

// Send alert
// client.alert('info', 'Just finished a task!');

module.exports = KrewClient;
