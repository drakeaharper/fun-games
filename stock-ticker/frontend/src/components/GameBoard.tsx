import React, { useState, useEffect } from 'react';
import { GameState, GamePhase, StockType, DiceResult } from '../types';
import { APIService } from '../services/api';
import webSocketService from '../services/websocket';
import StockCard from './StockCard';
import PlayerPortfolio from './PlayerPortfolio';
import { formatCurrency, getStockEmoji } from '../utils';

interface GameBoardProps {
  roomId: string;
  playerId: string;
  playerName: string;
  onLeaveGame: () => void;
}

const GameBoard: React.FC<GameBoardProps> = ({ roomId, playerId, playerName, onLeaveGame }) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastDiceResult, setLastDiceResult] = useState<DiceResult | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [showTradingModal, setShowTradingModal] = useState(false);
  const [tradingMode, setTradingMode] = useState<'buy' | 'sell'>('buy');
  const [isTrading, setIsTrading] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([]);

  useEffect(() => {
    loadGameState();
    setupWebSocket();
    
    return () => {
      webSocketService.off('game-state-updated');
      webSocketService.off('dice-rolled');
      webSocketService.off('stock-transaction');
      webSocketService.off('turn-ended');
      webSocketService.off('turn-changed');
      webSocketService.off('error');
    };
  }, []);

  const loadGameState = async () => {
    try {
      const response = await APIService.getGameState(roomId);
      if (response.success && response.data) {
        setGameState(response.data);
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
    // Connect and join room
    webSocketService.connect();
    webSocketService.joinRoom(roomId, playerId, playerName);

    // Listen for game updates
    webSocketService.on('game-state-updated', (updatedGameState) => {
      setGameState(updatedGameState);
    });

    webSocketService.on('dice-rolled', (data) => {
      setLastDiceResult(data.diceResult);
      setIsRolling(false);
      addNotification(`${data.playerName} rolled the dice! ${data.diceResult.resultStock.toUpperCase()} ${data.diceResult.resultAction.toUpperCase()} ${data.diceResult.resultAmount}¢`);
      
      if (data.splitOccurred) {
        addNotification(`🎉 Stock split! ${data.diceResult.resultStock.toUpperCase()} shares doubled, price reset to $1.00`);
      }
    });

    webSocketService.on('stock-transaction', (data) => {
      addNotification(data.message);
    });

    webSocketService.on('turn-ended', (data) => {
      addNotification(`${data.playerName} ended their turn`);
    });

    webSocketService.on('turn-changed', (data) => {
      if (data.currentPlayerId === playerId) {
        addNotification("🎯 It's your turn!");
      }
    });

    webSocketService.on('error', (error) => {
      console.error('WebSocket error:', error);
      setError(error.message);
    });
  };

  const addNotification = (message: string) => {
    setNotifications(prev => [...prev.slice(-4), message]); // Keep last 5 notifications
    
    // Remove notification after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.slice(1));
    }, 5000);
  };

  const handleRollDice = async () => {
    if (!gameState || gameState.currentPlayerId !== playerId || gameState.phase !== GamePhase.ROLLING) {
      return;
    }

    setIsRolling(true);
    setError(null);

    try {
      // Use WebSocket for real-time updates
      webSocketService.rollDice(roomId, playerId);
    } catch (error) {
      console.error('Error rolling dice:', error);
      setError('Failed to roll dice');
      setIsRolling(false);
    }
  };


  const handleTrade = async (stockType: StockType, shares: number) => {
    setIsTrading(true);
    setError(null);

    try {
      if (tradingMode === 'buy') {
        webSocketService.buyStock(roomId, playerId, stockType, shares);
      } else {
        webSocketService.sellStock(roomId, playerId, stockType, shares);
      }
      
      setShowTradingModal(false);
    } catch (error) {
      console.error('Error trading stock:', error);
      setError(`Failed to ${tradingMode} stock`);
    } finally {
      setIsTrading(false);
    }
  };

  const handleEndTurn = async () => {
    if (!gameState || gameState.currentPlayerId !== playerId) {
      return;
    }

    try {
      webSocketService.endTurn(roomId);
    } catch (error) {
      console.error('Error ending turn:', error);
      setError('Failed to end turn');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="card text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading game...</p>
        </div>
      </div>
    );
  }

  if (error || !gameState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="card text-center max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Game Error</h2>
          <p className="text-gray-600 mb-4">{error || 'Failed to load game'}</p>
          <div className="flex space-x-2">
            <button onClick={loadGameState} className="btn-primary">
              Try Again
            </button>
            <button onClick={onLeaveGame} className="btn-secondary">
              Leave Game
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentPlayer = gameState.players.find(p => p.playerId === playerId);
  const isMyTurn = gameState.currentPlayerId === playerId;
  const canRoll = isMyTurn && gameState.phase === GamePhase.ROLLING;
  const canTrade = isMyTurn && gameState.phase === GamePhase.TRADING;

  return (
    <div style={{ 
      background: 'linear-gradient(145deg, var(--st-cream) 0%, #f0f4f8 100%)',
      display: 'flex', 
      flexDirection: 'column', 
      flexGrow: 1 
    }}>
      <div className="w-full px-4" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Game Status Bar */}
        <div className="card" style={{ flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div>
                <span className="text-sm text-gray-600">Turn {gameState.currentTurn + 1}</span>
                <span className="mx-2 text-gray-400">•</span>
                <span className="text-sm font-medium text-blue-600">
                  {gameState.phase.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {currentPlayer && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="text-sm text-gray-600">Net Worth:</span>
                  <span className="text-lg font-bold text-gray-900">
                    {formatCurrency(currentPlayer.totalValue)}
                  </span>
                </div>
              )}
              <button onClick={onLeaveGame} className="btn-secondary" style={{ flexShrink: 0 }}>
                Leave Game
              </button>
            </div>
          </div>
        </div>

        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="fixed top-4 right-4 z-40 space-y-2">
            {notifications.map((notification, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 max-w-sm animate-slide-in-right"
              >
                <p className="text-sm text-gray-900">{notification}</p>
              </div>
            ))}
          </div>
        )}

        {/* Stock Market - Full Width */}
        <div className="card" style={{ flexShrink: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h2 className="text-lg font-bold text-gray-900">📈 Stock Market</h2>
            <div className="stock-market-grid" style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, 1fr)', 
              gap: '0.5rem'
            }}>
              <style>
                {`
                  @media (min-width: 1024px) {
                    .stock-market-grid {
                      grid-template-columns: repeat(6, 1fr) !important;
                    }
                  }
                `}
              </style>
              {gameState.stocks.map((stock) => (
                <StockCard
                  key={stock.stockType}
                  stock={stock}
                  playerShares={currentPlayer?.stocks[stock.stockType] || 0}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Main Game Layout: Player Info Left, Actions Right */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '1rem',
          flexGrow: 1
        }}>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'row',
            gap: '1rem',
            flexGrow: 1
          }}>
            {/* Left Column: Current Player Info */}
            <div style={{ 
              width: '50%', 
              flexGrow: 1, 
              flexShrink: 1,
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div className="card" style={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}>
                <h2 className="text-lg font-bold text-gray-900">👤 Your Info</h2>
                {currentPlayer && (
                  <div style={{ flexGrow: 1 }}>
                    <PlayerPortfolio
                      key={currentPlayer.playerId}
                      portfolio={currentPlayer}
                      playerName={playerName}
                      isCurrentPlayer={true}
                      isActivePlayer={currentPlayer.playerId === gameState.currentPlayerId}
                      compact={false}
                      noCard={true}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Actions */}
            <div style={{ 
              width: '50%', 
              flexGrow: 1, 
              flexShrink: 1,
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* Single Unified Actions Card */}
              <div className="card" style={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}>
                <h2 className="text-lg font-bold text-gray-900">🎮 Actions</h2>
                
                {/* Dice Rolling Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flexShrink: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 className="text-md font-semibold text-gray-900">🎲 Dice Roll</h3>
                    {lastDiceResult && !isRolling && (
                      <div className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded" style={{ flexShrink: 0 }}>
                        {lastDiceResult.resultStock.toUpperCase()} {lastDiceResult.resultAction.toUpperCase()} {lastDiceResult.resultAmount}¢
                      </div>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {(isRolling ? [1,1,1] : lastDiceResult ? [lastDiceResult.stockDie, lastDiceResult.actionDie, lastDiceResult.amountDie] : [1,1,1]).map((die, index) => (
                        <div
                          key={index}
                          className={`w-10 h-10 bg-white border-2 border-gray-300 rounded-lg shadow-sm ${isRolling ? 'animate-bounce' : ''}`}
                          style={{ 
                            animationDelay: `${index * 0.1}s`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.25rem',
                            fontWeight: 'bold'
                          }}
                        >
                          {['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][die - 1]}
                        </div>
                      ))}
                    </div>
                    
                    <button
                      onClick={handleRollDice}
                      disabled={!canRoll || isRolling}
                      className={`btn-primary px-6 py-2 text-sm font-semibold ${isRolling ? 'animate-pulse' : ''}`}
                      style={{ flexShrink: 0 }}
                    >
                      {isRolling ? 'Rolling...' : 'Roll Dice'}
                    </button>
                  </div>
                  
                  {!canRoll && !isRolling && (
                    <div className="text-xs text-gray-500" style={{ textAlign: 'center' }}>
                      {gameState.phase !== GamePhase.ROLLING ? 'Game not in rolling phase' : 'Wait for your turn'}
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200" style={{ flexShrink: 0 }}></div>

                {/* Trading Section */}
                <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <h3 className="text-md font-semibold text-gray-900">💰 Trading</h3>
                  
                  {canTrade ? (
                    <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {!showTradingModal ? (
                        <>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <button
                              onClick={() => { setTradingMode('buy'); setShowTradingModal(true); }}
                              className="btn-primary py-3 text-sm font-semibold rounded-lg transition-all hover:scale-105"
                            >
                              💰 Buy Stock
                            </button>
                            <button
                              onClick={() => { setTradingMode('sell'); setShowTradingModal(true); }}
                              className="btn-secondary py-3 text-sm font-semibold rounded-lg transition-all hover:scale-105"
                            >
                              💸 Sell Stock
                            </button>
                          </div>
                          <div style={{ flexGrow: 1 }}></div>
                          <button
                            onClick={handleEndTurn}
                            className="w-full btn-success text-sm"
                          >
                            ⏭️ End Turn
                          </button>
                        </>
                      ) : (
                        /* Inline Trading Interface */
                        <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h4 className="text-sm font-semibold text-gray-900">
                              {tradingMode === 'buy' ? '💰 Buy Stock' : '💸 Sell Stock'}
                            </h4>
                            <button
                              onClick={() => setShowTradingModal(false)}
                              className="text-gray-500 hover:text-gray-700 text-sm bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors"
                              style={{ flexShrink: 0 }}
                            >
                              ✕ Cancel
                            </button>
                          </div>
                          
                          <div style={{ 
                            flexGrow: 1, 
                            overflow: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.5rem'
                          }}>
                            {gameState.stocks.map((stock) => {
                              const playerShares = currentPlayer?.stocks[stock.stockType] || 0;
                              const canAfford = tradingMode === 'buy' ? (currentPlayer?.cash || 0) >= stock.currentPrice * 500 : playerShares >= 500;
                              
                              return (
                                <button
                                  key={stock.stockType}
                                  onClick={() => {
                                    handleTrade(stock.stockType, 500);
                                    setShowTradingModal(false);
                                  }}
                                  disabled={!canAfford || isTrading}
                                  className={`w-full border rounded-lg text-left text-xs transition-all ${
                                    canAfford ? 'border-gray-300 hover:bg-gray-50 hover:border-gray-400' : 'border-gray-200 bg-gray-50 opacity-50'
                                  }`}
                                  style={{ 
                                    padding: '0.75rem',
                                    flexShrink: 0
                                  }}
                                >
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                      <span style={{ fontSize: '1.125rem' }}>{getStockEmoji(stock.stockType)}</span>
                                      <span className="font-medium">{stock.stockType.charAt(0).toUpperCase() + stock.stockType.slice(1)}</span>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                      <div className="font-bold">${stock.currentPrice.toFixed(2)}</div>
                                      {tradingMode === 'buy' && (
                                        <div className="text-gray-500">Cost: ${(stock.currentPrice * 500).toFixed(2)}</div>
                                      )}
                                      {tradingMode === 'sell' && playerShares > 0 && (
                                        <div className="text-gray-500">Own: {playerShares}</div>
                                      )}
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ 
                      flexGrow: 1, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center' 
                    }}>
                      <div style={{ textAlign: 'center' }} className="text-gray-500">
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏰</div>
                        <div className="text-sm">Wait for trading phase</div>
                      </div>
                    </div>
                  )}
                </div>
            </div>
          </div>
        </div>

          {/* Other Players - Full Width Below */}
          {gameState.players.filter(p => p.playerId !== playerId).length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flexShrink: 0 }}>
              <h2 className="text-lg font-bold text-gray-900">👥 Other Players</h2>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                gap: '0.75rem'
              }}>
                {gameState.players
                  .filter(p => p.playerId !== playerId)
                  .map((portfolio) => (
                    <PlayerPortfolio
                      key={portfolio.playerId}
                      portfolio={portfolio}
                      playerName={portfolio.playerName}
                      isCurrentPlayer={false}
                      isActivePlayer={portfolio.playerId === gameState.currentPlayerId}
                      compact={true}
                    />
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default GameBoard;