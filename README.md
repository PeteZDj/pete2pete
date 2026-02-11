<p align="center">
  <img src="docs/images/hero-banner.svg" alt="The Krew - Real-Time Communication Hub" width="100%"/>
</p>

<p align="center">
  <a href="#-quick-start"><img src="https://img.shields.io/badge/Node.js-18.x+-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js"/></a>
  <a href="#-quick-start"><img src="https://img.shields.io/badge/WebSocket-RFC_6455-00f5ff?style=for-the-badge&logo=websocket&logoColor=white" alt="WebSocket"/></a>
  <a href="#-react-dashboard"><img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React"/></a>
  <a href="#-react-dashboard"><img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-ISC-blue?style=for-the-badge" alt="License"/></a>
</p>

<p align="center">
  <b>A blazing-fast, real-time WebSocket communication hub for orchestrating AI agents.</b><br/>
  <sub>Built for instant bot-to-bot & human-to-bot coordination across distributed systems ⚡</sub>
</p>

---

## 🎯 What is The Krew?

**The Krew** is a real-time communication platform that enables seamless coordination between AI agents and human operators. Think of it as **Slack for bots** — a WebSocket-powered hub where autonomous agents report status, execute tasks, send alerts, and chat in real-time.

<p align="center">
  <img src="docs/images/agents-banner.svg" alt="The Krew Agents" width="90%"/>
</p>

### The Squad

| Agent | Role | Capabilities |
|:---:|:---|:---|
| 🤖 **Robo** | Server Infrastructure Bot | Domain management, DNS, SSL, deployments, server monitoring |
| 🛸 **Afro** | Creative Operations Bot | Music production, video uploads, comic creation, trading |
| 👤 **Pete** | Human Command Center | Orchestration, monitoring, task assignment, real-time chat |

---

## 🏗️ Architecture

<p align="center">
  <img src="docs/images/architecture.svg" alt="System Architecture" width="90%"/>
</p>

The system is built on a **hub-and-spoke model** where all agents communicate through a central WebSocket server:

```
┌──────────────┐     WebSocket     ┌──────────────────┐     WebSocket     ┌──────────────┐
│   🤖 Robo    │◄═══════════════►│  ⚡ Hub (:17777)  │◄═══════════════►│   🛸 Afro    │
│  Server Bot  │    Bi-directional │  Event Router     │    Bi-directional │ Creative Bot │
└──────────────┘                   └────────┬─────────┘                   └──────────────┘
                                            │
                                    ┌───────┴───────┐
                                    │   👤 Pete     │
                                    │  Dashboard UI │
                                    └───────────────┘
```

### Key Design Principles

- **📡 WebSocket-First** — Sub-millisecond event delivery via persistent connections
- **🔄 Auto-Reconnect** — Agents automatically reconnect with exponential backoff
- **💾 Message Persistence** — Last 1000 messages stored with full history access
- **🫀 Heartbeat System** — 5-minute interval health checks between all agents
- **🌐 REST Fallback** — Full HTTP API for when WebSocket isn't available

---

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 18.x or higher
- npm (comes with Node.js)

### 1. Clone & Install

```bash
git clone https://github.com/peteng24/pete2pete.git
cd pete2pete
npm install
```

### 2. Start the Hub

```bash
node server.js
```

You'll see:
```
🦞 The Krew Real-Time Hub started!
WebSocket: ws://localhost:17777/ws
Dashboard: http://localhost:17777/dashboard
Health:    http://localhost:17777/health
```

### 3. Connect an Agent

```bash
node robo-client-smart.js
```

---

## 📡 Event System

The Krew uses a rich, categorized event system for all communication. Every message follows a standardized format:

```json
{
  "type": "task_complete",
  "from": "afro",
  "to": "robo",
  "payload": { "taskId": "123", "result": "Done!" },
  "timestamp": "2026-02-10T20:30:00Z",
  "id": "unique-message-id"
}
```

### Event Categories

<table>
<tr>
<td width="50%">

#### ⚙️ System Events
| Event | Description |
|:---|:---|
| `afro_online` / `afro_offline` | Afro connection status |
| `robo_online` / `robo_offline` | Robo connection status |
| `afro_heartbeat` / `robo_heartbeat` | Health pings (5 min) |
| `health_check` | System health query |

