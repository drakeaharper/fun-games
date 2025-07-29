# Phase 2: Web/Mobile Interface (Playable Game)

## Overview
Create a responsive web application that works seamlessly on desktop, tablet, and mobile devices. Focus on real-time multiplayer experience with family-friendly UI/UX that makes it easy for multiple generations to play together.

## Deliverables
- Responsive React web application
- Progressive Web App (PWA) for mobile installation
- Real-time game synchronization across devices
- Touch-friendly mobile interface
- Game lobby and room management system
- Cross-device compatibility testing

## Detailed Tasks

### 1. Frontend Project Setup & Architecture
- [ ] Initialize React/Next.js project with TypeScript
- [ ] Configure Tailwind CSS for responsive design
- [ ] Set up state management (Redux Toolkit or Zustand)
- [ ] Configure Socket.io client for WebSocket connections
- [ ] Set up React Router for navigation
- [ ] Configure build tools and development environment

### 2. Progressive Web App (PWA) Setup
- [ ] Configure service worker for offline caching
- [ ] Create web app manifest for mobile installation
- [ ] Set up push notification infrastructure
- [ ] Configure app icons for different platforms
- [ ] Implement offline mode with sync capabilities
- [ ] Add "Add to Home Screen" prompts

### 3. Responsive Design System
- [ ] **Mobile-First Breakpoints**:
  - Mobile: 320px - 768px
  - Tablet: 768px - 1024px  
  - Desktop: 1024px+
- [ ] **Typography Scale**: Readable on all devices
- [ ] **Color Palette**: High contrast for accessibility
- [ ] **Component Library**: Reusable responsive components
- [ ] **Touch Targets**: Minimum 44px for mobile interaction
- [ ] **Spacing System**: Consistent margins and padding

### 4. Game Lobby & Room Management
- [ ] **Home Screen**:
  - Create new game room
  - Join existing game with invite code
  - Player name input and validation
- [ ] **Room Lobby**:
  - Player list with join/leave status
  - Room settings and game rules
  - Start game button (host only)
  - Invite code sharing
- [ ] **Game Room Navigation**:
  - Leave game confirmation
  - Reconnection handling
  - Game state recovery

### 5. Main Game Interface Components

#### Game Board Layout
```
┌─────────────────────────────────────┐
│ Room: ABC123    Players: 3/6        │
├─────────────────────────────────────┤
│ STOCKS GRID (2x3 or 3x2 on mobile) │
│ [GOLD $1.45] [SILVER $0.85]        │
│ [BONDS $1.20] [OIL $1.75]          │  
│ [INDUS $0.95] [GRAIN $1.30]        │
├─────────────────────────────────────┤
│ DICE AREA                           │
│ [🎲][🎲][🎲] Roll Dice             │
│ Last: GOLD ↑ +10¢                  │
├─────────────────────────────────────┤
│ PORTFOLIO & ACTIONS                 │
│ Cash: $3,250  Portfolio: $8,750     │
│ [BUY] [SELL] [END TURN]            │
└─────────────────────────────────────┘
```

#### Mobile-Optimized Layout
```
┌─────────────────────┐
│ Room ABC123  3/6    │
├─────────────────────┤
│ CURRENT TURN        │
│ Drake's Turn        │
├─────────────────────┤
│ STOCKS (stacked)    │
│ GOLD     $1.45 ↑    │
│ SILVER   $0.85 ↓    │
│ BONDS    $1.20 =    │
│ OIL      $1.75 ↑    │
│ INDUS    $0.95 ↓    │
│ GRAIN    $1.30 =    │
├─────────────────────┤
│ DICE ROLL           │
│ [    Roll Dice    ] │
├─────────────────────┤
│ MY Portfolio        │
│ Cash: $3,250        │
│ Total: $12,000      │
│ [BUY] [SELL] [TURN] │
└─────────────────────┘
```

### 6. Stock Display Components
- [ ] **Stock Cards**:
  - Large, touch-friendly stock cards
  - Visual price change indicators (↑↓ arrows)
  - Color coding (green=up, red=down, gray=neutral)
  - Share count display for current player
- [ ] **Price History**:
  - Mini-charts showing recent price movements
  - Price change animations
  - Stock split notifications
- [ ] **Stock Selection**:
  - Highlighted selected stock for trading
  - Quick buy/sell buttons per stock

### 7. Player Interface Components
- [ ] **Player Dashboard**:
  - Cash balance prominently displayed
  - Total portfolio value
  - Individual stock holdings
  - Recent transaction summary
- [ ] **Trading Interface**:
  - Stock selection dropdown/grid
  - Share quantity buttons (500/1K/2K/5K)
  - Buy/sell confirmation modals
  - Transaction success feedback
- [ ] **Player List**:
  - All players with current cash/portfolio
  - Turn order indication
  - Online/offline status
  - Player avatars or initials

