"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import SentinelProtocol from "@/components/quiz/SentinelProtocol";
import { 
  Zap, 
  Lock, 
  Clock, 
  Trophy, 
  AlertCircle,
  CheckCircle2,
  XCircle,
  Fingerprint,
  Monitor,
  MonitorOff,
  CircleCheck
} from "lucide-react";

export default function CandidatePlayPage() {
  const { code } = useParams();
  const router = useRouter();
  const supabase = createClient();
  
  const [quiz, setQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState(null);
  const [user, setUser] = useState(null);
  const [resultsActive, setResultsActive] = useState(false);
  const [score, setScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const channelRef = useRef(null);

  useEffect(() => {
    let active = true;
    
    async function init() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!active) return;
        
        let sessionUser = authUser || { 
          id: `guest-${Math.random().toString(36).substr(2, 9)}`, 
          email: "guest@skillforge.io" 
        };

        // Check for mock session bypass
        const cookies = document.cookie.split(';');
        const mockSession = cookies.find(c => c.trim().startsWith('mock_session='));
        if (mockSession && !authUser) {
          const idPart = mockSession.split('=')[1].split(':')[1] || "1";
          sessionUser = {
            id: `mock_${idPart}`,
            email: `candidate${idPart}@skillforge.io`,
            isMock: true
          };
        }
        
        setUser(sessionUser);

        // Fetch Quiz
        const { data: quizData, error: qErr } = await supabase
          .from("quizzes")
          .select("*, questions(*)")
          .eq("access_code", code?.toUpperCase())
          .single();
        
        if (!active) return;
        if (qErr || !quizData) {
          console.error("Quiz retrieval failure:", qErr);
          router.push("/quiz/access");
          return;
        }
        
        setQuiz(quizData);

        // Fetch profile
        let sessionName = "Candidate";
        if (authUser) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', authUser.id)
            .single();
          if (profile?.full_name) sessionName = profile.full_name;
        } else if (sessionUser.isMock) {
          sessionName = `can ${sessionUser.id.split('_')[1]}`;
        } else {
          sessionName = `Guest-${sessionUser.id.split('-')[1]}`;
        }
        if (!active) return;

        // Initialize Channel
        const canal_id = `quiz_session_${code.toUpperCase()}`;
        
        // Remove any existing instance with this name first
        const existingChannel = supabase.getChannels().find(c => c.name === canal_id);
        if (existingChannel) {
          await supabase.removeChannel(existingChannel);
        }
        
        if (!active) return;

        const channel = supabase.channel(canal_id);
        channelRef.current = channel;
        
        channel
          .on(
            'postgres_changes', 
            { event: '*', schema: 'public', table: 'quizzes', filter: `id=eq.${quizData.id}` },
            (payload) => {
              const updatedQuiz = payload.new;
              setQuiz(prev => ({ ...prev, ...updatedQuiz }));
              setSelectedOption(null);
              setResultsActive(false);
            }
          )
          .on(
            'broadcast',
            { event: 'state_update' },
            (payload) => {
              setQuiz(prev => ({ ...prev, ...payload.payload }));
              setSelectedOption(null);
              setResultsActive(false);
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'submissions', filter: `quiz_id=eq.${quizData.id}` },
            () => {
               fetchScore(quizData.id, sessionUser.id);
               fetchLeaderboard(quizData.id);
            }
          )
          .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
              console.log("SYNCHRONIZED WITH NODE CHANNEL");
              await channel.track({
                user_id: sessionUser.id,
                full_name: sessionName,
                online_at: new Date().toISOString(),
              });
            }
          });

        // Initial score load
        fetchScore(quizData.id, sessionUser.id);
        fetchLeaderboard(quizData.id);

        setLoading(false);
      } catch (err) {
        console.error("CRITICAL SYNC ERROR:", err);
        if (active) setLoading(false);
      }
    }

    if (code) init();

    return () => {
      active = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [code]);

  const fetchLeaderboard = async (quizId) => {
    const { data } = await supabase
      .from('leaderboard_view')
      .select('*')
      .eq('quiz_id', quizId)
      .order('total_score', { ascending: false });
    if (data) setLeaderboard(data);
  };

  const fetchScore = async (quizId, userId) => {
    const { data } = await supabase
      .from('submissions')
      .select('points')
      .eq('quiz_id', quizId)
      .eq('user_id', userId);
    
    if (data) {
      const total = data.reduce((acc, sub) => acc + (sub.points || 0), 0);
      setScore(total);
    }
  };

  useEffect(() => {
    if (quiz && quiz.questions && quiz.current_question_index !== undefined) {
      const q = quiz.questions.find(qt => qt.order_index === quiz.current_question_index);
      setCurrentQuestion(q);
    }
  }, [quiz]);

  const [startTime, setStartTime] = useState(null);
  const [showOptions, setShowOptions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (quiz?.status === 'showing-question') {
      setShowOptions(false);
      const timer = setTimeout(() => {
        setShowOptions(true);
        setStartTime(Date.now());
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setShowOptions(false);
    }
  }, [quiz?.status, quiz?.current_question_index]);

  const handleSelect = async (optionIndex) => {
    if (quiz?.status !== 'showing-question' || !currentQuestion || isSubmitting) return;
    
    setIsSubmitting(true);
    const elapsed = (Date.now() - startTime) / 1000;
    setSelectedOption(optionIndex);
    
    const answer = String.fromCharCode(65 + optionIndex); // A, B, C, D
    const isCorrect = answer === currentQuestion.correct_answer;
    
    // Calculate score with Response-Time Decay logic
    const timeLimit = currentQuestion.time_limit || 15;
    const basePoints = timeLimit * 10;
    const penalty = Math.floor(elapsed);
    const pointsEarned = isCorrect ? Math.max(10, basePoints - (penalty * 10)) : 0;
    
    try {
      // 1. Clear any previous submission for this question to allow re-selection
      await supabase
        .from('submissions')
        .delete()
        .match({ quiz_id: quiz.id, user_id: user.id, question_id: currentQuestion.id });

      // 2. Save new answer to Supabase
      await supabase.from('submissions').insert([{
        quiz_id: quiz.id,
        user_id: user.id,
        question_id: currentQuestion.id,
        answer: answer,
        is_correct: isCorrect,
        points: pointsEarned,
        time_taken: elapsed
      }]);
    } catch (err) {
      console.error("Failed to save answer:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
     return (
       <div className="h-screen bg-[#F0F2F5] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 border-4 border-primary-blue border-t-transparent rounded-full animate-spin mb-6" />
          <p className="text-[15px] font-black uppercase tracking-[0.3em] text-[#94A3B8]">Decrypting Signal...</p>
       </div>
     );
  }

  if (quiz?.status === 'lobby') {
    return (
      <div className="h-screen bg-[#F0F2F5] flex flex-col items-center justify-center p-8 text-center space-y-10">
         <motion.div
           initial={{ scale: 0.9, opacity: 0 }}
           animate={{ scale: 1, opacity: 1 }}
           className="w-24 h-24 bg-white rounded-[32px] shadow-2xl flex items-center justify-center relative overflow-hidden"
         >
            <Fingerprint className="text-primary-blue w-12 h-12 relative z-10" />
            <div className="absolute inset-0 bg-primary-blue/5 animate-pulse" />
         </motion.div>
         
         <div className="space-y-4">
            <h1 className="text-4xl font-black text-[#0F172A] tracking-tighter uppercase leading-none">{quiz.title}</h1>
            <p className="text-[16.5px] font-black text-[#94A3B8] uppercase tracking-[0.4em]">Ready for Synchronous Deployment</p>
         </div>

         <AnimatePresence>
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[200] bg-white border border-[#E2E8F0] shadow-2xl rounded-[32px] px-10 py-6 flex items-center gap-6"
            >
               <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-blue-400/20 rounded-full animate-ping" />
                  <Clock className="text-primary-blue w-6 h-6 relative z-10" />
               </div>
               <div className="text-left">
                  <p className="text-[15px] font-black text-primary-blue uppercase tracking-[0.3em] leading-none mb-1.5">Waiting Room Protocol</p>
                  <p className="text-sm font-black text-[#0F172A] uppercase tracking-tight">Waiting for admin to start the quiz</p>
               </div>
            </motion.div>
         </AnimatePresence>
      </div>
    );
  }

  if (quiz?.status === 'finished') {
    return (
      <div className="h-screen bg-[#0F172A] text-white flex flex-col items-center justify-center p-10 text-center space-y-12">
         <div className="space-y-4">
            <Trophy className="text-amber-400 w-20 h-20 mx-auto" />
            <h1 className="text-4xl font-black tracking-tighter uppercase">Signal Terminated</h1>
            <p className="text-[16.5px] font-black text-white/40 uppercase tracking-[0.4em]">Final Registry Score Synchronized</p>
         </div>
         <div className="text-6xl font-black tabular-nums">{score}</div>
         <button 
           onClick={() => router.push('/quiz/admin')}
           className="px-12 py-5 bg-white text-[#0F172A] rounded-2xl font-black text-[15px] uppercase tracking-widest"
         >
           Close Data Node
         </button>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#F0F2F5] flex flex-col p-4 space-y-4 overflow-y-auto md:overflow-hidden relative">
      <SentinelProtocol 
         active={quiz?.status === 'showing-question'} 
         onViolation={async (count, type) => {
           const channel = channelRef.current;
           if (channel) {
             await channel.send({
               type: 'broadcast',
               event: 'violation_detected',
               payload: {
                 userId: user.id,
                 userName: user.email || 'Candidate',
                 type,
                 count,
                 timestamp: new Date().toISOString()
               }
             });
           }
         }}
         onTermination={async () => {
             const channel = channelRef.current;
             if (channel) {
               await channel.send({
                 type: 'broadcast',
                 event: 'session_terminated',
                 payload: {
                   userId: user.id,
                   userName: user.email || 'Candidate',
                   timestamp: new Date().toISOString()
                 }
               });
             }
         }}
       />
       
       <div className="flex items-center justify-between p-4 bg-white rounded-[24px] border border-[#E2E8F0] shadow-sm relative z-10">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-primary-blue/10 rounded-lg flex items-center justify-center text-primary-blue">
                <Zap size={16} />
             </div>
             <div>
                <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest leading-none mb-1">Session Active</p>
                <p className="text-xs font-black text-[#0F172A] uppercase">Sync Point {quiz.current_question_index + 1}</p>
             </div>
          </div>
          <div className="bg-[#0F172A] text-white px-4 py-2 rounded-xl text-[10px] font-black tracking-widest tabular-nums">
             SCORE: {score}
          </div>
       </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 relative z-30">
           <AnimatePresence mode="wait">
              {quiz?.status === 'showing-question' && showOptions ? (
                 <>
                     {[0, 1, 2, 3].map((idx) => {
                       const colors = ['bg-[#2563EB]', 'bg-[#EF4444]', 'bg-[#F59E0B]', 'bg-[#10B981]'];
                       const labels = ['A', 'B', 'C', 'D'];
                       const optionText = currentQuestion?.options?.[idx] || labels[idx];
                       
                       return (
                         <motion.button
                           key={idx}
                           initial={{ opacity: 0, scale: 0.95 }}
                           animate={{ opacity: 1, scale: 1 }}
                           whileTap={{ scale: 0.97 }}
                           disabled={isSubmitting}
                           onClick={() => handleSelect(idx)}
                           className={`relative rounded-[28px] md:rounded-[32px] flex flex-col items-center justify-center text-white transition-all overflow-hidden p-6 text-center group/opt cursor-pointer touch-manipulation z-40 ${
                             selectedOption === idx ? 'ring-4 ring-white/50 shadow-2xl' : 
                             selectedOption !== null ? 'opacity-60 hover:opacity-100 grayscale-[0.3] hover:grayscale-0' : ''
                           } ${colors[idx]} shadow-lg`}
                         >
                            <div className="relative z-10 flex flex-col items-center gap-3 pointer-events-none">
                               <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-lg md:text-xl font-black mb-1 border border-white/30">
                                  {labels[idx]}
                               </div>
                               <span className="text-sm md:text-base lg:text-lg font-black tracking-tight leading-tight max-w-[200px]">
                                 {optionText}
                               </span>
                            </div>
                            
                            {selectedOption === idx && (
                               <motion.div 
                                 initial={{ scale: 0 }}
                                 animate={{ scale: 1.5 }}
                                 className="absolute inset-0 bg-white/10 rounded-full"
                               />
                            )}
                         </motion.button>
                       );
                     })}
                 </>
              ) : quiz?.status === 'showing-question' ? (
                <div className="col-span-full bg-white/50 backdrop-blur-sm rounded-[32px] border-2 border-dashed border-primary-blue/10 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-full h-1 bg-primary-blue/10">
                      <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: '100%' }} 
                        transition={{ duration: 3, ease: 'linear' }} 
                        className="h-full bg-primary-blue" 
                      />
                   </div>
                   <div className="w-14 h-14 bg-primary-blue/10 rounded-full flex items-center justify-center mb-4">
                      <Clock className="text-primary-blue w-6 h-6" />
                   </div>
                   <h2 className="text-xl font-black text-[#0F172A] uppercase tracking-tighter mb-2">Read Question</h2>
                   <p className="text-[11px] font-black text-[#94A3B8] uppercase tracking-[0.2em] max-w-xs">Synchronize with broadcast terminal for intelligence.</p>
                </div>
              ) : quiz?.status === 'showing-results' ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="col-span-full bg-white rounded-[32px] border border-[#E2E8F0] shadow-xl flex flex-col overflow-hidden relative"
                  >
                     <div className={`p-8 flex flex-col items-center justify-center text-center ${
                       currentQuestion?.correct_answer === String.fromCharCode(65 + selectedOption) ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                     }`}>
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                          currentQuestion?.correct_answer === String.fromCharCode(65 + selectedOption) ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                        }`}>
                           {currentQuestion?.correct_answer === String.fromCharCode(65 + selectedOption) ? <CircleCheck size={32} strokeWidth={2.5} /> : <XCircle size={32} strokeWidth={2.5} />}
                        </div>
                        <h2 className="text-2xl font-black uppercase tracking-tighter mb-1">
                           {currentQuestion?.correct_answer === String.fromCharCode(65 + selectedOption) ? 'CONFIRMED' : 'GAP DETECTED'}
                        </h2>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Sync Complete</p>
                     </div>

                     <div className="grid grid-cols-2 border-t border-[#E2E8F0]">
                        <div className="p-6 border-r border-[#E2E8F0] flex flex-col items-center justify-center bg-slate-50/50">
                           <div className="text-[8px] font-black text-[#94A3B8] uppercase tracking-[0.3em] mb-2">Rank</div>
                           <span className="text-3xl font-black text-[#0F172A]">#{leaderboard.findIndex(p => p.user_id === user?.id) + 1 || '--'}</span>
                        </div>
                        <div className="p-6 flex flex-col items-center justify-center bg-white">
                           <div className="text-[8px] font-black text-[#94A3B8] uppercase tracking-[0.3em] mb-2">Score</div>
                           <div className="flex items-end gap-1">
                              <span className="text-3xl font-black text-primary-blue">{score}</span>
                              <span className="text-[8px] font-black text-[#94A3B8] uppercase tracking-widest mb-1">PTS</span>
                           </div>
                        </div>
                     </div>

                     <div className="p-6 bg-[#0F172A] text-white flex flex-col items-center justify-center text-center">
                        <div className="text-[8px] font-black text-white/40 uppercase tracking-[0.4em] mb-2">Reference</div>
                        <div className="px-4 py-2 rounded-full bg-white/10 border border-white/20 text-xs font-black uppercase tracking-widest">
                           {currentQuestion?.options?.[currentQuestion?.correct_answer.charCodeAt(0) - 65] || "DATA_MISSING"}
                        </div>
                     </div>
                  </motion.div>
              ) : (
                <div className="col-span-full bg-white rounded-[32px] border border-[#E2E8F0] border-dashed flex flex-col items-center justify-center p-8 text-center">
                   <MonitorOff className="text-[#94A3B8] w-12 h-12 mb-4" />
                   <h2 className="text-lg font-black text-[#0F172A] uppercase tracking-tighter">Waiting Terminal</h2>
                   <p className="text-[11px] font-black text-[#94A3B8] uppercase tracking-[0.2em] mt-1">Broadcast pending on main display</p>
                </div>
              )}
           </AnimatePresence>
        </div>

       <div className="p-3 flex items-center justify-center gap-3">
          <span className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.4em]">{user?.email || "CONNECTED_NODE"}</span>
       </div>
    </div>
  );
}
