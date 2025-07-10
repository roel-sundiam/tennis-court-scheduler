export interface Poll {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  status?: string;
  options: DateOption[];
  votes?: Vote[]; // Add votes array at poll level
  totalVotes: number;
}

export interface DateOption {
  id: string;
  date: string;
  time: string;
  votes?: Vote[]; // Keep this for backward compatibility, but votes are actually at poll level
  isFull?: boolean;
  maxPlayers: number;
}

export interface Vote {
  playerName: string;
  playerId: string;
  optionIds: string[]; // Add optionIds array to match backend structure
  createdAt?: string; // Add timestamp for ordering votes
}