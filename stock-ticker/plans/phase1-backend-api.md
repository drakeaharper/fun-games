# Phase 1: Core Backend & API (MVP)

## Overview
Build a robust REST API and WebSocket server that powers the Stock Ticker game with real-time multiplayer capabilities. This phase focuses on creating the server-side foundation for family multiplayer gaming across devices.

## Deliverables
- REST API for all game actions
- WebSocket server for real-time updates
- Database schema for persistent game state
- Room-based multiplayer architecture
- Authentication and session management
- Comprehensive API testing suite

## Detailed Tasks

### 1. Project Setup & Architecture
- [ ] Choose backend framework (Node.js/Express vs Rust/Actix-web)
- [ ] Set up project structure (monorepo or separate repos)
- [ ] Configure TypeScript (if Node.js) or Rust project
- [ ] Set up development environment with hot reloading
- [ ] Configure ESLint/Prettier (Node.js) or Clippy (Rust)
- [ ] Set up Git repository with proper .gitignore

### 2. Database Design & Setup
- [ ] Choose database (PostgreSQL recommended for ACID compliance)
- [ ] Design database schema for multiplayer games
- [ ] Set up database connection and ORM (Prisma/TypeORM/Diesel)
- [ ] Create migration system
- [ ] Set up database seeding for development
- [ ] Configure connection pooling

### 3. Core Data Models
```sql
-- Game Rooms
CREATE TABLE rooms (
    id UUID PRIMARY KEY,
    name VARCHAR(255),
    invite_code VARCHAR(10) UNIQUE,
    max_players INTEGER DEFAULT 6,
    created_at TIMESTAMP,
    status VARCHAR(20) -- 'waiting', 'playing', 'finished'
);

-- Players
CREATE TABLE players (
    id UUID PRIMARY KEY,
    room_id UUID REFERENCES rooms(id),
    name VARCHAR(100),
    cash INTEGER DEFAULT 5000,
    connected BOOLEAN DEFAULT true,
    turn_order INTEGER
);

-- Game State
CREATE TABLE game_states (
    room_id UUID PRIMARY KEY REFERENCES rooms(id),
    current_turn INTEGER DEFAULT 0,
    current_player_id UUID,
    phase VARCHAR(20), -- 'rolling', 'trading', 'game_over'
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Stocks
CREATE TABLE stocks (
    room_id UUID REFERENCES rooms(id),
    stock_type VARCHAR(20), -- 'gold', 'silver', etc.
    current_price INTEGER, -- in cents
    PRIMARY KEY (room_id, stock_type)
);

-- Player Portfolios
CREATE TABLE portfolios (
    player_id UUID REFERENCES players(id),
    stock_type VARCHAR(20),
    shares INTEGER DEFAULT 0,
    PRIMARY KEY (player_id, stock_type)
);

-- Transaction History
CREATE TABLE transactions (
    id UUID PRIMARY KEY,
    player_id UUID REFERENCES players(id),
    stock_type VARCHAR(20),
    action VARCHAR(10), -- 'buy', 'sell', 'dividend'
    shares INTEGER,
    price_per_share INTEGER,
    total_amount INTEGER,
    created_at TIMESTAMP
);

-- Dice Rolls
CREATE TABLE dice_rolls (
    id UUID PRIMARY KEY,
    room_id UUID REFERENCES rooms(id),
    player_id UUID REFERENCES players(id),
    stock_die INTEGER,
    action_die INTEGER,
    amount_die INTEGER,
    result_stock VARCHAR(20),
    result_action VARCHAR(20),
    result_amount INTEGER,
    created_at TIMESTAMP
);
```

### 4. Core Game Logic Implementation
- [ ] **Stock Management**:
  - Stock price initialization and updates
  - Stock split logic (at $2.00)
  - Stock reset logic (at $0.00)
  - Dividend calculations
- [ ] **Dice System**:
  - Three-dice rolling with proper randomization
  - Stock selection mapping (1-6 → stock types)
  - Action determination (up/down/dividend)
  - Amount calculation (5¢/10¢/20¢)
- [ ] **Portfolio Management**:
  - Share buying/selling validation
  - Cash management and insufficient funds handling
  - Portfolio value calculations
  - Transaction recording
- [ ] **Game State Management**:
  - Turn progression logic
  - Game phase transitions
  - Win condition detection
  - Game reset functionality

