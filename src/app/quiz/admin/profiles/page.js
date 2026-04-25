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
  TrendingUp,
  Activity,
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

// SVG Colors for Domains
const DOMAIN_SVG_COLORS = {
  "Programming": "#2563EB", // blue-600
  "Web Tech": "#0891B2",    // cyan-600
  "Data & AI": "#9333EA",   // purple-600
  "Cloud & DevOps": "#EA580C", // orange-600
  "Design & Product": "#DB2777", // pink-600
  "Soft Skills": "#059669", // emerald-600
  "Specialized": "#D97706", // amber-600
};

// ─── Radar Chart Component (reusable at any size) ───────────────────────────
function RadarChart({ skills, size = 200, showLabels = true, showDots = false }) {
  const center = size / 2;
  const radius = center * 0.65;
  const labelRadius = center * 0.88;

  const validSkills = (skills || []).filter(s => s.skill && s.rating > 0);

  const getCoords = (value, angle) => {
    const r = (value / 5) * radius;
    return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) };
  };

  const getLabelCoords = (index) => {
    const angle = (Math.PI * 2 * index) / SECTORS.length - Math.PI / 2;
    return { x: center + labelRadius * Math.cos(angle), y: center + labelRadius * Math.sin(angle) };
  };

  // Background Web
  const webLines = [1, 2, 3, 4, 5].map(level =>
    SECTORS.map((_, i) => {
      const angle = (Math.PI * 2 * i) / SECTORS.length - Math.PI / 2;
      const p = getCoords(level, angle);
      return `${p.x},${p.y}`;
    }).join(" ")
  );

  const fontSize = Math.max(7, size * 0.035);
  const sweep = (Math.PI * 2) / SECTORS.length;

  return (
    <svg width={size} height={size} className="overflow-visible">
      {/* Background Web */}
      {webLines.map((points, i) => (
        <polygon key={i} points={points} fill={i === 4 ? "rgba(241,245,249,0.3)" : "none"} stroke="#E2E8F0" strokeWidth={i === 4 ? "1.5" : "0.5"} />
      ))}
      
      {/* Axis lines */}
      {SECTORS.map((_, i) => {
        const angle = (Math.PI * 2 * i) / SECTORS.length - Math.PI / 2;
        const p = getCoords(5, angle);
        return <line key={i} x1={center} y1={center} x2={p.x} y2={p.y} stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3 3" />;
      })}

      {/* Domain Skill Lines */}
      {SECTORS.map((sector, i) => {
        const domainSkills = validSkills.filter(s => findDomain(s) === sector);
        if (domainSkills.length === 0) return null;

        const theta_i = (Math.PI * 2 * i) / SECTORS.length - Math.PI / 2;
        const M = domainSkills.length;
        const spread = sweep * 0.65; // use 65% of the sector
        const color = DOMAIN_SVG_COLORS[sector] || "#2563EB";

        return domainSkills.map((s, j) => {
          let angle = theta_i;
          if (M > 1) {
            const offset = -spread / 2 + (j * spread) / (M - 1);
            angle = theta_i + offset;
          }

          const pVal = getCoords(s.rating, angle);

          return (
            <g key={`${sector}-${j}`}>
              {/* Spoke Line */}
              <line 
                x1={center} y1={center} 
                x2={pVal.x} y2={pVal.y} 
                stroke={color} 
                strokeWidth={Math.max(2, size * 0.012)} 
                strokeLinecap="round" 
                opacity={0.85}
              />
              {/* Dot */}
              <circle 
                cx={pVal.x} cy={pVal.y} 
                r={Math.max(2.5, size * 0.015)} 
                fill={color} 
                stroke="#fff" 
                strokeWidth="1.5" 
              />
              {/* Skill Name (Only in Large View) */}
              {size > 300 && (
                <text 
                  x={pVal.x + (Math.cos(angle) * 8)} 
                  y={pVal.y + (Math.sin(angle) * 8)} 
                  fontSize="9" 
                  fontWeight="800" 
                  fill={color}
                  textAnchor={Math.cos(angle) > 0.1 ? "start" : Math.cos(angle) < -0.1 ? "end" : "middle"}
                  dominantBaseline={Math.sin(angle) > 0.1 ? "hanging" : Math.sin(angle) < -0.1 ? "baseline" : "middle"}
                  opacity={0.9}
                  className="tracking-tight"
                >
                  {s.skill}
                </text>
              )}
            </g>
          );
        });
      })}

      {/* Sector Labels (Domain Names) */}
      {showLabels && SECTORS.map((label, i) => {
        const pLabel = getLabelCoords(i);
        const hasSkills = validSkills.some(s => findDomain(s) === label);
        const color = DOMAIN_SVG_COLORS[label] || "#CBD5E1";

        return (
          <g key={i}>
            <text 
              x={pLabel.x} y={pLabel.y} 
              fontSize={fontSize} 
              fontWeight="900" 
              fill={hasSkills ? color : "#CBD5E1"} 
              textAnchor="middle" 
              dominantBaseline="middle" 
              className="uppercase tracking-wider"
            >
              {label.length > 10 ? label.split(" ").map((w, j) => (
                <tspan key={j} x={pLabel.x} dy={j > 0 ? fontSize + 2 : 0}>{w}</tspan>
              )) : label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Radar Chart Modal (fullscreen overlay) ─────────────────────────────────
function RadarModal({ skills, name, onClose }) {
  const validSkills = (skills || []).filter(s => s.skill && s.rating > 0);
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-[#0F172A]/60 backdrop-blur-md p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl p-8 max-w-[640px] w-full relative max-h-[90vh] overflow-y-auto"
      >
        <button onClick={onClose} className="absolute top-5 right-5 p-2 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all">
          <X size={14} className="text-slate-400" />
        </button>

        <div className="text-center mb-6">
          <h3 className="text-lg font-black text-[#0F172A] uppercase tracking-tight">{name}</h3>
          <p className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-[0.3em] mt-1">Competency Map · {validSkills.length} skills</p>
        </div>

        <div className="flex justify-center">
          <RadarChart skills={skills} size={380} showLabels={true} showDots={true} />
        </div>

        {/* Domain breakdown with colors */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-6 pt-6 border-t border-[#F1F5F9]">
          {SECTORS.map(sector => {
            const matched = validSkills.filter(s => findDomain(s) === sector);
            const color = DOMAIN_SVG_COLORS[sector] || "#94A3B8";
            return (
              <div key={sector} className="flex items-center justify-between bg-[#F8FAFC] rounded-lg px-3 py-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: matched.length > 0 ? color : "#E2E8F0" }} />
                  <span className={`text-[8px] font-black uppercase tracking-wider ${matched.length > 0 ? "text-[#0F172A]" : "text-[#CBD5E1]"}`}>{sector}</span>
                </div>
                <span className="text-[10px] font-black" style={{ color: matched.length > 0 ? color : "#CBD5E1" }}>{matched.length}</span>
              </div>
            );
          })}
        </div>

        {/* Individual skills list */}
        {validSkills.length > 0 && (
          <div className="mt-6 pt-6 border-t border-[#F1F5F9] space-y-1.5">
            <p className="text-[9px] font-black text-[#94A3B8] uppercase tracking-wider mb-3">All Skills</p>
            {validSkills.map((s) => (
              <div key={s.skill} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: DOMAIN_SVG_COLORS[findDomain(s)] || "#94A3B8" }} />
                  <span className="text-[11px] font-bold text-[#0F172A]">{s.skill}</span>
                </div>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={10} className={i < s.rating ? "fill-amber-400 text-amber-400" : "text-slate-100"} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
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

  // Group skills by domain for display
  const domainGroups = {};
  const displaySkills = editing ? editableSkills.filter(s => s.skill) : skills;
  displaySkills.forEach(s => {
    const d = findDomain(s);
    if (!domainGroups[d]) domainGroups[d] = [];
    domainGroups[d].push(s);
  });

  return (
    <>
      <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-[#E2E8F0] rounded-3xl overflow-hidden hover:shadow-lg hover:shadow-slate-100/80 transition-all flex flex-col h-full">
        {/* Top Section */}
        <div className="p-6 pb-0 space-y-5 flex-1">
          {/* Header Row */}
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#0F172A] flex items-center justify-center text-white font-black text-base flex-shrink-0">
              {(editing ? name : candidate.full_name)?.[0]?.toUpperCase() || "?"}
            </div>
            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="space-y-1.5">
                  <input value={name} onChange={(e) => setName(e.target.value)} className="w-full text-sm font-black text-[#0F172A] border-b-2 border-blue-500 bg-transparent outline-none pb-0.5" placeholder="Full name" autoFocus />
                  <div className="flex items-center gap-1.5">
                    <Hash size={10} className="text-[#94A3B8] flex-shrink-0" />
                    <input value={usn} onChange={(e) => setUsn(e.target.value)} className="w-full text-[10px] font-black text-[#64748B] uppercase border-b border-slate-200 bg-transparent outline-none pb-0.5" placeholder="USN" />
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-[15px] font-black text-[#0F172A] leading-snug">{candidate.full_name || "—"}</p>
                  <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mt-0.5">{candidate.usn || "—"}</p>
                </>
              )}
            </div>
            <div className="flex items-center gap-0.5 flex-shrink-0">
              {editing ? (
                <>
                  <button onClick={handleSave} disabled={saving} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all">{saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}</button>
                  <button onClick={() => { setName(candidate.full_name || ""); setUsn(candidate.usn || ""); setEditing(false); }} className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-slate-100 transition-all"><X size={13} /></button>
                </>
              ) : (
                <>
                  <button onClick={() => setEditing(true)} className="p-2 text-[#CBD5E1] hover:text-blue-600 rounded-lg transition-all"><Pencil size={13} /></button>
                  <button onClick={handleDelete} disabled={deleting} className={`p-2 rounded-lg transition-all ${confirmDelete ? "bg-rose-500 text-white animate-pulse" : "text-[#CBD5E1] hover:text-rose-500"}`}>{deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}</button>
                </>
              )}
            </div>
          </div>

          {/* Domain Pills */}
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(domainGroups).slice(0, 5).map(([domain, domainSkills]) => (
              <span key={domain} className={`inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-wider px-2 py-1 rounded-md border ${DOMAIN_COLORS[domain] || "bg-slate-50 text-slate-500 border-slate-200"}`}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: DOMAIN_SVG_COLORS[domain] || "#94A3B8" }} />
                {domain} · {domainSkills.length}
              </span>
            ))}
            {Object.keys(domainGroups).length > 5 && (
              <span className="text-[8px] font-black text-[#94A3B8] uppercase tracking-wider px-2 py-1">+{Object.keys(domainGroups).length - 5}</span>
            )}
          </div>

          {/* Stats Row */}
          <div className="flex items-center gap-4 py-3 border-t border-[#F8FAFC]">
            <div className="flex items-center gap-1.5">
              <Star size={12} className="fill-amber-400 text-amber-400" />
              <span className="text-sm font-black text-[#0F172A]">
                {editing 
                  ? (editableSkills.filter(s => s.skill && s.rating > 0).length > 0 
                      ? (editableSkills.reduce((a, b) => a + b.rating, 0) / editableSkills.filter(s => s.skill && s.rating > 0).length).toFixed(1) 
                      : "0.0")
                  : (avgRating || "0.0")
                }
              </span>
              <span className="text-[8px] font-bold text-[#CBD5E1] uppercase">avg</span>
            </div>
            <div className="w-px h-4 bg-[#F1F5F9]" />
            <div className="flex items-center gap-1.5">
              <Zap size={12} className="text-blue-500" />
              <span className="text-sm font-black text-[#0F172A]">
                {editing ? editableSkills.filter(s => s.skill).length : skills.length}
              </span>
              <span className="text-[8px] font-bold text-[#CBD5E1] uppercase">skills</span>
            </div>
            <div className="ml-auto">
              <button
                onClick={() => setRadarOpen(true)}
                className="text-[9px] font-black text-[#94A3B8] uppercase tracking-wider hover:text-blue-600 transition-colors flex items-center gap-1"
              >
                <Maximize2 size={10} />
                Map
              </button>
            </div>
          </div>
        </div>

        {/* Skills Footer */}
        <div className="px-6 pb-6">
          <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between border-t border-[#F1F5F9] pt-4 group">
            <span className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest group-hover:text-blue-500 transition-colors">Skills ({skills.length})</span>
            {expanded ? <ChevronUp size={13} className="text-[#CBD5E1]" /> : <ChevronDown size={13} className="text-[#CBD5E1]" />}
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
                    <div key={s.skill} className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: DOMAIN_SVG_COLORS[findDomain(s)] || "#94A3B8" }} />
                        <span className="text-[11px] font-bold text-[#0F172A] truncate">{s.skill}</span>
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
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`mx-6 mb-4 px-3 py-2 rounded-lg flex items-center gap-2 text-[9px] font-bold uppercase tracking-wider ${toast.type === "success" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
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

  // ── Analytics calculations ──
  const allSkills = [];
  candidates.forEach(c => {
    try {
      const parsed = typeof c.skill_profile === "string" ? JSON.parse(c.skill_profile) : c.skill_profile;
      (parsed || []).filter(s => s.skill && s.rating > 0).forEach(s => allSkills.push(s));
    } catch {}
  });

  const domainCounts = {};
  const domainRatings = {};
  allSkills.forEach(s => {
    const d = findDomain(s);
    domainCounts[d] = (domainCounts[d] || 0) + 1;
    if (!domainRatings[d]) domainRatings[d] = [];
    domainRatings[d].push(s.rating);
  });

  const maxDomainCount = Math.max(...Object.values(domainCounts), 1);

  // Top skills by frequency
  const skillFreq = {};
  allSkills.forEach(s => { skillFreq[s.skill] = (skillFreq[s.skill] || 0) + 1; });
  const topSkills = Object.entries(skillFreq).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const maxSkillFreq = topSkills.length > 0 ? topSkills[0][1] : 1;

  const overallAvg = allSkills.length > 0
    ? (allSkills.reduce((a, s) => a + s.rating, 0) / allSkills.length).toFixed(1)
    : "0.0";

  return (
    <div className="p-8 md:p-14 space-y-10">
      {/* Header */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-[#0F172A] tracking-tighter uppercase leading-none">
            Member <span className="text-[#2563EB]">Vault</span>
          </h1>
          <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-[0.3em] mt-2">
            Competency Profiles & Sector Analysis
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="bg-white border border-[#E2E8F0] px-4 py-2.5 rounded-xl flex items-center gap-2 flex-1 lg:w-64">
            <Search size={16} className="text-[#94A3B8]" />
            <input type="text" placeholder="Search by name, email, USN..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-transparent border-none outline-none text-xs font-bold w-full placeholder:text-[#CBD5E1]" />
          </div>
          <button 
            onClick={() => setAddModalOpen(true)}
            className="flex items-center gap-2 bg-[#2563EB] text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-blue-700 transition-all active:scale-95"
          >
            <Plus size={14} />
            Add Profile
          </button>
        </div>
      </header>

      {/* Analytics Overview */}
      {!loading && candidates.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Quick Stats */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-[#2563EB]" />
              <span className="text-[10px] font-black text-[#94A3B8] uppercase tracking-wider">Overview</span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-2xl font-black text-[#0F172A] leading-none">{candidates.length}</p>
                <p className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-wider mt-1">Members</p>
              </div>
              <div>
                <p className="text-2xl font-black text-[#0F172A] leading-none">{allSkills.length}</p>
                <p className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-wider mt-1">Total Skills</p>
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <Star size={14} className="fill-amber-400 text-amber-400" />
                  <p className="text-2xl font-black text-[#0F172A] leading-none">{overallAvg}</p>
                </div>
                <p className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-wider mt-1">Avg Rating</p>
              </div>
            </div>
          </div>

          {/* Domain Distribution */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-[#2563EB]" />
              <span className="text-[10px] font-black text-[#94A3B8] uppercase tracking-wider">Domain Distribution</span>
            </div>
            <div className="space-y-2">
              {SECTORS.map(sector => {
                const count = domainCounts[sector] || 0;
                const pct = count > 0 ? (count / maxDomainCount) * 100 : 0;
                const color = DOMAIN_SVG_COLORS[sector] || "#94A3B8";
                const avg = domainRatings[sector]
                  ? (domainRatings[sector].reduce((a, b) => a + b, 0) / domainRatings[sector].length).toFixed(1)
                  : null;
                return (
                  <div key={sector} className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-[#64748B] w-20 truncate flex-shrink-0">{sector}</span>
                    <div className="flex-1 h-2 bg-[#F8FAFC] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: 0.1 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: color }}
                      />
                    </div>
                    <span className="text-[9px] font-black w-6 text-right" style={{ color: count > 0 ? color : "#CBD5E1" }}>{count}</span>
                    {avg && <span className="text-[8px] font-bold text-[#94A3B8]">({avg}★)</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Skills */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-[#2563EB]" />
              <span className="text-[10px] font-black text-[#94A3B8] uppercase tracking-wider">Top Skills</span>
            </div>
            <div className="space-y-2">
              {topSkills.length === 0 ? (
                <p className="text-[10px] text-[#CBD5E1] font-bold text-center py-4">No skill data yet</p>
              ) : topSkills.map(([skill, count]) => {
                const pct = (count / maxSkillFreq) * 100;
                const domain = SKILL_CATEGORIES[Object.keys(SKILL_CATEGORIES).find(d => SKILL_CATEGORIES[d].includes(skill))] ? Object.keys(SKILL_CATEGORIES).find(d => SKILL_CATEGORIES[d].includes(skill)) : "Specialized";
                const color = DOMAIN_SVG_COLORS[domain] || "#94A3B8";
                return (
                  <div key={skill} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                    <span className="text-[10px] font-bold text-[#0F172A] w-24 truncate flex-shrink-0">{skill}</span>
                    <div className="flex-1 h-1.5 bg-[#F8FAFC] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                    <span className="text-[9px] font-black text-[#94A3B8]">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Results info */}
      {!loading && candidates.length > 0 && searchTerm && (
        <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">
          Showing {filtered.length} of {candidates.length} members
        </p>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 opacity-20">
          <Loader2 size={48} className="animate-spin text-[#2563EB]" />
          <p className="text-[11px] font-black uppercase tracking-[0.4em]">Loading profiles...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-dashed border-[#E2E8F0] rounded-2xl p-16 text-center">
          <Users size={40} className="mx-auto text-[#CBD5E1] mb-4" />
          <p className="text-sm font-bold text-[#64748B]">{searchTerm ? "No members match your search." : "No profiles found."}</p>
          {!searchTerm && <button onClick={() => setAddModalOpen(true)} className="mt-3 text-blue-600 font-black text-[10px] uppercase tracking-wider hover:underline">Add your first member →</button>}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
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
