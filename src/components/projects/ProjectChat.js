"use client";

import { useState, useEffect, useRef } from "react";
import { Send, MessageSquare, ShieldCheck, User, Globe, Hash } from "lucide-react";
import { createClient } from "@/lib/supabase";

export default function ProjectChat({ projectId, userEmail, userName, isMentor = false, projectTitle = "" }) {
  const supabase = createClient();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  const isGlobal = projectId === 'global';
  const tableName = isGlobal ? 'global_messages' : 'project_messages';

  useEffect(() => {
    fetchMessages();
    
    // Subscribe to new messages
    const channel = supabase
      .channel(`chat_${projectId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: tableName,
        filter: isGlobal ? undefined : `project_id=eq.${projectId}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function fetchMessages() {
    let query = supabase.from(tableName).select('*');
    if (!isGlobal) {
      query = query.eq('project_id', projectId);
    }
    const { data, error } = await query.order('created_at', { ascending: true });
    
    if (!error) setMessages(data || []);
    setLoading(false);
  }

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const message = {
      sender_email: userEmail,
      sender_name: userName || "Anonymous Node",
      content: newMessage.trim()
    };
    if (!isGlobal) message.project_id = projectId;

    const { error } = await supabase.from(tableName).insert([message]);
    if (!error) {
      setNewMessage("");
    }
  };

  return (
    <div className="bg-white rounded-[40px] border border-[#E2E8F0] shadow-sm flex flex-col h-[600px] overflow-hidden">
      <div className="p-8 border-b border-[#F1F5F9] flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isGlobal ? <Globe size={18} className="text-blue-600" /> : <Hash size={18} className="text-blue-600" />}
          <div>
            <h3 className="text-sm font-black text-[#0F172A] uppercase tracking-tighter">
              {isGlobal ? "SkillForge Global Network" : projectTitle}
            </h3>
            <p className="text-[8px] font-black text-[#94A3B8] uppercase tracking-[0.2em] mt-0.5">
              {isGlobal ? "Public Node Sync" : "Restricted Strike Team Protocol"}
            </p>
          </div>
        </div>
        <div className="flex -space-x-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="w-7 h-7 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center text-[8px] font-black text-slate-400">
              {i}
            </div>
          ))}
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-8 space-y-6 bg-[#F8FAFC]/50 custom-scrollbar"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full opacity-20">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2" />
            <span className="text-[8px] font-black uppercase tracking-widest">Decrypting Stream...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-30">
            <MessageSquare size={32} className="text-slate-300" />
            <p className="text-[9px] font-black uppercase tracking-[0.2em] max-w-[150px]">No communication detected in this node</p>
          </div>
        ) : messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.sender_email === userEmail ? 'items-end' : 'items-start'}`}>
            <div className="flex items-center gap-2 mb-1.5 px-1">
              <span className="text-[8px] font-black text-[#94A3B8] uppercase tracking-widest">
                {msg.sender_email === userEmail ? "You" : msg.sender_name}
              </span>
              {msg.isMentor && <ShieldCheck size={10} className="text-amber-500" />}
            </div>
            <div className={`p-4 rounded-2xl max-w-[85%] text-xs font-medium leading-relaxed shadow-sm transition-all hover:shadow-md ${
              msg.sender_email === userEmail 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-white border border-[#F1F5F9] text-[#0F172A] rounded-tl-none'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSendMessage} className="p-6 bg-white border-t border-[#F1F5F9] flex gap-3">
        <input 
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Transmit data to team nodes..."
          className="flex-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl py-3 px-6 text-[11px] font-bold text-[#0F172A] focus:outline-none focus:border-blue-600 transition-all shadow-inner"
        />
        <button 
          type="submit"
          className="bg-blue-600 text-white p-3 rounded-xl shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
