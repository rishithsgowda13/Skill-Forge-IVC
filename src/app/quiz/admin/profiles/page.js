"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { createPortal } from "react-dom";
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
  Maximize2,
  Plus,
  Tag,
  Save,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Categorized skills — must match interview page
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
const DOMAIN_NAMES = Object.keys(SKILL_CATEGORIES);
const SECTORS = DOMAIN_NAMES;

// Domain color map
const DOMAIN_COLORS = {
  "Programming": "bg-blue-50 text-blue-600 border-blue-200",
  "Web Tech": "bg-cyan-50 text-cyan-600 border-cyan-200",
  "Data & AI": "bg-purple-50 text-purple-600 border-purple-200",
  "Cloud & DevOps": "bg-orange-50 text-orange-600 border-orange-200",
  "Design & Product": "bg-pink-50 text-pink-600 border-pink-200",
  "Soft Skills": "bg-emerald-50 text-emerald-600 border-emerald-200",
  "Specialized": "bg-amber-50 text-amber-600 border-amber-200",
};

// Find domain for a skill — checks custom domain field first, then default mapping
function findDomain(skillObj) {
  if (skillObj.domain) return skillObj.domain;
  for (const [cat, skills] of Object.entries(SKILL_CATEGORIES)) {
    if (skills.includes(skillObj.skill)) return cat;
  }
  return "Specialized"; // fallback
}

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
            size={16}
            className={`transition-colors ${
              star <= (hovered || rating)
                ? "text-amber-400 fill-amber-400"
                : "text-slate-200"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

// ─── Portal dropdown with custom skill + domain mapping ─────────────────────
function SkillDropdown({ value, onChange, usedSkills, domain, onDomainChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 });
  const [showDomainPicker, setShowDomainPicker] = useState(false);
  const triggerRef = useRef(null);

  const available = SKILL_OPTIONS.filter(
    (s) => (!usedSkills.includes(s) || s === value) &&
            s.toLowerCase().includes(search.toLowerCase())
  );

  const isCustom = search.trim().length > 0 && available.length === 0;

  const open = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const dropH = 300;
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
    setShowDomainPicker(false);
  }, []);

  const toggle = () => (isOpen ? close() : open());

  const handleCustomSkill = (selectedDomain) => {
    const customName = search.trim();
    onChange(customName);
    onDomainChange(selectedDomain);
    close();
  };

  // Find domain for current value
  const currentDomain = domain || DOMAIN_NAMES.find(d => SKILL_CATEGORIES[d].includes(value)) || null;

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
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className={`text-xs font-semibold truncate ${value ? "text-[#0F172A]" : "text-[#94A3B8]"}`}>
            {value || "Select a skill…"}
          </span>
          {value && currentDomain && (
            <span className={`text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border flex-shrink-0 ${DOMAIN_COLORS[currentDomain] || "bg-slate-50 text-slate-500 border-slate-200"}`}>
              {currentDomain}
            </span>
          )}
        </div>
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
              {/* Search */}
              <div className="p-2.5 border-b border-[#F1F5F9]">
                <div className="flex items-center gap-2 bg-[#F8FAFC] rounded-xl px-3 py-1.5 border border-[#F1F5F9]">
                  <Search size={12} className="text-[#94A3B8] flex-shrink-0" />
                  <input
                    autoFocus
                    type="text"
                    placeholder="Search or type a custom skill…"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setShowDomainPicker(false); }}
                    className="bg-transparent text-xs font-semibold w-full outline-none placeholder:text-[#CBD5E1]"
                  />
                </div>
              </div>

              <div className="max-h-60 overflow-y-auto">
                {/* Existing skills */}
                {available.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => { onChange(skill); onDomainChange(null); close(); }}
                    className={`w-full text-left px-4 py-2 text-xs font-semibold transition-colors hover:bg-violet-50 hover:text-violet-700 flex items-center justify-between ${
                      skill === value ? "bg-violet-50 text-violet-700" : "text-[#64748B]"
                    }`}
                  >
                    <span>{skill}</span>
                    <span className="text-[7px] font-black text-[#CBD5E1] uppercase">
                      {DOMAIN_NAMES.find(d => SKILL_CATEGORIES[d].includes(skill))}
                    </span>
                  </button>
                ))}

                {/* Custom skill option */}
                {isCustom && !showDomainPicker && (
                  <button
                    type="button"
                    onClick={() => setShowDomainPicker(true)}
                    className="w-full text-left px-4 py-3 text-xs font-bold text-violet-700 bg-violet-50 hover:bg-violet-100 transition-colors flex items-center gap-2 border-t border-[#F1F5F9]"
                  >
                    <Plus size={12} />
                    Add "<span className="font-black">{search.trim()}</span>" as custom skill →
                  </button>
                )}

                {/* Domain picker for custom skill */}
                {isCustom && showDomainPicker && (
                  <div className="border-t border-[#F1F5F9] p-3 space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Tag size={11} className="text-violet-500" />
                      <p className="text-[9px] font-black text-[#0F172A] uppercase tracking-widest">
                        Map "<span className="text-violet-600">{search.trim()}</span>" to a domain:
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {DOMAIN_NAMES.map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => handleCustomSkill(d)}
                          className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all hover:scale-[1.02] active:scale-95 ${DOMAIN_COLORS[d]}`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* No results fallback */}
                {available.length === 0 && !isCustom && (
                  <div className="py-5 text-center text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">
                    No match
                  </div>
                )}
              </div>
            </div>
          </>,
          document.body
        )}
    </>
  );
}

