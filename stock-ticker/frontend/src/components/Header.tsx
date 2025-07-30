import React from 'react';

interface HeaderProps {
  showGameInfo?: boolean;
  gameInfo?: {
    roomCode?: string;
    playerCount?: number;
  };
}

const Header: React.FC<HeaderProps> = ({ showGameInfo, gameInfo }) => {
  return (
    <header style={{
      background: 'linear-gradient(135deg, var(--st-primary-blue) 0%, var(--st-primary-blue-dark) 100%)',
      color: 'white',
      padding: '1.5rem 0',
      boxShadow: '0 4px 12px rgba(30, 58, 138, 0.2)',
      flexShrink: 0,
      position: 'relative'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        {/* Left side - Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ fontSize: '2rem' }}>📈</div>
          <div>
            <h1 style={{ 
              fontSize: '1.75rem', 
              fontWeight: 'bold', 
              margin: 0,
              letterSpacing: '-0.025em',
              fontFamily: 'Georgia, serif',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
            }}>
              Stock Ticker Game
            </h1>
            <p style={{ 
              fontSize: '0.9rem', 
              margin: 0, 
              opacity: 0.9,
              fontWeight: '300',
              fontFamily: 'Georgia, serif',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'
            }}>
              Classic 1937 Board Game Experience
            </p>
          </div>
        </div>

        {/* Right side - Game Info */}
        {showGameInfo && gameInfo && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1.5rem',
            fontSize: '0.875rem'
          }}>
            {gameInfo.roomCode && (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'flex-end' 
              }}>
                <span style={{ opacity: 0.8, fontSize: '0.75rem' }}>Room Code</span>
                <span style={{ 
                  fontWeight: 'bold', 
                  fontSize: '1rem',
                  letterSpacing: '0.1em'
                }}>
                  {gameInfo.roomCode}
                </span>
              </div>
            )}
            {gameInfo.playerCount !== undefined && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                background: 'linear-gradient(135deg, rgba(217, 119, 6, 0.9), rgba(146, 64, 14, 0.9))',
                padding: '0.6rem 1.2rem',
                borderRadius: '1rem',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
              }}>
                <span style={{ fontSize: '1rem' }}>👥</span>
                <span style={{ fontWeight: '600' }}>
                  {gameInfo.playerCount} Player{gameInfo.playerCount !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;