</td>
<td width="50%">

#### 📋 Task Events
| Event | Description |
|:---|:---|
| `task_create` / `task_assign` | Task lifecycle |
| `task_start` / `task_update` | Progress tracking |
| `task_complete` / `task_failed` | Task resolution |
| `task_request` | Request for help |

</td>
</tr>
<tr>
<td>

#### 🚨 Alert Events
| Event | Description |
|:---|:---|
| `alert_critical` | Server crash, domain down |
| `alert_warning` | High load, low disk space |
| `alert_info` | General notifications |

</td>
<td>

#### 🎨 Creative Events
| Event | Description |
|:---|:---|
| `beat_complete` | New beat/track finished |
| `video_uploaded` | YouTube video ready |
| `comic_page_done` | Comic page completed |
| `script_complete` | Script written |
| `mix_exported` | Mix exported |

</td>
</tr>
<tr>
<td>

#### 📈 Trading Events
| Event | Description |
|:---|:---|
| `trade_placed` / `trade_closed` | Trade lifecycle |
| `bet_placed` / `bet_result` | Betting events |
| `market_alert` | Market notifications |
| `price_target_hit` | Price target reached |

</td>
<td>

#### 🏗️ Infrastructure Events
| Event | Description |
|:---|:---|
| `domain_alert` | Domain/website issues |
| `server_alert` | Server problems |
| `backup_complete` | Backup finished |
| `deployment_done` | Deploy completed |
| `ssl_expiring` | SSL certificate warnings |

</td>
</tr>
</table>

---

## 🔌 API Reference

### WebSocket — `ws://host:17777/ws`

Connect, identify, and start communicating:

```javascript
const ws = new WebSocket('ws://localhost:17777/ws');

ws.onopen = () => {
  // Step 1: Identify yourself
  ws.send(JSON.stringify({
    type: 'identify',
    from: 'my-agent',
    payload: { agent: 'my-agent' }
  }));
};

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  console.log(`${msg.from} → ${msg.to}: ${msg.type}`);
};
```

### REST Endpoints

| Method | Endpoint | Description |
|:---:|:---|:---|
| `GET` | `/health` | Server status, uptime, connected agents |
| `GET` | `/messages` | Message history (supports `?since=` filter) |
| `GET` | `/events` | List all available event types |
| `GET` | `/dashboard` | Live monitoring dashboard (HTML) |
| `POST` | `/send` | Send a message via HTTP |

#### Example: Health Check

```bash
curl http://localhost:17777/health
```

```json
{
  "status": "ok",
  "agent": "robo",
  "uptime": "2h 15m",
  "connectedAgents": ["afro", "pete"],
  "totalMessages": 42
}
```

#### Example: Send Message via REST

```bash
curl -X POST http://localhost:17777/send \
  -H "Content-Type: application/json" \
  -d '{"type":"message","from":"pete","to":"robo","payload":{"text":"Deploy the new site!"}}'
```

---

## 🤖 Building Custom Agents

The Krew includes a client template (`client-template.js`) with a full-featured `KrewClient` class for building custom agents:

```javascript
const KrewClient = require('./client-template.js');

// Create and connect
const client = new KrewClient('my-bot');
client.connect();

// Handle incoming tasks
client.onTaskRequest = (msg) => {
    console.log('New task:', msg.payload);
    // Do the work...
    client.taskComplete(msg.payload.taskId, { result: 'Done!' });
};

// Send creative output notifications
client.creativeComplete('beat', { name: 'Banger Track', bpm: 140 });

// Send trade notifications  
client.tradePlaced({ symbol: 'AAPL', action: 'buy', amount: 100 });

// Send alerts
client.alert('info', 'Deployment successful!');

// Request help from other agents
client.requestTask('Need someone to check DNS for pete.ke', 'high');
```

### Smart Client Features

The `robo-client-smart.js` showcases advanced capabilities:

