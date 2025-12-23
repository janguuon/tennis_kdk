import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { KDKPage } from './pages/KDKPage';
import { TournamentPage } from './pages/TournamentPage';
import { Trophy, Activity } from 'lucide-react';

function App() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <nav className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex items-center h-16 justify-between">
            <div className="flex items-center gap-8">
              <div className="font-bold text-xl text-slate-800 flex items-center gap-2">
                 <Activity className="text-blue-600" />
                 <span>Tennis Manager</span>
              </div>
              
              <div className="hidden md:flex gap-2">
                <Link 
                  to="/" 
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                    location.pathname === '/' 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Trophy size={18} />
                  KDK (파트너 로테이션)
                </Link>
                <Link 
                  to="/tournament" 
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                    location.pathname === '/tournament' 
                      ? 'bg-indigo-50 text-indigo-700' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Trophy size={18} className="text-indigo-500" />
                  토너먼트
                </Link>
              </div>
            </div>
            
            {/* Mobile menu could be added here */}
            <div className="md:hidden flex gap-4 text-sm">
                <Link to="/" className={location.pathname === '/' ? 'text-blue-600 font-bold' : 'text-gray-600'}>KDK</Link>
                <Link to="/tournament" className={location.pathname === '/tournament' ? 'text-indigo-600 font-bold' : 'text-gray-600'}>Tournament</Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-4">
        <Routes>
          <Route path="/" element={<KDKPage />} />
          <Route path="/tournament" element={<TournamentPage />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
