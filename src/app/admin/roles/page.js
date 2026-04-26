"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  Search, 
  ShieldCheck, 
  ShieldAlert, 
  User, 
  Check, 
  ChevronDown,
  Activity,
  Zap,
  MoreVertical,
  Trash2,
  X
} from "lucide-react";
import { createClient } from "@/lib/supabase";

const ROLES = [
  { value: "student", label: "Student Node", icon: User, color: "text-slate-500", bg: "bg-slate-50" },
  { value: "mentor", label: "Master Mentor", icon: Zap, color: "text-amber-500", bg: "bg-amber-50" },
  { value: "admin", label: "System Admin", icon: ShieldAlert, color: "text-blue-600", bg: "bg-blue-50" },
];

export default function RoleNexusPage() {
  const supabase = createClient();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchMembers();
  }, []);

  async function fetchMembers() {
    setLoading(true);
    const { data, error } = await supabase
      .from('member_registry')
      .select('*')
      .order('full_name');
    
    if (!error) setMembers(data || []);
    setLoading(false);
  }

  const handleRoleChange = async (email, newRole) => {
    setUpdatingId(email);
    const { error } = await supabase
      .from('member_registry')
      .update({ role: newRole })
      .eq('email', email);

    if (!error) {
      setMembers(members.map(m => m.email === email ? { ...m, role: newRole } : m));
    }
    setUpdatingId(null);
  };

  const filteredMembers = members.filter(m => 
    m.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 md:p-14 space-y-12 bg-[#F8FAFC] min-h-screen">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <ShieldCheck size={16} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Hierarchy Management</span>
          </div>
          <h1 className="text-4xl font-black text-[#0F172A] tracking-tighter uppercase leading-none">
            Role <span className="text-blue-600">Nexus</span>
          </h1>
          <p className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-[0.3em]">
            Define authority and access parameters across the forge
          </p>
        </div>

        <div className="bg-white border border-[#E2E8F0] px-5 py-3 rounded-2xl flex items-center gap-3 shadow-sm w-full md:w-80 transition-all focus-within:border-blue-400">
          <Search size={18} className="text-[#94A3B8]" />
          <input 
            type="text" 
            placeholder="Search nodes by name/email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none outline-none text-xs font-bold placeholder:text-[#CBD5E1] w-full text-[#0F172A]"
          />
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Synchronizing Node Registry...</p>
        </div>
      ) : (
        <div className="bg-white rounded-[40px] border border-[#E2E8F0] shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#F1F5F9]">
                <th className="p-8 text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.2em]">Member Node</th>
                <th className="p-8 text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.2em]">Current Authority</th>
                <th className="p-8 text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.2em]">Authority Assignment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {filteredMembers.map((member) => (
                <motion.tr 
                  key={member.email}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-slate-50/50 transition-colors group"
                >
                  <td className="p-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-600 border-4 border-white shadow-lg flex items-center justify-center text-white font-black text-xs">
                        {member.full_name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-black text-[#0F172A] uppercase tracking-tight">{member.full_name}</p>
                        <p className="text-[10px] font-bold text-[#94A3B8] lowercase mt-0.5">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-8">
                    {ROLES.map(r => r.value === member.role && (
                      <div key={r.value} className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full ${r.bg} ${r.color} border border-current/10`}>
                        <r.icon size={12} />
                        <span className="text-[9px] font-black uppercase tracking-widest">{r.label}</span>
                      </div>
                    ))}
                  </td>
                  <td className="p-8">
                    <div className="flex items-center gap-2">
                      {ROLES.map((roleOpt) => (
                        <button
                          key={roleOpt.value}
                          onClick={() => handleRoleChange(member.email, roleOpt.value)}
                          disabled={updatingId === member.email}
                          className={`p-2 rounded-xl border transition-all ${
                            member.role === roleOpt.value 
                              ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100 scale-110" 
                              : "bg-white border-[#E2E8F0] text-slate-300 hover:border-blue-300 hover:text-blue-600"
                          }`}
                          title={roleOpt.label}
                        >
                          <roleOpt.icon size={16} />
                        </button>
                      ))}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          
          {filteredMembers.length === 0 && (
            <div className="p-20 text-center space-y-4">
              <Users size={48} className="mx-auto text-slate-100" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest italic">No matching nodes found in the registry</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
