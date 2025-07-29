import { PrismaClient } from '@prisma/client';
import { 
  StockType, 
  GamePhase, 
  RoomStatus, 
  TransactionAction,
  GameStateData,
  PlayerPortfolio,
  StockPrice
} from '../types';
import { GameLogic } from './gameLogic';

const prisma = new PrismaClient();

export class DatabaseService {
  /**
   * Create a new game room
   */
  static async createRoom(name: string): Promise<{ id: string; inviteCode: string }> {
    const inviteCode = GameLogic.generateInviteCode();
    
    const room = await prisma.room.create({
      data: {
        name,
        inviteCode,
        status: RoomStatus.WAITING
      }
    });

    // Initialize stocks for the room
    const stocks = GameLogic.initializeStocks();
    await prisma.stock.createMany({
      data: stocks.map(stock => ({
        roomId: room.id,
        stockType: stock.stockType,
        currentPrice: stock.currentPrice
      }))
    });

    // Create initial game state
    await prisma.gameState.create({
      data: {
        roomId: room.id,
        currentTurn: 0,
        phase: GamePhase.WAITING
      }
    });

    return { id: room.id, inviteCode: room.inviteCode };
  }

  /**
   * Join a room by invite code
   */
  static async joinRoom(inviteCode: string, playerName: string): Promise<{ roomId: string; playerId: string }> {
    const room = await prisma.room.findUnique({
      where: { inviteCode },
      include: { players: true }
    });

    if (!room) {
      throw new Error('Room not found');
    }

    if (room.status !== RoomStatus.WAITING) {
      throw new Error('Room is not accepting new players');
    }

    if (room.players.length >= room.maxPlayers) {
      throw new Error('Room is full');
    }

    // Check if player name is already taken in this room
    const existingPlayer = room.players.find(p => p.name === playerName);
    if (existingPlayer) {
      throw new Error('Player name already taken in this room');
    }

    const player = await prisma.player.create({
      data: {
        roomId: room.id,
        name: playerName,
        turnOrder: room.players.length,
        cash: 500000 // $5000 in cents
      }
    });

    // Initialize empty portfolio for all stock types
    const portfolioData = Object.values(StockType).map(stockType => ({
      playerId: player.id,
      roomId: room.id,
      stockType,
      shares: 0
    }));

    await prisma.portfolio.createMany({ data: portfolioData });

    return { roomId: room.id, playerId: player.id };
  }

