import type { Meta, StoryObj } from '@storybook/react-webpack5';
import Header from './Header';

const meta: Meta<typeof Header> = {
  title: 'Layout/Header',
  component: Header,
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof Header>;

export const Home: Story = {
  args: {
    showGameInfo: false,
  },
};

export const InGame: Story = {
  args: {
    showGameInfo: true,
    gameInfo: {
      roomCode: 'W6WUMA',
      playerCount: 4,
    },
  },
};
