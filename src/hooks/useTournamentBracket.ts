import { useState, useEffect } from 'react';
import { TournamentMatch, TournamentRound, TournamentPlayer } from '../types/tournament';

const STORAGE_KEY = 'tennis_tournament_bracket_v1';

interface BracketState {
  type: 'singles' | 'doubles';
  roundOf: number; // 32, 16, 8, 4
  rounds: TournamentRound[];
  status: 'setup' | 'in_progress' | 'completed';
}

export const useTournamentBracket = () => {
  const [state, setState] = useState<BracketState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      type: 'doubles',
      roundOf: 16,
      rounds: [],
      status: 'setup'
    };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const startTournament = (
    roundOf: number,
    type: 'singles' | 'doubles',
    teams: TournamentPlayer[][] // Array of teams. Each team is array of players.
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
           nextMatchId: r < totalRounds - 1 ? `r${r+1}-m${Math.floor(m/2)}` : undefined
         });
       }
       newRounds.push({
         roundOf: roundOf / Math.pow(2, r),
         matches
       });
       matchCount /= 2;
     }

     setState({
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

        // Check if tournament is complete (Final match has a winner)
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
  
  const resetBracket = () => {
      if (confirm('토너먼트를 초기화 하시겠습니까?')) {
          setState({
            type: 'doubles',
            roundOf: 16,
            rounds: [],
            status: 'setup'
          });
      }
  };

  return {
    bracketState: state,
    startTournament,
    updateMatchScore,
    resetBracket
  };
};
