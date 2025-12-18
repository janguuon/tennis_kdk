import { Player, Match } from '../types';

export const generateKDKMatches = (players: Player[], courts: number = 1, targetRounds: number = 4, mixedDoubles: boolean = false): Match[] => {
  const activePlayers = players.filter(p => p.active);
  const playerCount = activePlayers.length;
  
  // Basic validation
  if (playerCount < 4) return [];

  let matches: Match[] = [];

  if (mixedDoubles) {
    // Mixed doubles mode: Skip fixed patterns and use specialized generation
    return generateMixedDoublesSchedule(activePlayers, targetRounds, courts);
  }
  
  // Check if we have a fixed pattern for this number of players
  if (playerCount === 8 || playerCount === 12 || playerCount === 16) {
    let fixedMatches: Match[] = [];
    
    if (playerCount === 8) {
      fixedMatches = generate8PlayerSchedule(activePlayers, courts);
    } else if (playerCount === 12) {
      fixedMatches = generate12PlayerSchedule(activePlayers, courts);
    } else if (playerCount === 16) {
      fixedMatches = generate16PlayerSchedule(activePlayers, courts);
    }

    if (targetRounds <= 4) {
      // If requested rounds are less than or equal to 4, just slice the fixed schedule
      matches = fixedMatches.filter(m => m.round <= targetRounds);
    } else {
      // If requested rounds > 4, keep the fixed schedule and add generic rounds
      matches = [...fixedMatches];
      const extraRounds = targetRounds - 4;
      const genericMatches = generateGenericSchedule(activePlayers, extraRounds, courts, 5); // Start from round 5
      matches = [...matches, ...genericMatches];
    }
  } else {
    // For other player counts, use generic schedule for all rounds
    matches = generateGenericSchedule(activePlayers, targetRounds, courts);
  }

  return matches;
};

const createMatchesFromIndices = (players: Player[], scheduleIndices: number[][][], courts: number): Match[] => {
  return scheduleIndices.map((matchIds, index) => {
    const matchesPerRound = players.length / 4;
    const round = Math.floor(index / matchesPerRound) + 1;
    // Distribute matches across available courts
    // matchInRound is 0-indexed within the round
    const matchInRound = index % matchesPerRound;
    const courtNumber = (matchInRound % courts) + 1;

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

const generate8PlayerSchedule = (players: Player[], courts: number): Match[] => {
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

  return createMatchesFromIndices(players, scheduleIndices, courts);
};

const generate12PlayerSchedule = (players: Player[], courts: number): Match[] => {
  // 12 Players, 3 Courts, 4 Rounds
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

  return createMatchesFromIndices(players, scheduleIndices, courts);
};

const generate16PlayerSchedule = (players: Player[], courts: number): Match[] => {
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

  return createMatchesFromIndices(players, scheduleIndices, courts);
};

const generateMixedDoublesSchedule = (players: Player[], rounds: number, courts: number, startRound: number = 1): Match[] => {
  const matches: Match[] = [];
  const matchesPerRound = Math.floor(players.length / 4);
  
  const playCounts: Record<string, number> = {};
  players.forEach(p => playCounts[p.id] = 0);

  for (let r = 0; r < rounds; r++) {
    const currentRound = startRound + r;

    // 1. Sort and Separate
    const men = players.filter(p => p.gender === 'M' || !p.gender)
      .map(value => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value)
      .sort((a, b) => playCounts[a.id] - playCounts[b.id]);

    const women = players.filter(p => p.gender === 'F')
      .map(value => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value)
      .sort((a, b) => playCounts[a.id] - playCounts[b.id]);

    const roundMatches: Player[][] = [];

    // 2. Form Mixed Doubles (M, F) vs (M, F)
    let mIdx = 0;
    let wIdx = 0;
    
    while (mIdx + 1 < men.length && wIdx + 1 < women.length) {
      if (roundMatches.length >= matchesPerRound) break;
      roundMatches.push([men[mIdx++], women[wIdx++], men[mIdx++], women[wIdx++]]);
    }

    // 3. Form remaining matches with leftovers
    const leftovers = [
      ...men.slice(mIdx),
      ...women.slice(wIdx)
    ];

    let lIdx = 0;
    while (roundMatches.length < matchesPerRound && lIdx + 3 < leftovers.length) {
       roundMatches.push([leftovers[lIdx++], leftovers[lIdx++], leftovers[lIdx++], leftovers[lIdx++]]);
    }

    // 4. Convert to Match objects
    roundMatches.forEach((teamPlayers, m) => {
      matches.push({
        id: `match-mixed-${currentRound}-${m}`,
        round: currentRound,
        courtNumber: (m % courts) + 1,
        team1: [teamPlayers[0].id, teamPlayers[1].id],
        team2: [teamPlayers[2].id, teamPlayers[3].id],
        score1: null,
        score2: null,
      });

      teamPlayers.forEach(p => playCounts[p.id]++);
    });
  }

  return matches;
};

const generateGenericSchedule = (players: Player[], rounds: number, courts: number, startRound: number = 1): Match[] => {
  // A generic random pairing algorithm that tries to be fair.
  const matches: Match[] = [];
  const playerCount = players.length;
  const matchesPerRound = Math.floor(playerCount / 4);
  
  // Track play counts
  const playCounts: Record<string, number> = {};
  players.forEach(p => playCounts[p.id] = 0);

  for (let r = 0; r < rounds; r++) {
    const currentRound = startRound + r;
    
    // Sort players by play count to give priority to those who played less
    // Shuffle first for randomness in tie-breaking, then sort by play counts
    const availablePlayers = [...players]
      .map(value => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value)
      .sort((a, b) => playCounts[a.id] - playCounts[b.id]);
    
    // Create matches
    let playerIdx = 0;
    for (let m = 0; m < matchesPerRound; m++) {
      if (playerIdx + 3 >= availablePlayers.length) break;
      
      const p1 = availablePlayers[playerIdx++];
      const p2 = availablePlayers[playerIdx++];
      const p3 = availablePlayers[playerIdx++];
      const p4 = availablePlayers[playerIdx++];

      matches.push({
        id: `match-gen-${currentRound}-${m}`,
        round: currentRound,
        courtNumber: (m % courts) + 1,
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
