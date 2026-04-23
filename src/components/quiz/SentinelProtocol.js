"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, AlertTriangle, XCircle, MonitorOff } from "lucide-react";

export default function SentinelProtocol({ onViolation, onTermination, active = true }) {
  const [violations, setViolations] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [lastViolationType, setLastViolationType] = useState("");
  
  const MAX_VIOLATIONS = 3;

  useEffect(() => {
    if (!active) return;

    // 1. Tab Switching Detection
    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerViolation("Tab Switching / Background Activity Detected");
      }
    };

    // 2. Window Blur Detection
    const handleBlur = () => {
      triggerViolation("Interface Focus Lost / External Application Interaction");
    };

    // 3. Right Click Restriction
    const handleContextMenu = (e) => {
      e.preventDefault();
      triggerViolation("Unauthorized Signature Request (Right Click)");
    };

    // 4. Keyboard Restrictions (Copy, Paste, DevTools)
    const handleKeyDown = (e) => {
      // Block Ctrl/Cmd + C, V, X, A, J, I, U, F12
      const forbiddenKeys = ["c", "v", "x", "a", "j", "i", "u"];
      if ((e.ctrlKey || e.metaKey) && forbiddenKeys.includes(e.key.toLowerCase())) {
        e.preventDefault();
        triggerViolation(`Unauthorized Protocol Command (${e.key.toUpperCase()})`);
      }
      
      if (e.key === "F12" || (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J" || e.key === "C"))) {
        e.preventDefault();
        triggerViolation("Unauthorized Terminal Access (DevTools)");
      }
    };

    // 5. Copy/Paste Events
    const handleCopyPaste = (e) => {
      e.preventDefault();
      triggerViolation("Integrity Violation (Copy/Paste Attempt)");
    };

    const triggerViolation = (type) => {
      setViolations(prev => {
        const nextCount = prev + 1;
        setLastViolationType(type);
        setShowWarning(true);
        
        if (onViolation) onViolation(nextCount, type);
        
        if (nextCount >= MAX_VIOLATIONS) {
          if (onTermination) onTermination();
        }
        
        return nextCount;
      });
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("copy", handleCopyPaste);
    window.addEventListener("paste", handleCopyPaste);
    window.addEventListener("cut", handleCopyPaste);

    return () => {
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("copy", handleCopyPaste);
      window.removeEventListener("paste", handleCopyPaste);
      window.removeEventListener("cut", handleCopyPaste);
    };
  }, [active]);

  return (
    <>
      <AnimatePresence>
        {showWarning && violations < MAX_VIOLATIONS && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#0F172A]/90 backdrop-blur-xl p-6"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-sm bg-white rounded-[32px] p-8 text-center space-y-6 shadow-xl border-2 border-amber-400"
            >
              <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto relative">
                <AlertTriangle className="text-amber-500 w-8 h-8" />
              </div>
              
              <div className="space-y-3">
                <h2 className="text-xl font-black text-[#0F172A] tracking-tighter uppercase leading-none">Security Alert</h2>
                <p className="text-[8px] font-black text-amber-600 uppercase tracking-[0.3em] leading-loose">Integrity Compromised: {lastViolationType}</p>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 mt-4">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Violations</span>
                    <span className="text-xs font-black text-rose-500 uppercase">{violations} / {MAX_VIOLATIONS}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(violations / MAX_VIOLATIONS) * 100}%` }}
                      className="h-full bg-rose-500" 
                    />
                  </div>
                </div>
              </div>
 
              <p className="text-[9px] font-black text-[#94A3B8] uppercase tracking-[0.15em] leading-relaxed">
                Sentinel detected an unauthorized interaction. Repeated breaches will terminate the session.
              </p>
 
              <button
                onClick={() => setShowWarning(false)}
                className="w-full py-4 bg-[#0F172A] text-white rounded-xl font-black text-[10px] uppercase tracking-[0.3em] active:scale-95 transition-all shadow-lg"
              >
                Acknowledge
              </button>
            </motion.div>
          </motion.div>
        )}
 
        {violations >= MAX_VIOLATIONS && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[1001] flex items-center justify-center bg-rose-600 p-6"
          >
            <div className="text-center space-y-6 text-white max-w-md">
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-white/40">
                <XCircle size={48} className="text-white" />
              </div>
              <div className="space-y-3">
                <h1 className="text-4xl font-black tracking-tighter uppercase leading-none">Access Revoked</h1>
                <p className="text-[10px] font-black opacity-60 uppercase tracking-[0.4em]">Integrity Breach Detected</p>
              </div>
              <p className="text-base font-black opacity-80 leading-relaxed uppercase tracking-tight">
                Authorization revoked ({violations}/{MAX_VIOLATIONS}). Report synchronized with administration node.
              </p>
              <div className="p-6 bg-white/10 rounded-[24px] border border-white/20">
                <p className="text-[8px] font-black uppercase tracking-[0.3em] mb-1.5 opacity-60">Final Violation Flag</p>
                <p className="text-lg font-black uppercase tracking-widest">{lastViolationType}</p>
              </div>
              <button
                onClick={() => window.location.href = "/"}
                className="px-10 py-5 bg-white text-rose-600 rounded-xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-rose-50 transition-all shadow-xl"
              >
                Exit Terminal
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
 
      {/* Floating Sentinel Indicator */}
      <div className="fixed top-4 right-4 z-[500] flex items-center gap-3">
        <div className="bg-white/80 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/20 shadow-lg flex items-center gap-3">
          <div className="relative">
             <div className="w-2 h-2 bg-emerald-500 rounded-full" />
             <div className="absolute inset-0 bg-emerald-500/40 rounded-full animate-ping" />
          </div>
          <div className="flex flex-col">
             <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-0.5">Sentinel Active</span>
             <span className="text-[7px] font-black text-[#94A3B8] uppercase tracking-[0.1em] leading-none">Proctoring Mode Alpha</span>
          </div>
        </div>
      </div>
    </>
  );
}
