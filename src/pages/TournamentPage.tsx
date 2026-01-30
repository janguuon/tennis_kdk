import { useState, useEffect } from 'react';
import { Trophy, Users, Play, RefreshCw, Shuffle, Award, CheckCircle2 } from 'lucide-react';
import { useTournamentBracket } from '../hooks/useTournamentBracket';
import { TournamentPlayer, RoundRobinMatch } from '../types/tournament';

// Fisher-Yates shuffle algorithm
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export function TournamentPage() {
  const {
    bracketState,
    startTournament,
    updateMatchScore,
    startRoundRobin,
    updateRoundRobinScore,
    rrStandings,
    resetBracket
  } = useTournamentBracket();

  // Setup state
  const [setupFormat, setSetupFormat] = useState<'elimination' | 'round-robin'>('elimination');
  const [setupRoundOf, setSetupRoundOf] = useState<number>(16);
  const [setupType, setSetupType] = useState<'singles' | 'doubles'>('doubles');
  const [participants, setParticipants] = useState<string[]>([]);
  const [matchingMode, setMatchingMode] = useState<'sequential' | 'random'>('sequential');
  const [rrTeamCount, setRrTeamCount] = useState<number>(4);

  // Helper to manage input fields for participants
  const handleParticipantChange = (index: number, value: string) => {
    const newParticipants = [...participants];
    newParticipants[index] = value;
    setParticipants(newParticipants);
  };

  const handleStart = () => {
    const teamSize = setupType === 'doubles' ? 2 : 1;
    let teams: TournamentPlayer[][] = [];

    if (setupFormat === 'elimination') {
      const totalTeams = setupRoundOf;
      let pIndex = 0;
      for (let i = 0; i < totalTeams; i++) {
        const team: TournamentPlayer[] = [];
        for (let j = 0; j < teamSize; j++) {
          const name = participants[pIndex] || `Player ${pIndex + 1}`;
          team.push({ id: `p${pIndex}`, name });
          pIndex++;
        }
        teams.push(team);
      }

      if (matchingMode === 'random') {
        teams = shuffleArray(teams);
      }

      startTournament(setupRoundOf, setupType, teams);
    } else {
      // Round-robin
      let pIndex = 0;
      for (let i = 0; i < rrTeamCount; i++) {
        const team: TournamentPlayer[] = [];
        for (let j = 0; j < teamSize; j++) {
          const name = participants[pIndex] || `Player ${pIndex + 1}`;
          team.push({ id: `p${pIndex}`, name });
          pIndex++;
        }
        teams.push(team);
      }

      if (matchingMode === 'random') {
        teams = shuffleArray(teams);
      }

      startRoundRobin(setupType, teams);
    }
  };

  // Initialize participants array size when settings change
  useEffect(() => {
    let requiredParticipants: number;
    if (setupFormat === 'elimination') {
      requiredParticipants = setupRoundOf * (setupType === 'doubles' ? 2 : 1);
    } else {
      requiredParticipants = rrTeamCount * (setupType === 'doubles' ? 2 : 1);
    }

    if (participants.length !== requiredParticipants && bracketState.status === 'setup') {
      const newArr = Array(requiredParticipants).fill('');
      for (let i = 0; i < Math.min(participants.length, requiredParticipants); i++) {
        newArr[i] = participants[i];
      }
      setParticipants(newArr);
    }
  }, [setupFormat, setupRoundOf, setupType, rrTeamCount, bracketState.status]);

  const getTeamName = (team: TournamentPlayer[]) => {
    return team.map(p => p.name).join(' / ') || 'TBD';
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-10">
      <header className="bg-indigo-800 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white p-2 rounded-full">
                <Trophy className="w-8 h-8 text-indigo-800" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">토너먼트 매니저</h1>
                <p className="text-indigo-200 text-sm">
                  {bracketState.status !== 'setup' && (
                    bracketState.format === 'elimination' ? '엘리미네이션' : '리그전 (Round-Robin)'
                  )}
                  {bracketState.status === 'setup' && '대진표 및 경기 관리'}
                </p>
              </div>
            </div>

            {bracketState.status !== 'setup' && (
              <button
                onClick={resetBracket}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-700 hover:bg-indigo-600 rounded-md transition-colors text-sm"
              >
                <RefreshCw size={16} /> 새로 만들기
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {bracketState.status === 'setup' ? (
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Users className="text-indigo-600" />
              대회 설정
            </h2>

            {/* Tournament Format Selection */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">토너먼트 형식</label>
              <div className="flex gap-4">
                <label className={`flex-1 border rounded-md p-4 cursor-pointer text-center transition-colors ${setupFormat === 'elimination' ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-bold' : 'hover:bg-gray-50'}`}>
                  <input type="radio" className="hidden" name="format" checked={setupFormat === 'elimination'} onChange={() => setSetupFormat('elimination')} />
                  <div className="font-bold mb-1">엘리미네이션</div>
                  <div className="text-xs text-gray-500">패배 시 탈락 (토너먼트)</div>
                </label>
                <label className={`flex-1 border rounded-md p-4 cursor-pointer text-center transition-colors ${setupFormat === 'round-robin' ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-bold' : 'hover:bg-gray-50'}`}>
                  <input type="radio" className="hidden" name="format" checked={setupFormat === 'round-robin'} onChange={() => setSetupFormat('round-robin')} />
                  <div className="font-bold mb-1">리그전</div>
                  <div className="text-xs text-gray-500">모든 팀이 서로 한 번씩 대결</div>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">경기 방식</label>
                <div className="flex gap-4">
                  <label className={`flex-1 border rounded-md p-3 cursor-pointer text-center transition-colors ${setupType === 'doubles' ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-bold' : 'hover:bg-gray-50'}`}>
                    <input type="radio" className="hidden" name="type" checked={setupType === 'doubles'} onChange={() => setSetupType('doubles')} />
                    복식 (Doubles)
                  </label>
                  <label className={`flex-1 border rounded-md p-3 cursor-pointer text-center transition-colors ${setupType === 'singles' ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-bold' : 'hover:bg-gray-50'}`}>
                    <input type="radio" className="hidden" name="type" checked={setupType === 'singles'} onChange={() => setSetupType('singles')} />
                    단식 (Singles)
                  </label>
                </div>
              </div>

              {setupFormat === 'elimination' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">참가 규모 (강)</label>
                  <select
                    value={setupRoundOf}
                    onChange={(e) => setSetupRoundOf(Number(e.target.value))}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value={32}>32강</option>
                    <option value={16}>16강</option>
                    <option value={8}>8강</option>
                    <option value={4}>4강</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">참가 팀 수</label>
                  <select
                    value={rrTeamCount}
                    onChange={(e) => setRrTeamCount(Number(e.target.value))}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {[3, 4, 5, 6, 7, 8, 10, 12].map(n => (
                      <option key={n} value={n}>{n}팀 ({n * (n - 1) / 2}경기)</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">대진표 매칭 방식</label>
              <div className="flex gap-4">
                <label className={`flex-1 border rounded-md p-3 cursor-pointer text-center transition-colors ${matchingMode === 'sequential' ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-bold' : 'hover:bg-gray-50'}`}>
                  <input type="radio" className="hidden" name="matchingMode" checked={matchingMode === 'sequential'} onChange={() => setMatchingMode('sequential')} />
                  순서대로
                </label>
                <label className={`flex-1 border rounded-md p-3 cursor-pointer text-center transition-colors flex items-center justify-center gap-2 ${matchingMode === 'random' ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-bold' : 'hover:bg-gray-50'}`}>
                  <input type="radio" className="hidden" name="matchingMode" checked={matchingMode === 'random'} onChange={() => setMatchingMode('random')} />
                  <Shuffle size={16} />
                  랜덤
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {matchingMode === 'sequential'
                  ? '입력한 순서대로 대진표가 구성됩니다.'
                  : '참가자들이 무작위로 섞여서 대진표가 구성됩니다.'}
              </p>
            </div>

            <h3 className="text-lg font-semibold mb-4">참가자 입력 ({participants.length}명)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {participants.map((name, idx) => (
                <div key={idx} className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-gray-400">
                    {setupType === 'doubles'
                      ? `Team ${Math.floor(idx / 2) + 1}-${idx % 2 === 0 ? 'A' : 'B'}`
                      : `Player ${idx + 1}`}
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => handleParticipantChange(idx, e.target.value)}
                    placeholder={`참가자 ${idx + 1}`}
                    className="w-full p-2 pt-7 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  />
                </div>
              ))}
            </div>

            <button
              onClick={handleStart}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-lg flex items-center justify-center gap-2 shadow-lg transition-transform hover:scale-[1.01]"
            >
              <Play size={24} />
              {setupFormat === 'elimination' ? '토너먼트 시작' : '리그전 시작'}
            </button>
          </div>
        ) : bracketState.format === 'elimination' ? (
          // Elimination Bracket View
          <div className="overflow-x-auto pb-8">
            <div className="min-w-max flex gap-8">
              {bracketState.rounds.map((round, rIndex) => (
                <div key={rIndex} className="flex flex-col gap-8">
                  <div className="text-center font-bold text-gray-500 uppercase tracking-wider mb-4 sticky top-0 bg-gray-100 py-2">
                    {round.roundOf === 2 ? 'Final' : round.roundOf === 4 ? 'Semi-Final' : `Round of ${round.roundOf}`}
                  </div>
                  <div className="flex flex-col justify-around h-full gap-8">
                    {round.matches.map((match) => (
                      <div
                        key={match.id}
                        className={`w-64 bg-white rounded-lg border-l-4 shadow-sm relative flex flex-col
                          ${match.winner ? 'border-indigo-500' : 'border-gray-300'}
                        `}
                      >
                        <div className="p-3">
                          <div className="text-xs text-gray-400 mb-2 flex justify-between">
                            <span>Match #{match.matchNumber + 1}</span>
                          </div>

                          {/* Team 1 */}
                          <div className={`flex justify-between items-center mb-2 p-1 rounded ${match.winner === 1 ? 'bg-indigo-50 font-bold' : ''}`}>
                            <div className="text-sm truncate flex-1">
                              {match.team1.length > 0 ? match.team1.map(p => p.name).join(' / ') : 'TBD'}
                            </div>
                            <input
                              type="number"
                              value={match.score1 ?? ''}
                              onChange={(e) => updateMatchScore(rIndex, match.id, Number(e.target.value), match.score2 || 0)}
                              className="w-10 p-1 text-center border border-gray-200 rounded text-sm mx-1"
                              placeholder="-"
                            />
                          </div>

                          {/* Team 2 */}
                          <div className={`flex justify-between items-center p-1 rounded ${match.winner === 2 ? 'bg-indigo-50 font-bold' : ''}`}>
                            <div className="text-sm truncate flex-1">
                              {match.team2.length > 0 ? match.team2.map(p => p.name).join(' / ') : 'TBD'}
                            </div>
                            <input
                              type="number"
                              value={match.score2 ?? ''}
                              onChange={(e) => updateMatchScore(rIndex, match.id, match.score1 || 0, Number(e.target.value))}
                              className="w-10 p-1 text-center border border-gray-200 rounded text-sm mx-1"
                              placeholder="-"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          // Round-Robin View
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Standings */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Award className="text-indigo-600" />
                  순위표
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-1">#</th>
                        <th className="text-left py-2 px-1">팀</th>
                        <th className="text-center py-2 px-1">경기</th>
                        <th className="text-center py-2 px-1">승</th>
                        <th className="text-center py-2 px-1">무</th>
                        <th className="text-center py-2 px-1">패</th>
                        <th className="text-center py-2 px-1">득실</th>
                        <th className="text-center py-2 px-1 font-bold">승점</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rrStandings.map((standing, idx) => (
                        <tr key={standing.teamIndex} className={`border-b ${idx < 3 ? 'bg-indigo-50' : ''}`}>
                          <td className="py-2 px-1 font-bold">
                            {idx === 0 && '🥇'}
                            {idx === 1 && '🥈'}
                            {idx === 2 && '🥉'}
                            {idx > 2 && idx + 1}
                          </td>
                          <td className="py-2 px-1 truncate max-w-[100px]" title={getTeamName(standing.team)}>
                            {getTeamName(standing.team)}
                          </td>
                          <td className="text-center py-2 px-1">{standing.played}</td>
                          <td className="text-center py-2 px-1 text-green-600">{standing.wins}</td>
                          <td className="text-center py-2 px-1 text-gray-500">{standing.draws}</td>
                          <td className="text-center py-2 px-1 text-red-600">{standing.losses}</td>
                          <td className="text-center py-2 px-1">
                            <span className={standing.pointDiff > 0 ? 'text-green-600' : standing.pointDiff < 0 ? 'text-red-600' : ''}>
                              {standing.pointDiff > 0 ? '+' : ''}{standing.pointDiff}
                            </span>
                          </td>
                          <td className="text-center py-2 px-1 font-bold text-indigo-700">{standing.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-gray-500 mt-4">승리 3점, 무승부 1점, 패배 0점</p>
              </div>
            </div>

            {/* Match List */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-4">경기 목록</h2>
                <div className="space-y-3">
                  {bracketState.rrMatches.map((match) => (
                    <RoundRobinMatchCard
                      key={match.id}
                      match={match}
                      onUpdateScore={updateRoundRobinScore}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Round-Robin Match Card Component
function RoundRobinMatchCard({
  match,
  onUpdateScore
}: {
  match: RoundRobinMatch;
  onUpdateScore: (matchId: string, score1: number, score2: number) => void;
}) {
  const [s1, setS1] = useState(match.score1 !== null ? match.score1.toString() : '');
  const [s2, setS2] = useState(match.score2 !== null ? match.score2.toString() : '');
  const [isEditing, setIsEditing] = useState(match.score1 === null);

  useEffect(() => {
    setS1(match.score1 !== null ? match.score1.toString() : '');
    setS2(match.score2 !== null ? match.score2.toString() : '');
    setIsEditing(match.score1 === null);
  }, [match.id, match.score1, match.score2]);

  const handleSave = () => {
    if (s1 !== '' && s2 !== '') {
      onUpdateScore(match.id, parseInt(s1), parseInt(s2));
      setIsEditing(false);
    }
  };

  const isCompleted = match.winner !== null;
  const getTeamName = (team: TournamentPlayer[]) => team.map(p => p.name).join(' / ');

  return (
    <div className={`border rounded-lg p-3 ${isCompleted ? 'bg-gray-50 border-gray-200' : 'bg-white border-indigo-200 shadow-sm'}`}>
      <div className="flex justify-between items-center mb-2 text-sm text-gray-500">
        <span>Match #{match.matchNumber + 1}</span>
        {isCompleted && (
          <span className="flex items-center text-green-600 gap-1">
            <CheckCircle2 size={14} /> 경기 종료
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        {/* Team 1 */}
        <div className={`flex-1 text-right ${match.winner === 1 ? 'font-bold text-indigo-700' : ''}`}>
          <div className="text-sm">{getTeamName(match.team1)}</div>
        </div>

        {/* Score Input */}
        <div className="flex items-center gap-2 px-2 bg-gray-100 rounded p-1">
          {isEditing ? (
            <>
              <input
                type="number"
                value={s1}
                onChange={e => setS1(e.target.value)}
                className="w-12 text-center p-1 rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                placeholder="0"
              />
              <span className="text-gray-400 font-bold">:</span>
              <input
                type="number"
                value={s2}
                onChange={e => setS2(e.target.value)}
                className="w-12 text-center p-1 rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                placeholder="0"
              />
            </>
          ) : (
            <div className="flex gap-3 px-2 font-bold text-xl text-gray-800">
              <span>{match.score1}</span>
              <span>:</span>
              <span>{match.score2}</span>
            </div>
          )}
        </div>

        {/* Team 2 */}
        <div className={`flex-1 text-left ${match.winner === 2 ? 'font-bold text-indigo-700' : ''}`}>
          <div className="text-sm">{getTeamName(match.team2)}</div>
        </div>
      </div>

      <div className="flex justify-center mt-2">
        {isEditing ? (
          <button
            onClick={handleSave}
            className="text-xs bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700"
          >
            점수 저장
          </button>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="text-xs text-indigo-500 hover:text-indigo-700 underline"
          >
            수정
          </button>
        )}
      </div>
    </div>
  );
}
