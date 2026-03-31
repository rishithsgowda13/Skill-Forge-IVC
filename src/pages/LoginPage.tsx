import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockLogin, supabase } from '../supabase';
import { motion, AnimatePresence } from 'framer-motion';
import ivcLogo from '../assets/ivc_logo.jpg';
import bgImage from '../assets/futuristic_bg.png';

const LoginPage: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password || (isSignUp && !name)) {
      setError('ALL_FIELDS_REQUIRED');
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const { error: sbErr } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name, role: 'user' }
          }
        });
        if (sbErr) throw sbErr;
        setError('CHECK_YOUR_EMAIL_FOR_CONFIRMATION');
      } else {
        const { user, error: mockErr } = await mockLogin(email, password);
        if (!mockErr && user) {
          localStorage.setItem('ivc_user', JSON.stringify(user));
          navigate(user.role === 'admin' ? '/admin' : '/home');
          return;
        }

        const { error: sbErr } = await supabase.auth.signInWithPassword({ email, password });
        if (sbErr) throw sbErr;
        navigate('/home');
      }
    } catch (err: any) {
      setError(err.message || 'AUTHENTICATION_FAILED');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/home'
      }
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-y-auto py-20"
         style={{ background: 'linear-gradient(160deg, #020609 0%, #081a2d 40%, #030810 70%, #020609 100%)' }}>
      
      {/* Dynamic Background Effects */}
      <div className="fixed inset-0 opacity-10 pointer-events-none"
           style={{ backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
      
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyan-glow/5 blur-[150px] rounded-full pointer-events-none animate-pulse" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-glow/5 blur-[150px] rounded-full pointer-events-none animate-pulse" style={{ animationDelay: '2s' }} />

      {/* Main Container */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 w-full max-w-4xl px-4"
      >
        {/* The Card - Redefined vertical flow with explicit gaps */}
        <div className="rounded-[3.5rem] p-12 md:p-20 border border-white/10 backdrop-blur-[40px] flex flex-col items-center gap-14"
             style={{ 
               background: 'rgba(5, 15, 25, 0.85)', 
               boxShadow: '0 50px 100px -20px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.05)' 
             }}>
          
          {/* Logo Section */}
          <div className="flex flex-col items-center w-full">
            <div className="relative mb-8 group">
                <div className="absolute inset-0 bg-cyan-glow/15 blur-3xl rounded-full scale-110 group-hover:bg-cyan-glow/20 transition-all duration-700" />
                <img
                  src={ivcLogo}
                  alt="IVC Logo"
                  className="w-40 h-40 object-contain relative z-10 mix-blend-lighten"
                />
            </div>
            <h1 className="font-display text-5xl md:text-6xl font-black tracking-[0.3em] glow-text text-center uppercase leading-tight mb-4">
                IVC_DRIVE
            </h1>
            <div className="flex items-center gap-8 opacity-40">
              <span className="font-display text-xs tracking-[0.4em] font-black uppercase">IDEATE</span>
              <div className="w-1.5 h-1.5 bg-cyan-glow rounded-full" />
              <span className="font-display text-xs tracking-[0.4em] font-black uppercase">VISUALIZE</span>
              <div className="w-1.5 h-1.5 bg-cyan-glow rounded-full" />
              <span className="font-display text-xs tracking-[0.4em] font-black uppercase">CREATE</span>
            </div>
          </div>

          {/* Centered Auth Form */}
          <form onSubmit={handleAuth} className="w-full max-w-xl flex flex-col items-center gap-12">
            <div className="w-full space-y-12">
              <AnimatePresence mode="wait">
                {isSignUp && (
                  <motion.div
                    key="name-field"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex flex-col items-center"
                  >
                    <label className="text-[10px] tracking-[0.8em] text-cyan-glow/50 uppercase font-black mb-4">OPERATOR_IDENTITY</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-white/[0.03] border-b-2 border-white/5 px-4 py-4 text-3xl text-center text-white font-display tracking-[0.2em] outline-none focus:border-cyan-glow/60 transition-all placeholder:text-white/5"
                      placeholder="NAME_REQUIRED"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex flex-col items-center">
                <label className="text-[10px] tracking-[0.8em] text-cyan-glow/50 uppercase font-black mb-4">COMM_CHANNEL_ID</label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/[0.03] border-b-2 border-white/5 px-4 py-4 text-3xl text-center text-white font-display tracking-[0.2em] outline-none focus:border-cyan-glow/60 transition-all placeholder:text-white/5"
                  placeholder="EMAIL_OR_ACCESS_ID"
                />
              </div>

              <div className="flex flex-col items-center">
                <label className="text-[10px] tracking-[0.8em] text-cyan-glow/50 uppercase font-black mb-4">ENCRYPTION_KEY</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/[0.03] border-b-2 border-white/5 px-4 py-4 text-3xl text-center text-white font-display tracking-[0.2em] outline-none focus:border-cyan-glow/60 transition-all placeholder:text-white/5"
                  placeholder="PASSWORD_ENCRYPT"
                />
              </div>
            </div>

            {/* Huge Button with proper height and padding */}
            <div className="w-full pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[5.5rem] bg-cyan-glow text-black font-display text-4xl tracking-[0.6em] font-black uppercase rounded-3xl hover:shadow-[0_0_100px_rgba(0,247,255,0.4)] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center p-6"
              >
                {loading ? 'SYNCING...' : (isSignUp ? 'REGISTER' : 'LOGIN')}
              </button>
            </div>
          </form>

          {/* Social Divider - Proper Layout */}
          <div className="w-full flex flex-col items-center gap-10">
            <div className="flex items-center gap-8 w-full max-w-xl opacity-20">
              <div className="h-px bg-white grow" />
              <span className="text-[10px] tracking-[0.6em] text-white font-black uppercase shrink-0">OAUTH_GATEWAY</span>
              <div className="h-px bg-white grow" />
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full max-w-xl min-h-[4.5rem] bg-transparent border-2 border-white/10 rounded-2xl flex items-center justify-center gap-6 hover:bg-white/[0.03] hover:border-cyan-glow/30 active:scale-[0.98] transition-all cursor-pointer group/google p-4"
            >
              <img src="https://www.google.com/favicon.ico" alt="" className="w-8 h-8 group-hover:scale-110 transition-all grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100" />
              <span className="text-white/40 group-hover:text-white font-display text-xl tracking-[0.4em] font-black uppercase">LINK_GOOGLE_ACCOUNT</span>
            </button>
          </div>

          {/* Footer UI - Error and Selector */}
          <div className="w-full flex flex-col items-center gap-8">
            {error && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 font-display text-sm tracking-[0.3em] uppercase font-black text-center">
                    ▸ {error}
                </motion.p>
            )}
            
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-cyan-glow/40 hover:text-cyan-glow font-display text-xs tracking-[0.4em] font-black uppercase transition-all px-8 py-2"
            >
              {isSignUp ? 'EXISTING_MEMBER?_SIGN_IN' : 'NEW_MEMBER?_GET_IDENTIFIED'}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Scanline */}
      <div className="scanline-overlay pointer-events-none opacity-40" />
    </div>
  );
};

export default LoginPage;
