export interface Player {
  id: string;
  name: string;
  gender: 'M' | 'F';
  active: boolean;
}

export interface Match {
  id: string;
  round: number;
  courtNumber: number;
  team1: [string, string]; // Player IDs
  team2: [string, string]; // Player IDs
  score1: number | null;
  score2: number | null;
}

export interface TournamentData {
  players: Player[];
  matches: Match[];
  courts: number;
  gamesPerPlayer: number; // usually 4
}

export interface PlayerStats {
  playerId: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDiff: number;
  winRate: number;
}
