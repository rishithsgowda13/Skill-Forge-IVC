"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { Timer, ArrowRight, ShieldCheck, AlertCircle, Zap, Clock, Info } from "lucide-react";

export default function QuizEngine() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);
  const [finished, setFinished] = useState(false);
  const [violations, setViolations] = useState(0);

  useEffect(() => {
    window.history.pushState(null, null, window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, null, window.location.href);
      alert("Navigation is disabled during the quiz attempt.");
    };
    window.addEventListener("popstate", handlePopState);
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") setViolations(v => v + 1);
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    async function loadQuiz() {
      const { data: qData } = await supabase.from("quizzes").select("*").eq("id", params.id).single();
      const { data: questData } = await supabase.from("questions").select("*").eq("quiz_id", params.id).order("order_index", { ascending: true });
      
      setQuiz(qData);
      setQuestions(questData || []);
      setLoading(false);
      if (questData?.[0]) setTimeLeft(questData[0].time_limit || 30);
    }
    loadQuiz();
  }, [params.id]);

  useEffect(() => {
    if (loading || finished || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { handleNext(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, loading, finished]);

  const handleNext = async () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
      setTimeLeft(questions[currentIdx + 1]?.time_limit || 30);
    } else {
      setFinished(true);
      router.push(`/quiz/${params.id}/result`);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-page-bg flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary-blue/20 border-t-primary-blue rounded-full animate-spin" />
    </div>
  );

  const currentQuestion = questions[currentIdx];

  return (
    <div className="min-h-screen bg-page-bg flex flex-col font-sans">
      {/* Top Progress Rail */}
      <div className="fixed top-0 left-0 right-0 h-1.5 bg-sidebar-bg z-50 overflow-hidden">
        <motion.div 
          className="h-full bg-primary-blue shadow-[0_2px_4px_rgba(37,99,235,0.2)]"
          initial={{ width: 0 }}
          animate={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Main Container */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 mt-4 overflow-x-hidden">
        <motion.div
          key={currentIdx}
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -20, opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full max-w-4xl dashboard-card border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] relative p-12 md:p-20 overflow-hidden"
        >
          {/* Header Metadata */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 pb-8 border-b border-card-border">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-black text-primary-blue bg-blue-50 px-3 py-1 rounded-pill border border-primary-blue/10 uppercase tracking-[0.2em] shadow-sm">
                  Attempt {String(currentIdx + 1).padStart(2, '0')}
                </span>
                <span className="text-text-meta font-bold uppercase tracking-widest text-[10px]">OF {questions.length} TRACKS</span>
              </div>
              <h2 className="text-text-primary text-sm font-bold tracking-tight mt-2 uppercase">{quiz?.title || "Evaluating Component"}</h2>
            </div>

            <div className="flex items-center gap-6">
              <div className={`flex items-center gap-3 glass-morphism bg-white px-4 py-2 rounded-inner border border-card-border shadow-subtle ${
                timeLeft < 10 ? "animate-pulse border-red-500/20" : "border-[#E8EDF2]"
              }`}>
                <Clock className={`w-4 h-4 ${timeLeft < 10 ? "text-red-500" : "text-primary-blue"}`} />
                <span className={`text-xl font-black font-mono tracking-tighter ${timeLeft < 10 ? "text-red-600" : "text-text-primary"}`}>
                  {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}
                </span>
              </div>
            </div>
          </div>

          {/* Question Text */}
          <div className="space-y-8 mb-16">
            <h3 className="text-text-primary text-2xl md:text-3xl font-extrabold tracking-tight leading-[1.25] max-w-3xl">
              {currentQuestion?.question_text}
            </h3>
            <div className="utilization-bar-bg w-24">
              <div className="utilization-bar-fill w-2/3" />
            </div>
          </div>

          {/* Choice Region */}
          <div className="grid gap-4 mb-20">
            {currentQuestion?.question_type === 'mcq' && currentQuestion?.options?.map((opt, i) => (
              <button
                key={i}
                className="group w-full text-left bg-nav-hover border border-card-border p-6 rounded-inner hover:border-primary-blue hover:bg-white transition-all flex items-center justify-between active:scale-[0.99]"
                onClick={() => {
                  setAnswers({ ...answers, [currentQuestion.id]: opt });
                  handleNext();
                }}
              >
                <div className="flex items-center gap-6">
                  <div className="w-10 h-10 rounded-pill bg-white border border-card-border flex items-center justify-center font-bold text-sm text-text-meta shadow-subtle group-hover:bg-primary-blue group-hover:text-white group-hover:border-primary-blue transition-all">
                    {String.fromCharCode(65 + i)}
                  </div>
                  <span className="text-base font-bold text-text-primary leading-tight group-hover:text-primary-blue transition-colors">
                    {opt}
                  </span>
                </div>
                <ChevronRight size={20} className="text-text-meta opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}

            {currentQuestion?.question_type === 'paragraph' && (
              <textarea
                className="w-full bg-nav-hover border border-card-border rounded-inner p-8 text-base min-h-[300px] font-medium leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary-blue/20 focus:border-primary-blue transition-all placeholder:text-text-meta shadow-inner"
                placeholder="Elaborate your detailed assessment here..."
                onChange={(e) => setAnswers({ ...answers, [currentQuestion.id]: e.target.value })}
              />
            )}
          </div>

          {/* Footer Navigation */}
          <div className="flex items-center justify-between pt-10 border-t border-card-border">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-success-green" />
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-text-meta uppercase tracking-widest leading-none">Security Status</span>
                <span className="text-[11px] font-bold text-success-green uppercase tracking-wider">SECURE_LINK_ACTIVE</span>
              </div>
            </div>

            {currentQuestion?.question_type !== 'mcq' && (
              <button
                onClick={handleNext}
                className="bg-primary-blue text-white px-10 py-4 rounded-inner font-bold text-sm tracking-widest uppercase hover:bg-deep-indigo transition-all flex items-center gap-3 shadow-[0_4px_12px_rgba(37,99,235,0.2)]"
              >
                <span>Commit Answer</span>
                <ArrowRight size={18} />
              </button>
            )}
          </div>
        </motion.div>

        {/* Floating Session Violations Alert */}
        {violations > 0 && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed bottom-10 right-10 bg-white border-2 border-red-500 rounded-pill p-4 shadow-[0_12px_24px_rgba(239,68,68,0.15)] flex items-center gap-4 z-50 cursor-default"
          >
            <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
              <AlertTriangle className="text-red-600" />
            </div>
            <div className="pr-4">
              <p className="text-sm font-bold text-red-600 uppercase tracking-widest">Protocol Breach Tracker</p>
              <p className="text-xs font-semibold text-text-secondary italic">{violations} window focus violations detected.</p>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
