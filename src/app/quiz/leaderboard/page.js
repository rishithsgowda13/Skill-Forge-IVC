"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import Sidebar from "@/components/layout/Sidebar";
import { 
  Trophy, 
  Medal, 
  Clock, 
  Search, 
  Filter, 
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Circle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function LeaderboardPage() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchLeaderboard = async () => {
    const { data } = await supabase
      .from("submissions")
      .select("*, profiles!user_id(full_name, avatar_url)")
      .order("total_score", { ascending: false })
      .order("time_taken", { ascending: true })
      .limit(50);
    
    setSubmissions(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchLeaderboard();
    const channel = supabase
      .channel("shared-leaderboard")
      .on("postgres_changes", { event: "*", schema: "public", table: "submissions" }, () => {
        fetchLeaderboard();
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  return (
    <div className="min-h-screen bg-page-bg flex font-sans">
      <Sidebar />

      <main className="flex-1 ml-[240px] p-10 space-y-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">Global Ranking</h1>
            <p className="text-meta">HALL OF FAME & PERFORMANCE BENCHMARKS</p>
          </motion.div>
          
          <div className="flex items-center gap-4">
            <div className="glass-morphism bg-white px-3 py-2 rounded-inner border border-card-border shadow-subtle flex items-center gap-3">
              <Search size={16} className="text-text-meta" />
              <input 
                type="text" 
                placeholder="Find challenger..." 
                className="bg-transparent border-none outline-none text-xs font-semibold placeholder:text-text-meta w-48"
              />
            </div>
            <button className="bg-white p-2 rounded-inner border border-card-border shadow-subtle transition-all hover:bg-nav-hover group">
              <Filter size={18} className="text-text-secondary group-hover:text-primary-blue transition-colors" />
            </button>
          </div>
        </div>

        {/* Top 3 Metric Cards */}
        <div className="grid grid-cols-3 gap-8">
          {[
            { label: "Elite Participants", value: "256", icon: TrendingUp, color: "text-primary-blue" },
            { label: "High Score Avg.", value: "98.4", icon: Medal, color: "text-warning-amber" },
            { label: "Fastest Solution", value: "4m 12s", icon: Clock, color: "text-success-green" }
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="dashboard-card flex items-center justify-between group cursor-default hover:border-primary-blue/30 transition-all"
            >
              <div className="space-y-1">
                <p className="text-meta">{stat.label}</p>
                <div className="flex items-center gap-3">
                  <h3 className="text-metric leading-tight">{stat.value}</h3>
                  <div className={`w-8 h-8 rounded-inner bg-gray-50 flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform`}>
                    <stat.icon size={18} />
                  </div>
                </div>
              </div>
              <ChevronDown size={20} className="text-text-meta opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.div>
          ))}
        </div>

        {/* Leaderboard Table Container */}
        <div className="dashboard-card space-y-8 min-h-[400px]">
          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-3">
              <Trophy size={20} className="text-primary-blue" />
              <h3 className="text-section-header">Performance Index</h3>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold text-text-meta uppercase tracking-widest">
              <span>Points Earned</span>
              <span>Efficiency Index</span>
            </div>
          </div>

          <div className="space-y-8 pt-2">
            <AnimatePresence mode="popLayout">
              {loading ? (
                <div className="py-20 flex justify-center w-full">
                  <div className="w-8 h-8 border-4 border-primary-blue/20 border-t-primary-blue rounded-full animate-spin" />
                </div>
              ) : submissions.map((item, index) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="space-y-3 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Rank Pillar */}
                      <div className={`w-10 h-10 rounded-inner flex items-center justify-center font-black text-sm border shadow-subtle ${
                        index === 0 ? "bg-[#EFF6FF] text-[#2563EB] border-[#2563EB]/20" :
                        index === 1 ? "bg-emerald-50 text-emerald-600 border-emerald-600/20" :
                        index === 2 ? "bg-amber-50 text-amber-600 border-amber-600/20" :
                        "bg-white text-text-secondary border-card-border"
                      }`}>
                        {index + 1}
                      </div>

                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-xs border border-white shadow-subtle overflow-hidden`}>
                          <img 
                            src={item.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.user_id}`} 
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-text-primary leading-tight group-hover:text-primary-blue transition-colors">
                            {item.profiles?.full_name || "Anonymous Challenger"}
                          </p>
                          <p className="text-[11px] text-text-secondary font-medium tracking-tight">QUIZ ATTEMPT #{item.id.slice(0, 4)}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-12">
                      <div className="flex flex-col items-end">
                        <span className="text-lg font-black text-text-primary">{item.total_score}</span>
                        <div className="flex items-center gap-1">
                          <Circle size={4} fill="#2563EB" className="text-primary-blue" />
                          <span className="text-[10px] font-bold text-primary-blue">QUALIFIED</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Utilization Progress Bar */}
                  <div className="utilization-bar-bg">
                    <motion.div 
                      initial={{ width: 0 }} 
                      animate={{ width: `${Math.min(item.total_score / 15, 100)}%` }} 
                      className="utilization-bar-fill shadow-[0_2px_4px_rgba(59,63,216,0.2)]" 
                    />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="pt-8 text-center">
            <button className="text-[11px] font-black text-text-meta uppercase tracking-[0.2em] hover:text-primary-blue transition-colors flex items-center justify-center gap-2 mx-auto">
              SEE EXTENDED RANKINGS <ChevronRight size={14} strokeWidth={3} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
