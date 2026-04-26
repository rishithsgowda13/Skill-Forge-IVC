"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trophy, 
  Award, 
  Star, 
  Zap, 
  Target, 
  CheckCircle2, 
  Medal, 
  Crown, 
  Shield, 
  Sparkles,
  Lock,
  ChevronRight,
  TrendingUp,
  Activity
} from "lucide-react";
import { createClient } from "@/lib/supabase";

const ICON_MAP = {
  Trophy: Trophy,
  Award: Award,
  Star: Star,
  Zap: Zap,
  Target: Target,
  Check: CheckCircle2,
  Medal: Medal,
  Crown: Crown,
  Shield: Shield,
};

const COLOR_MAP = {
  Trophy: "text-amber-500 bg-amber-50 border-amber-100",
  Award: "text-blue-500 bg-blue-50 border-blue-100",
  Star: "text-yellow-500 bg-yellow-50 border-yellow-100",
  Zap: "text-violet-500 bg-violet-50 border-violet-100",
  Target: "text-rose-500 bg-rose-50 border-rose-100",
  Check: "text-emerald-500 bg-emerald-50 border-emerald-100",
  Medal: "text-orange-500 bg-orange-50 border-orange-100",
  Crown: "text-purple-500 bg-purple-50 border-purple-100",
  Shield: "text-indigo-500 bg-indigo-50 border-indigo-100",
};

