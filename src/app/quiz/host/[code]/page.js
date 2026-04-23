"use client";

import { useEffect, useState, useRef } from "react";
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
  XCircle
} from "lucide-react";

export default function AdminHostPage() {
  const { code } = useParams();
  const router = useRouter();
  const supabase = createClient();
  
  const [quiz, setQuiz] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [joinCount, setJoinCount] = useState(0);
  const [presentUsers, setPresentUsers] = useState([]);
  const quizRef = useRef(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [status, setStatus] = useState('lobby');
  const [loading, setLoading] = useState(true);
  const [timer, setTimer] = useState(0);
  const [showOptions, setShowOptions] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const timerRef = useRef(null);
  const channelRef = useRef(null);
  const [activeRegistryTab, setActiveRegistryTab] = useState('leaderboard');
  const [violations, setViolations] = useState([]);

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
          if (quizData?.id) fetchLeaderboard(quizData.id, users);
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

    return () => {
      active = false;
    };
  }, [code]);

  async function fetchLeaderboard(quizId, currentPresentUsers = null) {
    const { data, error } = await supabase
      .from("submissions")
      .select("user_id, points, profiles!user_id(full_name)")
      .eq("quiz_id", quizId);

    const usersToMerge = currentPresentUsers || presentUsers;
    const presentIds = usersToMerge.map(u => u.id).filter(id => id && !id.startsWith('guest-') && !id.startsWith('mock_'));
    
    let profilesData = [];
    if (presentIds.length > 0) {
      const { data: pData } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', presentIds);
      profilesData = pData || [];
    }

    if (error) {
      console.warn("LEADERBOARD SYNC WARNING:", error.message);
      setLeaderboard(usersToMerge);
      return;
    }

    const scoreMap = (data || []).reduce((acc, curr) => {
      const uid = curr.user_id;
      if (!uid) return acc;
      acc[uid] = (acc[uid] || 0) + (curr.points || 0);
      return acc;
    }, {});

    const allUserIds = new Set([
      ...Object.keys(scoreMap),
      ...usersToMerge.map(u => u.id)
    ].filter(id => id));

    const merged = Array.from(allUserIds).map(uid => {
      const pres = usersToMerge.find(u => u.id === uid);
      const subProfile = data?.find(s => s.user_id === uid)?.profiles;
      const directProfile = profilesData.find(p => p.id === uid);
      const fullName = directProfile?.full_name || subProfile?.full_name || pres?.full_name || `Node-${uid.toString().substring(0, 5)}`;
      
      return {
        id: uid,
        full_name: fullName,
        total_score: scoreMap[uid] || 0,
        points: scoreMap[uid] || 0
      };
    }).sort((a, b) => (b.total_score || 0) - (a.total_score || 0));

    setLeaderboard(merged);
  }

  useEffect(() => {
    if (quiz && quiz.questions && quiz.current_question_index !== undefined) {
      const q = quiz.questions.find(qt => qt.order_index === quiz.current_question_index);
      setCurrentQuestion(q);
    }
  }, [quiz]);

  const updateQuizStatus = async (newStatus, index = null) => {
    const payload = { status: newStatus };
    if (index !== null) payload.current_question_index = index;
    
    await supabase.from("quizzes").update(payload).eq("id", quiz.id);
    
    const channel = supabase.channel(`quiz_session_${code.toUpperCase()}`);
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

  const recalibrateNode = async () => {
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
        await fetchLeaderboard(quizData.id, users);
      } else {
        await fetchLeaderboard(quizData.id);
      }
    }
    
    setTimeout(() => setRefreshing(false), 1000);
  };

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
                  onClick={() => router.push('/quiz/admin')}
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all group mr-2"
                >
                  <ArrowLeft className="w-5 h-5 text-white/60 group-hover:text-white transition-colors" />
                </button>
                <div className="p-4 bg-white/5 rounded-[22px] border border-white/10 backdrop-blur-xl shadow-2xl">
                   <Zap className="text-primary-blue w-7 h-7 fill-primary-blue/20" />
                </div>
                <div>
                   <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 rounded-full bg-primary-blue animate-pulse" />
                      <h2 className="text-xs font-black uppercase tracking-[0.4em] text-white/40 leading-none">Command Terminal</h2>
                   </div>
                   <h1 className="text-3xl font-black uppercase tracking-tighter leading-none">{quiz.title}</h1>
                </div>
             </div>

              <div className="bg-white/5 backdrop-blur-md border border-white/10 p-1 rounded-[20px] flex items-center gap-1 shadow-xl">
                 <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-[15px] border border-white/5">
                    <Users className="text-primary-blue w-3.5 h-3.5" />
                    <span className="text-xs font-black text-white">{joinCount} <span className="text-white/40 text-[9px] tracking-widest ml-1">NODES</span></span>
                 </div>
                 <div className="px-5 py-2 bg-white text-[#0F172A] rounded-[15px] shadow-lg">
                    <span className="text-[7px] font-black uppercase tracking-[0.4em] opacity-30 block mb-0.5">Access Key</span>
                    <span className="text-lg font-black tracking-[0.2em] leading-none uppercase">{code}</span>
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
                       className="bg-primary-blue hover:bg-blue-600 px-10 py-5 rounded-[22px] text-xs font-black uppercase tracking-[0.4em] transition-all flex items-center gap-3 group shadow-xl hover:scale-[1.02] active:scale-95 text-white"
                     >
                        <span>Initialize Protocol</span>
                        <PlayCircle size={18} className="opacity-40 group-hover:opacity-100 transition-opacity" />
                     </button>
                  </motion.div>
                )}

                {status === 'showing-question' && currentQuestion && (
                   <motion.div
                     key="question"
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, x: -50 }}
                     className="w-full space-y-8"
                   >
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
                         <div className="w-28 h-28 bg-emerald-500/10 rounded-[44px] border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                            <CircleCheck className="text-emerald-500 w-14 h-14" />
                         </div>
                         <h2 className="text-7xl font-black leading-tight tracking-tight uppercase text-emerald-400 max-w-4xl mx-auto">
                            {currentQuestion.options?.[['A','B','C','D'].indexOf(currentQuestion.correct_answer)] || currentQuestion.correct_answer}
                         </h2>
                      </div>

                      <button 
                        onClick={nextQuestion}
                        className="bg-white text-[#020617] px-20 py-8 rounded-[36px] text-lg font-black uppercase tracking-[0.4em] transition-all flex items-center gap-6 mx-auto hover:bg-primary-blue hover:text-white group shadow-2xl"
                      >
                         <span>Next Protocol</span>
                         <ArrowRight size={32} className="group-hover:translate-x-2 transition-transform" />
                      </button>
                   </motion.div>
                )}

                {status === 'finished' && (
                   <motion.div
                     key="finished"
                     initial={{ opacity: 0, scale: 0.9 }}
                     animate={{ opacity: 1, scale: 1 }}
                     className="space-y-16 text-center"
                   >
                      <div className="space-y-8">
                         <Trophy size={180} className="text-amber-400 mx-auto" />
                         <h1 className="text-8xl font-black tracking-[0.1em] uppercase leading-none">ELITE NODE ESTABLISHED</h1>
                      </div>

                      <div className="flex gap-6 justify-center">
                         <button 
                           onClick={() => setStatus('lobby')}
                           className="bg-white/5 border border-white/10 px-10 py-6 rounded-[28px] font-black text-[13px] uppercase tracking-[0.3em] transition-all backdrop-blur-md"
                         >
                           Reset Node
                         </button>
                         <button 
                           onClick={() => router.push('/quiz/admin/quizzes')}
                           className="bg-primary-blue px-16 py-6 rounded-[28px] font-black text-[13px] uppercase tracking-[0.3em] transition-all"
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
        <div className="w-full lg:w-[350px] bg-[#020617] lg:bg-white text-white lg:text-[#0F172A] flex flex-col p-6 overflow-hidden relative border-l border-white/5 lg:border-gray-100">
          <div className="relative z-10 mb-6 md:mb-8">
             <div className="flex items-center gap-4 mb-8">
                <div className="p-2 bg-primary-blue/10 lg:bg-blue-50 rounded-[14px]">
                   <Medal className="text-primary-blue w-4 h-4" />
                </div>
                <h3 className="text-lg font-black uppercase tracking-tighter">Elite Registry</h3>
             </div>
             
             <div className="flex p-1.5 bg-white/5 lg:bg-slate-100 rounded-[24px] mb-8 gap-1.5">
                <button 
                   onClick={() => setActiveRegistryTab('leaderboard')}
                   className={`flex-1 py-3 px-4 rounded-[18px] text-[9px] font-black uppercase tracking-widest transition-all ${
                     activeRegistryTab === 'leaderboard' 
                     ? 'bg-[#0F172A] lg:bg-white text-white lg:text-[#0F172A] shadow-lg' 
                     : 'text-white/40 lg:text-slate-400 hover:text-white lg:hover:text-[#0F172A]'
                   }`}
                >
                   Leaderboard
                </button>
                <button 
                   onClick={() => setActiveRegistryTab('violations')}
                   className={`flex-1 py-3 px-4 rounded-[18px] text-[9px] font-black uppercase tracking-widest transition-all relative ${
                     activeRegistryTab === 'violations' 
                     ? 'bg-[#0F172A] lg:bg-white text-white lg:text-[#0F172A] shadow-lg' 
                     : 'text-white/40 lg:text-slate-400 hover:text-white lg:hover:text-[#0F172A]'
                   }`}
                >
                   Threat Intel
                   {violations.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[8px] flex items-center justify-center rounded-full animate-pulse border-2 border-white lg:border-slate-100">
                         {violations.length}
                      </span>
                   )}
                </button>
             </div>

             <div className="flex justify-between items-end mb-2">
                <p className="text-[9px] font-black text-[#94A3B8] uppercase tracking-[0.3em] leading-none">
                  {activeRegistryTab === 'leaderboard' ? 'Global Ranking Matrix' : 'Integrity Breach Logs'}
                </p>
                <span className="text-[8px] font-black uppercase text-primary-blue opacity-50">
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

          <div className="flex-1 space-y-2.5 overflow-y-auto pr-1 custom-scrollbar-hide relative z-10 py-1">
             <AnimatePresence mode="wait">
                {activeRegistryTab === 'leaderboard' ? (
                   <motion.div 
                     key="leaderboard-tab"
                     initial={{ opacity: 0, x: 20 }}
                     animate={{ opacity: 1, x: 0 }}
                     exit={{ opacity: 0, x: -20 }}
                     className="space-y-2.5"
                   >
                      {leaderboard.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-10 py-20">
                           <Users size={48} strokeWidth={1} />
                           <p className="text-[8px] font-black uppercase tracking-[0.4em] text-center">Awaiting Node Connections</p>
                        </div>
                      ) : leaderboard.map((player, index) => (
                         <motion.div
                           key={player.id}
                           layout
                           initial={{ opacity: 0, x: 30 }}
                           animate={{ opacity: 1, x: 0 }}
                           className={`flex items-center justify-between p-4 rounded-[20px] border ${
                             index === 0 ? 'bg-[#0F172A] text-white border-[#0F172A] shadow-2xl scale-[1.01] ring-4 ring-primary-blue/10' : 
                             'bg-white/5 lg:bg-white border-white/5 lg:border-[#F1F5F9]'
                           } transition-all relative overflow-hidden`}
                         >
                            <div className="flex items-center gap-5 relative z-10">
                               <div className={`w-8 h-8 rounded-[12px] flex items-center justify-center font-black text-sm ${
                                 index === 0 ? 'bg-amber-400 text-[#0F172A]' : 'bg-gray-500/5 text-gray-400'
                               }`}>
                                 {index + 1}
                               </div>
                               <div className="flex flex-col">
                                  <span className="text-sm font-black uppercase tracking-tight truncate max-w-[160px]">
                                    {player.full_name}
                                  </span>
                                  <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Verified</span>
                               </div>
                            </div>
                            <div className="text-right relative z-10">
                               <span className={`text-lg font-black tabular-nums ${index === 0 ? 'text-amber-400' : 'text-[#0F172A]'}`}>
                                 {player.total_score || 0}
                               </span>
                               <p className="text-[9px] font-black uppercase opacity-30 mt-1">PTS</p>
                            </div>
                         </motion.div>
                      ))}
                   </motion.div>
                ) : (
                   <motion.div 
                     key="violations-tab"
                     initial={{ opacity: 0, x: 20 }}
                     animate={{ opacity: 1, x: 0 }}
                     exit={{ opacity: 0, x: -20 }}
                     className="space-y-3.5"
                   >
                      {violations.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-10 py-20">
                           <ShieldAlert size={48} strokeWidth={1} />
                           <p className="text-[8px] font-black uppercase tracking-[0.4em] text-center">No Protocol Breaches Detected</p>
                        </div>
                      ) : violations.map((v, index) => (
                         <motion.div
                           key={v.userId}
                           initial={{ opacity: 0, y: 10 }}
                           animate={{ opacity: 1, y: 0 }}
                           className={`flex items-center justify-between p-4 rounded-[20px] transition-all ${
                              v.status === 'terminated' ? 'bg-rose-500/10 border-rose-500/30' : 'bg-amber-500/5 border-amber-500/20'
                           } border`}
                         >
                            <div className="flex items-center gap-4">
                               <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${v.status === 'terminated' ? 'bg-rose-600 text-white' : 'bg-amber-100 text-amber-600'}`}>
                                  {v.status === 'terminated' ? <MonitorOff size={18} /> : <AlertTriangle size={18} />}
                               </div>
                               <div className="flex flex-col">
                                  <span className={`text-sm font-black uppercase tracking-tight ${v.status === 'terminated' ? 'text-rose-500' : 'text-[#0F172A]'}`}>{v.userName}</span>
                                  <span className={`text-[8px] font-black uppercase tracking-widest mt-1 ${v.status === 'terminated' ? 'text-rose-500/60' : 'text-amber-600/60'}`}>
                                     {v.status === 'terminated' ? 'NODE_TERMINATED' : `${v.count} BREACHES`}
                                  </span>
                               </div>
                            </div>
                            <div className="text-right">
                               <div className="text-[8px] font-black text-[#94A3B8] uppercase tracking-widest">Breach</div>
                               <div className="text-[9px] font-black text-[#0F172A] uppercase truncate max-w-[100px]">{v.type?.split(' ')[0]}...</div>
                            </div>
                         </motion.div>
                      ))}
                   </motion.div>
                )}
             </AnimatePresence>
          </div>

          <div className="mt-8">
              <button 
                onClick={recalibrateNode}
                disabled={refreshing}
                className="w-full py-3 bg-slate-50 border border-slate-100 rounded-[20px] text-[8px] font-black uppercase tracking-[0.4em] text-slate-400 hover:text-primary-blue hover:bg-blue-50 transition-all flex items-center justify-center gap-3"
              >
                <Zap size={10} className={`${refreshing ? "animate-bounce" : ""}`} />
                <span>{refreshing ? "Synchronizing Matrix..." : "Recalibrate Neural Node"}</span>
              </button>
          </div>
        </div>
    </div>
  );
}
