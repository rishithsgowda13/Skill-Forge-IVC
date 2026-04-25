"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { createPortal } from "react-dom";
import {
  Users,
  Search,
  Star,
  Loader2,
  Save,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  X,
  Sparkles,
  Award,
  UserCheck,
  Plus,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Categorized skills list for sector mapping
const SKILL_CATEGORIES = {
  "Programming": ["JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "Go", "Rust", "Ruby", "PHP", "Swift", "Kotlin"],
  "Web Tech": ["React", "Next.js", "Vue.js", "Angular", "Node.js", "Express.js", "Django", "Flask", "Spring Boot", "HTML/CSS", "Tailwind CSS", "GraphQL", "REST APIs", "WebSocket"],
  "Data & AI": ["Machine Learning", "Deep Learning", "Natural Language Processing", "Computer Vision", "Data Analysis", "Data Engineering", "TensorFlow", "PyTorch", "Pandas", "NumPy", "Power BI", "Tableau", "SQL", "NoSQL"],
  "Cloud & DevOps": ["AWS", "Azure", "Google Cloud", "Docker", "Kubernetes", "CI/CD", "Terraform", "Linux"],
  "Design & Product": ["UI/UX Design", "Figma", "Adobe XD", "Product Management", "Agile/Scrum"],
  "Soft Skills": ["Communication", "Leadership", "Problem Solving", "Critical Thinking", "Team Collaboration", "Time Management", "Public Speaking", "Negotiation", "Adaptability", "Creativity"],
  "Specialized": ["Cybersecurity", "Blockchain", "IoT", "Embedded Systems", "Mobile Development", "Game Development", "AR/VR", "Robotics", "3D Modeling", "Digital Marketing", "SEO", "Content Writing", "Project Management", "Business Analysis", "Financial Analysis"]
};

const SKILL_OPTIONS = Object.values(SKILL_CATEGORIES).flat();

// ─── Star rating ──────────────────────────────────────────────────────────────
function StarRating({ rating, onRate, disabled = false }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !disabled && onRate(star)}
          onMouseEnter={() => !disabled && setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          disabled={disabled}
          className={`transition-all duration-150 ${
            disabled ? "cursor-default opacity-40" : "cursor-pointer hover:scale-125 active:scale-90"
          }`}
        >
          <Star
            size={20}
            className={`transition-colors ${
              star <= (hovered || rating)
                ? "text-amber-400 fill-amber-400"
                : "text-slate-200"
            }`}
          />
        </button>
      ))}
      {rating > 0 && (
        <span className="ml-1.5 text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
          {rating}/5
        </span>
      )}
    </div>
  );
}

