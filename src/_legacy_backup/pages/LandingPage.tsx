import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { motion } from 'framer-motion';
import ivcLogo from '../assets/ivc_logo.jpg';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-[#f8fafc]">
      {/* Subtle Dot Pattern */}
      <div className="absolute inset-0 opacity-[0.25] pointer-events-none"
           style={{ 
             backgroundImage: `radial-gradient(#3b82f6 0.5px, transparent 0.5px)`, 
             backgroundSize: '32px 32px' 
           }} />

      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />

        <main className="flex-1 flex flex-col items-center justify-center px-12 relative">
          {/* Logo Section */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="mb-16 relative"
          >
            <div className="absolute inset-0 bg-[#3b82f6]/5 blur-[60px] rounded-full scale-150" />
            <img
              src={ivcLogo}
              alt="IVC Logo"
              className="w-48 h-48 object-contain relative z-10 grayscale hover:grayscale-0 transition-opacity duration-1000"
              style={{ 
                borderRadius: '40px',
                boxShadow: '0 12px 40px rgba(0,0,0,0.08)'
              }}
            />
          </motion.div>

          {/* Heading with Accent Color */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="w-full flex items-center justify-center gap-8 mb-4 max-w-4xl"
          >
            <div className="h-[1px] grow max-w-[150px] bg-gradient-to-l from-[#3b82f6]/40 to-transparent" />
            <h1 className="font-display text-sm sm:text-xl md:text-2xl lg:text-5xl font-black tracking-tight text-[#0f172a] uppercase text-center">
              INNOVATORS & VISIONARIES <span className="text-[#2563eb]">CLUB</span>
            </h1>
            <div className="h-[2px] grow max-w-[150px] bg-gradient-to-r from-[#2563eb]/40 to-transparent" />
          </motion.div>

          {/* Minimalist Multi-Colored Dots for Tagline */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 1 }}
            className="flex items-center gap-10 mb-24"
          >
            <div className="flex items-center gap-4">
              <span className="font-display text-[11px] tracking-[0.5em] text-[#64748b] font-black uppercase">IDEATE</span>
              <div className="w-2 h-2 bg-[#2563eb] rounded-full shadow-[0_4px_12px_rgba(37,99,235,0.3)]" />
            </div>
            <div className="flex items-center gap-4">
              <span className="font-display text-[11px] tracking-[0.5em] text-[#64748b] font-black uppercase">VISUALIZE</span>
              <div className="w-2 h-2 bg-[#10b981] rounded-full shadow-[0_4px_12px_rgba(16,185,129,0.3)]" />
            </div>
            <div className="flex items-center gap-4">
              <span className="font-display text-[11px] tracking-[0.5em] text-[#64748b] font-black uppercase">CREATE</span>
              <div className="w-2 h-2 bg-[#f59e0b] rounded-full shadow-[0_4px_12px_rgba(245,158,11,0.3)]" />
            </div>
          </motion.div>

          {/* Clean Glass Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="flex flex-col md:flex-row items-center gap-8"
          >
            <button
              onClick={() => navigate('/quiz-hub')}
              className="px-20 py-7 bg-[#0f172a] text-white font-display text-sm tracking-[0.3em] font-black uppercase rounded-[24px] hover:bg-[#1e293b] hover:shadow-[0_30px_60px_rgba(15,23,42,0.2)] hover:scale-105 active:scale-[0.97] transition-all cursor-pointer min-w-[320px]"
            >
              Access Quiz Hub
            </button>
            <button
              onClick={() => navigate('/leaderboard')}
              className="px-20 py-7 bg-white border border-[#e2e8f0] text-[#0f172a] font-display text-sm tracking-[0.3em] font-black uppercase rounded-[24px] hover:bg-[#f8fafc] hover:border-[#cbd5e1] hover:shadow-[0_15px_30px_rgba(0,0,0,0.04)] hover:scale-105 active:scale-[0.97] transition-all cursor-pointer min-w-[320px]"
            >
              Leaderboard Portal
            </button>
          </motion.div>

          {/* Minimal Vertical Sidebar Indicators */}
          <div className="fixed right-10 top-1/2 -translate-y-1/2 flex flex-col gap-8 opacity-20 group">
             <div className="w-1.5 h-1.5 bg-[#3b82f6] rounded-full transition-transform group-hover:scale-150" />
             <div className="w-1.5 h-1.5 bg-[#64748b] rounded-full" />
             <div className="w-1.5 h-1.5 bg-[#64748b] rounded-full" />
          </div>
        </main>
      </div>
    </div>
  );
};

export default LandingPage;
