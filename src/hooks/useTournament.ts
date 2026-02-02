import { useState, useEffect, useMemo } from 'react';
import { Player, Match, PlayerStats, RoundRest } from '../types';
import { generateKDKMatches } from '../utils/kdkLogic';

const STORAGE_KEY = 'tennis_kdk_data_v1';

interface TournamentState {
  players: Player[];
  matches: Match[];
  courts: number;
  rounds: number;
  mixedDoubles: boolean;
  strictGenderMode: boolean;
  useRandomWithAvoidance: boolean;
  roundRests: RoundRest[];
}

const DEFAULT_STATE: TournamentState = {
  players: [],
  matches: [],
  courts: 1,
  rounds: 4,
  mixedDoubles: false,
  strictGenderMode: false,
  useRandomWithAvoidance: false,
  roundRests: []
};

export const useTournament = () => {
  const [state, setState] = useState<TournamentState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure backward compatibility
        return {
          ...parsed,
          rounds: parsed.rounds || 4,
          courts: parsed.courts || 1,
          mixedDoubles: parsed.mixedDoubles || false,
          strictGenderMode: parsed.strictGenderMode || false,
          useRandomWithAvoidance: parsed.useRandomWithAvoidance || false,
          roundRests: parsed.roundRests || []
        };
      } catch (e) {
        console.error('localStorage 파싱 오류:', e);
        return DEFAULT_STATE;
      }
    }
    return DEFAULT_STATE;
  });

  // Debounced localStorage save with error handling
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (e) {
        console.error('localStorage 저장 오류:', e);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [state]);

  const addPlayer = (name: string, gender: 'M' | 'F' = 'M', ntrp: number = 3.0) => {
    const newPlayer: Player = {
      id: crypto.randomUUID(),
      name,
      gender,
      ntrp,
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

  const setRounds = (rounds: number) => {
    setState(prev => ({ ...prev, rounds }));
  };

  const setCourts = (courts: number) => {
    setState(prev => ({ ...prev, courts }));
  };

  const setMixedDoubles = (mixedDoubles: boolean) => {
    setState(prev => ({ ...prev, mixedDoubles }));
  };

  const setStrictGenderMode = (strictGenderMode: boolean) => {
    setState(prev => ({ ...prev, strictGenderMode }));
  };

  const setUseRandomWithAvoidance = (useRandomWithAvoidance: boolean) => {
    setState(prev => ({ ...prev, useRandomWithAvoidance }));
  };

  const generateMatches = () => {
    const result = generateKDKMatches(
      state.players,
      state.courts,
      state.rounds,
      state.mixedDoubles,
      state.strictGenderMode,
      state.useRandomWithAvoidance
    );
    setState(prev => ({
      ...prev,
      matches: result.matches,
      roundRests: result.roundRests
    }));
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
    if (confirm('대회를 초기화 하시겠습니까? 모든 대진표와 점수가 삭제됩니다.')) {
        setState(prev => ({ ...prev, matches: [], roundRests: [] }));
    }
  };

  const clearAllData = () => {
      if (confirm('정말로 모든 데이터를 삭제하시겠습니까? 플레이어 목록도 포함됩니다.')) {
        setState({
            players: [],
            matches: [],
            courts: 1,
            rounds: 4,
            mixedDoubles: false,
            strictGenderMode: false,
            useRandomWithAvoidance: false,
            roundRests: []
        });
      }
  }

  // Calculate Stats with useMemo for performance
  const stats: PlayerStats[] = useMemo(() => {
    return state.players.map(player => {
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
  }, [state.players, state.matches]);

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
    clearAllData,
    rounds: state.rounds,
    setRounds,
    courts: state.courts,
    setCourts,
    mixedDoubles: state.mixedDoubles,
    setMixedDoubles,
    strictGenderMode: state.strictGenderMode,
    setStrictGenderMode,
    useRandomWithAvoidance: state.useRandomWithAvoidance,
    setUseRandomWithAvoidance,
    roundRests: state.roundRests
  };
};
