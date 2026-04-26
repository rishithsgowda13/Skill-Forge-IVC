"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  Search, 
  Calendar, 
  Users, 
  Clock, 
  ChevronRight, 
  MoreVertical,
  Target,
  Activity,
  CheckCircle2,
  AlertCircle,
  X,
  LayoutGrid,
  Filter,
  ArrowRight,
  MessageSquare,
  BarChart3,
  TrendingUp,
  Briefcase,
  UserPlus,
  Trash2,
  Check,
  ChevronDown,
  FileText,
  Link as LinkIcon
} from "lucide-react";
import { createClient } from "@/lib/supabase";

export default function AdminProjectsPage() {
  const supabase = createClient();
  const [projects, setProjects] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [isMemberDropdownOpen, setIsMemberDropdownOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    // Fetch projects
    const { data: projData, error: projError } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (!projError) setProjects(projData || []);

    // Fetch members for assignment
    const { data: memData } = await supabase
      .from('member_registry')
      .select('full_name, email, usn');
    setAllMembers(memData || []);
    
    setLoading(false);
  }

  const [phases, setPhases] = useState([{ title: "", description: "", deadline: "", image: "" }]);

  const handleAddProject = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newProject = {
      title: formData.get('title'),
      description: formData.get('description'),
      start_date: formData.get('start_date'),
      end_date: formData.get('end_date'),
      phases: phases.filter(p => p.title),
      team: [], // Initial empty team
      status: 'active',
    };

    const { data, error } = await supabase
      .from('projects')
      .insert([newProject])
      .select();

    if (!error && data) {
      setProjects([data[0], ...projects]);
      setIsAddModalOpen(false);
      setPhases([{ title: "", description: "", deadline: "", image: "" }]);
    } else {
      console.error("Primary insertion failed, attempting fallback...", error?.message || error);
      
      // Fallback: Try minimal insert without potentially non-existent JSON columns
      const minimalProject = { 
        title: newProject.title, 
        description: newProject.description, 
        status: newProject.status,
        start_date: newProject.start_date,
        end_date: newProject.end_date
      };
      
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('projects')
        .insert([minimalProject])
        .select();

      if (!fallbackError && fallbackData) {
        setProjects([fallbackData[0], ...projects]);
        setIsAddModalOpen(false);
        setPhases([{ title: "", description: "", deadline: "", image: "" }]);
      } else {
        console.error("Project creation fully failed:", fallbackError?.message || fallbackError);
        alert(`Nexus Error: ${fallbackError?.message || "Check console for details"}. \n\nEnsure 'projects' table exists in Supabase.`);
        
        // Final fallback for local UI consistency
        setProjects([{...newProject, id: Math.random().toString()}, ...projects]);
        setIsAddModalOpen(false);
      }
    }
  };

  const handleAddMemberToTeam = async (project, member) => {
    const currentTeam = project.team || [];
    if (currentTeam.find(m => m.email === member.email)) return;

    const updatedTeam = [...currentTeam, member];
    const { error } = await supabase
      .from('projects')
      .update({ team: updatedTeam })
      .eq('id', project.id);

    if (!error) {
      setProjects(projects.map(p => p.id === project.id ? { ...p, team: updatedTeam } : p));
      setSelectedProject({ ...project, team: updatedTeam });
    } else {
      console.error("Team update error:", error.message);
      alert(`Nexus Error: ${error.message}. \n\nThis likely means the 'team' column is missing in your 'projects' table.`);
    }
  };

  const handleRemoveMemberFromTeam = async (project, memberEmail) => {
    const updatedTeam = (project.team || []).filter(m => m.email !== memberEmail);
    const { error } = await supabase
      .from('projects')
      .update({ team: updatedTeam })
      .eq('id', project.id);

    if (!error) {
      setProjects(projects.map(p => p.id === project.id ? { ...p, team: updatedTeam } : p));
      setSelectedProject({ ...project, team: updatedTeam });
    } else {
      console.error("Team removal error:", error.message);
    }
  };

  const handleAddPhase = () => setPhases([...phases, { title: "", description: "", deadline: "", image: "" }]);
  const handleRemovePhase = (idx) => {
    const newPhases = [...phases];
    newPhases.splice(idx, 1);
    setPhases(newPhases);
  };
  const updatePhase = (idx, field, value) => {
    const newPhases = [...phases];
    newPhases[idx][field] = value;
    setPhases(newPhases);
  };

  const handleAddResource = async (project) => {
    const name = prompt("Resource Name (e.g. Project Brief):");
    if (!name) return;
    const url = prompt("Resource URL (Direct link to PDF/File):");
    if (!url) return;

    const currentResources = project.resources || [];
    const updatedResources = [...currentResources, { name, url, id: Math.random().toString() }];
    
    const { error } = await supabase
      .from('projects')
      .update({ resources: updatedResources })
      .eq('id', project.id);

    if (!error) {
      setProjects(projects.map(p => p.id === project.id ? { ...p, resources: updatedResources } : p));
      setSelectedProject({ ...project, resources: updatedResources });
    }
  };

  const handleRemoveResource = async (project, resourceId) => {
    const updatedResources = (project.resources || []).filter(r => r.id !== resourceId);
    const { error } = await supabase
      .from('projects')
      .update({ resources: updatedResources })
      .eq('id', project.id);

    if (!error) {
      setProjects(projects.map(p => p.id === project.id ? { ...p, resources: updatedResources } : p));
      setSelectedProject({ ...project, resources: updatedResources });
    }
  };

  const filteredProjects = projects.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMembers = allMembers.filter(m => 
    m.full_name.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.email.toLowerCase().includes(memberSearch.toLowerCase())
  ).slice(0, 5);

  return (
    <div className="p-8 md:p-14 space-y-12 bg-[#F8FAFC] min-h-screen">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <Briefcase size={16} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Initiative Command</span>
          </div>
          <h1 className="text-4xl font-black text-[#0F172A] tracking-tighter uppercase leading-none">
            Project <span className="text-blue-600">Nexus</span>
          </h1>
          <p className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-[0.3em] mt-3">
            Strategy · Execution · Deployment
          </p>
        </motion.div>
        
        <div className="flex items-center gap-4">
          <div className="bg-white border border-[#E2E8F0] px-5 py-3 rounded-2xl flex items-center gap-3 shadow-sm w-full md:w-80">
            <Search size={18} className="text-[#94A3B8]" />
            <input 
              type="text" 
              placeholder="Search initiatives..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-none text-xs font-bold placeholder:text-[#CBD5E1] w-full text-[#0F172A]"
            />
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] tracking-widest uppercase shadow-2xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center gap-3 flex-shrink-0"
          >
            <Plus size={16} />
            Initialize Project
          </button>
        </div>
      </header>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Active Nodes", value: projects.length, icon: Activity, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Execution Rank", value: "A+", icon: Target, color: "text-emerald-500", bg: "bg-emerald-50" },
          { label: "Total Manpower", value: allMembers.length, icon: Users, color: "text-violet-600", bg: "bg-violet-50" },
          { label: "System Load", value: "Optimal", icon: TrendingUp, color: "text-amber-500", bg: "bg-amber-50" },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[28px] border border-[#E2E8F0] shadow-sm flex items-center gap-4 group hover:border-blue-200 transition-all">
            <div className={`p-3.5 rounded-2xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
              <stat.icon size={20} />
            </div>
            <div>
              <p className="text-2xl font-black text-[#0F172A]">{stat.value}</p>
              <p className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest leading-none mt-1">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence>
          {filteredProjects.map((project, idx) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white rounded-[40px] border border-[#E2E8F0] shadow-sm hover:shadow-2xl hover:border-blue-200 transition-all group overflow-hidden flex flex-col"
            >
              <div className="p-10 space-y-8 flex-1">
                <div className="flex justify-between items-start">
                  <div className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                    project.status === 'active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-500 border border-slate-100'
                  }`}>
                    {project.status}
                  </div>
                  <button className="text-slate-300 hover:text-slate-600 transition-colors">
                    <MoreVertical size={20} />
                  </button>
                </div>

                <div className="space-y-3">
                  <h3 className="text-2xl font-black text-[#0F172A] uppercase tracking-tighter leading-none group-hover:text-blue-600 transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-[12px] font-bold text-[#64748B] line-clamp-3 leading-relaxed">
                    {project.description}
                  </p>
                </div>

                <div className="flex items-center gap-5 pt-2">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Calendar size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      {project.start_date ? new Date(project.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBD'}
                    </span>
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                  <div className="flex items-center gap-2 text-slate-400">
                    <Clock size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      {project.end_date ? new Date(project.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBD'}
                    </span>
                  </div>
                </div>

                <div className="pt-6 border-t border-[#F1F5F9]">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">Active Team</span>
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{project.team?.length || 0} Nodes</span>
                  </div>
                  <div className="flex -space-x-3">
                    {(project.team || []).length === 0 ? (
                      <div className="text-[10px] font-bold text-slate-300 italic">No nodes assigned</div>
                    ) : (project.team || []).slice(0, 5).map((m, i) => (
                      <div key={i} className="w-10 h-10 rounded-2xl bg-blue-600 border-4 border-white flex items-center justify-center text-white text-[10px] font-black shadow-lg">
                        {m.full_name?.[0]}
                      </div>
                    ))}
                    {(project.team || []).length > 5 && (
                      <div className="w-10 h-10 rounded-2xl bg-slate-100 border-4 border-white flex items-center justify-center text-slate-400 text-[10px] font-black shadow-lg">
                        +{(project.team || []).length - 5}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setSelectedProject(project)}
                className="w-full bg-[#F8FAFC] border-t border-[#F1F5F9] py-6 px-10 flex items-center justify-between group/btn hover:bg-blue-600 transition-all"
              >
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#64748B] group-hover/btn:text-white transition-colors">Command Center</span>
                <ChevronRight size={18} className="text-slate-300 group-hover/btn:text-white group-hover/btn:translate-x-1 transition-all" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add Project Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-[48px] shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            >
              <div className="p-12 space-y-10">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h2 className="text-3xl font-black text-[#0F172A] uppercase tracking-tighter">Initialize Project</h2>
                    <p className="text-[11px] font-black text-[#94A3B8] uppercase tracking-widest">Define new multi-phase development cycle</p>
                  </div>
                  <button onClick={() => setIsAddModalOpen(false)} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all">
                    <X size={24} className="text-slate-400" />
                  </button>
                </div>

                <form onSubmit={handleAddProject} className="space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest ml-1">Project Title</label>
                      <input 
                        name="title"
                        required
                        placeholder="e.g. Project CyberSync"
                        className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl py-5 px-8 text-sm font-bold text-[#0F172A] focus:outline-none focus:border-blue-600 transition-all shadow-inner"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest ml-1">Launch</label>
                        <input name="start_date" type="date" required className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl py-5 px-5 text-[10px] font-bold text-[#0F172A] focus:outline-none focus:border-blue-600 shadow-inner" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest ml-1">Deadline</label>
                        <input name="end_date" type="date" required className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl py-5 px-5 text-[10px] font-bold text-[#0F172A] focus:outline-none focus:border-blue-600 shadow-inner" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest ml-1">Core Description</label>
                    <textarea 
                      name="description"
                      required
                      rows="3"
                      placeholder="High-level overview of objectives..."
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl py-5 px-8 text-sm font-bold text-[#0F172A] focus:outline-none focus:border-blue-600 transition-all resize-none shadow-inner"
                    />
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                       <h3 className="text-[11px] font-black text-[#0F172A] uppercase tracking-widest flex items-center gap-2">
                         <Target size={14} className="text-blue-600" />
                         Development Phases
                       </h3>
                       <button type="button" onClick={handleAddPhase} className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">+ Add Stage</button>
                    </div>
                    
                    <div className="space-y-6">
                       {phases.map((p, i) => (
                         <div key={i} className="p-8 bg-[#F8FAFC] rounded-[32px] border border-[#E2E8F0] space-y-6 relative group/phase shadow-inner">
                            <button type="button" onClick={() => handleRemovePhase(i)} className="absolute top-6 right-6 text-slate-300 hover:text-rose-500 opacity-0 group-hover/phase:opacity-100 transition-all">
                               <X size={18} />
                            </button>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                               <input 
                                 placeholder="Phase Title (e.g. Prototype)"
                                 value={p.title}
                                 onChange={(e) => updatePhase(i, 'title', e.target.value)}
                                 className="bg-white border border-[#E2E8F0] rounded-xl py-4 px-6 text-xs font-bold focus:outline-none focus:border-blue-600"
                               />
                               <input 
                                 type="date"
                                 value={p.deadline}
                                 onChange={(e) => updatePhase(i, 'deadline', e.target.value)}
                                 className="bg-white border border-[#E2E8F0] rounded-xl py-4 px-6 text-[10px] font-bold focus:outline-none focus:border-blue-600"
                               />
                            </div>
                            <textarea 
                               placeholder="Phase Objectives & Deliverables..."
                               value={p.description}
                               onChange={(e) => updatePhase(i, 'description', e.target.value)}
                               className="w-full bg-white border border-[#E2E8F0] rounded-xl py-4 px-6 text-xs font-bold focus:outline-none focus:border-blue-600 resize-none"
                            />
                         </div>
                       ))}
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-[#0F172A] text-white py-6 rounded-[32px] font-black text-[11px] tracking-[0.3em] uppercase hover:bg-slate-800 transition-all active:scale-[0.98] shadow-2xl shadow-slate-200 mt-4"
                  >
                    Launch Initiative
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


      {/* Project Detail View (Integrated) */}
      <AnimatePresence>
        {selectedProject && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setSelectedProject(null); setIsMemberDropdownOpen(false); }}
              className="absolute inset-0 bg-[#0F172A]/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="absolute right-0 top-0 bottom-0 bg-white w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-12 border-b border-[#F1F5F9] flex items-center justify-between bg-white z-10">
                <div className="flex items-center gap-6">
                  <button onClick={() => { setSelectedProject(null); setIsMemberDropdownOpen(false); }} className="p-3 hover:bg-slate-50 rounded-2xl transition-all border border-[#F1F5F9]">
                    <X size={24} className="text-slate-400" />
                  </button>
                  <div>
                    <h2 className="text-3xl font-black text-[#0F172A] uppercase tracking-tighter leading-none">{selectedProject.title}</h2>
                    <p className="text-[11px] font-black text-blue-600 uppercase tracking-widest mt-2">Project Control Panel</p>
                  </div>
                </div>
                <div className="flex gap-3">
                   <button className="p-3.5 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all">
                     <BarChart3 size={20} />
                   </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-12 space-y-12 custom-scrollbar">
                {/* Team Section (Manual Assignment) */}
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[12px] font-black text-[#0F172A] uppercase tracking-[0.3em] flex items-center gap-3">
                      <Users size={16} className="text-blue-600" />
                      Project Strike Team
                    </h3>
                    <div className="relative">
                      <button 
                        onClick={() => setIsMemberDropdownOpen(!isMemberDropdownOpen)}
                        className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition-all"
                      >
                        <UserPlus size={14} />
                        Assign Node
                      </button>
                      
                      <AnimatePresence>
                        {isMemberDropdownOpen && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 mt-3 w-72 bg-white rounded-3xl shadow-2xl border border-[#E2E8F0] z-50 overflow-hidden"
                          >
                            <div className="p-4 border-b border-[#F1F5F9]">
                              <div className="bg-slate-50 rounded-xl px-3 py-2 flex items-center gap-2 border border-[#F1F5F9]">
                                <Search size={14} className="text-slate-400" />
                                <input 
                                  autoFocus
                                  placeholder="Search name or USN..."
                                  value={memberSearch}
                                  onChange={(e) => setMemberSearch(e.target.value)}
                                  className="bg-transparent border-none outline-none text-xs font-bold w-full"
                                />
                              </div>
                            </div>
                            <div className="max-h-60 overflow-y-auto p-2">
                              {filteredMembers.length === 0 ? (
                                <div className="p-6 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">No nodes found</div>
                              ) : filteredMembers.map((m) => (
                                <button 
                                  key={m.email}
                                  onClick={() => { handleAddMemberToTeam(selectedProject, m); setIsMemberDropdownOpen(false); }}
                                  className="w-full flex items-center gap-3 p-3 hover:bg-blue-50 rounded-2xl transition-all group"
                                >
                                  <div className="w-8 h-8 bg-blue-600 text-white rounded-xl flex items-center justify-center font-black text-[10px]">
                                    {m.full_name?.[0]}
                                  </div>
                                  <div className="text-left">
                                    <p className="text-[11px] font-black text-[#0F172A] group-hover:text-blue-600">{m.full_name}</p>
                                    <p className="text-[8px] font-bold text-[#94A3B8] uppercase tracking-widest">{m.usn}</p>
                                  </div>
                                  <Check size={14} className="ml-auto text-blue-600 opacity-0 group-hover:opacity-100" />
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {(selectedProject.team || []).length === 0 ? (
                      <div className="col-span-2 py-10 border-2 border-dashed border-slate-100 rounded-[32px] flex flex-col items-center justify-center gap-3 opacity-40">
                         <Users size={32} className="text-slate-300" />
                         <p className="text-[10px] font-black uppercase tracking-widest">No active nodes assigned</p>
                      </div>
                    ) : (selectedProject.team || []).map((m, i) => (
                      <div key={i} className="bg-white border border-[#E2E8F0] p-5 rounded-[28px] flex items-center gap-4 hover:border-blue-200 transition-all group relative">
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center font-black text-blue-600 border border-slate-100 group-hover:bg-blue-600 group-hover:text-white transition-all">
                          {m.full_name?.[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-black text-[#0F172A] uppercase truncate">{m.full_name}</p>
                          <p className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-widest mt-1">{m.usn}</p>
                        </div>
                        <button 
                          onClick={() => handleRemoveMemberFromTeam(selectedProject, m.email)}
                          className="absolute top-2 right-2 p-1.5 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Roadmap Infrastructure */}
                <div className="space-y-10">
                   <h3 className="text-[12px] font-black text-[#0F172A] uppercase tracking-[0.3em] flex items-center gap-3">
                     <Target size={16} className="text-blue-600" />
                     Roadmap Infrastructure
                   </h3>
                   <div className="space-y-12 relative before:absolute before:left-[21px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                      {(selectedProject.phases || []).map((phase, i) => (
                        <div key={i} className="relative pl-14 group/phase">
                           <div className={`absolute left-0 top-0 w-11 h-11 rounded-2xl border-4 border-white flex items-center justify-center z-10 shadow-xl transition-all ${i === 0 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                              <span className="text-sm font-black">{i + 1}</span>
                           </div>
                           <div className="bg-white rounded-[40px] border border-[#E2E8F0] overflow-hidden hover:shadow-2xl hover:border-blue-200 transition-all p-8 space-y-5">
                                 <div className="flex justify-between items-start">
                                    <div>
                                       <h4 className="text-lg font-black text-[#0F172A] uppercase tracking-tighter">{phase.title}</h4>
                                       <div className="flex items-center gap-2 text-[9px] font-black text-blue-600 uppercase tracking-[0.2em] mt-2">
                                          <Calendar size={12} />
                                          Node Deadline: {phase.deadline ? new Date(phase.deadline).toLocaleDateString() : 'TBD'}
                                       </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${i === 0 ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400'}`}>
                                       {i === 0 ? 'Operational' : 'Queue'}
                                    </span>
                                 </div>
                                 <p className="text-[12px] font-bold text-[#64748B] leading-relaxed italic opacity-80">
                                    {phase.description || "No parameters defined for this node."}
                                 </p>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>

                {/* Resource Nexus */}
                <div className="space-y-10">
                   <div className="flex items-center justify-between">
                     <h3 className="text-[12px] font-black text-[#0F172A] uppercase tracking-[0.3em] flex items-center gap-3">
                       <FileText size={16} className="text-blue-600" />
                       Resource Nexus
                     </h3>
                     <button 
                       onClick={() => handleAddResource(selectedProject)}
                       className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition-all"
                     >
                       <Plus size={14} />
                       Add Document
                     </button>
                   </div>

                   <div className="space-y-4">
                      {(selectedProject.resources || []).length === 0 ? (
                        <div className="py-10 border-2 border-dashed border-slate-100 rounded-[32px] flex flex-col items-center justify-center gap-3 opacity-40">
                           <FileText size={32} className="text-slate-300" />
                           <p className="text-[10px] font-black uppercase tracking-widest">No documentation attached</p>
                        </div>
                      ) : (selectedProject.resources || []).map((res, i) => (
                        <div key={i} className="flex items-center justify-between p-5 bg-white border border-[#E2E8F0] rounded-[28px] hover:border-blue-200 transition-all group">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                                 <FileText size={18} />
                              </div>
                              <div>
                                 <p className="text-[11px] font-black text-[#0F172A] uppercase">{res.name}</p>
                                 <a href={res.url} target="_blank" rel="noopener noreferrer" className="text-[9px] font-bold text-blue-600 hover:underline flex items-center gap-1 mt-1">
                                    <LinkIcon size={10} /> Access Resource
                                 </a>
                              </div>
                           </div>
                           <button 
                             onClick={() => handleRemoveResource(selectedProject, res.id)}
                             className="p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                           >
                             <Trash2 size={16} />
                           </button>
                        </div>
                      ))}
                   </div>
                </div>
              </div>

              <div className="p-10 border-t border-[#F1F5F9] bg-[#F8FAFC]">
                <button className="w-full bg-[#0F172A] text-white py-5 rounded-[28px] font-black text-[11px] tracking-[0.4em] uppercase shadow-2xl shadow-slate-200 hover:bg-slate-800 transition-all">
                  Generate Execution Report
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
