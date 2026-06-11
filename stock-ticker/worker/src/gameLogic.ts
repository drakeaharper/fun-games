import {
  StockType,
  DiceAction,
  DiceResult,
  STOCK_DIE_MAPPING,
  ACTION_DIE_MAPPING,
  ACTION_WEIGHTS,
  AMOUNT_DIE_MAPPING,
  STARTING_PRICE,
  STOCK_SPLIT_PRICE,
  STOCK_RESET_PRICE,
  SHARE_LOTS
} from './types';

export class GameLogic {
  /**
   * Roll three dice and return the interpreted result. The action roll is
   * weighted per ACTION_WEIGHTS rather than a fair die.
   */
  static rollDice(): DiceResult {
    const stockDie = Math.floor(Math.random() * 6) + 1;
    const amountDie = Math.floor(Math.random() * 6) + 1;

    const resultAction = GameLogic.rollWeightedAction();
    // Show a die face that agrees with the weighted action result.
    const faces = Object.keys(ACTION_DIE_MAPPING)
      .map(Number)
      .filter(face => ACTION_DIE_MAPPING[face] === resultAction);
    const actionDie = faces[Math.floor(Math.random() * faces.length)];

    return {
      stockDie,
      actionDie,
      amountDie,
      resultStock: STOCK_DIE_MAPPING[stockDie],
      resultAction,
      resultAmount: AMOUNT_DIE_MAPPING[amountDie]
    };
  }

  private static rollWeightedAction(): DiceAction {
    const entries = Object.entries(ACTION_WEIGHTS) as Array<[DiceAction, number]>;
    const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
    let r = Math.random() * total;
    for (const [action, weight] of entries) {
      r -= weight;
      if (r < 0) {
        return action;
      }
    }
    return entries[entries.length - 1][0];
  }

  /**
   * Calculate new stock price after dice roll
   */
  static calculateNewStockPrice(currentPrice: number, action: DiceAction, amount: number): number {
    switch (action) {
      case DiceAction.UP:
        return currentPrice + amount;
      case DiceAction.DOWN:
        const newPrice = currentPrice - amount;
        // Stock resets to $1.00 if it hits $0.00
        return newPrice <= STOCK_RESET_PRICE ? STARTING_PRICE : newPrice;
      case DiceAction.DIVIDEND:
        // Dividends don't change stock price
        return currentPrice;
      default:
        return currentPrice;
    }
  }

  /**
   * Check if a down-roll takes the stock off the board (price would hit $0.00 or less).
   * 1937 rules: all player-held shares are forfeited and the price returns to par.
   */
  static stockGoesOffBoard(currentPrice: number, action: DiceAction, amount: number): boolean {
    return action === DiceAction.DOWN && currentPrice - amount <= STOCK_RESET_PRICE;
  }

  /**
   * Check if stock should split at $2.00
   */
  static shouldStockSplit(price: number): boolean {
    return price >= STOCK_SPLIT_PRICE;
  }

  /**
   * Calculate dividend payment for a stock
   * Dividends are only paid for stocks >= $1.00
   */
  static calculateDividend(stockPrice: number, shares: number, dividendAmount: number): number {
    if (stockPrice < STARTING_PRICE || shares <= 0) {
      return 0;
    }
    // Dividend amount is based on dice roll (5¢, 10¢, or 20¢ per share)
    return shares * dividendAmount;
  }

  /**
   * Validate if a share purchase is allowed
   */
  static validateSharePurchase(shares: number, stockPrice: number, playerCash: number): {
    valid: boolean;
    error?: string;
  } {
    // Check if shares is a valid lot size
    if (!SHARE_LOTS.includes(shares)) {
      return {
        valid: false,
        error: `Invalid share amount. Must be one of: ${SHARE_LOTS.join(', ')}`
      };
    }

    const totalCost = shares * stockPrice;
    if (totalCost > playerCash) {
      return {
        valid: false,
        error: `Insufficient funds. Need $${(totalCost / 100).toFixed(2)}, have $${(playerCash / 100).toFixed(2)}`
      };
    }

    return { valid: true };
  }

  /**
   * Validate if a share sale is allowed
   */
  static validateShareSale(sharesToSell: number, currentShares: number): {
    valid: boolean;
    error?: string;
  } {
    if (!SHARE_LOTS.includes(sharesToSell)) {
      return {
        valid: false,
        error: `Invalid share amount. Must be one of: ${SHARE_LOTS.join(', ')}`
      };
    }

    if (sharesToSell > currentShares) {
      return {
        valid: false,
        error: `Cannot sell ${sharesToSell} shares. You only own ${currentShares} shares.`
      };
    }

    return { valid: true };
  }

  /**
   * Calculate total portfolio value
   */
  static calculatePortfolioValue(
    cash: number,
    portfolios: Array<{ stockType: StockType; shares: number }>,
    stockPrices: Record<StockType, number>
  ): number {
    const stockValue = portfolios.reduce((total, portfolio) => {
      const stockPrice = stockPrices[portfolio.stockType] || 0;
      return total + (portfolio.shares * stockPrice);
    }, 0);

    return cash + stockValue;
  }

  /**
   * Generate a unique invite code for rooms
   */
  static generateInviteCode(): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }

  /**
   * Initialize stocks for a new game
   */
  static initializeStocks(): Array<{ stockType: StockType; currentPrice: number }> {
    return Object.values(StockType).map(stockType => ({
      stockType,
      currentPrice: STARTING_PRICE
    }));
  }
}
