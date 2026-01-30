import { Player, Match } from '../types';

export const generateKDKMatches = (players: Player[], courts: number = 1, targetRounds: number = 4, mixedDoubles: boolean = false, strictGenderMode: boolean = false): Match[] => {
  const activePlayers = players.filter(p => p.active);
  const playerCount = activePlayers.length;

  // Basic validation
  if (playerCount < 4) return [];

  if (strictGenderMode) {
    return generateStrictGenderSchedule(activePlayers, targetRounds, courts);
  }

  if (mixedDoubles) {
    // Mixed doubles mode: Skip fixed patterns and use specialized generation
    return generateMixedDoublesSchedule(activePlayers, targetRounds, courts);
  }

  // Use generic schedule with duplicate minimization for all player counts
  // This ensures partner/opponent history tracking works properly
  return generateGenericSchedule(activePlayers, targetRounds, courts);
};

const balanceTeamsNTRP = (players: Player[]): Player[] => {
  // Ensure we have 4 players
  if (players.length !== 4) return players;

  // Helper to safely get NTRP
  const getNTRP = (p: Player) => p.ntrp || 3.0;

  // Check for 2 Men and 2 Women case (Mixed Doubles preference)
  const men = players.filter(p => p.gender === 'M');
  const women = players.filter(p => p.gender === 'F');

  if (men.length === 2 && women.length === 2) {
    // We have 2 Men and 2 Women.
    // We want to avoid MM vs FF.
    // So we must pair M-F vs M-F.
    const m1 = men[0];
    const m2 = men[1];
    const w1 = women[0];
    const w2 = women[1];

    // Option A: (M1, W1) vs (M2, W2)
    const diffA = Math.abs((getNTRP(m1) + getNTRP(w1)) - (getNTRP(m2) + getNTRP(w2)));
    
    // Option B: (M1, W2) vs (M2, W1)
    const diffB = Math.abs((getNTRP(m1) + getNTRP(w2)) - (getNTRP(m2) + getNTRP(w1)));

    if (diffA <= diffB) {
      return [m1, w1, m2, w2];
    } else {
      return [m1, w2, m2, w1];
    }
  }

  // General Case: Try to minimize NTRP difference between Team 1 and Team 2
  // Possible Pairings:
  // 1. (0, 1) vs (2, 3)
  // 2. (0, 2) vs (1, 3)
  // 3. (0, 3) vs (1, 2)
  
  const p = players;
  const combos = [
    { 
      teams: [p[0], p[1], p[2], p[3]], 
      diff: Math.abs((getNTRP(p[0]) + getNTRP(p[1])) - (getNTRP(p[2]) + getNTRP(p[3]))) 
    },
    { 
      teams: [p[0], p[2], p[1], p[3]], 
      diff: Math.abs((getNTRP(p[0]) + getNTRP(p[2])) - (getNTRP(p[1]) + getNTRP(p[3]))) 
    },
    { 
      teams: [p[0], p[3], p[1], p[2]], 
      diff: Math.abs((getNTRP(p[0]) + getNTRP(p[3])) - (getNTRP(p[1]) + getNTRP(p[2]))) 
    }
  ];

  // Sort by smallest difference
  combos.sort((a, b) => a.diff - b.diff);

  return combos[0].teams;
};

