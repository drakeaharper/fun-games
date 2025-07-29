import React, { useState, useEffect } from 'react';
import HomePage from './components/HomePage';
import GameLobby from './components/GameLobby';
import webSocketService from './services/websocket';

type AppState = 'home' | 'lobby' | 'game';

interface GameSession {
  roomId: string;
  playerId: string;
  playerName: string;
}

function App() {
  const [appState, setAppState] = useState<AppState>('home');
  const [gameSession, setGameSession] = useState<GameSession | null>(null);

  useEffect(() => {
    // Cleanup WebSocket connection on component unmount
    return () => {
      webSocketService.disconnect();
    };
  }, []);

  const handleRoomJoined = (roomId: string, playerId: string, playerName: string) => {
    setGameSession({ roomId, playerId, playerName });
    setAppState('lobby');
  };

  const handleGameStarted = () => {
    setAppState('game');
  };

  const handleLeaveGame = () => {
    webSocketService.disconnect();
    setGameSession(null);
    setAppState('home');
  };

  // Render based on current app state
  switch (appState) {
    case 'home':
      return <HomePage onRoomJoined={handleRoomJoined} />;
    
    case 'lobby':
      if (!gameSession) {
        return <HomePage onRoomJoined={handleRoomJoined} />;
      }
      return (
        <GameLobby
          roomId={gameSession.roomId}
          playerId={gameSession.playerId}
          playerName={gameSession.playerName}
          onGameStarted={handleGameStarted}
        />
      );
    
    case 'game':
      if (!gameSession) {
        return <HomePage onRoomJoined={handleRoomJoined} />;
      }
      // Game component will be created next
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">🎮 Game Starting Soon!</h1>
            <p className="text-gray-600 mb-4">The game board interface is being built...</p>
            <button
              onClick={handleLeaveGame}
              className="btn-secondary"
            >
              Back to Home
            </button>
          </div>
        </div>
      );
    
    default:
      return <HomePage onRoomJoined={handleRoomJoined} />;
  }
}

export default App;