export default function CandidateAchievementsPage() {
  const supabase = createClient();
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAchievements();
  }, []);

  async function fetchAchievements() {
    setLoading(true);
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) {
      // Mocking some as claimed for demo
      const enriched = (data || [
        { id: '1', title: 'Pioneer Contributor', description: 'Among the first 10 members to join the SkillForge ecosystem.', icon: 'Crown', criteria: 'Early Access Member' },
        { id: '2', title: 'Efficiency Master', description: 'Maintain a 100% velocity rate for 7 consecutive days.', icon: 'Zap', criteria: 'Daily Activity' },
        { id: '3', title: 'Nexus Architect', description: 'Successfully lead a project from initialization to deployment.', icon: 'Trophy', criteria: 'Project Leadership' },
        { id: '4', title: 'Data Sentinel', description: 'Identify and resolve 5 critical anomalies in the system.', icon: 'Shield', criteria: 'System Security' },
      ]).map((a, i) => ({ ...a, isClaimed: i < 2 }));
      
      setAchievements(enriched);
    }
    setLoading(false);
  }

  const claimed = achievements.filter(a => a.isClaimed);
  const locked = achievements.filter(a => !a.isClaimed);

  return (
    <div className="p-6 md:p-10 space-y-12 bg-[#F8FAFC] min-h-screen">
      {/* Header & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2 text-amber-500 mb-1">
              <Sparkles size={16} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Achievements Repository</span>
            </div>
            <h1 className="text-5xl font-black text-[#0F172A] tracking-tighter uppercase leading-none">
              Hall of <span className="text-amber-500">Excellence</span>
            </h1>
            <p className="text-sm font-bold text-[#64748B] uppercase tracking-widest max-w-xl">
              Track your milestones, claimed honors, and upcoming challenges in the club ecosystem.
            </p>
         </div>

         <div className="bg-[#0F172A] rounded-[40px] p-8 text-white flex items-center justify-between shadow-2xl relative overflow-hidden group">
            <div className="relative z-10">
               <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-2">Honors Earned</p>
               <div className="flex items-end gap-3">
                  <span className="text-5xl font-black">{claimed.length}</span>
                  <span className="text-xl font-black text-white/20 mb-1">/ {achievements.length}</span>
               </div>
            </div>
            <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center text-amber-400 group-hover:rotate-12 transition-transform duration-500">
               <Trophy size={32} />
            </div>
            <Sparkles size={120} className="absolute -bottom-10 -right-10 text-white/5 opacity-20" />
         </div>
      </div>

      {/* Claimed Achievements */}
      <section className="space-y-8">
         <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-50 rounded-2xl">
              <Trophy size={20} className="text-amber-500" />
            </div>
            <h2 className="text-xl font-black text-[#0F172A] uppercase tracking-tighter">Your Collection</h2>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <AnimatePresence>
               {claimed.map((ach, idx) => {
                 const Icon = ICON_MAP[ach.icon] || Trophy;
                 const colors = COLOR_MAP[ach.icon] || COLOR_MAP.Trophy;
                 return (
                   <motion.div
                     key={ach.id}
                     initial={{ opacity: 0, scale: 0.9 }}
                     animate={{ opacity: 1, scale: 1 }}
                     transition={{ delay: idx * 0.1 }}
                     className="bg-white rounded-[40px] p-8 border border-[#E2E8F0] shadow-sm hover:shadow-xl hover:border-amber-200 transition-all text-center group"
                   >
                     <div className={`w-20 h-20 mx-auto rounded-[32px] flex items-center justify-center mb-6 shadow-lg shadow-current/10 group-hover:scale-110 transition-transform ${colors}`}>
                        <Icon size={36} />
                     </div>
                     <h3 className="text-lg font-black text-[#0F172A] uppercase tracking-tight mb-2 group-hover:text-amber-600 transition-colors">{ach.title}</h3>
                     <p className="text-[10px] font-bold text-[#94A3B8] leading-relaxed uppercase tracking-wider line-clamp-2">{ach.description}</p>
                     
                     <div className="mt-6 pt-4 border-t border-[#F1F5F9]">
                        <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">Claimed · APR 24</span>
                     </div>
                   </motion.div>
                 );
               })}
            </AnimatePresence>
         </div>
      </section>

      {/* Locked Achievements */}
      <section className="space-y-8">
         <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-100 rounded-2xl">
              <Lock size={20} className="text-slate-400" />
            </div>
            <h2 className="text-xl font-black text-[#0F172A] uppercase tracking-tighter">Potential Honors</h2>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {locked.map((ach, idx) => {
              const Icon = ICON_MAP[ach.icon] || Trophy;
              return (
                <div key={ach.id} className="bg-[#F8FAFC] rounded-[40px] p-10 border border-[#E2E8F0] border-dashed group hover:bg-white hover:border-solid hover:border-blue-200 transition-all flex items-start gap-8">
                   <div className="w-16 h-16 rounded-3xl bg-white flex items-center justify-center text-slate-300 border border-[#F1F5F9] shadow-sm group-hover:text-blue-600 group-hover:border-blue-100 transition-all flex-shrink-0">
                      <Icon size={28} />
                   </div>
                   <div className="space-y-4">
                      <div>
                         <h3 className="text-lg font-black text-[#94A3B8] uppercase tracking-tight group-hover:text-[#0F172A] transition-colors">{ach.title}</h3>
                         <p className="text-[10px] font-bold text-[#CBD5E1] leading-relaxed uppercase tracking-widest mt-1 group-hover:text-slate-500 transition-colors">{ach.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                         <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest bg-white px-2 py-1 rounded-lg border border-[#F1F5F9]">Criteria: {ach.criteria}</span>
                      </div>
                   </div>
                </div>
              );
            })}
         </div>
      </section>

      {/* Activity / Leaderboard Mini */}
      <div className="bg-white rounded-[40px] p-10 border border-[#E2E8F0] shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
         <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-600">
               <TrendingUp size={32} />
            </div>
            <div>
               <h3 className="text-xl font-black text-[#0F172A] uppercase tracking-tighter">Honors Progression</h3>
               <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.2em] mt-1">Global Elite percentile among club members</p>
            </div>
         </div>
         <div className="flex items-center gap-4">
            <div className="text-right">
               <p className="text-2xl font-black text-[#0F172A]">TOP 8%</p>
               <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Master Bracket</p>
            </div>
            <div className="w-px h-12 bg-slate-100" />
            <button className="bg-[#0F172A] text-white px-8 py-4 rounded-2xl font-black text-[9px] tracking-[0.3em] uppercase shadow-xl shadow-slate-200 flex items-center gap-2 hover:bg-slate-800 transition-all">
               View Global Board <ChevronRight size={14} />
            </button>
         </div>
      </div>
    </div>
  );
}
