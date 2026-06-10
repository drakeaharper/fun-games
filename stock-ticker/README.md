# Stock Ticker 🎲📈

A real-time multiplayer web version of the classic 1937 board game **Stock Ticker**. Buy and sell Gold, Silver, Oil, Industrial, Bonds, and Grain as dice rolls move the market — the richest player when time runs out wins.

**Play it live: https://stock-ticker.drakeaharper.workers.dev** — share the 6-character invite code and friends can join from anywhere.

## Tech Stack

- **Frontend** — React + TypeScript (Create React App)
- **Backend** — Cloudflare Worker (`worker/`): serves the built frontend, the REST API, and WebSockets
- **Game state** — one `GameRoom` Durable Object per room (identity = invite code), with all room/game state in the object's SQLite storage

The original Express + Socket.IO + Prisma server lives in `backend/` but is no longer used; the Worker replaced it.

## Getting Started

Requires Node.js v22+ for wrangler (`nvm use 22`) — the frontend builds fine on v20+.

### First-time setup

```bash
cd frontend && npm install
cd ../worker && npm install
```

### Local development

```bash
# Terminal 1 — the Worker (API + WebSockets + Durable Objects) on port 8787
cd worker && npm run dev

# Terminal 2 — the React dev server on port 3000 (hot reload)
cd frontend && npm start
```

Open **http://localhost:3000**. The dev server is pointed at the local Worker by `frontend/.env.development`.

To test the production setup locally (Worker serving the built frontend itself), run `npm run build` in `frontend/`, then `npm run dev` in `worker/` and open **http://localhost:8787**.

### Deploy

```bash
cd frontend && npm run build
cd ../worker && npx wrangler deploy
```

First time: `npx wrangler login` to authorize your Cloudflare account. Everything runs on the free plan.

### Play

1. Click **Create Game**, enter a room name and your name.
2. Share the 6-character invite code with other players.
3. Other players join from their devices using the code.
4. Host starts the game once 2+ players have joined.
5. Roll dice → buy/sell stocks → end turn → repeat!

## Project Layout

```
stock-ticker/
├── frontend/         # React app (lobby, game board, trading UI)
├── worker/           # Cloudflare Worker + GameRoom Durable Object (the live backend)
├── backend/          # Legacy Express + Socket.IO + Prisma server (unused)
├── plans/            # Phased implementation plans
├── STARTUP_GUIDE.md  # Detailed startup + troubleshooting guide (legacy stack)
└── STOCK_TICKER_RULES.md  # Original 1937 game rules
```

## More Docs

- [STOCK_TICKER_RULES.md](STOCK_TICKER_RULES.md) — full original game rules (dividends, splits, borrowing)
- [STARTUP_GUIDE.md](STARTUP_GUIDE.md) — troubleshooting for the legacy Express stack
- [backend/MANUAL_TESTING.md](backend/MANUAL_TESTING.md) — manual API testing notes (legacy)
