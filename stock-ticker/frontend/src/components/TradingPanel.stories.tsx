import type { Meta, StoryObj } from '@storybook/react-webpack5';
import TradingPanel from './TradingPanel';
import { StockType, DiceAction } from '../types';

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

const noStocks = {
  [StockType.GOLD]: 0,
  [StockType.SILVER]: 0,
  [StockType.BONDS]: 0,
  [StockType.OIL]: 0,
  [StockType.INDUSTRIALS]: 0,
  [StockType.GRAIN]: 0,
};

const meta: Meta<typeof TradingPanel> = {
  title: 'Game/TradingPanel',
  component: TradingPanel,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div style={{ width: '420px' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    stocks,
    playerStocks,
    onTrade: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof TradingPanel>;

export const YourTradingPhase: Story = {
  args: {
    playerCash: 450000, // $4500.00
    canTrade: true,
  },
};

export const LowCash: Story = {
  args: {
    playerCash: 40000, // $400.00 — can't afford a 500-share lot of anything
    canTrade: true,
  },
};

export const FreshPlayer: Story = {
  args: {
    playerCash: 500000, // $5000.00, owns nothing — sell always disabled
    playerStocks: noStocks,
    canTrade: true,
  },
};

export const NotYourTurn: Story = {
  args: {
    playerCash: 450000,
    canTrade: false,
  },
};

export const WithPriceChanges: Story = {
  args: {
    playerCash: 450000,
    canTrade: true,
    priceChanges: {
      [StockType.GOLD]: { action: DiceAction.UP, amount: 20 },
      [StockType.SILVER]: { action: DiceAction.DOWN, amount: 5 },
      [StockType.OIL]: { action: DiceAction.DIVIDEND, amount: 10 },
    },
  },
};
