export interface Poll {
  id: string;
  title: string;
  description: string;
  options: PollOption[];
  votes: Vote[];
}

export interface PollOption {
  id: string;
  date: string; // e.g., "2024-06-15"
  time: string; // e.g., "18:00"
}

export interface Vote {
  playerName: string;
  playerId?: string; // Added player ID to link with player data
  optionIds: string[]; // IDs of PollOption(s) the player selected
  createdAt?: string; // MongoDB timestamp
  updatedAt?: string; // MongoDB timestamp
}

export const MOCK_POLL: Poll = {
  id: '1',
  title: 'June Tennis Court Poll',
  description: 'Vote for your preferred date and time to play tennis!',
  options: [
    { id: 'a', date: '2024-06-15', time: '18:00' },
    { id: 'b', date: '2024-06-16', time: '10:00' },
    { id: 'c', date: '2024-06-16', time: '18:00' },
  ],
  votes: [
    { playerName: 'Alice Johnson', playerId: '1', optionIds: ['a', 'b'] },
    { playerName: 'Bob Smith', playerId: '2', optionIds: ['b'] },
    { playerName: 'Charlie Davis', playerId: '3', optionIds: ['b', 'c'] },
  ],
}; 