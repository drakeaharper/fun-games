import React, { useState, useEffect } from 'react';
import HomePage from './components/HomePage';
import GameLobby from './components/GameLobby';
import GameBoard from './components/GameBoard';
import Header from './components/Header';
import Footer from './components/Footer';
import webSocketService from './services/websocket';
import { APIService } from './services/api';
import { GamePhase } from './types';

type AppState = 'restoring' | 'home' | 'lobby' | 'game';

interface GameSession {
  roomId: string;
  playerId: string;
  playerName: string;
  inviteCode: string;
}

// Survives page refreshes so players drop straight back into their game.
const SESSION_KEY = 'stock-ticker-session';

function loadSavedSession(): GameSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as GameSession) : null;
  } catch {
    return null;
  }
}

function clearSavedSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // Storage unavailable; nothing to clear.
  }
}

function App() {
  const [appState, setAppState] = useState<AppState>(() => (loadSavedSession() ? 'restoring' : 'home'));
  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [playerCount, setPlayerCount] = useState<number>(0);

  useEffect(() => {
    // Cleanup WebSocket connection on component unmount
    return () => {
      webSocketService.disconnect();
    };
  }, []);

  useEffect(() => {
    const saved = loadSavedSession();
    if (!saved) {
      return;
    }
    // Validate the saved session against the server before resuming; the
    // room may have ended or the seat may no longer exist.
    (async () => {
      try {
        const response = await APIService.getGameState(saved.roomId);
        const state = response.success ? response.data : undefined;
        if (state && state.players.some(p => p.playerId === saved.playerId)) {
          setGameSession(saved);
          setAppState(state.phase === GamePhase.WAITING ? 'lobby' : 'game');
          return;
        }
      } catch {
        // Room is gone or unreachable; fall through to a fresh start.
      }
      clearSavedSession();
      setAppState('home');
    })();
  }, []);

  const handleRoomJoined = (roomId: string, playerId: string, playerName: string, inviteCode: string) => {
    const session = { roomId, playerId, playerName, inviteCode };
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch {
      // Storage unavailable; the session just won't survive a refresh.
    }
    setGameSession(session);
    setAppState('lobby');
  };

  const handleGameStarted = () => {
    setAppState('game');
  };

  const handleLeaveGame = () => {
    webSocketService.disconnect();
    clearSavedSession();
    setGameSession(null);
    setPlayerCount(0);
    setAppState('home');
  };

  const handlePlayerCountUpdate = (count: number) => {
    setPlayerCount(count);
  };

  // Get header info based on current state
  const getHeaderInfo = () => {
    if (appState === 'home' || appState === 'restoring') {
      return { showGameInfo: false };
    }
    
    return {
      showGameInfo: true,
      gameInfo: {
        roomCode: gameSession?.inviteCode,
        playerCount: playerCount > 0 ? playerCount : undefined
      }
    };
  };

  // Render main content based on current app state
  const renderMainContent = () => {
    switch (appState) {
      case 'restoring':
        return (
          <div className="page-gradient" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexGrow: 1 }}>
            <div className="card text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Reconnecting to your game...</p>
            </div>
          </div>
        );

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
            inviteCode={gameSession.inviteCode}
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