import React, { useState } from 'react';
import { Player } from '../types';
import { UserPlus, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';

interface PlayerListProps {
  players: Player[];
  onAddPlayer: (name: string, gender: 'M' | 'F') => void;
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      onAddPlayer(newName.trim(), gender);
      setNewName('');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        Players ({players.length})
      </h2>
      
      <form onSubmit={handleSubmit} className="mb-6 flex gap-2">
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Enter player name"
            className="flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value as 'M' | 'F')}
            className="px-2 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="M">Male</option>
            <option value="F">Female</option>
          </select>
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          <UserPlus size={20} /> Add
        </button>
      </form>

      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {players.map(player => (
          <div 
            key={player.id} 
            className={`flex items-center justify-between p-3 rounded-md border ${player.active ? 'bg-gray-50 border-gray-200' : 'bg-gray-100 border-gray-200 opacity-60'}`}
          >
            <div className="flex items-center gap-3">
              <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white ${player.gender === 'F' ? 'bg-pink-500' : 'bg-blue-500'}`}>
                {player.gender || 'M'}
              </span>
              <span className="font-medium text-gray-700">{player.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onToggleActive(player.id)}
                className={`p-1 rounded hover:bg-gray-200 ${player.active ? 'text-green-600' : 'text-gray-400'}`}
                title={player.active ? "Deactivate" : "Activate"}
              >
                {player.active ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
              </button>
              <button
                onClick={() => onRemovePlayer(player.id)}
                className="p-1 text-red-500 hover:bg-red-50 rounded"
                title="Remove player"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ))}
        {players.length === 0 && (
          <p className="text-center text-gray-500 py-4">No players added yet.</p>
        )}
      </div>
    </div>
  );
};
