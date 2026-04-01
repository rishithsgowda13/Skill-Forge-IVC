import React, { useState } from 'react';
import Header from '../components/Header';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Plus, Trash2, Send, Users, Lock, Zap, Layout } from 'lucide-react';
import bgImage from '../assets/futuristic_bg.png';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'questions' | 'security' | 'leaderboard'>('questions');
  const [questions, setQuestions] = useState<any[]>([
    { id: '1', text: 'Which component represents the "brain"?', type: 'mcq', timer: 60, options: ['Brain', 'Hand', 'Gear'] },
  ]);
  const [securitySettings, setSecuritySettings] = useState({
    tabDetection: true,
    contextMenuBlock: true,
    keyboardShortcutsBlock: true,
    clipboardBlock: true
  });
  const [genderFilter, setGenderFilter] = useState<'All' | 'Male' | 'Female'>('All');

  const addQuestion = () => {
    setQuestions(prev => [...prev, { id: Date.now().toString(), text: '', type: 'mcq', timer: 60, options: [] }]);
  };

  const reflectToUser = (qId: string) => {
    alert(`REFLECTING Q_ID:${qId} TO ALL ACTIVE TERMINALS`);
  };

  const tabs = [
    { key: 'questions' as const, label: 'Questions', icon: Layout },
    { key: 'security' as const, label: 'Security', icon: ShieldCheck },
    { key: 'leaderboard' as const, label: 'Leaderboard', icon: Users },
  ];

  return (
    <div className="min-h-screen flex flex-col relative bg-[#f8fafc]">
      <div className="fixed inset-0 opacity-[0.2] pointer-events-none"
           style={{ backgroundImage: `radial-gradient(#e2e8f0 1px, transparent 1px)`, backgroundSize: '24px 24px' }} />

      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />

        {/* Nav pill */}
        <div className="flex justify-center mt-6">
          <div className="bg-white border border-[#e2e8f0] rounded-full px-5 py-2 flex items-center gap-5 shadow-sm">
            <a href="/" className="text-[10px] tracking-[0.3em] text-[#64748b] font-bold uppercase hover:text-[#3b82f6] transition-colors">Home</a>
            <span className="text-[10px] tracking-[0.3em] text-[#3b82f6] font-bold uppercase border-t-2 border-[#3b82f6] pt-1 -mt-1">Admin</span>
          </div>
        </div>

        <main className="flex-1 flex px-8 pt-10 gap-8 max-w-7xl mx-auto w-full pb-10">
          {/* Sidebar */}
          <aside className="w-64 shrink-0">
            <div className="bg-white rounded-2xl p-6 border border-[#e2e8f0] shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <Lock className="w-4 h-4 text-[#3b82f6]" />
                <h3 className="font-display text-[10px] tracking-[0.3em] text-[#0f172a] uppercase font-bold">COMMAND CENTER</h3>
              </div>
              <div className="space-y-2">
                {tabs.map(t => (
                  <button
                    key={t.key}
                    onClick={() => setActiveTab(t.key)}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-left text-xs font-bold tracking-wider uppercase transition-all cursor-pointer ${
                      activeTab === t.key
                        ? 'bg-[#3b82f6]/10 border-[#3b82f6]/30 text-[#3b82f6]'
                        : 'bg-transparent border-transparent text-[#64748b] hover:text-[#0f172a] hover:bg-[#f8fafc]'
                    }`}
                  >
                    <t.icon className="w-4 h-4" /> {t.label}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              {/* QUESTIONS TAB */}
              {activeTab === 'questions' && (
                <motion.div key="q" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="bg-white rounded-2xl p-8 border border-[#e2e8f0] shadow-sm"
                >
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="font-display text-xl font-bold tracking-[0.1em] text-[#0f172a] uppercase">QUESTION EDITOR</h2>
                    <button onClick={addQuestion} className="px-5 py-2 bg-[#0f172a] text-white font-display text-[10px] tracking-[0.2em] font-bold uppercase rounded-lg flex items-center gap-2 cursor-pointer hover:bg-[#1e293b] transition-all">
                      <Plus className="w-3.5 h-3.5" /> ADD
                    </button>
                  </div>
                  <div className="space-y-3">
                    {questions.map(q => (
                      <div key={q.id} className="bg-[#f8fafc] border border-[#e2e8f0] p-5 rounded-xl flex items-center justify-between hover:border-[#3b82f6]/30 transition-colors group">
                        <div>
                          <p className="text-[9px] text-[#3b82f6] tracking-widest uppercase font-bold mb-1">Q_ID: {q.id}</p>
                          <p className="text-sm text-[#0f172a] font-medium">{q.text || 'New question...'}</p>
                        </div>
                        <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => reflectToUser(q.id)} className="p-2 bg-[#3b82f6]/10 border border-[#3b82f6]/20 rounded-lg text-[#3b82f6] hover:bg-[#3b82f6] hover:text-white transition-all cursor-pointer" title="Reflect to Users">
                            <Send className="w-3.5 h-3.5" />
                          </button>
                          <button className="p-2 bg-red-50/50 border border-red-100 rounded-lg text-red-500 hover:bg-red-500 hover:text-white transition-all cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* SECURITY TAB */}
              {activeTab === 'security' && (
                <motion.div key="s" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="bg-white rounded-2xl p-8 border border-[#e2e8f0] shadow-sm"
                >
                  <h2 className="font-display text-xl font-bold tracking-[0.1em] text-[#0f172a] uppercase mb-2">SECURITY CONFIG</h2>
                  <p className="text-xs text-[#64748b] tracking-wider uppercase mb-8">Global anti-cheating control panel</p>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(securitySettings).map(([key, val]) => (
                      <div key={key} className="bg-[#f8fafc] border border-[#e2e8f0] p-5 rounded-xl flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-[#0f172a] tracking-wider uppercase">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                          <p className="text-[9px] text-[#94a3b8] tracking-wider uppercase mt-1">Enforce: {val ? 'ACTIVE' : 'DISABLED'}</p>
                        </div>
                        <button
                          onClick={() => setSecuritySettings(prev => ({ ...prev, [key]: !val }))}
                          className={`w-12 h-6 rounded-full border flex items-center px-0.5 transition-all cursor-pointer ${val ? 'bg-[#3b82f6]/20 border-[#3b82f6]/40 justify-end' : 'bg-gray-100 border-gray-200 justify-start'}`}
                        >
                          <div className={`w-5 h-5 rounded-full transition-all ${val ? 'bg-[#3b82f6]' : 'bg-gray-300'}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* LEADERBOARD TAB */}
              {activeTab === 'leaderboard' && (
                <motion.div key="l" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="bg-white rounded-2xl p-8 border border-[#e2e8f0] shadow-sm"
                >
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="font-display text-xl font-bold tracking-[0.1em] text-[#0f172a] uppercase">MASTER DATA</h2>
                    <div className="flex gap-2">
                      {(['All', 'Male', 'Female'] as const).map(g => (
                        <button
                          key={g}
                          onClick={() => setGenderFilter(g)}
                          className={`px-4 py-1.5 text-[10px] font-bold tracking-widest rounded-lg border transition-all cursor-pointer ${
                            genderFilter === g ? 'bg-[#0f172a] border-[#0f172a] text-white' : 'bg-transparent border-[#e2e8f0] text-[#64748b] hover:text-[#0f172a]'
                          }`}
                        >
                          {g.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-[#e2e8f0]">
                    <table className="w-full text-left text-xs tracking-wider uppercase">
                      <thead className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                        <tr>
                          <th className="p-4 font-display text-[9px] tracking-[0.3em] text-[#94a3b8] font-bold">Rank</th>
                          <th className="p-4 font-display text-[9px] tracking-[0.3em] text-[#94a3b8] font-bold">Participant</th>
                          <th className="p-4 font-display text-[9px] tracking-[0.3em] text-[#94a3b8] font-bold">Gender</th>
                          <th className="p-4 font-display text-[9px] tracking-[0.3em] text-[#94a3b8] font-bold text-right">Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f1f5f9]">
                        {[
                          { rank: 1, name: 'IVC_ADMIN', gender: 'Male', score: 10000 },
                          { rank: 2, name: 'CYBER_VIPER', gender: 'Male', score: 9800 },
                          { rank: 3, name: 'NEON_KNIGHT', gender: 'Female', score: 9500 },
                        ].map(r => (
                          <tr key={r.rank} className="hover:bg-[#f8fafc] transition-colors">
                            <td className="p-4 font-display font-bold text-[#94a3b8]">#{String(r.rank).padStart(2, '0')}</td>
                            <td className="p-4 font-bold text-[#0f172a]">{r.name}</td>
                            <td className="p-4 text-[#64748b]">{r.gender}</td>
                            <td className="p-4 text-right font-display font-bold text-[#3b82f6]">{r.score.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
