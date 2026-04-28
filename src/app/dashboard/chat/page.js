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
  Hash,
  ShieldAlert
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

  const getArray = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    try { return JSON.parse(val); } catch { return []; }
  };

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    let email = user?.email || "";

    if (!email) {
      const cookies = document.cookie.split(';');
      const sessionCookie = cookies.find(c => c.trim().startsWith('mock_session='));
      if (sessionCookie) {
        email = sessionCookie.split('=')[1].split(':')[1];
      }
    }

    if (!email) {
      setLoading(false);
      return;
    }

    // Fetch Profile from both sources
    let { data: prof } = await supabase.from('profiles').select('*').eq('email', email).single();
    const { data: regProf } = await supabase.from('member_registry').select('*').eq('email', email).single();
    
    if (regProf) {
      if (!prof) prof = regProf;
      else if (!prof.full_name) prof.full_name = regProf.full_name;
    }

    setProfile(prof || { email, full_name: email.split('@')[0], role: 'candidate' });

    // Fetch Projects
    const { data: projData } = await supabase.from('projects').select('*');
    
    // Admins see all project chats for oversight
    if (prof?.role === 'admin') {
      setProjects(projData || []);
    } else {
      // Filter for User as Member or Mentor
      const myProjs = (projData || []).filter(p => {
        const isMentor = p.mentor_email === email;
        const team = getArray(p.team);
        const isMember = team.some(m => {
          const mEmail = typeof m === 'object' ? m.email : m;
          return mEmail === email;
        });
        return isMentor || isMember;
      });
      setProjects(myProjs);
    }
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

       <div className="flex flex-col lg:grid lg:grid-cols-4 gap-10">
          {/* Channel Sidebar */}
          <div className="lg:col-span-1 space-y-8 order-2 lg:order-1">
             <div className="bg-white rounded-[40px] p-8 border border-[#E2E8F0] shadow-sm space-y-8">
                <div className="space-y-4">
                   <h3 className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.2em]">Primary Channels</h3>
                   <button 
                     onClick={() => { setActiveTab("global"); setSelectedProject(null); }}
                     className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all ${activeTab === 'global' ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                   >
                      <Globe size={18} />
                      <span className="text-xs font-black uppercase tracking-tight">Club Chat</span>
                   </button>
                </div>

                <div className="space-y-4">
                   <h3 className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.2em]">My Group Chats</h3>
                   <div className="space-y-2">
                      {projects.map(p => (
                        <button 
                          key={p.id}
                          onClick={() => { setActiveTab("project"); setSelectedProject(p); }}
                          className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all text-left ${selectedProject?.id === p.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                        >
                           <Hash size={18} />
                           <span className="text-[10px] font-black uppercase tracking-tighter truncate">{p.title} Chat</span>
                        </button>
                      ))}
                      {projects.length === 0 && (
                        <div className="py-8 text-center space-y-4 border border-dashed border-slate-200 rounded-3xl px-6 bg-slate-50/50">
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Link Status: Offline</p>
                            <p className="text-[9px] font-bold text-slate-300 uppercase truncate">ID: {profile?.email || "Unknown"}</p>
                          </div>
                          <p className="text-[10px] font-medium text-slate-400 leading-relaxed italic">
                            No initiative nodes assigned to this ID. Verify registry in Admin Console.
                          </p>
                          <button 
                            onClick={loadData}
                            className="text-[9px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                          >
                            Sync Neural Link
                          </button>
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
          <div className="lg:col-span-3 order-1 lg:order-2">
             {loading ? (
                <div className="bg-white rounded-[50px] h-[600px] border border-[#E2E8F0] flex flex-col items-center justify-center space-y-4">
                   <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                   <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Establishing Neural Link...</p>
                </div>
             ) : !profile?.email ? (
                <div className="bg-white rounded-[50px] h-[600px] border border-[#E2E8F0] flex flex-col items-center justify-center space-y-8 text-center p-20">
                   <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-[40px] flex items-center justify-center shadow-xl shadow-rose-100">
                      <ShieldAlert size={48} />
                   </div>
                   <div className="space-y-2">
                      <h3 className="text-2xl font-black text-[#0F172A] uppercase tracking-tighter">Neural Identity Required</h3>
                      <p className="text-sm font-medium text-[#94A3B8] leading-relaxed max-w-sm">
                         Your identity node is currently offline. Establish a valid session to initialize the Communication Hub.
                      </p>
                   </div>
                   <button 
                     onClick={() => window.location.reload()}
                     className="bg-[#0F172A] text-white px-10 py-5 rounded-2xl font-black text-[10px] tracking-[0.3em] uppercase shadow-2xl shadow-slate-200 hover:bg-slate-800 transition-all"
                   >
                      Re-Establish Connection
                   </button>
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
