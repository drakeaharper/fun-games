import React from 'react';
import { StockPrice } from '../types';
import { formatCurrency, getStockEmoji, formatPriceChange } from '../utils';

interface StockCardProps {
  stock: StockPrice;
  playerShares?: number;
  isSelected?: boolean;
  priceChange?: number;
  onClick?: () => void;
  disabled?: boolean;
}

const StockCard: React.FC<StockCardProps> = ({
  stock,
  playerShares = 0,
  isSelected = false,
  priceChange = 0,
  onClick,
  disabled = false
}) => {
  const stockName = stock.stockType.charAt(0).toUpperCase() + stock.stockType.slice(1);
  const emoji = getStockEmoji(stock.stockType);
  const priceChangeFormatted = formatPriceChange(priceChange);
  
  // Determine card styling based on price movement and stock type
  const getCardClass = () => {
    const stockClass = stock.stockType.toLowerCase();
    let baseClass = `stock-card ${stockClass} ${
      disabled ? 'opacity-50 cursor-not-allowed' : ''
    } ${isSelected ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`;
    
    if (priceChange > 0) {
      return `${baseClass} border-green-500`;
    } else if (priceChange < 0) {
      return `${baseClass} border-red-500`;
    } else {
      return baseClass;
    }
  };

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
    }
  };

  return (
    <div 
      className={getCardClass()}
      onClick={handleClick}
      style={{ minHeight: '80px' }}
    >
      {/* Stock Header */}
      <div className="flex items-center space-x-1 mb-1">
        <span className="text-lg">{emoji}</span>
        <h3 className="font-bold text-gray-900 text-xs">{stockName}</h3>
      </div>
      
      {/* Price Below */}
      <div className="text-center">
        <div className="text-lg font-bold text-gray-900">
          {formatCurrency(stock.currentPrice)}
        </div>
        {priceChange !== 0 && (
          <div className={`text-xs ${priceChangeFormatted.className}`}>
            {priceChange > 0 ? '↗' : '↘'} {priceChangeFormatted.text}
          </div>
        )}
      </div>

      {/* Player Holdings - Compact */}
      {playerShares > 0 && (
        <div className="mt-1 pt-1 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">Own: {playerShares.toLocaleString()}</span>
            <span className="font-medium text-gray-900">
              {formatCurrency(playerShares * stock.currentPrice)}
            </span>
          </div>
        </div>
      )}

      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full"></div>
      )}
    </div>
  );
};

export default StockCard;