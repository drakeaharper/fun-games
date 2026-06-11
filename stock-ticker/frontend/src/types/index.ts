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

export enum GameMode {
  CLASSIC = 'classic',
  AUTO = 'auto'
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

/** The most recent dice roll's effect on a stock, shown until its next roll */
export interface StockPriceChange {
  action: DiceAction;
  amount: number; // in cents
}

export interface PlayerPortfolio {
  playerId: string;
  playerName: string;
  connected: boolean;
  cash: number; // in cents
  stocks: Record<StockType, number>; // stockType -> shares
  totalValue: number; // in cents
}

export type EndConditionType = 'none' | 'time' | 'networth' | 'rolls';

export interface RoomSettings {
  /** Auto mode: time between market rolls, in ms */
  rollIntervalMs: number;
  /** Each player's starting cash, in cents */
  startingCash: number;
  endType: EndConditionType;
  /** Meaning depends on endType: minutes | cents of net worth | roll count */
  endValue: number;
}

export interface GameState {
  roomId: string;
  mode?: GameMode;
  settings?: RoomSettings;
  endsAt?: number | null;
  rollCount?: number;
  currentTurn: number;
  currentPlayerId: string | null;
  phase: GamePhase;
  players: PlayerPortfolio[];
  stocks: StockPrice[];
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
  'dice-rolled': (data: {
    playerId: string;
    playerName: string;
    diceResult: DiceResult;
    splitOccurred: boolean;
    dividends?: Array<{ playerId: string; playerName: string; amount: number }>;
    belowPar?: boolean;
    offBoard?: boolean;
    forfeitures?: Array<{ playerId: string; playerName: string; shares: number }>;
  }) => void;
  'stock-transaction': (data: { playerId: string; playerName: string; action: string; stockType: string; shares: number; message: string }) => void;
  'player-joined': (data: { playerId: string; playerName: string; message: string }) => void;
  'player-disconnected': (data: { playerId: string; playerName: string; message: string }) => void;
  'turn-ended': (data: { playerId: string; playerName: string; message: string }) => void;
  'turn-changed': (data: { currentPlayerId: string }) => void;
  'game-over': (data: {
    reason: 'time' | 'networth' | 'rolls';
    standings: Array<{ playerId: string; playerName: string; totalValue: number; cash: number }>;
    winnerIds: string[];
  }) => void;
  'error': (error: { code: string; message: string; details?: string }) => void;
}

// Constants
export const SHARE_LOTS = [500, 1000, 2000, 5000];

export const STOCK_NAMES: Record<StockType, string> = {
  [StockType.GOLD]: 'Gold',
  [StockType.SILVER]: 'Silver',
  [StockType.BONDS]: 'Bonds',
  [StockType.OIL]: 'Oil',
  [StockType.INDUSTRIALS]: 'Industrials',
  [StockType.GRAIN]: 'Grain'
};