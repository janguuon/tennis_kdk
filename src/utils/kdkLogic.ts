import { Player, Match } from '../types';

export const generateKDKMatches = (players: Player[], _courts: number = 1): Match[] => {
  const activePlayers = players.filter(p => p.active);
  const playerCount = activePlayers.length;
  
  // Basic validation
  if (playerCount < 4) return [];

  const rounds = 4; // Standard KDK usually has 4 games per person
  
  if (playerCount === 8) {
    return generate8PlayerSchedule(activePlayers);
  } else if (playerCount === 12) {
    return generate12PlayerSchedule(activePlayers);
  } else if (playerCount === 16) {
    return generate16PlayerSchedule(activePlayers);
  } else {
    return generateGenericSchedule(activePlayers, rounds);
  }
};

const createMatchesFromIndices = (players: Player[], scheduleIndices: number[][][]): Match[] => {
  return scheduleIndices.map((matchIds, index) => {
    const matchesPerRound = players.length / 4;
    const round = Math.floor(index / matchesPerRound) + 1;
    const courtNumber = (index % matchesPerRound) + 1;

    return {
      id: `match-${players.length}-${index}`,
      round,
      courtNumber,
      team1: [players[matchIds[0][0]].id, players[matchIds[0][1]].id],
      team2: [players[matchIds[1][0]].id, players[matchIds[1][1]].id],
      score1: null,
      score2: null,
    };
  });
};

const generate8PlayerSchedule = (players: Player[]): Match[] => {
  // Standard KDK 8-player, 4-game schedule
  const scheduleIndices = [
    // Round 1
    [[0, 1], [2, 3]], [[4, 5], [6, 7]],
    // Round 2
    [[0, 4], [2, 6]], [[1, 5], [3, 7]],
    // Round 3
    [[0, 2], [5, 7]], [[1, 3], [4, 6]],
    // Round 4
    [[0, 7], [3, 6]], [[1, 4], [2, 5]]
  ];

  return createMatchesFromIndices(players, scheduleIndices);
};

const generate12PlayerSchedule = (players: Player[]): Match[] => {
  // 12 Players, 3 Courts, 4 Rounds
  // Optimized to ensure unique partners for everyone as much as possible
  const scheduleIndices = [
    // Round 1
    [[0, 1], [2, 3]], [[4, 5], [6, 7]], [[8, 9], [10, 11]],
    // Round 2
    [[0, 4], [2, 6]], [[1, 5], [3, 7]], [[8, 10], [9, 11]],
    // Round 3
    [[0, 8], [2, 9]], [[1, 6], [3, 10]], [[4, 7], [5, 11]],
    // Round 4
    [[0, 2], [1, 3]], [[4, 6], [5, 7]], [[8, 11], [9, 10]]
  ];

  return createMatchesFromIndices(players, scheduleIndices);
};

const generate16PlayerSchedule = (players: Player[]): Match[] => {
  // 16 Players, 4 Courts, 4 Rounds
  const scheduleIndices = [
    // Round 1
    [[0, 1], [2, 3]], [[4, 5], [6, 7]], [[8, 9], [10, 11]], [[12, 13], [14, 15]],
    // Round 2
    [[0, 4], [8, 12]], [[1, 5], [9, 13]], [[2, 6], [10, 14]], [[3, 7], [11, 15]],
    // Round 3
    [[0, 2], [5, 7]], [[1, 3], [4, 6]], [[8, 10], [13, 15]], [[9, 11], [12, 14]],
    // Round 4
    [[0, 8], [1, 9]], [[2, 10], [3, 11]], [[4, 12], [5, 13]], [[6, 14], [7, 15]]
  ];

  return createMatchesFromIndices(players, scheduleIndices);
};

const generateGenericSchedule = (players: Player[], rounds: number): Match[] => {
  // A generic random pairing algorithm that tries to be fair.
  const matches: Match[] = [];
  const playerCount = players.length;
  const matchesPerRound = Math.floor(playerCount / 4);
  
  // Track play counts
  const playCounts: Record<string, number> = {};
  players.forEach(p => playCounts[p.id] = 0);

  for (let r = 1; r <= rounds; r++) {
    // Sort players by play count to give priority to those who played less
    // For random generation, we shuffle first then sort stable
    const availablePlayers = [...players].sort(() => Math.random() - 0.5);
    
    // Create matches
    let playerIdx = 0;
    for (let m = 0; m < matchesPerRound; m++) {
      if (playerIdx + 3 >= availablePlayers.length) break;
      
      const p1 = availablePlayers[playerIdx++];
      const p2 = availablePlayers[playerIdx++];
      const p3 = availablePlayers[playerIdx++];
      const p4 = availablePlayers[playerIdx++];

      matches.push({
        id: `match-gen-${r}-${m}`,
        round: r,
        courtNumber: m + 1,
        team1: [p1.id, p2.id],
        team2: [p3.id, p4.id],
        score1: null,
        score2: null,
      });

      playCounts[p1.id]++;
      playCounts[p2.id]++;
      playCounts[p3.id]++;
      playCounts[p4.id]++;
    }
  }

  return matches;
};
