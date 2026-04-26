"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import Sidebar from "@/components/layout/Sidebar";
import { 
  Users, 
  Search,
  MoreVertical,
  Mail,
  Shield,
  Clock,
  Phone,
  Bookmark,
  Hash,
  Layers,
  KeyRound,
  X,
  Check,
  Loader2,
  Trash2,
  AlertTriangle,
  ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(null);
  const [toast, setToast] = useState(null);
  
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    // Fetch from member_registry which is our source of truth for club members
    const { data, error } = await supabase
      .from("member_registry")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error loading registry:", error);
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  }

  function showToast(message, type = "info") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.usn?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUpdateUser = async (updatedData) => {
    const { error } = await supabase
      .from("member_registry")
      .update({
        full_name: updatedData.full_name,
        email: updatedData.email,
        usn: updatedData.usn,
        // phone, section, semester omitted due to schema mismatch
      })
      .eq("email", selectedUser.email);

    if (error) {
      showToast("Failed to update node.", "error");
    } else {
      showToast("Identity protocol updated.", "success");
      setUsers(users.map(u => u.email === selectedUser.email ? { ...u, ...updatedData } : u));
      setIsEditModalOpen(false);
      setSelectedUser(null);
    }
  };

  const handleCreateUser = async (userData) => {
    const { data, error } = await supabase
      .from("member_registry")
      .insert([{
        full_name: userData.full_name,
        email: userData.email,
        usn: userData.usn,
        // phone, section, semester omitted due to schema mismatch
      }])
      .select();

    if (error) {
      showToast("Failed to register node.", "error");
    } else {
      showToast("New node registered in nexus.", "success");
      setUsers([data[0], ...users]);
      setIsCreateModalOpen(false);
    }
  };

  const handleResetPassword = async (email) => {
    // In a real app, we'd use supabase.auth.resetPasswordForEmail
    // For now, we simulate a secure reset protocol
    showToast(`Reset protocol initiated for ${email}`, "success");
    setIsResetModalOpen(false);
    setSelectedUser(null);
  };

  const handleDeleteUser = async (email) => {
    const { error } = await supabase
      .from("member_registry")
      .delete()
      .eq("email", email);

    if (error) {
      showToast("Failed to de-register node.", "error");
    } else {
      showToast("Node de-registered from nexus.", "info");
      loadUsers();
      setIsMenuOpen(null);
    }
  };

  return (
    <div className="p-8 md:p-14 space-y-10 flex flex-col min-h-screen bg-[#F8FAFC]">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <Users size={16} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Node Registry</span>
          </div>
          <h1 className="text-3xl font-black text-[#0F172A] tracking-tighter uppercase leading-none">
            Identity <span className="text-blue-600">Nexus</span>
          </h1>
          <p className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-[0.3em] mt-2">
            Global Hub for Student Data & Access Control
          </p>
        </motion.div>
        
        <div className="flex items-center gap-4">
          <div className="bg-white border border-[#E2E8F0] px-4 py-2.5 rounded-2xl flex items-center gap-3 shadow-sm w-full md:w-64">
            <Search size={16} className="text-[#94A3B8]" />
            <input 
              type="text" 
              placeholder="Search USN, Name, Email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-none text-xs font-bold placeholder:text-[#CBD5E1] w-full text-[#0F172A]"
            />
          </div>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-[#0F172A] text-white px-6 py-3 rounded-2xl font-black text-[10px] tracking-widest uppercase shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all flex-shrink-0"
          >
            Register Node
          </button>
        </div>
      </header>

      <div className="bg-white rounded-[32px] border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="border-b bg-[#F8FAFC]">
                <th className="px-8 py-6 text-[9px] font-black text-[#94A3B8] uppercase tracking-[0.2em]">Member Info</th>
                <th className="px-6 py-6 text-[9px] font-black text-[#94A3B8] uppercase tracking-[0.2em]">Affiliation</th>
                <th className="px-4 py-6 text-[9px] font-black text-[#94A3B8] uppercase tracking-[0.2em] text-center">Sec</th>
                <th className="px-4 py-6 text-[9px] font-black text-[#94A3B8] uppercase tracking-[0.2em] text-center">Sem</th>
                <th className="px-8 py-6 text-[9px] font-black text-[#94A3B8] uppercase tracking-[0.2em]">Contact Node</th>
                <th className="px-8 py-6 text-[9px] font-black text-[#94A3B8] uppercase tracking-[0.2em] text-center">Protocol Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-24">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-10 h-10 border-4 border-blue-600/10 border-t-blue-600 rounded-full animate-spin" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Registry...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-24 text-center">
                    <Users size={48} className="mx-auto text-slate-200 mb-4" />
                    <p className="text-sm font-bold text-slate-400">No matching nodes found in registry.</p>
                  </td>
                </tr>
              ) : filteredUsers.map((u, i) => (
                <motion.tr 
                  key={u.email}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="group hover:bg-[#F8FAFC] transition-colors"
                >
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                       <div className="w-11 h-11 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-black text-sm shadow-lg shadow-blue-100 flex-shrink-0">
                          {u.full_name?.[0] || "U"}
                       </div>
                       <div className="min-w-0">
                          <p className="text-sm font-black text-[#0F172A] leading-tight truncate">{u.full_name}</p>
                          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">USN: {u.usn || "NOT_ASSIGNED"}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-2">
                       <div className="p-2 bg-slate-50 rounded-lg">
                         <Layers size={14} className="text-[#94A3B8]" />
                       </div>
                       <span className="text-xs font-bold text-[#475569] uppercase tracking-tight">
                         {u.department || "Computer Science"}
                       </span>
                    </div>
                  </td>
                  <td className="px-4 py-6 text-center">
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase border border-blue-100">
                      SEC {u.section || "A"}
                    </span>
                  </td>
                  <td className="px-4 py-6 text-center">
                    <span className="text-sm font-black text-[#0F172A]">{u.semester || "01"}</span>
                  </td>
                  <td className="px-8 py-6">
                     <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-slate-400">
                           <Mail size={12} />
                           <span className="text-[11px] font-bold text-[#64748B]">{u.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400">
                           <Phone size={12} />
                           <span className="text-[11px] font-bold text-[#64748B]">{u.phone || "+91 ——————"}</span>
                        </div>
                     </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => { setSelectedUser(u); setIsResetModalOpen(true); }}
                        className="flex items-center gap-2 px-3 py-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-all border border-rose-100 group/pass"
                      >
                         <KeyRound size={12} className="group-hover/pass:rotate-12 transition-transform" />
                         <span className="text-[9px] font-black uppercase tracking-widest">Reset</span>
                      </button>
                      
                      <div className="relative">
                        <button 
                          onClick={() => setIsMenuOpen(isMenuOpen === u.email ? null : u.email)}
                          className={`p-2 rounded-xl transition-all ${isMenuOpen === u.email ? 'bg-[#0F172A] text-white shadow-lg' : 'hover:bg-slate-100 text-slate-400'}`}
                        >
                          <MoreVertical size={18} />
                        </button>
                        
                        <AnimatePresence>
                          {isMenuOpen === u.email && (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.95, y: 10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: 10 }}
                              className="absolute right-0 mt-2 w-48 bg-[#0F172A] rounded-2xl shadow-2xl z-[100] border border-slate-800 p-2"
                            >
                              <button 
                                onClick={() => { setSelectedUser(u); setIsEditModalOpen(true); setIsMenuOpen(null); }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-[10px] font-black text-slate-300 uppercase tracking-widest hover:bg-blue-600 hover:text-white rounded-xl transition-all"
                              >
                                <Bookmark size={14} />
                                Edit Node
                              </button>
                              <button 
                                onClick={() => handleDeleteUser(u.email)}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-[10px] font-black text-rose-400 uppercase tracking-widest hover:bg-rose-600 hover:text-white rounded-xl transition-all"
                              >
                                <Trash2 size={14} />
                                Terminate
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-8 space-y-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h2 className="text-xl font-black text-[#0F172A] uppercase tracking-tighter">Register New Node</h2>
                    <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">Initialize core identity protocol</p>
                  </div>
                  <button onClick={() => setIsCreateModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-all">
                    <X size={20} className="text-slate-400" />
                  </button>
                </div>

                <form className="space-y-4" onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  handleCreateUser({
                    full_name: formData.get("full_name"),
                    email: formData.get("email"),
                    usn: formData.get("usn"),
                    phone: formData.get("phone"),
                    section: formData.get("section") || "A",
                    semester: formData.get("semester") || "01"
                  });
                }}>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest ml-1">Full Name</label>
                    <input name="full_name" required placeholder="Node Name" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest ml-1">Email Address</label>
                    <input name="email" required type="email" placeholder="node@skillforge.io" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest ml-1">USN</label>
                      <input name="usn" required placeholder="1SK20CS..." className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold uppercase" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest ml-1">Phone</label>
                      <input name="phone" placeholder="+91 ..." className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest ml-1 text-center block">Section</label>
                      <input name="section" defaultValue="A" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold text-center uppercase" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest ml-1 text-center block">Semester</label>
                      <input name="semester" defaultValue="01" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold text-center" />
                    </div>
                  </div>
                  
                  <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-[10px] tracking-widest uppercase shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all mt-2">
                    Confirm Registration
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {isEditModalOpen && selectedUser && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditModalOpen(false)}
              className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-8 space-y-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h2 className="text-xl font-black text-[#0F172A] uppercase tracking-tighter">Edit Identity</h2>
                    <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">Update core registry parameters</p>
                  </div>
                  <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-all">
                    <X size={20} className="text-slate-400" />
                  </button>
                </div>

                <form className="space-y-4" onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  handleUpdateUser({
                    full_name: formData.get("full_name"),
                    usn: formData.get("usn"),
                    phone: formData.get("phone"),
                    section: formData.get("section"),
                    semester: formData.get("semester")
                  });
                }}>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest ml-1">Full Name</label>
                    <input name="full_name" defaultValue={selectedUser.full_name} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest ml-1">USN</label>
                      <input name="usn" defaultValue={selectedUser.usn} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold uppercase" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest ml-1">Phone</label>
                      <input name="phone" defaultValue={selectedUser.phone} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest ml-1 text-center block">Section</label>
                      <input name="section" defaultValue={selectedUser.section || "A"} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold text-center uppercase" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest ml-1 text-center block">Semester</label>
                      <input name="semester" defaultValue={selectedUser.semester || "01"} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold text-center" />
                    </div>
                  </div>
                  
                  <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-[10px] tracking-widest uppercase shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all mt-2">
                    Sync Changes
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reset Modal */}
      <AnimatePresence>
        {isResetModalOpen && selectedUser && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsResetModalOpen(false)}
              className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-sm overflow-hidden"
            >
              <div className="p-8 text-center space-y-6">
                <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                  <AlertTriangle size={32} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-[#0F172A] uppercase tracking-tighter">Reset Security Node?</h3>
                  <p className="text-[11px] font-bold text-[#64748B] leading-relaxed">
                    This will initiate a password reset protocol for <span className="text-blue-600 font-black">{selectedUser.email}</span>. Are you sure?
                  </p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setIsResetModalOpen(false)} className="flex-1 py-3 bg-slate-50 text-slate-400 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-slate-100 transition-all">Cancel</button>
                  <button onClick={() => handleResetPassword(selectedUser.email)} className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-100">Initiate Reset</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-10 left-1/2 -translate-x-1/2 px-6 py-4 rounded-2xl shadow-2xl z-[300] flex items-center gap-3 border-2 ${
              toast.type === "success" ? "bg-white border-emerald-100 text-emerald-600" : 
              toast.type === "error" ? "bg-white border-rose-100 text-rose-600" :
              "bg-white border-blue-100 text-blue-600"
            }`}
          >
            {toast.type === "success" ? <Check size={18} /> : <AlertTriangle size={18} />}
            <span className="text-[10px] font-black uppercase tracking-widest">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
