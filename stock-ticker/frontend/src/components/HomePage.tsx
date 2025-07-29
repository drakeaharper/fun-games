import React, { useState } from 'react';
import { APIService } from '../services/api';
import { validatePlayerName, validateRoomName, validateInviteCode } from '../utils';

interface HomePageProps {
  onRoomJoined: (roomId: string, playerId: string, playerName: string) => void;
}

const HomePage: React.FC<HomePageProps> = ({ onRoomJoined }) => {
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('join');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Create room state
  const [roomName, setRoomName] = useState('');
  const [creatorName, setCreatorName] = useState('');
  
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
      const roomResponse = await APIService.createRoom(roomName);
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
        joinResponse.data!.playerName
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
        response.data!.playerName
      );
      
    } catch (error) {
      console.error('Error joining room:', error);
      setError(error instanceof Error ? error.message : 'Failed to join room');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Stock Ticker</h1>
          <p className="text-gray-600">Classic multiplayer board game</p>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
          <button
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              activeTab === 'join'
                ? 'bg-white text-primary-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setActiveTab('join')}
          >
            Join Game
          </button>
          <button
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              activeTab === 'create'
                ? 'bg-white text-primary-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setActiveTab('create')}
          >
            Create Game
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Join Room Form */}
        {activeTab === 'join' && (
          <form onSubmit={handleJoinRoom} className="space-y-4">
            <div>
              <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-700 mb-1">
                Invite Code
              </label>
              <input
                type="text"
                id="inviteCode"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="ABC123"
                maxLength={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-center text-lg font-mono tracking-wider"
                disabled={isLoading}
                required
              />
            </div>
            
            <div>
              <label htmlFor="playerName" className="block text-sm font-medium text-gray-700 mb-1">
                Your Name
              </label>
              <input
                type="text"
                id="playerName"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                maxLength={20}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                disabled={isLoading}
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-3 text-lg"
            >
              {isLoading ? 'Joining...' : 'Join Game'}
            </button>
          </form>
        )}

        {/* Create Room Form */}
        {activeTab === 'create' && (
          <form onSubmit={handleCreateRoom} className="space-y-4">
            <div>
              <label htmlFor="roomName" className="block text-sm font-medium text-gray-700 mb-1">
                Room Name
              </label>
              <input
                type="text"
                id="roomName"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Family Game Night"
                maxLength={50}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                disabled={isLoading}
                required
              />
            </div>
            
            <div>
              <label htmlFor="creatorName" className="block text-sm font-medium text-gray-700 mb-1">
                Your Name
              </label>
              <input
                type="text"
                id="creatorName"
                value={creatorName}
                onChange={(e) => setCreatorName(e.target.value)}
                placeholder="Enter your name"
                maxLength={20}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                disabled={isLoading}
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-3 text-lg"
            >
              {isLoading ? 'Creating...' : 'Create Game'}
            </button>
          </form>
        )}

        {/* Game Info */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="font-medium text-gray-900 mb-2">How to Play:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Roll dice to affect stock prices</li>
            <li>• Buy and sell stocks to make money</li>
            <li>• Stocks split at $2.00, reset at $0.00</li>
            <li>• First to reach your goal wins!</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default HomePage;