// ─── Radar Chart Component (reusable at any size) ───────────────────────────
function RadarChart({ skills, size = 200, showLabels = true, showDots = false }) {
  const center = size / 2;
  const radius = center * 0.65;
  const labelRadius = center * 0.88;

  // Calculate averages per sector
  const data = SECTORS.map(sector => {
    const matched = (skills || []).filter(s => findDomain(s) === sector);
    return matched.length > 0
      ? matched.reduce((sum, s) => sum + s.rating, 0) / matched.length
      : 0;
  });

  const getCoords = (value, index) => {
    const angle = (Math.PI * 2 * index) / SECTORS.length - Math.PI / 2;
    const r = (value / 5) * radius;
    return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) };
  };

  const getLabelCoords = (index) => {
    const angle = (Math.PI * 2 * index) / SECTORS.length - Math.PI / 2;
    return { x: center + labelRadius * Math.cos(angle), y: center + labelRadius * Math.sin(angle) };
  };

  // Web background
  const webLines = [1, 2, 3, 4, 5].map(level =>
    SECTORS.map((_, i) => {
      const p = getCoords(level, i);
      return `${p.x},${p.y}`;
    }).join(" ")
  );

  // Data polygon
  const dataPoints = data.map((v, i) => {
    const p = getCoords(v, i);
    return `${p.x},${p.y}`;
  }).join(" ");

  const fontSize = Math.max(7, size * 0.035);

  return (
    <svg width={size} height={size} className="overflow-visible">
      {/* Background Web */}
      {webLines.map((points, i) => (
        <polygon key={i} points={points} fill={i === 4 ? "rgba(241,245,249,0.3)" : "none"} stroke="#E2E8F0" strokeWidth={i === 4 ? "1.5" : "0.5"} />
      ))}
      {/* Axis lines */}
      {SECTORS.map((_, i) => {
        const p = getCoords(5, i);
        return <line key={i} x1={center} y1={center} x2={p.x} y2={p.y} stroke="#F1F5F9" strokeWidth="0.5" />;
      })}
      {/* Data Area */}
      <polygon
        points={dataPoints}
        fill="rgba(37, 99, 235, 0.12)"
        stroke="#2563EB"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Data Dots */}
      {showDots && data.map((v, i) => {
        if (v === 0) return null;
        const p = getCoords(v, i);
        return <circle key={i} cx={p.x} cy={p.y} r="4" fill="#2563EB" stroke="white" strokeWidth="2" />;
      })}
      {/* Sector Labels */}
      {showLabels && SECTORS.map((label, i) => {
        const p = getLabelCoords(i);
        const val = data[i];
        return (
          <g key={i}>
            <text x={p.x} y={p.y} fontSize={fontSize} fontWeight="900" fill={val > 0 ? "#0F172A" : "#CBD5E1"} textAnchor="middle" dominantBaseline="middle" className="uppercase">
              {label.length > 10 ? label.split(" ").map((w, j) => (
                <tspan key={j} x={p.x} dy={j > 0 ? fontSize + 2 : 0}>{w}</tspan>
              )) : label}
            </text>
            {val > 0 && (
              <text x={p.x} y={p.y + (label.split(" ").length > 1 ? (fontSize + 2) * (label.split(" ").length - 1) : 0) + fontSize + 4} fontSize={fontSize - 1} fontWeight="900" fill="#2563EB" textAnchor="middle">
                {val.toFixed(1)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ─── Radar Chart Modal (fullscreen overlay) ─────────────────────────────────
function RadarModal({ skills, name, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-[#0F172A]/60 backdrop-blur-md p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-[40px] shadow-2xl p-10 max-w-[600px] w-full relative"
      >
        <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all">
          <X size={16} className="text-slate-500" />
        </button>

        <div className="text-center mb-6">
          <h3 className="text-xl font-black text-[#0F172A] uppercase tracking-tighter">{name}</h3>
          <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.4em] mt-1">Competency Radar Map</p>
        </div>

        <div className="flex justify-center">
          <RadarChart skills={skills} size={420} showLabels={true} showDots={true} />
        </div>

        {/* Sector breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-8 border-t border-[#F1F5F9] pt-6">
          {SECTORS.map(sector => {
            const matched = (skills || []).filter(s => findDomain(s) === sector);
            const avg = matched.length > 0 ? (matched.reduce((a, s) => a + s.rating, 0) / matched.length).toFixed(1) : "0";
            return (
              <div key={sector} className="flex items-center justify-between bg-[#F8FAFC] rounded-xl px-3 py-2 border border-[#F1F5F9]">
                <span className="text-[8px] font-black text-[#64748B] uppercase tracking-widest">{sector}</span>
                <span className={`text-xs font-black ${parseFloat(avg) > 0 ? "text-[#2563EB]" : "text-[#CBD5E1]"}`}>{avg}</span>
              </div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Add Member Modal ────────────────────────────────────────────────────────
function AddMemberModal({ isOpen, onClose, onAdd }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [usn, setUsn] = useState("");
  const [loading, setLoading] = useState(false);
  const [skills, setSkills] = useState([{ skill: "", rating: 0 }]);
  const [error, setError] = useState(null);
  const supabase = createClient();

  // Reset state when modal opens to avoid showing old data
  useEffect(() => {
    if (isOpen) {
      setName("");
      setEmail("");
      setUsn("");
      setSkills([{ skill: "", rating: 0 }]);
      setError(null);
      setLoading(false);
    }
  }, [isOpen]);

  const handleAddSkill = () => setSkills([...skills, { skill: "", rating: 0 }]);
  const handleRemoveSkill = (idx) => {
    const newSkills = [...skills];
    newSkills.splice(idx, 1);
    setSkills(newSkills);
  };
  const setSkill = (idx, skill) => {
    const newSkills = [...skills];
    newSkills[idx].skill = skill;
    setSkills(newSkills);
  };
  const setRating = (idx, rating) => {
    const newSkills = [...skills];
    newSkills[idx].rating = rating;
    setSkills(newSkills);
  };
  const setDomain = (idx, domain) => {
    const newSkills = [...skills];
    newSkills[idx].domain = domain;
    setSkills(newSkills);
  };

  const handleSave = async () => {
    if (!name || !email || !usn) {
      setError("Please fill in all identity fields.");
      return;
    }
    setLoading(true);
    setError(null);

    const cleanSkills = skills.filter(s => s.skill && s.rating > 0);
    
    const { data: insertedData, error: insertError } = await supabase
      .from('member_registry')
      .insert([{
        full_name: name.trim(),
        email: email.trim().toLowerCase(),
        usn: usn.trim().toUpperCase(),
        skill_profile: cleanSkills,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
    } else {
      onAdd(insertedData);
      alert(`Member added! \n\nIdentity: ${email} \nPassword: ${email} \n\nThey can now login directly.`);
      onClose();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-[#0F172A]/40 backdrop-blur-sm p-6 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar relative"
      >
        <div className="p-8 border-b border-[#F1F5F9] sticky top-0 bg-white z-10 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-[#0F172A] uppercase tracking-tighter">Add Club Member</h2>
            <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest mt-1">Manual node registration & profiling</p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all">
            <X size={18} className="text-slate-400" />
          </button>
        </div>

        <div className="p-8 space-y-8">
          {/* Identity Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest ml-1">Full Name</label>
              <div className="relative group">
                <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                <input 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Member Name"
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl py-2.5 pl-11 pr-4 text-xs font-bold text-[#0F172A] focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest ml-1">Email (Auth Link)</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                <input 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="member@email.com"
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl py-2.5 pl-11 pr-4 text-xs font-bold text-[#0F172A] focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest ml-1">USN / Roll Number</label>
              <div className="relative group">
                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                <input 
                  value={usn}
                  onChange={(e) => setUsn(e.target.value)}
                  placeholder="1DS21CS000"
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl py-2.5 pl-11 pr-4 text-xs font-bold text-[#0F172A] focus:outline-none focus:border-blue-500 transition-all uppercase"
                />
              </div>
            </div>
          </div>

          {/* Skill Profiling Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-violet-500" />
                <span className="text-[10px] font-black text-[#0F172A] uppercase tracking-[0.2em]">Competency Assessment</span>
              </div>
              <button 
                onClick={handleAddSkill}
                className="flex items-center gap-1.5 text-[9px] font-black text-blue-600 uppercase tracking-widest hover:underline"
              >
                <Plus size={12} /> Add Skill
              </button>
            </div>

            <div className="space-y-3">
              {skills.map((slot, idx) => (
                <div key={idx} className="grid items-center gap-3 py-1" style={{ gridTemplateColumns: "24px 1fr auto auto" }}>
                  <div className="text-[10px] font-black text-slate-300">{idx + 1}</div>
                  <SkillDropdown 
                    value={slot.skill} 
                    onChange={(s) => setSkill(idx, s)} 
                    usedSkills={skills.map(x => x.skill).filter(Boolean)} 
                    domain={slot.domain}
                    onDomainChange={(d) => setDomain(idx, d)}
                  />
                  <StarRating 
                    rating={slot.rating} 
                    onRate={(r) => setRating(idx, r)} 
                    disabled={!slot.skill} 
                  />
                  <button onClick={() => handleRemoveSkill(idx)} className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {error && <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest text-center italic">{error}</p>}

          <div className="pt-4 border-t border-[#F1F5F9]">
            <button
              onClick={handleSave}
              disabled={loading}
              className="w-full bg-[#0F172A] text-white py-3.5 rounded-2xl font-black text-[10px] tracking-[0.3em] uppercase hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl shadow-slate-200"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : (
                <>
                  <Save size={14} />
                  Establish Member Node
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}

// ─── Star display (read-only) ────────────────────────────────────────────────
function StarBadge({ rating }) {
  if (!rating || rating === 0) return null;
  return (
    <span className="flex items-center gap-0.5 text-amber-500">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={10} className={i < rating ? "fill-amber-400 text-amber-400" : "text-slate-100"} />
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
  const [radarOpen, setRadarOpen] = useState(false);
  const [name, setName] = useState(candidate.full_name || "");
  const [usn, setUsn] = useState(candidate.usn || "");
  const [editableSkills, setEditableSkills] = useState([]);
  const [toast, setToast] = useState(null);
  const supabase = createClient();

  // Sync editable skills when editing starts
  useEffect(() => {
    if (editing) {
      let currentSkills = [];
      try {
        if (candidate.skill_profile) {
          const parsed = typeof candidate.skill_profile === "string"
              ? JSON.parse(candidate.skill_profile) : candidate.skill_profile;
          currentSkills = (parsed || []).filter((s) => s.skill);
        }
      } catch (_) {}
      setEditableSkills(currentSkills.length > 0 ? currentSkills : [{ skill: "", rating: 0 }]);
    }
  }, [editing, candidate.skill_profile]);

  const handleAddSkill = () => setEditableSkills([...editableSkills, { skill: "", rating: 0 }]);
  const handleRemoveSkill = (idx) => {
    const newSkills = [...editableSkills];
    newSkills.splice(idx, 1);
    setEditableSkills(newSkills);
  };
  const setSkillValue = (idx, skill) => {
    const newSkills = [...editableSkills];
    newSkills[idx].skill = skill;
    setEditableSkills(newSkills);
  };
  const setRatingValue = (idx, rating) => {
    const newSkills = [...editableSkills];
    newSkills[idx].rating = rating;
    setEditableSkills(newSkills);
  };
  const setDomainValue = (idx, domain) => {
    const newSkills = [...editableSkills];
    newSkills[idx].domain = domain;
    setEditableSkills(newSkills);
  };

  let skills = [];
  try {
    if (candidate.skill_profile) {
      const parsed = typeof candidate.skill_profile === "string"
          ? JSON.parse(candidate.skill_profile) : candidate.skill_profile;
      skills = (parsed || []).filter((s) => s.skill && s.rating > 0);
    }
  } catch (_) {}

  const avgRating = skills.length > 0
      ? (skills.reduce((s, k) => s + k.rating, 0) / skills.length).toFixed(1) : null;

  async function handleSave() {
    setSaving(true);
    const table = candidate.is_registry ? "member_registry" : "profiles";
    const cleanSkills = editableSkills.filter(s => s.skill && s.rating > 0);
    
    const { error } = await supabase.from(table).update({ 
      full_name: name.trim(), 
      usn: usn.trim(),
      skill_profile: cleanSkills 
    }).eq(candidate.is_registry ? "email" : "id", candidate.is_registry ? candidate.email : candidate.id);
    
    if (error) { showToast("Failed to save changes.", "error"); }
    else { 
      showToast("Profile updated!", "success"); 
      onSave(candidate.id || candidate.email, { 
        full_name: name.trim(), 
        usn: usn.trim(),
        skill_profile: cleanSkills
      }); 
      setEditing(false); 
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    const table = candidate.is_registry ? "member_registry" : "profiles";
    
    let error;
    if (candidate.is_registry) {
      const { error: err } = await supabase.from(table).delete().eq("email", candidate.email);
      error = err;
    } else {
      const { error: err } = await supabase.from(table).update({ skill_profile: null }).eq("id", candidate.id);
      error = err;
    }

    if (error) { showToast("Delete failed.", "error"); setDeleting(false); }
    else { onDelete(candidate.id || candidate.email); }
  }

  function showToast(msg, type) { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); }

  return (
    <>
      <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-[#E2E8F0] rounded-[32px] overflow-hidden shadow-sm hover:shadow-xl transition-all flex flex-col h-full">
        <div className="p-8 space-y-6 flex-1">
          {/* Header */}
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
                <>
                  <button onClick={handleSave} disabled={saving} className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-md">{saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}</button>
                  <button onClick={() => { setName(candidate.full_name || ""); setUsn(candidate.usn || ""); setEditing(false); }} className="p-2.5 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 transition-all"><X size={14} /></button>
                </>
              ) : (
                <>
                  <button onClick={() => setEditing(true)} className="p-2.5 text-[#94A3B8] hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Pencil size={14} /></button>
                  <button onClick={handleDelete} disabled={deleting} className={`p-2.5 rounded-xl transition-all ${confirmDelete ? "bg-rose-500 text-white animate-pulse" : "text-[#94A3B8] hover:text-rose-500 hover:bg-rose-50"}`}>{deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}</button>
                </>
              )}
            </div>
          </div>

          {/* Radar Chart — clickable to enlarge */}
          <div
            onClick={() => setRadarOpen(true)}
            className="bg-[#F8FAFC] rounded-[24px] p-6 flex justify-center border border-slate-50 cursor-pointer hover:bg-[#F1F5F9] hover:border-blue-100 transition-all group relative"
          >
            <RadarChart skills={editing ? editableSkills : skills} size={200} showLabels={true} />
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-lg p-1.5 shadow-sm border border-[#E2E8F0]">
              <Maximize2 size={12} className="text-[#94A3B8]" />
            </div>
          </div>

          {/* Info row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-[8px] font-black text-[#94A3B8] uppercase tracking-widest">Avg Score</p>
              <div className="flex items-center gap-2">
                <Star size={14} className="fill-amber-400 text-amber-400" />
                <span className="text-sm font-black text-[#0F172A]">
                  {editing 
                    ? (editableSkills.filter(s => s.skill && s.rating > 0).length > 0 
                        ? (editableSkills.reduce((a, b) => a + b.rating, 0) / editableSkills.filter(s => s.skill && s.rating > 0).length).toFixed(1) 
                        : "0.0")
                    : (avgRating || "0.0")
                  }
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[8px] font-black text-[#94A3B8] uppercase tracking-widest">Skills</p>
              <span className="text-sm font-black text-[#2563EB]">
                {editing ? editableSkills.filter(s => s.skill).length : skills.length}
              </span>
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
            {(expanded || editing) && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-2 mt-4 overflow-hidden">
                {editing ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest">Editing Competencies</span>
                      <button onClick={handleAddSkill} className="p-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all">
                        <Plus size={12} />
                      </button>
                    </div>
                    <div className="space-y-3">
                      {editableSkills.map((slot, idx) => (
                        <div key={idx} className="grid items-center gap-2 py-1" style={{ gridTemplateColumns: "1fr auto auto" }}>
                          <SkillDropdown 
                            value={slot.skill} 
                            onChange={(s) => setSkillValue(idx, s)} 
                            usedSkills={editableSkills.map(x => x.skill).filter(Boolean)} 
                            domain={slot.domain}
                            onDomainChange={(d) => setDomainValue(idx, d)}
                          />
                          <StarRating 
                            rating={slot.rating} 
                            onRate={(r) => setRatingValue(idx, r)} 
                            disabled={!slot.skill} 
                          />
                          <button onClick={() => handleRemoveSkill(idx)} className="p-1 text-slate-300 hover:text-rose-500 transition-colors">
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  skills.map((s) => (
                    <div key={s.skill} className="flex items-center justify-between py-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[12px] font-bold text-[#0F172A] truncate">{s.skill}</span>
                        <span className="text-[7px] font-black text-[#94A3B8] uppercase tracking-widest bg-[#F8FAFC] px-1.5 py-0.5 rounded border border-[#F1F5F9] flex-shrink-0">{findDomain(s)}</span>
                      </div>
                      <StarBadge rating={s.rating} />
                    </div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`mx-6 mb-6 px-4 py-3 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${toast.type === "success" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-rose-50 text-rose-600 border border-rose-100"}`}>
              {toast.type === "success" ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
              {toast.msg}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Enlarged Radar Modal */}
      <AnimatePresence>
        {radarOpen && (
          <RadarModal skills={skills} name={candidate.full_name || "Member"} onClose={() => setRadarOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminProfilesPage() {
  const router = useRouter();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function checkAndLoad() {
      const { data: { user } } = await supabase.auth.getUser();
      const mockSession = document.cookie.split("; ").find((r) => r.startsWith("mock_session="))?.split("=")[1];
      if (!user && !mockSession?.startsWith("admin")) { router.push("/auth"); return; }

      const { data: profData } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "candidate")
        .not("skill_profile", "is", null);

      const { data: regData } = await supabase
        .from("member_registry")
        .select("*");

      const combined = [
        ...(profData || []).map(p => ({ ...p, is_registry: false })),
        ...(regData || []).map(r => ({ ...r, is_registry: true }))
      ].sort((a, b) => (a.full_name || "").localeCompare(b.full_name || ""));

      const withRatedSkills = combined.filter((c) => {
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
            Verified Competency Profiles & Sector Mapping
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
          <div className="bg-white border border-[#E2E8F0] px-5 py-3 rounded-[24px] flex items-center gap-3 flex-1 lg:w-72 shadow-sm">
            <Search size={18} className="text-[#94A3B8]" />
            <input type="text" placeholder="Search vault..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-transparent border-none outline-none text-sm font-bold w-full placeholder:text-[#CBD5E1]" />
          </div>
          
          <button 
            onClick={() => setAddModalOpen(true)}
            className="flex items-center gap-2 bg-[#2563EB] text-white px-6 py-3.5 rounded-[24px] text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all active:scale-95 shadow-xl shadow-blue-100"
          >
            <Plus size={16} />
            <span>Add Profile</span>
          </button>
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
          <button onClick={() => setAddModalOpen(true)} className="mt-4 text-blue-600 font-black text-[10px] uppercase tracking-widest hover:underline">Add your first member node →</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
          {filtered.map((c) => (
            <ProfileCard 
              key={c.id || c.email} 
              candidate={c} 
              onSave={(id, upd) => setCandidates(p => p.map(x => (x.id === id || x.email === id) ? {...x, ...upd} : x))} 
              onDelete={(id) => setCandidates(p => p.filter(x => (x.id !== id && x.email !== id)))} 
            />
          ))}
        </div>
      )}

      <AddMemberModal 
        isOpen={addModalOpen} 
        onClose={() => setAddModalOpen(false)} 
        onAdd={(newMember) => setCandidates(prev => [{ ...newMember, is_registry: true }, ...prev])} 
      />
    </div>
  );
}
