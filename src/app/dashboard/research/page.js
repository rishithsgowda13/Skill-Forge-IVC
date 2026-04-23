"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase";
import Sidebar from "@/components/layout/Sidebar";
import { 
  BookOpen, 
  AlertCircle, 
  CheckCircle2, 
  Info,
  Send,
  Loader2,
  Copy,
  LayoutDashboard,
  ShieldCheck,
  Zap,
  Clock,
  ArrowRight,
  Lock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

export default function ResearchPage() {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState(null);
  const [researchContent, setResearchContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [pastingField, setPastingField] = useState(null);

  const textareaRef = useRef(null);

  const DEFAULT_TOPIC = "ADVANCED RESEARCH & SYNTHESIS PROTOCOL";
  const PASTE_LIMIT = 100;

  const RESEARCH_BLOCKS = [
    { id: 'overview', label: 'Research Overview', min: 10000, placeholder: 'Provide a comprehensive overview of your research findings...' },
    { id: 'gaps', label: 'Gaps & Limitations', min: 6000, placeholder: 'Identify critical gaps and technical limitations in current implementations...' },
    { id: 'application', label: 'Real-world Application', min: 6000, placeholder: 'Describe how this research translates to tactical or industrial applications...' },
    { id: 'future', label: 'Future Enhancements', min: 6000, placeholder: 'Outline potential future developments and scalability vectors...' }
  ];

  const [researchData, setResearchData] = useState({
    overview: "",
    gaps: "",
    application: "",
    future: ""
  });

  useEffect(() => {
    async function loadProfile() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        router.push("/auth");
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single();

      setProfile(profileData || { id: authUser.id, round2_topic: DEFAULT_TOPIC });
      if (profileData?.round2_content) {
        try {
          const parsed = typeof profileData.round2_content === 'string' 
            ? JSON.parse(profileData.round2_content) 
            : profileData.round2_content;
          setResearchData(prev => ({ ...prev, ...parsed }));
        } catch (e) {
          setResearchData(prev => ({ ...prev, overview: profileData.round2_content }));
        }
      }
      setLoading(false);
    }
    loadProfile();
  }, []);

  const handleFieldChange = (id, value) => {
    // Detect whitespace violation
    if (/\s{6,}/.test(value)) {
      setError("SYSTEM ALERT: YOU CANNOT ENTER MORE THAN FIVE SPACES SIMULTANEOUSLY.");
      setTimeout(() => setError(null), 3000);
      
      // Sanitize and continue
      const sanitizedValue = value.replace(/\s{6,}/g, (match) => match.slice(0, 5));
      setResearchData(prev => ({ ...prev, [id]: sanitizedValue }));
      return;
    }
    
    setResearchData(prev => ({ ...prev, [id]: value }));
  };

  const handlePaste = (e, blockId) => {
    const pastedText = e.clipboardData.getData("text");
    if (pastedText.length > PASTE_LIMIT) {
       e.preventDefault();
       setPastingField(blockId);
       setError("you cannot paste more than 100 characters at a time");
       setTimeout(() => {
         setError(null);
         setPastingField(null);
       }, 5000);
    }
  };

  const handleSubmit = async () => {
    const missing = RESEARCH_BLOCKS.filter(block => researchData[block.id].length < block.min);
    
    if (missing.length > 0) {
      setError(`INCOMPLETE PROTOCOL: The following blocks do not meet requirements: ${missing.map(m => m.label).join(', ')}`);
      return;
    }

    setSubmitting(true);
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ 
        round2_content: JSON.stringify(researchData),
        round2_status: 'submitted',
        round2_topic: profile?.round2_topic || DEFAULT_TOPIC
      })
      .eq("id", profile.id);

    if (updateError) {
      setError("Submission failed. Please try again.");
    } else {
      setSuccess(true);
      setProfile({ ...profile, round2_status: 'submitted' });
    }
    setSubmitting(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-page-bg flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-primary-blue" />
    </div>
  );

  const totalChars = Object.values(researchData).reduce((acc, val) => acc + val.length, 0);
  const requiredChars = RESEARCH_BLOCKS.reduce((acc, val) => acc + val.min, 0);
  const isProtocolComplete = RESEARCH_BLOCKS.every(block => researchData[block.id].length >= block.min);

  return (
    <div className="p-8 md:p-14 space-y-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-[#F1F5F9] pb-10">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="px-4 py-1.5 bg-blue-50 text-[#2563EB] rounded-full text-[10px] font-black uppercase tracking-[0.3em] border border-blue-100 shadow-sm">
               Phase II Protocol
             </div>
             {profile?.round2_status === 'submitted' && (
                <div className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-[0.3em] border border-emerald-100 shadow-sm flex items-center gap-2">
                   <CheckCircle2 size={12} />
                   <span>SYNCED</span>
                </div>
             )}
          </div>
          <h1 className="text-5xl font-black text-[#0F172A] uppercase leading-none max-w-2xl">
            SECONDARY RESEARCH
          </h1>
          <div className="flex flex-col gap-2">
             <span className="text-[9px] font-black text-[#94A3B8] uppercase tracking-[0.4em]">ALLOCATED TOPIC</span>
             <h2 className="text-xl font-bold text-[#2563EB] leading-tight max-w-3xl">
               {profile?.round2_topic || "Why is this not soo good"}
             </h2>
          </div>
        </div>

        <div className="flex items-center gap-6">
           <div className="bg-white border border-[#E2E8F0] px-8 py-4 rounded-[24px] shadow-sm flex flex-col items-center min-w-[140px]">
              <span className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest mb-1">Total Progress</span>
              <span className="text-2xl font-black text-[#0F172A] tabular-nums">{Math.floor((totalChars / requiredChars) * 100)}%</span>
           </div>
           <div className="bg-[#0F172A] text-white px-8 py-4 rounded-[24px] shadow-2xl flex flex-col items-center min-w-[140px]">
              <span className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">Target Aggregate</span>
              <span className="text-2xl font-black tabular-nums">{requiredChars.toLocaleString()}</span>
           </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto space-y-12 pb-20">
        <div className="space-y-12">
          {/* Colourfull Rules of Engagement - Horizontal Layout */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-6 rounded-[32px] grid grid-cols-1 md:grid-cols-4 gap-6 shadow-sm">
            {[
              { icon: Zap, text: "Aggregate target: 28,000 characters.", color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-100" },
              { icon: BookOpen, text: "Overview block: 10,000 character minimum.", color: "text-blue-500", bg: "bg-blue-50", border: "border-blue-100" },
              { icon: Copy, text: "Paste restriction: Max 100 chars per action.", color: "text-indigo-500", bg: "bg-indigo-50", border: "border-indigo-100" },
              { icon: Clock, text: "Commit once all protocols are green.", color: "text-emerald-500", bg: "bg-emerald-50", border: "border-emerald-100" }
            ].map((rule, i) => (
              <div key={i} className="flex items-center gap-4 group transition-all hover:scale-[1.02]">
                <div className={`w-10 h-10 ${rule.bg} border ${rule.border} rounded-xl flex-shrink-0 flex items-center justify-center ${rule.color} shadow-sm transition-transform group-hover:rotate-6`}>
                  <rule.icon size={16} />
                </div>
                <span className="text-[10px] font-black text-[#64748B] uppercase tracking-wide leading-tight group-hover:text-[#0F172A] transition-colors">{rule.text}</span>
              </div>
            ))}
          </div>

          {RESEARCH_BLOCKS.map((block) => (
            <div key={block.id} className="space-y-4">
               <div className="flex justify-between items-end px-2">
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[#0F172A]">{block.label}</h3>
                  <div className="text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                     <span className={researchData[block.id].length >= block.min ? "text-emerald-500" : "text-amber-500"}>
                        {researchData[block.id].length.toLocaleString()}
                     </span>
                     <span className="text-slate-300">/</span>
                     <span className="text-slate-400">{block.min.toLocaleString()} MIN</span>
                  </div>
               </div>
               <div className="relative group">
                  <textarea
                    value={researchData[block.id]}
                    onChange={(e) => handleFieldChange(block.id, e.target.value)}
                    onPaste={(e) => handlePaste(e, block.id)}
                    disabled={profile?.round2_status === 'submitted' || success}
                    placeholder={block.placeholder}
                    className="w-full bg-white border-2 border-[#F1F5F9] rounded-[24px] p-8 min-h-[300px] text-lg font-medium leading-relaxed focus:outline-none focus:border-[#2563EB]/30 focus:ring-4 focus:ring-blue-50 transition-all placeholder:text-[#CBD5E1] shadow-sm selection:bg-blue-100 resize-none"
                  />
                  
                  <AnimatePresence>
                    {error && pastingField === block.id && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        className="absolute inset-0 z-50 bg-white/90 backdrop-blur-sm rounded-[24px] flex flex-col items-center justify-center text-center p-8 border-2 border-rose-100 shadow-xl"
                      >
                         <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mb-4 text-rose-500">
                            <AlertCircle size={32} className="animate-pulse" />
                         </div>
                         <h4 className="text-sm font-black uppercase tracking-[0.2em] text-rose-600 mb-1">Security Protocol</h4>
                         <p className="text-xl font-black text-[#0F172A] uppercase tracking-tight leading-tight max-w-xs">{error}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="absolute bottom-4 left-6 right-6 h-1 bg-slate-50 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((researchData[block.id].length / block.min) * 100, 100)}%` }}
                      className={`h-full rounded-full ${researchData[block.id].length >= block.min ? "bg-emerald-500" : "bg-[#2563EB]"}`}
                    />
                  </div>
               </div>
            </div>
          ))}

          {/* Minimized Action Node - Bottom Layout */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-6 rounded-[32px] space-y-6 mt-12 max-w-lg mx-auto text-center shadow-sm">
            <div className="flex items-center justify-center gap-4">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-[#2563EB] border border-blue-100">
                <ShieldCheck size={20} />
              </div>
              <div className="text-left">
                <h4 className="text-sm font-black uppercase tracking-[0.2em] text-[#0F172A]">Action Node</h4>
                <p className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest">Protocol Finalization Unit</p>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E2E8F0]">
              <button
                onClick={handleSubmit}
                disabled={submitting || profile?.round2_status === 'submitted' || success || !isProtocolComplete}
                className={`w-full py-4 rounded-xl font-black text-[10px] tracking-[0.3em] uppercase transition-all flex items-center justify-center gap-3 shadow-lg active:scale-95 ${
                  profile?.round2_status === 'submitted' || success
                  ? "bg-emerald-500 text-white cursor-not-allowed"
                  : !isProtocolComplete
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                  : "bg-[#2563EB] text-white hover:bg-blue-600 shadow-blue-200"
                }`}
              >
                {submitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : profile?.round2_status === 'submitted' || success ? (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Submission Sync Complete</span>
                  </>
                ) : !isProtocolComplete ? (
                  <>
                    <Lock size={14} />
                    <span>Protocol Incomplete</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>Execute Final Commit</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Fixed Notifications Overlay */}
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[100] w-full max-w-xl px-6 pointer-events-none">
          <AnimatePresence>
            {error && !pastingField && (
              <motion.div 
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 50, scale: 0.9 }}
                className="bg-white border-2 border-rose-100 shadow-[0_30px_60px_-15px_rgba(225,29,72,0.3)] p-8 rounded-[32px] flex items-center gap-6 text-rose-600 pointer-events-auto mb-4"
              >
                <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <AlertCircle size={28} className="animate-pulse" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-1">Security Alert</span>
                  <p className="text-lg font-black uppercase tracking-tight leading-none text-[#0F172A]">{error}</p>
                </div>
              </motion.div>
            )}
            
            {success && (
              <motion.div 
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="bg-white border-2 border-emerald-100 shadow-[0_30px_60px_-15px_rgba(16,185,129,0.3)] p-8 rounded-[32px] flex items-center gap-6 text-emerald-600 pointer-events-auto"
              >
                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 size={28} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-1">Success Protocol</span>
                  <p className="text-lg font-black uppercase tracking-tight leading-none text-[#0F172A]">RESEARCH COMMITTED SUCCESSFULLY</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
