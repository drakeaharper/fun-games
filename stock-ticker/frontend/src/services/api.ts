import axios from 'axios';
import { APIResponse, GameMode, GameState } from '../types';

// Same-origin by default (production: the Worker serves both the app and
// the API). Overridden in development via .env.development.
const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

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
  static async createRoom(name: string, mode: GameMode = GameMode.CLASSIC): Promise<APIResponse<{ roomId: string; inviteCode: string; name: string; mode: GameMode }>> {
    const response = await api.post('/rooms', { name, mode });
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
}

export default APIService;