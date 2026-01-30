export interface TournamentPlayer {
  id: string;
  name: string;
}

// Elimination tournament types
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

// Round-robin tournament types
export interface RoundRobinMatch {
  id: string;
  matchNumber: number;
  team1: TournamentPlayer[];
  team2: TournamentPlayer[];
  team1Index: number; // Index in teams array for standings calculation
  team2Index: number;
  score1: number | null;
  score2: number | null;
  winner: 1 | 2 | 0 | null; // 0 for draw
}

export interface RoundRobinStanding {
  teamIndex: number;
  team: TournamentPlayer[];
  played: number;
  wins: number;
  draws: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDiff: number;
  points: number; // 승점 (승리 3점, 무승부 1점)
}

export interface RoundRobinState {
  type: 'singles' | 'doubles';
  teams: TournamentPlayer[][];
  matches: RoundRobinMatch[];
  status: 'setup' | 'in_progress' | 'completed';
}
