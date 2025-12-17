import { useState, useEffect } from 'react';
import { Player, Match, PlayerStats } from '../types';
import { generateKDKMatches } from '../utils/kdkLogic';

const STORAGE_KEY = 'tennis_kdk_data_v1';

interface TournamentState {
  players: Player[];
  matches: Match[];
  courts: number;
}

export const useTournament = () => {
  const [state, setState] = useState<TournamentState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      players: [],
      matches: [],
      courts: 1
    };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const addPlayer = (name: string) => {
    const newPlayer: Player = {
      id: crypto.randomUUID(),
      name,
      active: true
    };
    setState(prev => ({ ...prev, players: [...prev.players, newPlayer] }));
  };

  const removePlayer = (id: string) => {
    setState(prev => ({
      ...prev,
      players: prev.players.filter(p => p.id !== id)
    }));
  };

  const togglePlayerActive = (id: string) => {
    setState(prev => ({
      ...prev,
      players: prev.players.map(p => 
        p.id === id ? { ...p, active: !p.active } : p
      )
    }));
  };

  const generateMatches = () => {
    const newMatches = generateKDKMatches(state.players, state.courts);
    setState(prev => ({ ...prev, matches: newMatches }));
  };

  const updateScore = (matchId: string, score1: number, score2: number) => {
    setState(prev => ({
      ...prev,
      matches: prev.matches.map(m => 
        m.id === matchId ? { ...m, score1, score2 } : m
      )
    }));
  };

  const resetTournament = () => {
    if (confirm('Are you sure you want to reset the tournament? All matches and scores will be lost.')) {
        setState(prev => ({ ...prev, matches: [] }));
    }
  };

  const clearAllData = () => {
      if (confirm('Are you sure you want to clear EVERYTHING including players?')) {
        setState({
            players: [],
            matches: [],
            courts: 1
        });
      }
  }

  // Calculate Stats
  const stats: PlayerStats[] = state.players.map(player => {
    let matchesPlayed = 0;
    let wins = 0;
    let losses = 0;
    let draws = 0;
    let pointsFor = 0;
    let pointsAgainst = 0;

    state.matches.forEach(match => {
      if (match.score1 === null || match.score2 === null) return;

      const isTeam1 = match.team1.includes(player.id);
      const isTeam2 = match.team2.includes(player.id);

      if (isTeam1 || isTeam2) {
        matchesPlayed++;
        
        const myScore = isTeam1 ? match.score1 : match.score2;
        const oppScore = isTeam1 ? match.score2 : match.score1;

        pointsFor += myScore;
        pointsAgainst += oppScore;

        if (myScore > oppScore) wins++;
        else if (myScore < oppScore) losses++;
        else draws++;
      }
    });

    return {
      playerId: player.id,
      matchesPlayed,
      wins,
      losses,
      draws,
      pointsFor,
      pointsAgainst,
      pointDiff: pointsFor - pointsAgainst,
      winRate: matchesPlayed > 0 ? wins / matchesPlayed : 0
    };
  }).sort((a, b) => {
    if (a.wins !== b.wins) return b.wins - a.wins;
    if (a.pointDiff !== b.pointDiff) return b.pointDiff - a.pointDiff;
    return b.pointsFor - a.pointsFor;
  });

  return {
    players: state.players,
    matches: state.matches,
    stats,
    addPlayer,
    removePlayer,
    togglePlayerActive,
    generateMatches,
    updateScore,
    resetTournament,
    clearAllData
  };
};
