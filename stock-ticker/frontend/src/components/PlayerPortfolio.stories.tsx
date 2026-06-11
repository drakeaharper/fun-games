import type { Meta, StoryObj } from '@storybook/react-webpack5';
import PlayerPortfolio from './PlayerPortfolio';
import { StockType } from '../types';

const richPortfolio = {
  playerId: 'harry-456',
  playerName: 'HostHarry',
  connected: true,
  cash: 235000, // $2350.00
  stocks: {
    [StockType.GOLD]: 2000,
    [StockType.SILVER]: 500,
    [StockType.BONDS]: 0,
    [StockType.OIL]: 1000,
    [StockType.INDUSTRIALS]: 0,
    [StockType.GRAIN]: 500,
  },
  totalValue: 655000, // $6550.00
};

const freshPortfolio = {
  playerId: 'penny-123',
  playerName: 'PlayerPenny',
  connected: true,
  cash: 500000, // $5000.00
  stocks: {
    [StockType.GOLD]: 0,
    [StockType.SILVER]: 0,
    [StockType.BONDS]: 0,
    [StockType.OIL]: 0,
    [StockType.INDUSTRIALS]: 0,
    [StockType.GRAIN]: 0,
  },
  totalValue: 500000,
};

const meta: Meta<typeof PlayerPortfolio> = {
  title: 'Game/PlayerPortfolio',
  component: PlayerPortfolio,
  parameters: { layout: 'centered' },
};

export default meta;
type Story = StoryObj<typeof PlayerPortfolio>;

export const Invested: Story = {
  args: {
    portfolio: richPortfolio,
    playerName: 'HostHarry',
    isCurrentPlayer: true,
  },
};

export const FreshPlayer: Story = {
  args: {
    portfolio: freshPortfolio,
    playerName: 'PlayerPenny',
    isCurrentPlayer: false,
  },
};

export const ActiveTurn: Story = {
  args: {
    portfolio: richPortfolio,
    playerName: 'HostHarry',
    isCurrentPlayer: true,
    isActivePlayer: true,
  },
};

export const Disconnected: Story = {
  args: {
    portfolio: { ...richPortfolio, connected: false },
    playerName: 'HostHarry',
  },
};
