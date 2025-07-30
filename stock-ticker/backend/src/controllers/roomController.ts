import { Request, Response } from 'express';
import { DatabaseService } from '../services/database';

export class RoomController {
  /**
   * Create a new game room
   */
  static async createRoom(req: Request, res: Response): Promise<void> {
    try {
      const { name } = req.body;

      if (!name || typeof name !== 'string') {
        res.status(400).json({ 
          success: false, 
          error: { code: 'INVALID_INPUT', message: 'Room name is required' } 
        });
        return;
      }

      const room = await DatabaseService.createRoom(name);
      
      res.status(201).json({
        success: true,
        data: {
          roomId: room.id,
          inviteCode: room.inviteCode,
          name
        }
      });
    } catch (error) {
      console.error('Error creating room:', error);
      res.status(500).json({
        success: false,
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to create room' 
        }
      });
    }
  }

  /**
   * Join a room by invite code
   */
  static async joinRoom(req: Request, res: Response): Promise<void> {
    try {
      const { inviteCode, playerName } = req.body;

      if (!inviteCode || !playerName) {
        res.status(400).json({
          success: false,
          error: { 
            code: 'MISSING_FIELDS', 
            message: 'Invite code and player name are required' 
          }
        });
        return;
      }

      const result = await DatabaseService.joinRoom(inviteCode, playerName);
      
      res.status(200).json({
        success: true,
        data: {
          roomId: result.roomId,
          playerId: result.playerId,
          playerName
        }
      });
    } catch (error) {
      console.error('Error joining room:', error);
      
      let statusCode = 500;
      let errorCode = 'INTERNAL_ERROR';
      let message = 'Failed to join room';

      if (error instanceof Error) {
        if (error.message === 'Room not found') {
          statusCode = 404;
          errorCode = 'ROOM_NOT_FOUND';
          message = 'Room with this invite code does not exist';
        } else if (error.message === 'Room is not accepting new players') {
          statusCode = 400;
          errorCode = 'ROOM_NOT_ACCEPTING';
          message = 'This room is not accepting new players';
        } else if (error.message === 'Room is full') {
          statusCode = 400;
          errorCode = 'ROOM_FULL';
          message = 'This room is full';
        } else if (error.message === 'Player name already taken in this room') {
          statusCode = 409;
          errorCode = 'NAME_TAKEN';
          message = 'Player name is already taken in this room';
        }
      }

      res.status(statusCode).json({
        success: false,
        error: { code: errorCode, message }
      });
    }
  }

  /**
   * Get room info
   */
  static async getRoomInfo(req: Request, res: Response): Promise<void> {
    try {
      const { roomId } = req.params;

      if (!roomId) {
        res.status(400).json({
          success: false,
          error: { code: 'MISSING_ROOM_ID', message: 'Room ID is required' }
        });
        return;
      }

      const roomInfo = await DatabaseService.getRoomInfo(roomId);
      
      res.status(200).json({
        success: true,
        data: roomInfo
      });
    } catch (error) {
      console.error('Error getting room info:', error);
      
      let statusCode = 500;
      let errorCode = 'INTERNAL_ERROR';
      let message = 'Failed to get room info';

      if (error instanceof Error && error.message === 'Room not found') {
        statusCode = 404;
        errorCode = 'ROOM_NOT_FOUND';
        message = 'Room not found';
      }

      res.status(statusCode).json({
        success: false,
        error: { code: errorCode, message }
      });
    }
  }

  /**
   * Start a game
   */
  static async startGame(req: Request, res: Response): Promise<void> {
    try {
      const { roomId } = req.params;

      if (!roomId) {
        res.status(400).json({
          success: false,
          error: { code: 'MISSING_ROOM_ID', message: 'Room ID is required' }
        });
        return;
      }

      await DatabaseService.startGame(roomId);
      
      // Broadcast game state update to all players in the room
      const { WebSocketService } = await import('../services/websocket');
      await WebSocketService.broadcastGameStateUpdate(roomId);
      
      res.status(200).json({
        success: true,
        data: { message: 'Game started successfully' }
      });
    } catch (error) {
      console.error('Error starting game:', error);
      
      let statusCode = 500;
      let errorCode = 'INTERNAL_ERROR';
      let message = 'Failed to start game';

      if (error instanceof Error) {
        if (error.message === 'Room not found') {
          statusCode = 404;
          errorCode = 'ROOM_NOT_FOUND';
          message = 'Room not found';
        } else if (error.message === 'Need at least 2 players to start') {
          statusCode = 400;
          errorCode = 'INSUFFICIENT_PLAYERS';
          message = 'Need at least 2 players to start the game';
        }
      }

      res.status(statusCode).json({
        success: false,
        error: { code: errorCode, message }
      });
    }
  }
}