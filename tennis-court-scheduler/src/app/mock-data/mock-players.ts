export interface Player {
  id: string;
  name: string;
  seed: number; // Required seed number for ranking
}

export const MOCK_PLAYERS: Player[] = [
  { id: '1', name: 'Alice Johnson', seed: 1 },
  { id: '2', name: 'Bob Smith', seed: 2 },
  { id: '3', name: 'Charlie Davis', seed: 3 },
  { id: '4', name: 'Diana Miller', seed: 4 },
  { id: '5', name: 'Edward Wilson', seed: 5 },
  { id: '6', name: 'Fiona Taylor', seed: 6 },
  { id: '7', name: 'George Brown', seed: 7 },
  { id: '8', name: 'Hannah Clark', seed: 8 },
  { id: '9', name: 'Ian Lewis', seed: 9 },
  { id: '10', name: 'Julia Moore', seed: 10 }
]; 