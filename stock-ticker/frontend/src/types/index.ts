export enum StockType {
  GOLD = 'gold',
  SILVER = 'silver',
  BONDS = 'bonds',
  OIL = 'oil',
  INDUSTRIALS = 'industrials',
  GRAIN = 'grain'
}

export enum GamePhase {
  WAITING = 'waiting',
  ROLLING = 'rolling',
  TRADING = 'trading',
  GAME_OVER = 'game_over'
}

export enum DiceAction {
  UP = 'up',
  DOWN = 'down',
  DIVIDEND = 'dividend'
}

export interface DiceResult {
  stockDie: number;
  actionDie: number;
  amountDie: number;
  resultStock: StockType;
  resultAction: DiceAction;
  resultAmount: number;
}

export interface StockPrice {
  stockType: StockType;
  currentPrice: number; // in cents
}

export interface PlayerPortfolio {
  playerId: string;
  playerName: string;
  connected: boolean;
  cash: number; // in cents
  stocks: Record<StockType, number>; // stockType -> shares
  totalValue: number; // in cents
}

export interface GameState {
  roomId: string;
  currentTurn: number;
  currentPlayerId: string | null;
  phase: GamePhase;
  players: PlayerPortfolio[];
  stocks: StockPrice[];
}

export interface Room {
  id: string;
  name: string;
  inviteCode: string;
  maxPlayers: number;
  status: string;
}

export interface Player {
  id: string;
  name: string;
  connected: boolean;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// WebSocket Events
export interface WebSocketEvents {
  // Client -> Server
  'join-room': (data: { roomId: string; playerId: string; playerName: string }) => void;
  'roll-dice': (data: { roomId: string; playerId: string }) => void;
  'buy-stock': (data: { roomId: string; playerId: string; stockType: StockType; shares: number }) => void;
  'sell-stock': (data: { roomId: string; playerId: string; stockType: StockType; shares: number }) => void;
  'end-turn': (data: { roomId: string }) => void;

  // Server -> Client
  'room-joined': (data: { success: boolean; roomId: string; playerId: string; playerName: string }) => void;
  'game-state-updated': (gameState: GameState) => void;
  'dice-rolled': (data: { playerId: string; playerName: string; diceResult: DiceResult; splitOccurred: boolean }) => void;
  'stock-transaction': (data: { playerId: string; playerName: string; action: string; stockType: string; shares: number; message: string }) => void;
  'player-joined': (data: { playerId: string; playerName: string; message: string }) => void;
  'player-disconnected': (data: { playerId: string; playerName: string; message: string }) => void;
  'turn-ended': (data: { playerId: string; playerName: string; message: string }) => void;
  'turn-changed': (data: { currentPlayerId: string }) => void;
  'error': (error: { code: string; message: string; details?: string }) => void;
}

// UI State
export interface UIState {
  isLoading: boolean;
  selectedStock?: StockType;
  showTradingModal: boolean;
  isRolling: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
  notifications: Notification[];
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  timestamp: number;
  autoClose?: boolean;
}

// Constants
export const STOCK_TYPES = Object.values(StockType);
export const SHARE_LOTS = [500, 1000, 2000, 5000];

export const STOCK_NAMES: Record<StockType, string> = {
  [StockType.GOLD]: 'Gold',
  [StockType.SILVER]: 'Silver',
  [StockType.BONDS]: 'Bonds',
  [StockType.OIL]: 'Oil',
  [StockType.INDUSTRIALS]: 'Industrials',
  [StockType.GRAIN]: 'Grain'
};

export const STOCK_COLORS: Record<StockType, string> = {
  [StockType.GOLD]: '#fbbf24',
  [StockType.SILVER]: '#e5e7eb',
  [StockType.BONDS]: '#3b82f6',
  [StockType.OIL]: '#374151',
  [StockType.INDUSTRIALS]: '#6366f1',
  [StockType.GRAIN]: '#f59e0b'
};