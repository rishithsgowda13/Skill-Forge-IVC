"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Zap, ArrowRight, Loader2, ShieldCheck, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function QuizAuthorization() {
  const router = useRouter();
  const [accessCode, setAccessCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAuthorize = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Simulate validation
    setTimeout(() => {
      if (accessCode === "1234") {
        // Redirect to a specific quiz assessment page
        router.push("/quiz/active-assessment-v1");
      } else {
        setError("Invalid protocol code.");
        setLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-[100dvh] w-full bg-[#f4f6f8] flex items-center justify-center p-4 font-sans text-black relative overflow-hidden">
      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => router.push("/dashboard")}
        className="absolute top-10 left-10 flex items-center gap-2 px-5 py-2.5 bg-white/50 backdrop-blur-md rounded-xl border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] hover:bg-white transition-all shadow-sm group z-50"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-[11px] font-black uppercase tracking-widest leading-none">Exit Protocol</span>
      </motion.button>

      {/* Subtle Background Elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#2563EB]/5 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#4F46E5]/5 rounded-full blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-[580px] bg-white rounded-[40px] p-16 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] border border-[#E2E8F0] flex flex-col items-center text-center"
      >
        <div className="w-16 h-16 bg-[#2563EB] rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-blue-200">
          <ShieldCheck className="text-white w-8 h-8" />
        </div>

        <h1 className="text-4xl font-black text-[#0F172A] tracking-tight mb-2">
          Skill Forge Sessions
        </h1>
        <p className="text-[11px] font-black text-[#94A3B8] uppercase tracking-[0.25em] mb-10">
          AUTHORIZED PROTOCOL ENTRY
        </p>

        <form onSubmit={handleAuthorize} className="w-full space-y-5">
          <div>
            <input
              type="text"
              placeholder="ENTER PROTOCOL CODE"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#2563EB] focus:bg-white transition-all rounded-[20px] py-6 text-center text-lg font-bold tracking-[0.5em] outline-none text-[#64748B] placeholder:text-[#94A3B8]"
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#2563EB] text-white py-6 rounded-[20px] font-black text-xs tracking-[0.2em] uppercase hover:bg-[#1E40AF] transition-all shadow-[0_12px_24px_rgba(37,99,235,0.25)] active:scale-[0.98] flex items-center justify-center gap-3 h-[64px]"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <span>INITIALIZE NODE</span>
            )}
          </button>
          
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
               <p className="text-red-500 text-xs font-black uppercase tracking-widest mt-3">{error}</p>
            </motion.div>
          )}
        </form>

        <div className="mt-14 flex items-center gap-10 border-t border-[#E2E8F0] pt-8 w-full justify-center">
          <div className="flex items-center gap-3">
            <Zap size={18} className="text-[#10B981]" />
            <span className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">Low Latency</span>
          </div>
          <div className="flex items-center gap-3">
            <Lock size={18} className="text-[#10B981]" />
            <span className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">Encrypted Link</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
