# 🧪 Manual Testing Guide

## 🚀 Starting the Server

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Start the server:**
   ```bash
   npm run dev
   ```
   Or use the helper script:
   ```bash
   ./start-server.sh
   ```

3. **Verify server is running:**
   You should see:
   ```
   🚀 Server running on port 3001
   📊 Stock Ticker API ready
   🔗 Frontend URL: http://localhost:3000
   ```

## 🔍 Testing Methods

### Method 1: Using curl (Terminal)

#### 1. Test Health Check
```bash
curl http://localhost:3001/health
```
Expected response:
```json
{"status":"OK","timestamp":"2025-01-29T..."}
```

#### 2. Create a Game Room
```bash
curl -X POST http://localhost:3001/api/rooms \
  -H "Content-Type: application/json" \
  -d '{"name": "My Family Room"}'
```
Expected response:
```json
{
  "success": true,
  "data": {
    "roomId": "clxxx...",
    "inviteCode": "ABC123",
    "name": "My Family Room"
  }
}
```

**📝 Note the `roomId` and `inviteCode` for next steps!**

#### 3. Join the Room (Player 1)
```bash
curl -X POST http://localhost:3001/api/rooms/join \
  -H "Content-Type: application/json" \
  -d '{"inviteCode": "ABC123", "playerName": "Alice"}'
```

**📝 Note the `playerId` from the response!**

#### 4. Join the Room (Player 2)
```bash
curl -X POST http://localhost:3001/api/rooms/join \
  -H "Content-Type: application/json" \
  -d '{"inviteCode": "ABC123", "playerName": "Bob"}'
```

#### 5. Check Game State
```bash
curl http://localhost:3001/api/games/YOUR_ROOM_ID/state
```

#### 6. Start the Game
```bash
curl -X POST http://localhost:3001/api/rooms/YOUR_ROOM_ID/start
```

#### 7. Roll Dice
```bash
curl -X POST http://localhost:3001/api/games/YOUR_ROOM_ID/roll-dice \
  -H "Content-Type: application/json" \
  -d '{"playerId": "YOUR_PLAYER_ID"}'
```

#### 8. Buy Stock
```bash
curl -X POST http://localhost:3001/api/games/YOUR_ROOM_ID/buy-stock \
  -H "Content-Type: application/json" \
  -d '{"playerId": "YOUR_PLAYER_ID", "stockType": "gold", "shares": 1000}'
```

### Method 2: Using Postman/Insomnia

1. **Create a new collection** for "Stock Ticker API"

2. **Add these requests:**

   **GET Health Check**
   - URL: `http://localhost:3001/health`
   - Method: GET

   **POST Create Room**
   - URL: `http://localhost:3001/api/rooms`
   - Method: POST
   - Headers: `Content-Type: application/json`
   - Body: `{"name": "Test Room"}`

   **POST Join Room**
   - URL: `http://localhost:3001/api/rooms/join`
   - Method: POST
   - Headers: `Content-Type: application/json`
   - Body: `{"inviteCode": "ABC123", "playerName": "TestPlayer"}`

### Method 3: Using Browser Developer Tools

1. **Open your browser** and go to `http://localhost:3001/health`
2. **Open Developer Tools** (F12)
3. **Go to Console tab**
4. **Run JavaScript commands:**

```javascript
// Create room
fetch('http://localhost:3001/api/rooms', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({name: 'Browser Test Room'})
})
.then(r => r.json())
.then(console.log);

// Join room (use invite code from above)
fetch('http://localhost:3001/api/rooms/join', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({inviteCode: 'ABC123', playerName: 'BrowserUser'})
})
.then(r => r.json())
.then(console.log);
```

## 🎮 Complete Game Flow Test

Here's a complete game flow you can test:

```bash
# 1. Create room
ROOM_RESPONSE=$(curl -s -X POST http://localhost:3001/api/rooms \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Game"}')

echo "Room: $ROOM_RESPONSE"

# Extract IDs (you'll need to do this manually)
ROOM_ID="your-room-id-here"
INVITE_CODE="your-invite-code-here"

# 2. Add Player 1
PLAYER1=$(curl -s -X POST http://localhost:3001/api/rooms/join \
  -H "Content-Type: application/json" \
  -d "{\"inviteCode\": \"$INVITE_CODE\", \"playerName\": \"Alice\"}")

echo "Player 1: $PLAYER1"

# 3. Add Player 2  
PLAYER2=$(curl -s -X POST http://localhost:3001/api/rooms/join \
  -H "Content-Type: application/json" \
  -d "{\"inviteCode\": \"$INVITE_CODE\", \"playerName\": \"Bob\"}")

echo "Player 2: $PLAYER2"

# 4. Start game
curl -X POST http://localhost:3001/api/rooms/$ROOM_ID/start

# 5. Check state
curl http://localhost:3001/api/games/$ROOM_ID/state

# 6. Roll dice (use Player 1 ID)
curl -X POST http://localhost:3001/api/games/$ROOM_ID/roll-dice \
  -H "Content-Type: application/json" \
  -d '{"playerId": "PLAYER1_ID_HERE"}'

# 7. Buy stock
curl -X POST http://localhost:3001/api/games/$ROOM_ID/buy-stock \
  -H "Content-Type: application/json" \
  -d '{"playerId": "PLAYER1_ID_HERE", "stockType": "gold", "shares": 1000}'

# 8. End turn
curl -X POST http://localhost:3001/api/games/$ROOM_ID/end-turn
```

## 🔌 Testing WebSockets

For WebSocket testing, you can use:

### Option 1: Browser Console
```javascript
const socket = io('http://localhost:3001');

socket.on('connect', () => {
  console.log('Connected!', socket.id);
  
  // Join room
  socket.emit('join-room', {
    roomId: 'YOUR_ROOM_ID',
    playerId: 'YOUR_PLAYER_ID', 
    playerName: 'WebSocket Tester'
  });
});

socket.on('game-state-updated', (data) => {
  console.log('Game state:', data);
});

socket.on('dice-rolled', (data) => {
  console.log('Dice result:', data);
});
```

### Option 2: WebSocket Test Tools
- **Postman** (has WebSocket support)
- **Socket.io Client Tool** online
- **wscat** command line tool

## 📊 What to Look For

### ✅ Successful Tests Should Show:
- Room creation with unique invite codes
- Players joining and appearing in game state
- Stock prices starting at $1.00 (100 cents)
- Players starting with $5000 cash (500000 cents)
- Dice rolls affecting stock prices
- Buy/sell transactions updating portfolios
- Turn progression working correctly
- Real-time updates via WebSocket

### ❌ Common Issues:
- **CORS errors**: Make sure server allows your origin
- **Connection refused**: Server might not be running
- **Validation errors**: Check required fields in requests
- **404 errors**: Verify endpoint URLs are correct

## 🎯 Key Testing Scenarios

1. **Multi-player Flow**: Create room, add 2+ players, start game
2. **Stock Mechanics**: Roll dice, verify price changes, test splits
3. **Trading**: Buy/sell stocks with different share amounts
4. **Edge Cases**: Try invalid moves, insufficient funds
5. **WebSocket**: Join room, watch real-time updates

## 📱 Next Steps

Once manual testing works well, you'll be ready for Phase 2 frontend development! The backend should handle all these scenarios smoothly.