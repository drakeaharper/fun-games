import React, { useState } from 'react';
import { generateAvatarFromName, getPlayerInitials, generateAvatarColor } from '../utils';

interface PlayerAvatarProps {
  playerName: string;
  playerId: string;
  size?: number;
  isHost?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const PlayerAvatar: React.FC<PlayerAvatarProps> = ({
  playerName,
  playerId,
  size = 48,
  isHost = false,
  className = '',
  style = {}
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const gravatarUrl = generateAvatarFromName(playerName, size);
  const fallbackColor = generateAvatarColor(playerId);
  const initials = getPlayerInitials(playerName);

  const handleImageError = () => {
    setImageError(true);
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const baseStyle: React.CSSProperties = {
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: `${size * 0.35}px`,
    fontWeight: 'bold',
    fontFamily: 'Georgia, serif',
    border: `3px solid ${isHost ? 'var(--st-gold)' : 'var(--st-primary-blue)'}`,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
    position: 'relative',
    overflow: 'hidden',
    ...style
  };

  return (
    <div className={className} style={baseStyle}>
      {!imageError && (
        <>
          <img
            src={gravatarUrl}
            alt={`${playerName}'s avatar`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: imageLoaded ? 1 : 0,
              transition: 'opacity 0.3s ease'
            }}
            onError={handleImageError}
            onLoad={handleImageLoad}
          />
          {!imageLoaded && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: fallbackColor,
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
              }}
            >
              {initials}
            </div>
          )}
        </>
      )}
      
      {imageError && (
        <div
          style={{
            backgroundColor: fallbackColor,
            color: 'white',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
          }}
        >
          {initials}
        </div>
      )}

      {/* Host crown indicator */}
      {isHost && (
        <div
          style={{
            position: 'absolute',
            top: '-6px',
            right: '-6px',
            background: 'linear-gradient(135deg, var(--st-gold) 0%, var(--st-gold-dark) 100%)',
            borderRadius: '50%',
            width: `${size * 0.35}px`,
            height: `${size * 0.35}px`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: `${size * 0.2}px`,
            border: '2px solid white',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
          }}
        >
          👑
        </div>
      )}
    </div>
  );
};

export default PlayerAvatar;