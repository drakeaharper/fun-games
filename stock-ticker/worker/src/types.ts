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

export enum RoomStatus {
  WAITING = 'waiting',
  PLAYING = 'playing',
  FINISHED = 'finished'
}

export enum GameMode {
  CLASSIC = 'classic',
  AUTO = 'auto'
}

export enum TransactionAction {
  BUY = 'buy',
  SELL = 'sell',
  DIVIDEND = 'dividend',
  FORFEIT = 'forfeit'
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
  resultAmount: number; // in cents
}

export interface StockPrice {
  stockType: StockType;
  currentPrice: number; // in cents
}

export interface PlayerPortfolio {
  playerId: string;
  playerName: string;
  connected: boolean;
  cash: number;
  stocks: Record<StockType, number>; // stockType -> shares
  totalValue: number;
}

export interface GameStateData {
  roomId: string;
  mode: GameMode;
  currentTurn: number;
  currentPlayerId: string | null;
  phase: GamePhase;
  players: PlayerPortfolio[];
  stocks: StockPrice[];
}

export const STOCK_TYPES = Object.values(StockType);
export const STARTING_PRICE = 100; // $1.00 in cents
export const STARTING_CASH = 500000; // $5000.00 in cents
export const STOCK_SPLIT_PRICE = 200; // $2.00 in cents
export const STOCK_RESET_PRICE = 0; // $0.00 in cents
export const SHARE_LOTS = [500, 1000, 2000, 5000];
export const MAX_PLAYERS = 6;
export const AUTO_ROLL_INTERVAL_MS = 5000;

// Dice mappings based on original game rules
export const STOCK_DIE_MAPPING: Record<number, StockType> = {
  1: StockType.GOLD,
  2: StockType.SILVER,
  3: StockType.BONDS,
  4: StockType.OIL,
  5: StockType.INDUSTRIALS,
  6: StockType.GRAIN
};

export const ACTION_DIE_MAPPING: Record<number, DiceAction> = {
  1: DiceAction.DOWN,
  2: DiceAction.DOWN,
  3: DiceAction.UP,
  4: DiceAction.UP,
  5: DiceAction.DIVIDEND,
  6: DiceAction.DIVIDEND
};

// Relative odds for the action roll. A fair die would be 1:1:1; UP gets a
// slight edge (40% vs 30%/30%) so the market drifts gently upward over time.
export const ACTION_WEIGHTS: Record<DiceAction, number> = {
  [DiceAction.UP]: 4,
  [DiceAction.DOWN]: 3,
  [DiceAction.DIVIDEND]: 3
};

export const AMOUNT_DIE_MAPPING: Record<number, number> = {
  1: 5,  // 5 cents
  2: 5,  // 5 cents
  3: 10, // 10 cents
  4: 10, // 10 cents
  5: 20, // 20 cents
  6: 20  // 20 cents
};
