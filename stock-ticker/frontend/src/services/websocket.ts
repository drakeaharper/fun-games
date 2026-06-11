import { WebSocketEvents, StockType } from '../types';

// Same-origin by default (production: the Worker serves both the app and
// the WebSocket endpoint). Overridden in development via .env.development.
const WEBSOCKET_BASE_URL =
  process.env.REACT_APP_WEBSOCKET_URL ||
  `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`;

interface JoinData {
  roomId: string;
  playerId: string;
  playerName: string;
}

export class WebSocketService {
  private socket: WebSocket | null = null;
  private listeners = new Map<string, Set<Function>>();
  private pendingMessages: string[] = [];
  private joinData: JoinData | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 1000;
  private intentionalClose = false;

  /**
   * Kept for API compatibility: the connection is actually opened by
   * joinRoom(), since the WebSocket URL is per-room.
   */
  connect(): WebSocket | null {
    return this.socket;
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    console.log('🔌 Disconnecting from WebSocket server...');
    this.intentionalClose = true;
    this.joinData = null;
    this.pendingMessages = [];
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  /**
   * Join a game room (opens the room's WebSocket connection)
   */
  joinRoom(roomId: string, playerId: string, playerName: string): void {
    console.log(`👤 Joining room ${roomId} as ${playerName}`);
    this.joinData = { roomId, playerId, playerName };
    this.open(roomId);
    this.send('join-room', { roomId, playerId, playerName });
  }

  /**
   * Roll dice
   */
  rollDice(roomId: string, playerId: string): void {
    console.log(`🎲 Rolling dice for player ${playerId}`);
    this.send('roll-dice', { roomId, playerId });
  }

  /**
   * Buy stock
   */
  buyStock(roomId: string, playerId: string, stockType: StockType, shares: number): void {
    console.log(`💰 Buying ${shares} shares of ${stockType}`);
    this.send('buy-stock', { roomId, playerId, stockType, shares });
  }

  /**
   * Sell stock
   */
  sellStock(roomId: string, playerId: string, stockType: StockType, shares: number): void {
    console.log(`💸 Selling ${shares} shares of ${stockType}`);
    this.send('sell-stock', { roomId, playerId, stockType, shares });
  }

  /**
   * End turn
   */
  endTurn(roomId: string): void {
    console.log('⏭️ Ending turn');
    this.send('end-turn', { roomId });
  }

  /**
   * Register event listeners
   */
  on<K extends keyof WebSocketEvents>(event: K, callback: WebSocketEvents[K]): void {
    if (!this.listeners.has(event as string)) {
      this.listeners.set(event as string, new Set());
    }
    this.listeners.get(event as string)!.add(callback as Function);
  }

  /**
   * Remove event listeners
   */
  off<K extends keyof WebSocketEvents>(event: K, callback?: WebSocketEvents[K]): void {
    if (callback) {
      this.listeners.get(event as string)?.delete(callback as Function);
    } else {
      this.listeners.delete(event as string);
    }
  }

  private open(roomId: string): void {
    if (
      this.socket &&
      (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    console.log('🔌 Connecting to WebSocket server...');
    this.intentionalClose = false;

    const socket = new WebSocket(`${WEBSOCKET_BASE_URL}/api/rooms/${roomId}/ws`);
    this.socket = socket;

    socket.onopen = () => {
      console.log('✅ Connected to WebSocket server');
      this.reconnectAttempts = 0;
      const queued = this.pendingMessages;
      this.pendingMessages = [];
      queued.forEach(message => socket.send(message));
    };

    socket.onmessage = (messageEvent) => {
      try {
        const { event, data } = JSON.parse(messageEvent.data);
        this.listeners.get(event)?.forEach(callback => callback(data));
      } catch (error) {
        console.error('❌ Failed to parse WebSocket message:', error);
      }
    };

    socket.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
    };

    socket.onclose = () => {
      console.log('❌ Disconnected from WebSocket server');
      if (this.socket === socket) {
        this.socket = null;
      }
      if (!this.intentionalClose && this.joinData) {
        this.scheduleReconnect();
      }
    };
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Failed to reconnect to WebSocket server');
      return;
    }

    this.reconnectAttempts += 1;
    const delay = this.reconnectInterval * this.reconnectAttempts;
    console.log(`🔄 Reconnection attempt ${this.reconnectAttempts} in ${delay}ms`);

    setTimeout(() => {
      const joinData = this.joinData;
      if (!joinData || this.intentionalClose) return;
      this.open(joinData.roomId);
      this.send('join-room', joinData);
    }, delay);
  }

  private send(event: string, data: any): void {
    const message = JSON.stringify({ event, data });
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(message);
    } else if (this.socket?.readyState === WebSocket.CONNECTING) {
      this.pendingMessages.push(message);
    } else {
      console.error(`❌ Cannot send "${event}": WebSocket not connected`);
    }
  }
}

// Singleton instance
export const webSocketService = new WebSocketService();
export default webSocketService;
