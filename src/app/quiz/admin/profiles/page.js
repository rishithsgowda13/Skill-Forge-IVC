"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import {
  Search,
  Pencil,
  Check,
  X,
  Star,
  Loader2,
  Users,
  Mail,
  Hash,
  GraduationCap,
  Phone,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Trash2,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Categorized skills list (must match interview page for correct mapping)
const SKILL_CATEGORIES = {
  "Programming": ["JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "Go", "Rust", "Ruby", "PHP", "Swift", "Kotlin"],
  "Web Tech": ["React", "Next.js", "Vue.js", "Angular", "Node.js", "Express.js", "Django", "Flask", "Spring Boot", "HTML/CSS", "Tailwind CSS", "GraphQL", "REST APIs", "WebSocket"],
  "Data & AI": ["Machine Learning", "Deep Learning", "Natural Language Processing", "Computer Vision", "Data Analysis", "Data Engineering", "TensorFlow", "PyTorch", "Pandas", "NumPy", "Power BI", "Tableau", "SQL", "NoSQL"],
  "Cloud & DevOps": ["AWS", "Azure", "Google Cloud", "Docker", "Kubernetes", "CI/CD", "Terraform", "Linux"],
  "Design & Product": ["UI/UX Design", "Figma", "Adobe XD", "Product Management", "Agile/Scrum"],
  "Soft Skills": ["Communication", "Leadership", "Problem Solving", "Critical Thinking", "Team Collaboration", "Time Management", "Public Speaking", "Negotiation", "Adaptability", "Creativity"]
};

const SECTORS = Object.keys(SKILL_CATEGORIES);

// ─── Radar Chart Component ──────────────────────────────────────────────────
function RadarChart({ skills }) {
  const size = 200;
  const center = size / 2;
  const radius = center * 0.7;
  
  // Calculate averages per sector
  const data = SECTORS.map(sector => {
    const sectorSkills = SKILL_CATEGORIES[sector];
    const candidateSkills = (skills || []).filter(s => sectorSkills.includes(s.skill));
    const avg = candidateSkills.length > 0 
      ? candidateSkills.reduce((sum, s) => sum + s.rating, 0) / candidateSkills.length 
      : 0;
    return avg; // 0 to 5
  });

  // Helper to get coordinates
  const getCoords = (value, index, total) => {
    const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
    const r = (value / 5) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle)
    };
  };

  // Web background lines (5 levels)
  const webLines = [1, 2, 3, 4, 5].map(level => {
    return SECTORS.map((_, i) => {
      const p = getCoords(level, i, SECTORS.length);
      return `${p.x},${p.y}`;
    }).join(" ");
  });

  // Data path
  const dataPoints = data.map((v, i) => {
    const p = getCoords(v, i, SECTORS.length);
    return `${p.x},${p.y}`;
  }).join(" ");

  return (
    <div className="relative flex flex-col items-center">
      <svg width={size} height={size} className="overflow-visible">
        {/* Background Web */}
        {webLines.map((points, i) => (
          <polygon
            key={i}
            points={points}
            fill="none"
            stroke="#F1F5F9"
            strokeWidth="1"
          />
        ))}
        {/* Axis lines */}
        {SECTORS.map((_, i) => {
          const p = getCoords(5, i, SECTORS.length);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={p.x}
              y2={p.y}
              stroke="#F1F5F9"
              strokeWidth="1"
            />
          );
        })}
        {/* Data Area */}
        <motion.polygon
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          points={dataPoints}
          fill="rgba(37, 99, 235, 0.15)"
          stroke="#2563EB"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* Sector Labels */}
        {SECTORS.map((label, i) => {
          const p = getCoords(5.8, i, SECTORS.length);
          return (
            <text
              key={i}
              x={p.x}
              y={p.y}
              fontSize="7"
              fontWeight="900"
              fill="#94A3B8"
              textAnchor="middle"
              className="uppercase tracking-tighter"
            >
              {label.split(" ").map((word, j) => (
                <tspan key={j} x={p.x} dy={j > 0 ? "8" : "0"}>{word}</tspan>
              ))}
            </text>
          );
        })}
      </svg>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <Zap size={16} className="text-blue-500/20" />
      </div>
    </div>
  );
}

