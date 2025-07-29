import { Router } from 'express';
import { GameController } from '../controllers/gameController';

const router = Router();

// GET /api/games/:roomId/state - Get current game state
router.get('/:roomId/state', GameController.getGameState);

// POST /api/games/:roomId/roll-dice - Roll dice
router.post('/:roomId/roll-dice', GameController.rollDice);

// POST /api/games/:roomId/buy-stock - Buy stock
router.post('/:roomId/buy-stock', GameController.buyStock);

// POST /api/games/:roomId/sell-stock - Sell stock
router.post('/:roomId/sell-stock', GameController.sellStock);

// POST /api/games/:roomId/end-turn - End current turn
router.post('/:roomId/end-turn', GameController.endTurn);

export default router;