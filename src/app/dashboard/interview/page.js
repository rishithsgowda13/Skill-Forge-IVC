"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { 
  Star, 
  Sparkles, 
  Award, 
  ShieldCheck, 
  Activity,
  Trophy,
  Loader2,
  AlertCircle
} from "lucide-react";
import { motion } from "framer-motion";
import RadarChart from "@/components/charts/RadarChart";

export default function CandidateInterviewPage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        
        let userEmail = user?.email;
        let userId = user?.id;

        if (!user) {
          const cookies = document.cookie.split(';');
          const sessionCookie = cookies.find(c => c.trim().startsWith('mock_session='));
          if (sessionCookie) {
            const val = sessionCookie.split('=')[1];
            const [role, id] = val.split(':');
            if (id && id.includes('@')) {
              userEmail = id;
            } else {
              userEmail = id; // Sometimes id is just a string, but let's allow it
            }
          }
        }

        if (!userEmail && !userId) {
          router.push("/login");
          return;
        }

        let prof = null;
        
        if (userId) {
          const { data } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .single();
          prof = data;
        } else if (userEmail) {
          const { data } = await supabase
            .from("profiles")
            .select("*")
            .eq("email", userEmail)
            .single();
          prof = data;
        }
        
        if (userEmail) {
          const { data: regProf } = await supabase
            .from("member_registry")
            .select("*")
            .eq("email", userEmail)
            .single();
            
          if (regProf) {
            if (!prof) {
              prof = regProf;
            } else {
              if (!prof.full_name) prof.full_name = regProf.full_name;
              
              // Merge skill profile if missing in profiles table but exists in registry
              const hasProfSkills = prof.skill_profile && prof.skill_profile !== "[]" && prof.skill_profile.length > 0;
              const hasRegSkills = regProf.skill_profile && regProf.skill_profile !== "[]" && regProf.skill_profile.length > 0;
              
              if (!hasProfSkills && hasRegSkills) {
                prof.skill_profile = regProf.skill_profile;
              }
              
              if (!prof.round2_status && regProf.round2_status) {
                prof.round2_status = regProf.round2_status;
              }
            }
          }
        }
        
        setProfile(prof);
      } catch (err) {
        console.error("Critical sync failure in interview node:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 opacity-20">
        <Loader2 size={36} className="animate-spin text-violet-600" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em]">Synchronizing Assessment Data</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-8 md:p-14 flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
          <ShieldCheck size={40} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-[#0F172A] uppercase tracking-tighter">Profile Not Found</h2>
          <p className="text-sm font-bold text-[#64748B] max-w-md">
            We could not synchronize your identity protocol. Please contact administration.
          </p>
        </div>
      </div>
    );
  }

  const isAdvanced = profile.round2_status === "selected_round3";

  let skills = [];
  try {
    const parsed = typeof profile.skill_profile === "string" 
      ? JSON.parse(profile.skill_profile) 
      : (profile.skill_profile || []);
    skills = (parsed || []).filter(s => s.skill && s.rating > 0);
  } catch (e) {
    skills = [];
  }

  const avgRating = skills.length 
    ? (skills.reduce((a, b) => a + b.rating, 0) / skills.length).toFixed(1) 
    : "0.0";

  return (
    <div className="p-8 md:p-14 space-y-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="px-3 py-1 bg-violet-50 text-violet-700 rounded-full text-[10px] font-black uppercase tracking-[0.3em] border border-violet-200 flex items-center gap-1.5 shadow-sm">
              <Sparkles size={11} /> Phase III Protocol
            </div>
          </div>
          <h1 className="text-4xl font-black text-[#0F172A] tracking-tighter uppercase leading-none">
            Skill <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">Profile</span>
          </h1>
          <div className="flex flex-col gap-2 mt-2">
            <p className="text-[11px] font-black text-[#94A3B8] uppercase tracking-[0.4em]">
              Assessment Results · Competency Map · Performance Metrics
            </p>
            {!isAdvanced && (
              <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-2">
                <AlertCircle size={12} /> Awaiting advancement to Phase III for detailed profiling
              </p>
            )}
          </div>
        </div>
        
        <div className={`flex items-center gap-4 px-6 py-4 rounded-[28px] border-2 shadow-xl ${
          parseFloat(avgRating) >= 4 ? "bg-emerald-50 border-emerald-100 text-emerald-700" :
          parseFloat(avgRating) >= 2.5 ? "bg-amber-50 border-amber-100 text-amber-700" :
          "bg-white border-[#E2E8F0] text-[#0F172A]"
        }`}>
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Aggregate Score</span>
            <span className="text-3xl font-black tabular-nums">{avgRating}</span>
          </div>
          <div className="w-px h-10 bg-current opacity-20" />
          <Star size={32} className={parseFloat(avgRating) > 0 ? "fill-current" : "opacity-20"} />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Radar Chart Section */}
        <div className="lg:col-span-2 bg-white border-2 border-[#E2E8F0] rounded-[40px] p-8 md:p-12 shadow-sm space-y-10">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-xl font-black text-[#0F172A] uppercase tracking-tighter">Competency Matrix</h3>
              <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">Multi-Dimensional Performance Analysis</p>
            </div>
            <div className="px-4 py-2 bg-[#F8FAFC] border border-[#F1F5F9] rounded-xl flex items-center gap-2">
              <Activity size={14} className="text-violet-600" />
              <span className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest">{skills.length} Evaluated Nodes</span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="bg-[#F8FAFC] p-8 rounded-[40px] border border-[#F1F5F9] shadow-inner">
              <RadarChart skills={skills} size={320} showLabels={true} />
            </div>
            <div className="flex-1 space-y-6 w-full">
              <h4 className="text-[11px] font-black text-[#0F172A] uppercase tracking-[0.2em] mb-4">Evaluator Insights</h4>
              <div className="space-y-5">
                {skills.length === 0 ? (
                  <div className="py-10 text-center space-y-3 opacity-40">
                    <AlertCircle size={32} className="mx-auto" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Awaiting assessment synchronization...</p>
                  </div>
                ) : (
                  skills.map((s, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-violet-600" />
                          <span className="text-xs font-black text-[#0F172A] uppercase tracking-tight">{s.skill}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, idx) => (
                            <Star 
                              key={idx} 
                              size={10} 
                              className={idx < s.rating ? "text-amber-400 fill-amber-400" : "text-slate-200"} 
                            />
                          ))}
                        </div>
                      </div>
                      <div className="h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${s.rating * 20}%` }}
                          transition={{ delay: i * 0.1 + 0.5, duration: 1 }}
                          className="h-full bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full"
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-8">
          <div className="bg-[#0F172A] rounded-[40px] p-8 text-white shadow-2xl relative overflow-hidden">
             <div className="relative z-10 space-y-6">
                <div className="space-y-1">
                   <h3 className="text-xl font-black uppercase tracking-tighter">Evaluation Status</h3>
                   <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Phase III Progress Log</p>
                </div>
                
                <div className="space-y-4">
                  <div className="p-5 bg-white/5 border border-white/10 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Protocol</span>
                      <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Active</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Evaluator</span>
                      <span className="text-[9px] font-black text-white uppercase tracking-widest font-mono">NODE_ADMIN_ALPHA</span>
                    </div>
                  </div>

                  <div className="p-5 bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-white/10 rounded-2xl">
                    <div className="flex items-center gap-3 mb-3">
                       <Trophy size={18} className="text-amber-400" />
                       <span className="text-[10px] font-black uppercase tracking-widest">Rank Assignment</span>
                    </div>
                    <p className="text-sm font-bold text-white/90 leading-tight">
                      Your skill profile has been synchronized. Mastery ranks will be updated upon protocol completion.
                    </p>
                  </div>
                </div>

                <div className="pt-4">
                   <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-[0.2em] text-white/40 mb-2">
                      <span>SYNC STATUS</span>
                      <span>100%</span>
                   </div>
                   <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full w-full bg-emerald-500" />
                   </div>
                </div>
             </div>
             <ShieldCheck size={180} className="absolute -bottom-10 -right-10 text-white/5" />
          </div>

          <div className="bg-white border-2 border-[#E2E8F0] rounded-[40px] p-8 shadow-sm">
             <div className="flex items-center gap-3 mb-6">
                <Award size={20} className="text-violet-600" />
                <h3 className="text-[11px] font-black text-[#0F172A] uppercase tracking-[0.2em]">Next Steps</h3>
             </div>
             <div className="space-y-4">
                {[
                  { text: "Attend scheduled interview", done: true },
                  { text: "Verify skill assessment", done: true },
                  { text: "Await final selection", done: false },
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${step.done ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-300"}`}>
                      {step.done ? <ShieldCheck size={10} /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                    </div>
                    <span className={`text-xs font-bold ${step.done ? "text-[#0F172A]" : "text-[#94A3B8]"} leading-tight`}>{step.text}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
