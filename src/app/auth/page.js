"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { 
  ShieldCheck, 
  Mail, 
  ArrowRight, 
  Sparkles, 
  Zap, 
  Lock, 
  KeyRound, 
  Eye, 
  EyeOff,
  Loader2,
  UserPlus,
  LogIn,
  Layers,
  Cpu,
  Globe
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const supabase = createClient();
  const router = useRouter();
  
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        setLoading(false);
      } else {
        router.push("/quiz");
        router.refresh();
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      });

      if (error) {
        setError(error.message);
        setLoading(false);
      } else {
        setError("Check your email for the confirmation link!");
        setLoading(false);
      }
    }
  };

  return (
    <div className="h-[100dvh] w-full bg-page-bg flex items-center justify-center p-4 relative overflow-hidden font-sans text-black">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[1000px] h-fit max-h-[90vh] grid md:grid-cols-[380px_1fr] bg-white rounded-[32px] overflow-hidden shadow-2xl border border-white/20"
      >
        {/* Left Side: Branding */}
        <div className="bg-primary-blue p-10 text-white flex flex-col justify-between relative overflow-hidden hidden md:flex">
          <div className="relative z-10 space-y-4">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Skill Forge</h1>
              <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mt-0.5">Authorized Credentials</p>
            </div>
          </div>

          <div className="relative z-10 space-y-10 py-6">
            <div className="space-y-6 opacity-80">
              <div className="flex items-start gap-4">
                <Cpu size={18} />
                <p className="text-[11px] font-medium leading-relaxed">Neural analysis and similarity scoring synchronization available.</p>
              </div>
              <div className="flex items-start gap-4">
                <ShieldCheck size={18} />
                <p className="text-[11px] font-medium leading-relaxed">Multi-factor encryption for individual candidate profiles.</p>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-6 border-t border-white/10">
            <p className="text-[9px] font-bold text-white/40 uppercase tracking-[0.3em]">SECURE AUTH NODE</p>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="p-8 md:p-12 flex flex-col justify-between bg-white max-h-[85vh]">
          <div className="space-y-8 flex flex-col items-center">
            <h2 className="text-4xl font-black text-[#0F172A] tracking-tight">{mode === "login" ? "Sign In" : "Register"}</h2>

            <form onSubmit={handleAuth} className="space-y-4 w-full">
              {mode === "signup" && (
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-[#64748B] uppercase tracking-widest pl-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full bg-[#F8FAFC] border border-[#E8EDF2] rounded-inner px-4 py-3 text-sm font-bold text-[#0F172A] focus:outline-none focus:border-primary-blue transition-all"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-[#64748B] uppercase tracking-widest pl-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-[#F8FAFC] border border-[#E8EDF2] rounded-inner px-4 py-3 text-sm font-bold text-[#0F172A] focus:outline-none focus:border-primary-blue transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-[#64748B] uppercase tracking-widest pl-1">Protocol Key</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#F8FAFC] border border-[#E8EDF2] rounded-inner px-4 py-3 text-sm font-bold text-[#0F172A] focus:outline-none focus:border-primary-blue transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-blue text-white py-4 rounded-inner font-bold text-xs tracking-widest uppercase hover:bg-deep-indigo transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <span>Execute {mode === "login" ? "Sign In" : "Registration"}</span>}
              </button>
            </form>
          </div>

          <div className="pt-8 flex flex-col items-center">
            <div className="flex p-0.5 bg-[#F1F5F9] rounded-pill border border-[#E8EDF2] w-fit">
              <button onClick={() => setMode("login")} className={`px-6 py-2 text-[10px] font-bold rounded-pill transition-all ${mode === "login" ? "bg-white text-primary-blue shadow-sm" : "text-[#64748B]"}`}>Sign In</button>
              <button onClick={() => setMode("signup")} className={`px-6 py-2 text-[10px] font-bold rounded-pill transition-all ${mode === "signup" ? "bg-white text-primary-blue shadow-sm" : "text-[#64748B]"}`}>Sign Up</button>
            </div>
            <footer className="mt-8 text-center opacity-50">
              <p className="text-[12px] font-black text-[#0F172A] uppercase tracking-[0.2em]">INNOVATORS & VISIONARIES CLUB</p>
            </footer>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
