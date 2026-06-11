import React, { useState } from 'react';
import { StockType, StockPrice, SHARE_LOTS } from '../types';
import { formatCurrency, getStockEmoji } from '../utils';

interface TradingPanelProps {
  stocks: StockPrice[];
  playerCash: number;
  playerStocks: Record<StockType, number>;
  /** When false, all Buy/Sell buttons are disabled (not your turn / not trading phase) */
  canTrade: boolean;
  onTrade: (mode: 'buy' | 'sell', stockType: StockType, shares: number) => void;
}

const TradingPanel: React.FC<TradingPanelProps> = ({
  stocks,
  playerCash,
  playerStocks,
  canTrade,
  onTrade
}) => {
  const [tradeLot, setTradeLot] = useState<number>(SHARE_LOTS[0]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {/* Lot size selector */}
      <div className="lot-selector" style={{ justifyContent: 'flex-end' }}>
        <span className="text-sm text-gray-600" style={{ marginRight: '0.25rem' }}>Shares:</span>
        {SHARE_LOTS.map((lot) => (
          <button
            key={lot}
            className={`lot-btn ${tradeLot === lot ? 'active' : ''}`}
            onClick={() => setTradeLot(lot)}
          >
            {lot.toLocaleString()}
          </button>
        ))}
      </div>

      {/* One row per stock, Buy/Sell always visible on the right */}
      {stocks.map((stock) => {
        const playerShares = playerStocks[stock.stockType] || 0;
        const canBuy = canTrade && playerCash >= stock.currentPrice * tradeLot;
        const canSell = canTrade && playerShares >= tradeLot;

        return (
          <div
            key={stock.stockType}
            className="w-full text-xs"
            style={{
              border: '1px solid var(--st-gray-200)',
              borderRadius: '0.5rem',
              background: 'rgba(255, 255, 255, 0.5)',
              padding: '0.5rem 0.75rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '0.75rem',
              flexShrink: 0
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.125rem' }}>{getStockEmoji(stock.stockType)}</span>
              <span className="font-medium">
                {stock.stockType.charAt(0).toUpperCase() + stock.stockType.slice(1)}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ textAlign: 'right' }}>
                <div className="font-bold">{formatCurrency(stock.currentPrice)}</div>
                {playerShares > 0 && (
                  <div className="text-gray-500">Own: {playerShares.toLocaleString()}</div>
                )}
              </div>

              <button
                className="btn-trade buy"
                disabled={!canBuy}
                onClick={() => onTrade('buy', stock.stockType, tradeLot)}
                title={canBuy
                  ? `Buy ${tradeLot.toLocaleString()} for ${formatCurrency(stock.currentPrice * tradeLot)}`
                  : `Can't buy ${tradeLot.toLocaleString()} shares`}
              >
                Buy
              </button>
              <button
                className="btn-trade sell"
                disabled={!canSell}
                onClick={() => onTrade('sell', stock.stockType, tradeLot)}
                title={canSell
                  ? `Sell ${tradeLot.toLocaleString()} for ${formatCurrency(stock.currentPrice * tradeLot)}`
                  : `Can't sell ${tradeLot.toLocaleString()} shares`}
              >
                Sell
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TradingPanel;
