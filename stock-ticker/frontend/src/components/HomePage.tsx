import React, { useState } from 'react';
import { APIService } from '../services/api';
import { GameMode, EndConditionType } from '../types';
import { validatePlayerName, validateRoomName, validateInviteCode } from '../utils';

const GAME_MODE_OPTIONS = [
  { mode: GameMode.CLASSIC, icon: '🎲', title: 'Classic', description: 'Take turns rolling the dice' },
  { mode: GameMode.AUTO, icon: '⚡', title: 'Auto-Roll', description: 'Dice roll on a timer — trade anytime' }
];

const CASH_OPTIONS = [
  { label: '$2,500', value: 250000 },
  { label: '$5,000', value: 500000 },
  { label: '$10,000', value: 1000000 }
];

const SPEED_OPTIONS = [
  { label: '3s', value: 3000 },
  { label: '5s', value: 5000 },
  { label: '10s', value: 10000 }
];

const END_TYPE_OPTIONS: Array<{ label: string; value: EndConditionType }> = [
  { label: 'Endless', value: 'none' },
  { label: 'Timed', value: 'time' },
  { label: 'Target $', value: 'networth' },
  { label: 'Roll limit', value: 'rolls' }
];

const END_VALUE_OPTIONS: Record<Exclude<EndConditionType, 'none'>, Array<{ label: string; value: number }>> = {
  time: [
    { label: '10 min', value: 10 },
    { label: '20 min', value: 20 },
    { label: '30 min', value: 30 }
  ],
  networth: [
    { label: '$10,000', value: 1000000 },
    { label: '$25,000', value: 2500000 },
    { label: '$50,000', value: 5000000 }
  ],
  rolls: [
    { label: '30', value: 30 },
    { label: '60', value: 60 },
    { label: '100', value: 100 }
  ]
};

const END_VALUE_DEFAULTS: Record<Exclude<EndConditionType, 'none'>, number> = {
  time: 20,
  networth: 2500000,
  rolls: 60
};

const END_VALUE_LABELS: Record<Exclude<EndConditionType, 'none'>, string> = {
  time: 'Duration',
  networth: 'Target',
  rolls: 'Rolls'
};

interface SettingRowProps {
  label: string;
  options: Array<{ label: string; value: number | string }>;
  value: number | string;
  onSelect: (value: any) => void;
  disabled: boolean;
}

const SettingRow: React.FC<SettingRowProps> = ({ label, options, value, onSelect, disabled }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
    <span className="text-sm font-bold" style={{ color: 'var(--st-gray-700)' }}>{label}</span>
    <div className="lot-selector">
      {options.map((option) => (
        <button
          type="button"
          key={String(option.value)}
          className={`lot-btn ${value === option.value ? 'active' : ''}`}
          onClick={() => onSelect(option.value)}
          disabled={disabled}
        >
          {option.label}
        </button>
      ))}
    </div>
  </div>
);

interface HomePageProps {
  onRoomJoined: (roomId: string, playerId: string, playerName: string, inviteCode: string) => void;
}

