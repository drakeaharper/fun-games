import React, { useState, useEffect } from 'react';
import { StockType, StockPrice, STOCK_NAMES, SHARE_LOTS } from '../types';
import { formatCurrency, getStockEmoji } from '../utils';

interface TradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'buy' | 'sell';
  stocks: StockPrice[];
  playerCash: number;
  playerStocks: Record<StockType, number>;
  onTrade: (stockType: StockType, shares: number) => void;
  isLoading?: boolean;
}

const TradingModal: React.FC<TradingModalProps> = ({
  isOpen,
  onClose,
  mode,
  stocks,
  playerCash,
  playerStocks,
  onTrade,
  isLoading = false
}) => {
  const [selectedStock, setSelectedStock] = useState<StockType | null>(null);
  const [selectedShares, setSelectedShares] = useState<number>(500);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedStock(null);
      setSelectedShares(500);
      setError(null);
    }
  }, [isOpen]);

  // Validate trade when selection changes
  useEffect(() => {
    if (selectedStock) {
      validateTrade();
    }
  }, [selectedStock, selectedShares, mode]);

  const validateTrade = () => {
    setError(null);
    
    if (!selectedStock) return;

    const stock = stocks.find(s => s.stockType === selectedStock);
    if (!stock) return;

    if (mode === 'buy') {
      const totalCost = selectedShares * stock.currentPrice;
      if (totalCost > playerCash) {
        setError(`Insufficient funds. Need ${formatCurrency(totalCost)}, have ${formatCurrency(playerCash)}`);
        return;
      }
    } else {
      const currentShares = playerStocks[selectedStock] || 0;
      if (selectedShares > currentShares) {
        setError(`Not enough shares. You own ${currentShares} shares of ${STOCK_NAMES[selectedStock]}`);
        return;
      }
    }
  };

  const handleTrade = () => {
    if (!selectedStock || error || isLoading) return;
    
    onTrade(selectedStock, selectedShares);
  };

  const getAvailableStocks = () => {
    if (mode === 'buy') {
      return stocks;
    } else {
      // For selling, only show stocks the player owns
      return stocks.filter(stock => (playerStocks[stock.stockType] || 0) > 0);
    }
  };

  const getMaxAffordableShares = (stock: StockPrice): number => {
    if (mode === 'buy') {
      const maxByMoney = Math.floor(playerCash / stock.currentPrice);
      // Find the largest share lot that's affordable
      const affordableLots = SHARE_LOTS.filter(lot => lot <= maxByMoney);
      return affordableLots.length > 0 ? Math.max(...affordableLots) : 0;
    } else {
      const ownedShares = playerStocks[stock.stockType] || 0;
      // Find the largest share lot that doesn't exceed owned shares
      const sellableLots = SHARE_LOTS.filter(lot => lot <= ownedShares);
      return sellableLots.length > 0 ? Math.max(...sellableLots) : 0;
    }
  };

  const getAvailableShareLots = (stock: StockPrice): number[] => {
    const maxShares = getMaxAffordableShares(stock);
    return SHARE_LOTS.filter(lot => lot <= maxShares);
  };

  if (!isOpen) return null;

  const availableStocks = getAvailableStocks();
  const selectedStockData = selectedStock ? stocks.find(s => s.stockType === selectedStock) : null;
  const totalCost = selectedStockData ? selectedShares * selectedStockData.currentPrice : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-screen overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {mode === 'buy' ? '💰 Buy Stock' : '💸 Sell Stock'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
            disabled={isLoading}
          >
            ×
          </button>
        </div>

        <div className="p-6">
          {/* Stock Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Stock
            </label>
            <div className="grid grid-cols-1 gap-2">
              {availableStocks.map((stock) => {
                const maxShares = getMaxAffordableShares(stock);
                const canTrade = maxShares > 0;
                
                return (
                  <button
                    key={stock.stockType}
                    onClick={() => setSelectedStock(stock.stockType)}
                    disabled={!canTrade || isLoading}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      selectedStock === stock.stockType
                        ? 'border-blue-500 bg-blue-50'
                        : canTrade
                        ? 'border-gray-200 hover:border-gray-300'
                        : 'border-gray-100 bg-gray-50 opacity-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getStockEmoji(stock.stockType)}</span>
                        <div>
                          <div className="font-medium text-sm">
                            {STOCK_NAMES[stock.stockType]}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatCurrency(stock.currentPrice)} per share
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        {mode === 'sell' && (
                          <div className="text-xs text-gray-600">
                            Own: {(playerStocks[stock.stockType] || 0).toLocaleString()}
                          </div>
                        )}
                        {!canTrade && (
                          <div className="text-xs text-red-500">
                            {mode === 'buy' ? 'Can\'t afford' : 'None owned'}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            
            {availableStocks.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                {mode === 'buy' 
                  ? 'No stocks available (insufficient funds)' 
                  : 'No stocks to sell (you don\'t own any stocks)'}
              </div>
            )}
          </div>

          {/* Share Amount Selection */}
          {selectedStock && selectedStockData && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Shares
              </label>
              <div className="grid grid-cols-2 gap-2">
                {getAvailableShareLots(selectedStockData).map((lot) => (
                  <button
                    key={lot}
                    onClick={() => setSelectedShares(lot)}
                    disabled={isLoading}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedShares === lot
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">{lot.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">shares</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Transaction Summary */}
          {selectedStock && selectedStockData && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Transaction Summary</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Stock:</span>
                  <span className="font-medium">
                    {getStockEmoji(selectedStock)} {STOCK_NAMES[selectedStock]}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Shares:</span>
                  <span className="font-medium">{selectedShares.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Price per share:</span>
                  <span className="font-medium">{formatCurrency(selectedStockData.currentPrice)}</span>
                </div>
                <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-200">
                  <span>Total:</span>
                  <span className={mode === 'buy' ? 'text-red-600' : 'text-green-600'}>
                    {mode === 'buy' ? '-' : '+'}{formatCurrency(totalCost)}
                  </span>
                </div>
                {mode === 'buy' && (
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Remaining cash:</span>
                    <span>{formatCurrency(playerCash - totalCost)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 btn-secondary py-3"
            >
              Cancel
            </button>
            <button
              onClick={handleTrade}
              disabled={!selectedStock || !!error || isLoading}
              className="flex-1 btn-primary py-3"
            >
              {isLoading 
                ? '⏳ Processing...' 
                : `${mode === 'buy' ? '💰 Buy' : '💸 Sell'} ${selectedShares ? selectedShares.toLocaleString() : ''} Shares`
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradingModal;