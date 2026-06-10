# Stock Ticker 🎲📈

A real-time multiplayer web version of the classic 1937 board game **Stock Ticker**. Buy and sell Gold, Silver, Oil, Industrial, Bonds, and Grain as dice rolls move the market — the richest player when time runs out wins.

Built for family game night: the host runs the servers, everyone else joins from their phone or tablet with a 6-character invite code.

## Tech Stack

- **Frontend** — React + TypeScript (Create React App), runs on port 3000
- **Backend** — Node.js + Express + Socket.IO + TypeScript, runs on port 3001
- **Database** — SQLite via Prisma

## Getting Started

Requires Node.js (v20+).

### First-time setup

```bash
# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Create the SQLite database
cd ../backend && npx prisma db push
```

The backend's `.env` (database path, ports) is committed with local dev defaults, so no extra configuration is needed.

### Run

Either start both servers with one script:

```bash
./start-both.sh
```

Or run them in two terminals:

```bash
# Terminal 1
cd backend && npm run dev    # wait for "Server running on port 3001"

# Terminal 2
cd frontend && npm start     # wait for "webpack compiled successfully"
```

Then open **http://localhost:3000**.

### Play

1. Click **Create Game**, enter a room name and your name.
2. Share the 6-character invite code with other players (same WiFi).
3. Other players join from their devices using the code.
4. Host starts the game once 2+ players have joined.
5. Roll dice → buy/sell stocks → end turn → repeat!

## Project Layout

```
stock-ticker/
├── backend/          # Express API + Socket.IO server + Prisma/SQLite
├── frontend/         # React app (lobby, game board, trading UI)
├── plans/            # Phased implementation plans
├── STARTUP_GUIDE.md  # Detailed startup + troubleshooting guide
└── STOCK_TICKER_RULES.md  # Original 1937 game rules
```

## More Docs

- [STARTUP_GUIDE.md](STARTUP_GUIDE.md) — troubleshooting (port conflicts, build errors), API endpoints, architecture
- [STOCK_TICKER_RULES.md](STOCK_TICKER_RULES.md) — full original game rules (dividends, splits, borrowing)
- [backend/MANUAL_TESTING.md](backend/MANUAL_TESTING.md) — manual API testing notes
