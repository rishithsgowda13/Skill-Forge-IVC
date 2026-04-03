"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import Sidebar from "@/components/layout/Sidebar";
import { 
  FileText, 
  Send, 
  ChevronRight, 
  AlertCircle,
  Zap,
  Lock,
  Clock,
  History,
  LayoutDashboard
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

export default function SubmitReportPage() {
  const [session, setSession] = useState(null);
  const [report, setReport] = useState("");
  const [status, setStatus] = useState("idle");
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      const hasMockSession = document.cookie.includes("mock_session=");
      if (!user && !hasMockSession) router.push("/login");
      setSession(user || { id: "mock_user", email: "candidate@skillforge.io" });
    }
    checkAuth();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!report.trim()) return;
    
    setStatus("submitting");
    // In a real app, save to 'reports' table. For now, mock success.
    setTimeout(() => {
      setStatus("success");
      setReport("");
      setTimeout(() => setStatus("idle"), 3000);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-black">
      <Sidebar />

      <main className="flex-1 ml-[240px] lg:ml-[280px] p-6 md:p-14 space-y-10 min-h-screen flex flex-col">
        <header className="space-y-1">
          <h1 className="text-4xl font-extrabold text-[#0F172A] tracking-tighter">Submit <span className="text-[#2563EB]">Protocol Report</span></h1>
          <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.3em]">Authorized Node Intelligence Submission</p>
        </header>

        <div className="flex-1 bg-white rounded-[40px] border border-[#E2E8F0] shadow-sm p-8 md:p-12 flex flex-col relative overflow-hidden">
          <div className="flex items-center gap-4 mb-10 relative z-10">
            <div className="w-12 h-12 bg-[#F1F5F9] rounded-2xl flex items-center justify-center border border-[#E2E8F0]">
              <FileText className="text-[#2563EB] w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight text-[#0F172A]">Technical Intelligence Log</h3>
              <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Detail your findings or session feedback below</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-8 relative z-10">
            <div className="flex-1 relative group">
              <textarea
                value={report}
                onChange={(e) => setReport(e.target.value)}
                placeholder="Initialize report payload..."
                className="w-full h-full min-h-[300px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-[32px] p-8 text-sm font-bold text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-[#94A3B8] resize-none scrollbar-thin scrollbar-thumb-gray-200"
              />
              <div className="absolute top-6 left-6 opacity-5 pointer-events-none">
                 <History size={200} className="text-[#2563EB]" />
              </div>
            </div>

            <div className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-6 opacity-60">
                 <div className="flex items-center gap-2">
                    <Zap size={14} className="text-[#2563EB]" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Instant Sync</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <Lock size={14} className="text-[#10B981]" />
                    <span className="text-[9px] font-black uppercase tracking-widest">End-to-End Secure</span>
                 </div>
              </div>

              <button
                type="submit"
                disabled={status === "submitting" || !report.trim()}
                className="bg-[#2563EB] text-white px-12 py-5 rounded-2xl font-black text-xs tracking-[0.2em] uppercase shadow-[0_15px_30px_rgba(37,99,235,0.25)] hover:bg-[#1E40AF] transition-all active:scale-[0.98] flex items-center gap-4 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {status === "submitting" ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{status === "success" ? "Payload Synchronized" : "Execute Submission"}</span>
                    <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>

          <AnimatePresence>
            {status === "success" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute inset-0 bg-white/95 backdrop-blur-md z-50 flex flex-col items-center justify-center text-center p-10"
              >
                <div className="w-24 h-24 bg-green-50 rounded-[40px] flex items-center justify-center mb-8 relative">
                   <div className="absolute inset-0 bg-green-200/30 rounded-full animate-ping" />
                   <Send className="text-green-500 w-10 h-10 relative z-10" />
                </div>
                <h3 className="text-2xl font-black text-[#0F172A] mb-2 uppercase tracking-tighter">Transmission Successful</h3>
                <p className="text-[11px] font-black text-[#94A3B8] uppercase tracking-[0.3em] mb-10">Data node has been archived in central registry</p>
                <button 
                  onClick={() => setStatus("idle")} 
                  className="text-[10px] font-black text-[#2563EB] uppercase tracking-widest hover:underline"
                >
                  Create New Protocol Intelligence Log
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
