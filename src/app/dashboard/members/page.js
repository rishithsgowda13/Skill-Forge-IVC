"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import {
  Search,
  Users,
  Mail,
  Hash,
  GraduationCap,
  Star,
  Activity,
  Zap,
  Maximize2,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  Sparkles,
  Trophy,
  ArrowLeft
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import RadarChart from "@/components/charts/RadarChart";

// Domain color map (Sync with admin/profiles)
const DOMAIN_COLORS = {
  "Programming": "bg-blue-50 text-blue-600 border-blue-200",
  "Web Tech": "bg-cyan-50 text-cyan-600 border-cyan-200",
  "Data & AI": "bg-purple-50 text-purple-600 border-purple-200",
  "Cloud & DevOps": "bg-orange-50 text-orange-600 border-orange-200",
  "Design & Product": "bg-pink-50 text-pink-600 border-pink-200",
  "Soft Skills": "bg-emerald-50 text-emerald-600 border-emerald-200",
  "Specialized": "bg-amber-50 text-amber-600 border-amber-200",
};

const DOMAIN_SVG_COLORS = {
  "Programming": "#2563EB",
  "Web Tech": "#0891B2",
  "Data & AI": "#9333EA",
  "Cloud & DevOps": "#EA580C",
  "Design & Product": "#DB2777",
  "Soft Skills": "#10B981",
  "Specialized": "#D97706",
};

const SKILL_CATEGORIES = {
  "Programming": ["JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "Go", "Rust", "Ruby", "PHP", "Swift", "Kotlin"],
  "Web Tech": ["React", "Next.js", "Vue.js", "Angular", "Node.js", "Express.js", "Django", "Flask", "Spring Boot", "HTML/CSS", "Tailwind CSS", "GraphQL", "REST APIs", "WebSocket"],
  "Data & AI": ["Machine Learning", "Deep Learning", "Natural Language Processing", "Computer Vision", "Data Analysis", "Data Engineering", "TensorFlow", "PyTorch", "Pandas", "NumPy", "Power BI", "Tableau", "SQL", "NoSQL"],
  "Cloud & DevOps": ["AWS", "Azure", "Google Cloud", "Docker", "Kubernetes", "CI/CD", "Terraform", "Linux"],
  "Design & Product": ["UI/UX Design", "Figma", "Adobe XD", "Product Management", "Agile/Scrum"],
  "Soft Skills": ["Communication", "Leadership", "Problem Solving", "Critical Thinking", "Team Collaboration", "Time Management", "Public Speaking", "Negotiation", "Adaptability", "Creativity"],
  "Specialized": ["Cybersecurity", "Blockchain", "IoT", "Embedded Systems", "Mobile Development", "Game Development", "AR/VR", "Robotics", "3D Modeling", "Digital Marketing", "SEO", "Content Writing", "Project Management", "Business Analysis", "Financial Analysis"]
};

function findDomain(skillObj) {
  if (skillObj.domain) return skillObj.domain;
  for (const [cat, skills] of Object.entries(SKILL_CATEGORIES)) {
    if (skills.includes(skillObj.skill)) return cat;
  }
  return "Specialized";
}

function StarBadge({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star 
          key={s} 
          size={10} 
          className={s <= rating ? "text-amber-400 fill-amber-400" : "text-slate-100"} 
        />
      ))}
    </div>
  );
}

