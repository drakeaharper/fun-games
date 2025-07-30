import React, { useState, useEffect } from 'react';
import { DiceResult, DiceAction } from '../types';
import { getStockEmoji } from '../utils';

interface DiceRollerProps {
  onRoll: () => void;
  isRolling: boolean;
  lastResult?: DiceResult | null;
  canRoll: boolean;
  disabled?: boolean;
}

const DiceRoller: React.FC<DiceRollerProps> = ({
  onRoll,
  isRolling,
  lastResult,
  canRoll,
  disabled = false
}) => {
  const [animationDice, setAnimationDice] = useState([1, 1, 1]);

  // Animate dice while rolling
  useEffect(() => {
    if (isRolling) {
      const interval = setInterval(() => {
        setAnimationDice([
          Math.floor(Math.random() * 6) + 1,
          Math.floor(Math.random() * 6) + 1,
          Math.floor(Math.random() * 6) + 1
        ]);
      }, 100);

      return () => clearInterval(interval);
    }
  }, [isRolling]);

  const getDiceDisplay = (value: number): string => {
    const faces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    return faces[value - 1] || '⚀';
  };

  const getActionDisplay = (action: DiceAction): { icon: string; text: string; color: string } => {
    switch (action) {
      case DiceAction.UP:
        return { icon: '📈', text: 'UP', color: 'text-green-600' };
      case DiceAction.DOWN:
        return { icon: '📉', text: 'DOWN', color: 'text-red-600' };
      case DiceAction.DIVIDEND:
        return { icon: '💰', text: 'DIVIDEND', color: 'text-yellow-600' };
      default:
        return { icon: '❓', text: 'UNKNOWN', color: 'text-gray-600' };
    }
  };

  const displayDice = isRolling ? animationDice : 
    lastResult ? [lastResult.stockDie, lastResult.actionDie, lastResult.amountDie] : [1, 1, 1];

  return (
    <div className="card text-center">
      <h3 className="text-md font-bold text-gray-900 mb-2">🎲 Dice Roll</h3>
      
      {/* Dice Display */}
      <div className="flex justify-center space-x-2 mb-3">
        {displayDice.map((die, index) => (
          <div
            key={index}
            className={`dice text-2xl ${isRolling ? 'animate-bounce' : ''}`}
            style={{ 
              animationDelay: `${index * 0.1}s`,
              animationDuration: '0.6s'
            }}
          >
            {getDiceDisplay(die)}
          </div>
        ))}
      </div>

      {/* Roll Button */}
      <button
        onClick={onRoll}
        disabled={!canRoll || isRolling || disabled}
        className={`btn-primary px-4 py-2 text-md font-bold ${
          isRolling ? 'animate-pulse' : ''
        }`}
      >
        {isRolling ? '🎲 Rolling...' : '🎲 Roll Dice'}
      </button>

      {/* Last Result Display */}
      {lastResult && !isRolling && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Last Roll Result:</h4>
          <div className="flex items-center justify-center space-x-4 text-sm">
            {/* Stock Affected */}
            <div className="flex items-center space-x-1">
              <span>{getStockEmoji(lastResult.resultStock)}</span>
              <span className="font-medium">
                {lastResult.resultStock.toUpperCase()}
              </span>
            </div>

            {/* Action */}
            <div className="flex items-center space-x-1">
              {(() => {
                const actionDisplay = getActionDisplay(lastResult.resultAction);
                return (
                  <>
                    <span>{actionDisplay.icon}</span>
                    <span className={`font-medium ${actionDisplay.color}`}>
                      {actionDisplay.text}
                    </span>
                  </>
                );
              })()}
            </div>

            {/* Amount */}
            <div className="flex items-center space-x-1">
              <span>💵</span>
              <span className="font-medium">
                {lastResult.resultAmount}¢
              </span>
            </div>
          </div>

          {/* Detailed Explanation */}
          <div className="mt-2 text-xs text-gray-600">
            {(() => {
              const stockName = lastResult.resultStock.toUpperCase();
              const actionDisplay = getActionDisplay(lastResult.resultAction);
              
              if (lastResult.resultAction === DiceAction.DIVIDEND) {
                return `${stockName} pays ${lastResult.resultAmount}¢ dividend per share`;
              } else {
                const direction = lastResult.resultAction === DiceAction.UP ? 'increases' : 'decreases';
                return `${stockName} price ${direction} by ${lastResult.resultAmount}¢`;
              }
            })()}
          </div>
        </div>
      )}

      {/* Status Messages */}
      {!canRoll && !disabled && (
        <div className="mt-4 text-sm text-gray-500">
          Wait for your turn to roll the dice
        </div>
      )}
      
      {disabled && (
        <div className="mt-4 text-sm text-gray-500">
          Game not in rolling phase
        </div>
      )}
    </div>
  );
};

export default DiceRoller;