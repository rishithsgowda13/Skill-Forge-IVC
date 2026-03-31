import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { motion, AnimatePresence } from 'framer-motion';
import ivcLogo from '../assets/ivc_logo.jpg';
import bgImage from '../assets/futuristic_bg.png';

const QuizHub: React.FC = () => {
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const navigate = useNavigate();

  const handleStartQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsValidating(true);
    setError('');
    if (accessCode === 'IVC2026' || accessCode === '1234') {
      setTimeout(() => navigate('/quiz'), 800);
    } else {
      setError('INVALID ACCESS CODE');
      setIsValidating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative scanline-overlay"
         style={{ background: 'linear-gradient(180deg, #080c14 0%, #0c1a2a 50%, #080c14 100%)' }}>
      <div className="fixed inset-0 opacity-15 pointer-events-none"
           style={{ backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
      
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />

        <main className="flex-1 flex flex-col items-center justify-center px-8">
          {/* Background logo watermark - Larger */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.06]">
            <img src={ivcLogo} alt="" className="w-[800px] h-[800px] object-contain mix-blend-lighten" />
          </div>

          <div className="relative z-10 flex flex-col items-center w-full max-w-4xl">
            <h1 className="font-display text-5xl md:text-7xl font-black tracking-[0.25em] glow-text text-center mb-20 uppercase leading-snug">
              INNOVATORS & VISIONARIES CLUB
            </h1>

            {/* Enlarged Card */}
            <div className="glass-card p-16 w-full border-2 border-cyan-glow/20 rounded-3xl"
                 style={{ backdropFilter: 'blur(30px)', background: 'rgba(12, 18, 32, 0.85)' }}>
              <div className="flex flex-col items-center gap-12">
                <div className="text-center">
                  <p className="font-display text-xl tracking-[0.6em] text-cyan-glow font-black uppercase mb-4">ACCESS_CODE:REQUIRED</p>
                </div>

                <form onSubmit={handleStartQuiz} className="w-full flex flex-col items-center gap-12">
                  <input
                    type="text"
                    autoFocus
                    placeholder="ENTER_ENCRYPTION_KEY"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                    className="w-full bg-transparent border-b-4 border-cyan-glow/20 text-center py-6 text-5xl font-display font-black text-cyan-glow tracking-[0.5em] focus:border-cyan-glow/60 focus:bg-white/[0.02] outline-none transition-all placeholder:text-white/10"
                  />
                  
                  {/* Huge Button */}
                  <button
                    type="submit"
                    disabled={isValidating}
                    className="w-full py-8 bg-cyan-glow text-black font-display text-2xl tracking-[0.8em] font-black uppercase rounded-2xl hover:shadow-[0_0_80px_rgba(0,247,255,0.4)] hover:scale-105 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isValidating ? 'VALIDATING_LINK...' : 'START_MISSION'}
                  </button>
                </form>

                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-red-500 font-display text-xl tracking-[0.3em] font-black uppercase"
                    >
                      ▸ CRITICAL_ERR: {error}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </div>
            
            {/* Helper hints - Enlarged */}
            <p className="mt-12 text-sm tracking-[0.5em] text-white/20 uppercase font-bold text-center">
              SYSTEM_ENCRYPTION_V4 • AUTHORIZED_PERSONNEL_ONLY
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default QuizHub;