const HomePage: React.FC<HomePageProps> = ({ onRoomJoined }) => {
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('join');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create room state
  const [roomName, setRoomName] = useState('');
  const [creatorName, setCreatorName] = useState('');
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.CLASSIC);
  const [startingCash, setStartingCash] = useState(500000);
  const [rollInterval, setRollInterval] = useState(5000);
  const [endType, setEndType] = useState<EndConditionType>('none');
  const [endValue, setEndValue] = useState(0);

  const handleEndTypeSelect = (type: EndConditionType) => {
    setEndType(type);
    setEndValue(type === 'none' ? 0 : END_VALUE_DEFAULTS[type]);
  };

  // Join room state
  const [inviteCode, setInviteCode] = useState('');
  const [playerName, setPlayerName] = useState('');

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate inputs
    const roomValidation = validateRoomName(roomName);
    if (!roomValidation.valid) {
      setError(roomValidation.error!);
      return;
    }

    const nameValidation = validatePlayerName(creatorName);
    if (!nameValidation.valid) {
      setError(nameValidation.error!);
      return;
    }

    setIsLoading(true);

    try {
      // Create room
      const roomResponse = await APIService.createRoom(roomName, gameMode, {
        rollIntervalMs: rollInterval,
        startingCash,
        endType,
        endValue
      });
      if (!roomResponse.success) {
        throw new Error(roomResponse.error?.message || 'Failed to create room');
      }

      // Join the created room
      const joinResponse = await APIService.joinRoom(roomResponse.data!.inviteCode, creatorName);
      if (!joinResponse.success) {
        throw new Error(joinResponse.error?.message || 'Failed to join room');
      }

      // Success - notify parent component
      onRoomJoined(
        joinResponse.data!.roomId,
        joinResponse.data!.playerId,
        joinResponse.data!.playerName,
        roomResponse.data!.inviteCode
      );

    } catch (error) {
      console.error('Error creating room:', error);
      setError(error instanceof Error ? error.message : 'Failed to create room');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate inputs
    const codeValidation = validateInviteCode(inviteCode);
    if (!codeValidation.valid) {
      setError(codeValidation.error!);
      return;
    }

    const nameValidation = validatePlayerName(playerName);
    if (!nameValidation.valid) {
      setError(nameValidation.error!);
      return;
    }

    setIsLoading(true);

    try {
      const response = await APIService.joinRoom(inviteCode.trim().toUpperCase(), playerName.trim());
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to join room');
      }

      // Success - notify parent component
      onRoomJoined(
        response.data!.roomId,
        response.data!.playerId,
        response.data!.playerName,
        inviteCode.trim().toUpperCase()
      );

    } catch (error) {
      console.error('Error joining room:', error);
      setError(error instanceof Error ? error.message : 'Failed to join room');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-gradient" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      flexGrow: 1
    }}>
      <div className="card" style={{ maxWidth: '500px', width: '100%' }}>
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">📈</div>
          <h1 className="text-4xl font-bold mb-3" style={{ color: 'var(--st-primary-blue)' }}>
            Stock Ticker
          </h1>
          <p className="text-lg" style={{ color: 'var(--st-gray-700)' }}>
            Classic 1937 Investment Game
          </p>
          <div style={{
            marginTop: '1.5rem',
            marginBottom: '1rem',
            padding: '1rem 2rem',
            borderRadius: '1rem',
            background: 'linear-gradient(135deg, var(--st-gold-light) 0%, var(--st-gold) 100%)',
            border: '2px solid var(--st-gold-dark)',
            boxShadow: '0 4px 8px rgba(217, 119, 6, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
            color: 'white',
            fontSize: '1rem',
            fontWeight: 'bold',
            textAlign: 'center',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '2px',
              background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)'
            }} />
            🏛️ Build Your Financial Empire
          </div>
        </div>

        {/* Tab Selection */}
        <div style={{
          display: 'flex',
          background: 'linear-gradient(145deg, var(--st-gray-100) 0%, var(--st-gray-200) 100%)',
          border: '2px solid var(--st-gray-300)',
          borderRadius: '0.75rem',
          padding: '0.5rem',
          gap: '0.5rem',
          marginBottom: '1rem'
        }}>
          <button
            style={{
              flex: 1,
              padding: '1rem 1.5rem',
              borderRadius: '0.5rem',
              fontWeight: 'bold',
              fontSize: '1rem',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              background: activeTab === 'join'
                ? 'linear-gradient(135deg, var(--st-primary-blue) 0%, var(--st-primary-blue-dark) 100%)'
                : 'transparent',
              color: activeTab === 'join' ? 'white' : 'var(--st-gray-700)',
              boxShadow: activeTab === 'join' ? '0 2px 4px rgba(30, 58, 138, 0.3)' : 'none',
              transform: activeTab === 'join' ? 'translateY(-1px)' : 'none'
            }}
            onClick={() => setActiveTab('join')}
          >
            🎯 Join Game
          </button>
          <button
            style={{
              flex: 1,
              padding: '1rem 1.5rem',
              borderRadius: '0.5rem',
              fontWeight: 'bold',
              fontSize: '1rem',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              background: activeTab === 'create'
                ? 'linear-gradient(135deg, var(--st-gold) 0%, var(--st-gold-dark) 100%)'
                : 'transparent',
              color: activeTab === 'create' ? 'white' : 'var(--st-gray-700)',
              boxShadow: activeTab === 'create' ? '0 2px 4px rgba(217, 119, 6, 0.3)' : 'none',
              transform: activeTab === 'create' ? 'translateY(-1px)' : 'none'
            }}
            onClick={() => setActiveTab('create')}
          >
            🏗️ Create Game
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 rounded-lg" style={{
            backgroundColor: 'var(--st-salmon)',
            border: '2px solid var(--st-red)',
            borderRadius: '0.75rem'
          }}>
            <div className="flex items-center gap-3">
              <div className="text-2xl">⚠️</div>
              <div>
                <h4 className="font-bold mb-1" style={{ color: 'var(--st-red)' }}>Trading Error</h4>
                <p className="font-medium" style={{ color: 'var(--st-red)', fontSize: '0.875rem' }}>{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Join Room Form */}
        {activeTab === 'join' && (
          <form onSubmit={handleJoinRoom} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label htmlFor="inviteCode" className="block text-sm font-bold mb-2" style={{ color: 'var(--st-gray-700)' }}>
                📧 Trading Room Code
              </label>
              <input
                type="text"
                id="inviteCode"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="ABC123"
                maxLength={6}
                className="form-input text-center text-xl font-bold tracking-widest"
                style={{
                  letterSpacing: '0.2em',
                  fontSize: '1.25rem',
                  padding: '1rem'
                }}
                disabled={isLoading}
                required
              />
            </div>

            <div>
              <label htmlFor="playerName" className="block text-sm font-bold mb-2" style={{ color: 'var(--st-gray-700)' }}>
                👤 Investor Name
              </label>
              <input
                type="text"
                id="playerName"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                maxLength={20}
                className="form-input"
                style={{
                  fontSize: '1rem',
                  padding: '1rem'
                }}
                disabled={isLoading}
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary py-4 text-lg font-bold"
              style={{
                marginTop: '1rem'
              }}
            >
              {isLoading ? '🔄 Joining Trading Floor...' : '🚀 Join Trading Session'}
            </button>
          </form>
        )}

        {/* Create Room Form */}
        {activeTab === 'create' && (
          <form onSubmit={handleCreateRoom} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label htmlFor="roomName" className="block text-sm font-bold mb-2" style={{ color: 'var(--st-gray-700)' }}>
                🏛️ Trading Floor Name
              </label>
              <input
                type="text"
                id="roomName"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Family Investment Club"
                maxLength={50}
                className="form-input"
                style={{
                  fontSize: '1rem',
                  padding: '1rem'
                }}
                disabled={isLoading}
                required
              />
            </div>

            <div>
              <label htmlFor="creatorName" className="block text-sm font-bold mb-2" style={{ color: 'var(--st-gray-700)' }}>
                👑 Host Name
              </label>
              <input
                type="text"
                id="creatorName"
                value={creatorName}
                onChange={(e) => setCreatorName(e.target.value)}
                placeholder="Enter your name"
                maxLength={20}
                className="form-input"
                style={{
                  fontSize: '1rem',
                  padding: '1rem'
                }}
                disabled={isLoading}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: 'var(--st-gray-700)' }}>
                🎮 Game Mode
              </label>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {GAME_MODE_OPTIONS.map((option) => (
                  <button
                    type="button"
                    key={option.mode}
                    onClick={() => setGameMode(option.mode)}
                    disabled={isLoading}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      borderRadius: '0.75rem',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.2s ease',
                      border: gameMode === option.mode ? '2px solid var(--st-primary-blue)' : '2px solid var(--st-gray-300)',
                      background: gameMode === option.mode
                        ? 'linear-gradient(145deg, #eff6ff 0%, #dbeafe 100%)'
                        : 'white',
                      boxShadow: gameMode === option.mode ? '0 2px 4px rgba(30, 58, 138, 0.2)' : 'none'
                    }}
                  >
                    <div style={{ fontSize: '1.5rem' }}>{option.icon}</div>
                    <div style={{ fontWeight: 'bold', color: 'var(--st-gray-900)' }}>{option.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--st-gray-600)' }}>{option.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: 'var(--st-gray-700)' }}>
                ⚙️ Game Settings
              </label>
              <div style={{
                border: '1px solid var(--st-gray-300)',
                borderRadius: '0.75rem',
                padding: '0.75rem 1rem',
                background: 'rgba(255, 255, 255, 0.5)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                <SettingRow
                  label="Starting Cash"
                  options={CASH_OPTIONS}
                  value={startingCash}
                  onSelect={setStartingCash}
                  disabled={isLoading}
                />
                {gameMode === GameMode.AUTO && (
                  <SettingRow
                    label="Roll Speed"
                    options={SPEED_OPTIONS}
                    value={rollInterval}
                    onSelect={setRollInterval}
                    disabled={isLoading}
                  />
                )}
                <SettingRow
                  label="Game End"
                  options={END_TYPE_OPTIONS}
                  value={endType}
                  onSelect={handleEndTypeSelect}
                  disabled={isLoading}
                />
                {endType !== 'none' && (
                  <SettingRow
                    label={END_VALUE_LABELS[endType]}
                    options={END_VALUE_OPTIONS[endType]}
                    value={endValue}
                    onSelect={setEndValue}
                    disabled={isLoading}
                  />
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-gold py-4 text-lg font-bold"
              style={{
                marginTop: '1rem'
              }}
            >
              {isLoading ? '🔄 Opening Trading Floor...' : '🏗️ Create Trading Session'}
            </button>
          </form>
        )}

        {/* Game Info */}
        <div className="mt-8 pt-6" style={{ borderTop: '2px solid var(--st-gold)', borderImage: 'linear-gradient(90deg, transparent, var(--st-gold), transparent) 1' }}>
          <div className="text-center mb-4">
            <h3 className="font-bold text-lg" style={{ color: 'var(--st-primary-blue)' }}>
              📊 Quick Start Guide
            </h3>
          </div>
          <div style={{
            background: 'linear-gradient(145deg, var(--st-cream) 0%, #fefbf3 100%)',
            border: '1px solid var(--st-cream-dark)',
            borderRadius: '0.75rem',
            padding: '1rem'
          }}>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li className="flex items-center gap-2" style={{ color: 'var(--st-gray-700)' }}>
                <span style={{ color: 'var(--st-gold)' }}>🎲</span>
                <span className="font-medium">Roll dice to move stock prices</span>
              </li>
              <li className="flex items-center gap-2" style={{ color: 'var(--st-gray-700)' }}>
                <span style={{ color: 'var(--st-primary-blue)' }}>💰</span>
                <span className="font-medium">Trade stocks to build wealth</span>
              </li>
              <li className="flex items-center gap-2" style={{ color: 'var(--st-gray-700)' }}>
                <span style={{ color: 'var(--st-green)' }}>📈</span>
                <span className="font-medium">Stocks split at $2.00, reset at $0.00</span>
              </li>
              <li className="flex items-center gap-2" style={{ color: 'var(--st-gray-700)' }}>
                <span style={{ color: 'var(--st-gold)' }}>🏆</span>
                <span className="font-medium">First to reach investment goal wins!</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;