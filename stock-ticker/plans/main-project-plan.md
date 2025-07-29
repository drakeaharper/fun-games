# Stock Ticker Game - Tauri App Development Plan

## Project Overview

Build a digital version of the classic 1937 Stock Ticker board game using Tauri, creating a cross-platform desktop application that faithfully recreates the original gameplay while adding modern UI/UX enhancements.

## Game Mechanics (Based on Original)

### Core Components
- **6 Stock Types**: Gold, Silver, Bonds, Oil, Industrials, Grain
- **Starting Conditions**: Each stock begins at $1.00, players start with $5,000
- **Share Purchases**: Players can buy in lots of 500, 1,000, 2,000, or 5,000 shares
- **Dice System**: Three dice determine stock movements:
  1. **Stock Selection Die**: Determines which stock is affected
  2. **Action Die**: Up, Down, or Dividend
  3. **Amount Die**: 5¢, 10¢, or 20¢ movement

### Key Rules
- Dividends only paid on stocks ≥ $1.00
- Stock splits at $2.00 (shares double, price resets to $1.00)
- Stocks reset to $1.00 if they hit $0.00
- Turn-based buying/selling after dice rolls

## Technology Stack
- **Frontend**: React/Next.js with TypeScript (responsive web app)
- **Backend**: Node.js/Express or Rust (Actix-web) REST API
- **Database**: PostgreSQL (hosted) or MongoDB for game state
- **Real-time**: WebSockets (Socket.io) for live multiplayer
- **Styling**: Tailwind CSS for responsive design
- **State Management**: Redux Toolkit or Zustand
- **Deployment**: Vercel/Netlify (frontend) + Railway/Render (backend)
- **Mobile**: Progressive Web App (PWA) for mobile experience

## Development Phases

### Phase 1: Core Backend & API (MVP)
**Goal**: REST API with game logic and real-time multiplayer foundation
- Game logic implementation (Node.js/Rust)
- REST API for game actions
- WebSocket server for real-time updates
- Database schema and game state persistence
- Room-based multiplayer architecture
- Unit tests for core logic

### Phase 2: Web/Mobile Interface (Playable Game)
**Goal**: Responsive web app playable on desktop and mobile
- React frontend with responsive design
- Real-time game synchronization
- Touch-friendly mobile interface
- Progressive Web App (PWA) setup
- Game lobby and room management
- Cross-device compatibility testing

### Phase 3: Family Gaming Features & Polish (Enhanced Experience)
**Goal**: Feature-complete multiplayer game for families
- Private game rooms with invite codes
- Player avatars and customization
- Game history and statistics per family
- Multiple game modes and house rules
- Push notifications for turn reminders
- Offline mode with sync capabilities

## Success Criteria
- Each phase produces a deployable, functional web application
- Game accurately implements original Stock Ticker rules
- Responsive interface optimized for desktop, tablet, and mobile
- Real-time multiplayer with family members on different devices
- Reliable performance with low latency for multiplayer gaming
- Easy deployment and family onboarding

## Estimated Timeline
- **Phase 1**: 1-2 weeks
- **Phase 2**: 2-3 weeks  
- **Phase 3**: 2-4 weeks
- **Total**: 5-9 weeks (part-time development)

## Next Steps
1. Set up full-stack project structure (frontend + backend)
2. Choose and configure deployment platforms
3. Begin Phase 1 backend API implementation
4. Design responsive UI mockups for mobile/desktop
5. Set up development environment for real-time testing