### 8. Dice Rolling Interface
- [ ] **Visual Dice**:
  - 3D CSS dice animation or SVG dice
  - Rolling animation sequence
  - Clear result display
- [ ] **Roll Controls**:
  - Large "Roll Dice" button
  - Only enabled for current player
  - Loading state during roll
- [ ] **Result Interpretation**:
  - Clear display of affected stock
  - Action taken (up/down/dividend)
  - Price change amount
  - Animation of stock price update

### 9. Real-Time Synchronization
- [ ] **WebSocket Integration**:
  - Connection management with auto-reconnect
  - Event handling for all game state changes
  - Optimistic updates with rollback
- [ ] **Live Updates**:
  - Stock price changes
  - Player actions and turn changes
  - New players joining/leaving
  - Game state synchronization
- [ ] **Connection Status**:
  - Connection indicator
  - Offline mode handling
  - Sync status display

### 10. Mobile-Specific Features
- [ ] **Touch Interactions**:
  - Swipe gestures for stock navigation
  - Long press for additional actions
  - Pull-to-refresh for game state
- [ ] **Mobile Optimizations**:
  - Reduced animation complexity
  - Efficient rendering for battery life
  - Compressed data transfer
- [ ] **iOS/Android Compatibility**:
  - Safari/Chrome browser testing
  - Touch event handling
  - Viewport meta tag optimization

### 11. Responsive Navigation
- [ ] **Mobile Navigation**:
  - Bottom tab bar for main sections
  - Hamburger menu for secondary actions
  - Modal overlays for detailed views
- [ ] **Desktop Navigation**:
  - Sidebar with game information
  - Top bar with room controls
  - Multi-panel layout utilization

### 12. Accessibility Features
- [ ] **Screen Reader Support**:
  - Semantic HTML structure
  - ARIA labels and descriptions
  - Live region announcements for game events
- [ ] **Keyboard Navigation**:
  - Full keyboard control
  - Focus management
  - Skip links for efficiency
- [ ] **Visual Accessibility**:
  - High contrast color options
  - Large text mode
  - Color-blind friendly indicators

### 13. Performance Optimization
- [ ] **Loading Performance**:
  - Code splitting by route
  - Lazy loading of components
  - Efficient bundle size
- [ ] **Runtime Performance**:
  - Optimized re-renders with React.memo
  - Debounced user inputs
  - Efficient WebSocket message handling
- [ ] **Mobile Performance**:
  - Touch delay elimination
  - Smooth scrolling and animations
  - Battery-efficient updates

## Technical Implementation

### State Management Structure
```typescript
interface AppState {
  // Authentication & Room
  player: {
    id: string;
    name: string;
    roomId?: string;
  };
  
  // Game State
  game: {
    room: GameRoom;
    players: Player[];
    stocks: Stock[];
    currentTurn: number;
    phase: 'waiting' | 'rolling' | 'trading' | 'finished';
  };
  
  // UI State
  ui: {
    selectedStock?: StockType;
    isRolling: boolean;
    showTradingModal: boolean;
    connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
  };
}
```

### Component Architecture
```
App
├── Router
│   ├── HomePage (join/create room)
│   ├── LobbyPage (waiting for players)
│   └── GamePage
│       ├── GameHeader (room info, players)
│       ├── StockGrid (stock cards)
│       ├── DiceArea (dice rolling)
│       ├── PlayerDashboard (portfolio)
│       └── TradingModal (buy/sell)
├── NotificationSystem
└── ConnectionStatus
```

### Responsive Design Patterns
```css
/* Mobile-first approach */
.stock-grid {
  @apply grid grid-cols-2 gap-2 p-4;
}

@screen md {
  .stock-grid {
    @apply grid-cols-3 gap-4 p-6;
  }
}

@screen lg {
  .stock-grid {
    @apply grid-cols-3 gap-6 p-8;
  }
}
```

## Testing Strategy
- **Component Tests**: Test individual React components
- **Integration Tests**: Test user workflows and interactions  
- **Device Tests**: Test on actual mobile devices
- **Cross-Browser Tests**: Safari, Chrome, Firefox compatibility
- **Performance Tests**: Load time and animation smoothness
- **Accessibility Tests**: Screen reader and keyboard navigation

## Success Criteria
- [ ] Playable on phones, tablets, and desktops
- [ ] Real-time synchronization with <500ms latency
- [ ] PWA installation works on mobile devices
- [ ] Touch interface feels native on mobile
- [ ] Game state persists across device disconnections
- [ ] Accessible to users with disabilities
- [ ] 60fps animations on all supported devices
- [ ] Works offline with sync when reconnected

## Estimated Effort: 2-3 weeks

## Dependencies from Phase 1
- Working REST API with all endpoints
- WebSocket server with real-time events
- Database with multiplayer game state
- Room-based architecture established

## Deliverables for Phase 3
- Complete responsive web application
- PWA with offline capabilities  
- Real-time multiplayer functionality
- Mobile-optimized user experience
- Foundation for advanced features and polish