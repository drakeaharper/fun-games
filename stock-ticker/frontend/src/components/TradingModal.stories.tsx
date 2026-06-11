import type { Meta, StoryObj } from '@storybook/react-webpack5';
import TradingModal from './TradingModal';
import { StockType } from '../types';

const stocks = [
  { stockType: StockType.GOLD, currentPrice: 100 },
  { stockType: StockType.SILVER, currentPrice: 110 },
  { stockType: StockType.BONDS, currentPrice: 95 },
  { stockType: StockType.OIL, currentPrice: 120 },
  { stockType: StockType.INDUSTRIALS, currentPrice: 145 },
  { stockType: StockType.GRAIN, currentPrice: 85 },
];

const playerStocks = {
  [StockType.GOLD]: 2000,
  [StockType.SILVER]: 500,
  [StockType.BONDS]: 0,
  [StockType.OIL]: 1000,
  [StockType.INDUSTRIALS]: 0,
  [StockType.GRAIN]: 500,
};

const meta: Meta<typeof TradingModal> = {
  title: 'Game/TradingModal',
  component: TradingModal,
  parameters: { layout: 'fullscreen' },
  args: {
    isOpen: true,
    onClose: () => {},
    onTrade: () => {},
    stocks,
    playerStocks,
  },
};

export default meta;
type Story = StoryObj<typeof TradingModal>;

export const Buying: Story = {
  args: {
    mode: 'buy',
    playerCash: 450000, // $4500.00
  },
};

export const BuyingLowCash: Story = {
  args: {
    mode: 'buy',
    playerCash: 40000, // $400.00 — can't afford a 500-share lot of anything
  },
};

export const Selling: Story = {
  args: {
    mode: 'sell',
    playerCash: 450000,
  },
};

export const Loading: Story = {
  args: {
    mode: 'buy',
    playerCash: 450000,
    isLoading: true,
  },
};