function MemberCard({ member }) {
  const [expanded, setExpanded] = useState(false);
  const skills = Array.isArray(member.skill_profile) ? member.skill_profile : (typeof member.skill_profile === "string" ? JSON.parse(member.skill_profile || "[]") : []);
  const validSkills = skills.filter(s => s.skill && s.rating > 0);
  
  const forgeScore = validSkills.reduce((a, b) => a + b.rating, 0) * 10;
  
  const domainGroups = {};
  validSkills.forEach(s => {
    const d = findDomain(s);
    if (!domainGroups[d]) domainGroups[d] = [];
    domainGroups[d].push(s);
  });

  return (
    <motion.div 
      layout
      className="bg-white rounded-[32px] border border-[#E2E8F0] shadow-sm hover:shadow-xl transition-all overflow-hidden group"
    >
      <div className="p-8 space-y-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[#0F172A] rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-lg border-2 border-white uppercase">
              {member.full_name?.[0] || "U"}
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-black text-[#0F172A] uppercase tracking-tighter truncate leading-none">
                {member.full_name || "Unknown Member"}
              </h3>
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
                <Hash size={10} />
                {member.usn || "NO_USN"}
              </p>
            </div>
          </div>
          <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border border-emerald-100">
            Active
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {Object.entries(domainGroups).slice(0, 3).map(([domain, domainSkills]) => (
            <span key={domain} className={`text-[7px] font-black uppercase tracking-widest px-2 py-1 rounded-md border ${DOMAIN_COLORS[domain] || "bg-slate-50 text-slate-500"}`}>
              {domain}
            </span>
          ))}
          {Object.keys(domainGroups).length > 3 && (
            <span className="text-[7px] font-black text-[#94A3B8] uppercase tracking-wider px-2 py-1">+{Object.keys(domainGroups).length - 3}</span>
          )}
        </div>

        <div className="flex items-center gap-4 py-3 border-t border-[#F8FAFC]">
          <div className="flex items-center gap-1.5">
            <Zap size={12} className="text-amber-500 fill-amber-500" />
            <span className="text-sm font-black text-[#0F172A]">{forgeScore}</span>
            <span className="text-[8px] font-bold text-[#CBD5E1] uppercase">score</span>
          </div>
          <div className="w-px h-4 bg-[#F1F5F9]" />
          <div className="flex items-center gap-1.5">
            <Activity size={12} className="text-blue-500" />
            <span className="text-sm font-black text-[#0F172A]">{validSkills.length}</span>
            <span className="text-[8px] font-bold text-[#CBD5E1] uppercase">skills</span>
          </div>
          <button 
            onClick={() => setExpanded(!expanded)}
            className="ml-auto p-2 text-[#94A3B8] hover:text-blue-600 transition-colors"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="pt-4 border-t border-[#F8FAFC] space-y-6"
            >
              <div className="flex justify-center py-6 bg-[#F8FAFC] rounded-2xl border border-[#F1F5F9]">
                <RadarChart skills={validSkills} size={200} showLabels={true} />
              </div>
              <div className="space-y-2">
                <p className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest mb-3">Core Competencies</p>
                {validSkills.map((s, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-[#F8FAFC] last:border-none">
                    <span className="text-[11px] font-bold text-[#0F172A] uppercase">{s.skill}</span>
                    <StarBadge rating={s.rating} />
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function MembersPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function loadMembers() {
      const { data: profData } = await supabase.from("profiles").select("*");
      const { data: regData } = await supabase.from("member_registry").select("*");

      const combined = [
        ...(profData || []),
        ...(regData || [])
      ];

      const uniqueMap = new Map();
      combined.forEach(c => {
        if (!c.email) return;
        const key = c.email.toLowerCase();
        if (uniqueMap.has(key)) {
           const existing = uniqueMap.get(key);
           if (!existing.skill_profile && c.skill_profile) {
              uniqueMap.set(key, c);
           }
        } else {
           uniqueMap.set(key, c);
        }
      });
      
      setMembers(Array.from(uniqueMap.values()).sort((a, b) => (a.full_name || "").localeCompare(b.full_name || "")));
      setLoading(false);
    }
    loadMembers();
  }, []);

  const filtered = members.filter(m => 
    m.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.usn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 md:p-14 space-y-12 bg-[#F8FAFC] min-h-screen">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <Users size={18} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Collective Intel</span>
          </div>
          <h1 className="text-5xl font-black text-[#0F172A] tracking-tighter uppercase leading-none">
            Member <span className="text-blue-600">Vault</span>
          </h1>
          <p className="text-[12px] font-bold text-[#94A3B8] uppercase tracking-[0.3em]">
            Exploring the neural network of club visionaries
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-white border border-[#E2E8F0] px-6 py-3 rounded-2xl flex items-center gap-4 shadow-sm w-full md:w-80">
            <Search size={18} className="text-[#94A3B8]" />
            <input 
              type="text" 
              placeholder="Search by name, USN or email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-none text-xs font-bold placeholder:text-[#CBD5E1] w-full text-[#0F172A]"
            />
          </div>
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Syncing Member Directory...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-[50px] p-24 border-2 border-dashed border-[#E2E8F0] text-center space-y-6">
           <Users size={64} className="mx-auto text-slate-100" />
           <div className="space-y-2">
             <h3 className="text-2xl font-black text-[#0F172A] uppercase tracking-tighter">No Members Found</h3>
             <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest">Adjust your search parameters to find visionaries</p>
           </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((member, i) => (
            <MemberCard key={member.email || i} member={member} />
          ))}
        </div>
      )}
    </div>
  );
}