// ─── Portal dropdown — renders at root so nothing clips it ───────────────────
function SkillDropdown({ value, onChange, usedSkills }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef(null);

  const available = SKILL_OPTIONS.filter(
    (s) => (!usedSkills.includes(s) || s === value) &&
            s.toLowerCase().includes(search.toLowerCase())
  );

  const open = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const dropH = Math.min(available.length * 38 + 60, 260);
    const openUp = spaceBelow < dropH && rect.top > dropH;
    setDropPos({
      top: openUp ? rect.top - dropH - 4 : rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      openUp,
    });
    setIsOpen(true);
  }, [available.length]);

  const close = useCallback(() => {
    setIsOpen(false);
    setSearch("");
  }, []);

  const toggle = () => (isOpen ? close() : open());

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border-2 transition-all text-left ${
          isOpen
            ? "border-violet-400 bg-violet-50/40 shadow-sm"
            : value
            ? "border-[#E2E8F0] bg-white hover:border-violet-200"
            : "border-dashed border-[#E2E8F0] bg-[#F8FAFC] hover:border-violet-300"
        }`}
      >
        <span className={`text-xs font-semibold ${value ? "text-[#0F172A]" : "text-[#94A3B8]"}`}>
          {value || "Select a skill…"}
        </span>
        <ChevronDown
          size={13}
          className={`text-[#94A3B8] transition-transform flex-shrink-0 ml-2 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen &&
        createPortal(
          <>
            <div className="fixed inset-0 z-[9998]" onClick={close} />
            <div
              style={{
                position: "fixed",
                top: dropPos.top,
                left: dropPos.left,
                width: dropPos.width,
                zIndex: 9999,
              }}
              className="bg-white border-2 border-[#E2E8F0] rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-2.5 border-b border-[#F1F5F9]">
                <div className="flex items-center gap-2 bg-[#F8FAFC] rounded-xl px-3 py-1.5 border border-[#F1F5F9]">
                  <Search size={12} className="text-[#94A3B8] flex-shrink-0" />
                  <input
                    autoFocus
                    type="text"
                    placeholder="Search skills…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="bg-transparent text-xs font-semibold w-full outline-none placeholder:text-[#CBD5E1]"
                  />
                </div>
              </div>
              <div className="max-h-52 overflow-y-auto">
                {available.length === 0 ? (
                  <div className="py-5 text-center text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">
                    No match
                  </div>
                ) : (
                  available.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => { onChange(skill); close(); }}
                      className={`w-full text-left px-4 py-2 text-xs font-semibold transition-colors hover:bg-violet-50 hover:text-violet-700 ${
                        skill === value ? "bg-violet-50 text-violet-700" : "text-[#64748B]"
                      }`}
                    >
                      {skill}
                    </button>
                  ))
                )}
              </div>
            </div>
          </>,
          document.body
        )}
    </>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function InterviewPanelPage() {
  const router = useRouter();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [toast, setToast] = useState(null);
  const [skillProfiles, setSkillProfiles] = useState({});
  const supabase = createClient();

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      const mockSession = document.cookie.split("; ").find((r) => r.startsWith("mock_session="))?.split("=")[1];
      const isMockAdmin = mockSession?.startsWith("admin");
      if (!user && !isMockAdmin) { router.push("/auth"); return; }
      if (user && !isMockAdmin) {
        const { data: prof } = await supabase.from("profiles").select("role").eq("id", user.id).single();
        if (prof?.role !== "admin" && prof?.role !== "evaluator") { router.push("/"); return; }
      }
      loadCandidates();
    }
    checkAuth();
  }, []);

  async function loadCandidates() {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "candidate")
      .eq("round2_status", "selected_round3");

    const list = data || [];
    setCandidates(list);

    const init = {};
    list.forEach((c) => {
      try {
        const parsed = c.skill_profile
          ? (typeof c.skill_profile === "string" ? JSON.parse(c.skill_profile) : c.skill_profile)
          : empty();
        init[c.id] = (Array.isArray(parsed) && parsed.length > 0) ? parsed : empty();
      } catch { init[c.id] = empty(); }
    });
    setSkillProfiles(init);
    setLoading(false);
  }

  const empty = () => [{ skill: "", rating: 0 }, { skill: "", rating: 0 }, { skill: "", rating: 0 }];

  const setSkill = (uid, idx, skill) =>
    setSkillProfiles((p) => {
      const arr = [...(p[uid] || empty())];
      arr[idx] = { ...arr[idx], skill };
      return { ...p, [uid]: arr };
    });

  const setRating = (uid, idx, rating) =>
    setSkillProfiles((p) => {
      const arr = [...(p[uid] || empty())];
      arr[idx] = { ...arr[idx], rating };
      return { ...p, [uid]: arr };
    });

  const addSlot = (uid) =>
    setSkillProfiles((p) => ({
      ...p,
      [uid]: [...(p[uid] || []), { skill: "", rating: 0 }]
    }));

  const removeSlot = (uid, idx) =>
    setSkillProfiles((p) => {
      const arr = [...(p[uid] || [])];
      arr.splice(idx, 1);
      return { ...p, [uid]: arr };
    });

  const usedSkills = (uid) => (skillProfiles[uid] || []).map((s) => s.skill).filter(Boolean);

  const avgRating = (uid) => {
    const rated = (skillProfiles[uid] || []).filter((s) => s.skill && s.rating > 0);
    return rated.length ? (rated.reduce((a, s) => a + s.rating, 0) / rated.length).toFixed(1) : "0";
  };

  async function saveProfile(uid) {
    setSavingId(uid);
    const cleanProfile = (skillProfiles[uid] || []).filter(s => s.skill);
    const { error } = await supabase
      .from("profiles")
      .update({ skill_profile: JSON.stringify(cleanProfile.length ? cleanProfile : []) })
      .eq("id", uid);
    showToast(error ? "Failed to save." : "Skill profile saved!", error ? "error" : "success");
    setSavingId(null);
  }

  const showToast = (message, type = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const filtered = candidates.filter(
    (c) =>
      c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 md:p-14 space-y-10">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-[0.3em] border border-amber-200 flex items-center gap-1.5">
              <Sparkles size={11} /> Personal Interview
            </div>
          </div>
          <h1 className="text-4xl font-black text-[#0F172A] tracking-tighter uppercase leading-none">
            Skill <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">Profiling</span>
          </h1>
          <p className="text-[11px] font-black text-[#94A3B8] uppercase tracking-[0.4em] mt-2">
            Dynamic Assessment · Sector Mapping Enabled
          </p>
        </div>
        <div className="bg-white border border-[#E2E8F0] px-4 py-2 rounded-2xl flex items-center gap-2 w-full lg:w-72 shadow-sm">
          <Search size={15} className="text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Search candidates…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none outline-none text-xs font-semibold w-full placeholder:text-[#CBD5E1]"
          />
        </div>
      </header>

      {/* Candidate cards */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 opacity-20">
          <Loader2 size={36} className="animate-spin text-violet-600" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em]">Loading Interview Pool</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-dashed border-[#E2E8F0] rounded-[32px] p-20 text-center">
          <Users size={44} className="mx-auto text-[#CBD5E1] mb-4" />
          <p className="text-sm font-bold text-[#64748B]">No candidates selected for interview yet.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {filtered.map((candidate, i) => {
            const profile = skillProfiles[candidate.id] || empty();
            const avg = avgRating(candidate.id);
            const used = usedSkills(candidate.id);

            return (
              <motion.div
                key={candidate.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-white border-2 border-[#E2E8F0] rounded-[28px] shadow-sm"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 border-b border-[#F1F5F9]">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-md shadow-violet-100">
                      {candidate.full_name?.[0] || "?"}
                    </div>
                    <div>
                      <p className="text-base font-black text-[#0F172A]">{candidate.full_name}</p>
                      <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">{candidate.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-black ${
                      parseFloat(avg) >= 4 ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                      : parseFloat(avg) >= 2.5 ? "bg-amber-50 border-amber-100 text-amber-700"
                      : "bg-slate-50 border-slate-100 text-slate-400"
                    }`}>
                      <Star size={13} className={parseFloat(avg) > 0 ? "fill-current" : ""} />
                      <span>{avg}</span>
                    </div>
                    <button
                      onClick={() => saveProfile(candidate.id)}
                      disabled={savingId === candidate.id}
                      className="flex items-center gap-2 bg-[#0F172A] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all active:scale-95 disabled:opacity-50 shadow-md"
                    >
                      {savingId === candidate.id ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                      Save
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Sparkles size={14} className="text-violet-500" />
                      <span className="text-[10px] font-black text-[#0F172A] uppercase tracking-[0.2em]">Competency Matrix</span>
                    </div>
                    <span className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest">{used.length} Skills Profiled</span>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {profile.map((slot, idx) => (
                      <div
                        key={idx}
                        className="grid items-center gap-3 py-2"
                        style={{ gridTemplateColumns: "28px 1fr auto auto" }}
                      >
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black ${slot.skill ? "bg-violet-100 text-violet-700" : "bg-slate-100 text-slate-400"}`}>
                          {idx + 1}
                        </div>
                        <SkillDropdown
                          value={slot.skill}
                          onChange={(skill) => setSkill(candidate.id, idx, skill)}
                          usedSkills={used}
                        />
                        <StarRating
                          rating={slot.rating}
                          onRate={(r) => setRating(candidate.id, idx, r)}
                          disabled={!slot.skill}
                        />
                        <button
                          type="button"
                          onClick={() => removeSlot(candidate.id, idx)}
                          className="p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => addSlot(candidate.id)}
                    className="w-full mt-4 py-3 rounded-xl border-2 border-dashed border-[#E2E8F0] text-[9px] font-black text-[#94A3B8] uppercase tracking-[0.3em] hover:border-violet-300 hover:text-violet-600 hover:bg-violet-50 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus size={12} />
                    Add Skill Assessment Slot
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Toast */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] w-full max-w-lg px-6 pointer-events-none">
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.92 }}
              className={`pointer-events-auto p-5 rounded-[22px] flex items-center gap-3 shadow-2xl border-2 ${
                toast.type === "success" ? "bg-white border-emerald-100 text-emerald-600" : "bg-white border-rose-100 text-rose-600"
              }`}
            >
              {toast.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <p className="text-sm font-black uppercase tracking-wide">{toast.message}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
