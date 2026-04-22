"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, 
  BarChart3, 
  BookText, 
  Users2, 
  FileBox, 
  LogOut, 
  Plus, 
  Activity, 
  FileText, 
  LayoutDashboard,
  Search,
  Bell,
  ChevronDown,
  ArrowRight,
  Trophy,
  History,
  Zap,
  Lock,
  Medal,
  Dna,
  X,
  Clock,
  Target,
  BarChart,
  ArrowLeft,
  TrendingUp,
  Check
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import Sidebar from "@/components/layout/Sidebar";

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [role, setRole] = useState("user");
  const [submissions, setSubmissions] = useState([]);
  const [globalLeaderboard, setGlobalLeaderboard] = useState([]);
  const [attendedQuizzes, setAttendedQuizzes] = useState([]);
  const [selectedQuizId, setSelectedQuizId] = useState("all");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionLeaderboard, setSessionLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const cookies = document.cookie.split(';');
    const sessionCookie = cookies.find(c => c.trim().startsWith('mock_session='));
    if (sessionCookie) {
      setRole(sessionCookie.split('=')[1]);
    }

    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Fetch user's submissions to get attended quizzes
      const { data: userSubs } = await supabase
        .from("submissions")
        .select("*, quizzes(id, title, total_questions)")
        .order("submitted_at", { ascending: false });
        
      setSubmissions(userSubs || []);
      
      // Extract unique quizzes
      const unique = Array.from(new Map((userSubs || []).map(s => [s.quizzes?.id, s.quizzes])).values()).filter(q => q);
      setAttendedQuizzes(unique);
      
      setLoading(false);
      fetchLeaderboard("all");
    }

    const fetchLeaderboard = async (quizId) => {
      setLeaderboardLoading(true);
      let query = supabase
        .from("submissions")
        .select("*, profiles!user_id(full_name, avatar_url)")
        .order("total_score", { ascending: false })
        .order("time_taken", { ascending: true })
        .limit(5);

      if (quizId !== "all") {
        query = query.eq("quiz_id", quizId);
      }

      const { data: globalSubs } = await query;
      setGlobalLeaderboard(globalSubs || []);
      setLeaderboardLoading(false);
    };

    loadData();

    // Subscribe to submission and profile changes globally
    const channel = supabase
      .channel("global-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "submissions" }, () => {
        loadData();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleQuizFilter = (quizId) => {
    setSelectedQuizId(quizId);
    async function update() {
      setLeaderboardLoading(true);
      let query = supabase
        .from("submissions")
        .select("*, profiles!user_id(full_name, avatar_url)")
        .order("total_score", { ascending: false })
        .order("time_taken", { ascending: true })
        .limit(5);

      if (quizId !== "all") {
        query = query.eq("quiz_id", quizId);
      }

      const { data } = await query;
      setGlobalLeaderboard(data || []);
      setLeaderboardLoading(false);
    }
    update();
  };

  const fetchSessionDetails = async (session) => {
    setDetailsLoading(true);
    setSelectedSession(session);
    
    // Fetch leaderboard for this specific quiz
    const { data } = await supabase
        .from("submissions")
        .select("*, profiles!user_id(full_name)")
        .eq("quiz_id", session.quiz_id)
        .order("total_score", { ascending: false })
        .limit(10);
        
    setSessionLeaderboard(data || []);
    setDetailsLoading(false);
  };

  const isAdmin = role === "admin";

  const stats = [
    { title: "SESSIONS ATTENDED", value: submissions.length, icon: History, color: "text-blue-600" },
    { title: "AVERAGE ACCURACY", value: submissions.length ? `${(submissions.reduce((acc, s) => acc + (s.total_score || 0), 0) / submissions.length / 10 * 100).toFixed(0)}%` : "0%", icon: Target, color: "text-emerald-500" },
    { title: "TOTAL SYNC TIME", value: submissions.length ? `${(submissions.length * 30)}m` : "0m", icon: Clock, color: "text-indigo-600" },
    { title: "GLOBAL RANKING", value: "#14", icon: Trophy, color: "text-amber-500" },
  ];

  if (selectedSession) {
    return (
      <div className="flex flex-col p-6 md:p-8 space-y-8">
           <button 
             onClick={() => setSelectedSession(null)}
             className="flex items-center gap-2.5 px-5 py-2.5 bg-white border border-[#E2E8F0] shadow-sm rounded-xl text-[9px] font-black uppercase tracking-widest text-[#64748B] hover:text-[#0F172A] hover:bg-gray-50 transition-all group"
           >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              <span>Back to Control Center</span>
           </button>

           <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-2">
                 <h2 className="text-3xl font-black text-[#0F172A] tracking-tighter uppercase leading-none">
                   Session <span className="text-[#2563EB]">Analysis</span>
                 </h2>
                 <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.3em]">
                   {selectedSession.quizzes?.title || "PROTOCOL_ID_UNDEFINED"}
                 </p>
              </div>
              <div className="flex gap-3">
                 <div className="bg-[#0F172A] text-white px-6 py-3 rounded-xl flex flex-col items-center">
                    <span className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1">Time Sync</span>
                    <span className="text-xl font-black">{selectedSession.time_taken || "24:12"}s</span>
                 </div>
                 <div className="bg-white border border-[#E2E8F0] px-6 py-3 rounded-xl flex flex-col items-center shadow-sm">
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#94A3B8] mb-1">Total Score</span>
                    <span className="text-lg font-black text-[#2563EB]">{selectedSession.total_score}</span>
                 </div>
              </div>
           </div>

           {/* Stats Cards */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 md:p-8 rounded-[12px] border border-[#E2E8F0] shadow-sm space-y-4">
                 <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-[#2563EB]">
                    <BarChart size={20} />
                 </div>
                 <div>
                    <h4 className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.2em] mb-1 leading-none">Intelligence Accuracy</h4>
                    <p className="text-3xl font-black text-[#0F172A]">
                      {((selectedSession.total_score / (selectedSession.quizzes?.total_questions || 10)) * 10).toFixed(0)}%
                    </p>
                    <div className="mt-3 h-1 bg-gray-50 rounded-full overflow-hidden">
                       <motion.div initial={{ width: 0 }} animate={{ width: `${(selectedSession.total_score / (selectedSession.quizzes?.total_questions || 10)) * 100}%` }} className="h-full bg-[#2563EB]" />
                    </div>
                 </div>
              </div>

              <div className="bg-white p-6 md:p-8 rounded-[12px] border border-[#E2E8F0] shadow-sm space-y-4">
                 <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500">
                    <BookText size={20} />
                 </div>
                 <div>
                    <h4 className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.2em] mb-1 leading-none">Data Points Resolved</h4>
                    <p className="text-3xl font-black text-[#0F172A]">
                      {selectedSession.total_score} <span className="text-lg text-[#94A3B8]">/ {selectedSession.quizzes?.total_questions || 10}</span>
                    </p>
                    <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mt-1.5">{selectedSession.flagged ? "ANOMALY DETECTED" : "INTEGRITY VERIFIED"}</p>
                 </div>
              </div>

              <div className="bg-[#0F172A] p-6 md:p-8 rounded-[12px] shadow-2xl text-white space-y-4 overflow-hidden relative">
                 <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                    <Trophy size={20} className="text-amber-400" />
                 </div>
                 <div className="relative z-10">
                    <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-1 leading-none">Session Rank</h4>
                    <p className="text-3xl font-black">TOP 42%</p>
                    <p className="text-[9px] font-black text-white/60 uppercase tracking-widest mt-3">ELITE CANDIDATE BRACKET</p>
                 </div>
                 <Shield size={100} className="absolute -bottom-6 -right-6 text-white/5" />
              </div>
           </div>

           {/* Protocol Leaderboard */}
           <div className="bg-white rounded-[12px] border border-[#E2E8F0] shadow-sm p-8 md:p-10">
              <div className="flex items-center justify-between mb-8">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-amber-50 rounded-2xl">
                       <Medal size={24} className="text-amber-500" />
                    </div>
                     <div>
                       <h3 className="text-xl font-black uppercase tracking-tighter text-[#0F172A]">Protocol Leaderboard</h3>
                       <p className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-widest">Global Session Rankings</p>
                    </div>
                 </div>
              </div>

              <div className="space-y-6">
                 {detailsLoading ? (
                    <div className="flex flex-col gap-6">
                       {[1,2,3,4,5].map(i => <div key={i} className="h-24 bg-gray-50 rounded-[32px] animate-pulse" />)}
                    </div>
                 ) : sessionLeaderboard.map((u, i) => (
                    <motion.div 
                      key={u.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`flex items-center justify-between p-8 rounded-[36px] bg-white border border-[#E2E8F0] transition-all hover:shadow-2xl hover:shadow-blue-900/5 group ${i === 0 ? "border-[#F59E0B]/20 bg-amber-50/20" : ""}`}
                    >
                       <div className="flex items-center gap-8">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm border-2 ${
                            i === 0 ? "bg-amber-50 text-amber-500 border-amber-300" :
                            i === 1 ? "bg-slate-50 text-slate-500 border-slate-300" :
                            i === 2 ? "bg-orange-50 text-orange-600 border-orange-300" :
                            "bg-white text-gray-400 border-gray-100"
                          }`}>
                            {i + 1}
                          </div>
                          <div>
                             <h5 className="font-extrabold text-[#0F172A] uppercase tracking-tight group-hover:text-[#2563EB] transition-colors">{u.profiles?.full_name || "Unknown Entity"}</h5>
                             <div className="flex items-center gap-2 mt-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">Authorized Node</span>
                             </div>
                          </div>
                       </div>
                       <div className="flex items-center gap-12">
                          <div className="text-right hidden sm:block">
                             <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest leading-none mb-1">Time</p>
                             <p className="text-xs font-black text-[#0F172A]">{u.time_taken || "24:12"}s</p>
                          </div>
                          <div className="text-right">
                             <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest leading-none mb-1">Points</p>
                             <p className="text-2xl font-black text-[#0F172A]">{u.total_score}</p>
                          </div>
                       </div>
                    </motion.div>
                 ))}
              </div>
           </div>
      </div>
    );
  }

  if (!isMounted) return null;

  return (
    <div className="flex flex-col p-6 md:p-10 space-y-8">
      <header className="flex justify-between items-start mb-8 w-full">
        <div className="space-y-1">
          <h2 className="text-3xl md:text-4xl font-black text-[#0F172A] tracking-tighter uppercase leading-none">
            CONTROL <span className="text-[#2563EB]">CENTER</span>
          </h2>
          <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.3em]">
            Authorized Station Analysis Protocol
          </p>
        </div>

        {(role === "admin" || role === "evaluator") && (
          <button 
            onClick={() => router.push('/quiz')}
            className="bg-[#2563EB] text-white px-6 py-3 rounded-xl font-black text-[10px] tracking-widest uppercase flex items-center gap-3 shadow-[0_12px_35px_rgba(37,99,235,0.25)] hover:bg-[#1E40AF] transition-all active:scale-[0.98] group"
          >
            <Zap size={20} className="group-hover:translate-x-1.5 transition-transform" />
            <span>Initialize Session</span>
          </button>
        )}
      </header>

        <section className="space-y-8">
          {/* Core Telemetry Grid - Primary Display */}
          <div className="flex flex-wrap gap-4 md:gap-6">
            {stats.map((stat, idx) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-[20px] p-3.5 md:p-5 border border-[#E2E8F0] shadow-sm hover:border-[#2563EB]/20 transition-all group overflow-hidden relative min-w-[160px] flex-1 lg:flex-none lg:w-[calc(25%-1.25rem)]"
              >
                <div className="relative z-10 space-y-3">
                  <div className={`p-2.5 w-fit rounded-lg bg-[#F8FAFC] ${stat.color}`}>
                    <stat.icon size={18} strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-xl font-black text-[#0F172A] mb-0.5">{stat.value}</p>
                    <p className="text-[7.5px] font-black text-[#94A3B8] uppercase tracking-widest leading-none">{stat.title}</p>
                  </div>
                </div>
                <div className={`absolute top-0 right-0 w-20 h-20 rounded-full blur-[35px] opacity-[0.03] -mr-6 -mt-6 ${stat.color.replace('text-', 'bg-')}`} />
              </motion.div>
            ))}
          </div>

          {/* Hall of Fame - Global Performance Index */}
          <div className="space-y-8">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-amber-50 rounded-2xl">
                      <Trophy size={24} className="text-amber-500" />
                   </div>
                    <div>
                       <h3 className="text-lg font-black uppercase tracking-tight text-[#0F172A]">Hall of Fame</h3>
                       <p className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-widest">Global Elite Node Benchmarks</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                   <div className="relative">
                       <button 
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="bg-white border border-[#E2E8F0] rounded-xl px-5 py-2.5 min-w-[180px] flex items-center justify-between gap-3 text-[9px] font-black uppercase tracking-widest text-[#0F172A] hover:border-[#2563EB] transition-all shadow-sm hover:shadow-md group"
                      >
                         <span className="truncate">{selectedQuizId === "all" ? "Global Protocols" : attendedQuizzes.find(q => q.id === selectedQuizId)?.title}</span>
                         <ChevronDown size={14} className={`text-[#94A3B8] transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : ""}`} />
                      </button>

                      <AnimatePresence>
                         {isDropdownOpen && (
                           <>
                              <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsDropdownOpen(false)}
                                className="fixed inset-0 z-[80]"
                              />
                              <motion.div 
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute right-0 top-full mt-3 w-72 bg-white border border-[#E2E8F0] rounded-[24px] shadow-2xl p-3 z-[90] overflow-hidden"
                              >
                                 <div className="max-h-[320px] overflow-y-auto custom-scrollbar space-y-1">
                                    <button 
                                      onClick={() => { handleQuizFilter("all"); setIsDropdownOpen(false); }}
                                      className={`w-full text-left px-5 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-between transition-colors ${selectedQuizId === "all" ? "bg-blue-50 text-blue-600" : "hover:bg-slate-50 text-slate-500"}`}
                                    >
                                       <span>Global Protocols</span>
                                       {selectedQuizId === "all" && <Check size={14} />}
                                    </button>
                                    {attendedQuizzes.map(q => (
                                      <button 
                                        key={q.id}
                                        onClick={() => { handleQuizFilter(q.id); setIsDropdownOpen(false); }}
                                        className={`w-full text-left px-5 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-between transition-colors ${selectedQuizId === q.id ? "bg-blue-50 text-blue-600" : "hover:bg-slate-50 text-slate-500"}`}
                                      >
                                         <span className="truncate pr-4">{q.title}</span>
                                         {selectedQuizId === q.id && <Check size={14} />}
                                      </button>
                                    ))}
                                 </div>
                              </motion.div>
                           </>
                         )}
                      </AnimatePresence>
                   </div>

                   <div className="flex -space-x-3 overflow-hidden">
                      {globalLeaderboard.slice(0, 3).map((u, i) => (
                         <div key={i} className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-slate-100 overflow-hidden shadow-sm">
                            <img src={u.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.user_id}`} alt="" />
                         </div>
                       ))}
                    </div>
                 </div>
              </div>
              <div className="bg-white rounded-[32px] border border-[#E2E8F0] shadow-sm overflow-hidden h-fit">
                <div className="divide-y divide-[#F1F5F9]">
                   {leaderboardLoading ? (
                     [1,2,3].map(i => <div key={i} className="h-24 bg-gray-50/50 animate-pulse" />)
                   ) : globalLeaderboard.map((u, i) => (
                     <div key={u.id} className="p-6 md:p-8 flex items-center justify-between transition-all hover:bg-slate-50 group">
                        <div className="flex items-center gap-6">
                           <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm border-2 ${
                             i === 0 ? "bg-amber-50 text-amber-500 border-amber-300" :
                             i === 1 ? "bg-slate-50 text-slate-400 border-slate-200" :
                             i === 2 ? "bg-orange-50 text-orange-600 border-orange-200" :
                             "bg-white text-slate-300 border-slate-100"
                           }`}>
                             {i + 1}
                           </div>
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden shadow-sm border-2 border-white">
                                 <img src={u.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.user_id}`} alt="" className="w-full h-full object-cover" />
                              </div>
                              <div>
                               <p className="text-[13px] font-extrabold text-[#0F172A] uppercase tracking-tight group-hover:text-blue-600 transition-colors leading-none">{u.profiles?.full_name || "Unknown Candidate"}</p>
                                 <div className="flex items-center gap-2 mt-1.5 opacity-60">
                                    <Activity size={10} className="text-blue-500" />
                                    <span className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest leading-none">Qualified Participant</span>
                                 </div>
                              </div>
                           </div>
                        </div>
                        <div className="flex items-center gap-8 text-right">
                           <div className="hidden sm:block">
                              <p className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest leading-none mb-1">Efficiency</p>
                              <p className="text-xs font-black text-[#0F172A]">{u.time_taken || "24"}s</p>
                           </div>
                           <div>
                              <p className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest leading-none mb-1">Score</p>
                               <p className="text-lg font-black text-blue-600">{u.total_score}</p>
                           </div>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        </section>
    </div>
  );
}
