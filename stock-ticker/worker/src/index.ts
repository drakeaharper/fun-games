import { GameRoom } from './gameRoom';
import { GameLogic } from './gameLogic';
import { StockType, GameMode } from './types';

export { GameRoom };

export interface Env {
  GAME_ROOM: DurableObjectNamespace<GameRoom>;
  ASSETS: Fetcher;
}

// Allows the CRA dev server (localhost:3000) to call wrangler dev (localhost:8787).
// In production the frontend is same-origin, so these headers are inert.
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
  });
}

function apiError(status: number, code: string, message: string): Response {
  return json({ success: false, error: { code, message } }, status);
}

/**
 * Map a thrown error to the same status/code/message the Express
 * controllers used, falling back to a 500.
 */
function mapError(
  error: unknown,
  mappings: Array<{ match: string; status: number; code: string; message?: string }>,
  fallbackMessage: string
): Response {
  console.error(fallbackMessage, error);
  if (error instanceof Error) {
    for (const m of mappings) {
      if (error.message.includes(m.match)) {
        return apiError(m.status, m.code, m.message ?? error.message);
      }
    }
  }
  return apiError(500, 'INTERNAL_ERROR', fallbackMessage);
}

function roomStub(env: Env, roomId: string) {
  // Room identity is the invite code, so any holder of the code reaches
  // the same Durable Object via idFromName.
  return env.GAME_ROOM.get(env.GAME_ROOM.idFromName(roomId.toUpperCase()));
}

