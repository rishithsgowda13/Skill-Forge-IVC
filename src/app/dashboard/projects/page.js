"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Activity, 
  Clock, 
  Calendar, 
  Users, 
  MessageSquare, 
  Send, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  FileText,
  ChevronRight,
  ArrowLeft,
  Briefcase,
  Target
} from "lucide-react";
import ProjectChat from "@/components/projects/ProjectChat";
import { createClient } from "@/lib/supabase";

export default function CandidateProjectsPage() {
  const supabase = createClient();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const [profile, setProfile] = useState(null);
  const [updateText, setUpdateText] = useState("");

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      let email = "";
      
      if (user) {
        email = user.email;
      } else {
        const cookies = document.cookie.split(';');
        const sessionCookie = cookies.find(c => c.trim().startsWith('mock_session='));
        if (sessionCookie) {
          const val = sessionCookie.split('=')[1];
          email = val.split(':')[1] || "candidate@test.com";
        }
      }

      if (email) {
        setUserEmail(email);
        
        // Fetch Profile from both sources
        let { data: prof } = await supabase.from('profiles').select('*').eq('email', email).single();
        const { data: regProf } = await supabase.from('member_registry').select('*').eq('email', email).single();
        
        if (regProf) {
          if (!prof) prof = regProf;
          else if (!prof.full_name) prof.full_name = regProf.full_name;
        }
        
        setProfile(prof);
        fetchUserProjects(email);
      }
    }
    init();
  }, []);

  async function fetchUserProjects(email) {
    setLoading(true);
    const { data: projData } = await supabase
      .from('projects')
      .select('*');
    
    // Filter projects where user is in team
    const myProjs = (projData || []).filter(p => {
      try {
        const team = Array.isArray(p.team) ? p.team : (typeof p.team === 'string' ? JSON.parse(p.team) : []);
        return team.some(m => m.email === email);
      } catch { return false; }
    });

    setProjects(myProjs);
    setLoading(false);
  }

  const handleSendUpdate = async () => {
    if (!updateText.trim()) return;
    
    const newUpdate = {
      user: profile?.full_name || "Unknown Node",
      email: userEmail,
      text: updateText.trim(),
      time: new Date().toISOString(),
      isMe: true
    };

    const currentUpdates = Array.isArray(selectedProject.updates) ? selectedProject.updates : (typeof selectedProject.updates === 'string' ? JSON.parse(selectedProject.updates || '[]') : []);
    const updatedUpdates = [newUpdate, ...currentUpdates];

    const { error } = await supabase
      .from('projects')
      .update({ updates: updatedUpdates })
      .eq('id', selectedProject.id);

    if (!error) {
      const updatedProj = { ...selectedProject, updates: updatedUpdates };
      setSelectedProject(updatedProj);
      setProjects(projects.map(p => p.id === selectedProject.id ? updatedProj : p));
      setUpdateText("");
    }
  };

  const getArray = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    try { return JSON.parse(val); } catch { return []; }
  };

  if (selectedProject) {
    return (
      <div className="p-6 md:p-10 space-y-8 bg-[#F8FAFC] min-h-screen">
        <button 
          onClick={() => setSelectedProject(null)}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#E2E8F0] shadow-sm rounded-xl text-[10px] font-black uppercase tracking-widest text-[#64748B] hover:text-[#0F172A] transition-all group w-fit"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span>Back to Projects</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Project Banner */}
            <div className="bg-white rounded-[40px] p-10 border border-[#E2E8F0] shadow-sm relative overflow-hidden">
               <div className="relative z-10 space-y-6">
                  <div className="flex items-center gap-3">
                    <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100">
                      Active Development
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">v2.4.0-STABLE</span>
                  </div>
                  <h1 className="text-4xl font-black text-[#0F172A] tracking-tighter uppercase leading-none">
                    {selectedProject.title}
                  </h1>
                  <p className="text-sm font-medium text-[#64748B] leading-relaxed max-w-2xl">
                    {selectedProject.description}
                  </p>
                  <div className="flex flex-wrap gap-6 pt-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="text-blue-600" size={18} />
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-[#94A3B8] uppercase tracking-widest">Timeline</span>
                        <span className="text-[11px] font-black text-[#0F172A]">APR 01 - MAY 15</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="text-amber-500" size={18} />
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-[#94A3B8] uppercase tracking-widest">Velocity</span>
                        <span className="text-[11px] font-black text-[#0F172A]">4.8 PTS / DAY</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="text-emerald-500" size={18} />
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-[#94A3B8] uppercase tracking-widest">Health</span>
                        <span className="text-[11px] font-black text-[#0F172A]">EXCELLENT</span>
                      </div>
                    </div>
                  </div>
               </div>
               <Activity size={180} className="absolute -bottom-10 -right-10 text-slate-50/50 -rotate-12" />
            </div>

            {/* Phase Timeline Section */}
            <div className="bg-white rounded-[40px] p-10 border border-[#E2E8F0] shadow-sm space-y-8">
               <div className="flex items-center justify-between">
                  <div className="space-y-1">
                     <h3 className="text-lg font-black text-[#0F172A] uppercase tracking-tighter flex items-center gap-2">
                        <Target size={20} className="text-blue-600" />
                        Development Roadmap
                     </h3>
                     <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">Stage-by-stage progression nodes</p>
                  </div>
                  <div className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-blue-100">
                     Phase {selectedProject.phases?.length > 0 ? "1 / " + selectedProject.phases.length : "0 / 0"}
                  </div>
               </div>

               <div className="space-y-12 relative before:absolute before:left-[31px] before:top-4 before:bottom-4 before:w-[2px] before:bg-slate-100">
                  {getArray(selectedProject.phases).map((phase, i) => {
                    const isCompleted = phase.is_completed;
                    const isActive = !isCompleted && (i === 0 || getArray(selectedProject.phases)[i-1]?.is_completed);
                    
                    return (
                      <div key={i} className="relative pl-20 group/phase">
                         <div className={`absolute left-0 top-0 w-16 h-16 rounded-[24px] border-4 border-white flex items-center justify-center z-10 shadow-2xl transition-all duration-500 ${isCompleted ? 'bg-emerald-500 text-white rotate-12' : isActive ? 'bg-blue-600 text-white scale-110' : 'bg-slate-100 text-slate-400 opacity-50'}`}>
                            {isCompleted ? <CheckCircle2 size={28} /> : <span className="text-xl font-black">{i + 1}</span>}
                         </div>
                         <div className={`bg-white rounded-[48px] border transition-all duration-500 p-10 space-y-6 hover:shadow-2xl ${isActive ? 'border-blue-200 ring-4 ring-blue-50/50' : isCompleted ? 'border-emerald-100 opacity-80' : 'border-[#E2E8F0] opacity-40'}`}>
                            <div className="flex justify-between items-start">
                               <div>
                                  <div className="flex items-center gap-3 mb-2">
                                     <h4 className={`text-2xl font-black uppercase tracking-tighter ${isActive ? 'text-blue-600' : isCompleted ? 'text-emerald-600' : 'text-[#0F172A]'}`}>{phase.title}</h4>
                                     {isActive && <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-ping" />}
                                  </div>
                                  <div className={`flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] ${isActive ? 'text-blue-500' : 'text-slate-400'}`}>
                                     <Calendar size={14} />
                                     Neural Deadline: {phase.deadline ? new Date(phase.deadline).toLocaleDateString() : 'TBD'}
                                  </div>
                               </div>
                               <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${isCompleted ? 'bg-emerald-50 text-emerald-600' : isActive ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400'}`}>
                                  {isCompleted ? 'Post-Execution' : isActive ? 'Operational' : 'Standby'}
                               </span>
                            </div>
                            {isActive && (
                               <div className="pt-4 flex items-center gap-4 text-blue-600">
                                  <div className="flex-1 h-1.5 bg-blue-50 rounded-full overflow-hidden">
                                     <motion.div initial={{ width: 0 }} animate={{ width: '40%' }} className="h-full bg-blue-600" />
                                  </div>
                                  <span className="text-[10px] font-black uppercase tracking-widest">Active Execution</span>
                               </div>
                            )}
                          </div>
                       </div>
                    );
                  })}
                  {(!selectedProject.phases || selectedProject.phases.length === 0) && (
                     <div className="pl-12 py-6">
                        <p className="text-[10px] font-black text-[#CBD5E1] uppercase tracking-widest italic">No detailed phases defined by project lead</p>
                     </div>
                  )}
               </div>
            </div>

            {/* Daily Chart (Placeholder for progress) */}
            <div className="bg-white rounded-[40px] p-10 border border-[#E2E8F0] shadow-sm space-y-8">
               <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-[#0F172A] uppercase tracking-tighter">Production Velocity</h3>
                  <div className="flex gap-2">
                     {['7D', '1M', 'ALL'].map(t => (
                       <button key={t} className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${t === '7D' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-400 hover:bg-slate-50'}`}>
                         {t}
                       </button>
                     ))}
                  </div>
               </div>
               <div className="h-[200px] w-full bg-slate-50 rounded-3xl relative flex items-end justify-between px-10 pb-6 group">
                  {[40, 65, 55, 85, 75, 90, 80].map((h, i) => (
                    <motion.div 
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      transition={{ delay: i * 0.1, type: "spring" }}
                      className="w-8 bg-blue-600/20 rounded-t-lg relative group/bar hover:bg-blue-600 transition-all cursor-pointer"
                    >
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#0F172A] text-white px-2 py-1 rounded text-[9px] font-black opacity-0 group-hover/bar:opacity-100 transition-opacity">
                        {h}%
                      </div>
                    </motion.div>
                  ))}
                  <div className="absolute inset-0 flex flex-col justify-between p-10 opacity-10 pointer-events-none">
                     {[1,2,3,4].map(i => <div key={i} className="w-full h-px bg-slate-400" />)}
                  </div>
               </div>
               <div className="flex justify-between px-10 text-[9px] font-black text-[#94A3B8] uppercase tracking-widest">
                  <span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span><span>SUN</span>
               </div>
            </div>
          </div>

          <div className="space-y-8">
             {/* Team Sidebar */}
             <div className="bg-white rounded-[40px] p-8 border border-[#E2E8F0] shadow-sm space-y-6">
                <h3 className="text-[11px] font-black text-[#0F172A] uppercase tracking-[0.2em] flex items-center gap-2">
                  <Users size={16} className="text-blue-600" />
                  Collective Nodes
                </h3>
                <div className="space-y-4">
                   {getArray(selectedProject.team).length === 0 ? (
                     <p className="text-[10px] font-black text-slate-300 uppercase text-center py-4">No team nodes assigned</p>
                   ) : getArray(selectedProject.team).map((node, i) => (
                     <div key={i} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-all group">
                        <div className="flex items-center gap-3">
                           <div className="w-9 h-9 rounded-xl bg-slate-100 border border-[#F1F5F9] overflow-hidden">
                              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${node.name}`} alt="" />
                           </div>
                           <div className="min-w-0">
                              <p className="text-[10px] font-black text-[#0F172A] uppercase truncate">{node.name}</p>
                              <p className="text-[7.5px] font-black text-blue-600 uppercase tracking-widest">{node.role}</p>
                           </div>
                        </div>
                        {node.isLead && <span className="text-[7px] font-black bg-amber-50 text-amber-500 px-2 py-0.5 rounded-full border border-amber-100 uppercase tracking-widest">LEAD</span>}
                     </div>
                   ))}
                </div>
                <div className="pt-4 flex gap-3">
                  <button className="flex-1 bg-blue-50 text-blue-600 py-3 rounded-xl font-black text-[9px] tracking-widest uppercase hover:bg-blue-100 transition-all">Submit Development Log</button>
               </div>
            </div>

            {/* Neural Communication Hub */}
            <ProjectChat 
               projectId={selectedProject.id} 
               userEmail={userEmail} 
               userName={profile?.full_name} 
            />

             {/* Resources */}
             <div className="bg-white rounded-[40px] p-8 border border-[#E2E8F0] shadow-sm space-y-6">
                <h3 className="text-[11px] font-black text-[#0F172A] uppercase tracking-[0.2em] flex items-center gap-2">
                  <FileText size={16} className="text-blue-600" />
                  Documentation
                </h3>
                <div className="space-y-3">
                   {['Project Brief.pdf', 'API Specifications.yaml', 'Design Guidelines.fig'].map((file, i) => (
                     <div key={i} className="flex items-center justify-between p-4 bg-[#F8FAFC] border border-[#F1F5F9] rounded-2xl hover:border-blue-200 transition-all cursor-pointer group">
                        <div className="flex items-center gap-3">
                           <FileText size={14} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
                           <span className="text-[10px] font-bold text-slate-600 uppercase truncate">{file}</span>
                        </div>
                        <ChevronRight size={14} className="text-slate-300" />
                     </div>
                   ))}
                </div>
             </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 space-y-10 bg-[#F8FAFC] min-h-screen">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-blue-600 mb-1">
          <Briefcase size={16} />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Deployment Console</span>
        </div>
        <h1 className="text-4xl font-black text-[#0F172A] tracking-tighter uppercase leading-none">
          My <span className="text-blue-600">Assignments</span>
        </h1>
        <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-widest">
          Active participation and contribution tracking for assigned club projects
        </p>
      </header>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-white rounded-[40px] p-20 border border-dashed border-[#E2E8F0] text-center space-y-6">
           <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
             <Briefcase size={40} />
           </div>
           <div className="space-y-2">
             <h3 className="text-xl font-black text-[#0F172A] uppercase tracking-tighter">No Active Assignments</h3>
             <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest">Awaiting project allocation from master nodes</p>
           </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project, idx) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => setSelectedProject(project)}
              className="bg-white rounded-[40px] p-8 border border-[#E2E8F0] shadow-sm hover:shadow-2xl hover:border-blue-300 transition-all cursor-pointer group flex flex-col"
            >
              <div className="flex justify-between items-start mb-8">
                <div className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                  project.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-500'
                }`}>
                  {project.status}
                </div>
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform">
                  <Activity size={24} />
                </div>
              </div>

              <div className="space-y-4 flex-1">
                <h3 className="text-2xl font-black text-[#0F172A] uppercase tracking-tighter group-hover:text-blue-600 transition-colors">
                  {project.title}
                </h3>
                <p className="text-xs font-bold text-[#64748B] leading-relaxed line-clamp-2">
                  {project.description}
                </p>
              </div>

              <div className="mt-10 pt-8 border-t border-[#F1F5F9] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-slate-400" />
                  <span className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest">
                    Ends {new Date(project.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-blue-600 font-black text-[10px] uppercase tracking-widest">
                  View Detail <ChevronRight size={14} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
