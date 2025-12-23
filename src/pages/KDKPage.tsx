import { Trophy, Users, RefreshCw, Trash2, Calendar } from 'lucide-react';
import { useTournament } from '../hooks/useTournament';
import { PlayerList } from '../components/PlayerList';
import { MatchList } from '../components/MatchList';
import { Standings } from '../components/Standings';

export function KDKPage() {
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
    clearAllData,
    rounds,
    setRounds,
    courts,
    setCourts,
    mixedDoubles,
    setMixedDoubles,
    strictGenderMode,
    setStrictGenderMode
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
                <h1 className="text-2xl font-bold">테니스 KDK 매니저</h1>
                <p className="text-blue-200 text-sm">파트너 로테이션 매칭 시스템</p>
              </div>
            </div>
            
            <div className="flex gap-2">
               {hasMatches && (
                <button
                  onClick={resetTournament}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-600 rounded-md transition-colors text-sm"
                >
                  <RefreshCw size={16} /> 매치 초기화
                </button>
              )}
              <button
                onClick={clearAllData}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md transition-colors text-sm"
              >
                <Trash2 size={16} /> 전체 초기화
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
                토너먼트 설정
              </h2>
              <p className="text-gray-600 mb-4 text-sm">
                시작할 준비가 되셨나요? 활성 플레이어 목록을 기반으로 매치를 생성합니다.
                최소 4명의 플레이어가 필요합니다.
              </p>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    라운드 수
                  </label>
                  <select
                    value={rounds}
                    onChange={(e) => setRounds(Number(e.target.value))}
                    disabled={hasMatches}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                  >
                    {[4, 5, 6, 7, 8].map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    코트 수
                  </label>
                  <select
                    value={courts}
                    onChange={(e) => setCourts(Number(e.target.value))}
                    disabled={hasMatches}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-4 mt-[-10px]">
                기본 KDK는 4라운드입니다. 12명 또는 16명일 경우 4라운드 고정 패턴이 적용됩니다.
              </p>

              <div className="mb-2 flex items-center">
                <input
                  type="checkbox"
                  id="mixedDoubles"
                  checked={mixedDoubles}
                  onChange={(e) => setMixedDoubles(e.target.checked)}
                  disabled={hasMatches}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                />
                <label htmlFor="mixedDoubles" className={`ml-2 block text-sm font-medium ${hasMatches ? 'text-gray-400' : 'text-gray-700'}`}>
                  혼합 복식만 (남녀 혼성)
                </label>
              </div>

              <div className="mb-6 flex items-center">
                <input
                  type="checkbox"
                  id="strictGenderMode"
                  checked={strictGenderMode}
                  onChange={(e) => setStrictGenderMode(e.target.checked)}
                  disabled={hasMatches}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                />
                <label htmlFor="strictGenderMode" className={`ml-2 block text-sm font-medium ${hasMatches ? 'text-gray-400' : 'text-gray-700'}`}>
                  성별 매칭 모드 (남복/여복/혼복만 허용)
                </label>
              </div>
              
              <button
                onClick={generateMatches}
                disabled={players.filter(p => p.active).length < 4 || hasMatches}
                className={`w-full py-3 px-4 rounded-md font-bold text-white flex items-center justify-center gap-2 transition-colors
                  ${players.filter(p => p.active).length < 4 || hasMatches
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700 shadow-md hover:shadow-lg'
                  }`}
              >
                {hasMatches ? '매치 생성 완료' : '매치 생성'}
              </button>
              
              {players.filter(p => p.active).length < 4 && (
                <p className="text-red-500 text-xs mt-2 text-center">
                  * 최소 4명의 활성 플레이어가 필요합니다
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
                <h3 className="text-xl font-medium text-gray-900 mb-2">생성된 매치가 없습니다</h3>
                <p>플레이어를 추가하고 "매치 생성" 버튼을 눌러 토너먼트를 시작하세요.</p>
              </div>
            )}
          </div>

        </div>
      </main>
      
      <footer className="text-center py-6 text-gray-500 text-sm">
        <p>&copy; 2024 테니스 KDK 매니저. 모든 데이터는 브라우저에 로컬로 저장됩니다.</p>
      </footer>
    </div>
  );
}
