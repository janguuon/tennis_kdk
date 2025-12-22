import React, { useState } from 'react';
import { Player } from '../types';
import { UserPlus, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';

interface PlayerListProps {
  players: Player[];
  onAddPlayer: (name: string, gender: 'M' | 'F', ntrp: number) => void;
  onRemovePlayer: (id: string) => void;
  onToggleActive: (id: string) => void;
}

export const PlayerList: React.FC<PlayerListProps> = ({ 
  players, 
  onAddPlayer, 
  onRemovePlayer, 
  onToggleActive 
}) => {
  const [newName, setNewName] = useState('');
  const [gender, setGender] = useState<'M' | 'F'>('M');
  const [ntrp, setNtrp] = useState<number>(3.0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      onAddPlayer(newName.trim(), gender, ntrp);
      setNewName('');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        플레이어 목록 ({players.length})
      </h2>
      
      <form onSubmit={handleSubmit} className="mb-6 flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="이름 입력"
          className="flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex gap-2">
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value as 'M' | 'F')}
            className="px-2 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="M">남</option>
            <option value="F">여</option>
          </select>
          <select
            value={ntrp}
            onChange={(e) => setNtrp(Number(e.target.value))}
            className="px-2 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white w-20"
            title="NTRP 레벨"
          >
            {[1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0].map(v => (
              <option key={v} value={v}>{v.toFixed(1)}</option>
            ))}
          </select>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2 whitespace-nowrap"
          >
            <UserPlus size={20} /> 추가
          </button>
        </div>
      </form>

      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {players.map(player => (
          <div 
            key={player.id} 
            className={`flex items-center justify-between p-3 rounded-md border ${player.active ? 'bg-gray-50 border-gray-200' : 'bg-gray-100 border-gray-200 opacity-60'}`}
          >
            <div className="flex items-center gap-3">
              <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white ${player.gender === 'F' ? 'bg-pink-500' : 'bg-blue-500'}`}>
                {player.gender === 'F' ? '여' : '남'}
              </span>
              <span className="font-medium text-gray-700">{player.name}</span>
              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                {player.ntrp ? player.ntrp.toFixed(1) : '?.?'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onToggleActive(player.id)}
                className={`p-1 rounded hover:bg-gray-200 ${player.active ? 'text-green-600' : 'text-gray-400'}`}
                title={player.active ? "비활성화" : "활성화"}
              >
                {player.active ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
              </button>
              <button
                onClick={() => onRemovePlayer(player.id)}
                className="p-1 text-red-500 hover:bg-red-50 rounded"
                title="플레이어 삭제"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ))}
        {players.length === 0 && (
          <p className="text-center text-gray-500 py-4">등록된 플레이어가 없습니다.</p>
        )}
      </div>
    </div>
  );
};
