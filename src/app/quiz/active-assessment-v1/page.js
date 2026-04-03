"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldAlert, 
  Timer, 
  ChevronRight, 
  CircleDot, 
  Fingerprint, 
  Activity,
  CheckCircle2,
  Clock,
  Loader2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { useAntiCheat } from "@/hooks/useAntiCheat";

export default function ActiveAssessmentPage() {
  const router = useRouter();
  const supabase = createClient();
  const { warnings, maxWarnings, inputHandlers, lastViolation } = useAntiCheat(true);

  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchQuizContent() {
      setLoading(true);
      // For now, let's look for any active quizzes or just use dummy data if table not populated
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select(`
          id, 
          title, 
          questions (
            id, question_text, question_type, options, correct_answer, time_limit
          )
        `)
        .limit(1);

      if (quizData && quizData.length > 0) {
        setQuestions(quizData[0].questions || []);
        setTimeLeft(quizData[0].questions[0]?.time_limit || 30);
      } else {
        // Fallback for demonstration if DB is empty
        const dummyQuestions = [
          {
            id: '1',
            question_text: "Analyze the following component structure and identify the primary state management pattern.",
            question_type: "mcq",
            options: ["Redux Toolkit", "Context API", "Zustand", "Recoil"],
            time_limit: 45
          },
          {
            id: '2',
            question_text: "Describe the optimal strategy for securing server-side interactions in an Edge runtime environment.",
            question_type: "paragraph",
            time_limit: 120
          }
        ];
        setQuestions(dummyQuestions);
        setTimeLeft(dummyQuestions[0].time_limit);
      }
      setLoading(false);
    }
    fetchQuizContent();
  }, [supabase]);

  useEffect(() => {
    if (timeLeft <= 0 || loading) return;
    const timer = setInterval(() => setTimeLeft((p) => p - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, loading]);

  const currentQuestion = questions[currentIdx];

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((p) => p + 1);
      setTimeLeft(questions[currentIdx + 1]?.time_limit || 30);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // Simulate API call to submission analytics or real supabase insert
    setTimeout(() => {
      router.push("/dashboard/archive");
    }, 1500);
  };

  if (loading) return (
    <div className="h-screen w-full flex items-center justify-center bg-[#F8FAFC]">
      <Loader2 className="w-12 h-12 text-[#2563EB] animate-spin" />
    </div>
  );

  const progress = ((currentIdx + 1) / questions.length) * 100;

  return (
    <div className="h-screen w-full bg-[#f8fafc] flex flex-col p-4 md:p-8 items-center justify-center font-sans text-[#0F172A] relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-50/50 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[1000px] max-h-[90vh] bg-white rounded-[48px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.08)] border border-[#E2E8F0] overflow-hidden flex flex-col p-10 relative"
      >
        {/* Header / Meta */}
        <div className="flex justify-between items-center mb-10 px-4">
          <div className="flex items-center gap-6">
            <div className="bg-[#EFF6FF] px-5 py-2.5 rounded-xl border border-[#DBEAFE] shadow-sm">
               <span className="text-[11px] font-black uppercase text-[#2563EB] tracking-widest leading-none">Attempt 01</span>
            </div>
            <div className="h-4 w-px bg-[#E2E8F0]" />
            <span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-widest">{currentIdx + 1} of {questions.length} TRACKS</span>
          </div>

          <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl border transition-colors ${timeLeft < 10 ? 'bg-red-50 border-red-100 text-red-500' : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#0F172A]'}`}>
            <Timer className={`w-5 h-5 ${timeLeft < 10 ? 'animate-pulse' : ''}`} />
            <span className="text-sm font-black mono tracking-tighter">
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* Question Area */}
        <div className="flex-1 px-4 mb-16">
          <motion.h2 
            key={currentQuestion?.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-extrabold text-[#0F172A] leading-tight mb-8 tracking-tight max-w-[800px]"
          >
            {currentQuestion?.question_text}
          </motion.h2>

          <div className="grid gap-3 overflow-y-auto custom-scrollbar max-h-[40vh] pr-2">
            {currentQuestion?.question_type === 'mcq' ? (
              currentQuestion.options.map((opt, i) => (
                <motion.button
                  key={i}
                  whileHover={{ scale: 1.005 }}
                  whileTap={{ scale: 0.995 }}
                  onClick={() => setAnswers(prev => ({ ...prev, [currentQuestion.id]: opt }))}
                  className={`flex items-center gap-4 p-5 rounded-[22px] border-2 transition-all duration-300 text-left relative overflow-hidden group ${
                    answers[currentQuestion.id] === opt 
                      ? "border-[#2563EB] bg-[#F0F7FF] shadow-md shadow-blue-50" 
                      : "border-[#F1F5F9] hover:border-[#CBD5E1] bg-[#F8FAFC]"
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 shrink-0 transition-colors ${
                     answers[currentQuestion.id] === opt ? "bg-[#2563EB] border-[#2563EB]" : "bg-white border-[#E2E8F0]"
                  }`}>
                    {answers[currentQuestion.id] === opt && <CheckCircle2 className="text-white w-4 h-4" />}
                  </div>
                  <span className="text-sm font-bold text-[#1E293B]">{opt}</span>
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest">Select</span>
                  </div>
                </motion.button>
              ))
            ) : (
              <textarea
                {...inputHandlers}
                value={answers[currentQuestion.id] || ""}
                onChange={(e) => setAnswers(prev => ({ ...prev, [currentQuestion.id]: e.target.value }))}
                placeholder="Compose your technical response here..."
                className="w-full h-40 bg-[#F8FAFC] border-2 border-[#F1F5F9] rounded-[28px] p-6 text-sm font-medium placeholder:text-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:bg-white transition-all resize-none shadow-inner"
              />
            )}
          </div>
        </div>

        {/* Footer Area */}
        <div className="flex flex-col gap-10">
          {/* Progress Bar */}
          <div className="h-1.5 w-full bg-[#F1F5F9] rounded-full overflow-hidden relative">
            <motion.div 
              className="h-full bg-[#2563EB] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          <div className="flex justify-between items-center px-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${warnings > 0 ? 'bg-red-500 animate-ping' : 'bg-green-500'}`} />
                <span className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.2em]">{warnings > 0 ? 'Protocol Anomaly' : 'Security Status'}</span>
              </div>
              <span className="text-[10px] font-black text-[#2563EB] uppercase tracking-[0.2em]">Secure_Link_Active</span>
            </div>

            <button
              onClick={handleNext}
              disabled={isSubmitting}
              className="bg-[#2563EB] text-white px-10 py-5 rounded-2xl font-black text-xs tracking-widest uppercase flex items-center gap-4 shadow-[0_12px_24px_rgba(37,99,235,0.25)] hover:bg-[#1E40AF] transition-all active:scale-[0.98] group disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>{currentIdx < questions.length - 1 ? 'Commit Answer' : 'Finalize Session'}</span>
                  <ChevronRight className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Custom Violation Toast/Modal */}
      <AnimatePresence>
        {lastViolation && (
          <motion.div 
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/20 backdrop-blur-sm"
          >
            <div className="bg-white rounded-[32px] p-10 shadow-2xl border border-red-100 max-w-md w-full text-center space-y-6">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto">
                <ShieldAlert className="text-red-500 w-10 h-10" />
              </div>
              <div>
                <h3 className="text-xl font-black text-[#0F172A] tracking-tight uppercase mb-2">Security Anomaly</h3>
                <p className="text-sm font-bold text-[#64748B] leading-relaxed">
                  {lastViolation}
                </p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl">
                 <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.2em]">Institutional protocol in effect</p>
              </div>
            </div>
          </motion.div>
        )}

        {warnings >= maxWarnings && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[200] bg-[#0F172A] flex items-center justify-center p-6"
          >
            <div className="max-w-2xl w-full text-center space-y-12">
              <motion.div 
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-32 h-32 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border-2 border-red-500/20"
              >
                <ShieldAlert className="text-red-500 w-16 h-16" />
              </motion.div>
              
              <div className="space-y-6">
                <h1 className="text-6xl font-black text-white tracking-tighter leading-none">
                  YOU ARE A <span className="text-red-500 underline decoration-4 underline-offset-8 text-7xl italic">CHEATER</span>
                </h1>
                <h2 className="text-4xl font-black text-white/40 tracking-widest uppercase italic">
                  YOU ARE DISQUALIFIED
                </h2>
              </div>

              <p className="text-[#64748B] font-bold tracking-widest uppercase text-sm leading-relaxed max-w-lg mx-auto">
                Session ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}<br/>
                Unauthorized activity threshold exceeded. This instance has been logged and reported to the system evaluators.
              </p>

              <button 
                onClick={() => router.push('/login')}
                className="bg-white/5 border border-white/10 text-white px-12 py-5 rounded-2xl font-black text-xs tracking-widest uppercase hover:bg-white/10 transition-all"
              >
                Return to Login
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Warnings Indicator (Bottom Fixed) */}
      {warnings > 0 && warnings < maxWarnings && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-md border border-red-100 px-8 py-4 rounded-full shadow-2xl flex items-center gap-4 z-50 overflow-hidden"
        >
          <div className="absolute inset-0 bg-red-500/5 animate-pulse" />
          <ShieldAlert className="text-red-500 w-5 h-5 relative z-10" />
          <span className="text-xs font-black text-[#0F172A] relative z-10 uppercase tracking-widest">
            Security Advisory: Violation Logged ({warnings}/{maxWarnings})
          </span>
        </motion.div>
      )}
    </div>
  );
}
