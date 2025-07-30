import { Router } from 'express';
import { RoomController } from '../controllers/roomController';

const router = Router();

// POST /api/rooms - Create new room
router.post('/', RoomController.createRoom);

// POST /api/rooms/join - Join room by invite code
router.post('/join', RoomController.joinRoom);

// GET /api/rooms/:roomId - Get room info
router.get('/:roomId', RoomController.getRoomInfo);

// POST /api/rooms/:roomId/start - Start game
router.post('/:roomId/start', RoomController.startGame);

export default router;