const generateMixedDoublesSchedule = (players: Player[], rounds: number, courts: number, startRound: number = 1): Match[] => {
  const matches: Match[] = [];
  const matchesPerRound = Math.floor(players.length / 4);

  const playCounts: Record<string, number> = {};
  players.forEach(p => playCounts[p.id] = 0);

  // Track partner and opponent history for duplicate minimization
  const partnerHistory: Record<string, Record<string, number>> = {};
  const opponentHistory: Record<string, Record<string, number>> = {};
  players.forEach(p => {
    partnerHistory[p.id] = {};
    opponentHistory[p.id] = {};
  });

  // Helper to calculate pair duplicate score
  const getPairScore = (p1: Player, p2: Player): number => {
    return (partnerHistory[p1.id][p2.id] || 0) + (partnerHistory[p2.id][p1.id] || 0);
  };

  // Helper to calculate opponent duplicate score
  const getOpponentScore = (team1: Player[], team2: Player[]): number => {
    let score = 0;
    for (const p1 of team1) {
      for (const p2 of team2) {
        score += (opponentHistory[p1.id][p2.id] || 0);
      }
    }
    return score;
  };

  // Helper to update history after a match
  const updateHistory = (p1: Player, p2: Player, p3: Player, p4: Player) => {
    // Update partner history (bidirectional)
    partnerHistory[p1.id][p2.id] = (partnerHistory[p1.id][p2.id] || 0) + 1;
    partnerHistory[p2.id][p1.id] = (partnerHistory[p2.id][p1.id] || 0) + 1;
    partnerHistory[p3.id][p4.id] = (partnerHistory[p3.id][p4.id] || 0) + 1;
    partnerHistory[p4.id][p3.id] = (partnerHistory[p4.id][p3.id] || 0) + 1;
    // Update opponent history (bidirectional)
    opponentHistory[p1.id][p3.id] = (opponentHistory[p1.id][p3.id] || 0) + 1;
    opponentHistory[p1.id][p4.id] = (opponentHistory[p1.id][p4.id] || 0) + 1;
    opponentHistory[p2.id][p3.id] = (opponentHistory[p2.id][p3.id] || 0) + 1;
    opponentHistory[p2.id][p4.id] = (opponentHistory[p2.id][p4.id] || 0) + 1;
    opponentHistory[p3.id][p1.id] = (opponentHistory[p3.id][p1.id] || 0) + 1;
    opponentHistory[p3.id][p2.id] = (opponentHistory[p3.id][p2.id] || 0) + 1;
    opponentHistory[p4.id][p1.id] = (opponentHistory[p4.id][p1.id] || 0) + 1;
    opponentHistory[p4.id][p2.id] = (opponentHistory[p4.id][p2.id] || 0) + 1;
  };

  for (let r = 0; r < rounds; r++) {
    const currentRound = startRound + r;

    // 1. Sort and Separate - combine playCount priority with random tiebreaker
    const men = players.filter(p => p.gender === 'M')
      .map(value => ({
        value,
        priority: playCounts[value.id] + Math.random() * 0.5
      }))
      .sort((a, b) => a.priority - b.priority)
      .map(({ value }) => value);

    const women = players.filter(p => p.gender === 'F')
      .map(value => ({
        value,
        priority: playCounts[value.id] + Math.random() * 0.5
      }))
      .sort((a, b) => a.priority - b.priority)
      .map(({ value }) => value);

    const roundMatches: Player[][] = [];
    const usedMen = new Set<string>();
    const usedWomen = new Set<string>();

    // 2. Form Mixed Doubles (M, F) vs (M, F) with duplicate minimization
    const availableMen = () => men.filter(m => !usedMen.has(m.id));
    const availableWomen = () => women.filter(w => !usedWomen.has(w.id));

    while (availableMen().length >= 2 && availableWomen().length >= 2) {
      if (roundMatches.length >= matchesPerRound) break;

      const menPool = availableMen();
      const womenPool = availableWomen();

      // Find best combination with minimum duplicate score
      let bestMatch: Player[] | null = null;
      let bestScore = Infinity;

      // Try different combinations of 2 men and 2 women
      const menCombinations: Player[][] = [];
      for (let i = 0; i < menPool.length; i++) {
        for (let j = i + 1; j < menPool.length; j++) {
          menCombinations.push([menPool[i], menPool[j]]);
        }
      }

      const womenCombinations: Player[][] = [];
      for (let i = 0; i < womenPool.length; i++) {
        for (let j = i + 1; j < womenPool.length; j++) {
          womenCombinations.push([womenPool[i], womenPool[j]]);
        }
      }

      // Limit combinations to avoid performance issues
      const maxMenCombos = Math.min(menCombinations.length, 10);
      const maxWomenCombos = Math.min(womenCombinations.length, 10);

      for (let mi = 0; mi < maxMenCombos; mi++) {
        const [m1, m2] = menCombinations[mi];
        for (let wi = 0; wi < maxWomenCombos; wi++) {
          const [w1, w2] = womenCombinations[wi];

          // Try both team formations: (m1,w1) vs (m2,w2) and (m1,w2) vs (m2,w1)
          const formations = [
            [m1, w1, m2, w2],
            [m1, w2, m2, w1]
          ];

          for (const formation of formations) {
            const pairScore = getPairScore(formation[0], formation[1]) + getPairScore(formation[2], formation[3]);
            const oppScore = getOpponentScore([formation[0], formation[1]], [formation[2], formation[3]]);
            const totalScore = pairScore + oppScore;

            if (totalScore < bestScore) {
              bestScore = totalScore;
              bestMatch = formation;
            }

            if (totalScore === 0) break;
          }

          if (bestScore === 0) break;
        }

        if (bestScore === 0) break;
      }

      if (bestMatch) {
        roundMatches.push(bestMatch);
        usedMen.add(bestMatch[0].id);
        usedMen.add(bestMatch[2].id);
        usedWomen.add(bestMatch[1].id);
        usedWomen.add(bestMatch[3].id);
      } else {
        break;
      }
    }

    // 3. Form remaining matches with leftovers
    const leftovers = [
      ...men.filter(m => !usedMen.has(m.id)),
      ...women.filter(w => !usedWomen.has(w.id))
    ];

    let lIdx = 0;
    // Need at least 4 players for a match
    while (roundMatches.length < matchesPerRound && lIdx + 4 <= leftovers.length) {
      const p1 = leftovers[lIdx];
      const p2 = leftovers[lIdx + 1];
      const p3 = leftovers[lIdx + 2];
      const p4 = leftovers[lIdx + 3];
      roundMatches.push([p1, p2, p3, p4]);
      lIdx += 4;
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
      updateHistory(teamPlayers[0], teamPlayers[1], teamPlayers[2], teamPlayers[3]);
    });
  }

  return matches;
};