### 5. REST API Endpoints
```typescript
// Room Management
POST   /api/rooms              // Create new game room
GET    /api/rooms/:id          // Get room details
POST   /api/rooms/:id/join     // Join room with invite code
DELETE /api/rooms/:id/leave    // Leave room

// Game Actions  
POST   /api/games/:roomId/roll-dice    // Roll dice (current player only)
POST   /api/games/:roomId/buy-stock    // Buy stocks
POST   /api/games/:roomId/sell-stock   // Sell stocks
POST   /api/games/:roomId/end-turn     // End current turn

// Game State
GET    /api/games/:roomId/state        // Get current game state
GET    /api/games/:roomId/history      // Get transaction history
GET    /api/games/:roomId/stats        // Get game statistics

// Player Management
GET    /api/players/:id/portfolio      // Get player portfolio
GET    /api/players/:id/transactions   // Get player transactions
```

### 6. WebSocket Real-Time Events
- [ ] **Connection Management**:
  - Player connect/disconnect handling
  - Room subscription management
  - Connection recovery logic
- [ ] **Real-Time Events**:
```typescript
// Client → Server Events
'join-room'        // Join game room
'roll-dice'        // Initiate dice roll
'buy-stock'        // Purchase stocks
'sell-stock'       // Sell stocks
'end-turn'         // End player turn

// Server → Client Events
'room-updated'     // Room state changed
'player-joined'    // New player joined
'player-left'      // Player disconnected
'dice-rolled'      // Dice results
'stock-updated'    // Stock price changed
'turn-changed'     // New player's turn
'game-ended'       // Game finished
```

### 7. Authentication & Session Management
- [ ] Simple session-based auth (no passwords for family games)
- [ ] Player name validation and uniqueness per room
- [ ] Session persistence across reconnections
- [ ] Rate limiting for API endpoints
- [ ] Basic CORS configuration

### 8. Game Room Management
- [ ] Room creation with unique invite codes
- [ ] Player capacity management (2-6 players)
- [ ] Room cleanup for abandoned games
- [ ] Spectator mode support
- [ ] Room settings and house rules

### 9. Error Handling & Validation
- [ ] Input validation for all API endpoints
- [ ] Business logic validation (valid moves, sufficient funds)
- [ ] Graceful error responses with meaningful messages
- [ ] Database transaction handling
- [ ] Connection failure recovery

### 10. Testing Infrastructure
- [ ] Unit tests for game logic functions
- [ ] Integration tests for API endpoints
- [ ] WebSocket connection testing
- [ ] Database transaction testing
- [ ] Load testing for concurrent games
- [ ] Mock data generation for testing

### 11. Development Tools
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Database administration interface
- [ ] Development seed data
- [ ] Logging and monitoring setup
- [ ] Environment configuration management

### 12. Deployment Preparation
- [ ] Docker containerization
- [ ] Environment variable configuration
- [ ] Database migration scripts
- [ ] Health check endpoints
- [ ] Deployment documentation

## Technical Specifications

### Game Rules Implementation
- **Starting Conditions**: $5,000 cash, all stocks at $1.00
- **Share Lots**: 500, 1,000, 2,000, 5,000 shares only
- **Dice Mapping**:
  - Stock Die: 1=Gold, 2=Silver, 3=Bonds, 4=Oil, 5=Industrials, 6=Grain
  - Action Die: 1-2=Down, 3-4=Up, 5-6=Dividend
  - Amount Die: 1-2=5¢, 3-4=10¢, 5-6=20¢
- **Special Rules**:
  - Dividends only for stocks ≥ $1.00
  - Stock splits at $2.00 (double shares, reset to $1.00)
  - Stock resets to $1.00 if price hits $0.00

### WebSocket Architecture
```typescript
interface GameRoom {
  id: string;
  players: Map<string, WebSocket>;
  gameState: GameState;
  
  broadcast(event: string, data: any): void;
  notifyPlayer(playerId: string, event: string, data: any): void;
}
```

### API Response Format
```typescript
interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
```

## Testing Strategy
- **Unit Tests**: Individual game logic functions
- **Integration Tests**: API endpoints with database
- **WebSocket Tests**: Real-time event handling
- **Load Tests**: Multiple concurrent games
- **End-to-End Tests**: Complete game flows

## Success Criteria
- [ ] All API endpoints function correctly
- [ ] WebSocket connections stable with real-time updates
- [ ] Database handles concurrent game sessions
- [ ] Game logic matches original Stock Ticker rules
- [ ] >95% test coverage for core game functions
- [ ] API response time <100ms for game actions
- [ ] Supports 10+ concurrent game rooms

## Estimated Effort: 1-2 weeks

## Dependencies for Phase 2
- Working REST API with all game endpoints
- WebSocket server with real-time capabilities
- Database schema and data persistence
- Game logic thoroughly tested
- Room-based multiplayer architecture
- Authentication and session management

## Deployment Considerations
- **Database**: PostgreSQL on Railway/Render/Supabase
- **Backend**: Node.js on Railway/Render or Rust on Fly.io
- **Environment**: Staging and production environments
- **Monitoring**: Basic logging and error tracking
- **Scaling**: Horizontal scaling preparation