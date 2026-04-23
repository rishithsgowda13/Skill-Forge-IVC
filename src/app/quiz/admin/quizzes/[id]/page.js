"use client";

import { useEffect, useState, use } from "react";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";
import Sidebar from "@/components/layout/Sidebar";
import { 
  Plus, 
  Trash2, 
  ChevronLeft, 
  BookText, 
  Zap, 
  AlertCircle,
  Settings,
  Target,
  Hash,
  CheckCircle2,
  ArrowRight,
  Clock,
  Users,
  Lock,
  FileUp,
  Trophy,
  Award,
  Medal,
  Eye,
  X,
  Crown,
  BarChart2,
  History,
  Calendar
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

export default function QuizConfigurePage({ params }) {
  const { id } = use(params);
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newQuestion, setNewQuestion] = useState({ 
    content: "", 
    correct_answer: "A",
    options: ["", "", "", ""],
    time_limit: 30,
    points: 100
  });
  
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [participantsCount, setParticipantsCount] = useState(0);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [participantHistory, setParticipantHistory] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [activeResultTab, setActiveResultTab] = useState('leaderboard');
  
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    // Fetch Quiz Details
    const { data: quizData } = await supabase
      .from("quizzes")
      .select("*")
      .eq("id", id)
      .single();
    setQuiz(quizData);

    // Fetch Participants Count
    const { count } = await supabase
      .from("submissions")
      .select("*", { count: "exact", head: true })
      .eq("quiz_id", id);
    setParticipantsCount(count || 0);

    // Fetch leaderboard data
    await fetchLeaderboardData(id);

    // Fetch Questions
    const { data: questionData, error: qErr } = await supabase
      .from("questions")
      .select("*")
      .eq("quiz_id", id)
      .order("order_index", { ascending: true });
    
    if (qErr) console.error("Question retrieval error:", qErr);
    setQuestions(questionData || []);
    setLoading(false);
  };

  const fetchLeaderboardData = async (quizId) => {
    setLeaderboardLoading(true);
    try {
      // Fetch all submissions with profile data
      const { data: subs } = await supabase
        .from("submissions")
        .select("*, profiles!user_id(full_name, email)")
        .eq("quiz_id", quizId)
        .order("total_score", { ascending: false })
        .order("time_taken", { ascending: true });

      // Build leaderboard: aggregate by user_id
      const scoreMap = {};
      const historyList = [];
      (subs || []).forEach(s => {
        const uid = s.user_id;
        const name = s.profiles?.full_name || `Node-${uid?.toString().substring(0, 6)}`;
        const email = s.profiles?.email || '';
        if (!scoreMap[uid]) {
          scoreMap[uid] = { id: uid, full_name: name, email, total_score: 0, submissions: 0, last_seen: s.submitted_at };
        }
        scoreMap[uid].total_score += (s.total_score || s.points || 0);
        scoreMap[uid].submissions += 1;
        if (s.submitted_at > (scoreMap[uid].last_seen || '')) scoreMap[uid].last_seen = s.submitted_at;

        historyList.push({
          id: s.id,
          user_id: uid,
          full_name: name,
          score: s.total_score || s.points || 0,
          time_taken: s.time_taken,
          submitted_at: s.submitted_at || s.created_at
        });
      });

      const sorted = Object.values(scoreMap).sort((a, b) => b.total_score - a.total_score);
      setLeaderboard(sorted);
      setParticipantHistory(historyList.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at)));
    } catch (err) {
      console.error("Leaderboard fetch error:", err);
    }
    setLeaderboardLoading(false);
  };

  const handleUpdateAccessKey = async (newKey) => {
    if (!newKey) return;
    const { error } = await supabase
      .from("quizzes")
      .update({ access_code: newKey.toUpperCase() })
      .eq("id", id);
    
    if (!error) {
      setQuiz({ ...quiz, access_code: newKey.toUpperCase() });
      toast.success("ACCESS PROTOCOL UPDATED");
    } else {
      toast.error("UPDATE FAILED: " + error.message);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop().toLowerCase();
    
    const processContent = async (text) => {
        const lines = text.split(/\r?\n/).filter(line => line.trim());
        if (lines.length === 0) throw new Error("File is empty.");

        let parsedQuestions = [];

        // Attempt 1: CSV parsing
        const startIdx = lines[0].toLowerCase().includes("question") ? 1 : 0;
        parsedQuestions = lines.slice(startIdx).map((line, idx) => {
          const columns = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/); 
          const cleaned = columns.map(c => c.replace(/^"|"$/g, '').trim());
          
          if (cleaned.length < 2) return null;

          return {
            quiz_id: id,
            question_text: cleaned[0] || `Imported Node ${idx + 1}`,
            options: [
              cleaned[1] || "", 
              cleaned[2] || "", 
              cleaned[3] || "", 
              cleaned[4] || ""
            ],
            correct_answer: (cleaned[5] || "A").toUpperCase(),
            time_limit: parseInt(cleaned[6]) || 30,
            points: parseInt(cleaned[7]) || 100,
            question_type: 'mcq',
            order_index: questions.length + idx
          };
        }).filter(Boolean);

        // Attempt 2: Text Block Parsing (if CSV failed to find valid rows)
        if (parsedQuestions.length === 0) {
            let currentQ = null;
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                const lowerLine = line.toLowerCase();
                
                if (lowerLine.startsWith("question:") || lowerLine.startsWith("q:")) {
                    if (currentQ) parsedQuestions.push(currentQ);
                    currentQ = {
                        quiz_id: id,
                        question_text: line.replace(/^(question:|q:)\s*/i, "").trim(),
                        options: ["", "", "", ""],
                        correct_answer: "A",
                        time_limit: 30,
                        points: 100,
                        question_type: 'mcq',
                        order_index: questions.length + parsedQuestions.length
                    };
                } else if (currentQ) {
                    if (lowerLine.startsWith("a)") || lowerLine.startsWith("a.")) currentQ.options[0] = line.substring(2).trim();
                    else if (lowerLine.startsWith("b)") || lowerLine.startsWith("b.")) currentQ.options[1] = line.substring(2).trim();
                    else if (lowerLine.startsWith("c)") || lowerLine.startsWith("c.")) currentQ.options[2] = line.substring(2).trim();
                    else if (lowerLine.startsWith("d)") || lowerLine.startsWith("d.")) currentQ.options[3] = line.substring(2).trim();
                    else if (lowerLine.startsWith("answer:")) currentQ.correct_answer = line.replace(/^answer:\s*/i, "").trim().toUpperCase();
                    else if (lowerLine.startsWith("time:")) currentQ.time_limit = parseInt(line.replace(/^time:\s*/i, "").trim()) || 30;
                    else if (lowerLine.startsWith("points:")) currentQ.points = parseInt(line.replace(/^points:\s*/i, "").trim()) || 100;
                }
            }
            if (currentQ) parsedQuestions.push(currentQ);
            
            // Filter out incomplete questions
            parsedQuestions = parsedQuestions.filter(q => q.question_text && q.options.some(opt => opt));
        }

        if (parsedQuestions.length === 0) throw new Error("No valid questions found in file.");

        setSubmitting(true);
        const { error } = await supabase
          .from("questions")
          .insert(parsedQuestions);

        if (error) throw error;

        toast.success(`SUCCESS: ${parsedQuestions.length} nodes integrated into neural mesh.`);
        await loadData();
    };

    if (fileExt === 'docx') {
       // For real docx, we'd need mammoth.js. For now, we try text extraction if possible, or fallback to readAsText (which yields garbage for zip).
       // We'll just read as text. If it's a real docx, the user might see an error. 
       // Often users upload .txt renamed to .doc
    }
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        await processContent(event.target.result);
      } catch (err) {
        console.error("File Processing Error:", err);
        toast.error("INTEGRATION FAILED: " + err.message);
      } finally {
        setSubmitting(false);
        e.target.value = ""; // Reset input
      }
    };
    reader.readAsText(file);
  };

  const handleAuthorizeNode = async (e) => {
    e.preventDefault();
    if (!newQuestion.content.trim()) return;

    setSubmitting(true);
    if (editingQuestionId) {
      // UPDATE PROTOCOL NODE
      const { error } = await supabase
        .from("questions")
        .update({
          question_text: newQuestion.content,
          options: newQuestion.options,
          correct_answer: newQuestion.correct_answer,
          time_limit: newQuestion.time_limit,
          points: newQuestion.points
        })
        .eq("id", editingQuestionId);

      if (error) {
        console.error("Critical Recalibration Error:", error);
        toast.error("PROTOCOL RECALIBRATION FAILED: " + error.message);
      } else {
        toast.success("PROTOCOL NODE RECALIBRATED");
        await loadData();
        window.scrollTo({ top: 300, behavior: 'smooth' });
      }
    } else {
      // INJECT NEW PROTOCOL NODE
      const { error } = await supabase
        .from("questions")
        .insert([
          { 
            quiz_id: id, 
            question_text: newQuestion.content, 
            options: newQuestion.options,
            correct_answer: newQuestion.correct_answer,
            time_limit: newQuestion.time_limit || 30,
            points: newQuestion.points || 100,
            order_index: questions.length,
            question_type: 'mcq'
          }
        ]);

      if (error) {
        console.error("Critical Injection Error:", error);
        toast.error("PROTOCOL INJECTION FAILED: " + error.message);
      } else {
        toast.success("PROTOCOL NODE INJECTED");
        setNewQuestion({ 
          content: "", 
          correct_answer: "A", 
          options: ["", "", "", ""],
          time_limit: 30,
          points: 100
        });
        await loadData();
        window.scrollTo({ top: 300, behavior: 'smooth' });
      }
    }
    setSubmitting(false);
  };

  const handleDeleteQuestion = async (qId) => {
    const { error } = await supabase
      .from("questions")
      .delete()
      .eq("id", qId);
    
    if (!error) {
      setEditingQuestionId(null);
      setNewQuestion({ content: "", correct_answer: "A", options: ["", "", "", ""], time_limit: 30, points: 100 });
      loadData();
    }
  };

  if (loading) return null;

  return (
    <div className="p-4 sm:p-8 md:p-14 space-y-6 md:space-y-10 flex flex-col min-h-full">
         {/* Breadcrumbs */}
         <button 
           onClick={() => router.push("/quiz/admin/quizzes")}
           className="flex items-center gap-2 text-[11px] font-black text-[#94A3B8] uppercase tracking-[0.3em] hover:text-[#2563EB] transition-colors w-fit"
         >
            <ChevronLeft size={16} />
            <span>Back to Protocols</span>
         </button>

         <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 md:gap-8 mb-6 md:mb-16">
              <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 md:gap-6 w-full lg:w-auto">
                 <div className="flex items-center gap-2 bg-white px-3 md:px-5 py-2 md:py-2.5 rounded-[12px] md:rounded-[16px] border border-[#E2E8F0] shadow-sm w-full sm:w-auto">
                    <Hash size={14} className="text-[#2563EB]" />
                    <span className="text-[9px] md:text-xs font-black text-[#0F172A] uppercase tracking-widest leading-none">
                       {questions.length} <span className="hidden xs:inline">Nodes Registered</span><span className="xs:hidden">Nodes</span>
                    </span>
                 </div>
                 
                 <div className="flex items-center gap-2 bg-white px-3 md:px-5 py-2 md:py-2.5 rounded-[12px] md:rounded-[16px] border border-[#E2E8F0] shadow-sm w-full sm:w-auto">
                    <Users size={14} className="text-emerald-500" />
                    <span className="text-[9px] md:text-xs font-black text-[#0F172A] uppercase tracking-widest leading-none">
                       {participantsCount} <span className="hidden xs:inline">Authorized Personnel</span><span className="xs:hidden">Users</span>
                    </span>
                 </div>

                 <div className="flex items-center gap-2 bg-white px-3 md:px-5 py-2 md:py-2.5 rounded-[12px] md:rounded-[16px] border-2 border-primary-blue/30 shadow-lg shadow-blue-50 w-full sm:w-auto group">
                    <Lock size={14} className="text-primary-blue" />
                    <div className="flex flex-col">
                       <span className="text-[7px] font-black text-[#94A3B8] uppercase tracking-widest leading-none mb-1">Access Protocol</span>
                       <input 
                         type="text"
                         defaultValue={quiz?.access_code || ""}
                         placeholder="NOT_SET"
                         className="bg-transparent text-[9px] md:text-xs font-black text-[#0F172A] outline-none uppercase w-20"
                         onBlur={(e) => handleUpdateAccessKey(e.target.value)}
                         onKeyDown={(e) => e.key === 'Enter' && handleUpdateAccessKey(e.target.value)}
                       />
                    </div>
                 </div>

                 {editingQuestionId ? (
                   <button 
                     onClick={() => handleDeleteQuestion(editingQuestionId)}
                     disabled={submitting}
                     className="bg-red-500 text-white px-4 md:px-6 py-2 md:py-2.5 rounded-[12px] md:rounded-[16px] flex items-center justify-center gap-2 shadow-xl shadow-red-200 hover:bg-red-600 active:scale-95 transition-all text-[9px] md:text-xs font-black uppercase tracking-widest disabled:opacity-50 w-full sm:w-auto"
                   >
                     <Trash2 size={14} />
                     <span>Delete <span className="hidden xs:inline">Node</span></span>
                   </button>
                 ) : (
                   <div className="flex items-center gap-2 w-full sm:w-auto">
                     <button 
                       onClick={() => {
                         setEditingQuestionId(null);
                         setNewQuestion({ content: "", options: ["", "", "", ""], correct_answer: "A", time_limit: 30, points: 100 });
                         window.scrollTo({ top: 300, behavior: 'smooth' });
                       }}
                       className="bg-[#2563EB] text-white px-4 md:px-6 py-2 md:py-2.5 rounded-[12px] md:rounded-[16px] flex items-center justify-center gap-2 shadow-xl shadow-blue-200 hover:scale-[1.02] active:scale-95 transition-all text-[9px] md:text-xs font-black uppercase tracking-widest flex-1 sm:flex-none"
                     >
                       <Plus size={14} strokeWidth={3} />
                       <span>Add <span className="hidden xs:inline">Node</span></span>
                     </button>

                     <label className="bg-emerald-500 text-white px-4 md:px-6 py-2 md:py-2.5 rounded-[12px] md:rounded-[16px] flex items-center justify-center gap-2 shadow-xl shadow-emerald-200 hover:bg-emerald-600 active:scale-95 transition-all text-[9px] md:text-xs font-black uppercase tracking-widest cursor-pointer">
                       <FileUp size={14} />
                       <span className="hidden sm:inline">Bulk Import</span>
                       <input 
                         type="file" 
                         accept=".csv,.doc,.docx,.txt" 
                         className="hidden" 
                         onChange={handleFileUpload}
                         disabled={submitting}
                       />
                     </label>

                     <button
                       onClick={() => { setShowLeaderboard(true); fetchLeaderboardData(id); }}
                       className="bg-[#0F172A] text-white px-4 md:px-6 py-2 md:py-2.5 rounded-[12px] md:rounded-[16px] flex items-center justify-center gap-2 shadow-xl hover:bg-[#1E293B] active:scale-95 transition-all text-[9px] md:text-xs font-black uppercase tracking-widest"
                     >
                       <Trophy size={14} />
                       <span className="hidden sm:inline">Leaderboard</span>
                     </button>
                   </div>
                 )}
              </div>

             <header className="text-left lg:text-right w-full lg:w-auto">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#0F172A] tracking-tighter uppercase leading-none">
                   Configure <span className="text-[#2563EB]">Intelligence</span>
                </h1>
                <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.3em] mt-2">
                   {quiz?.title || "PROTOCOL"} • Session Analysis
                </p>
             </header>
          </div>

         <div className="flex justify-center w-full">
            {/* Question Entry Form */}
            <div className="w-full max-w-[1800px] space-y-8 md:space-y-12">
               <div className="bg-white rounded-[24px] md:rounded-[40px] border border-[#E2E8F0] shadow-sm p-5 md:p-8 space-y-6 md:space-y-8">
                  <form onSubmit={handleAuthorizeNode} className="space-y-8">
                     <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 md:gap-16 items-stretch">
                        {/* Left Side: Question */}
                        <div className="flex flex-col h-full space-y-4">
                           <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.4em] ml-2 md:ml-6">Challenge Content Matrix</label>
                           <textarea 
                             required
                             value={newQuestion.content || ""}
                             onChange={(e) => setNewQuestion({...newQuestion, content: e.target.value})}
                             placeholder="Enter the technical challenge protocol..."
                             className="w-full bg-[#F8FAFC] border-2 border-[#E2E8F0] rounded-[16px] md:rounded-[24px] p-4 md:p-6 text-base md:text-lg font-black text-[#0F172A] focus:outline-none focus:border-[#2563EB] flex-1 min-h-[120px] md:min-h-0 resize-none"
                           />

                           <div className="flex flex-col gap-3 pt-2">
                              <button
                                type="submit"
                                disabled={submitting || !newQuestion.content || newQuestion.options.some(opt => !opt) || !newQuestion.time_limit || !newQuestion.points}
                                className={`w-full py-3 md:py-4 rounded-[12px] md:rounded-[16px] font-black text-base md:text-lg uppercase tracking-[0.2em] shadow-2xl transition-all flex items-center justify-center gap-3 group ${
                                  (submitting || !newQuestion.content || newQuestion.options.some(opt => !opt) || !newQuestion.time_limit || !newQuestion.points)
                                    ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                                    : "bg-[#0F172A] text-white hover:scale-[1.02] active:scale-95"
                                }`}
                              >
                                 <span>{submitting ? "Authorizing..." : "Authorize Node"}</span>
                                 <Zap className={`${(submitting || !newQuestion.content || newQuestion.options.some(opt => !opt) || !newQuestion.time_limit || !newQuestion.points) ? "text-slate-300" : "text-blue-500 fill-blue-500"} w-5 h-5 md:w-6 md:h-6 group-hover:animate-pulse`} />
                              </button>

                              <button
                                type="button"
                                onClick={() => router.push('/quiz/admin/quizzes')}
                                className="w-full py-3 md:py-4 rounded-[12px] md:rounded-[16px] border-2 border-[#0F172A] font-black text-[9px] md:text-[10px] uppercase tracking-[0.4em] text-[#0F172A] hover:bg-slate-50 transition-all flex items-center justify-center gap-3 group"
                              >
                                 <span>Finish Protocol</span>
                                 <ArrowRight size={14} className="group-hover:translate-x-1 transition-all" />
                              </button>
                           </div>
                        </div>

                        {/* Right Side: Options & Correct Answer */}
                        <div className="flex flex-col h-full space-y-8">
                           <div className="grid grid-cols-1 gap-6">
                              {['A', 'B', 'C', 'D'].map((label, idx) => (
                                 <div key={label} className="space-y-3">
                                    <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.4em] ml-6">Option Node {label}</label>
                                    <div className="relative group">
                                       <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-white border-2 border-[#E2E8F0] rounded-xl flex items-center justify-center text-[10px] font-black text-[#2563EB] shadow-sm">
                                          {label}
                                       </div>
                                       <input 
                                         type="text"
                                         required
                                         value={newQuestion.options[idx] || ""}
                                         onChange={(e) => {
                                           const opts = [...newQuestion.options];
                                           opts[idx] = e.target.value;
                                           setNewQuestion({...newQuestion, options: opts});
                                         }}
                                         placeholder={`Define protocol ${label}...`}
                                         className="w-full bg-[#F8FAFC] border-2 border-[#E2E8F0] rounded-[16px] py-4 pl-16 pr-6 text-sm font-black text-[#0F172A] focus:outline-none focus:border-[#2563EB] transition-all"
                                       />
                                    </div>
                                 </div>
                              ))}
                           </div>

                           <div className="space-y-6 pt-4">
                              <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.4em] ml-6">Correct Response Signature</label>
                              <div className="flex gap-2">
                                 {['A', 'B', 'C', 'D'].map((label) => (
                                    <button
                                      key={label}
                                      type="button"
                                      onClick={() => setNewQuestion({...newQuestion, correct_answer: label})}
                                      className={`flex-1 py-4 rounded-[16px] font-black text-sm transition-all border-2 ${
                                        newQuestion.correct_answer === label 
                                          ? "bg-[#2563EB] text-white border-[#2563EB] shadow-2xl shadow-blue-200 scale-[1.05]" 
                                          : "bg-white text-[#94A3B8] border-[#E2E8F0] hover:border-[#2563EB]/40"
                                      }`}
                                    >
                                       {label}
                                    </button>
                                 ))}
                              </div>
                           </div>

                           <div className="grid grid-cols-2 gap-6 pt-6 border-t border-[#F1F5F9]">
                              <div className="space-y-3">
                                 <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.4em] ml-6">Response Timer (Sec)</label>
                                 <div className="relative">
                                    <Clock className="absolute left-5 top-1/2 -translate-y-1/2 text-[#2563EB] w-4 h-4" />
                                    <input 
                                      type="text"
                                      value={newQuestion.time_limit || ""}
                                      onChange={(e) => {
                                        const val = e.target.value.replace(/[^0-9]/g, '');
                                        setNewQuestion({...newQuestion, time_limit: val ? parseInt(val) : ""})
                                      }}
                                      placeholder="00"
                                      className="w-full bg-[#F8FAFC] border-2 border-[#E2E8F0] rounded-[16px] py-4 pl-12 pr-6 text-sm font-black text-[#0F172A] focus:outline-none focus:border-[#2563EB] transition-all"
                                    />
                                 </div>
                              </div>
                              <div className="space-y-3">
                                 <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.4em] ml-6">Node Magnitude (Pts)</label>
                                 <div className="relative">
                                    <Target className="absolute left-5 top-1/2 -translate-y-1/2 text-amber-500 w-4 h-4" />
                                    <input 
                                      type="text"
                                      value={newQuestion.points || ""}
                                      onChange={(e) => {
                                        const val = e.target.value.replace(/[^0-9]/g, '');
                                        setNewQuestion({...newQuestion, points: val ? parseInt(val) : ""})
                                      }}
                                      placeholder="0"
                                      className="w-full bg-[#F8FAFC] border-2 border-[#E2E8F0] rounded-[16px] py-4 pl-12 pr-6 text-sm font-black text-[#0F172A] focus:outline-none focus:border-[#2563EB] transition-all"
                                    />
                                 </div>
                              </div>
                           </div>
                        </div>
                     </div>
                  </form>
               </div>

               {/* Protocol Navigation Matrix Terminal */}
               <div className="pt-10 border-t border-[#F1F5F9] bg-slate-50/50 rounded-b-[40px] p-12">
                  <div className="flex flex-col items-center gap-10">
                     <div className="flex items-center gap-6">
                        <div className="h-px w-16 bg-[#E2E8F0]" />
                        <p className="text-[11px] font-black text-[#64748B] uppercase tracking-[0.8em]">INTELLIGENCE NODE SELECTOR</p>
                        <div className="h-px w-16 bg-[#E2E8F0]" />
                     </div>
                     
                     <div className="w-full bg-white/80 border border-[#E2E8F0] rounded-[32px] p-4 shadow-inner">
                        <div className="flex items-center gap-3 overflow-x-auto pb-2 custom-scrollbar-hide px-4 scroll-smooth">
                           {questions.map((q, idx) => (
                              <button
                                key={q.id}
                                type="button"
                                onClick={() => {
                                  setEditingQuestionId(q.id);
                                  setNewQuestion({
                                    content: q.question_text || q.content || "",
                                    options: q.options || ["", "", "", ""],
                                    correct_answer: q.correct_answer || "A",
                                    time_limit: q.time_limit || 30,
                                    points: q.points || 100
                                  });
                                  window.scrollTo({ top: 300, behavior: 'smooth' });
                                }}
                                className={`flex-shrink-0 w-10 h-10 rounded-xl border-2 flex items-center justify-center text-sm font-black transition-all shadow-sm relative group active:scale-95 ${
                                  editingQuestionId === q.id 
                                    ? "bg-blue-600 border-blue-600 text-white" 
                                    : "bg-white border-[#E2E8F0] text-[#64748B] hover:border-[#2563EB] hover:text-[#2563EB] hover:bg-blue-50"
                                }`}
                              >
                                 {idx + 1}
                                 <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white shadow-sm ${
                                   editingQuestionId === q.id ? "bg-white" : "bg-emerald-500"
                                 }`} />
                              </button>
                           ))}
                           
                           <button
                             type="button"
                             onClick={() => {
                               setEditingQuestionId(null);
                               setNewQuestion({ content: "", options: ["", "", "", ""], correct_answer: "A", time_limit: 30, points: 100 });
                               window.scrollTo({ top: 300, behavior: 'smooth' });
                             }}
                             className={`flex-shrink-0 w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all active:scale-95 ml-2 ${
                               editingQuestionId === null 
                                 ? "bg-white border-blue-600 text-blue-600 shadow-lg shadow-blue-100" 
                                 : "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-700"
                             }`}
                           >
                              <Plus size={18} strokeWidth={3} />
                           </button>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>

         {/* Leaderboard & History Modal */}
         <AnimatePresence>
           {showLeaderboard && (
             <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8"
               onClick={() => setShowLeaderboard(false)}
             >
               <div className="absolute inset-0 bg-[#020617]/80 backdrop-blur-xl" />
               <motion.div
                 initial={{ opacity: 0, scale: 0.92, y: 30 }}
                 animate={{ opacity: 1, scale: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.92, y: 30 }}
                 className="relative w-full max-w-3xl max-h-[88vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                 onClick={(e) => e.stopPropagation()}
               >
                 {/* Modal Header */}
                 <div className="bg-[#0F172A] p-6 relative overflow-hidden flex-shrink-0">
                   <div className="absolute inset-0 opacity-10">
                     <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500 rounded-full blur-3xl" />
                     <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-emerald-500 rounded-full blur-3xl" />
                   </div>
                   <div className="relative z-10 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                       <div className="p-2 bg-white/10 rounded-xl border border-white/10">
                         <Trophy className="w-5 h-5 text-amber-400" />
                       </div>
                       <div>
                         <p className="text-[7px] font-black uppercase tracking-[0.5em] text-white/40 mb-0.5">Session Results</p>
                         <h2 className="text-lg font-black text-white uppercase tracking-tight leading-none">{quiz?.title || 'Quiz Results'}</h2>
                       </div>
                     </div>
                     <button onClick={() => setShowLeaderboard(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all">
                       <X size={14} className="text-white/60" />
                     </button>
                   </div>

                   {/* Stats */}
                   <div className="relative z-10 flex items-center gap-3 mt-4">
                     <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 rounded-lg border border-white/5">
                       <Users size={10} className="text-blue-400" />
                       <span className="text-[8px] font-black text-white/70">{leaderboard.length} <span className="text-white/30">PARTICIPANTS</span></span>
                     </div>
                     <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 rounded-lg border border-white/5">
                       <Hash size={10} className="text-blue-400" />
                       <span className="text-[8px] font-black text-white/70">{quiz?.access_code || 'N/A'} <span className="text-white/30">CODE</span></span>
                     </div>
                     <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 rounded-lg border border-white/5">
                       <BarChart2 size={10} className="text-blue-400" />
                       <span className="text-[8px] font-black text-white/70">{questions.length} <span className="text-white/30">QUESTIONS</span></span>
                     </div>
                   </div>

                   {/* Tab Switcher */}
                   <div className="relative z-10 flex gap-2 mt-4">
                     <button
                       onClick={() => setActiveResultTab('leaderboard')}
                       className={`px-4 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-1.5 ${
                         activeResultTab === 'leaderboard' ? 'bg-white text-[#0F172A]' : 'bg-white/5 text-white/50 hover:bg-white/10'
                       }`}
                     >
                       <Trophy size={10} /> Leaderboard
                     </button>
                     <button
                       onClick={() => setActiveResultTab('history')}
                       className={`px-4 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-1.5 ${
                         activeResultTab === 'history' ? 'bg-white text-[#0F172A]' : 'bg-white/5 text-white/50 hover:bg-white/10'
                       }`}
                     >
                       <History size={10} /> Attendance History
                     </button>
                   </div>
                 </div>

                 {/* Content */}
                 <div className="flex-1 overflow-y-auto">
                   {leaderboardLoading ? (
                     <div className="flex flex-col items-center justify-center py-20 gap-3">
                       <div className="w-8 h-8 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
                       <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">Loading data...</p>
                     </div>
                   ) : activeResultTab === 'leaderboard' ? (
                     <table className="w-full">
                       <thead className="sticky top-0 z-10">
                         <tr className="bg-slate-50 border-b border-slate-100">
                           <th className="text-[7px] font-black uppercase tracking-[0.3em] text-slate-400 py-2.5 px-4 text-left w-14">Rank</th>
                           <th className="text-[7px] font-black uppercase tracking-[0.3em] text-slate-400 py-2.5 px-4 text-left">Participant</th>
                           <th className="text-[7px] font-black uppercase tracking-[0.3em] text-slate-400 py-2.5 px-4 text-center w-24">Score</th>
                           <th className="text-[7px] font-black uppercase tracking-[0.3em] text-slate-400 py-2.5 px-4 text-center w-24">Attempts</th>
                           <th className="text-[7px] font-black uppercase tracking-[0.3em] text-slate-400 py-2.5 px-4 text-center w-16">Medal</th>
                         </tr>
                       </thead>
                       <tbody>
                         {leaderboard.length === 0 ? (
                           <tr>
                             <td colSpan={5} className="text-center py-16">
                               <Users size={28} className="mx-auto text-slate-200 mb-2" />
                               <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-300">No participants yet</p>
                             </td>
                           </tr>
                         ) : leaderboard.map((player, index) => (
                           <tr
                             key={player.id}
                             className={`border-b border-slate-50 transition-colors hover:bg-blue-50/50 ${
                               index === 0 ? 'bg-amber-50/50' : index === 1 ? 'bg-slate-50/30' : index === 2 ? 'bg-orange-50/20' : ''
                             }`}
                           >
                             <td className="py-3 px-4">
                               <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-[10px] ${
                                 index === 0 ? 'bg-amber-400 text-white' :
                                 index === 1 ? 'bg-slate-400 text-white' :
                                 index === 2 ? 'bg-orange-400 text-white' :
                                 'bg-slate-100 text-slate-400'
                               }`}>
                                 {index + 1}
                               </div>
                             </td>
                             <td className="py-3 px-4">
                               <div className="flex items-center gap-2.5">
                                 <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black ${
                                   index === 0 ? 'bg-amber-100 text-amber-700' : 'bg-blue-50 text-blue-600'
                                 }`}>
                                   {(player.full_name || '?')[0]?.toUpperCase()}
                                 </div>
                                 <div>
                                   <p className="text-xs font-bold text-[#0F172A] leading-tight">{player.full_name}</p>
                                   <p className="text-[7px] font-black uppercase tracking-widest text-slate-300 mt-0.5">{player.email || `ID: ${player.id?.toString().substring(0, 8)}`}</p>
                                 </div>
                               </div>
                             </td>
                             <td className="py-3 px-4 text-center">
                               <span className={`text-base font-black tabular-nums ${index === 0 ? 'text-amber-500' : 'text-[#0F172A]'}`}>
                                 {player.total_score || 0}
                               </span>
                             </td>
                             <td className="py-3 px-4 text-center">
                               <span className="text-xs font-black text-slate-500 tabular-nums">{player.submissions}</span>
                             </td>
                             <td className="py-3 px-4 text-center">
                               {index === 0 && <Crown size={16} className="mx-auto text-amber-400" />}
                               {index === 1 && <Medal size={16} className="mx-auto text-slate-400" />}
                               {index === 2 && <Award size={16} className="mx-auto text-orange-400" />}
                               {index > 2 && <span className="text-[8px] font-black text-slate-300">—</span>}
                             </td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                   ) : (
                     /* History Tab */
                     <div className="divide-y divide-slate-50">
                       {participantHistory.length === 0 ? (
                         <div className="text-center py-16">
                           <History size={28} className="mx-auto text-slate-200 mb-2" />
                           <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-300">No attendance records</p>
                         </div>
                       ) : participantHistory.map((entry, idx) => (
                         <div key={entry.id || idx} className="flex items-center justify-between px-6 py-3 hover:bg-slate-50/50 transition-colors">
                           <div className="flex items-center gap-3">
                             <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-[10px] font-black text-blue-600">
                               {(entry.full_name || '?')[0]?.toUpperCase()}
                             </div>
                             <div>
                               <p className="text-xs font-bold text-[#0F172A] leading-tight">{entry.full_name}</p>
                               <div className="flex items-center gap-2 mt-0.5">
                                 <Calendar size={8} className="text-slate-300" />
                                 <p className="text-[7px] font-black text-slate-400 uppercase tracking-wider">
                                   {entry.submitted_at ? new Date(entry.submitted_at).toLocaleString() : 'Unknown'}
                                 </p>
                               </div>
                             </div>
                           </div>
                           <div className="flex items-center gap-4">
                             {entry.time_taken && (
                               <div className="text-right">
                                 <p className="text-[7px] font-black text-slate-400 uppercase tracking-wider">Time</p>
                                 <p className="text-[10px] font-black text-[#0F172A]">{entry.time_taken}s</p>
                               </div>
                             )}
                             <div className="text-right">
                               <p className="text-[7px] font-black text-slate-400 uppercase tracking-wider">Score</p>
                               <p className="text-sm font-black text-blue-600">{entry.score}</p>
                             </div>
                           </div>
                         </div>
                       ))}
                     </div>
                   )}
                 </div>

                 {/* Modal Footer */}
                 <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between flex-shrink-0">
                   <p className="text-[7px] font-black uppercase tracking-[0.3em] text-slate-400">Skill Forge • {new Date().toLocaleDateString()}</p>
                   <div className="flex items-center gap-2">
                     <span className="text-[7px] font-black uppercase tracking-[0.2em] text-slate-400">{participantHistory.length} total submissions</span>
                   </div>
                 </div>
               </motion.div>
             </motion.div>
           )}
         </AnimatePresence>
    </div>
  );
}
