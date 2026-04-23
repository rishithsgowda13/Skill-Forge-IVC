"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trophy, 
  Clock, 
  Users, 
  ChevronRight,
  Monitor,
  ArrowRight,
  CircleCheck,
  Zap,
  PlayCircle,
  BarChart2,
  Medal,
  Award,
  ArrowLeft,
  ShieldAlert,
  AlertTriangle,
  MonitorOff,
  XCircle,
  FileDown,
  X,
  Eye,
  Hash,
  Crown
} from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";

export default function AdminHostPage() {
  const { code } = useParams();
  const router = useRouter();
  const supabase = createClient();
  
  const [quiz, setQuiz] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [joinCount, setJoinCount] = useState(0);
  const [presentUsers, setPresentUsers] = useState([]);
  const quizRef = useRef(null);
  const [timer, setTimer] = useState(0);
  const [showOptions, setShowOptions] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const timerRef = useRef(null);
  const channelRef = useRef(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [countdown, setCountdown] = useState(0);
  const [status, setStatus] = useState('lobby');
  const [loading, setLoading] = useState(true);
  const [activeRegistryTab, setActiveRegistryTab] = useState('leaderboard');
  const [violations, setViolations] = useState([]);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const presentUsersRef = useRef([]);

  const currentQuestion = useMemo(() => {
    if (!quiz?.questions || quiz.current_question_index === undefined) return null;
    return quiz.questions.find(q => q.order_index === quiz.current_question_index) || null;
  }, [quiz?.questions, quiz?.current_question_index]);

  const fetchLeaderboard = useCallback(async (quizId) => {
    // 1. Fetch all submissions with profiles for names
    const { data: subs, error } = await supabase
      .from("submissions")
      .select("user_id, points, profiles!user_id(full_name)")
      .eq("quiz_id", quizId);

    if (error) {
      console.error("fetchLeaderboard Error:", error);
      return;
    }

    // 2. Aggregate scores by user_id
    const leaderboardMap = new Map();
    subs?.forEach(sub => {
      const uid = sub.user_id;
      const current = leaderboardMap.get(uid) || { points: 0, full_name: null };
      
      leaderboardMap.set(uid, {
        points: current.points + (sub.points || 0),
        full_name: sub.profiles?.full_name || current.full_name
      });
    });

    // 3. Convert to array and sort
    const finalData = Array.from(leaderboardMap.entries()).map(([uid, stats]) => ({
      id: uid,
      user_id: uid,
      full_name: stats.full_name || `Node-${uid.toString().substring(0, 5)}`,
      total_score: stats.points,
      points: stats.points
    })).sort((a, b) => b.total_score - a.total_score);

    setLeaderboard(finalData);
  }, [supabase]);

  useEffect(() => {
    if (status === 'showing-question') {
      setShowOptions(false);
      const timer = setTimeout(() => setShowOptions(true), 3000);
      return () => clearTimeout(timer);
    } else {
      setShowOptions(false);
    }
  }, [status, currentQuestion?.id]);

  useEffect(() => {
    let active = true;

    async function loadHostData() {
      const { data: quizData } = await supabase
        .from("quizzes")
        .select("*, questions(*)")
        .eq("access_code", code.toUpperCase())
        .single();
      
      if (!active) return;
      if (!quizData) {
        router.push("/quiz/admin/quizzes");
        return;
      }
      
      setQuiz(quizData);
      quizRef.current = quizData;
      
      if (quizData.status === 'finished') {
        await supabase.from("quizzes").update({ status: 'lobby', current_question_index: 0 }).eq("id", quizData.id);
        setStatus('lobby');
      } else {
        setStatus(quizData.status || 'lobby');
      }
      
      setLoading(false);

      // Initial Data Load
      fetchLeaderboard(quizData.id);

      // Subscribe to communications and presence
      const canal_id = `quiz_session_${code.toUpperCase()}`;
      
      // Remove any existing instance with this name first to prevent callback conflicts
      const existingChannel = supabase.getChannels().find(c => c.name === canal_id);
      if (existingChannel) {
        await supabase.removeChannel(existingChannel);
      }
      
      if (!active) return;

      const channel = supabase
        .channel(canal_id)
        .on(
          'postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'submissions', filter: `quiz_id=eq.${quizData.id}` },
          () => fetchLeaderboard(quizData.id)
        )
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          const count = Object.keys(state).length;
          setJoinCount(count);

          const usersMap = {};
          Object.entries(state).forEach(([key, presences]) => {
            presences.forEach(p => {
              const userId = p.user_id || p.userId || p.id || key;
              const fullName = p.full_name || p.fullName || p.name || p.userName || `Node-${userId.toString().substring(0, 5)}`;
              if (userId) usersMap[userId] = fullName;
            });
          });
          
          const users = Object.entries(usersMap).map(([id, full_name]) => ({ id, full_name }));
          setPresentUsers(users);
          presentUsersRef.current = users;
          
          // Debounce/Throttle leaderboard fetch on presence sync to avoid hammering Supabase
          if (quizData?.id) {
             const now = Date.now();
             if (now - (window._lastLeaderboardFetch || 0) > 2000) {
                window._lastLeaderboardFetch = now;
                fetchLeaderboard(quizData.id);
             }
          }
        })
        .on('broadcast', { event: 'violation_detected' }, (payload) => {
          setViolations(prev => {
             const newViolation = payload.payload;
             const exists = prev.find(v => v.userId === newViolation.userId);
             if (exists) {
                return prev.map(v => v.userId === newViolation.userId ? { ...v, count: newViolation.count, type: newViolation.type, lastSeen: new Date().toISOString() } : v);
             }
             return [...prev, { ...newViolation, status: 'warning', lastSeen: new Date().toISOString() }];
          });
        })
        .on('broadcast', { event: 'session_terminated' }, (payload) => {
           setViolations(prev => {
              const terminatedUser = payload.payload;
              const exists = prev.find(v => v.userId === terminatedUser.userId);
              if (exists) {
                 return prev.map(v => v.userId === terminatedUser.userId ? { ...v, status: 'terminated', lastSeen: new Date().toISOString() } : v);
              }
              return [...prev, { ...terminatedUser, status: 'terminated', lastSeen: new Date().toISOString(), type: 'MAX_VIOLATIONS_REACHED' }];
           });
        });

      channelRef.current = channel;

      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log("NEURAL LINK ESTABLISHED:", canal_id);
        }
      });

      const heartbeat = setInterval(() => {
        if (quizRef.current && channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'state_update',
            payload: quizRef.current
          });
        }
      }, 10000);

      return () => {
        active = false;
        if (channelRef.current) {
          supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        }
        clearInterval(heartbeat);
        clearInterval(timerRef.current);
      };
    }
    loadHostData();

    const handleUnload = (e) => {
      if (quizRef.current?.id && quizRef.current?.status !== 'finished') {
         // navigator.sendBeacon is more reliable for unload events
         const payload = JSON.stringify({ status: 'finished' });
         // We can't easily use supabase client in synchronous unload, but we can attempt a fire-and-forget
         supabase.from("quizzes").update({ status: 'finished' }).eq("id", quizRef.current.id).then();
      }
    };

    window.addEventListener('beforeunload', handleUnload);

    return () => {
      active = false;
      if (quizRef.current?.id && quizRef.current?.status !== 'finished') {
        // Fallback for component unmount (e.g. Next.js router back button)
        supabase.from("quizzes").update({ status: 'finished' }).eq("id", quizRef.current.id).then();
      }
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [code, supabase]);

  // currentQuestion is now derived via useMemo above for better sync

  const updateQuizStatus = async (newStatus, questionIndex = null) => {
    if (!quiz?.id) return;
    
    const payload = { status: newStatus };
    if (questionIndex !== null) payload.current_question_index = questionIndex;
    
    await supabase.from("quizzes").update(payload).eq("id", quiz.id);
    
    const canal_id = `quiz_session_${code.toUpperCase()}`;
    const channel = channelRef.current || supabase.channel(canal_id);
    
    await channel.send({
      type: 'broadcast',
      event: 'state_update',
      payload: { ...quiz, ...payload }
    });
    
    setQuiz(prev => {
       const updated = { ...prev, ...payload };
       quizRef.current = updated;
       return updated;
    });
    setStatus(newStatus);
    
    if (quiz?.id) fetchLeaderboard(quiz.id);
  };

  const executeCountdown = async (callback) => {
    setStatus('countdown');
    await supabase.from("quizzes").update({ status: 'countdown' }).eq("id", quiz.id);
    
    let count = 3;
    setCountdown(count);
    const interval = setInterval(() => {
      count -= 1;
      setCountdown(count);
      if (count <= 0) {
        clearInterval(interval);
        callback();
      }
    }, 1000);
  };

  const resetQuiz = async () => {
    if (!quiz?.id) return;
    await supabase.from("submissions").delete().eq("quiz_id", quiz.id);
    setLeaderboard([]);
    await updateQuizStatus('lobby', 0);
  };

  const terminateSession = async () => {
    if (quiz?.id && status !== 'finished') {
      await updateQuizStatus('finished');
    }
    router.push('/quiz/admin');
  };

  const recalibrateNode = useCallback(async () => {
    if (!quiz?.id) return;
    setRefreshing(true);
    
    const { data: quizData } = await supabase
      .from("quizzes")
      .select("*, questions(*)")
      .eq("access_code", code.toUpperCase())
      .single();
    
    if (quizData) {
      setQuiz(quizData);
      quizRef.current = quizData;
      
      if (channelRef.current) {
        const state = channelRef.current.presenceState();
        const usersMap = {};
        Object.entries(state).forEach(([key, presences]) => {
          presences.forEach(p => {
            const userId = p.user_id || p.userId || p.id || key;
            const fullName = p.full_name || p.fullName || p.name || p.userName || `Node-${userId.toString().substring(0, 5)}`;
            if (userId) usersMap[userId] = fullName;
          });
        });
        const users = Object.entries(usersMap).map(([id, full_name]) => ({ id, full_name }));
        setPresentUsers(users);
        await fetchLeaderboard(quizData.id);
       } else {
         await fetchLeaderboard(quizData.id);
       }
    }
    
    setTimeout(() => setRefreshing(false), 1000);
  }, [code, quiz?.id, supabase, fetchLeaderboard]);

  const startQuiz = async () => {
    if (!quiz?.id) return;
    await supabase.from("submissions").delete().eq("quiz_id", quiz.id);
    setLeaderboard([]);
    
    executeCountdown(async () => {
      const firstQuestion = quiz.questions[0];
      const timeLimit = firstQuestion?.time_limit || 30;
      await updateQuizStatus('showing-question', 0);
      setTimeout(() => startTimer(timeLimit), 3000);
    });
  };

  const nextQuestion = async () => {
    const nextIdx = quiz.current_question_index + 1;
    if (nextIdx < quiz.questions.length) {
      executeCountdown(async () => {
        const nextQuestion = quiz.questions[nextIdx];
        const timeLimit = nextQuestion?.time_limit || 30;
        await updateQuizStatus('showing-question', nextIdx);
        setTimeout(() => startTimer(timeLimit), 3000);
      });
    } else {
      await updateQuizStatus('finished');
    }
  };

  const showResults = async () => {
    await updateQuizStatus('showing-results');
  };

  const handleTimerEnd = async () => {
    await showResults();
    if (quiz?.id) fetchLeaderboard(quiz.id);
  };

  const startTimer = (seconds) => {
    clearInterval(timerRef.current);
    setTimer(seconds);
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimerEnd();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(quiz?.title?.toUpperCase() || 'QUIZ RESULTS', pageWidth / 2, 22, { align: 'center' });
    
    // Subtitle
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    doc.text(`Access Code: ${code?.toUpperCase()} | Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 30, { align: 'center' });
    doc.text(`Total Participants: ${leaderboard.length}`, pageWidth / 2, 36, { align: 'center' });
    
    // Separator line
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 40, pageWidth - 14, 40);
    
    // Table
    doc.setTextColor(0, 0, 0);
    const tableData = leaderboard.map((player, index) => [
      index + 1,
      player.full_name || `Node-${player.id?.toString().substring(0, 8)}`,
      player.total_score || 0,
      index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '-'
    ]);
    
    doc.autoTable({
      startY: 44,
      head: [['RANK', 'PARTICIPANT NAME', 'SCORE', 'MEDAL']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'center',
        cellPadding: 4,
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 3.5,
        halign: 'center',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { cellWidth: 20, halign: 'center' },
        1: { halign: 'left', cellWidth: 'auto' },
        2: { cellWidth: 30, halign: 'center', fontStyle: 'bold' },
        3: { cellWidth: 25, halign: 'center' },
      },
      margin: { left: 14, right: 14 },
      didDrawPage: (data) => {
        // Footer
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(7);
        doc.setTextColor(160, 160, 160);
        doc.text(
          `SKILL FORGE • Page ${data.pageNumber} of ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      },
    });
    
    doc.save(`${quiz?.title?.replace(/\s+/g, '_') || 'quiz'}_results_${code?.toUpperCase()}.pdf`);
  };

  if (loading) return null;

  return (
    <div className="h-screen bg-[#020617] text-white flex flex-col lg:flex-row font-sans overflow-hidden selection:bg-primary-blue/30 relative">
       <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary-blue/10 rounded-full blur-[120px]" />
          <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-primary-blue/5 rounded-full blur-[100px]" />
       </div>

       <div className="flex-1 flex flex-col p-6 md:p-12 relative overflow-hidden z-10">
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 w-full">
             <div className="flex items-center gap-4">
                <button 
                  onClick={terminateSession}
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all group mr-2"
                >
                  <ArrowLeft className="w-4 h-4 text-white/60 group-hover:text-white transition-colors" />
                </button>
                <div className="p-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-xl shadow-2xl">
                   <Zap className="text-primary-blue w-5 h-5 fill-primary-blue/20" />
                </div>
                <div>
                   <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 rounded-full bg-primary-blue animate-pulse" />
                      <h2 className="text-xs font-black uppercase tracking-[0.4em] text-white/40 leading-none">Command Terminal</h2>
                   </div>
                   <h1 className="text-3xl font-black uppercase tracking-tighter leading-none">{quiz.title}</h1>
                </div>
             </div>

              <div className="bg-white/5 backdrop-blur-md border border-white/10 p-1 rounded-2xl flex items-center gap-1 shadow-xl">
                 <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl border border-white/5">
                    <Users className="text-primary-blue w-3 h-3" />
                    <span className="text-xs font-black text-white">{joinCount} <span className="text-white/40 text-[8px] tracking-widest ml-1">NODES</span></span>
                 </div>
                 <div className="px-2.5 py-1 bg-white text-[#0F172A] rounded-xl shadow-lg">
                    <span className="text-[5px] font-black uppercase tracking-[0.4em] opacity-30 block mb-0.5">Access Key</span>
                    <span className="text-sm font-black tracking-[0.2em] leading-none uppercase">{code}</span>
                 </div>
              </div>
          </header>

          <main className="flex-1 flex flex-col items-center justify-center max-w-3xl mx-auto w-full relative">
             <AnimatePresence mode="wait">
                {status === 'lobby' && (
                  <motion.div
                    key="lobby"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex flex-col items-center text-center space-y-8 w-full"
                  >
                     <div className="space-y-4">
                        <div className="relative w-fit mx-auto">
                           <div className="absolute inset-0 bg-primary-blue/20 blur-[60px] rounded-full" />
                           <div className="relative p-6 bg-white/5 rounded-[36px] border border-white/10 backdrop-blur-3xl shadow-xl">
                              <Users size={44} className="text-primary-blue" />
                           </div>
                        </div>
                        <div className="space-y-2">
                           <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-none">JOIN THE <span className="text-primary-blue">NODE</span></h1>
                           <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.5em]">Synchronizing neural handshake signals</p>
                        </div>
                     </div>

                     <button 
                       onClick={startQuiz}
                       className="bg-primary-blue hover:bg-blue-600 px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-[0.4em] transition-all flex items-center gap-3 group shadow-xl hover:scale-[1.02] active:scale-95 text-white"
                     >
                        <span>Initialize Protocol</span>
                        <PlayCircle size={16} className="opacity-40 group-hover:opacity-100 transition-opacity" />
                     </button>
                  </motion.div>
                )}

                 {status === 'countdown' && (
                    <motion.div
                      key="countdown"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 2 }}
                      className="flex flex-col items-center justify-center space-y-8"
                    >
                       <div className="relative">
                          <div className="absolute inset-0 bg-primary-blue/20 blur-[100px] rounded-full animate-pulse" />
                          <div className="relative w-48 h-48 rounded-full border-4 border-white/10 flex items-center justify-center backdrop-blur-3xl">
                             <span className="text-9xl font-black italic tracking-tighter text-white drop-shadow-2xl">{countdown}</span>
                          </div>
                       </div>
                       <div className="space-y-2 text-center">
                          <h2 className="text-xl font-black uppercase tracking-[0.6em] text-primary-blue animate-pulse">Initializing Question</h2>
                          <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Neural handshake in progress...</p>
                       </div>
                    </motion.div>
                 )}

                  {status === 'showing-question' && (
                   <motion.div
                     key="question"
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, x: -50 }}
                     className="w-full space-y-8"
                   >
                      {!currentQuestion ? (
                        <div className="flex flex-col items-center justify-center p-20 bg-white/5 border border-dashed border-white/10 rounded-[56px] animate-pulse space-y-4">
                           <div className="flex items-center gap-4 text-primary-blue text-[11px] font-black uppercase tracking-[0.5em]">
                              <Clock className="animate-spin" size={20} />
                              <span>RECONSTRUCTING QUESTION DATA...</span>
                           </div>
                        </div>
                      ) : (
                        <>
                          <div className="bg-white/5 border border-white/10 p-10 md:p-12 rounded-[48px] backdrop-blur-3xl overflow-hidden relative shadow-2xl">
                             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                                <div className="flex items-center gap-4">
                                   <span className="bg-blue-500/20 text-blue-400 px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] border border-blue-500/20">Module 0{quiz.current_question_index + 1}</span>
                                   <div className="h-px w-8 bg-white/10" />
                                </div>
                                
                                <div className="flex items-center gap-5 bg-black/20 px-6 py-3 rounded-3xl border border-white/5">
                                   <div className="text-right">
                                      <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-0.5">Time Remaining</p>
                                      <p className="text-2xl font-black tabular-nums tracking-tighter leading-none">{timer}</p>
                                   </div>
                                   <div className="w-10 h-10 rounded-full border-2 border-white/5 flex items-center justify-center relative">
                                      <svg className="absolute inset-0 w-full h-full -rotate-90">
                                         <circle 
                                           cx="20" cy="20" r="18" 
                                           className="stroke-blue-500/10 fill-none" 
                                           strokeWidth="3" 
                                         />
                                         <motion.circle 
                                           cx="20" cy="20" r="18" 
                                           className="stroke-blue-500 fill-none" 
                                           strokeWidth="3" 
                                           strokeDasharray="113.1"
                                           initial={{ strokeDashoffset: 0 }}
                                           animate={{ strokeDashoffset: 113.1 - (113.1 * (timer / (currentQuestion.time_limit || 30))) }}
                                         />
                                      </svg>
                                      <Clock className="w-4 h-4 text-blue-400 opacity-40" />
                                   </div>
                                </div>
                             </div>
    
                             <div className="relative z-10">
                                <h2 className="text-3xl md:text-4xl font-black leading-tight tracking-tight uppercase max-w-2xl">{currentQuestion.content || currentQuestion.question_text}</h2>
                             </div>
                          </div>
    
                          {showOptions ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                               {currentQuestion.options?.map((opt, idx) => {
                                   const bgColors = ['bg-blue-600', 'bg-red-600', 'bg-amber-600', 'bg-emerald-600'];
                                   const labels = ['A', 'B', 'C', 'D'];
                                   return (
                                      <motion.div 
                                        key={idx}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1, transition: { delay: idx * 0.1 } }}
                                        className="flex items-center gap-6 p-6 bg-white/5 border border-white/10 rounded-[32px] shadow-xl relative overflow-hidden"
                                      >
                                         <div className={`${bgColors[idx]} w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg relative z-10 text-white`}>
                                            {labels[idx]}
                                         </div>
                                         <span className="text-lg md:text-xl font-bold tracking-tight text-white/80 relative z-10">{opt}</span>
                                      </motion.div>
                                   )
                               })}
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center p-20 bg-white/5 border border-dashed border-white/10 rounded-[56px] animate-pulse space-y-4">
                               <div className="flex items-center gap-4 text-primary-blue text-[11px] font-black uppercase tracking-[0.5em]">
                                  <Zap className="animate-bounce" />
                                  <span>BROADCAST SYNC IN PROGRESS</span>
                               </div>
                            </div>
                          )}
                        </>
                      )}
                    </motion.div>
                 )}

                {status === 'showing-results' && currentQuestion && (
                   <motion.div
                     key="results"
                     initial={{ opacity: 0, scale: 0.9 }}
                     animate={{ opacity: 1, scale: 1 }}
                     className="space-y-12 text-center py-20"
                   >
                      <div className="space-y-6">
                         <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                            <CircleCheck className="text-emerald-500 w-10 h-10" />
                         </div>
                         <h2 className="text-6xl font-black leading-tight tracking-tight uppercase text-emerald-400 max-w-4xl mx-auto">
                            {currentQuestion.options?.[['A','B','C','D'].indexOf(currentQuestion.correct_answer)] || currentQuestion.correct_answer}
                         </h2>
                      </div>

                      <button 
                        onClick={nextQuestion}
                        className="bg-white text-[#020617] px-12 py-5 rounded-3xl text-sm font-black uppercase tracking-[0.4em] transition-all flex items-center gap-4 mx-auto hover:bg-primary-blue hover:text-white group shadow-2xl"
                      >
                         <span>Next Protocol</span>
                         <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
                      </button>
                   </motion.div>
                )}

                {status === 'finished' && (
                   <motion.div
                     key="finished"
                     initial={{ opacity: 0, scale: 0.9 }}
                     animate={{ opacity: 1, scale: 1 }}
                     className="space-y-12 text-center"
                   >
                      <div className="space-y-8">
                         <Trophy size={120} className="text-amber-400 mx-auto" />
                         <h1 className="text-6xl font-black tracking-[0.1em] uppercase leading-none">ELITE NODE ESTABLISHED</h1>
                      </div>

                      <div className="flex flex-wrap gap-4 justify-center">
                         <button 
                           onClick={() => setShowResultsModal(true)}
                           className="bg-white text-[#020617] px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-95 shadow-xl"
                         >
                           <Eye size={14} />
                           View Full Results
                         </button>
                         <button 
                           onClick={exportToPDF}
                           className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-95 shadow-xl"
                         >
                           <FileDown size={14} />
                           Export PDF
                         </button>
                      </div>
                      <div className="flex gap-4 justify-center">
                         <button 
                           onClick={() => setStatus('lobby')}
                           className="bg-white/5 border border-white/10 px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] transition-all backdrop-blur-md"
                         >
                           Reset Node
                         </button>
                         <button 
                           onClick={() => router.push('/quiz/admin/quizzes')}
                           className="bg-primary-blue px-10 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] transition-all"
                         >
                           Finalize Matrix
                         </button>
                      </div>
                   </motion.div>
                )}
             </AnimatePresence>
          </main>
       </div>

        {/* Global Registry Sidebar */}
        <div className="w-full lg:w-[320px] bg-[#020617] lg:bg-white text-white lg:text-[#0F172A] flex flex-col p-5 overflow-hidden relative border-l border-white/5 lg:border-gray-100">
          <div className="relative z-10 mb-5">
             <div className="flex items-center gap-3 mb-6">
                <div className="p-1.5 bg-primary-blue/10 lg:bg-blue-50 rounded-[12px]">
                   <Medal className="text-primary-blue w-3.5 h-3.5" />
                </div>
                <h3 className="text-base font-black uppercase tracking-tighter">Elite Registry</h3>
             </div>
             
             <div className="flex p-1 bg-white/5 lg:bg-slate-100 rounded-[20px] mb-6 gap-1">
                <button 
                   onClick={() => setActiveRegistryTab('leaderboard')}
                   className={`flex-1 py-2.5 px-3 rounded-[15px] text-[8px] font-black uppercase tracking-widest transition-all ${
                     activeRegistryTab === 'leaderboard' 
                     ? 'bg-[#0F172A] lg:bg-white text-white lg:text-[#0F172A] shadow-md' 
                     : 'text-white/40 lg:text-slate-400 hover:text-white lg:hover:text-[#0F172A]'
                   }`}
                >
                   Leaderboard
                </button>
                <button 
                   onClick={() => setActiveRegistryTab('violations')}
                   className={`flex-1 py-2.5 px-3 rounded-[15px] text-[8px] font-black uppercase tracking-widest transition-all relative ${
                     activeRegistryTab === 'violations' 
                     ? 'bg-[#0F172A] lg:bg-white text-white lg:text-[#0F172A] shadow-md' 
                     : 'text-white/40 lg:text-slate-400 hover:text-white lg:hover:text-[#0F172A]'
                   }`}
                >
                   Threat Intel
                   {violations.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[7px] flex items-center justify-center rounded-full animate-pulse border-2 border-white lg:border-slate-100">
                         {violations.length}
                      </span>
                   )}
                </button>
             </div>
 
             <div className="flex justify-between items-end mb-2">
                <p className="text-[8px] font-black text-[#94A3B8] uppercase tracking-[0.3em] leading-none">
                   {activeRegistryTab === 'leaderboard' ? 'Global Ranking Matrix' : 'Integrity Breach Logs'}
                </p>
                <span className="text-[7px] font-black uppercase text-primary-blue opacity-50">
                   {activeRegistryTab === 'leaderboard' ? leaderboard.length : violations.length} RECORDS
                </span>
             </div>
             <div className="w-full h-1 bg-white/5 lg:bg-gray-100 flex overflow-hidden rounded-full">
                <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: activeRegistryTab === 'leaderboard' ? '40%' : '100%' }}
                   className={`h-full ${activeRegistryTab === 'leaderboard' ? 'bg-primary-blue' : 'bg-rose-500'}`} 
                />
             </div>
          </div>
 
          <div className="flex-1 space-y-2 overflow-y-auto pr-1 custom-scrollbar relative z-10 py-1">
             <AnimatePresence mode="wait">
                {activeRegistryTab === 'leaderboard' ? (
                   <motion.div 
                     key="leaderboard-tab"
                     initial={{ opacity: 0, x: 15 }}
                     animate={{ opacity: 1, x: 0 }}
                     exit={{ opacity: 0, x: -15 }}
                     className="space-y-2"
                   >
                      {leaderboard.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center space-y-3 opacity-10 py-16">
                           <Users size={32} strokeWidth={1} />
                           <p className="text-[7px] font-black uppercase tracking-[0.3em] text-center">Awaiting Node Connections</p>
                        </div>
                      ) : leaderboard.map((player, index) => (
                         <motion.div
                           key={player.id}
                           layout
                           initial={{ opacity: 0, x: 20 }}
                           animate={{ opacity: 1, x: 0 }}
                           className={`flex items-center justify-between p-3.5 rounded-[16px] border ${
                             index === 0 ? 'bg-[#0F172A] text-white border-[#0F172A] shadow-xl scale-[1.01] ring-2 ring-primary-blue/5' : 
                             'bg-white/5 lg:bg-white border-white/5 lg:border-[#F1F5F9]'
                           } transition-all relative overflow-hidden`}
                         >
                            <div className="flex items-center gap-4 relative z-10">
                               <div className={`w-7 h-7 rounded-[10px] flex items-center justify-center font-black text-xs ${
                                 index === 0 ? 'bg-amber-400 text-[#0F172A]' : 'bg-gray-500/5 text-gray-400'
                               }`}>
                                 {index + 1}
                               </div>
                               <div className="flex flex-col">
                                  <span className="text-[11px] font-black uppercase tracking-tight truncate max-w-[120px]">
                                    {player.full_name}
                                  </span>
                                  <span className="text-[7px] font-black uppercase tracking-widest opacity-40">Verified</span>
                               </div>
                            </div>
                            <div className="text-right relative z-10">
                               <span className={`text-base font-black tabular-nums ${index === 0 ? 'text-amber-400' : 'text-[#0F172A]'}`}>
                                 {player.total_score || 0}
                               </span>
                               <p className="text-[8px] font-black uppercase opacity-30 mt-0.5">PTS</p>
                            </div>
                         </motion.div>
                      ))}
                   </motion.div>
                ) : (
                   <motion.div 
                     key="violations-tab"
                     initial={{ opacity: 0, x: 15 }}
                     animate={{ opacity: 1, x: 0 }}
                     exit={{ opacity: 0, x: -15 }}
                     className="space-y-2"
                   >
                      {violations.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center space-y-3 opacity-10 py-16">
                           <ShieldAlert size={32} strokeWidth={1} />
                           <p className="text-[7px] font-black uppercase tracking-[0.3em] text-center">No Protocol Breaches Detected</p>
                        </div>
                      ) : violations.map((v, index) => (
                         <motion.div
                           key={v.userId}
                           initial={{ opacity: 0, y: 8 }}
                           animate={{ opacity: 1, y: 0 }}
                           className={`flex items-center justify-between p-3.5 rounded-[16px] transition-all ${
                              v.status === 'terminated' ? 'bg-rose-500/10 border-rose-500/30' : 'bg-amber-500/5 border-amber-500/20'
                           } border`}
                         >
                            <div className="flex items-center gap-3">
                               <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${v.status === 'terminated' ? 'bg-rose-600 text-white' : 'bg-amber-100 text-amber-600'}`}>
                                  {v.status === 'terminated' ? <MonitorOff size={14} /> : <AlertTriangle size={14} />}
                               </div>
                               <div className="flex flex-col">
                                  <span className={`text-[11px] font-black uppercase tracking-tight ${v.status === 'terminated' ? 'text-rose-500' : 'text-[#0F172A]'}`}>{v.userName}</span>
                                  <span className={`text-[7px] font-black uppercase tracking-widest mt-0.5 ${v.status === 'terminated' ? 'text-rose-500/60' : 'text-amber-600/60'}`}>
                                     {v.status === 'terminated' ? 'NODE_TERMINATED' : `${v.count} BREACHES`}
                                  </span>
                               </div>
                            </div>
                            <div className="text-right">
                               <div className="text-[7px] font-black text-[#94A3B8] uppercase tracking-widest">Breach</div>
                               <div className="text-[8px] font-black text-[#0F172A] uppercase truncate max-w-[80px]">{v.type?.split(' ')[0]}...</div>
                            </div>
                         </motion.div>
                      ))}
                   </motion.div>
                )}
             </AnimatePresence>
          </div>
 
          <div className="mt-auto pt-4 space-y-2">
              <button 
                onClick={() => setShowResultsModal(true)}
                className="w-full py-2.5 bg-[#0F172A] lg:bg-primary-blue text-white rounded-xl text-[7px] font-black uppercase tracking-[0.3em] hover:opacity-90 transition-all flex items-center justify-center gap-2"
              >
                <Eye size={8} />
                <span>View Full Results</span>
              </button>
              <button 
                onClick={recalibrateNode}
                disabled={refreshing}
                className="w-full py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[7px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-primary-blue hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
              >
                <Zap size={8} className={`${refreshing ? "animate-bounce" : ""}`} />
                <span>{refreshing ? "Synchronizing Matrix..." : "Recalibrate Neural Node"}</span>
              </button>
          </div>
        </div>

        {/* Full Results Modal */}
        <AnimatePresence>
          {showResultsModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
              onClick={() => setShowResultsModal(false)}
            >
              {/* Backdrop */}
              <div className="absolute inset-0 bg-[#020617]/90 backdrop-blur-xl" />
              
              {/* Modal */}
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 30 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="relative w-full max-w-3xl max-h-[85vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="bg-[#0F172A] p-6 md:p-8 relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary-blue rounded-full blur-3xl" />
                    <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-500 rounded-full blur-3xl" />
                  </div>
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 bg-white/10 rounded-2xl border border-white/10">
                        <Trophy className="w-6 h-6 text-amber-400" />
                      </div>
                      <div>
                        <p className="text-[8px] font-black uppercase tracking-[0.5em] text-white/40 mb-1">Final Leaderboard</p>
                        <h2 className="text-xl font-black text-white uppercase tracking-tight">{quiz?.title || 'Quiz Results'}</h2>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={exportToPDF}
                        className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all hover:scale-[1.03] active:scale-95 shadow-lg"
                      >
                        <FileDown size={13} />
                        Export PDF
                      </button>
                      <button
                        onClick={() => setShowResultsModal(false)}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
                      >
                        <X size={16} className="text-white/60" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Stats Bar */}
                  <div className="relative z-10 flex items-center gap-4 mt-5">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/5">
                      <Users size={11} className="text-primary-blue" />
                      <span className="text-[9px] font-black text-white/70">{leaderboard.length} <span className="text-white/30">PARTICIPANTS</span></span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/5">
                      <Hash size={11} className="text-primary-blue" />
                      <span className="text-[9px] font-black text-white/70">{code?.toUpperCase()} <span className="text-white/30">ACCESS CODE</span></span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/5">
                      <BarChart2 size={11} className="text-primary-blue" />
                      <span className="text-[9px] font-black text-white/70">{quiz?.questions?.length || 0} <span className="text-white/30">QUESTIONS</span></span>
                    </div>
                  </div>
                </div>
                
                {/* Table */}
                <div className="flex-1 overflow-y-auto">
                  <table className="w-full">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400 py-3 px-4 text-left w-16">Rank</th>
                        <th className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400 py-3 px-4 text-left">Participant</th>
                        <th className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400 py-3 px-4 text-center w-24">Score</th>
                        <th className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400 py-3 px-4 text-center w-20">Medal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center py-20">
                            <Users size={32} className="mx-auto text-slate-200 mb-3" />
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">No participants yet</p>
                          </td>
                        </tr>
                      ) : leaderboard.map((player, index) => (
                        <tr
                          key={player.id}
                          className={`border-b border-slate-50 transition-colors hover:bg-blue-50/50 ${
                            index === 0 ? 'bg-amber-50/60' : index === 1 ? 'bg-slate-50/40' : index === 2 ? 'bg-orange-50/30' : ''
                          }`}
                        >
                          <td className="py-3.5 px-4">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs ${
                              index === 0 ? 'bg-amber-400 text-white' : 
                              index === 1 ? 'bg-slate-400 text-white' : 
                              index === 2 ? 'bg-orange-400 text-white' : 
                              'bg-slate-100 text-slate-400'
                            }`}>
                              {index + 1}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black ${
                                index === 0 ? 'bg-amber-100 text-amber-700' : 'bg-primary-blue/10 text-primary-blue'
                              }`}>
                                {(player.full_name || '?')[0]?.toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-[#0F172A] leading-tight">{player.full_name}</p>
                                <p className="text-[8px] font-black uppercase tracking-widest text-slate-300 mt-0.5">ID: {player.id?.toString().substring(0, 8)}...</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className={`text-lg font-black tabular-nums ${
                              index === 0 ? 'text-amber-500' : 'text-[#0F172A]'
                            }`}>
                              {player.total_score || 0}
                            </span>
                            <p className="text-[7px] font-black uppercase text-slate-300 mt-0.5">Points</p>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {index === 0 && <Crown size={18} className="mx-auto text-amber-400" />}
                            {index === 1 && <Medal size={18} className="mx-auto text-slate-400" />}
                            {index === 2 && <Award size={18} className="mx-auto text-orange-400" />}
                            {index > 2 && <span className="text-[9px] font-black text-slate-300">—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Modal Footer */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <p className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400">Skill Forge • {new Date().toLocaleDateString()}</p>
                  <button
                    onClick={exportToPDF}
                    className="flex items-center gap-2 px-4 py-2 bg-[#0F172A] hover:bg-[#1E293B] text-white rounded-lg text-[8px] font-black uppercase tracking-[0.2em] transition-all"
                  >
                    <FileDown size={10} />
                    Download as PDF
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
    </div>
  );
}
