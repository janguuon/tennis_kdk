import { useState, useEffect, useMemo } from 'react';
import {
  TournamentMatch,
  TournamentRound,
  TournamentPlayer,
  RoundRobinMatch,
  RoundRobinStanding
} from '../types/tournament';

const STORAGE_KEY = 'tennis_tournament_bracket_v1';

interface BracketState {
  format: 'elimination' | 'round-robin';
  type: 'singles' | 'doubles';
  // Elimination specific
  roundOf: number; // 32, 16, 8, 4
  rounds: TournamentRound[];
  // Round-robin specific
  rrTeams: TournamentPlayer[][];
  rrMatches: RoundRobinMatch[];
  // Common
  status: 'setup' | 'in_progress' | 'completed';
}

const DEFAULT_STATE: BracketState = {
  format: 'elimination',
  type: 'doubles',
  roundOf: 16,
  rounds: [],
  rrTeams: [],
  rrMatches: [],
  status: 'setup'
};

export const useTournamentBracket = () => {
  const [state, setState] = useState<BracketState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure backward compatibility
        return {
          ...DEFAULT_STATE,
          ...parsed,
          format: parsed.format || 'elimination',
          rrTeams: parsed.rrTeams || [],
          rrMatches: parsed.rrMatches || []
        };
      } catch (e) {
        console.error('localStorage 파싱 오류:', e);
        return DEFAULT_STATE;
      }
    }
    return DEFAULT_STATE;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('localStorage 저장 오류:', e);
    }
  }, [state]);

  // ============ Elimination Tournament Functions ============

  const startTournament = (
    roundOf: number,
    type: 'singles' | 'doubles',
    teams: TournamentPlayer[][]
  ) => {
    const totalRounds = Math.log2(roundOf);
    const newRounds: TournamentRound[] = [];
    let matchCount = roundOf / 2;

    for (let r = 0; r < totalRounds; r++) {
      const matches: TournamentMatch[] = [];
      for (let m = 0; m < matchCount; m++) {
        matches.push({
          id: `r${r}-m${m}`,
          round: roundOf / Math.pow(2, r),
          matchNumber: m,
          team1: r === 0 ? (teams[m * 2] || []) : [],
          team2: r === 0 ? (teams[m * 2 + 1] || []) : [],
          score1: null,
          score2: null,
          winner: null,
          nextMatchId: r < totalRounds - 1 ? `r${r + 1}-m${Math.floor(m / 2)}` : undefined
        });
      }
      newRounds.push({
        roundOf: roundOf / Math.pow(2, r),
        matches
      });
      matchCount /= 2;
    }

    setState({
      ...DEFAULT_STATE,
      format: 'elimination',
      type,
      roundOf,
      rounds: newRounds,
      status: 'in_progress'
    });
  };

  const updateMatchScore = (roundIndex: number, matchId: string, score1: number, score2: number) => {
    setState(prev => {
      const newRounds = [...prev.rounds];
      const round = newRounds[roundIndex];
      const matchIndex = round.matches.findIndex(m => m.id === matchId);

      if (matchIndex === -1) return prev;

      const match = { ...round.matches[matchIndex] };
      match.score1 = score1;
      match.score2 = score2;

      // Determine winner
      let winner: 1 | 2 | null = null;
      if (score1 > score2) winner = 1;
      else if (score2 > score1) winner = 2;

      match.winner = winner;
      round.matches[matchIndex] = match;

      // Propagate to next round
      if (match.nextMatchId && winner) {
        const nextRoundIndex = roundIndex + 1;
        if (nextRoundIndex < newRounds.length) {
          const nextRound = newRounds[nextRoundIndex];
          const nextMatchIndex = nextRound.matches.findIndex(m => m.id === match.nextMatchId);

          if (nextMatchIndex !== -1) {
            const nextMatch = { ...nextRound.matches[nextMatchIndex] };
            const isTeam1InNext = match.matchNumber % 2 === 0;

            if (isTeam1InNext) {
              nextMatch.team1 = winner === 1 ? match.team1 : match.team2;
            } else {
              nextMatch.team2 = winner === 1 ? match.team1 : match.team2;
            }

            nextRound.matches[nextMatchIndex] = nextMatch;
          }
        }
      }

      // Check if tournament is complete
      let newStatus = prev.status;
      const lastRound = newRounds[newRounds.length - 1];
      if (lastRound.matches[0].winner) {
        newStatus = 'completed';
      }

      return {
        ...prev,
        rounds: newRounds,
        status: newStatus
      };
    });
  };

  // ============ Round-Robin Tournament Functions ============

  const startRoundRobin = (
    type: 'singles' | 'doubles',
    teams: TournamentPlayer[][]
  ) => {
    // Generate all matches (each team plays every other team once)
    const matches: RoundRobinMatch[] = [];
    let matchNumber = 0;

    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        matches.push({
          id: `rr-${matchNumber}`,
          matchNumber,
          team1: teams[i],
          team2: teams[j],
          team1Index: i,
          team2Index: j,
          score1: null,
          score2: null,
          winner: null
        });
        matchNumber++;
      }
    }

    setState({
      ...DEFAULT_STATE,
      format: 'round-robin',
      type,
      rrTeams: teams,
      rrMatches: matches,
      status: 'in_progress'
    });
  };

  const updateRoundRobinScore = (matchId: string, score1: number, score2: number) => {
    setState(prev => {
      const newMatches = [...prev.rrMatches];
      const matchIndex = newMatches.findIndex(m => m.id === matchId);

      if (matchIndex === -1) return prev;

      const match = { ...newMatches[matchIndex] };
      match.score1 = score1;
      match.score2 = score2;

      // Determine winner (0 for draw)
      if (score1 > score2) match.winner = 1;
      else if (score2 > score1) match.winner = 2;
      else match.winner = 0;

      newMatches[matchIndex] = match;

      // Check if all matches are completed
      const allCompleted = newMatches.every(m => m.winner !== null);

      return {
        ...prev,
        rrMatches: newMatches,
        status: allCompleted ? 'completed' : 'in_progress'
      };
    });
  };

  // Calculate standings for round-robin
  const rrStandings: RoundRobinStanding[] = useMemo(() => {
    if (state.format !== 'round-robin' || state.rrTeams.length === 0) {
      return [];
    }

    const standings: RoundRobinStanding[] = state.rrTeams.map((team, index) => ({
      teamIndex: index,
      team,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      pointDiff: 0,
      points: 0
    }));

    state.rrMatches.forEach(match => {
      if (match.score1 === null || match.score2 === null) return;

      const team1 = standings[match.team1Index];
      const team2 = standings[match.team2Index];

      team1.played++;
      team2.played++;

      team1.pointsFor += match.score1;
      team1.pointsAgainst += match.score2;
      team2.pointsFor += match.score2;
      team2.pointsAgainst += match.score1;

      if (match.winner === 1) {
        team1.wins++;
        team1.points += 3;
        team2.losses++;
      } else if (match.winner === 2) {
        team2.wins++;
        team2.points += 3;
        team1.losses++;
      } else if (match.winner === 0) {
        team1.draws++;
        team2.draws++;
        team1.points += 1;
        team2.points += 1;
      }
    });

    // Calculate point diff and sort
    standings.forEach(s => {
      s.pointDiff = s.pointsFor - s.pointsAgainst;
    });

    return standings.sort((a, b) => {
      if (a.points !== b.points) return b.points - a.points;
      if (a.pointDiff !== b.pointDiff) return b.pointDiff - a.pointDiff;
      return b.pointsFor - a.pointsFor;
    });
  }, [state.format, state.rrTeams, state.rrMatches]);

  // ============ Common Functions ============

  const resetBracket = () => {
    if (confirm('토너먼트를 초기화 하시겠습니까?')) {
      setState(DEFAULT_STATE);
    }
  };

  return {
    bracketState: state,
    // Elimination
    startTournament,
    updateMatchScore,
    // Round-robin
    startRoundRobin,
    updateRoundRobinScore,
    rrStandings,
    // Common
    resetBracket
  };
};
