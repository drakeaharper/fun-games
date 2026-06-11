import React, { useState, useEffect } from 'react';
import { GameState, GamePhase, GameMode, StockType, StockPriceChange, DiceResult } from '../types';
import { APIService } from '../services/api';
import webSocketService from '../services/websocket';
import TradingPanel from './TradingPanel';
import PlayerPortfolio from './PlayerPortfolio';
import { formatCurrency } from '../utils';

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
  const [priceChanges, setPriceChanges] = useState<Partial<Record<StockType, StockPriceChange>>>({});
  const [isRolling, setIsRolling] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    loadGameState();
    setupWebSocket();

    return () => {
      webSocketService.off('game-state-updated');
      webSocketService.off('dice-rolled');
      webSocketService.off('stock-transaction');
      webSocketService.off('turn-ended');
      webSocketService.off('turn-changed');
      webSocketService.off('game-over');
      webSocketService.off('error');
    };
  }, []);

  // Tick the countdown once a second while a timed game is running.
  useEffect(() => {
    if (!gameState?.endsAt || gameState.phase === GamePhase.GAME_OVER) {
      return;
    }
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [gameState?.endsAt, gameState?.phase]);

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
      setPriceChanges(prev => ({
        ...prev,
        [data.diceResult.resultStock]: {
          action: data.diceResult.resultAction,
          amount: data.diceResult.resultAmount
        }
      }));
      setIsRolling(false);
      const stockName = data.diceResult.resultStock.toUpperCase();
      const rollMessage = `${data.playerName} rolled the dice! ${stockName} ${data.diceResult.resultAction.toUpperCase()} ${data.diceResult.resultAmount}¢`;
      addNotification(data.belowPar ? `${rollMessage} — below par, no payout 📉` : rollMessage);

      if (data.splitOccurred) {
        addNotification(`🎉 Stock split! ${stockName} shares doubled, price reset to $1.00`);
      }

      if (data.offBoard) {
        addNotification(`💥 ${stockName} crashed off the board! All shares forfeited — price reset to $1.00`);
        const myForfeit = data.forfeitures?.find(f => f.playerId === playerId);
        if (myForfeit) {
          addNotification(`📉 You lost ${myForfeit.shares.toLocaleString()} shares of ${stockName}`);
        }
      }

      const myDividend = data.dividends?.find(d => d.playerId === playerId);
      if (myDividend) {
        addNotification(`💰 You received ${formatCurrency(myDividend.amount)} in ${stockName} dividends`);
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

    webSocketService.on('game-over', (data) => {
      const winners = data.standings.filter(s => data.winnerIds.includes(s.playerId));
      const names = winners.map(w => w.playerName).join(' & ');
      const reasonText = {
        time: "Time's up",
        networth: 'Target reached',
        rolls: 'Roll limit reached'
      }[data.reason];
      addNotification(`🏁 ${reasonText}! ${names} win${winners.length === 1 ? 's' : ''} with ${formatCurrency(winners[0]?.totalValue || 0)}`);
    });

    webSocketService.on('error', (error) => {
      console.error('WebSocket error:', error);
      setError(error.message);
    });
  };

  const addNotification = (message: string) => {
    setNotifications(prev => [...prev.slice(-9), message]); // Keep last 10 as a persistent game log
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


  const handleTrade = (mode: 'buy' | 'sell', stockType: StockType, shares: number) => {
    setError(null);

    try {
      if (mode === 'buy') {
        webSocketService.buyStock(roomId, playerId, stockType, shares);
      } else {
        webSocketService.sellStock(roomId, playerId, stockType, shares);
      }
    } catch (error) {
      console.error('Error trading stock:', error);
      setError(`Failed to ${mode} stock`);
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
      <div className="page-gradient" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexGrow: 1 }}>
        <div className="card text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading game...</p>
        </div>
      </div>
    );
  }

  if (error || !gameState) {
    return (
      <div className="page-gradient" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', flexGrow: 1 }}>
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
  const isAutoMode = gameState.mode === GameMode.AUTO;
  const isGameOver = gameState.phase === GamePhase.GAME_OVER;
  const isMyTurn = gameState.currentPlayerId === playerId;
  const canRoll = !isAutoMode && isMyTurn && gameState.phase === GamePhase.ROLLING;
  const canTrade = (isAutoMode || isMyTurn) && gameState.phase === GamePhase.TRADING;

  const settings = gameState.settings;
  const formatCountdown = (ms: number) => {
    const total = Math.max(0, Math.ceil(ms / 1000));
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  };
  const endConditionChip = !isGameOver && settings && settings.endType !== 'none'
    ? settings.endType === 'time' && gameState.endsAt
      ? `⏱ ${formatCountdown(gameState.endsAt - now)}`
      : settings.endType === 'networth'
        ? `🏆 First to ${formatCurrency(settings.endValue)}`
        : settings.endType === 'rolls'
          ? `🎲 Roll ${gameState.rollCount ?? 0}/${settings.endValue}`
          : null
    : null;

  const standings = [...gameState.players].sort((a, b) => b.totalValue - a.totalValue);
  const topValue = standings[0]?.totalValue ?? 0;

  return (
    <div className="page-gradient" style={{
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
                {isGameOver ? (
                  <span className="text-sm font-medium text-blue-600">🏁 GAME OVER</span>
                ) : isAutoMode ? (
                  <span className="text-sm font-medium text-blue-600">⚡ AUTO-ROLL</span>
                ) : (
                  <>
                    <span className="text-sm text-gray-600">Turn {gameState.currentTurn + 1}</span>
                    <span className="mx-2 text-gray-400">•</span>
                    <span className="text-sm font-medium text-blue-600">
                      {gameState.phase.replace('_', ' ').toUpperCase()}
                    </span>
                  </>
                )}
              </div>
              {endConditionChip && (
                <div className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">{endConditionChip}</div>
              )}
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

        {/* Main Game Layout: Actions + Game Log + Other Players */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          flexGrow: 1
        }}>
          {/* Final standings replace the Actions card once the game ends */}
          {isGameOver ? (
          <div className="card" style={{ flexGrow: 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h2 className="text-lg font-bold text-gray-900">🏁 Final Standings</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {standings.map((p, index) => {
                  const isWinner = p.totalValue === topValue;
                  return (
                    <div
                      key={p.playerId}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.75rem 1rem',
                        borderRadius: '0.5rem',
                        border: isWinner ? '2px solid var(--st-gold)' : '1px solid var(--st-gray-200)',
                        background: isWinner
                          ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'
                          : 'rgba(255, 255, 255, 0.5)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '1.25rem' }}>{['🥇', '🥈', '🥉'][index] || `${index + 1}.`}</span>
                        <span className="font-medium text-gray-900">
                          {p.playerName}
                          {p.playerId === playerId && <span className="text-blue-600"> (You)</span>}
                        </span>
                      </div>
                      <span className="font-bold text-gray-900">{formatCurrency(p.totalValue)}</span>
                    </div>
                  );
                })}
              </div>
              <button onClick={onLeaveGame} className="w-full btn-primary">
                Leave Game
              </button>
            </div>
          </div>
          ) : (
          /* Single unified Actions card */
          <div className="card" style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            flexGrow: 1
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

                {isAutoMode ? (
                  <div className="text-xs text-gray-600 bg-gray-100 px-3 py-2 rounded" style={{ flexShrink: 0 }}>
                    ⚡ The market rolls itself every {(settings?.rollIntervalMs ?? 5000) / 1000} seconds
                  </div>
                ) : (
                  <button
                    onClick={handleRollDice}
                    disabled={!canRoll || isRolling}
                    className={`btn-primary px-6 py-2 text-sm font-semibold ${isRolling ? 'animate-pulse' : ''}`}
                    style={{ flexShrink: 0 }}
                  >
                    {isRolling ? 'Rolling...' : 'Roll Dice'}
                  </button>
                )}
              </div>

              {!isAutoMode && !canRoll && !isRolling && (
                <div className="text-xs text-gray-500" style={{ textAlign: 'center' }}>
                  {gameState.phase !== GamePhase.ROLLING ? 'Game not in rolling phase' : 'Wait for your turn'}
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200" style={{ flexShrink: 0 }}></div>

            {/* Trading Section — always visible, buttons enabled only during your trading phase */}
            <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="text-md font-semibold text-gray-900">💰 Trading</h3>
                {!canTrade && !isAutoMode && (
                  <div className="text-xs text-gray-500" style={{ flexShrink: 0 }}>
                    {isMyTurn ? 'Roll the dice to start trading' : 'Wait for your turn to trade'}
                  </div>
                )}
              </div>

              {/* Cash / Total Value */}
              {currentPlayer && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', flexShrink: 0 }}>
                  <div style={{ border: '1px solid var(--st-gray-200)', borderRadius: '0.5rem', background: 'rgba(255, 255, 255, 0.5)', padding: '0.5rem', textAlign: 'center' }}>
                    <div className="text-lg font-bold text-gray-900">{formatCurrency(currentPlayer.cash)}</div>
                    <div className="text-sm text-gray-600">Cash</div>
                  </div>
                  <div style={{ border: '1px solid var(--st-gray-200)', borderRadius: '0.5rem', background: 'rgba(255, 255, 255, 0.5)', padding: '0.5rem', textAlign: 'center' }}>
                    <div className="text-lg font-bold text-gray-900">{formatCurrency(currentPlayer.totalValue)}</div>
                    <div className="text-sm text-gray-600">Total Value</div>
                  </div>
                </div>
              )}

              <div style={{ flexGrow: 1, overflow: 'auto' }}>
                <TradingPanel
                  stocks={gameState.stocks}
                  playerCash={currentPlayer?.cash || 0}
                  playerStocks={currentPlayer?.stocks || ({} as Record<StockType, number>)}
                  priceChanges={priceChanges}
                  canTrade={canTrade}
                  onTrade={handleTrade}
                />
              </div>

              {/* Portfolio Value / Net Worth */}
              {currentPlayer && (
                <div style={{ borderTop: '1px solid var(--st-gray-200)', paddingTop: '0.5rem', flexShrink: 0 }}>
                  <div className="text-sm" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="text-gray-600">Portfolio Value:</span>
                    <span className="font-medium">{formatCurrency(currentPlayer.totalValue - currentPlayer.cash)}</span>
                  </div>
                  <div className="text-sm" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '0.25rem' }}>
                    <span className="text-gray-600">Net Worth:</span>
                    <span className="font-bold text-lg">{formatCurrency(currentPlayer.totalValue)}</span>
                  </div>
                </div>
              )}

              {canTrade && !isAutoMode && (
                <button
                  onClick={handleEndTurn}
                  className="w-full btn-success text-sm"
                  style={{ flexShrink: 0 }}
                >
                  ⏭️ End Turn
                </button>
              )}
            </div>
          </div>
          )}

          {/* Game Log — last 10 events, newest on top */}
          {notifications.length > 0 && (
            <div className="card" style={{ flexShrink: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <h2 className="text-lg font-bold text-gray-900">📜 Game Log</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', maxHeight: '16rem', overflowY: 'auto' }}>
                  {[...notifications].reverse().map((notification, index) => (
                    <div
                      key={notifications.length - index}
                      className={index === 0 ? '' : 'opacity-80'}
                      style={{
                        padding: '0.375rem 0.5rem',
                        borderBottom: '1px solid var(--st-gray-100)'
                      }}
                    >
                      <p className="text-sm text-gray-900" style={{ margin: 0 }}>{notification}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

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