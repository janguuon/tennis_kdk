
export interface TournamentPlayer {
  id: string;
  name: string;
}

export interface TournamentMatch {
  id: string;
  round: number; // 32, 16, 8, 4, 2 (Final)
  matchNumber: number; // Index in the round
  team1: TournamentPlayer[]; // 1 for singles, 2 for doubles
  team2: TournamentPlayer[];
  score1: number | null;
  score2: number | null;
  winner: 1 | 2 | null;
  nextMatchId?: string; // ID of the match where the winner goes
}

export interface TournamentRound {
  roundOf: number; // 32, 16, 8, 4, 2
  matches: TournamentMatch[];
}

export interface TournamentState {
  type: 'singles' | 'doubles';
  totalRounds: number; // e.g., 5 for Round of 32
  rounds: TournamentRound[];
  status: 'setup' | 'in_progress' | 'completed';
}
