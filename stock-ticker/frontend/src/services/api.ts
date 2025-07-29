import axios from 'axios';
import { APIResponse, GameState, StockType } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for debugging
api.interceptors.request.use((config) => {
  console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`, config.data);
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export class APIService {
  /**
   * Create a new game room
   */
  static async createRoom(name: string): Promise<APIResponse<{ roomId: string; inviteCode: string; name: string }>> {
    const response = await api.post('/rooms', { name });
    return response.data;
  }

  /**
   * Join a room by invite code
   */
  static async joinRoom(inviteCode: string, playerName: string): Promise<APIResponse<{ roomId: string; playerId: string; playerName: string }>> {
    const response = await api.post('/rooms/join', { inviteCode, playerName });
    return response.data;
  }

  /**
   * Start a game
   */
  static async startGame(roomId: string): Promise<APIResponse<{ message: string }>> {
    const response = await api.post(`/rooms/${roomId}/start`);
    return response.data;
  }

  /**
   * Get current game state
   */
  static async getGameState(roomId: string): Promise<APIResponse<GameState>> {
    const response = await api.get(`/games/${roomId}/state`);
    return response.data;
  }

  /**
   * Roll dice
   */
  static async rollDice(roomId: string, playerId: string): Promise<APIResponse<any>> {
    const response = await api.post(`/games/${roomId}/roll-dice`, { playerId });
    return response.data;
  }

  /**
   * Buy stock
   */
  static async buyStock(
    roomId: string, 
    playerId: string, 
    stockType: StockType, 
    shares: number
  ): Promise<APIResponse<{ message: string }>> {
    const response = await api.post(`/games/${roomId}/buy-stock`, {
      playerId,
      stockType,
      shares
    });
    return response.data;
  }

  /**
   * Sell stock
   */
  static async sellStock(
    roomId: string,
    playerId: string,
    stockType: StockType,
    shares: number
  ): Promise<APIResponse<{ message: string }>> {
    const response = await api.post(`/games/${roomId}/sell-stock`, {
      playerId,
      stockType,
      shares
    });
    return response.data;
  }

  /**
   * End turn
   */
  static async endTurn(roomId: string): Promise<APIResponse<{ message: string }>> {
    const response = await api.post(`/games/${roomId}/end-turn`);
    return response.data;
  }
}

export default APIService;