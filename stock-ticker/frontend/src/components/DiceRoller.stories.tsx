import type { Meta, StoryObj } from '@storybook/react-webpack5';
import DiceRoller from './DiceRoller';
import { StockType, DiceAction } from '../types';

const meta: Meta<typeof DiceRoller> = {
  title: 'Game/DiceRoller',
  component: DiceRoller,
  parameters: { layout: 'centered' },
  args: {
    onRoll: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof DiceRoller>;

export const YourTurn: Story = {
  args: {
    isRolling: false,
    canRoll: true,
    lastResult: null,
  },
};

export const Rolling: Story = {
  args: {
    isRolling: true,
    canRoll: false,
    lastResult: null,
  },
};

export const AfterDividendRoll: Story = {
  args: {
    isRolling: false,
    canRoll: false,
    lastResult: {
      stockDie: 1,
      actionDie: 5,
      amountDie: 6,
      resultStock: StockType.GOLD,
      resultAction: DiceAction.DIVIDEND,
      resultAmount: 20,
    },
  },
};

export const AfterDownRoll: Story = {
  args: {
    isRolling: false,
    canRoll: false,
    lastResult: {
      stockDie: 6,
      actionDie: 1,
      amountDie: 3,
      resultStock: StockType.GRAIN,
      resultAction: DiceAction.DOWN,
      resultAmount: 10,
    },
  },
};

export const NotYourTurn: Story = {
  args: {
    isRolling: false,
    canRoll: false,
    disabled: true,
    lastResult: null,
  },
};
