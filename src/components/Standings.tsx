import React from 'react';
import { PlayerStats, Player } from '../types';
import { Trophy, Medal } from 'lucide-react';

interface StandingsProps {
  stats: PlayerStats[];
  players: Player[];
}

export const Standings: React.FC<StandingsProps> = ({ stats, players }) => {
  const getPlayerName = (id: string) => players.find(p => p.id === id)?.name || 'Unknown';

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Trophy className="text-yellow-500" />
        순위표
      </h2>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3">순위</th>
              <th className="px-4 py-3">플레이어</th>
              <th className="px-4 py-3 text-center">경기수</th>
              <th className="px-4 py-3 text-center">승-패-무</th>
              <th className="px-4 py-3 text-center">승률</th>
              <th className="px-4 py-3 text-center">득실</th>
              <th className="px-4 py-3 text-center">승점</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((stat, index) => (
              <tr key={stat.playerId} className="bg-white border-b hover:bg-gray-50">
                <td className="px-4 py-3 font-bold text-gray-500">
                  {index === 0 ? <Medal className="text-yellow-500 inline w-5 h-5"/> : 
                   index === 1 ? <Medal className="text-gray-400 inline w-5 h-5"/> : 
                   index === 2 ? <Medal className="text-orange-400 inline w-5 h-5"/> : 
                   index + 1}
                </td>
                <td className="px-4 py-3 font-medium text-gray-900">
                  {getPlayerName(stat.playerId)}
                </td>
                <td className="px-4 py-3 text-center">{stat.matchesPlayed}</td>
                <td className="px-4 py-3 text-center">
                  <span className="text-green-600 font-bold">{stat.wins}</span> - 
                  <span className="text-red-500 font-bold">{stat.losses}</span> - 
                  <span className="text-gray-500">{stat.draws}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  {(stat.winRate * 100).toFixed(0)}%
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={stat.pointDiff > 0 ? 'text-green-600' : stat.pointDiff < 0 ? 'text-red-500' : ''}>
                    {stat.pointDiff > 0 ? '+' : ''}{stat.pointDiff}
                  </span>
                </td>
                <td className="px-4 py-3 text-center font-bold text-blue-600">
                  {stat.pointsFor}
                </td>
              </tr>
            ))}
            {stats.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-4 text-gray-500">
                  진행된 경기가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
