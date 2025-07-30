import React from 'react';
import { PlayerPortfolio as PlayerPortfolioType, StockType, STOCK_NAMES } from '../types';
import { formatCurrency, formatCurrencyShort, getStockEmoji, getPlayerInitials, generateAvatarColor } from '../utils';

interface PlayerPortfolioProps {
  portfolio: PlayerPortfolioType;
  playerName: string;
  isCurrentPlayer?: boolean;
  isActivePlayer?: boolean;
  onBuyStock?: (stockType: StockType) => void;
  onSellStock?: (stockType: StockType) => void;
  compact?: boolean;
  noCard?: boolean;
}

const PlayerPortfolio: React.FC<PlayerPortfolioProps> = ({
  portfolio,
  playerName,
  isCurrentPlayer = false,
  isActivePlayer = false,
  onBuyStock,
  onSellStock,
  compact = false,
  noCard = false
}) => {
  const stocksOwned = Object.entries(portfolio.stocks).filter(([_, shares]) => shares > 0);
  const totalStocks = Object.values(portfolio.stocks).reduce((sum, shares) => sum + shares, 0);

  if (compact) {
    return (
      <div className={`card ${isActivePlayer ? 'ring-2 ring-blue-500' : ''} ${isCurrentPlayer ? 'bg-blue-50' : ''}`}>
        <div className="flex items-center space-x-3">
          {/* Player Avatar */}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: generateAvatarColor(portfolio.playerId) }}
          >
            {getPlayerInitials(playerName)}
          </div>
          
          {/* Player Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900 truncate">
                {playerName}
                {isCurrentPlayer && <span className="text-blue-600 ml-1">(You)</span>}
              </span>
              {isActivePlayer && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Active
                </span>
              )}
            </div>
            <div className="text-sm text-gray-600">
              {formatCurrencyShort(portfolio.totalValue)} • {totalStocks} shares
            </div>
          </div>
        </div>
      </div>
    );
  }

  const cardClasses = `${isActivePlayer ? 'ring-2 ring-blue-500' : ''} ${isCurrentPlayer ? 'bg-blue-50' : ''}`;
  const content = (
    <>
      {/* Player Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
            style={{ backgroundColor: generateAvatarColor(portfolio.playerId) }}
          >
            {getPlayerInitials(playerName)}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-gray-900">
                {playerName}
                {isCurrentPlayer && <span className="text-blue-600 ml-1">(You)</span>}
              </h3>
              {isActivePlayer && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  🎯 Your Turn
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-lg font-bold text-gray-900">
            {formatCurrency(portfolio.cash)}
          </div>
          <div className="text-sm text-gray-600">Cash</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-lg font-bold text-gray-900">
            {formatCurrency(portfolio.totalValue)}
          </div>
          <div className="text-sm text-gray-600">Total Value</div>
        </div>
      </div>

      {/* Stock Holdings */}
      <div className="mb-4">
        <h4 className="font-medium text-gray-900 mb-2">Stock Holdings</h4>
        {stocksOwned.length > 0 ? (
          <div className="space-y-2">
            {stocksOwned.map(([stockType, shares]) => {
              const typedStockType = stockType as StockType;
              return (
                <div key={stockType} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getStockEmoji(typedStockType)}</span>
                    <span className="font-medium text-sm">
                      {STOCK_NAMES[typedStockType]}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-sm">
                      {shares.toLocaleString()} shares
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500 text-sm">
            No stocks owned
          </div>
        )}
      </div>

      {/* Trading Actions (only for current player) */}
      {isCurrentPlayer && isActivePlayer && (onBuyStock || onSellStock) && (
        <div className="space-y-2">
          <div className="flex space-x-2">
            {onBuyStock && (
              <button
                onClick={() => onBuyStock(StockType.GOLD)} // This will open a stock selection modal
                className="flex-1 btn-primary text-sm py-2"
              >
                💰 Buy Stock
              </button>
            )}
            {onSellStock && stocksOwned.length > 0 && (
              <button
                onClick={() => onSellStock(StockType.GOLD)} // This will open a stock selection modal
                className="flex-1 btn-secondary text-sm py-2"
              >
                💸 Sell Stock
              </button>
            )}
          </div>
        </div>
      )}

      {/* Portfolio Performance */}
      {isCurrentPlayer && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Portfolio Value:</span>
            <span className="font-medium">
              {formatCurrency(portfolio.totalValue - portfolio.cash)}
            </span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-600">Net Worth:</span>
            <span className="font-bold text-lg">
              {formatCurrency(portfolio.totalValue)}
            </span>
          </div>
        </div>
      )}
    </>
  );
  
  if (noCard) {
    return <div className={cardClasses}>{content}</div>;
  }
  
  return <div className={`card ${cardClasses}`}>{content}</div>;
};

export default PlayerPortfolio;