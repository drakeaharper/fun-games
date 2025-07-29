import { Router } from 'express';
import roomRoutes from './rooms';
import gameRoutes from './games';

const router = Router();

// Mount routes
router.use('/rooms', roomRoutes);
router.use('/games', gameRoutes);

export default router;