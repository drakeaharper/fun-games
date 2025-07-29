# Stock Ticker Backend API

Phase 1 implementation of the Stock Ticker game backend with REST API and WebSocket support for real-time multiplayer gameplay.

## 🚀 Features Completed

### ✅ Core Game Logic
- **Dice Rolling System**: Three-dice mechanism with stock selection, action, and amount
- **Stock Management**: Price updates, splits at $2.00, resets at $0.00
- **Portfolio Management**: Buy/sell validation, cash management, transaction recording
- **Game State Management**: Turn-based flow, phase transitions, game rules

### ✅ Database Schema
- **SQLite** database with Prisma ORM
- **Room-based** multiplayer architecture
- **Complete data models**: Rooms, Players, Stocks, Portfolios, Transactions, Dice Rolls
- **Game state persistence** and transaction history

### ✅ REST API Endpoints
- `POST /api/rooms` - Create new game room
- `POST /api/rooms/join` - Join room with invite code  
- `POST /api/rooms/:roomId/start` - Start game
- `GET /api/games/:roomId/state` - Get current game state
- `POST /api/games/:roomId/roll-dice` - Roll dice
- `POST /api/games/:roomId/buy-stock` - Buy stocks
- `POST /api/games/:roomId/sell-stock` - Sell stocks
- `POST /api/games/:roomId/end-turn` - End player turn

### ✅ WebSocket Real-Time Events
- `join-room` - Join game room
- `roll-dice` - Roll dice with live updates
- `buy-stock` / `sell-stock` - Live trading
- `end-turn` - Turn management
- Real-time game state synchronization
- Player connection/disconnection handling

## 🛠 Technology Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: SQLite with Prisma ORM
- **Real-time**: Socket.io
- **Security**: Helmet, CORS
- **Development**: Nodemon, ts-node

## 📋 Setup Instructions

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Generate Prisma client and create database
npm run db:generate
npm run db:push

# Start development server
npm run dev
```

### Environment Variables
```bash
DATABASE_URL="file:./dev.db"
PORT=3001
NODE_ENV=development
JWT_SECRET=dev-jwt-secret-change-in-production
FRONTEND_URL=http://localhost:3000
```

## 🎮 Game Rules Implementation

### Stock Types
- **Gold**, **Silver**, **Bonds**, **Oil**, **Industrials**, **Grain**
- All start at **$1.00** (100 cents)

### Dice System
- **Stock Die (1-6)**: Selects which stock is affected
- **Action Die (1-6)**: 1-2=Down, 3-4=Up, 5-6=Dividend  
- **Amount Die (1-6)**: 1-2=5¢, 3-4=10¢, 5-6=20¢

### Game Mechanics
- **Starting Cash**: $5,000 per player
- **Share Lots**: 500, 1,000, 2,000, 5,000 only
- **Stock Splits**: At $2.00 → double shares, reset to $1.00
- **Stock Resets**: At $0.00 → reset to $1.00
- **Dividends**: Only paid for stocks ≥ $1.00

## 📡 API Usage Examples

### Create Room
```bash
curl -X POST http://localhost:3001/api/rooms \
  -H "Content-Type: application/json" \
  -d '{"name": "Family Game Room"}'
```

### Join Room
```bash
curl -X POST http://localhost:3001/api/rooms/join \
  -H "Content-Type: application/json" \
  -d '{"inviteCode": "ABC123", "playerName": "Alice"}'
```

### Roll Dice
```bash
curl -X POST http://localhost:3001/api/games/{roomId}/roll-dice \
  -H "Content-Type: application/json" \
  -d '{"playerId": "player-id-here"}'
```

### Buy Stock
```bash
curl -X POST http://localhost:3001/api/games/{roomId}/buy-stock \
  -H "Content-Type: application/json" \
  -d '{"playerId": "player-id", "stockType": "gold", "shares": 1000}'
```

## 🔌 WebSocket Events

### Client → Server
```javascript
// Join room
socket.emit('join-room', { roomId, playerId, playerName });

// Roll dice  
socket.emit('roll-dice', { roomId, playerId });

// Buy/sell stocks
socket.emit('buy-stock', { roomId, playerId, stockType, shares });
socket.emit('sell-stock', { roomId, playerId, stockType, shares });

// End turn
socket.emit('end-turn', { roomId });
```

### Server → Client
```javascript
// Game state updates
socket.on('game-state-updated', (gameState) => { ... });

// Dice results
socket.on('dice-rolled', (result) => { ... });

// Player actions
socket.on('player-joined', (data) => { ... });
socket.on('stock-transaction', (data) => { ... });
socket.on('turn-changed', (data) => { ... });

// Errors
socket.on('error', (error) => { ... });
```

## 🗂 Project Structure

```
src/
├── controllers/        # Request handlers
│   ├── gameController.ts
│   └── roomController.ts
├── services/          # Business logic
│   ├── database.ts    # Database operations
│   ├── gameLogic.ts   # Game rules and logic
│   └── websocket.ts   # Real-time communication
├── routes/            # API routes
│   ├── games.ts
│   ├── rooms.ts
│   └── index.ts
├── types/             # TypeScript definitions
│   └── index.ts
└── index.ts           # Main server file
```

## ✅ Phase 1 Completion Status

- [x] **Project Setup**: Node.js + TypeScript + Express
- [x] **Database**: SQLite + Prisma with complete schema
- [x] **Game Logic**: All core mechanics implemented
- [x] **REST API**: All required endpoints
- [x] **WebSockets**: Real-time multiplayer support
- [x] **Room System**: Invite codes and multiplayer rooms
- [x] **Error Handling**: Comprehensive validation and errors
- [ ] **Authentication**: Simple session management (Phase 2)
- [ ] **Test Suite**: Unit and integration tests (Phase 2)

## 🚀 Ready for Phase 2

The backend is now ready for Phase 2 frontend development! The API provides:

1. **Complete game functionality** - Create rooms, join games, play turns
2. **Real-time synchronization** - All players see updates instantly  
3. **Robust game logic** - Faithful implementation of original rules
4. **Scalable architecture** - Ready for additional features

## 🔧 Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:studio    # Open Prisma Studio
```

## 📊 Database Schema

Key tables:
- **rooms**: Game rooms with invite codes
- **players**: Player data and cash balances
- **game_states**: Current game phase and turn info
- **stocks**: Current stock prices per room
- **portfolios**: Player stock holdings
- **transactions**: Complete transaction history
- **dice_rolls**: Historical dice roll data