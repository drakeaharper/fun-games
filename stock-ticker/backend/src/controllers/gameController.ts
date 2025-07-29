import { Request, Response } from 'express';
import { DatabaseService } from '../services/database';
import { StockType } from '../types';

export class GameController {
  /**
   * Get current game state
   */
  static async getGameState(req: Request, res: Response): Promise<void> {
    try {
      const { roomId } = req.params;

      if (!roomId) {
        res.status(400).json({
          success: false,
          error: { code: 'MISSING_ROOM_ID', message: 'Room ID is required' }
        });
        return;
      }

      const gameState = await DatabaseService.getGameState(roomId);
      
      res.status(200).json({
        success: true,
        data: gameState
      });
    } catch (error) {
      console.error('Error getting game state:', error);
      
      let statusCode = 500;
      let errorCode = 'INTERNAL_ERROR';
      let message = 'Failed to get game state';

      if (error instanceof Error && error.message === 'Game not found') {
        statusCode = 404;
        errorCode = 'GAME_NOT_FOUND';
        message = 'Game not found';
      }

      res.status(statusCode).json({
        success: false,
        error: { code: errorCode, message }
      });
    }
  }

  /**
   * Roll dice
   */
  static async rollDice(req: Request, res: Response): Promise<void> {
    try {
      const { roomId } = req.params;
      const { playerId } = req.body;

      if (!roomId || !playerId) {
        res.status(400).json({
          success: false,
          error: { 
            code: 'MISSING_FIELDS', 
            message: 'Room ID and player ID are required' 
          }
        });
        return;
      }

      const result = await DatabaseService.rollDice(roomId, playerId);
      
      res.status(200).json({
        success: true,
        data: {
          diceResult: result.diceResult,
          splitOccurred: result.splitOccurred
        }
      });
    } catch (error) {
      console.error('Error rolling dice:', error);
      
      res.status(500).json({
        success: false,
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to roll dice' 
        }
      });
    }
  }

  /**
   * Buy stock
   */
  static async buyStock(req: Request, res: Response): Promise<void> {
    try {
      const { roomId } = req.params;
      const { playerId, stockType, shares } = req.body;

      if (!roomId || !playerId || !stockType || !shares) {
        res.status(400).json({
          success: false,
          error: { 
            code: 'MISSING_FIELDS', 
            message: 'Room ID, player ID, stock type, and shares are required' 
          }
        });
        return;
      }

      // Validate stock type
      if (!Object.values(StockType).includes(stockType)) {
        res.status(400).json({
          success: false,
          error: { 
            code: 'INVALID_STOCK_TYPE', 
            message: 'Invalid stock type' 
          }
        });
        return;
      }

      // Validate shares is a number
      if (typeof shares !== 'number' || shares <= 0) {
        res.status(400).json({
          success: false,
          error: { 
            code: 'INVALID_SHARES', 
            message: 'Shares must be a positive number' 
          }
        });
        return;
      }

      await DatabaseService.buyStock(roomId, playerId, stockType, shares);
      
      res.status(200).json({
        success: true,
        data: { message: 'Stock purchased successfully' }
      });
    } catch (error) {
      console.error('Error buying stock:', error);
      
      let statusCode = 500;
      let errorCode = 'INTERNAL_ERROR';
      let message = 'Failed to buy stock';

      if (error instanceof Error) {
        if (error.message.includes('Invalid share amount') || 
            error.message.includes('Insufficient funds')) {
          statusCode = 400;
          errorCode = 'INVALID_TRANSACTION';
          message = error.message;
        }
      }

      res.status(statusCode).json({
        success: false,
        error: { code: errorCode, message }
      });
    }
  }

  /**
   * Sell stock
   */
  static async sellStock(req: Request, res: Response): Promise<void> {
    try {
      const { roomId } = req.params;
      const { playerId, stockType, shares } = req.body;

      if (!roomId || !playerId || !stockType || !shares) {
        res.status(400).json({
          success: false,
          error: { 
            code: 'MISSING_FIELDS', 
            message: 'Room ID, player ID, stock type, and shares are required' 
          }
        });
        return;
      }

      // Validate stock type
      if (!Object.values(StockType).includes(stockType)) {
        res.status(400).json({
          success: false,
          error: { 
            code: 'INVALID_STOCK_TYPE', 
            message: 'Invalid stock type' 
          }
        });
        return;
      }

      // Validate shares is a number
      if (typeof shares !== 'number' || shares <= 0) {
        res.status(400).json({
          success: false,
          error: { 
            code: 'INVALID_SHARES', 
            message: 'Shares must be a positive number' 
          }
        });
        return;
      }

      await DatabaseService.sellStock(roomId, playerId, stockType, shares);
      
      res.status(200).json({
        success: true,
        data: { message: 'Stock sold successfully' }
      });
    } catch (error) {
      console.error('Error selling stock:', error);
      
      let statusCode = 500;
      let errorCode = 'INTERNAL_ERROR';
      let message = 'Failed to sell stock';

      if (error instanceof Error) {
        if (error.message.includes('Invalid share amount') || 
            error.message.includes('Cannot sell')) {
          statusCode = 400;
          errorCode = 'INVALID_TRANSACTION';
          message = error.message;
        }
      }

      res.status(statusCode).json({
        success: false,
        error: { code: errorCode, message }
      });
    }
  }

  /**
   * End turn
   */
  static async endTurn(req: Request, res: Response): Promise<void> {
    try {
      const { roomId } = req.params;

      if (!roomId) {
        res.status(400).json({
          success: false,
          error: { code: 'MISSING_ROOM_ID', message: 'Room ID is required' }
        });
        return;
      }

      await DatabaseService.endTurn(roomId);
      
      res.status(200).json({
        success: true,
        data: { message: 'Turn ended successfully' }
      });
    } catch (error) {
      console.error('Error ending turn:', error);
      
      res.status(500).json({
        success: false,
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to end turn' 
        }
      });
    }
  }
}