// ─── Star display (read-only) ────────────────────────────────────────────────
function StarBadge({ rating }) {
  if (!rating || rating === 0) return null;
  return (
    <span className="flex items-center gap-0.5 text-amber-500">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={10}
          className={i < rating ? "fill-amber-400 text-amber-400" : "text-slate-100"}
        />
      ))}
    </span>
  );
}

// ─── Individual profile card ────────────────────────────────────────────────
function ProfileCard({ candidate, onSave, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [name, setName] = useState(candidate.full_name || "");
  const [usn, setUsn] = useState(candidate.usn || "");
  const [toast, setToast] = useState(null);
  const supabase = createClient();

  let skills = [];
  try {
    if (candidate.skill_profile) {
      const parsed = typeof candidate.skill_profile === "string"
          ? JSON.parse(candidate.skill_profile)
          : candidate.skill_profile;
      skills = (parsed || []).filter((s) => s.skill && s.rating > 0);
    }
  } catch (_) {}

  const avgRating = skills.length > 0
      ? (skills.reduce((s, k) => s + k.rating, 0) / skills.length).toFixed(1)
      : null;

  async function handleSave() {
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ full_name: name.trim(), usn: usn.trim() }).eq("id", candidate.id);
    if (error) {
      showToast("Failed to save changes.", "error");
    } else {
      showToast("Profile updated!", "success");
      onSave(candidate.id, { full_name: name.trim(), usn: usn.trim() });
      setEditing(false);
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    const { error } = await supabase.from("profiles").update({ skill_profile: null }).eq("id", candidate.id);
    if (error) {
      showToast("Delete failed.", "error");
      setDeleting(false);
    } else {
      onDelete(candidate.id);
    }
  }

  function showToast(msg, type) {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  return (
    <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-[#E2E8F0] rounded-[32px] overflow-hidden shadow-sm hover:shadow-xl transition-all flex flex-col h-full">
      <div className="p-8 space-y-6 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="w-14 h-14 rounded-2xl bg-[#0F172A] flex items-center justify-center text-white font-black text-xl flex-shrink-0 shadow-lg shadow-slate-200">
              {(editing ? name : candidate.full_name)?.[0]?.toUpperCase() || "?"}
            </div>
            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="space-y-2">
                  <input value={name} onChange={(e) => setName(e.target.value)} className="w-full text-sm font-black text-[#0F172A] border-b-2 border-blue-500 bg-transparent outline-none pb-0.5" placeholder="Full name" autoFocus />
                  <div className="flex items-center gap-2">
                    <Hash size={11} className="text-[#94A3B8] flex-shrink-0" />
                    <input value={usn} onChange={(e) => setUsn(e.target.value)} className="w-full text-[11px] font-black text-[#64748B] uppercase border-b border-slate-300 bg-transparent outline-none pb-0.5" placeholder="USN" />
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-lg font-black text-[#0F172A] truncate leading-tight">{candidate.full_name || "—"}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Hash size={10} className="text-[#94A3B8]" />
                    <span className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">{candidate.usn || "NO-USN"}</span>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {editing ? (
              <button onClick={handleSave} disabled={saving} className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-md">{saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}</button>
            ) : (
              <>
                <button onClick={() => setEditing(true)} className="p-2.5 text-[#94A3B8] hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Pencil size={14} /></button>
                <button onClick={handleDelete} disabled={deleting} className={`p-2.5 rounded-xl transition-all ${confirmDelete ? "bg-rose-500 text-white animate-pulse" : "text-[#94A3B8] hover:text-rose-500 hover:bg-rose-50"}`}>{deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}</button>
              </>
            )}
          </div>
        </div>

        {/* Visual Mapping Graph */}
        <div className="bg-[#F8FAFC] rounded-[24px] p-6 flex justify-center border border-slate-50">
          <RadarChart skills={skills} />
        </div>

        {/* Info */}
        <div className="grid grid-cols-2 gap-4">
           <div className="space-y-1">
              <p className="text-[8px] font-black text-[#94A3B8] uppercase tracking-widest">Skill Score</p>
              <div className="flex items-center gap-2">
                 <Star size={14} className="fill-amber-400 text-amber-400" />
                 <span className="text-sm font-black text-[#0F172A]">{avgRating || "0.0"}</span>
              </div>
           </div>
           <div className="space-y-1">
              <p className="text-[8px] font-black text-[#94A3B8] uppercase tracking-widest">Post</p>
              <span className="px-2 py-0.5 bg-violet-50 text-violet-600 border border-violet-100 rounded text-[9px] font-black uppercase tracking-widest">MEMBER</span>
           </div>
        </div>
      </div>

      {/* Skills Footer */}
      <div className="px-8 pb-8">
        <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between border-t border-[#F1F5F9] pt-6 group">
          <span className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest group-hover:text-blue-500 transition-colors">Assessment Details ({skills.length})</span>
          {expanded ? <ChevronUp size={14} className="text-[#94A3B8]" /> : <ChevronDown size={14} className="text-[#94A3B8]" />}
        </button>
        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-2 mt-4">
              {skills.map((s) => (
                <div key={s.skill} className="flex items-center justify-between py-1.5">
                  <span className="text-[12px] font-bold text-[#0F172A]">{s.skill}</span>
                  <StarBadge rating={s.rating} />
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`mx-6 mb-6 px-4 py-3 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${toast.type === "success" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-rose-50 text-rose-600 border border-rose-100"}`}>
            {toast.type === "success" ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminProfilesPage() {
  const router = useRouter();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const supabase = createClient();

  useEffect(() => {
    async function checkAndLoad() {
      const { data: { user } } = await supabase.auth.getUser();
      const mockSession = document.cookie.split("; ").find((r) => r.startsWith("mock_session="))?.split("=")[1];
      if (!user && !mockSession?.startsWith("admin")) { router.push("/auth"); return; }
      
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "candidate")
        .not("skill_profile", "is", null)
        .order("full_name", { ascending: true });

      const withRatedSkills = (data || []).filter((c) => {
        try {
          const parsed = typeof c.skill_profile === "string" ? JSON.parse(c.skill_profile) : c.skill_profile;
          return Array.isArray(parsed) && parsed.some((s) => s.skill && s.rating > 0);
        } catch { return false; }
      });
      setCandidates(withRatedSkills);
      setLoading(false);
    }
    checkAndLoad();
  }, []);

  const filtered = candidates.filter((c) =>
      c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.usn?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 md:p-14 space-y-12">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-5xl font-black text-[#0F172A] tracking-tighter uppercase leading-none">
            Member <span className="text-[#2563EB]">Vault</span>
          </h1>
          <p className="text-[11px] font-black text-[#94A3B8] uppercase tracking-[0.5em] mt-3">
            VERIFIED COMPETENCY PROFILES & SKILL MAPPING
          </p>
        </div>
        <div className="bg-white border border-[#E2E8F0] px-5 py-3 rounded-[24px] flex items-center gap-3 w-full lg:w-96 shadow-sm">
          <Search size={18} className="text-[#94A3B8]" />
          <input type="text" placeholder="Search vault by identity..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-transparent border-none outline-none text-sm font-bold w-full placeholder:text-[#CBD5E1]" />
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 opacity-20">
          <Loader2 size={48} className="animate-spin text-[#2563EB]" />
          <p className="text-[11px] font-black uppercase tracking-[0.4em]">Accessing Node Credentials...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-dashed border-[#E2E8F0] rounded-[40px] p-24 text-center">
          <Users size={56} className="mx-auto text-[#CBD5E1] mb-6" />
          <p className="text-base font-bold text-[#64748B]">No verified profiles found in the vault.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
          {filtered.map((c) => (
            <ProfileCard key={c.id} candidate={c} onSave={(id, upd) => setCandidates(p => p.map(x => x.id === id ? {...x, ...upd} : x))} onDelete={(id) => setCandidates(p => p.filter(x => x.id !== id))} />
          ))}
        </div>
      )}
    </div>
  );
}
