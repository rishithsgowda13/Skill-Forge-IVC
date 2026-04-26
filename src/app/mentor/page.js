"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Zap, 
  Activity, 
  Users, 
  MessageSquare, 
  FileText, 
  TrendingUp, 
  Clock, 
  ChevronRight,
  Plus,
  Send,
  Link as LinkIcon,
  Trash2,
  CheckCircle2,
  Target
} from "lucide-react";
import { createClient } from "@/lib/supabase";

export default function MentorDashboard() {
  const supabase = createClient();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const [mentorName, setMentorName] = useState("");
  const [updateText, setUpdateText] = useState("");

  useEffect(() => {
    async function init() {
      const cookies = document.cookie.split(';');
      const sessionCookie = cookies.find(c => c.trim().startsWith('mock_session='));
      if (sessionCookie) {
        const val = sessionCookie.split('=')[1];
        const email = val.split(':')[1] || "mentor@test.com";
        setUserEmail(email);
        
        // Fetch Profile
        const { data: prof } = await supabase.from('member_registry').select('*').eq('email', email).single();
        if (prof) setMentorName(prof.full_name);
        
        fetchMentorProjects(email);
      }
    }
    init();
  }, []);

  async function fetchMentorProjects(email) {
    setLoading(true);
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('mentor_email', email);
    
    if (!error) setProjects(data || []);
    setLoading(false);
  }

  const handleSendUpdate = async () => {
    if (!updateText.trim()) return;
    
    const newUpdate = {
      user: mentorName || "Master Mentor",
      email: userEmail,
      text: updateText.trim(),
      time: new Date().toISOString(),
      isMentor: true
    };

    const currentUpdates = getArray(selectedProject.updates);
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

  const handleAddResource = async () => {
    const name = prompt("Resource Name:");
    if (!name) return;
    const url = prompt("Resource URL:");
    if (!url) return;

    const currentResources = getArray(selectedProject.resources);
    const updatedResources = [...currentResources, { name, url, id: Math.random().toString() }];
    
    const { error } = await supabase
      .from('projects')
      .update({ resources: updatedResources })
      .eq('id', selectedProject.id);

    if (!error) {
      const updatedProj = { ...selectedProject, resources: updatedResources };
      setSelectedProject(updatedProj);
      setProjects(projects.map(p => p.id === selectedProject.id ? updatedProj : p));
    }
  };

  const togglePhaseCompletion = async (idx) => {
     const newPhases = [...getArray(selectedProject.phases)];
     newPhases[idx].is_completed = !newPhases[idx].is_completed;

     const { error } = await supabase
       .from('projects')
       .update({ phases: newPhases })
       .eq('id', selectedProject.id);

     if (!error) {
       const updatedProj = { ...selectedProject, phases: newPhases };
       setSelectedProject(updatedProj);
       setProjects(projects.map(p => p.id === selectedProject.id ? updatedProj : p));
     }
  };

  const getArray = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    try { return JSON.parse(val); } catch { return []; }
  };

  if (selectedProject) {
    return (
      <div className="p-8 md:p-14 space-y-10 bg-[#F8FAFC] min-h-screen">
         <button 
           onClick={() => setSelectedProject(null)}
           className="px-6 py-2 bg-white border border-[#E2E8F0] rounded-2xl text-[10px] font-black uppercase tracking-widest text-[#94A3B8] hover:text-blue-600 transition-all flex items-center gap-2 shadow-sm"
         >
           ← Initiative Overview
         </button>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-12">
               {/* Header */}
               <div className="space-y-4">
                  <div className="flex items-center gap-2 text-amber-500">
                    <Zap size={18} />
                    <span className="text-[11px] font-black uppercase tracking-[0.2em]">Oversight Command</span>
                  </div>
                  <h1 className="text-5xl font-black text-[#0F172A] tracking-tighter uppercase leading-none">{selectedProject.title}</h1>
                  <p className="text-sm font-bold text-[#64748B] leading-relaxed max-w-2xl">{selectedProject.description}</p>
               </div>

               {/* Phase Roadmap (With Done Toggle) */}
               <div className="bg-white rounded-[40px] p-12 border border-[#E2E8F0] shadow-sm space-y-10">
                  <h3 className="text-[12px] font-black text-[#0F172A] uppercase tracking-[0.3em] flex items-center gap-3">
                    <Target size={16} className="text-blue-600" />
                    Operational Roadmap
                  </h3>
                  <div className="space-y-10 relative before:absolute before:left-[21px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-50">
                    {getArray(selectedProject.phases).map((phase, i) => (
                      <div key={i} className="relative pl-14 group/phase">
                         <div className={`absolute left-0 top-0 w-11 h-11 rounded-2xl border-4 border-white flex items-center justify-center z-10 shadow-xl transition-all ${phase.is_completed ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                            {phase.is_completed ? <CheckCircle2 size={20} /> : <span className="text-sm font-black">{i + 1}</span>}
                         </div>
                         <div className={`rounded-[36px] border transition-all p-8 flex items-center justify-between gap-6 ${phase.is_completed ? 'bg-emerald-50/30 border-emerald-100' : 'bg-[#F8FAFC] border-[#F1F5F9] hover:border-blue-200 hover:bg-white'}`}>
                            <div className="space-y-2">
                               <h4 className={`text-lg font-black uppercase tracking-tight ${phase.is_completed ? 'text-emerald-700' : 'text-[#0F172A]'}`}>{phase.title}</h4>
                               <p className="text-[11px] font-bold text-[#64748B] leading-relaxed line-clamp-2">{phase.description}</p>
                            </div>
                            <button 
                              onClick={() => togglePhaseCompletion(i)}
                              className={`px-5 py-2.5 rounded-xl font-black text-[9px] tracking-widest uppercase transition-all flex-shrink-0 ${phase.is_completed ? 'bg-emerald-100 text-emerald-600' : 'bg-[#0F172A] text-white hover:bg-emerald-600'}`}
                            >
                              {phase.is_completed ? "Completed" : "Mark Done"}
                            </button>
                         </div>
                      </div>
                    ))}
                  </div>
               </div>

               {/* Activity Stream */}
               <div className="bg-white rounded-[40px] p-12 border border-[#E2E8F0] shadow-sm space-y-10">
                  <h3 className="text-[12px] font-black text-[#0F172A] uppercase tracking-[0.3em] flex items-center gap-3">
                    <Activity size={16} className="text-blue-600" />
                    Activity Stream
                  </h3>
                  <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                     {getArray(selectedProject.updates).map((act, i) => (
                      <div key={i} className={`flex gap-4 ${act.email === userEmail ? 'flex-row-reverse' : ''}`}>
                        <div className="w-10 h-10 rounded-2xl bg-slate-100 border border-[#F1F5F9] overflow-hidden flex-shrink-0 shadow-sm">
                          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${act.user}`} alt="" />
                        </div>
                        <div className={`p-6 rounded-[28px] border transition-all max-w-[80%] ${act.email === userEmail ? 'bg-blue-600 text-white border-blue-500 shadow-xl shadow-blue-100' : 'bg-[#F8FAFC] border-[#F1F5F9] text-[#0F172A]'}`}>
                          <div className={`flex justify-between items-center mb-2 ${act.email === userEmail ? 'text-white/60' : 'text-slate-400'}`}>
                             <span className="text-[9px] font-black uppercase tracking-widest">{act.user}</span>
                             <span className="text-[8px] font-bold">{new Date(act.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-xs font-medium leading-relaxed italic">"{act.text}"</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="pt-6 flex gap-4 border-t border-[#F1F5F9]">
                     <input 
                       value={updateText}
                       onChange={(e) => setUpdateText(e.target.value)}
                       onKeyDown={(e) => e.key === 'Enter' && handleSendUpdate()}
                       placeholder="Submit mentor guidance..."
                       className="flex-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl py-4 px-8 text-xs font-bold text-[#0F172A] focus:outline-none focus:border-blue-600 transition-all shadow-inner"
                     />
                     <button 
                       onClick={handleSendUpdate}
                       className="bg-blue-600 text-white p-4 rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95 flex-shrink-0"
                     >
                       <Send size={24} />
                     </button>
                  </div>
               </div>
            </div>

            <div className="space-y-10">
               {/* Strike Team */}
               <div className="bg-white rounded-[40px] p-8 border border-[#E2E8F0] shadow-sm space-y-6">
                  <h3 className="text-[11px] font-black text-[#0F172A] uppercase tracking-[0.2em] flex items-center gap-2">
                    <Users size={16} className="text-blue-600" />
                    Strike Team Nodes
                  </h3>
                  <div className="space-y-4">
                     {getArray(selectedProject.team).map((node, i) => (
                       <div key={i} className="flex items-center justify-between p-4 bg-[#F8FAFC] rounded-2xl border border-[#F1F5F9] hover:border-blue-200 transition-all">
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-xl bg-white border border-[#F1F5F9] overflow-hidden flex-shrink-0 shadow-sm">
                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${node.full_name}`} alt="" />
                             </div>
                             <div className="min-w-0">
                                <p className="text-[10px] font-black text-[#0F172A] uppercase truncate">{node.full_name}</p>
                                <p className="text-[7.5px] font-black text-blue-600 uppercase tracking-widest">Core Node</p>
                             </div>
                          </div>
                       </div>
                     ))}
                  </div>
               </div>

               {/* Resource Nexus */}
               <div className="bg-white rounded-[40px] p-8 border border-[#E2E8F0] shadow-sm space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[11px] font-black text-[#0F172A] uppercase tracking-[0.2em] flex items-center gap-2">
                      <FileText size={16} className="text-blue-600" />
                      Resource Nexus
                    </h3>
                    <button 
                      onClick={handleAddResource}
                      className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <div className="space-y-3">
                     {getArray(selectedProject.resources).map((res, i) => (
                       <div key={i} className="group relative">
                          <a 
                            href={res.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-4 bg-[#F8FAFC] border border-[#F1F5F9] rounded-2xl hover:border-blue-200 transition-all group-hover:bg-white"
                          >
                            <div className="flex items-center gap-3">
                               <FileText size={14} className="text-slate-400" />
                               <span className="text-[10px] font-bold text-slate-600 uppercase truncate">{res.name}</span>
                            </div>
                            <LinkIcon size={12} className="text-blue-400 opacity-0 group-hover:opacity-100 transition-all" />
                          </a>
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
    <div className="p-8 md:p-14 space-y-12 bg-[#F8FAFC] min-h-screen">
      <header className="space-y-4">
        <div className="flex items-center gap-2 text-amber-500">
          <Zap size={18} />
          <span className="text-[11px] font-black uppercase tracking-[0.2em]">Master Oversight</span>
        </div>
        <h1 className="text-5xl font-black text-[#0F172A] tracking-tighter uppercase leading-none">
          Mentor <span className="text-amber-500">Console</span>
        </h1>
        <p className="text-[12px] font-bold text-[#94A3B8] uppercase tracking-[0.3em]">
          Supervise initiative progression and provide master guidance
        </p>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Establishing Neural Link...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-white rounded-[50px] p-24 border-2 border-dashed border-[#E2E8F0] text-center space-y-8">
           <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200 shadow-inner">
             <Zap size={48} />
           </div>
           <div className="space-y-3">
             <h3 className="text-2xl font-black text-[#0F172A] uppercase tracking-tighter">No Active Assignments</h3>
             <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-[0.2em]">Awaiting initiative allocation from administration</p>
           </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {projects.map((project, idx) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => setSelectedProject(project)}
              className="bg-white rounded-[48px] p-10 border border-[#E2E8F0] shadow-sm hover:shadow-2xl hover:border-amber-300 transition-all cursor-pointer group flex flex-col relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-all duration-500" />
              
              <div className="flex justify-between items-start mb-10 relative z-10">
                <div className="px-5 py-1.5 bg-amber-50 text-amber-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-amber-100">
                  {project.status}
                </div>
                <div className="p-4 bg-slate-50 text-slate-400 rounded-2xl group-hover:bg-amber-500 group-hover:text-white transition-all shadow-sm">
                  <Activity size={24} />
                </div>
              </div>

              <div className="space-y-5 flex-1 relative z-10">
                <h3 className="text-2xl font-black text-[#0F172A] uppercase tracking-tighter group-hover:text-amber-600 transition-colors leading-none">
                  {project.title}
                </h3>
                <p className="text-[12px] font-bold text-[#64748B] leading-relaxed line-clamp-3">
                  {project.description}
                </p>
              </div>

              <div className="mt-12 pt-8 border-t border-[#F1F5F9] flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2 text-[#94A3B8]">
                  <Users size={16} />
                  <span className="text-[9px] font-black uppercase tracking-widest">{getArray(project.team).length} Nodes</span>
                </div>
                <div className="flex items-center gap-2 text-amber-500 font-black text-[10px] uppercase tracking-widest group-hover:gap-3 transition-all">
                  Supervise <ChevronRight size={16} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
