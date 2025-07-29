import React, { useState, useEffect } from 'react';
import { APIService } from '../services/api';
import webSocketService from '../services/websocket';
import { GameState, GamePhase } from '../types';
import { copyToClipboard, getPlayerInitials, generateAvatarColor } from '../utils';

interface GameLobbyProps {
  roomId: string;
  playerId: string;
  playerName: string;
  onGameStarted: () => void;
}

const GameLobby: React.FC<GameLobbyProps> = ({ roomId, playerId, playerName, onGameStarted }) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [inviteCode, setInviteCode] = useState<string>('');
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    loadGameState();
    setupWebSocket();
    
    return () => {
      // Cleanup WebSocket listeners
      webSocketService.off('game-state-updated');
      webSocketService.off('player-joined');
      webSocketService.off('player-disconnected');
    };
  }, []);

  const loadGameState = async () => {
    try {
      const response = await APIService.getGameState(roomId);
      if (response.success && response.data) {
        setGameState(response.data);
        
        // If game is already started, redirect to game
        if (response.data.phase !== GamePhase.WAITING) {
          onGameStarted();
        }
      } else {
        setError('Failed to load game state');
      }
    } catch (error) {
      console.error('Error loading game state:', error);
      setError('Failed to connect to game');
    } finally {
      setIsLoading(false);
    }
  };

  const setupWebSocket = () => {
    const socket = webSocketService.connect();
    
    // Join the room
    webSocketService.joinRoom(roomId, playerId, playerName);
    
    // Listen for game state updates
    webSocketService.on('game-state-updated', (updatedGameState) => {
      setGameState(updatedGameState);
      
      // If game started, redirect
      if (updatedGameState.phase !== GamePhase.WAITING) {
        onGameStarted();
      }
    });

    webSocketService.on('player-joined', (data) => {
      console.log(`${data.playerName} joined the game`);
      // Game state will be updated via game-state-updated event
    });

    webSocketService.on('player-disconnected', (data) => {
      console.log(`${data.playerName} disconnected`);
      // Game state will be updated via game-state-updated event
    });

    webSocketService.on('room-joined', (data) => {
      if (data.success) {
        console.log('Successfully joined room');
      }
    });

    webSocketService.on('error', (error) => {
      console.error('WebSocket error:', error);
      setError(error.message);
    });
  };

  const handleStartGame = async () => {
    if (!gameState || gameState.players.length < 2) {
      setError('Need at least 2 players to start the game');
      return;
    }

    setIsStarting(true);
    setError(null);

    try {
      const response = await APIService.startGame(roomId);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to start game');
      }
      
      // Game will redirect automatically via WebSocket update
    } catch (error) {
      console.error('Error starting game:', error);
      setError(error instanceof Error ? error.message : 'Failed to start game');
      setIsStarting(false);
    }
  };

  const handleCopyInviteCode = async () => {
    if (inviteCode) {
      const success = await copyToClipboard(inviteCode);
      if (success) {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      }
    }
  };

  // Extract invite code from game state or derive it
  useEffect(() => {
    // For demo purposes, we'll generate a mock invite code based on room ID
    // In a real app, this would come from the API response
    const mockInviteCode = roomId.slice(-6).toUpperCase();
    setInviteCode(mockInviteCode);
  }, [roomId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading game lobby...</p>
        </div>
      </div>
    );
  }

  if (error && !gameState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl p-8 text-center max-w-md w-full">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Connection Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadGameState}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const isHost = gameState?.players[0]?.playerId === playerId;
  const canStart = gameState && gameState.players.length >= 2 && isHost;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Game Lobby</h1>
              <p className="text-gray-600">Waiting for players to join...</p>
            </div>
            
            {/* Invite Code */}
            <div className="mt-4 md:mt-0">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Invite Code
              </label>
              <div className="flex items-center space-x-2">
                <code className="bg-gray-100 px-3 py-2 rounded-lg font-mono text-lg tracking-wider">
                  {inviteCode}
                </code>
                <button
                  onClick={handleCopyInviteCode}
                  className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                    copySuccess
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {copySuccess ? '✓ Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Players */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Players ({gameState?.players.length || 0}/6)
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {gameState?.players.map((player, index) => (
              <div
                key={player.playerId}
                className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
              >
                {/* Player Avatar */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: generateAvatarColor(player.playerId) }}
                >
                  {getPlayerInitials(player.playerId === playerId ? playerName : `Player ${index + 1}`)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {player.playerId === playerId ? playerName : `Player ${index + 1}`}
                    {index === 0 && <span className="ml-1 text-xs text-primary-600">(Host)</span>}
                  </p>
                  <p className="text-xs text-gray-500">
                    {player.playerId === playerId && 'You'}
                  </p>
                </div>
                
                {/* Connection Status */}
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
              </div>
            ))}
            
            {/* Empty Slots */}
            {Array.from({ length: 6 - (gameState?.players.length || 0) }).map((_, index) => (
              <div
                key={`empty-${index}`}
                className="flex items-center space-x-3 p-3 border-2 border-dashed border-gray-200 rounded-lg"
              >
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400 text-xl">+</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-400">Waiting for player...</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Game Rules */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Game Rules</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Basic Rules:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Each player starts with $5,000</li>
                <li>• All stocks start at $1.00</li>
                <li>• Buy stocks in lots of 500, 1K, 2K, or 5K shares</li>
                <li>• Take turns rolling dice to affect stock prices</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Special Events:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Stocks split at $2.00 (double shares, reset to $1.00)</li>
                <li>• Stocks reset to $1.00 if they hit $0.00</li>
                <li>• Dividends paid only on stocks ≥ $1.00</li>
                <li>• First to reach your goal wins!</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Start Game Button */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          {isHost ? (
            <div className="text-center">
              <button
                onClick={handleStartGame}
                disabled={!canStart || isStarting}
                className="btn-primary px-8 py-3 text-lg"
              >
                {isStarting ? 'Starting Game...' : 'Start Game'}
              </button>
              {!canStart && gameState && gameState.players.length < 2 && (
                <p className="text-sm text-gray-500 mt-2">
                  Need at least 2 players to start
                </p>
              )}
            </div>
          ) : (
            <div className="text-center">
              <p className="text-gray-600">Waiting for host to start the game...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameLobby;