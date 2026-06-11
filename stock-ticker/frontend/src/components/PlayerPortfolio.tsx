import React from 'react';
import { PlayerPortfolio as PlayerPortfolioType } from '../types';
import { formatCurrencyShort } from '../utils';
import PlayerAvatar from './PlayerAvatar';

interface PlayerPortfolioProps {
  portfolio: PlayerPortfolioType;
  playerName: string;
  isCurrentPlayer?: boolean;
  isActivePlayer?: boolean;
}

const PlayerPortfolio: React.FC<PlayerPortfolioProps> = ({
  portfolio,
  playerName,
  isCurrentPlayer = false,
  isActivePlayer = false
}) => {
  const totalStocks = Object.values(portfolio.stocks).reduce((sum, shares) => sum + shares, 0);

  return (
    <div className={`card ${isActivePlayer ? 'ring-2 ring-blue-500' : ''} ${isCurrentPlayer ? 'bg-blue-50' : ''}`}>
      <div className="flex items-center space-x-3">
        {/* Player Avatar */}
        <PlayerAvatar
          playerName={playerName}
          playerId={portfolio.playerId}
          size={32}
        />

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
};

export default PlayerPortfolio;
