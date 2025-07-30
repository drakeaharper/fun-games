import { Server as SocketServer, Socket } from 'socket.io';
import { DatabaseService } from './database';

interface ConnectedPlayer {
  socketId: string;
  playerId: string;
  roomId: string;
  playerName: string;
}

export class WebSocketService {
  private io: SocketServer;
  private connectedPlayers = new Map<string, ConnectedPlayer>();
  private roomConnections = new Map<string, Set<string>>(); // roomId -> Set of socketIds
  private static instance: WebSocketService;

  constructor(io: SocketServer) {
    this.io = io;
    WebSocketService.instance = this;
    this.setupEventHandlers();
  }

  // Static method to get the current instance
  static getInstance(): WebSocketService | null {
    return WebSocketService.instance || null;
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log(`🔌 Client connected: ${socket.id}`);

      // Handle joining a room
      socket.on('join-room', async (data: { roomId: string; playerId: string; playerName: string }) => {
        try {
          const { roomId, playerId, playerName } = data;
          
          // Store player connection info
          this.connectedPlayers.set(socket.id, {
            socketId: socket.id,
            playerId,
            roomId,
            playerName
          });

          // Add to room connections
          if (!this.roomConnections.has(roomId)) {
            this.roomConnections.set(roomId, new Set());
          }
          this.roomConnections.get(roomId)!.add(socket.id);

          // Join socket room
          socket.join(roomId);

          // Mark player as connected in database
          await DatabaseService.markPlayerConnected(playerId);

          console.log(`👤 ${playerName} (${playerId}) joined room ${roomId}`);

          // Notify other players in the room
          socket.to(roomId).emit('player-joined', {
            playerId,
            playerName,
            message: `${playerName} joined the game`
          });

          // Send updated game state to ALL players in the room (including the new player)
          const gameState = await DatabaseService.getGameState(roomId);
          this.io.to(roomId).emit('game-state-updated', gameState);

          // Send acknowledgment
          socket.emit('room-joined', {
            success: true,
            roomId,
            playerId,
            playerName
          });

        } catch (error) {
          console.error('Error joining room:', error);
          socket.emit('error', {
            code: 'JOIN_ROOM_ERROR',
            message: 'Failed to join room',
            details: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      });

      // Handle dice rolling
      socket.on('roll-dice', async (data: { roomId: string; playerId: string }) => {
        try {
          const { roomId, playerId } = data;
          
          // Verify player is connected and in this room
          const player = this.connectedPlayers.get(socket.id);
          if (!player || player.roomId !== roomId || player.playerId !== playerId) {
            socket.emit('error', {
              code: 'UNAUTHORIZED',
              message: 'You are not authorized to perform this action'
            });
            return;
          }

          // Roll dice
          const result = await DatabaseService.rollDice(roomId, playerId);
          
          // Broadcast dice result to all players in the room
          this.io.to(roomId).emit('dice-rolled', {
            playerId,
            playerName: player.playerName,
            diceResult: result.diceResult,
            splitOccurred: result.splitOccurred
          });

          // Send updated game state to all players
          const gameState = await DatabaseService.getGameState(roomId);
          this.io.to(roomId).emit('game-state-updated', gameState);

        } catch (error) {
          console.error('Error rolling dice:', error);
          socket.emit('error', {
            code: 'DICE_ROLL_ERROR',
            message: 'Failed to roll dice',
            details: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      });

      // Handle stock transactions
      socket.on('buy-stock', async (data: { roomId: string; playerId: string; stockType: string; shares: number }) => {
        try {
          const { roomId, playerId, stockType, shares } = data;
          
          const player = this.connectedPlayers.get(socket.id);
          if (!player || player.roomId !== roomId || player.playerId !== playerId) {
            socket.emit('error', {
              code: 'UNAUTHORIZED', 
              message: 'You are not authorized to perform this action'
            });
            return;
          }

          await DatabaseService.buyStock(roomId, playerId, stockType as any, shares);

          // Notify all players in the room
          this.io.to(roomId).emit('stock-transaction', {
            playerId,
            playerName: player.playerName,
            action: 'buy',
            stockType,
            shares,
            message: `${player.playerName} bought ${shares} shares of ${stockType.toUpperCase()}`
          });

          // Send updated game state
          const gameState = await DatabaseService.getGameState(roomId);
          this.io.to(roomId).emit('game-state-updated', gameState);

        } catch (error) {
          console.error('Error buying stock:', error);
          socket.emit('error', {
            code: 'BUY_STOCK_ERROR',
            message: 'Failed to buy stock',
            details: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      });

      socket.on('sell-stock', async (data: { roomId: string; playerId: string; stockType: string; shares: number }) => {
        try {
          const { roomId, playerId, stockType, shares } = data;
          
          const player = this.connectedPlayers.get(socket.id);
          if (!player || player.roomId !== roomId || player.playerId !== playerId) {
            socket.emit('error', {
              code: 'UNAUTHORIZED',
              message: 'You are not authorized to perform this action'
            });
            return;
          }

          await DatabaseService.sellStock(roomId, playerId, stockType as any, shares);

          // Notify all players in the room
          this.io.to(roomId).emit('stock-transaction', {
            playerId,
            playerName: player.playerName,
            action: 'sell',
            stockType,
            shares,
            message: `${player.playerName} sold ${shares} shares of ${stockType.toUpperCase()}`
          });

          // Send updated game state
          const gameState = await DatabaseService.getGameState(roomId);
          this.io.to(roomId).emit('game-state-updated', gameState);

        } catch (error) {
          console.error('Error selling stock:', error);
          socket.emit('error', {
            code: 'SELL_STOCK_ERROR',
            message: 'Failed to sell stock',
            details: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      });

      // Handle ending turn
      socket.on('end-turn', async (data: { roomId: string }) => {
        try {
          const { roomId } = data;
          
          const player = this.connectedPlayers.get(socket.id);
          if (!player || player.roomId !== roomId) {
            socket.emit('error', {
              code: 'UNAUTHORIZED',
              message: 'You are not authorized to perform this action'
            });
            return;
          }

          await DatabaseService.endTurn(roomId);

          // Notify all players that turn has ended
          this.io.to(roomId).emit('turn-ended', {
            playerId: player.playerId,
            playerName: player.playerName,
            message: `${player.playerName} ended their turn`
          });

          // Send updated game state with new current player
          const gameState = await DatabaseService.getGameState(roomId);
          this.io.to(roomId).emit('game-state-updated', gameState);
          this.io.to(roomId).emit('turn-changed', {
            currentPlayerId: gameState.currentPlayerId
          });

        } catch (error) {
          console.error('Error ending turn:', error);
          socket.emit('error', {
            code: 'END_TURN_ERROR',
            message: 'Failed to end turn',
            details: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      });

      // Handle disconnect
      socket.on('disconnect', async () => {
        console.log(`🔌 Client disconnected: ${socket.id}`);
        
        const player = this.connectedPlayers.get(socket.id);
        if (player) {
          const { roomId, playerName, playerId } = player;
          
          // Mark player as disconnected in database
          try {
            await DatabaseService.markPlayerDisconnected(playerId);
          } catch (error) {
            console.error('Error marking player as disconnected:', error);
          }
          
          // Remove from room connections
          const roomSockets = this.roomConnections.get(roomId);
          if (roomSockets) {
            roomSockets.delete(socket.id);
            if (roomSockets.size === 0) {
              this.roomConnections.delete(roomId);
            }
          }

          // Notify other players
          socket.to(roomId).emit('player-disconnected', {
            playerId: player.playerId,
            playerName,
            message: `${playerName} disconnected`
          });

          // Send updated game state to all remaining players
          try {
            const gameState = await DatabaseService.getGameState(roomId);
            socket.to(roomId).emit('game-state-updated', gameState);
          } catch (error) {
            console.error('Error sending updated game state after disconnect:', error);
          }

          // Remove from connected players
          this.connectedPlayers.delete(socket.id);
          
          console.log(`👤 ${playerName} disconnected from room ${roomId}`);
        }
      });
    });
  }

  // Utility methods for broadcasting to specific rooms
  public broadcastToRoom(roomId: string, event: string, data: any): void {
    this.io.to(roomId).emit(event, data);
  }

  public getConnectedPlayersInRoom(roomId: string): ConnectedPlayer[] {
    const socketIds = this.roomConnections.get(roomId) || new Set();
    const players: ConnectedPlayer[] = [];
    
    socketIds.forEach(socketId => {
      const player = this.connectedPlayers.get(socketId);
      if (player) {
        players.push(player);
      }
    });
    
    return players;
  }

  public getConnectedPlayerCount(roomId: string): number {
    return this.roomConnections.get(roomId)?.size || 0;
  }

  // Static method to broadcast game state update
  public static async broadcastGameStateUpdate(roomId: string): Promise<void> {
    const instance = WebSocketService.getInstance();
    if (!instance) {
      console.error('WebSocket service not initialized');
      return;
    }

    try {
      const { DatabaseService } = await import('./database');
      const gameState = await DatabaseService.getGameState(roomId);
      instance.broadcastToRoom(roomId, 'game-state-updated', gameState);
      console.log(`📡 Broadcasted game state update to room ${roomId}`);
    } catch (error) {
      console.error('Error broadcasting game state update:', error);
    }
  }
}