const generateStrictGenderSchedule = (players: Player[], rounds: number, courts: number, startRound: number = 1): Match[] => {
  const matches: Match[] = [];
  // We don't strictly enforce matchesPerRound because strict mode might result in fewer matches if gender counts don't align
  const maxMatchesPerRound = Math.floor(players.length / 4);

  const playCounts: Record<string, number> = {};
  players.forEach(p => playCounts[p.id] = 0);

  // Track match type counts for balanced distribution
  const matchTypeCounts: Record<'MD' | 'WD' | 'XD', number> = { MD: 0, WD: 0, XD: 0 };

  for (let r = 0; r < rounds; r++) {
    const currentRound = startRound + r;
    const roundMatches: Match[] = [];

    // Sort players by play count (ascending), then random
    const sortedPlayers = [...players]
      .map(value => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort) // Random shuffle first
      .map(({ value }) => value)
      .sort((a, b) => playCounts[a.id] - playCounts[b.id]); // Then strict play count sort

    // Separate by gender
    const men = sortedPlayers.filter(p => p.gender === 'M');
    const women = sortedPlayers.filter(p => p.gender === 'F');

    // We will track used players in this round to prevent double booking
    const usedPlayerIds = new Set<string>();

    const isAvailable = (p: Player) => !usedPlayerIds.has(p.id);

    // Helper to add match
    const addMatch = (p1: Player, p2: Player, p3: Player, p4: Player, matchType: 'MD' | 'WD' | 'XD') => {
      if (roundMatches.length >= maxMatchesPerRound) return false;

      const teamPlayers = balanceTeamsNTRP([p1, p2, p3, p4]);

      matches.push({
        id: `match-strict-${currentRound}-${roundMatches.length}`,
        round: currentRound,
        courtNumber: (roundMatches.length % courts) + 1,
        team1: [teamPlayers[0].id, teamPlayers[1].id],
        team2: [teamPlayers[2].id, teamPlayers[3].id],
        score1: null,
        score2: null,
      });

      roundMatches.push(matches[matches.length - 1]);
      [p1, p2, p3, p4].forEach(p => {
        usedPlayerIds.add(p.id);
        playCounts[p.id]++;
      });

      // Update match type count
      matchTypeCounts[matchType]++;
      return true;
    };

    // Try to form matches by prioritizing the players with the fewest games played
    // Iterate through sorted players and try to find a match for the highest priority available player
    while (roundMatches.length < maxMatchesPerRound) {
      let matchFormed = false;

      // Find the first available player who can form a match
      for (const p of sortedPlayers) {
        if (!isAvailable(p)) continue;

        const options: ('MD' | 'WD' | 'XD')[] = [];
        const availMen = men.filter(isAvailable);
        const availWomen = women.filter(isAvailable);

        if (p.gender === 'M') {
          // Player is Male
          // Can form MD? Needs 3 other men (total 4)
          if (availMen.length >= 4) options.push('MD');
          // Can form XD? Needs 1 other man and 2 women
          if (availMen.length >= 2 && availWomen.length >= 2) options.push('XD');
        } else {
          // Player is Female
          // Can form WD? Needs 3 other women (total 4)
          if (availWomen.length >= 4) options.push('WD');
          // Can form XD? Needs 2 men and 1 other woman
          if (availMen.length >= 2 && availWomen.length >= 2) options.push('XD');
        }

        if (options.length > 0) {
          // Select match type with balanced distribution (prefer least used type)
          const sortedOptions = [...options].sort((a, b) => matchTypeCounts[a] - matchTypeCounts[b]);
          const type = sortedOptions[0];

          if (type === 'XD') {
            // Ensure p is included in the match
            if (p.gender === 'M') {
              // p is Male: take p, 1 other man, and 2 women
              const otherMen = availMen.filter(m => m.id !== p.id);
              addMatch(p, otherMen[0], availWomen[0], availWomen[1], 'XD');
            } else {
              // p is Female: take 2 men, p, and 1 other woman
              const otherWomen = availWomen.filter(w => w.id !== p.id);
              addMatch(availMen[0], availMen[1], p, otherWomen[0], 'XD');
            }
          } else if (type === 'MD') {
            // Ensure p is included in men's doubles
            const otherMen = availMen.filter(m => m.id !== p.id);
            addMatch(p, otherMen[0], otherMen[1], otherMen[2], 'MD');
          } else if (type === 'WD') {
            // Ensure p is included in women's doubles
            const otherWomen = availWomen.filter(w => w.id !== p.id);
            addMatch(p, otherWomen[0], otherWomen[1], otherWomen[2], 'WD');
          }

          matchFormed = true;
          break; // Break inner loop to re-evaluate from top
        }
      }

      if (!matchFormed) break; // No more matches possible
    }

    // Note: Players left over sit out this round
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

  // Track partner and opponent history for duplicate minimization
  const partnerHistory: Record<string, Record<string, number>> = {};
  const opponentHistory: Record<string, Record<string, number>> = {};
  players.forEach(p => {
    partnerHistory[p.id] = {};
    opponentHistory[p.id] = {};
  });

  // Helper to calculate match duplicate score (lower is better)
  const calculateDuplicateScore = (p1: Player, p2: Player, p3: Player, p4: Player): number => {
    let score = 0;
    // Partner duplicates: (p1,p2) and (p3,p4)
    score += (partnerHistory[p1.id][p2.id] || 0) + (partnerHistory[p2.id][p1.id] || 0);
    score += (partnerHistory[p3.id][p4.id] || 0) + (partnerHistory[p4.id][p3.id] || 0);
    // Opponent duplicates
    score += (opponentHistory[p1.id][p3.id] || 0) + (opponentHistory[p1.id][p4.id] || 0);
    score += (opponentHistory[p2.id][p3.id] || 0) + (opponentHistory[p2.id][p4.id] || 0);
    return score;
  };

  // Helper to update history after a match
  const updateHistory = (p1: Player, p2: Player, p3: Player, p4: Player) => {
    // Update partner history (bidirectional)
    partnerHistory[p1.id][p2.id] = (partnerHistory[p1.id][p2.id] || 0) + 1;
    partnerHistory[p2.id][p1.id] = (partnerHistory[p2.id][p1.id] || 0) + 1;
    partnerHistory[p3.id][p4.id] = (partnerHistory[p3.id][p4.id] || 0) + 1;
    partnerHistory[p4.id][p3.id] = (partnerHistory[p4.id][p3.id] || 0) + 1;
    // Update opponent history (bidirectional)
    opponentHistory[p1.id][p3.id] = (opponentHistory[p1.id][p3.id] || 0) + 1;
    opponentHistory[p1.id][p4.id] = (opponentHistory[p1.id][p4.id] || 0) + 1;
    opponentHistory[p2.id][p3.id] = (opponentHistory[p2.id][p3.id] || 0) + 1;
    opponentHistory[p2.id][p4.id] = (opponentHistory[p2.id][p4.id] || 0) + 1;
    opponentHistory[p3.id][p1.id] = (opponentHistory[p3.id][p1.id] || 0) + 1;
    opponentHistory[p3.id][p2.id] = (opponentHistory[p3.id][p2.id] || 0) + 1;
    opponentHistory[p4.id][p1.id] = (opponentHistory[p4.id][p1.id] || 0) + 1;
    opponentHistory[p4.id][p2.id] = (opponentHistory[p4.id][p2.id] || 0) + 1;
  };

  for (let r = 0; r < rounds; r++) {
    const currentRound = startRound + r;

    // Sort players by play count to give priority to those who played less
    // Shuffle first for randomness in tie-breaking, then sort by play counts
    const availablePlayers = [...players]
      .map(value => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value)
      .sort((a, b) => playCounts[a.id] - playCounts[b.id]);

    const usedInRound = new Set<string>();

    // Create matches
    for (let m = 0; m < matchesPerRound; m++) {
      // Get available players for this match
      const remaining = availablePlayers.filter(p => !usedInRound.has(p.id));
      if (remaining.length < 4) break;

      // Find best 4-player combination with minimum duplicate score
      let bestMatch: Player[] | null = null;
      let bestScore = Infinity;

      // Try multiple random combinations and pick the best one
      const attempts = Math.min(20, Math.floor(remaining.length * (remaining.length - 1) / 2));
      for (let attempt = 0; attempt < attempts; attempt++) {
        // Shuffle and pick first 4
        const shuffled = [...remaining].sort(() => Math.random() - 0.5);
        const candidate = shuffled.slice(0, 4);
        const score = calculateDuplicateScore(candidate[0], candidate[1], candidate[2], candidate[3]);

        if (score < bestScore) {
          bestScore = score;
          bestMatch = candidate;
        }

        // Perfect match found (no duplicates)
        if (score === 0) break;
      }

      if (!bestMatch) break;

      // Use NTRP balancing (which also handles MM vs FF avoidance)
      const matchPlayers = balanceTeamsNTRP(bestMatch);

      const p1 = matchPlayers[0];
      const p2 = matchPlayers[1];
      const p3 = matchPlayers[2];
      const p4 = matchPlayers[3];

      matches.push({
        id: `match-gen-${currentRound}-${m}`,
        round: currentRound,
        courtNumber: (m % courts) + 1,
        team1: [p1.id, p2.id],
        team2: [p3.id, p4.id],
        score1: null,
        score2: null,
      });

      // Mark players as used in this round
      [p1, p2, p3, p4].forEach(p => usedInRound.add(p.id));

      // Update counts and history
      playCounts[p1.id]++;
      playCounts[p2.id]++;
      playCounts[p3.id]++;
      playCounts[p4.id]++;

      updateHistory(p1, p2, p3, p4);
    }
  }

  return matches;
};
