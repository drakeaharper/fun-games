import React, { useState, useEffect } from 'react';
import HomePage from './components/HomePage';
import GameLobby from './components/GameLobby';
import GameBoard from './components/GameBoard';
import Header from './components/Header';
import Footer from './components/Footer';
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
  const [playerCount, setPlayerCount] = useState<number>(0);

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
    setPlayerCount(0);
    setAppState('home');
  };

  const handlePlayerCountUpdate = (count: number) => {
    setPlayerCount(count);
  };

  // Get header info based on current state
  const getHeaderInfo = () => {
    if (appState === 'home') {
      return { showGameInfo: false };
    }
    
    return {
      showGameInfo: true,
      gameInfo: {
        roomCode: gameSession?.roomId?.slice(-6).toUpperCase(),
        playerCount: playerCount > 0 ? playerCount : undefined
      }
    };
  };

  // Render main content based on current app state
  const renderMainContent = () => {
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
            onPlayerCountUpdate={handlePlayerCountUpdate}
          />
        );
      
      case 'game':
        if (!gameSession) {
          return <HomePage onRoomJoined={handleRoomJoined} />;
        }
        return (
          <GameBoard
            roomId={gameSession.roomId}
            playerId={gameSession.playerId}
            playerName={gameSession.playerName}
            onLeaveGame={handleLeaveGame}
          />
        );
      
      default:
        return <HomePage onRoomJoined={handleRoomJoined} />;
    }
  };

  const headerInfo = getHeaderInfo();

  return (
    <div style={{ 
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Header 
        showGameInfo={headerInfo.showGameInfo} 
        gameInfo={headerInfo.gameInfo}
      />
      
      <main style={{ 
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column'
      }}>
        {renderMainContent()}
      </main>
      
      <Footer />
    </div>
  );
}

export default App;