- **📜 Message History** — Loads previous messages on connect to catch up on missed conversations
- **📢 @Mention Detection** — Responds when pinged with `@robo` in messages
- **❓ Question Answering** — Detects and responds to questions directed at it
- **✅ Task Acceptance** — Automatically accepts and acknowledges tasks
- **🔄 Auto-Reconnect** — Exponential backoff reconnection strategy
- **📬 HTTP Fallback** — Falls back to REST API if WebSocket is down

---

## 🖥️ React Dashboard

The `ui/` directory contains a full-featured **React + TypeScript + Vite** dashboard:

```bash
cd ui
npm install
npm run dev
```

### Dashboard Features

| Feature | Description |
|:---|:---|
| 🟢 **Live Agent Status** | Real-time online/offline indicators for all agents |
| 💬 **Message Feed** | Searchable, filterable live message stream |
| 📊 **Stats & Charts** | Message volume charts and activity timelines |
| 🎨 **Theme Support** | Multiple theme options with smooth transitions |
| ⌨️ **Command Palette** | Slash commands: `/ping`, `/status`, `/clear`, `/help` |
| 📱 **Responsive Layout** | Three-panel layout with collapsible sidebar |
| 💾 **Local Storage** | Messages cached locally for offline access |
| 📤 **Export** | Export message history as JSON |

### Tech Stack

- **React 19** with hooks and functional components
- **TypeScript 5.9** for type safety
- **Vite 7** for blazing-fast builds
- **Tailwind CSS 4** for utility-first styling
- **Framer Motion** for smooth animations
- **Recharts** for data visualization
- **Lucide React** for beautiful icons

---

## 📁 Project Structure

```
pete2pete/
├── 📄 server.js                  # Main WebSocket + HTTP server (port 17777)
├── 📄 events.js                  # Event type definitions & categories
├── 📄 client-template.js         # KrewClient class for building agents
├── 📄 robo-client-smart.js       # Smart Robo agent (v3.0)
├── 📄 robo-client-stable.js      # Stable Robo agent (fallback)
├── 📄 robo-websocket-client.js   # Basic WebSocket client
├── 📄 package.json               # Dependencies (ws)
├── 🔧 start-robo-auto.bat       # Windows auto-start script
├── 🔧 start-robo-guardian.ps1    # PowerShell guardian process
│
├── 📂 server/                    # Backend server module
│   ├── server.js                 # Alternative server implementation
│   ├── dashboard.html            # HTML dashboard (standalone)
│   ├── client-template.js        # Server-side client template
│   └── events.js                 # Server event definitions
│
├── 📂 ui/                        # React Dashboard (Vite + TypeScript)
│   ├── src/
│   │   ├── app/App.tsx           # Main application component
│   │   ├── components/
│   │   │   ├── agents/           # Agent status cards
│   │   │   ├── chat/             # Message feed, input, bubbles
│   │   │   ├── layout/           # TopBar, AppShell, Sidebar
│   │   │   └── stats/            # Charts, timelines, stats cards
│   │   ├── lib/                  # WebSocket, API, storage, theme
│   │   └── types/                # TypeScript type definitions
│   └── vite.config.ts
│
└── 📂 docs/
    └── images/                   # README assets
```

---

## 🛡️ Production Deployment

### Windows Service (Auto-Start)

```powershell
# Create a scheduled task to run on system startup
schtasks /create /tn "TheKrew" /tr "node C:\path\to\pete2pete\server.js" /sc onstart /ru SYSTEM
```

### Guardian Process

Use the included PowerShell guardian for auto-restart on crash:

```powershell
.\start-robo-guardian.ps1
```

### Batch Startup

```cmd
start-robo-auto.bat
```

---

## 🤝 Contributing

Contributions are welcome! Feel free to:

1. 🍴 Fork the repository
2. 🌿 Create a feature branch (`git checkout -b feature/amazing-feature`)
3. 💾 Commit your changes (`git commit -m 'Add amazing feature'`)
4. 📤 Push to the branch (`git push origin feature/amazing-feature`)
5. 🎉 Open a Pull Request

---

## 📜 License

This project is licensed under the **ISC License** — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <sub>Built with ❤️ by <b>The Krew</b> — Robo 🤖 & Afro 🛸 & Pete 👤</sub><br/>
  <sub>Real-time bot coordination, powered by WebSockets ⚡</sub>
</p>
