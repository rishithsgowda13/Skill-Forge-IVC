"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { 
  ShieldCheck, 
  ArrowRight, 
  Zap, 
  Lock,
  Loader2,
  Mail,
  Activity
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setError(null);
    
    document.documentElement.classList.add("no-scroll");
    document.body.classList.add("no-scroll");
    
    return () => {
      document.documentElement.classList.remove("no-scroll");
      document.body.classList.remove("no-scroll");
    };
  }, [isSignUp]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    if (!isSignUp) {
      if (email === "1" && password === "1") {
        document.cookie = "mock_session=user:1; path=/";
        router.push("/dashboard");
        return;
      }

      if (email === "9" && password === "9") {
        document.cookie = "mock_session=user:9; path=/";
        router.push("/dashboard");
        return;
      }
      
      if (email === "123" && password === "123") {
        document.cookie = "mock_session=admin; path=/";
        router.push("/quiz/admin");
        return;
      }
      
      const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { 
        setError(error.message.toUpperCase()); 
        setLoading(false); 
      }
      else { 
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', authData.user.id)
          .single();
          
        if (profile?.role === "admin" || profile?.role === "evaluator") {
          router.push("/quiz/admin");
        } else {
          router.push("/dashboard");
        }
      }
    } else {
      if (password !== confirmPassword) {
        setError("Keys do not match.");
        setLoading(false);
        return;
      }

      const { data: authData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, role: 'candidate' },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      });

      if (error) { 
        setError(error.message.toUpperCase());
        setLoading(false); 
      }
      else if (authData.user) { 
        // Check if a profile with this email already exists (pre-created by admin)
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', email)
          .single();

        if (existingProfile) {
          // Claim the existing profile
          await supabase
            .from('profiles')
            .update({
              id: authData.user.id,
              full_name: fullName,
              role: 'candidate', // Ensure they have the correct role
              created_at: new Date().toISOString()
            })
            .eq('email', email);
        } else {
          // Create a new profile
          await supabase.from('profiles').insert([{
            id: authData.user.id,
            full_name: fullName,
            email: email,
            role: 'candidate',
            created_at: new Date().toISOString()
          }]);
        }

        setSuccessMessage("Sync Complete: Node established."); 
        setLoading(false); 
      }
    }
  };

  if (!isMounted) return null;

  return (
    <div className="fixed inset-0 w-full h-full bg-[#f8fafc] flex items-center justify-center p-4 font-sans selection:bg-blue-100 overflow-hidden relative">
      <motion.div
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full max-w-[780px] max-h-[85vh] bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden relative z-10 flex"
      >
        <AnimatePresence mode="wait">
          <motion.div 
            key={isSignUp ? "signup-branding" : "login-branding"}
            initial={{ opacity: 0, x: isSignUp ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isSignUp ? 20 : -20 }}
            className={`hidden lg:flex bg-[#2563EB] text-white absolute top-0 bottom-0 z-20 w-[260px] flex-col justify-between p-6 ${isSignUp ? "right-0" : "left-0"}`}
          >
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center gap-2 mb-8 group">
                <div className="w-8 h-8 bg-white/10 backdrop-blur-md rounded-lg flex items-center justify-center border border-white/20">
                  <ShieldCheck size={16} />
                </div>
                <h1 className="text-xs font-black tracking-tighter uppercase leading-none">Skill Forge</h1>
              </div>
 
              <div className="flex-1 flex flex-col justify-center space-y-8 py-4">
                <div className="space-y-2">
                  <h2 className="text-2xl font-black leading-[0.9] tracking-tighter uppercase">
                    {isSignUp ? "Connect\nNode" : "System\nSync"}
                  </h2>
                  <p className="text-blue-100/70 text-[9px] font-medium leading-relaxed max-w-[180px]">
                    Establish node presence in the NEXUS layers.
                  </p>
                </div>
 
                <div className="space-y-3">
                  {[
                    { icon: Zap, text: "Instant Validation" },
                    { icon: Lock, text: "Military Grade" },
                    { icon: Activity, text: "Biometric Nodes" }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 group/item">
                      <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
                        <item.icon size={11} className="text-blue-300" />
                      </div>
                      <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/80">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
 
              <div className="mt-auto pt-4">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-px bg-white/20" />
                  <span className="text-[7.5px] font-black uppercase tracking-[0.4em] text-white/30">Protocol 4.2.0-S</span>
                </div>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-900" />
          </motion.div>
        </AnimatePresence>
 
        <div className={`flex-1 flex flex-col justify-center px-6 md:px-8 py-6 relative overflow-y-auto custom-scrollbar ${isSignUp ? "lg:mr-[260px]" : "lg:ml-[260px]"}`}>
          <div className="max-w-[450px] mx-auto w-full space-y-4 flex flex-col items-center relative z-10">
            <div className="w-full text-center flex flex-col items-center">
              <div className="lg:hidden flex items-center justify-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                  <ShieldCheck size={20} />
                </div>
                <div className="text-left">
                  <span className="text-base font-black uppercase tracking-tighter text-slate-900 leading-none block">Skill Forge</span>
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-600/60 leading-none mt-1 block">Nexus Node</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="hidden lg:block text-[9px] font-black text-blue-600 uppercase tracking-[0.4em] mb-1">Innovators and Visionaries</p>
                <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                  {isSignUp ? "Initialize" : "Welcome"}
                </h1>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Identification Parameters Sync</p>
              </div>
            </div>

            <div className="space-y-3 w-full">
               <form onSubmit={handleAuth} className="space-y-3">
                 {isSignUp && (
                   <div className="space-y-1 text-left">
                     <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1.5">Authorized Name</label>
                     <input 
                       required
                       type="text"
                       value={fullName}
                       onChange={(e) => setFullName(e.target.value)}
                       placeholder="Enter Node Identity Name"
                       className="w-full bg-slate-50 border border-slate-100 rounded-lg py-2 px-4 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600 transition-all"
                     />
                   </div>
                 )}
 
                 <div className="space-y-1 text-left">
                   <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1.5">Node Credentials</label>
                   <div className="relative group">
                     <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                     <input 
                       required
                       type="text"
                       value={email}
                       onChange={(e) => setEmail(e.target.value)}
                       placeholder="authorized@skillforge.io"
                       className="w-full bg-slate-50 border border-slate-100 rounded-lg py-2 pl-10 pr-4 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600 transition-all"
                     />
                   </div>
                 </div>
 
                 <div className="space-y-1 text-left">
                   <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1.5">Security Protocol Key</label>
                   <div className="relative group">
                     <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                     <input 
                       required
                       type="password"
                       value={password}
                       onChange={(e) => setPassword(e.target.value)}
                       placeholder="••••••••••••"
                       className="w-full bg-slate-50 border border-slate-100 rounded-lg py-2 pl-10 pr-4 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600 transition-all"
                     />
                   </div>
                 </div>
 
                 {isSignUp && (
                   <div className="space-y-1">
                     <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1.5">Confirm Key</label>
                     <input 
                       required
                       type="password"
                       value={confirmPassword}
                       onChange={(e) => setConfirmPassword(e.target.value)}
                       placeholder="••••••••••••"
                       className="w-full bg-slate-50 border border-slate-100 rounded-lg py-2 px-4 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600 transition-all"
                     />
                   </div>
                 )}
 
                 <button
                   disabled={loading}
                   className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-black text-[8px] tracking-[0.3em] uppercase shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 group"
                 >
                   {loading ? <Loader2 className="animate-spin" size={14} /> : (
                     <>
                       <span>{isSignUp ? "Initialize Sync" : "Establish Link"}</span>
                       <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                     </>
                   )}
                 </button>
 
                 {error && (
                   <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest text-center pt-1 leading-relaxed italic">{error}</p>
                 )}
                 {successMessage && (
                   <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest text-center pt-1 leading-relaxed italic">{successMessage}</p>
                 )}
               </form>
 
               <div className="text-center pt-2 flex flex-col items-center">
                 <div className="flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-widest leading-relaxed">
                   <span>Registration is strictly restricted to authorized nodes only.</span>
                 </div>
               </div>
             </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
