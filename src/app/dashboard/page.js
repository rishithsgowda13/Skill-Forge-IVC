"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, 
  BarChart3, 
  BookText, 
  Users2, 
  Activity, 
  Trophy, 
  Zap, 
  Target, 
  CheckCircle2, 
  Clock, 
  TrendingUp,
  LayoutDashboard,
  Search,
  Bell,
  ArrowRight,
  Sparkles,
  Award,
  Briefcase,
  LayoutGrid
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import Sidebar from "@/components/layout/Sidebar";
import RadarChart from "@/components/charts/RadarChart";

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [role, setRole] = useState("user");
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [profile, setProfile] = useState(null);
  const [activeProjCount, setActiveProjCount] = useState(0);
  const [totalActiveProjCount, setTotalActiveProjCount] = useState(0);

  useEffect(() => {
    setIsMounted(true);
    
    async function loadData() {
      // Get User Email
      const cookies = document.cookie.split(';');
      const sessionCookie = cookies.find(c => c.trim().startsWith('mock_session='));
      let email = "";
      if (sessionCookie) {
        email = sessionCookie.split('=')[1].split(':')[1];
      }

      // Fetch Profile
      const { data: prof } = await supabase.from('member_registry').select('*').eq('email', email).single();
      setProfile(prof);

      // Fetch All Active Projects
      const { data: allProj } = await supabase.from('projects').select('*').eq('status', 'active');
      setTotalActiveProjCount(allProj?.length || 0);

      // Fetch My Projects
      if (email) {
        const myProjs = (allProj || []).filter(p => {
          try {
            const team = Array.isArray(p.team) ? p.team : (typeof p.team === 'string' ? JSON.parse(p.team) : []);
            return team.some(m => m.email === email);
          } catch { return false; }
        });
        setActiveProjCount(myProjs.length);
      }

      setLoading(false);
    }
    loadData();
  }, []);

  if (!isMounted) return null;

  let skills = [];
  try {
    const parsed = typeof profile?.skill_profile === "string" ? JSON.parse(profile.skill_profile) : profile.skill_profile;
    skills = (parsed || []).filter(s => s.skill && s.rating > 0);
  } catch(e) {}

  const stats = [
    { title: "TOTAL INITIATIVES", value: totalActiveProjCount, icon: LayoutGrid, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "MY ASSIGNMENTS", value: activeProjCount, icon: Activity, color: "text-emerald-500", bg: "bg-emerald-50" },
    { title: "NEURAL MASTERY", value: skills.reduce((s, k) => s + k.rating, 0) * 10, icon: Zap, color: "text-indigo-600", bg: "bg-indigo-50" },
    { title: "ACHIEVEMENTS", value: "0", icon: Trophy, color: "text-amber-500", bg: "bg-amber-50" },
  ];

  return (
    <div className="flex flex-col p-6 md:p-10 space-y-10 bg-[#F8FAFC] min-h-screen">
      <header className="flex justify-between items-start w-full">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <LayoutDashboard size={14} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Command Console</span>
          </div>
          <h2 className="text-4xl font-black text-[#0F172A] tracking-tighter uppercase leading-none">
            Welcome, <span className="text-blue-600">{profile?.full_name?.split(' ')[0] || "Entity"}</span>
          </h2>
          <p className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-[0.3em]">
            SkillForge · Membership Status: <span className="text-emerald-500">Active</span>
          </p>
        </div>
        
        <div className="flex gap-3">
           <button className="p-3 bg-white border border-[#E2E8F0] rounded-2xl text-slate-400 hover:text-blue-600 transition-all shadow-sm">
             <Bell size={20} />
           </button>
           <div className="w-12 h-12 bg-[#0F172A] rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-xl">
             {profile?.full_name?.[0] || "U"}
           </div>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white rounded-[32px] p-8 border border-[#E2E8F0] shadow-sm hover:shadow-xl hover:border-blue-200 transition-all group overflow-hidden relative"
          >
            <div className="relative z-10 flex flex-col gap-4">
              <div className={`p-3 w-fit rounded-2xl ${stat.bg} ${stat.color}`}>
                <stat.icon size={24} />
              </div>
              <div>
                <p className="text-3xl font-black text-[#0F172A]">{stat.value}</p>
                <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.2em] leading-none mt-1">{stat.title}</p>
              </div>
            </div>
            <stat.icon size={120} className={`absolute -bottom-10 -right-10 opacity-[0.03] group-hover:scale-110 transition-transform duration-500 ${stat.color}`} />
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Skills Section */}
        <div className="lg:col-span-2 space-y-8">
           <div className="bg-white rounded-[48px] p-10 border border-[#E2E8F0] shadow-sm space-y-10">
              <div className="flex items-center justify-between">
                 <div className="space-y-1">
                    <h3 className="text-2xl font-black text-[#0F172A] uppercase tracking-tighter">Skill Competency</h3>
                    <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">Global Node Performance Mapping</p>
                 </div>
                 <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition-all">Update Profile</button>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-12">
                 <div className="bg-[#F8FAFC] p-8 rounded-[40px] border border-[#F1F5F9] shadow-inner">
                    <RadarChart skills={skills} size={300} showLabels={true} />
                 </div>
                 <div className="flex-1 space-y-6 w-full">
                    <h4 className="text-[11px] font-black text-[#0F172A] uppercase tracking-[0.2em] mb-4">Core Strengths</h4>
                    <div className="space-y-4">
                       {skills.slice(0, 4).map((s, i) => (
                         <div key={i} className="space-y-2">
                            <div className="flex justify-between items-end">
                               <span className="text-xs font-black text-[#0F172A] uppercase tracking-tight">{s.skill}</span>
                               <span className="text-[10px] font-black text-blue-600">{s.rating * 20}%</span>
                            </div>
                            <div className="h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                               <motion.div 
                                 initial={{ width: 0 }}
                                 animate={{ width: `${s.rating * 20}%` }}
                                 transition={{ delay: i * 0.1 + 0.5, duration: 1 }}
                                 className="h-full bg-blue-600 rounded-full"
                               />
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>
           </div>

           {/* Active Projects Preview */}
           <div className="space-y-6">
              <div className="flex items-center justify-between px-4">
                 <h3 className="text-lg font-black text-[#0F172A] uppercase tracking-tighter flex items-center gap-2">
                   <Briefcase size={20} className="text-blue-600" />
                   Active Assignments
                 </h3>
                 <button onClick={() => router.push('/dashboard/projects')} className="text-[9px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all">
                   View All <ArrowRight size={14} />
                 </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col items-center justify-center p-12 bg-white rounded-[40px] border border-[#E2E8F0] md:col-span-2 opacity-50 border-dashed">
                  <Briefcase size={40} className="text-slate-300 mb-3" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No Assignments Yet</p>
                </div>
              </div>
           </div>
        </div>

        {/* Sidebar Section */}
        <div className="space-y-10">
           {/* Achievement Showcase */}
           <div className="bg-[#0F172A] rounded-[48px] p-10 text-white shadow-2xl space-y-8 relative overflow-hidden">
              <div className="relative z-10 space-y-6">
                 <div className="space-y-1">
                    <h3 className="text-2xl font-black uppercase tracking-tighter">Top Honors</h3>
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Claimed Club Achievements</p>
                 </div>
                 <div className="space-y-4">
                  <div className="flex flex-col items-center justify-center p-10 opacity-30">
                    <Award size={32} className="text-white/40 mb-2" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Coming Soon</p>
                  </div>
                 </div>
                 <button onClick={() => router.push('/dashboard/achievements')} className="w-full py-4 bg-white text-[#0F172A] rounded-2xl font-black text-[10px] tracking-[0.3em] uppercase shadow-xl hover:bg-blue-50 transition-all">
                    Hall of Valor
                 </button>
              </div>
              <Sparkles size={180} className="absolute -bottom-10 -right-10 text-white/5" />
           </div>

           {/* Quick Actions / Recent Activity */}
           <div className="bg-white rounded-[48px] p-10 border border-[#E2E8F0] shadow-sm space-y-8">
              <h3 className="text-[11px] font-black text-[#0F172A] uppercase tracking-[0.2em]">Recent Logs</h3>
              <div className="space-y-6">
                <div className="flex flex-col items-center justify-center py-10 opacity-30">
                   <Activity size={32} className="text-slate-300 mb-2" />
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No Recent Activity</p>
                </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function Crown({ size, className }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
    </svg>
  );
}
