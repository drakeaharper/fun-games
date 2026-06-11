import type { Meta, StoryObj } from '@storybook/react-webpack5';
import StockCard from './StockCard';
import { StockType } from '../types';

const meta: Meta<typeof StockCard> = {
  title: 'Game/StockCard',
  component: StockCard,
  parameters: { layout: 'centered' },
  args: {
    onClick: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof StockCard>;

export const AtPar: Story = {
  args: {
    stock: { stockType: StockType.GOLD, currentPrice: 100 },
  },
};

export const PriceUp: Story = {
  args: {
    stock: { stockType: StockType.INDUSTRIALS, currentPrice: 145 },
    priceChange: 10,
  },
};

export const BelowPar: Story = {
  args: {
    stock: { stockType: StockType.GRAIN, currentPrice: 85 },
    priceChange: -20,
  },
};

export const WithShares: Story = {
  args: {
    stock: { stockType: StockType.OIL, currentPrice: 120 },
    playerShares: 1500,
  },
};

export const Selected: Story = {
  args: {
    stock: { stockType: StockType.SILVER, currentPrice: 110 },
    playerShares: 500,
    isSelected: true,
  },
};

export const NearSplit: Story = {
  args: {
    stock: { stockType: StockType.BONDS, currentPrice: 195 },
    playerShares: 2000,
    priceChange: 20,
  },
};

export const Disabled: Story = {
  args: {
    stock: { stockType: StockType.GOLD, currentPrice: 100 },
    disabled: true,
  },
};
