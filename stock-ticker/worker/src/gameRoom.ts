import { DurableObject } from 'cloudflare:workers';
import { GameLogic } from './gameLogic';
import {
  StockType,
  GamePhase,
  RoomStatus,
  TransactionAction,
  GameStateData,
  PlayerPortfolio,
  StockPrice,
  DiceResult,
  STARTING_CASH,
  STARTING_PRICE,
  MAX_PLAYERS
} from './types';
import type { Env } from './index';

interface SocketAttachment {
  playerId: string;
  playerName: string;
}

/**
 * One GameRoom Durable Object per game room (DO id derived from the invite
 * code). Holds all room/game state in the DO's SQLite storage and manages
 * every WebSocket connection for the room via the hibernation API.
 */
export class GameRoom extends DurableObject<Env> {
  private sql: SqlStorage;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS room (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        name TEXT NOT NULL,
        invite_code TEXT NOT NULL,
        status TEXT NOT NULL,
        max_players INTEGER NOT NULL DEFAULT ${MAX_PLAYERS}
      );
      CREATE TABLE IF NOT EXISTS players (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        turn_order INTEGER NOT NULL,
        cash INTEGER NOT NULL,
        connected INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS stocks (
        stock_type TEXT PRIMARY KEY,
        current_price INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS portfolios (
        player_id TEXT NOT NULL,
        stock_type TEXT NOT NULL,
        shares INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (player_id, stock_type)
      );
      CREATE TABLE IF NOT EXISTS game_state (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        current_turn INTEGER NOT NULL DEFAULT 0,
        current_player_id TEXT,
        phase TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS dice_rolls (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player_id TEXT NOT NULL,
        stock_die INTEGER NOT NULL,
        action_die INTEGER NOT NULL,
        amount_die INTEGER NOT NULL,
        result_stock TEXT NOT NULL,
        result_action TEXT NOT NULL,
        result_amount INTEGER NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player_id TEXT NOT NULL,
        stock_type TEXT NOT NULL,
        action TEXT NOT NULL,
        shares INTEGER NOT NULL,
        price_per_share INTEGER NOT NULL,
        total_amount INTEGER NOT NULL,
        created_at TEXT NOT NULL
      );
    `);
  }

  // ---------------------------------------------------------------------
  // Room lifecycle (called via RPC from the Worker)
  // ---------------------------------------------------------------------

  async createRoom(name: string, inviteCode: string): Promise<{ roomId: string; inviteCode: string }> {
    const existing = this.sql.exec('SELECT id FROM room').toArray();
    if (existing.length > 0) {
      throw new Error('Room already exists');
    }

    this.sql.exec(
      'INSERT INTO room (id, name, invite_code, status) VALUES (1, ?, ?, ?)',
      name, inviteCode, RoomStatus.WAITING
    );

    for (const stock of GameLogic.initializeStocks()) {
      this.sql.exec(
        'INSERT INTO stocks (stock_type, current_price) VALUES (?, ?)',
        stock.stockType, stock.currentPrice
      );
    }

    this.sql.exec(
      'INSERT INTO game_state (id, current_turn, phase) VALUES (1, 0, ?)',
      GamePhase.WAITING
    );

    return { roomId: inviteCode, inviteCode };
  }

  async joinRoom(playerName: string): Promise<{ roomId: string; playerId: string }> {
    const room = this.getRoomRow();
    if (!room) {
      throw new Error('Room not found');
    }
    if (room.status !== RoomStatus.WAITING) {
      throw new Error('Room is not accepting new players');
    }

    const players = this.sql.exec('SELECT id, name FROM players').toArray();
    if (players.length >= (room.max_players as number)) {
      throw new Error('Room is full');
    }
    if (players.some(p => p.name === playerName)) {
      throw new Error('Player name already taken in this room');
    }

    const playerId = crypto.randomUUID();
    this.sql.exec(
      'INSERT INTO players (id, name, turn_order, cash, connected) VALUES (?, ?, ?, ?, 0)',
      playerId, playerName, players.length, STARTING_CASH
    );

    for (const stockType of Object.values(StockType)) {
      this.sql.exec(
        'INSERT INTO portfolios (player_id, stock_type, shares) VALUES (?, ?, 0)',
        playerId, stockType
      );
    }

    return { roomId: room.invite_code as string, playerId };
  }

  async getRoomInfo(): Promise<{ id: string; name: string; inviteCode: string; status: string }> {
    const room = this.getRoomRow();
    if (!room) {
      throw new Error('Room not found');
    }
    return {
      id: room.invite_code as string,
      name: room.name as string,
      inviteCode: room.invite_code as string,
      status: room.status as string
    };
  }

  async startGame(): Promise<void> {
    const room = this.getRoomRow();
    if (!room) {
      throw new Error('Room not found');
    }

    const players = this.sql.exec(
      'SELECT id FROM players ORDER BY turn_order ASC'
    ).toArray();
    if (players.length < 2) {
      throw new Error('Need at least 2 players to start');
    }

    this.sql.exec('UPDATE room SET status = ? WHERE id = 1', RoomStatus.PLAYING);
    this.sql.exec(
      'UPDATE game_state SET phase = ?, current_player_id = ? WHERE id = 1',
      GamePhase.ROLLING, players[0].id as string
    );

    this.broadcast('game-state-updated', this.buildGameState());
  }

  // ---------------------------------------------------------------------
  // Game state
  // ---------------------------------------------------------------------

  async getGameState(): Promise<GameStateData> {
    return this.buildGameState();
  }

  private buildGameState(): GameStateData {
    const room = this.getRoomRow();
    const state = this.sql.exec('SELECT * FROM game_state WHERE id = 1').toArray()[0];
    if (!room || !state) {
      throw new Error('Game not found');
    }

    const stockRows = this.sql.exec('SELECT stock_type, current_price FROM stocks').toArray();
    const stockPrices = {} as Record<StockType, number>;
    const stocks: StockPrice[] = stockRows.map(row => {
      const stockType = row.stock_type as StockType;
      const currentPrice = row.current_price as number;
      stockPrices[stockType] = currentPrice;
      return { stockType, currentPrice };
    });

    const playerRows = this.sql.exec(
      'SELECT * FROM players ORDER BY turn_order ASC'
    ).toArray();

    const players: PlayerPortfolio[] = playerRows.map(player => {
      const portfolioRows = this.sql.exec(
        'SELECT stock_type, shares FROM portfolios WHERE player_id = ?',
        player.id as string
      ).toArray();

      const playerStocks = {} as Record<StockType, number>;
      const portfolios = portfolioRows.map(row => {
        const stockType = row.stock_type as StockType;
        const shares = row.shares as number;
        playerStocks[stockType] = shares;
        return { stockType, shares };
      });

      const totalValue = GameLogic.calculatePortfolioValue(
        player.cash as number,
        portfolios,
        stockPrices
      );

      return {
        playerId: player.id as string,
        playerName: player.name as string,
        connected: (player.connected as number) === 1,
        cash: player.cash as number,
        stocks: playerStocks,
        totalValue
      };
    });

    return {
      roomId: room.invite_code as string,
      currentTurn: state.current_turn as number,
      currentPlayerId: (state.current_player_id as string) ?? null,
      phase: state.phase as GamePhase,
      players,
      stocks
    };
  }

  // ---------------------------------------------------------------------
  // Game actions (shared by REST RPC and WebSocket handlers)
  // ---------------------------------------------------------------------

  async rollDice(playerId: string): Promise<{
    diceResult: DiceResult;
    splitOccurred: boolean;
    dividends: Array<{ playerId: string; playerName: string; amount: number }>;
    belowPar: boolean;
  }> {
    const diceResult = GameLogic.rollDice();

    this.sql.exec(
      `INSERT INTO dice_rolls
         (player_id, stock_die, action_die, amount_die, result_stock, result_action, result_amount, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      playerId, diceResult.stockDie, diceResult.actionDie, diceResult.amountDie,
      diceResult.resultStock, diceResult.resultAction, diceResult.resultAmount,
      new Date().toISOString()
    );

    const stock = this.sql.exec(
      'SELECT current_price FROM stocks WHERE stock_type = ?',
      diceResult.resultStock
    ).toArray()[0];
    if (!stock) {
      throw new Error('Stock not found');
    }
    const currentPrice = stock.current_price as number;

    const newPrice = GameLogic.calculateNewStockPrice(
      currentPrice,
      diceResult.resultAction,
      diceResult.resultAmount
    );

    let splitOccurred = false;
    if (GameLogic.shouldStockSplit(newPrice)) {
      splitOccurred = true;
      this.sql.exec(
        'UPDATE portfolios SET shares = shares * 2 WHERE stock_type = ? AND shares > 0',
        diceResult.resultStock
      );
      this.sql.exec(
        'UPDATE stocks SET current_price = ? WHERE stock_type = ?',
        STARTING_PRICE, diceResult.resultStock
      );
    } else {
      this.sql.exec(
        'UPDATE stocks SET current_price = ? WHERE stock_type = ?',
        newPrice, diceResult.resultStock
      );
    }

    const dividends: Array<{ playerId: string; playerName: string; amount: number }> = [];
    // 1937 rules: no dividend is paid on any stock whose value is under par ($1.00)
    const belowPar = diceResult.resultAction === 'dividend' && currentPrice < STARTING_PRICE;

    if (diceResult.resultAction === 'dividend') {
      const holders = this.sql.exec(
        `SELECT pf.player_id, pf.shares, p.name
           FROM portfolios pf JOIN players p ON p.id = pf.player_id
          WHERE pf.stock_type = ? AND pf.shares > 0`,
        diceResult.resultStock
      ).toArray();

      for (const holder of holders) {
        const dividend = GameLogic.calculateDividend(
          currentPrice,
          holder.shares as number,
          diceResult.resultAmount
        );
        if (dividend > 0) {
          this.sql.exec(
            'UPDATE players SET cash = cash + ? WHERE id = ?',
            dividend, holder.player_id as string
          );
          this.recordTransaction(
            holder.player_id as string, diceResult.resultStock,
            TransactionAction.DIVIDEND, holder.shares as number, 0, dividend
          );
          dividends.push({
            playerId: holder.player_id as string,
            playerName: holder.name as string,
            amount: dividend
          });
        }
      }
    }

    this.sql.exec('UPDATE game_state SET phase = ? WHERE id = 1', GamePhase.TRADING);

    return { diceResult, splitOccurred, dividends, belowPar };
  }

  async buyStock(playerId: string, stockType: StockType, shares: number): Promise<void> {
    const player = this.sql.exec('SELECT cash FROM players WHERE id = ?', playerId).toArray()[0];
    const stock = this.sql.exec(
      'SELECT current_price FROM stocks WHERE stock_type = ?', stockType
    ).toArray()[0];

    if (!player || !stock) {
      throw new Error('Player or stock not found');
    }

    const price = stock.current_price as number;
    const validation = GameLogic.validateSharePurchase(shares, price, player.cash as number);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const totalCost = shares * price;
    this.sql.exec('UPDATE players SET cash = cash - ? WHERE id = ?', totalCost, playerId);
    this.sql.exec(
      'UPDATE portfolios SET shares = shares + ? WHERE player_id = ? AND stock_type = ?',
      shares, playerId, stockType
    );
    this.recordTransaction(playerId, stockType, TransactionAction.BUY, shares, price, totalCost);
  }

  async sellStock(playerId: string, stockType: StockType, shares: number): Promise<void> {
    const portfolio = this.sql.exec(
      'SELECT shares FROM portfolios WHERE player_id = ? AND stock_type = ?',
      playerId, stockType
    ).toArray()[0];
    const stock = this.sql.exec(
      'SELECT current_price FROM stocks WHERE stock_type = ?', stockType
    ).toArray()[0];

    if (!portfolio || !stock) {
      throw new Error('Portfolio or stock not found');
    }

    const validation = GameLogic.validateShareSale(shares, portfolio.shares as number);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const price = stock.current_price as number;
    const totalValue = shares * price;
    this.sql.exec('UPDATE players SET cash = cash + ? WHERE id = ?', totalValue, playerId);
    this.sql.exec(
      'UPDATE portfolios SET shares = shares - ? WHERE player_id = ? AND stock_type = ?',
      shares, playerId, stockType
    );
    this.recordTransaction(playerId, stockType, TransactionAction.SELL, shares, price, totalValue);
  }

  async endTurn(): Promise<{ currentPlayerId: string }> {
    const state = this.sql.exec('SELECT current_turn FROM game_state WHERE id = 1').toArray()[0];
    const players = this.sql.exec(
      'SELECT id FROM players ORDER BY turn_order ASC'
    ).toArray();

    if (!state || players.length === 0) {
      throw new Error('Room or game state not found');
    }

    const nextTurn = (state.current_turn as number) + 1;
    const nextPlayer = players[nextTurn % players.length];

    this.sql.exec(
      'UPDATE game_state SET current_turn = ?, current_player_id = ?, phase = ? WHERE id = 1',
      nextTurn, nextPlayer.id as string, GamePhase.ROLLING
    );

    return { currentPlayerId: nextPlayer.id as string };
  }

  /** Broadcast the latest game state to every connected socket (used after REST mutations). */
  async broadcastGameState(): Promise<void> {
    this.broadcast('game-state-updated', this.buildGameState());
  }

  private recordTransaction(
    playerId: string, stockType: string, action: string,
    shares: number, pricePerShare: number, totalAmount: number
  ): void {
    this.sql.exec(
      `INSERT INTO transactions
         (player_id, stock_type, action, shares, price_per_share, total_amount, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      playerId, stockType, action, shares, pricePerShare, totalAmount,
      new Date().toISOString()
    );
  }

  private getRoomRow() {
    return this.sql.exec('SELECT * FROM room WHERE id = 1').toArray()[0];
  }

  // ---------------------------------------------------------------------
  // WebSockets (hibernation API)
  // ---------------------------------------------------------------------

  async fetch(request: Request): Promise<Response> {
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected WebSocket upgrade', { status: 426 });
    }

    const pair = new WebSocketPair();
    const [client, server] = [pair[0], pair[1]];
    this.ctx.acceptWebSocket(server);
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    let event: string;
    let data: any;
    try {
      ({ event, data } = JSON.parse(message as string));
    } catch {
      this.send(ws, 'error', { code: 'BAD_MESSAGE', message: 'Messages must be JSON: {event, data}' });
      return;
    }

    try {
      switch (event) {
        case 'join-room':
          await this.handleJoin(ws, data);
          break;
        case 'roll-dice':
          await this.handleRollDice(ws, data);
          break;
        case 'buy-stock':
          await this.handleTrade(ws, data, 'buy');
          break;
        case 'sell-stock':
          await this.handleTrade(ws, data, 'sell');
          break;
        case 'end-turn':
          await this.handleEndTurn(ws);
          break;
        default:
          this.send(ws, 'error', { code: 'UNKNOWN_EVENT', message: `Unknown event: ${event}` });
      }
    } catch (error) {
      const codes: Record<string, string> = {
        'join-room': 'JOIN_ROOM_ERROR',
        'roll-dice': 'DICE_ROLL_ERROR',
        'buy-stock': 'BUY_STOCK_ERROR',
        'sell-stock': 'SELL_STOCK_ERROR',
        'end-turn': 'END_TURN_ERROR'
      };
      this.send(ws, 'error', {
        code: codes[event] || 'INTERNAL_ERROR',
        message: `Failed to handle ${event}`,
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async webSocketClose(ws: WebSocket): Promise<void> {
    const attachment = ws.deserializeAttachment() as SocketAttachment | null;
    if (!attachment) return;

    const { playerId, playerName } = attachment;
    this.sql.exec('UPDATE players SET connected = 0 WHERE id = ?', playerId);

    this.broadcast('player-disconnected', {
      playerId,
      playerName,
      message: `${playerName} disconnected`
    }, ws);
    this.broadcast('game-state-updated', this.buildGameState(), ws);
  }

  private async handleJoin(
    ws: WebSocket,
    data: { roomId: string; playerId: string; playerName: string }
  ): Promise<void> {
    const { roomId, playerId, playerName } = data;

    const player = this.sql.exec('SELECT id FROM players WHERE id = ?', playerId).toArray()[0];
    if (!player) {
      throw new Error('Player not found in this room');
    }

    ws.serializeAttachment({ playerId, playerName } satisfies SocketAttachment);
    this.sql.exec('UPDATE players SET connected = 1 WHERE id = ?', playerId);

    this.broadcast('player-joined', {
      playerId,
      playerName,
      message: `${playerName} joined the game`
    }, ws);

    this.broadcast('game-state-updated', this.buildGameState());

    this.send(ws, 'room-joined', { success: true, roomId, playerId, playerName });
  }

  private async handleRollDice(ws: WebSocket, data: { playerId: string }): Promise<void> {
    const attachment = this.requireAttachment(ws);
    if (attachment.playerId !== data.playerId) {
      this.send(ws, 'error', { code: 'UNAUTHORIZED', message: 'You are not authorized to perform this action' });
      return;
    }

    const result = await this.rollDice(data.playerId);

    this.broadcast('dice-rolled', {
      playerId: data.playerId,
      playerName: attachment.playerName,
      diceResult: result.diceResult,
      splitOccurred: result.splitOccurred,
      dividends: result.dividends,
      belowPar: result.belowPar
    });
    this.broadcast('game-state-updated', this.buildGameState());
  }

  private async handleTrade(
    ws: WebSocket,
    data: { playerId: string; stockType: string; shares: number },
    action: 'buy' | 'sell'
  ): Promise<void> {
    const attachment = this.requireAttachment(ws);
    if (attachment.playerId !== data.playerId) {
      this.send(ws, 'error', { code: 'UNAUTHORIZED', message: 'You are not authorized to perform this action' });
      return;
    }

    if (action === 'buy') {
      await this.buyStock(data.playerId, data.stockType as StockType, data.shares);
    } else {
      await this.sellStock(data.playerId, data.stockType as StockType, data.shares);
    }

    const verb = action === 'buy' ? 'bought' : 'sold';
    this.broadcast('stock-transaction', {
      playerId: data.playerId,
      playerName: attachment.playerName,
      action,
      stockType: data.stockType,
      shares: data.shares,
      message: `${attachment.playerName} ${verb} ${data.shares} shares of ${data.stockType.toUpperCase()}`
    });
    this.broadcast('game-state-updated', this.buildGameState());
  }

  private async handleEndTurn(ws: WebSocket): Promise<void> {
    const attachment = this.requireAttachment(ws);
    const { currentPlayerId } = await this.endTurn();

    this.broadcast('turn-ended', {
      playerId: attachment.playerId,
      playerName: attachment.playerName,
      message: `${attachment.playerName} ended their turn`
    });
    this.broadcast('game-state-updated', this.buildGameState());
    this.broadcast('turn-changed', { currentPlayerId });
  }

  private requireAttachment(ws: WebSocket): SocketAttachment {
    const attachment = ws.deserializeAttachment() as SocketAttachment | null;
    if (!attachment) {
      throw new Error('You must join the room before performing actions');
    }
    return attachment;
  }

  private send(ws: WebSocket, event: string, data: any): void {
    try {
      ws.send(JSON.stringify({ event, data }));
    } catch {
      // Socket already closed; close handler will clean up.
    }
  }

  private broadcast(event: string, data: any, exclude?: WebSocket): void {
    const payload = JSON.stringify({ event, data });
    for (const socket of this.ctx.getWebSockets()) {
      if (socket === exclude) continue;
      try {
        socket.send(payload);
      } catch {
        // Skip sockets that closed mid-broadcast.
      }
    }
  }
}
