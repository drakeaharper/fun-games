import io from 'socket.io-client';
import { WebSocketEvents, StockType } from '../types';

const WEBSOCKET_URL = process.env.REACT_APP_WEBSOCKET_URL || 'http://localhost:3001';

export class WebSocketService {
  private socket: any = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 1000;

  /**
   * Connect to WebSocket server
   */
  connect(): any {
    if (this.socket?.connected) {
      return this.socket;
    }

    console.log('🔌 Connecting to WebSocket server...');
    
    this.socket = io(WEBSOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectInterval,
    });

    this.setupEventHandlers();
    return this.socket;
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      console.log('🔌 Disconnecting from WebSocket server...');
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Get current socket instance
   */
  getSocket(): any {
    return this.socket;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Setup basic event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Connected to WebSocket server');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('❌ Disconnected from WebSocket server:', reason);
    });

    this.socket.on('reconnect', (attemptNumber: number) => {
      console.log(`🔄 Reconnected after ${attemptNumber} attempts`);
      this.reconnectAttempts = 0;
    });

    this.socket.on('reconnect_attempt', (attemptNumber: number) => {
      console.log(`🔄 Reconnection attempt ${attemptNumber}`);
      this.reconnectAttempts = attemptNumber;
    });

    this.socket.on('reconnect_failed', () => {
      console.error('❌ Failed to reconnect to WebSocket server');
    });

    this.socket.on('error', (error: any) => {
      console.error('❌ WebSocket error:', error);
    });
  }

  /**
   * Join a game room
   */
  joinRoom(roomId: string, playerId: string, playerName: string): void {
    if (!this.socket) {
      throw new Error('WebSocket not connected');
    }
    
    console.log(`👤 Joining room ${roomId} as ${playerName}`);
    this.socket.emit('join-room', { roomId, playerId, playerName });
  }

  /**
   * Roll dice
   */
  rollDice(roomId: string, playerId: string): void {
    if (!this.socket) {
      throw new Error('WebSocket not connected');
    }
    
    console.log(`🎲 Rolling dice for player ${playerId}`);
    this.socket.emit('roll-dice', { roomId, playerId });
  }

  /**
   * Buy stock
   */
  buyStock(roomId: string, playerId: string, stockType: StockType, shares: number): void {
    if (!this.socket) {
      throw new Error('WebSocket not connected');
    }
    
    console.log(`💰 Buying ${shares} shares of ${stockType}`);
    this.socket.emit('buy-stock', { roomId, playerId, stockType, shares });
  }

  /**
   * Sell stock
   */
  sellStock(roomId: string, playerId: string, stockType: StockType, shares: number): void {
    if (!this.socket) {
      throw new Error('WebSocket not connected');
    }
    
    console.log(`💸 Selling ${shares} shares of ${stockType}`);
    this.socket.emit('sell-stock', { roomId, playerId, stockType, shares });
  }

  /**
   * End turn
   */
  endTurn(roomId: string): void {
    if (!this.socket) {
      throw new Error('WebSocket not connected');
    }
    
    console.log('⏭️ Ending turn');
    this.socket.emit('end-turn', { roomId });
  }

  /**
   * Register event listeners
   */
  on<K extends keyof WebSocketEvents>(event: K, callback: WebSocketEvents[K]): void {
    if (!this.socket) {
      throw new Error('WebSocket not connected');
    }
    
    this.socket.on(event as string, callback as any);
  }

  /**
   * Remove event listeners
   */
  off<K extends keyof WebSocketEvents>(event: K, callback?: WebSocketEvents[K]): void {
    if (!this.socket) return;
    
    if (callback) {
      this.socket.off(event as string, callback as any);
    } else {
      this.socket.off(event as string);
    }
  }
}

// Singleton instance
export const webSocketService = new WebSocketService();
export default webSocketService;