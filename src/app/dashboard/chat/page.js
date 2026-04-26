"use client";

import { useState, useEffect } from "react";
import { 
  MessageSquare, 
  Globe, 
  Briefcase, 
  ShieldCheck, 
  Search,
  Activity,
  User,
  Hash
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import ProjectChat from "@/components/projects/ProjectChat";

export default function CommunicationHub() {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState("global");
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const cookies = document.cookie.split(';');
    const sessionCookie = cookies.find(c => c.trim().startsWith('mock_session='));
    let email = "";
    if (sessionCookie) {
      email = sessionCookie.split('=')[1].split(':')[1];
    }

    // Fetch Profile
    const { data: prof } = await supabase.from('member_registry').select('*').eq('email', email).single();
    setProfile(prof);

    // Fetch User Projects
    const { data: projData } = await supabase.from('projects').select('*');
    const myProjs = (projData || []).filter(p => {
      try {
        const team = Array.isArray(p.team) ? p.team : (typeof p.team === 'string' ? JSON.parse(p.team) : []);
        return team.some(m => m.email === email);
      } catch { return false; }
    });
    setProjects(myProjs);
    setLoading(false);
  }

  return (
    <div className="p-6 md:p-10 space-y-10 bg-[#F8FAFC] min-h-screen">
       <header className="space-y-3">
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <MessageSquare size={16} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Neural Comm Network</span>
          </div>
          <h1 className="text-5xl font-black text-[#0F172A] tracking-tighter uppercase leading-none">
            Communication <span className="text-blue-600">Hub</span>
          </h1>
          <p className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-[0.3em]">
            Establish neural links across the global forge or specific strike teams
          </p>
       </header>

       <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
          {/* Channel Sidebar */}
          <div className="lg:col-span-1 space-y-8">
             <div className="bg-white rounded-[40px] p-8 border border-[#E2E8F0] shadow-sm space-y-8">
                <div className="space-y-4">
                   <h3 className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.2em]">Primary Channels</h3>
                   <button 
                     onClick={() => { setActiveTab("global"); setSelectedProject(null); }}
                     className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all ${activeTab === 'global' ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                   >
                      <Globe size={18} />
                      <span className="text-xs font-black uppercase tracking-tight">SkillForge Global</span>
                   </button>
                </div>

                <div className="space-y-4">
                   <h3 className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.2em]">Initiative Nodes</h3>
                   <div className="space-y-2">
                      {projects.map(p => (
                        <button 
                          key={p.id}
                          onClick={() => { setActiveTab("project"); setSelectedProject(p); }}
                          className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all text-left ${selectedProject?.id === p.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                        >
                           <Hash size={18} />
                           <span className="text-[10px] font-black uppercase tracking-tighter truncate">{p.title}</span>
                        </button>
                      ))}
                      {projects.length === 0 && (
                        <div className="py-6 text-center opacity-30 italic text-[10px] font-bold text-slate-400">
                          No project nodes active
                        </div>
                      )}
                   </div>
                </div>
             </div>

             <div className="bg-blue-600 rounded-[40px] p-8 text-white space-y-4 shadow-2xl shadow-blue-100">
                <Activity size={32} />
                <h4 className="text-sm font-black uppercase tracking-tighter">Tactical Intel</h4>
                <p className="text-[10px] font-medium text-blue-100 leading-relaxed">
                   Communication is vital for synchronization. Ensure all nodes are briefed on the latest protocols.
                </p>
             </div>
          </div>

          {/* Chat Interface Area */}
          <div className="lg:col-span-3">
             {loading ? (
                <div className="bg-white rounded-[50px] h-[600px] border border-[#E2E8F0] flex flex-col items-center justify-center space-y-4">
                   <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                   <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Establishing Neural Link...</p>
                </div>
             ) : (
                <ProjectChat 
                   projectId={activeTab === 'global' ? 'global' : selectedProject?.id}
                   projectTitle={selectedProject?.title}
                   userEmail={profile?.email}
                   userName={profile?.full_name}
                   isMentor={profile?.role === 'mentor' || profile?.role === 'admin'}
                />
             )}
          </div>
       </div>
    </div>
  );
}
