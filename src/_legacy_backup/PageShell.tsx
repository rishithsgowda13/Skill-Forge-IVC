import React from 'react';
import Header from './Header';
import { useLocation, Link } from 'react-router-dom';

const PageShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  
  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'About', path: '#' },
    { label: 'Team', path: '#' },
    { label: 'Events', path: '/quiz-hub' },
    { label: 'Domains', path: '#' },
    { label: 'Projects', path: '#' },
    { label: 'Achievements', path: '/leaderboard' },
  ];

  return (
    <div className="min-h-full flex flex-col bg-black/60 relative overflow-hidden backdrop-blur-3xl">
      <Header />
      
      {/* Navigation Pill (Image 4 style) */}
      <div className="flex justify-center mt-6 z-40">
        <div className="bg-white/5 border border-white/10 rounded-full px-6 py-2 flex items-center gap-6">
          {navItems.map((item) => (
            <Link 
              key={item.label}
              to={item.path}
              className={`text-[10px] tracking-[0.4em] font-black uppercase transition-all ${
                location.pathname === item.path 
                ? 'text-cyan-400 border-t-4 border-cyan-400 pt-1 -mt-1' 
                : 'text-gray-500 hover:text-cyan-400'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      <main className="flex-grow flex flex-col items-center relative z-10 w-full overflow-auto">
        {children}
      </main>

      {/* Backdrop patterns */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-50 overflow-hidden">
         <div className="scanline"></div>
      </div>
    </div>
  );
};

export default PageShell;
