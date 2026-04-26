"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { 
  Users, 
  FileCheck, 
  ShieldAlert, 
  Clock, 
  TrendingUp, 
  ChevronRight,
  Monitor,
  CheckCircle2,
  AlertTriangle,
  LayoutGrid,
  Activity,
  Trophy,
  Medal,
  Circle
} from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [realStats, setRealStats] = useState({
    totalSessions: 0,
    platformPulse: "0%",
    activeQuizzes: 0,
    avgCompletion: "0%",
    securityFlags: 0,
    timeOptimized: "0h 0m"
  });
  const [teamUtilization, setTeamUtilization] = useState([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      
      // Fetch Total Members
      const { count: memberCount } = await supabase
        .from("member_registry")
        .select("*", { count: 'exact', head: true });

      // Fetch Projects
      const { data: projData } = await supabase
        .from("projects")
        .select("*");
      
      const activeProjCount = projData?.filter(p => p.status === 'active').length || 0;
      
      // Calculate avg completion
      let totalComp = 0;
      if (projData?.length > 0) {
        // Mocking a bit here based on phases if they exist
        projData.forEach(p => {
          if (p.status === 'completed') totalComp += 100;
          else if (p.phases?.length > 0) totalComp += 30; // Simple heuristic
        });
      }
      const avgComp = projData?.length > 0 ? (totalComp / projData.length).toFixed(0) : 0;

      // Fetch Leaderboard from member_registry
      const { data: leadData } = await supabase
        .from("member_registry")
        .select("full_name, email, usn, skill_profile");
      
      const scoredLeaderboard = (leadData || []).map(m => {
        let skills = [];
        try {
          const parsed = typeof m.skill_profile === "string" ? JSON.parse(m.skill_profile) : m.skill_profile;
          skills = (parsed || []).filter(s => s.skill && s.rating > 0);
        } catch (e) {}
        return {
          ...m,
          total_score: skills.reduce((s, k) => s + k.rating, 0) * 10
        };
      }).sort((a, b) => b.total_score - a.total_score).slice(0, 10);

      // Fetch Latest Registered Members
      const { data: userData } = await supabase
        .from("member_registry")
        .select("full_name, usn, email")
        .order("created_at", { ascending: false })
        .limit(5);

      setRealStats({
        totalMembers: memberCount || 0,
        activeInitiatives: activeProjCount,
        avgCompletion: `${avgComp}%`,
        latePhases: 0, // Logic for this later
        systemHealth: "100%",
        totalSkillsTracked: scoredLeaderboard.reduce((acc, curr) => acc + (curr.skill_profile ? (typeof curr.skill_profile === 'string' ? JSON.parse(curr.skill_profile).length : curr.skill_profile.length) : 0), 0)
      });

      setLeaderboard(scoredLeaderboard);
      setTeamUtilization(userData || []);
      setLoading(false);
    }
    loadData();
  }, []);

  const statsDisplay = [
    { label: "Members", desc: "Registered Nodes", value: realStats.totalMembers, icon: Users, color: "#2563EB" },
    { label: "Initiatives", desc: "Active Projects", value: realStats.activeInitiatives, icon: Activity, color: "#10B981" },
    { label: "Completion", desc: "Overall Progress", value: realStats.avgCompletion, icon: FileCheck, color: "#6366F1" },
    { label: "Late Tasks", desc: "Overdue Phases", value: realStats.latePhases, icon: ShieldAlert, color: "#EF4444" },
    { label: "Pulse", desc: "System Status", value: realStats.systemHealth, icon: Monitor, color: "#F59E0B" },
    { label: "Mastery", desc: "Skills Cataloged", value: realStats.totalSkillsTracked, icon: Trophy, color: "#0EA5E9" },
  ];

  return (
    <div className="flex flex-col p-8 md:p-14 space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 md:gap-0">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl md:text-3xl font-black text-[#0F172A] tracking-tighter uppercase">Dashboard</h1>
          <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-[0.3em] mt-1">Real-time monitoring & analytics</p>
        </motion.div>
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-[#E2E8F0]">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[9px] font-black text-[#64748B] uppercase tracking-wider">Online</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {statsDisplay.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="bg-white p-5 rounded-2xl border border-[#E2E8F0] flex flex-col gap-3 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <stat.icon size={18} color={stat.color} strokeWidth={2.5} />
              <span className="text-[8px] font-bold text-[#CBD5E1] uppercase tracking-wider">{stat.desc}</span>
            </div>
            <div>
              <h3 className="text-2xl font-black text-[#0F172A] leading-none">{stat.value}</h3>
              <p className="text-[9px] font-black text-[#94A3B8] uppercase tracking-wider mt-1">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Leaderboard */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-[#E2E8F0] space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy size={18} className="text-[#2563EB]" />
          <h3 className="text-base font-black text-[#0F172A] uppercase tracking-tight">Active Rankings</h3>
          </div>
          <span className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-wider">Top 10 · Mastery</span>
        </div>

        {!loading && leaderboard.length === 0 ? (
           <div className="py-10 text-center text-[10px] uppercase font-black tracking-widest text-[#CBD5E1]">No rankings yet</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
            {leaderboard.map((item, index) => (
              <motion.div
                key={item.email}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.03 }}
                className="flex items-center justify-between py-3 border-b border-[#F8FAFC] last:border-none group"
              >
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${
                    index === 0 ? "bg-blue-50 text-blue-600" :
                    index === 1 ? "bg-emerald-50 text-emerald-600" :
                    index === 2 ? "bg-amber-50 text-amber-600" :
                    "text-[#CBD5E1]"
                  }`}>
                    {index + 1}
                  </span>
                  <div className="w-7 h-7 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center font-black text-[10px] text-slate-400">
                    {item.full_name?.[0] || "U"}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-[#0F172A] group-hover:text-blue-600 transition-colors truncate">
                      {item.full_name || "Member"}
                    </span>
                    <span className="text-[8px] font-bold text-[#94A3B8] uppercase tracking-widest">{item.usn}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-sm font-black text-[#0F172A] tabular-nums">{item.total_score}</span>
                  <span className="text-[7px] font-black text-amber-500 uppercase tracking-widest">Mastery</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Flow */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-[#E2E8F0] space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <LayoutGrid size={18} className="text-[#2563EB]" />
              <h3 className="text-base font-black text-[#0F172A] uppercase tracking-tight">Platform Flow</h3>
            </div>
          </div>
          
          <div className="space-y-5">
            {[
              { label: "Phase Progression", value: realStats.avgCompletion.replace('%', ''), color: "#10B981" },
              { label: "Skill Mastery", value: leaderboard.length > 0 ? (leaderboard.reduce((a, b) => a + b.total_score, 0) / (leaderboard.length * 1000) * 100).toFixed(0) : 0, color: "#F59E0B" },
              { label: "Project Velocity", value: realStats.activeInitiatives > 0 ? 100 : 0, color: "#2563EB" }
            ].map((flow) => (
              <div key={flow.label} className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                  <span className="text-[#64748B]">{flow.label}</span>
                  <span className="text-[#0F172A] font-black">{flow.value}%</span>
                </div>
                <div className="h-2 bg-[#F8FAFC] rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: `${flow.value}%` }} 
                    transition={{ duration: 1, delay: 0.2 }}
                    className="h-full rounded-full" 
                    style={{ backgroundColor: flow.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Managed Nodes */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-[#E2E8F0] space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users size={18} className="text-[#2563EB]" />
              <h3 className="text-base font-black text-[#0F172A] uppercase tracking-tight">Members</h3>
            </div>
            <button 
              onClick={() => router.push('/admin/users')}
              className="text-[9px] font-black text-blue-600 uppercase tracking-wider hover:underline flex items-center gap-1"
            >
              View All <ChevronRight size={11} strokeWidth={3} />
            </button>
          </div>

          <div className="space-y-1">
            {teamUtilization.length === 0 ? (
              <div className="py-10 text-center text-[10px] uppercase font-bold tracking-widest text-[#CBD5E1]">No members registered</div>
            ) : teamUtilization.map((user, i) => (
              <div key={user.email} className="flex items-center justify-between py-3 border-b border-[#F8FAFC] last:border-none">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-[#0F172A] rounded-xl flex items-center justify-center text-white font-black text-[10px]">
                    {user.full_name?.split(" ").map(n => n[0]).join("") || "U"}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#0F172A] leading-tight">{user.full_name || "Unknown"}</p>
                    <p className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-wider">{user.usn || "Member"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-wider">Verified</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
