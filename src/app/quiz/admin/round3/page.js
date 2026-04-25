"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { 
  Users, 
  Search,
  CheckCircle2,
  XCircle,
  Loader2,
  UserCheck,
  UserX,
  ArrowRight,
  Filter,
  Trophy,
  BookOpen,
  AlertCircle,
  Star
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Round3SelectionPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMode, setFilterMode] = useState("submitted"); // submitted | selected | all
  const [selectingId, setSelectingId] = useState(null);
  const [toast, setToast] = useState(null);
  
  const supabase = createClient();

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      const mockSession = document.cookie
        .split("; ")
        .find((row) => row.startsWith("mock_session="))
        ?.split("=")[1];
      
      const isMockAdmin = mockSession?.startsWith("admin");
      
      if (!user && !isMockAdmin) {
        router.push("/auth");
        return;
      }

      if (user && !isMockAdmin) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        
        if (profile?.role !== "admin" && profile?.role !== "evaluator") {
          router.push("/");
          return;
        }
      }
      
      loadUsers();
    }
    checkAuth();
  }, []);

  async function loadUsers() {
    setLoading(true);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "candidate")
      .in("round2_status", ["submitted", "selected_round3"]);

    setUsers(profiles || []);
    setLoading(false);
  }

  async function toggleSelection(userId, currentStatus) {
    setSelectingId(userId);
    const newStatus = currentStatus === "selected_round3" ? "submitted" : "selected_round3";
    
    const { error } = await supabase
      .from("profiles")
      .update({ round2_status: newStatus })
      .eq("id", userId);

    if (error) {
      showToast("Failed to update candidate status.", "error");
    } else {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, round2_status: newStatus } : u));
      showToast(
        newStatus === "selected_round3" 
          ? "Candidate advanced to Personal Interview." 
          : "Candidate removed from interview pool.",
        newStatus === "selected_round3" ? "success" : "info"
      );
    }
    setSelectingId(null);
  }

  async function bulkSelectAll() {
    const submittedUsers = users.filter(u => u.round2_status === "submitted");
    if (submittedUsers.length === 0) {
      showToast("No submitted candidates to select.", "info");
      return;
    }

    setLoading(true);
    const results = await Promise.all(
      submittedUsers.map(u => 
        supabase.from("profiles").update({ round2_status: "selected_round3" }).eq("id", u.id)
      )
    );

    const errors = results.filter(r => r.error);
    if (errors.length > 0) {
      showToast(`Failed to update ${errors.length} candidates.`, "error");
    } else {
      showToast(`${submittedUsers.length} candidates advanced to interview.`, "success");
    }
    await loadUsers();
  }

  function showToast(message, type = "info") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    if (filterMode === "submitted") return matchesSearch && u.round2_status === "submitted";
    if (filterMode === "selected") return matchesSearch && u.round2_status === "selected_round3";
    return matchesSearch;
  });

  const selectedCount = users.filter(u => u.round2_status === "selected_round3").length;
  const submittedCount = users.filter(u => u.round2_status === "submitted").length;

  return (
    <div className="p-8 md:p-14 space-y-12">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="px-4 py-1.5 bg-violet-50 text-violet-600 rounded-full text-[10px] font-black uppercase tracking-[0.3em] border border-violet-100 shadow-sm">
              Phase III
            </div>
          </div>
          <h1 className="text-4xl font-black text-[#0F172A] tracking-tighter uppercase leading-none">
            Interview <span className="text-violet-600">Selection</span>
          </h1>
          <p className="text-[11px] font-black text-[#94A3B8] uppercase tracking-[0.4em] mt-2">
            MANUAL CANDIDATE ADVANCEMENT SYSTEM
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
          <div className="bg-white border border-[#E2E8F0] px-4 py-2 rounded-2xl flex items-center gap-3 flex-1 md:flex-none md:min-w-[250px] shadow-sm">
            <Search size={16} className="text-[#94A3B8]" />
            <input 
              type="text" 
              placeholder="Search candidates..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-none text-xs font-bold w-full placeholder:text-[#CBD5E1]"
            />
          </div>
          
          <button 
            onClick={bulkSelectAll}
            className="flex items-center gap-2 bg-violet-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-violet-700 transition-all shadow-lg shadow-violet-100"
          >
            <UserCheck size={14} />
            <span>Select All</span>
          </button>

          <button
            onClick={() => router.push("/quiz/admin/interview")}
            className="flex items-center gap-2 bg-[#0F172A] text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
          >
            <Star size={14} />
            <span>Open Interview Panel</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-[#E2E8F0] p-6 rounded-[28px] shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-50 text-[#2563EB] rounded-2xl flex items-center justify-center">
            <BookOpen size={20} />
          </div>
          <div>
            <p className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest">Research Submitted</p>
            <h3 className="text-xl font-black text-[#0F172A]">{submittedCount} Candidates</h3>
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] p-6 rounded-[28px] shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 bg-violet-50 text-violet-600 rounded-2xl flex items-center justify-center">
            <UserCheck size={20} />
          </div>
          <div>
            <p className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest">Selected for Interview</p>
            <h3 className="text-xl font-black text-violet-600">{selectedCount} Candidates</h3>
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] p-6 rounded-[28px] shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
            <Trophy size={20} />
          </div>
          <div>
            <p className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest">Total Pipeline</p>
            <h3 className="text-xl font-black text-[#0F172A]">{users.length} Total</h3>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 bg-white border border-[#E2E8F0] p-1.5 rounded-2xl w-fit shadow-sm">
        {[
          { key: "submitted", label: "Pending Review", count: submittedCount },
          { key: "selected", label: "Selected", count: selectedCount },
          { key: "all", label: "All", count: users.length }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilterMode(tab.key)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
              filterMode === tab.key 
                ? "bg-[#0F172A] text-white shadow-lg" 
                : "text-[#94A3B8] hover:text-[#0F172A] hover:bg-slate-50"
            }`}
          >
            <span>{tab.label}</span>
            <span className={`px-1.5 py-0.5 rounded-md text-[8px] ${
              filterMode === tab.key ? "bg-white/20" : "bg-slate-100"
            }`}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Candidates Grid */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-20">
            <Loader2 size={40} className="animate-spin text-violet-600" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em]">Loading Candidates</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="bg-white border border-dashed border-[#E2E8F0] rounded-[32px] p-20 text-center">
            <Users size={48} className="mx-auto text-[#CBD5E1] mb-4" />
            <p className="text-sm font-bold text-[#64748B]">No candidates found in this filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredUsers.map((user, i) => {
              const isSelected = user.round2_status === "selected_round3";
              let research = { overview: "", gaps: "", application: "", future: "" };
              try {
                if (user.round2_content) {
                  research = typeof user.round2_content === 'string' 
                    ? JSON.parse(user.round2_content) 
                    : user.round2_content;
                }
              } catch (e) { /* fallback */ }

              return (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`bg-white border-2 rounded-[28px] p-6 transition-all hover:shadow-xl group relative overflow-hidden ${
                    isSelected 
                      ? "border-violet-200 shadow-lg shadow-violet-50" 
                      : "border-[#E2E8F0] shadow-sm hover:border-blue-100"
                  }`}
                >
                  {/* Selection Indicator */}
                  {isSelected && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 to-indigo-500" />
                  )}

                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shadow-lg ${
                        isSelected 
                          ? "bg-violet-600 text-white shadow-violet-200" 
                          : "bg-[#0F172A] text-white shadow-slate-200"
                      }`}>
                        {user.full_name?.[0] || "U"}
                      </div>
                      <div>
                        <p className="text-sm font-black text-[#0F172A] leading-tight">{user.full_name}</p>
                        <p className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest mt-0.5">{user.email}</p>
                      </div>
                    </div>
                    
                    <span className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                      isSelected 
                        ? "bg-violet-50 text-violet-600 border-violet-100" 
                        : "bg-blue-50 text-blue-600 border-blue-100"
                    }`}>
                      {isSelected ? "SELECTED" : "SUBMITTED"}
                    </span>
                  </div>

                  {/* Research Preview */}
                  {user.round2_topic && (
                    <div className="mb-4 bg-[#F8FAFC] border border-[#F1F5F9] rounded-2xl p-4">
                      <p className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest mb-1">Research Topic</p>
                      <p className="text-xs font-bold text-[#2563EB] leading-relaxed line-clamp-2">{user.round2_topic}</p>
                    </div>
                  )}

                  {/* Research Stats */}
                  <div className="grid grid-cols-4 gap-2 mb-5">
                    {[
                      { label: "OVR", chars: research.overview?.length || 0 },
                      { label: "GAP", chars: research.gaps?.length || 0 },
                      { label: "APP", chars: research.application?.length || 0 },
                      { label: "FUT", chars: research.future?.length || 0 }
                    ].map(stat => (
                      <div key={stat.label} className="bg-[#F8FAFC] border border-[#F1F5F9] rounded-xl p-2 text-center">
                        <p className="text-[7px] font-black text-[#94A3B8] uppercase tracking-widest">{stat.label}</p>
                        <p className="text-[10px] font-black text-[#0F172A] mt-0.5">{(stat.chars / 1000).toFixed(1)}k</p>
                      </div>
                    ))}
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => toggleSelection(user.id, user.round2_status)}
                    disabled={selectingId === user.id}
                    className={`w-full py-3 rounded-xl font-black text-[10px] tracking-[0.2em] uppercase transition-all flex items-center justify-center gap-2 active:scale-[0.97] ${
                      isSelected 
                        ? "bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100" 
                        : "bg-violet-600 text-white hover:bg-violet-700 shadow-lg shadow-violet-100"
                    }`}
                  >
                    {selectingId === user.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : isSelected ? (
                      <>
                        <UserX size={14} />
                        <span>Remove from Interview</span>
                      </>
                    ) : (
                      <>
                        <UserCheck size={14} />
                        <span>Select for Interview</span>
                      </>
                    )}
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Toast */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] w-full max-w-xl px-6 pointer-events-none">
        <AnimatePresence>
          {toast && (
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.9 }}
              className={`pointer-events-auto p-6 rounded-[24px] flex items-center gap-4 shadow-2xl border-2 ${
                toast.type === "success" 
                  ? "bg-white border-emerald-100 text-emerald-600" 
                  : toast.type === "error"
                  ? "bg-white border-rose-100 text-rose-600"
                  : "bg-white border-blue-100 text-blue-600"
              }`}
            >
              {toast.type === "success" ? <CheckCircle2 size={20} /> : 
               toast.type === "error" ? <AlertCircle size={20} /> : 
               <AlertCircle size={20} />}
              <p className="text-sm font-black uppercase tracking-wide">{toast.message}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
