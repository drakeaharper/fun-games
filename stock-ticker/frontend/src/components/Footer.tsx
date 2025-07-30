import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer style={{
      background: 'linear-gradient(135deg, var(--st-gray-800) 0%, var(--st-gray-900) 100%)',
      color: 'var(--st-cream)',
      padding: '2rem 0 1rem 0',
      marginTop: 'auto',
      flexShrink: 0,
      fontFamily: 'Georgia, serif'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 1rem'
      }}>
        {/* Main Footer Content */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '2rem',
          marginBottom: '2rem'
        }}>
          {/* About Section */}
          <div>
            <h3 style={{ 
              fontSize: '1.125rem', 
              fontWeight: 'bold', 
              marginBottom: '0.75rem',
              color: '#e2e8f0'
            }}>
              About Stock Ticker
            </h3>
            <p style={{ 
              fontSize: '0.875rem', 
              lineHeight: '1.5',
              color: '#cbd5e0',
              margin: 0
            }}>
              Experience the classic 1937 board game digitally. Buy and sell stocks, 
              roll the dice, and watch market prices fluctuate in this timeless 
              family game brought to the web.
            </p>
          </div>

          {/* Game Rules */}
          <div>
            <h3 style={{ 
              fontSize: '1.125rem', 
              fontWeight: 'bold', 
              marginBottom: '0.75rem',
              color: '#e2e8f0'
            }}>
              How to Play
            </h3>
            <ul style={{ 
              fontSize: '0.875rem', 
              color: '#cbd5e0',
              listStyle: 'none',
              padding: 0,
              margin: 0,
              lineHeight: '1.6'
            }}>
              <li style={{ marginBottom: '0.25rem' }}>🎲 Roll dice to affect stock prices</li>
              <li style={{ marginBottom: '0.25rem' }}>💰 Buy stocks when prices are low</li>
              <li style={{ marginBottom: '0.25rem' }}>📈 Sell when prices rise</li>
              <li style={{ marginBottom: '0.25rem' }}>🏆 Build the highest net worth to win</li>
            </ul>
          </div>

          {/* Features */}
          <div>
            <h3 style={{ 
              fontSize: '1.125rem', 
              fontWeight: 'bold', 
              marginBottom: '0.75rem',
              color: '#e2e8f0'
            }}>
              Features
            </h3>
            <ul style={{ 
              fontSize: '0.875rem', 
              color: '#cbd5e0',
              listStyle: 'none',
              padding: 0,
              margin: 0,
              lineHeight: '1.6'
            }}>
              <li style={{ marginBottom: '0.25rem' }}>🌐 Real-time multiplayer</li>
              <li style={{ marginBottom: '0.25rem' }}>📱 Responsive design</li>
              <li style={{ marginBottom: '0.25rem' }}>🎮 Classic game mechanics</li>
              <li style={{ marginBottom: '0.25rem' }}>⚡ Instant game updates</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{
          borderTop: '1px solid #4a5568',
          paddingTop: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          fontSize: '0.875rem',
          color: '#a0aec0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>© 2024 Stock Ticker Game</span>
            <span>•</span>
            <span>Built with React & Node.js</span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              Made with <span style={{ color: '#f56565' }}>❤️</span> for family game night
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;