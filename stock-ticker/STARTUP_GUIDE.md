# 🚀 Stock Ticker App - Startup Guide

## Quick Start (Both Servers)

### Option 1: Using Two Terminals

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
*Wait for: "🚀 Server running on port 3001"*

**Terminal 2 - Frontend:**
```bash
cd frontend  
npm start
```
*Wait for: "webpack compiled successfully"*

### Option 2: Using the Startup Script
```bash
./start-both.sh
```

## Testing the App

1. **Open Browser**: http://localhost:3000
2. **Create Game**: Click "Create Game", enter room name and your name
3. **Copy Invite Code**: Share the 6-character code with family
4. **Join from Other Devices**: Use invite code on phones/tablets/other browsers
5. **Start Game**: Host clicks "Start Game" when 2+ players joined
6. **Play**: Roll dice → buy/sell stocks → end turn → repeat!

## Troubleshooting

### Port Conflicts
If you get "EADDRINUSE" errors:
```bash
# Kill processes using the ports
lsof -ti:3001 | xargs kill
lsof -ti:3000 | xargs kill

# Wait 2 seconds, then restart
```

### Backend Not Responding
```bash
cd backend
npm run dev
# Look for "🚀 Server running on port 3001"
```

### Frontend Build Errors
```bash
cd frontend
npm install  # Reinstall dependencies if needed
npm start
```

## API Endpoints (Backend)

- Health Check: http://localhost:3001/health
- Create Room: POST http://localhost:3001/api/rooms
- Join Room: POST http://localhost:3001/api/rooms/join
- Game State: GET http://localhost:3001/api/games/:roomId/state

## Game Features ✨

✅ **Complete Multiplayer**: Real-time sync across all devices
✅ **Mobile Responsive**: Works on phones, tablets, desktop
✅ **Original Rules**: Faithful 1937 Stock Ticker implementation
✅ **Visual Feedback**: Animated dice, stock price changes
✅ **Family Friendly**: Easy invite codes, clear UI

## Architecture

```
Frontend (React)     ←→     Backend (Node.js)
http://localhost:3000  ←→  http://localhost:3001
     
├── Game Lobby           ├── REST API
├── Game Board           ├── WebSocket Server  
├── Stock Trading        ├── SQLite Database
└── Real-time Updates    └── Game Logic
```

## Next Steps

🎮 **Ready to Play!** The game is fully functional with all core features.

Optional enhancements you could add:
- PWA (Progressive Web App) for mobile installation
- Push notifications for turn reminders  
- Game statistics and leaderboards
- Sound effects and enhanced animations
- Multiple game modes and house rules

## Family Game Night Setup

1. **Host Device**: Laptop/desktop running both servers
2. **Family Members**: Join via invite code on their phones/tablets
3. **Network**: All devices on same WiFi (or use ngrok for external access)
4. **Players**: 2-6 players, ages 8+ recommended

Have fun playing! 🎲📈👨‍👩‍👧‍👦