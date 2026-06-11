import type { Meta, StoryObj } from '@storybook/react-webpack5';
import PlayerAvatar from './PlayerAvatar';

const meta: Meta<typeof PlayerAvatar> = {
  title: 'Game/PlayerAvatar',
  component: PlayerAvatar,
  parameters: { layout: 'centered' },
};

export default meta;
type Story = StoryObj<typeof PlayerAvatar>;

export const Default: Story = {
  args: {
    playerName: 'PlayerPenny',
    playerId: 'penny-123',
  },
};

export const Host: Story = {
  args: {
    playerName: 'HostHarry',
    playerId: 'harry-456',
    isHost: true,
  },
};

export const Large: Story = {
  args: {
    playerName: 'BigSpender',
    playerId: 'spender-789',
    size: 96,
  },
};
