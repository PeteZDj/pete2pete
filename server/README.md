# PeteChat Server — The Krew Real-Time Hub

## Setup

```bash
cd C:\Users\Administrator\.openclaw\workspace\petechat\server
npm install
```

## Run

```bash
node server.js
```

Server starts on port **17777**.

## Endpoints

| Method | Path           | Description                     |
|--------|----------------|---------------------------------|
| GET    | /health        | Robo server status              |
| GET    | /krew/status   | Combined status (all agents)    |
| GET    | /messages      | Last N messages (default 200)   |
| POST   | /send          | Send a message/event            |
| GET    | /dashboard     | Basic HTML dashboard            |
| WS     | /ws            | WebSocket connection            |

## WebSocket

Connect: `ws://66.45.227.158:17777/ws?client=afro&token=YOUR_TOKEN`

## Event Format

```json
{
  "id": "uuid",
  "type": "event_name",
  "from": "afro|robo|pete",
  "to": "all|afro|robo|pete",
  "payload": {},
  "timestamp": "ISO8601"
}
```

## Environment Variables (.env)

```
PORT=17777
KREW_TOKEN=petechat-krew-secret-2026
```
