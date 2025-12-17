import React, { useState } from 'react';
import { Match, Player } from '../types';
import { CheckCircle2 } from 'lucide-react';

interface MatchListProps {
  matches: Match[];
  players: Player[];
  onUpdateScore: (matchId: string, score1: number, score2: number) => void;
}

export const MatchList: React.FC<MatchListProps> = ({ matches, players, onUpdateScore }) => {
  const getPlayerName = (id: string) => players.find(p => p.id === id)?.name || 'Unknown';

  const rounds = Array.from(new Set(matches.map(m => m.round))).sort((a, b) => a - b);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Match Schedule</h2>
      
      {matches.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No matches generated yet.</p>
      ) : (
        <div className="space-y-6">
          {rounds.map(round => (
            <div key={round} className="border-b last:border-0 pb-4 last:pb-0">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 bg-gray-100 px-3 py-1 rounded">
                Round {round}
              </h3>
              <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-2">
                {matches.filter(m => m.round === round).map(match => (
                  <MatchCard 
                    key={match.id} 
                    match={match} 
                    getPlayerName={getPlayerName}
                    onUpdateScore={onUpdateScore}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const MatchCard: React.FC<{
  match: Match;
  getPlayerName: (id: string) => string;
  onUpdateScore: (id: string, s1: number, s2: number) => void;
}> = ({ match, getPlayerName, onUpdateScore }) => {
  const [s1, setS1] = useState(match.score1?.toString() || '');
  const [s2, setS2] = useState(match.score2?.toString() || '');
  const [isEditing, setIsEditing] = useState(match.score1 === null);

  const handleSave = () => {
    if (s1 !== '' && s2 !== '') {
      onUpdateScore(match.id, parseInt(s1), parseInt(s2));
      setIsEditing(false);
    }
  };

  const isCompleted = match.score1 !== null && match.score2 !== null;

  return (
    <div className={`border rounded-lg p-3 ${isCompleted ? 'bg-gray-50 border-gray-200' : 'bg-white border-blue-200 shadow-sm'}`}>
      <div className="flex justify-between items-center mb-2 text-sm text-gray-500">
        <span>Court {match.courtNumber}</span>
        {isCompleted && <span className="flex items-center text-green-600 gap-1"><CheckCircle2 size={14}/> Finished</span>}
      </div>
      
      <div className="flex items-center justify-between gap-2">
        {/* Team 1 */}
        <div className="flex-1 text-right">
          <div className="font-medium text-gray-800">{getPlayerName(match.team1[0])}</div>
          <div className="font-medium text-gray-800">{getPlayerName(match.team1[1])}</div>
        </div>

        {/* Score Input */}
        <div className="flex items-center gap-2 px-2 bg-gray-100 rounded p-1">
          {isEditing ? (
            <>
              <input 
                type="number" 
                value={s1} 
                onChange={e => setS1(e.target.value)}
                className="w-12 text-center p-1 rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                placeholder="0"
              />
              <span className="text-gray-400 font-bold">:</span>
              <input 
                type="number" 
                value={s2} 
                onChange={e => setS2(e.target.value)}
                className="w-12 text-center p-1 rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
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
        <div className="flex-1 text-left">
          <div className="font-medium text-gray-800">{getPlayerName(match.team2[0])}</div>
          <div className="font-medium text-gray-800">{getPlayerName(match.team2[1])}</div>
        </div>
      </div>

      <div className="flex justify-center mt-2">
        {isEditing ? (
           <button 
             onClick={handleSave}
             className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
           >
             Save Score
           </button>
        ) : (
          <button 
            onClick={() => setIsEditing(true)}
            className="text-xs text-blue-500 hover:text-blue-700 underline"
          >
            Edit
          </button>
        )}
      </div>
    </div>
  );
};