async function readBody(request: Request): Promise<any> {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

async function handleApi(request: Request, env: Env, url: URL): Promise<Response> {
  const method = request.method;
  const segments = url.pathname.split('/').filter(Boolean); // ["api", ...]

  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  // GET /api
  if (segments.length === 1) {
    return json({ message: 'Stock Ticker API v1.0' });
  }

  const [, resource, roomId, action] = segments;

  if (resource === 'rooms') {
    // POST /api/rooms
    if (method === 'POST' && segments.length === 2) {
      const { name, mode } = await readBody(request);
      if (!name || typeof name !== 'string') {
        return apiError(400, 'INVALID_INPUT', 'Room name is required');
      }
      if (mode !== undefined && !Object.values(GameMode).includes(mode)) {
        return apiError(400, 'INVALID_INPUT', 'Invalid game mode');
      }
      const gameMode = (mode as GameMode) ?? GameMode.CLASSIC;
      // Invite codes are random, so collisions with an existing room are
      // vanishingly rare — but retry a few times just in case.
      for (let attempt = 0; attempt < 5; attempt++) {
        const inviteCode = GameLogic.generateInviteCode();
        try {
          const room = await roomStub(env, inviteCode).createRoom(name, inviteCode, gameMode);
          return json({ success: true, data: { roomId: room.roomId, inviteCode: room.inviteCode, name, mode: room.mode } }, 201);
        } catch (error) {
          if (error instanceof Error && error.message.includes('Room already exists')) {
            continue;
          }
          return mapError(error, [], 'Failed to create room');
        }
      }
      return apiError(500, 'INTERNAL_ERROR', 'Failed to create room');
    }

    // POST /api/rooms/join
    if (method === 'POST' && roomId === 'join' && segments.length === 3) {
      const { inviteCode, playerName } = await readBody(request);
      if (!inviteCode || !playerName) {
        return apiError(400, 'MISSING_FIELDS', 'Invite code and player name are required');
      }
      try {
        const result = await roomStub(env, inviteCode).joinRoom(playerName);
        return json({ success: true, data: { roomId: result.roomId, playerId: result.playerId, playerName } });
      } catch (error) {
        return mapError(error, [
          { match: 'Room not found', status: 404, code: 'ROOM_NOT_FOUND', message: 'Room with this invite code does not exist' },
          { match: 'Room is not accepting new players', status: 400, code: 'ROOM_NOT_ACCEPTING', message: 'This room is not accepting new players' },
          { match: 'Room is full', status: 400, code: 'ROOM_FULL', message: 'This room is full' },
          { match: 'Player name already taken', status: 409, code: 'NAME_TAKEN', message: 'Player name is already taken in this room' }
        ], 'Failed to join room');
      }
    }

    if (!roomId) {
      return apiError(400, 'MISSING_ROOM_ID', 'Room ID is required');
    }

    // GET /api/rooms/:roomId/ws — WebSocket upgrade, forwarded to the room's DO
    if (action === 'ws') {
      if (request.headers.get('Upgrade') !== 'websocket') {
        return apiError(426, 'UPGRADE_REQUIRED', 'Expected WebSocket upgrade');
      }
      return roomStub(env, roomId).fetch(request);
    }

    // GET /api/rooms/:roomId
    if (method === 'GET' && segments.length === 3) {
      try {
        const info = await roomStub(env, roomId).getRoomInfo();
        return json({ success: true, data: info });
      } catch (error) {
        return mapError(error, [
          { match: 'Room not found', status: 404, code: 'ROOM_NOT_FOUND', message: 'Room not found' }
        ], 'Failed to get room info');
      }
    }

    // POST /api/rooms/:roomId/start
    if (method === 'POST' && action === 'start') {
      try {
        await roomStub(env, roomId).startGame();
        return json({ success: true, data: { message: 'Game started successfully' } });
      } catch (error) {
        return mapError(error, [
          { match: 'Room not found', status: 404, code: 'ROOM_NOT_FOUND', message: 'Room not found' },
          { match: 'Need at least 2 players', status: 400, code: 'INSUFFICIENT_PLAYERS', message: 'Need at least 2 players to start the game' }
        ], 'Failed to start game');
      }
    }
  }

  if (resource === 'games' && roomId) {
    const stub = roomStub(env, roomId);

    // GET /api/games/:roomId/state
    if (method === 'GET' && action === 'state') {
      try {
        const gameState = await stub.getGameState();
        return json({ success: true, data: gameState });
      } catch (error) {
        return mapError(error, [
          { match: 'Game not found', status: 404, code: 'GAME_NOT_FOUND', message: 'Game not found' }
        ], 'Failed to get game state');
      }
    }

    if (method === 'POST' && action === 'roll-dice') {
      const { playerId } = await readBody(request);
      if (!playerId) {
        return apiError(400, 'MISSING_FIELDS', 'Room ID and player ID are required');
      }
      try {
        const result = await stub.rollDice(playerId);
        await stub.broadcastGameState();
        return json({ success: true, data: result });
      } catch (error) {
        return mapError(error, [], 'Failed to roll dice');
      }
    }

    if (method === 'POST' && (action === 'buy-stock' || action === 'sell-stock')) {
      const { playerId, stockType, shares } = await readBody(request);
      if (!playerId || !stockType || !shares) {
        return apiError(400, 'MISSING_FIELDS', 'Room ID, player ID, stock type, and shares are required');
      }
      if (!Object.values(StockType).includes(stockType)) {
        return apiError(400, 'INVALID_STOCK_TYPE', 'Invalid stock type');
      }
      if (typeof shares !== 'number' || shares <= 0) {
        return apiError(400, 'INVALID_SHARES', 'Shares must be a positive number');
      }
      try {
        if (action === 'buy-stock') {
          await stub.buyStock(playerId, stockType, shares);
        } else {
          await stub.sellStock(playerId, stockType, shares);
        }
        await stub.broadcastGameState();
        const verb = action === 'buy-stock' ? 'purchased' : 'sold';
        return json({ success: true, data: { message: `Stock ${verb} successfully` } });
      } catch (error) {
        return mapError(error, [
          { match: 'Invalid share amount', status: 400, code: 'INVALID_TRANSACTION' },
          { match: 'Insufficient funds', status: 400, code: 'INVALID_TRANSACTION' },
          { match: 'Cannot sell', status: 400, code: 'INVALID_TRANSACTION' }
        ], `Failed to ${action === 'buy-stock' ? 'buy' : 'sell'} stock`);
      }
    }

    if (method === 'POST' && action === 'end-turn') {
      try {
        await stub.endTurn();
        await stub.broadcastGameState();
        return json({ success: true, data: { message: 'Turn ended successfully' } });
      } catch (error) {
        return mapError(error, [], 'Failed to end turn');
      }
    }
  }

  return apiError(404, 'NOT_FOUND', 'Route not found');
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/health') {
      return json({ status: 'OK', timestamp: new Date().toISOString() });
    }

    if (url.pathname === '/api' || url.pathname.startsWith('/api/')) {
      return handleApi(request, env, url);
    }

    return env.ASSETS.fetch(request);
  }
} satisfies ExportedHandler<Env>;
