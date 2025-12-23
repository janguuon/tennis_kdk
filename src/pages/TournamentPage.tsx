import { useState } from 'react';
import { Trophy, Users, Play, RefreshCw } from 'lucide-react';
import { useTournamentBracket } from '../hooks/useTournamentBracket';
import { TournamentPlayer } from '../types/tournament';

export function TournamentPage() {
  const { bracketState, startTournament, updateMatchScore, resetBracket } = useTournamentBracket();
  
  // Setup state
  const [setupRoundOf, setSetupRoundOf] = useState<number>(16);
  const [setupType, setSetupType] = useState<'singles' | 'doubles'>('doubles');
  const [participants, setParticipants] = useState<string[]>([]);
  
  // Helper to manage input fields for participants
  const handleParticipantChange = (index: number, value: string) => {
    const newParticipants = [...participants];
    newParticipants[index] = value;
    setParticipants(newParticipants);
  };

  const handleStart = () => {
    // Convert flat list of names to Team structure
    const teams: TournamentPlayer[][] = [];
    const teamSize = setupType === 'doubles' ? 2 : 1;
    const totalTeams = setupRoundOf; 
    
    // We need 'setupRoundOf' teams.
    // If doubles, we need setupRoundOf * 2 players.
    
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
    
    startTournament(setupRoundOf, setupType, teams);
  };

  // Initialize participants array size when settings change
  const requiredParticipants = setupRoundOf * (setupType === 'doubles' ? 2 : 1);
  if (participants.length !== requiredParticipants && bracketState.status === 'setup') {
      // Preserve existing names if resizing up? Or just reset?
      // Let's try to preserve
      const newArr = Array(requiredParticipants).fill('');
      for(let i=0; i<Math.min(participants.length, requiredParticipants); i++) {
          newArr[i] = participants[i];
      }
      setParticipants(newArr);
  }

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
                <p className="text-indigo-200 text-sm">대진표 및 경기 관리</p>
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
             </div>

             <h3 className="text-lg font-semibold mb-4">참가자 입력 ({participants.length}명)</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {participants.map((name, idx) => (
                    <div key={idx} className="relative">
                        <span className="absolute left-3 top-2.5 text-xs text-gray-400">
                            {setupType === 'doubles' 
                                ? `Team ${Math.floor(idx/2)+1}-${idx%2===0 ? 'A' : 'B'}`
                                : `Player ${idx+1}`}
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
                토너먼트 시작
             </button>
          </div>
        ) : (
          <div className="overflow-x-auto pb-8">
            <div className="min-w-max flex gap-8">
                {bracketState.rounds.map((round, rIndex) => (
                    <div key={rIndex} className="flex flex-col gap-8">
                        <div className="text-center font-bold text-gray-500 uppercase tracking-wider mb-4 sticky top-0 bg-gray-100 py-2">
                            {round.roundOf === 2 ? 'Final' : round.roundOf === 4 ? 'Semi-Final' : `Round of ${round.roundOf}`}
                        </div>
                        <div className="flex flex-col justify-around h-full gap-8"> {/* Added gap for spacing */}
                             {round.matches.map((match) => (
                                 <div 
                                    key={match.id} 
                                    className={`w-64 bg-white rounded-lg border-l-4 shadow-sm relative flex flex-col
                                        ${match.winner ? 'border-indigo-500' : 'border-gray-300'}
                                    `}
                                 >
                                    {/* Connector lines logic would be complex in pure CSS flexbox, skipping visual lines for simplicity first */}
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
                                                disabled={!!match.winner && match.winner !== 1} // Optional: lock score? No, let them edit.
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
        )}
      </main>
    </div>
  );
}
