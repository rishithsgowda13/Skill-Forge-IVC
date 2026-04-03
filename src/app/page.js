"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { 
  ShieldCheck, 
  ArrowRight, 
  Zap, 
  Lock,
  Loader2,
  Fingerprint,
  Mail,
  Dna,
  UserPlus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [userRole, setUserRole] = useState("candidate");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setError(null);
  }, [isSignUp]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Mock bypass logic
    if (!isSignUp) {
      if (email === "1" && password === "1") {
        document.cookie = "mock_session=user; path=/";
        router.push("/dashboard");
        return;
      }
      if (email === "2" && password === "2") {
        document.cookie = "mock_session=admin; path=/";
        router.push("/quiz/admin");
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setError(error.message); setLoading(false); }
      else { router.push("/dashboard"); }
    } else {
      if (password !== confirmPassword) {
        setError("Security keys do not match.");
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, role: userRole },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      });

      if (error) { setError(error.message); setLoading(false); }
      else { setError("Check your email for confirmation!"); setLoading(false); }
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    });
    if (error) { setError(error.message); setLoading(false); }
  };

  const toggleMode = () => setIsSignUp(!isSignUp);

  if (!isMounted) return null;

  return (
    <div className="min-h-screen w-full bg-[#f8fafc] flex items-center justify-center p-4 md:p-12 font-sans selection:bg-blue-100 overflow-hidden relative">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-blue-500/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-indigo-500/5 rounded-full blur-[120px] animate-pulse delay-1000" />
      </div>

      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[1200px] bg-white rounded-[40px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.08)] border border-slate-200 overflow-hidden relative z-10 flex min-h-[750px]"
      >
        {/* Sliding Branding Panel */}
        <AnimatePresence mode="wait">
          <motion.div 
            key={isSignUp ? "signup-branding" : "login-branding"}
            initial={{ x: isSignUp ? "150%" : "-150%" }}
            animate={{ x: 0 }}
            exit={{ x: isSignUp ? "150%" : "-150%" }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
            className={`hidden lg:flex bg-[#2563EB] text-white absolute top-0 bottom-0 z-20 w-[400px] flex-col justify-between p-16 ${isSignUp ? "right-0" : "left-0"}`}
          >
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-20 group">
                <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 group-hover:bg-white group-hover:text-blue-600 transition-all duration-500">
                  <ShieldCheck size={28} />
                </div>
                <h1 className="text-2xl font-black tracking-tighter uppercase leading-none">Skill Forge</h1>
              </div>

              <div className="space-y-12">
                <div className="space-y-6">
                  <h2 className="text-5xl font-black leading-[0.9] tracking-tighter uppercase">
                    {isSignUp ? "Initialize<br/>Node" : "System<br/>Sync"}
                  </h2>
                  <p className="text-blue-100/60 text-sm font-medium leading-relaxed max-w-[280px]">
                    {isSignUp 
                      ? "Establish your node presence in the NEXUS protocol layers."
                      : "Synchronize your authorization keys to resume intelligence protocols."}
                  </p>
                </div>

                <div className="space-y-6">
                  {[
                    { icon: Zap, text: "Instant Validation" },
                    { icon: Lock, text: "Military Grade Encryption" },
                    { icon: Dna, text: "Biometric Identity Nodes" }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4 text-white/80">
                      <item.icon size={18} className="text-blue-300" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em]">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="relative z-10 space-y-8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-px bg-white/20" />
                <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white/40">Protocol 4.2.0-S</span>
              </div>
              <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest text-white/30">
                <span className="hover:text-white cursor-pointer transition-colors">Privacy</span>
                <span className="hover:text-white cursor-pointer transition-colors">Support</span>
              </div>
            </div>

            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 overflow-hidden">
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-10">
                  <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path d="M0 0 L100 100 M100 0 L0 100" stroke="white" strokeWidth="0.1" />
                  </svg>
               </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Content Area */}
        <div className={`flex-1 flex flex-col justify-center transition-all duration-700 ease-in-out px-8 md:px-20 py-12 ${isSignUp ? "lg:pr-[400px]" : "lg:pl-[400px]"}`}>
          <div className="max-w-[440px] mx-auto w-full space-y-10">
            <div className="space-y-4">
              <div className="lg:hidden flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                  <ShieldCheck size={24} />
                </div>
                <span className="text-sm font-black uppercase tracking-[0.2em] text-slate-800">Skill Forge</span>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-black text-blue-600 uppercase tracking-[0.4em]">Authorized Station 02</p>
                <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                  {isSignUp ? "Node Enrollment" : "Authentication"}
                </h1>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Synchronize your identification parameters below.</p>
            </div>

            {/* Role/Action UI */}
            <div className="space-y-8">
              <div className="bg-slate-100 p-1 rounded-2xl flex h-12 relative border border-slate-200">
                <motion.div 
                  layoutId="role-pill"
                  animate={{ x: userRole === "candidate" ? 0 : "100%" }}
                  className="absolute inset-y-1 left-1 w-[calc(50%-4px)] bg-white rounded-xl shadow-sm border border-slate-200"
                />
                <button 
                  onClick={() => setUserRole("candidate")}
                  className={`flex-1 relative z-10 text-[10px] font-black uppercase tracking-widest transition-colors ${userRole === "candidate" ? "text-blue-600" : "text-slate-400"}`}
                >
                  Candidate Hub
                </button>
                <button 
                  onClick={() => setUserRole("evaluator")}
                  className={`flex-1 relative z-10 text-[10px] font-black uppercase tracking-widest transition-colors ${userRole === "evaluator" ? "text-blue-600" : "text-slate-400"}`}
                >
                  Evaluator Node
                </button>
              </div>

              <form onSubmit={handleAuth} className="space-y-6">
                {isSignUp && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Authorized Name</label>
                    <input 
                      required
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter Node Identity Name"
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-50 transition-all"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Node Credentials</label>
                  <div className="relative group">
                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                    <input 
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="authorized@skillforge.io"
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-14 pr-6 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-50 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Security Protocol Key</label>
                  <div className="relative group">
                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                    <input 
                      required
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-14 pr-6 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-50 transition-all"
                    />
                  </div>
                </div>

                {isSignUp && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Confirm Key</label>
                    <input 
                      required
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-50 transition-all"
                    />
                  </div>
                )}

                <button
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-xs tracking-[0.4em] uppercase shadow-xl shadow-blue-200 hover:bg-blue-700 hover:shadow-2xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-4 group"
                >
                  {loading ? <Loader2 className="animate-spin" /> : (
                    <>
                      <span>{isSignUp ? "Initialize Sync" : "Establish Link"}</span>
                      <ArrowRight size={20} className="group-hover:translate-x-1.5 transition-transform" />
                    </>
                  )}
                </button>

                {error && (
                  <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest text-center pt-2 leading-relaxed italic">{error}</p>
                )}

                <div className="relative py-4 flex items-center">
                  <div className="flex-1 h-px bg-slate-100" />
                  <span className="px-6 text-[9px] font-black text-slate-300 uppercase tracking-[0.4em]">External Node Validation</span>
                  <div className="flex-1 h-px bg-slate-100" />
                </div>

                <button 
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full bg-white border border-slate-200 py-4 rounded-xl flex items-center justify-center gap-4 hover:bg-slate-50 transition-all active:scale-[0.98] group"
                >
                  <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" className="w-5 h-5 group-hover:scale-110 transition-transform" alt="G" />
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-600">Sync with Google</span>
                </button>
              </form>

              <div className="text-center pt-4">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  {isSignUp ? "Already Enrolled?" : "New Node Signature?"}{" "}
                  <button 
                    onClick={toggleMode}
                    className="text-blue-600 font-black hover:underline underline-offset-4 decoration-2"
                  >
                    {isSignUp ? "Sync Credentials" : "Enroll Node"}
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