  /**
   * Start a game
   */
  static async startGame(roomId: string): Promise<void> {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: { players: true }
    });

    if (!room) {
      throw new Error('Room not found');
    }

    if (room.players.length < 2) {
      throw new Error('Need at least 2 players to start');
    }

    // Update room status and game state
    await prisma.$transaction([
      prisma.room.update({
        where: { id: roomId },
        data: { status: RoomStatus.PLAYING }
      }),
      prisma.gameState.update({
        where: { roomId },
        data: {
          phase: GamePhase.ROLLING,
          currentPlayerId: room.players[0].id // Start with first player
        }
      })
    ]);
  }

  /**
   * Get current game state
   */
  static async getGameState(roomId: string): Promise<GameStateData> {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        players: {
          include: { portfolios: true },
          orderBy: { turnOrder: 'asc' }
        },
        stocks: true,
        gameState: true
      }
    });

    if (!room || !room.gameState) {
      throw new Error('Game not found');
    }

    // Calculate stock prices as a record
    const stockPrices = {} as Record<StockType, number>;
    room.stocks.forEach(stock => {
      stockPrices[stock.stockType as StockType] = stock.currentPrice;
    });

    // Calculate player portfolios
    const players: PlayerPortfolio[] = room.players.map(player => {
      const stocks = {} as Record<StockType, number>;
      player.portfolios.forEach(portfolio => {
        stocks[portfolio.stockType as StockType] = portfolio.shares;
      });

      const totalValue = GameLogic.calculatePortfolioValue(
        player.cash,
        player.portfolios.map(p => ({ stockType: p.stockType as StockType, shares: p.shares })),
        stockPrices
      );

      return {
        playerId: player.id,
        cash: player.cash,
        stocks,
        totalValue
      };
    });

    const stockPricesArray: StockPrice[] = room.stocks.map(stock => ({
      stockType: stock.stockType as StockType,
      currentPrice: stock.currentPrice
    }));

    return {
      roomId: room.id,
      currentTurn: room.gameState.currentTurn,
      currentPlayerId: room.gameState.currentPlayerId,
      phase: room.gameState.phase as GamePhase,
      players,
      stocks: stockPricesArray
    };
  }

  /**
   * Execute dice roll and update game state
   */
  static async rollDice(roomId: string, playerId: string) {
    const diceResult = GameLogic.rollDice();
    
    return await prisma.$transaction(async (tx) => {
      // Record the dice roll
      await tx.diceRoll.create({
        data: {
          roomId,
          playerId,
          stockDie: diceResult.stockDie,
          actionDie: diceResult.actionDie,
          amountDie: diceResult.amountDie,
          resultStock: diceResult.resultStock,
          resultAction: diceResult.resultAction,
          resultAmount: diceResult.resultAmount
        }
      });

      // Get current stock price
      const stock = await tx.stock.findUnique({
        where: {
          roomId_stockType: {
            roomId,
            stockType: diceResult.resultStock
          }
        }
      });

      if (!stock) {
        throw new Error('Stock not found');
      }

      // Calculate new price
      const newPrice = GameLogic.calculateNewStockPrice(
        stock.currentPrice,
        diceResult.resultAction,
        diceResult.resultAmount
      );

      // Handle stock split if necessary
      let splitOccurred = false;
      if (GameLogic.shouldStockSplit(newPrice)) {
        splitOccurred = true;
        
        // Double all player shares for this stock and reset price
        const portfolios = await tx.portfolio.findMany({
          where: {
            roomId,
            stockType: diceResult.resultStock
          }
        });

        for (const portfolio of portfolios) {
          if (portfolio.shares > 0) {
            await tx.portfolio.update({
              where: {
                playerId_stockType: {
                  playerId: portfolio.playerId,
                  stockType: diceResult.resultStock
                }
              },
              data: { shares: portfolio.shares * 2 }
            });
          }
        }

        // Update stock price to $1.00
        await tx.stock.update({
          where: {
            roomId_stockType: {
              roomId,
              stockType: diceResult.resultStock
            }
          },
          data: { currentPrice: 100 } // $1.00 in cents
        });
      } else {
        // Normal price update
        await tx.stock.update({
          where: {
            roomId_stockType: {
              roomId,
              stockType: diceResult.resultStock
            }
          },
          data: { currentPrice: newPrice }
        });
      }

      // Handle dividends
      if (diceResult.resultAction === 'dividend') {
        const portfolios = await tx.portfolio.findMany({
          where: {
            roomId,
            stockType: diceResult.resultStock,
            shares: { gt: 0 }
          },
          include: { player: true }
        });

        for (const portfolio of portfolios) {
          const dividend = GameLogic.calculateDividend(
            stock.currentPrice,
            portfolio.shares,
            diceResult.resultAmount
          );

          if (dividend > 0) {
            // Update player cash
            await tx.player.update({
              where: { id: portfolio.playerId },
              data: { cash: { increment: dividend } }
            });

            // Record dividend transaction
            await tx.transaction.create({
              data: {
                playerId: portfolio.playerId,
                roomId,
                stockType: diceResult.resultStock,
                action: TransactionAction.DIVIDEND,
                shares: portfolio.shares,
                pricePerShare: 0,
                totalAmount: dividend
              }
            });
          }
        }
      }

      // Update game phase to trading
      await tx.gameState.update({
        where: { roomId },
        data: { phase: GamePhase.TRADING }
      });

      return { diceResult, splitOccurred };
    });
  }

  /**
   * Buy stocks
   */
  static async buyStock(
    roomId: string, 
    playerId: string, 
    stockType: StockType, 
    shares: number
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const player = await tx.player.findUnique({ where: { id: playerId } });
      const stock = await tx.stock.findUnique({
        where: { roomId_stockType: { roomId, stockType } }
      });

      if (!player || !stock) {
        throw new Error('Player or stock not found');
      }

      const validation = GameLogic.validateSharePurchase(shares, stock.currentPrice, player.cash);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      const totalCost = shares * stock.currentPrice;

      // Update player cash
      await tx.player.update({
        where: { id: playerId },
        data: { cash: { decrement: totalCost } }
      });

      // Update portfolio
      await tx.portfolio.update({
        where: {
          playerId_stockType: { playerId, stockType }
        },
        data: { shares: { increment: shares } }
      });

      // Record transaction
      await tx.transaction.create({
        data: {
          playerId,
          roomId,
          stockType,
          action: TransactionAction.BUY,
          shares,
          pricePerShare: stock.currentPrice,
          totalAmount: totalCost
        }
      });
    });
  }

  /**
   * Sell stocks
   */
  static async sellStock(
    roomId: string,
    playerId: string,
    stockType: StockType,
    shares: number
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const portfolio = await tx.portfolio.findUnique({
        where: { playerId_stockType: { playerId, stockType } }
      });
      const stock = await tx.stock.findUnique({
        where: { roomId_stockType: { roomId, stockType } }
      });

      if (!portfolio || !stock) {
        throw new Error('Portfolio or stock not found');
      }

      const validation = GameLogic.validateShareSale(shares, portfolio.shares);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      const totalValue = shares * stock.currentPrice;

      // Update player cash
      await tx.player.update({
        where: { id: playerId },
        data: { cash: { increment: totalValue } }
      });

      // Update portfolio
      await tx.portfolio.update({
        where: { playerId_stockType: { playerId, stockType } },
        data: { shares: { decrement: shares } }
      });

      // Record transaction
      await tx.transaction.create({
        data: {
          playerId,
          roomId,
          stockType,
          action: TransactionAction.SELL,
          shares,
          pricePerShare: stock.currentPrice,
          totalAmount: totalValue
        }
      });
    });
  }

  /**
   * End current player's turn
   */
  static async endTurn(roomId: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const room = await tx.room.findUnique({
        where: { id: roomId },
        include: { 
          players: { orderBy: { turnOrder: 'asc' } },
          gameState: true
        }
      });

      if (!room || !room.gameState) {
        throw new Error('Room or game state not found');
      }

      const nextTurn = room.gameState.currentTurn + 1;
      const nextPlayerIndex = nextTurn % room.players.length;
      const nextPlayer = room.players[nextPlayerIndex];

      await tx.gameState.update({
        where: { roomId },
        data: {
          currentTurn: nextTurn,
          currentPlayerId: nextPlayer.id,
          phase: GamePhase.ROLLING
        }
      });
    });
  }

  /**
   * Close database connection
   */
  static async disconnect(): Promise<void> {
    await prisma.$disconnect();
  }
}

export { prisma };