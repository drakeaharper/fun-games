import React, { useState, useEffect } from 'react';
import { APIService } from '../services/api';
import webSocketService from '../services/websocket';
import { GameState, GamePhase } from '../types';
import { copyToClipboard } from '../utils';
import PlayerAvatar from './PlayerAvatar';

interface GameLobbyProps {
  roomId: string;
  playerId: string;
  playerName: string;
  onGameStarted: () => void;
  onPlayerCountUpdate: (count: number) => void;
}

const GameLobby: React.FC<GameLobbyProps> = ({ roomId, playerId, playerName, onGameStarted, onPlayerCountUpdate }) => {
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
        onPlayerCountUpdate(response.data.players.length);
        
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
      onPlayerCountUpdate(updatedGameState.players.length);
      
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

  // Fetch real invite code from API
  useEffect(() => {
    const fetchRoomInfo = async () => {
      try {
        const response = await APIService.getRoomInfo(roomId);
        if (response.success && response.data) {
          setInviteCode(response.data.inviteCode);
        }
      } catch (error) {
        console.error('Error fetching room info:', error);
        // Fallback to mock code if API fails
        const mockInviteCode = roomId.slice(-6).toUpperCase();
        setInviteCode(mockInviteCode);
      }
    };
    
    fetchRoomInfo();
  }, [roomId]);

  if (isLoading) {
    return (
      <div style={{ 
        background: 'linear-gradient(145deg, var(--st-cream) 0%, #f0f4f8 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexGrow: 1
      }}>
        <div className="card text-center" style={{ maxWidth: '400px' }}>
          <div className="mb-6">
            <div className="text-6xl mb-4">🏛️</div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--st-primary-blue)', fontFamily: 'Georgia, serif' }}>
              Preparing Trading Floor
            </h2>
          </div>
          <div className="flex justify-center items-center mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent" style={{ borderColor: 'var(--st-gold) transparent var(--st-gold) var(--st-gold)' }}></div>
          </div>
          <p style={{ color: 'var(--st-gray-600)', fontFamily: 'Georgia, serif' }}>Gathering market data and preparing your lobby...</p>
          <div className="mt-4 flex justify-center space-x-1">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--st-gold)', animationDelay: '0s' }}></div>
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--st-primary-blue)', animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--st-gold)', animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !gameState) {
    return (
      <div style={{ 
        background: 'linear-gradient(145deg, var(--st-cream) 0%, #f0f4f8 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        flexGrow: 1
      }}>
        <div className="card text-center" style={{ maxWidth: '500px' }}>
          <div className="mb-6">
            <div className="text-6xl mb-4">🚨</div>
            <h2 className="text-2xl font-bold mb-3" style={{ color: 'var(--st-red)', fontFamily: 'Georgia, serif' }}>
              Market Connection Lost
            </h2>
            <div className="p-4 rounded-lg mb-4" style={{ backgroundColor: 'var(--st-salmon)', border: '2px solid var(--st-salmon-dark)' }}>
              <p className="font-medium" style={{ color: 'var(--st-red)', fontFamily: 'Georgia, serif' }}>{error}</p>
            </div>
            <p style={{ color: 'var(--st-gray-600)', fontFamily: 'Georgia, serif' }}>
              We're having trouble connecting to the trading servers. Please check your connection and try again.
            </p>
          </div>
          <button
            onClick={loadGameState}
            className="btn-primary px-8 py-3 text-lg"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            🔄 Reconnect to Market
          </button>
        </div>
      </div>
    );
  }

  const isHost = gameState?.players[0]?.playerId === playerId;
  const canStart = gameState && gameState.players.length >= 2 && isHost;

  return (
    <div style={{ 
      background: 'linear-gradient(145deg, var(--st-cream) 0%, #f0f4f8 100%)',
      padding: '1rem',
      flexGrow: 1
    }}>
      <div className="max-w-4xl mx-auto" style={{ width: '100%', boxSizing: 'border-box' }}>
        {/* Header */}
        <div className="card">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div style={{ flexGrow: 1 }}>
              <h1 className="text-3xl font-bold" style={{ color: 'var(--st-primary-blue)', fontFamily: 'Georgia, serif' }}>🏛️ Game Lobby</h1>
              <p style={{ color: 'var(--st-gray-700)', fontFamily: 'Georgia, serif' }}>Gathering investors for the trading floor...</p>
            </div>
            
            {/* Invite Code */}
            <div className="mt-4 md:mt-0" style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--st-gray-700)', fontFamily: 'Georgia, serif' }}>
                Click to copy!
              </label>
              <button
                onClick={handleCopyInviteCode}
                style={{
                  background: copySuccess 
                    ? 'linear-gradient(135deg, var(--st-green) 0%, #15803d 100%)'
                    : 'linear-gradient(135deg, var(--st-gold-light) 0%, var(--st-gold) 100%)',
                  border: `2px solid ${copySuccess ? '#15803d' : 'var(--st-gold-dark)'}`,
                  borderRadius: '0.75rem',
                  padding: '1rem 1.5rem',
                  fontFamily: 'Georgia, serif',
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  color: 'white',
                  letterSpacing: '0.15em',
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
                  boxShadow: copySuccess 
                    ? '0 3px 6px rgba(22, 101, 52, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                    : '0 3px 6px rgba(217, 119, 6, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '120px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  transform: 'scale(1)'
                }}
                onMouseEnter={(e) => {
                  if (!copySuccess) {
                    e.currentTarget.style.transform = 'scale(1.02)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(217, 119, 6, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = copySuccess 
                    ? '0 3px 6px rgba(22, 101, 52, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                    : '0 3px 6px rgba(217, 119, 6, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
                }}
              >
                {inviteCode}
              </button>
            </div>
          </div>
        </div>

        {/* Players */}
        <div className="card">
          
          <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--st-primary-blue)', fontFamily: 'Georgia, serif' }}>
            👥 Trading Floor ({gameState?.players.length || 0}/6 Investors)
          </h2>
          
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '2rem', 
            width: '100%', 
            margin: 0, 
            padding: 0 
          }}>
            {gameState?.players.map((player, index) => (
              <div
                key={player.playerId}
                style={{
                  background: 'linear-gradient(145deg, #f8f9fa 0%, #ffffff 100%)',
                  border: '2px solid var(--st-gray-200)',
                  borderRadius: '0.75rem',
                  padding: '1rem',
                  position: 'relative',
                  boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.04)',
                  width: '100%',
                  boxSizing: 'border-box',
                  margin: 0
                }}
              >
                {/* Decorative border for active players */}
                {player.connected && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: index === 0 ? 'linear-gradient(90deg, var(--st-gold), var(--st-primary-blue))' : 'linear-gradient(90deg, var(--st-primary-blue), var(--st-gold))',
                    borderRadius: '0.75rem 0.75rem 0 0'
                  }} />
                )}
                
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '1rem', 
                  width: '100%',
                  overflow: 'hidden'
                }}>
                  {/* Player Avatar with Gravatar */}
                  <div style={{ flexShrink: 0 }}>
                    <PlayerAvatar
                      playerName={player.playerId === playerId ? playerName : player.playerName}
                      playerId={player.playerId}
                      size={56}
                      isHost={index === 0}
                    />
                  </div>
                  
                  {/* Player Info - Takes up remaining space */}
                  <div style={{ 
                    flexGrow: 1, 
                    minWidth: 0, 
                    display: 'flex', 
                    flexDirection: 'column',
                    gap: '0.5rem',
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.75rem',
                      width: '100%',
                      minWidth: 0
                    }}>
                      <h4 className="text-lg font-bold truncate" style={{ 
                        color: 'var(--st-gray-900)', 
                        fontFamily: 'Georgia, serif',
                        margin: 0,
                        flexGrow: 1,
                        minWidth: 0,
                        overflow: 'hidden'
                      }}>
                        {player.playerId === playerId ? playerName : player.playerName}
                      </h4>
                      
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.5rem', 
                        flexShrink: 0,
                        flexWrap: 'wrap'
                      }}>
                        {index === 0 && (
                          <span style={{
                            background: 'linear-gradient(135deg, var(--st-gold) 0%, var(--st-gold-dark) 100%)',
                            color: 'white',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            padding: '0.375rem 0.75rem',
                            borderRadius: '1rem',
                            fontFamily: 'Georgia, serif',
                            textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
                            whiteSpace: 'nowrap'
                          }}>
                            👑 Host
                          </span>
                        )}
                        
                        {/* Connection Status */}
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.5rem',
                          background: player.connected ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          border: `1px solid ${player.connected ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                          borderRadius: '1rem',
                          padding: '0.375rem 0.75rem',
                          whiteSpace: 'nowrap'
                        }}>
                          <div className={`w-2.5 h-2.5 rounded-full ${
                            player.connected 
                              ? 'bg-green-500' 
                              : 'bg-red-500'
                          }`}></div>
                          <span className={`text-sm font-medium ${
                            player.connected 
                              ? 'text-green-700' 
                              : 'text-red-700'
                          }`} style={{ fontFamily: 'Georgia, serif' }}>
                            {player.connected ? 'Ready' : 'Away'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {player.playerId === playerId && (
                      <p className="text-sm" style={{ 
                        color: 'var(--st-primary-blue)', 
                        fontFamily: 'Georgia, serif', 
                        fontStyle: 'italic',
                        margin: 0
                      }}>
                        That's you! 🎯
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Empty Slots */}
            {Array.from({ length: 6 - (gameState?.players.length || 0) }).map((_, index) => (
              <div
                key={`empty-${index}`}
                style={{
                  border: '2px dashed var(--st-gray-300)',
                  borderRadius: '0.75rem',
                  padding: '1rem',
                  background: 'linear-gradient(145deg, var(--st-gray-50) 0%, #fafafa 100%)',
                  width: '100%',
                  boxSizing: 'border-box',
                  margin: 0
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '1rem', 
                  width: '100%',
                  overflow: 'hidden'
                }}>
                  <div style={{ flexShrink: 0 }}>
                    <div className="w-14 h-14 rounded-full border-2 border-dashed flex items-center justify-center" style={{ 
                      borderColor: 'var(--st-gray-400)', 
                      backgroundColor: 'var(--st-gray-100)'
                    }}>
                      <span className="text-2xl" style={{ color: 'var(--st-gray-400)' }}>💼</span>
                    </div>
                  </div>
                  <div style={{ 
                    flexGrow: 1, 
                    minWidth: 0,
                    overflow: 'hidden'
                  }}>
                    <p className="text-base font-medium mb-1" style={{ 
                      color: 'var(--st-gray-500)', 
                      fontFamily: 'Georgia, serif',
                      margin: 0
                    }}>
                      Awaiting investor...
                    </p>
                    <p className="text-sm" style={{ 
                      color: 'var(--st-gray-400)', 
                      fontFamily: 'Georgia, serif', 
                      fontStyle: 'italic',
                      margin: 0
                    }}>
                      Share the invite code above to invite players
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Game Rules */}
        <div className="card">
          <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--st-primary-blue)', fontFamily: 'Georgia, serif' }}>
            📈 Stock Market Rules (Est. 1937)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div style={{
              background: 'linear-gradient(145deg, var(--st-cream) 0%, #fefbf3 100%)',
              border: '2px solid var(--st-gold)',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: 'linear-gradient(90deg, var(--st-gold), var(--st-gold-light))',
                borderRadius: '0.75rem 0.75rem 0 0'
              }} />
              <h3 className="font-bold mb-3" style={{ color: 'var(--st-gold-dark)', fontFamily: 'Georgia, serif', fontSize: '1.125rem' }}>
                💼 Basic Trading:
              </h3>
              <ul className="space-y-2" style={{ fontFamily: 'Georgia, serif' }}>
                <li className="flex items-start gap-2">
                  <span style={{ color: 'var(--st-gold)' }}>•</span>
                  <span style={{ color: 'var(--st-gray-700)' }}>Each investor starts with <strong>$5,000</strong> capital</span>
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: 'var(--st-gold)' }}>•</span>
                  <span style={{ color: 'var(--st-gray-700)' }}>All stocks begin trading at <strong>$1.00</strong> per share</span>
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: 'var(--st-gold)' }}>•</span>
                  <span style={{ color: 'var(--st-gray-700)' }}>Purchase stocks in lots of <strong>500, 1K, 2K, or 5K</strong> shares</span>
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: 'var(--st-gold)' }}>•</span>
                  <span style={{ color: 'var(--st-gray-700)' }}>Roll dice each turn to <strong>affect market prices</strong></span>
                </li>
              </ul>
            </div>
            <div style={{
              background: 'linear-gradient(145deg, var(--st-cream) 0%, #fefbf3 100%)',
              border: '2px solid var(--st-primary-blue)',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: 'linear-gradient(90deg, var(--st-primary-blue), var(--st-primary-blue-light))',
                borderRadius: '0.75rem 0.75rem 0 0'
              }} />
              <h3 className="font-bold mb-3" style={{ color: 'var(--st-primary-blue)', fontFamily: 'Georgia, serif', fontSize: '1.125rem' }}>
                ⚡ Market Events:
              </h3>
              <ul className="space-y-2" style={{ fontFamily: 'Georgia, serif' }}>
                <li className="flex items-start gap-2">
                  <span style={{ color: 'var(--st-primary-blue)' }}>•</span>
                  <span style={{ color: 'var(--st-gray-700)' }}><strong>Stock Split</strong> at $2.00 (shares double, price resets to $1.00)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: 'var(--st-primary-blue)' }}>•</span>
                  <span style={{ color: 'var(--st-gray-700)' }}><strong>Market Crash</strong> resets stocks to $1.00 when they hit $0.00</span>
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: 'var(--st-primary-blue)' }}>•</span>
                  <span style={{ color: 'var(--st-gray-700)' }}><strong>Dividends</strong> paid only on stocks ≥ $1.00</span>
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: 'var(--st-primary-blue)' }}>•</span>
                  <span style={{ color: 'var(--st-gray-700)' }}>First to reach your <strong>investment goal wins!</strong></span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="card" style={{ 
            backgroundColor: 'var(--st-salmon)', 
            borderColor: 'var(--st-red)',
            borderWidth: '2px'
          }}>
            <div className="flex items-center gap-3">
              <div className="text-2xl">⚠️</div>
              <div>
                <h3 className="font-bold mb-1" style={{ color: 'var(--st-red)', fontFamily: 'Georgia, serif' }}>Market Alert</h3>
                <p className="font-medium" style={{ color: 'var(--st-red)', fontFamily: 'Georgia, serif' }}>{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Start Game Button */}
        <div className="card">
          {isHost ? (
            <div className="text-center">
              <div className="mb-4">
                <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--st-primary-blue)', fontFamily: 'Georgia, serif' }}>
                  🎯 Ready to Open the Market?
                </h3>
                <p style={{ color: 'var(--st-gray-600)', fontFamily: 'Georgia, serif' }}>As the host, you control when trading begins</p>
              </div>
              <button
                onClick={handleStartGame}
                disabled={!canStart || isStarting}
                className={`px-10 py-4 text-xl font-bold transition-all duration-300 ${!canStart || isStarting ? 'opacity-60 cursor-not-allowed' : 'hover:scale-105'}`}
                style={{
                  background: canStart && !isStarting ? 'linear-gradient(135deg, var(--st-gold) 0%, var(--st-gold-dark) 100%)' : 'linear-gradient(135deg, var(--st-gray-400) 0%, var(--st-gray-500) 100%)',
                  color: 'white',
                  fontFamily: 'Georgia, serif',
                  border: '3px solid',
                  borderColor: canStart && !isStarting ? 'var(--st-gold-dark)' : 'var(--st-gray-500)',
                  borderRadius: '1rem',
                  boxShadow: canStart && !isStarting ? '0 4px 12px rgba(217, 119, 6, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)' : '0 2px 4px rgba(0, 0, 0, 0.1)',
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'
                }}
              >
                {isStarting ? '🔄 Opening Market...' : '🖯 Start Trading Session'}
              </button>
              {!canStart && gameState && gameState.players.length < 2 && (
                <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: 'var(--st-salmon)', border: '1px solid var(--st-salmon-dark)' }}>
                  <p className="text-sm font-medium" style={{ color: 'var(--st-red)', fontFamily: 'Georgia, serif' }}>
                    ⚠️ Need at least 2 investors to open the market
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center">
              <div className="mb-4">
                <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--st-primary-blue)', fontFamily: 'Georgia, serif' }}>
                  ⏳ Market Preparation
                </h3>
                <p style={{ color: 'var(--st-gray-600)', fontFamily: 'Georgia, serif' }}>The host is preparing to open the trading session...</p>
              </div>
              <div className="animate-pulse p-4 rounded-lg" style={{ backgroundColor: 'var(--st-gray-100)', border: '2px dashed var(--st-gray-300)' }}>
                <div className="text-2xl mb-2">🕰️</div>
                <p className="font-medium" style={{ color: 'var(--st-gray-600)', fontFamily: 'Georgia, serif' }}>Awaiting host's signal to begin trading</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameLobby;