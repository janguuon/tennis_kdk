import React from 'react';
import { Trophy, Users, RefreshCw, Trash2, Calendar } from 'lucide-react';
import { useTournament } from './hooks/useTournament';
import { PlayerList } from './components/PlayerList';
import { MatchList } from './components/MatchList';
import { Standings } from './components/Standings';

function App() {
  const {
    players,
    matches,
    stats,
    addPlayer,
    removePlayer,
    togglePlayerActive,
    generateMatches,
    updateScore,
    resetTournament,
    clearAllData
  } = useTournament();

  const hasMatches = matches.length > 0;

  return (
    <div className="min-h-screen bg-gray-100 pb-10">
      {/* Header */}
      <header className="bg-blue-800 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-white p-2 rounded-full">
                <Trophy className="w-8 h-8 text-blue-800" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Tennis KDK Manager</h1>
                <p className="text-blue-200 text-sm">Partner Rotation Tournament System</p>
              </div>
            </div>
            
            <div className="flex gap-2">
               {hasMatches && (
                <button
                  onClick={resetTournament}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-600 rounded-md transition-colors text-sm"
                >
                  <RefreshCw size={16} /> Reset Matches
                </button>
              )}
              <button
                onClick={clearAllData}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md transition-colors text-sm"
              >
                <Trash2 size={16} /> Reset All
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Sidebar: Players & Controls */}
          <div className="lg:col-span-4 space-y-6">
            <PlayerList 
              players={players}
              onAddPlayer={addPlayer}
              onRemovePlayer={removePlayer}
              onToggleActive={togglePlayerActive}
            />

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Calendar className="text-blue-600" />
                Tournament Control
              </h2>
              <p className="text-gray-600 mb-4 text-sm">
                Ready to start? Generate matches based on the active players list.
                Make sure you have at least 4 players.
              </p>
              
              <button
                onClick={generateMatches}
                disabled={players.filter(p => p.active).length < 4 || hasMatches}
                className={`w-full py-3 px-4 rounded-md font-bold text-white flex items-center justify-center gap-2 transition-colors
                  ${players.filter(p => p.active).length < 4 || hasMatches
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700 shadow-md hover:shadow-lg'
                  }`}
              >
                {hasMatches ? 'Matches Generated' : 'Generate Matches'}
              </button>
              
              {players.filter(p => p.active).length < 4 && (
                <p className="text-red-500 text-xs mt-2 text-center">
                  * Minimum 4 active players required
                </p>
              )}
            </div>
          </div>

          {/* Right Content: Matches & Standings */}
          <div className="lg:col-span-8 space-y-8">
            {hasMatches ? (
              <>
                <Standings stats={stats} players={players} />
                <MatchList 
                  matches={matches} 
                  players={players} 
                  onUpdateScore={updateScore} 
                />
              </>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-12 text-center text-gray-500">
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">No Matches Yet</h3>
                <p>Add players and click "Generate Matches" to begin the tournament.</p>
              </div>
            )}
          </div>

        </div>
      </main>
      
      <footer className="text-center py-6 text-gray-500 text-sm">
        <p>&copy; 2024 Tennis KDK Manager. All matches run locally in your browser.</p>
      </footer>
    </div>
  );
}

export default App;
