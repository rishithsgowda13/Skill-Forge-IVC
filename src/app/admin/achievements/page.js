"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trophy, 
  Plus, 
  Search, 
  Star, 
  Award, 
  Zap, 
  Target, 
  CheckCircle2, 
  X, 
  Trash2, 
  Pencil,
  Medal,
  Crown,
  Sparkles,
  Shield,
  Palette,
  LayoutGrid
} from "lucide-react";
import { createClient } from "@/lib/supabase";

const ICON_OPTIONS = [
  { name: "Trophy", icon: Trophy, color: "text-amber-500", bg: "bg-amber-50" },
  { name: "Award", icon: Award, color: "text-blue-500", bg: "bg-blue-50" },
  { name: "Star", icon: Star, color: "text-yellow-500", bg: "bg-yellow-50" },
  { name: "Zap", icon: Zap, color: "text-violet-500", bg: "bg-violet-50" },
  { name: "Target", icon: Target, color: "text-rose-500", bg: "bg-rose-50" },
  { name: "Check", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50" },
  { name: "Medal", icon: Medal, color: "text-orange-500", bg: "bg-orange-50" },
  { name: "Crown", icon: Crown, color: "text-purple-500", bg: "bg-purple-50" },
  { name: "Shield", icon: Shield, color: "text-indigo-500", bg: "bg-indigo-50" },
];

export default function AdminAchievementsPage() {
  const supabase = createClient();
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("Trophy");

  useEffect(() => {
    fetchAchievements();
  }, []);

  async function fetchAchievements() {
    setLoading(true);
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) setAchievements(data || []);
    setLoading(false);
  }

  const handleAddAchievement = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newAchievement = {
      title: formData.get('title'),
      description: formData.get('description'),
      icon: selectedIcon,
      criteria: formData.get('criteria'),
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('achievements')
      .insert([newAchievement])
      .select();

    if (!error) {
      setAchievements([data[0], ...achievements]);
      setIsModalOpen(false);
    } else {
      // Mock for demo
      setAchievements([{...newAchievement, id: Math.random().toString()}, ...achievements]);
      setIsModalOpen(false);
    }
  };

  const filteredAchievements = achievements.filter(a => 
    a.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 md:p-10 space-y-10 bg-[#F8FAFC] min-h-screen">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-amber-500 mb-1">
            <Sparkles size={16} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Honor Registry</span>
          </div>
          <h1 className="text-4xl font-black text-[#0F172A] tracking-tighter uppercase leading-none">
            Hall of <span className="text-amber-500">Valor</span>
          </h1>
          <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-widest">
            Define and distribute club achievements to elite members
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search Achievements..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white border border-[#E2E8F0] rounded-2xl py-3 pl-12 pr-6 text-xs font-bold text-[#0F172A] focus:outline-none focus:border-amber-500 transition-all w-[240px] shadow-sm"
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-[#0F172A] text-white px-6 py-3 rounded-2xl font-black text-[10px] tracking-widest uppercase flex items-center gap-2 shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-[0.98]"
          >
            <Plus size={16} />
            <span>Create Honor</span>
          </button>
        </div>
      </header>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <div className="bg-[#0F172A] p-8 rounded-[32px] text-white shadow-2xl relative overflow-hidden group">
            <div className="relative z-10 space-y-4">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-amber-400">
                <Trophy size={24} />
              </div>
              <div>
                <p className="text-4xl font-black">{achievements.length}</p>
                <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] leading-none mt-1">Global Honors Defined</p>
              </div>
            </div>
            <Trophy size={140} className="absolute -bottom-6 -right-6 text-white/5 group-hover:scale-110 transition-transform duration-500" />
         </div>

         <div className="bg-white p-8 rounded-[32px] border border-[#E2E8F0] shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
               <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                 <Target size={24} />
               </div>
               <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest">Active</span>
            </div>
            <div className="mt-4">
               <p className="text-3xl font-black text-[#0F172A]">128</p>
               <p className="text-[9px] font-black text-[#94A3B8] uppercase tracking-[0.2em] leading-none mt-1">Total Claims by Members</p>
            </div>
         </div>

         <div className="bg-white p-8 rounded-[32px] border border-[#E2E8F0] shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
               <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                 <CheckCircle2 size={24} />
               </div>
               <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-widest">94% Distribution</span>
            </div>
            <div className="mt-4">
               <p className="text-3xl font-black text-[#0F172A]">Top 5%</p>
               <p className="text-[9px] font-black text-[#94A3B8] uppercase tracking-[0.2em] leading-none mt-1">Elite Member Bracket</p>
            </div>
         </div>
      </div>

      {/* Achievements List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence>
          {filteredAchievements.map((ach, idx) => {
            const iconData = ICON_OPTIONS.find(i => i.name === ach.icon) || ICON_OPTIONS[0];
            return (
              <motion.div
                key={ach.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-[40px] p-8 border border-[#E2E8F0] shadow-sm hover:shadow-xl hover:border-amber-200 transition-all group relative overflow-hidden"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className={`p-4 rounded-[24px] ${iconData.bg} ${iconData.color} shadow-lg shadow-current/5`}>
                    <iconData.icon size={28} />
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2.5 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                      <Pencil size={16} />
                    </button>
                    <button className="p-2.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xl font-black text-[#0F172A] uppercase tracking-tighter leading-none group-hover:text-amber-600 transition-colors">
                    {ach.title}
                  </h3>
                  <p className="text-[11px] font-bold text-[#64748B] leading-relaxed line-clamp-2">
                    {ach.description}
                  </p>
                </div>

                <div className="mt-8 pt-6 border-t border-[#F1F5F9] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {[1,2,3].map(i => (
                        <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-100 overflow-hidden">
                           <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + ach.id}`} alt="" />
                        </div>
                      ))}
                    </div>
                    <span className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest">+14 Claimed</span>
                  </div>
                  <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest bg-amber-50 px-2 py-0.5 rounded">Rare</span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Add Achievement Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-[48px] shadow-2xl w-full max-w-xl overflow-hidden"
            >
              <div className="p-12 space-y-8">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h2 className="text-3xl font-black text-[#0F172A] uppercase tracking-tighter">Forge Achievement</h2>
                    <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">Define new parameters for excellence</p>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all">
                    <X size={20} className="text-slate-400" />
                  </button>
                </div>

                <form onSubmit={handleAddAchievement} className="space-y-6">
                  {/* Icon Selection */}
                  <div className="space-y-3">
                    <label className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest ml-1">Icon Representation</label>
                    <div className="grid grid-cols-5 gap-3">
                      {ICON_OPTIONS.map((opt) => (
                        <button
                          key={opt.name}
                          type="button"
                          onClick={() => setSelectedIcon(opt.name)}
                          className={`p-4 rounded-2xl transition-all flex items-center justify-center border-2 ${
                            selectedIcon === opt.name 
                              ? "border-amber-400 bg-amber-50 shadow-lg shadow-amber-200/20" 
                              : "border-[#F1F5F9] bg-[#F8FAFC] hover:border-slate-200"
                          }`}
                        >
                          <opt.icon size={20} className={selectedIcon === opt.name ? "text-amber-600" : "text-slate-400"} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest ml-1">Honor Title</label>
                    <input 
                      name="title"
                      required
                      placeholder="e.g. Master Contributor"
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl py-4 px-6 text-xs font-bold text-[#0F172A] focus:outline-none focus:border-amber-400 transition-all shadow-inner"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest ml-1">Description</label>
                    <textarea 
                      name="description"
                      required
                      rows="2"
                      placeholder="What does this achievement signify?"
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl py-4 px-6 text-xs font-bold text-[#0F172A] focus:outline-none focus:border-amber-400 transition-all resize-none shadow-inner"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest ml-1">Unlock Criteria</label>
                    <input 
                      name="criteria"
                      placeholder="e.g. Complete 5 Projects with 100% velocity"
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl py-4 px-6 text-xs font-bold text-[#0F172A] focus:outline-none focus:border-amber-400 transition-all shadow-inner"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-[#0F172A] text-white py-5 rounded-2xl font-black text-[11px] tracking-[0.4em] uppercase hover:bg-slate-800 transition-all active:scale-[0.98] shadow-2xl shadow-slate-200 mt-4"
                  >
                    Forge Honor
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
