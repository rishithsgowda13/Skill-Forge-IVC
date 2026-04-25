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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Star display (read-only)
function StarBadge({ rating }) {
  if (!rating || rating === 0) return null;
  return (
    <span className="flex items-center gap-0.5 text-amber-500">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={11}
          className={i < rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}
        />
      ))}
    </span>
  );
}

// Individual profile card
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

  // Parse skill_profile
  let skills = [];
  try {
    if (candidate.skill_profile) {
      const parsed =
        typeof candidate.skill_profile === "string"
          ? JSON.parse(candidate.skill_profile)
          : candidate.skill_profile;
      skills = (parsed || []).filter((s) => s.skill && s.rating > 0);
    }
  } catch (_) {}

  const avgRating =
    skills.length > 0
      ? (skills.reduce((s, k) => s + k.rating, 0) / skills.length).toFixed(1)
      : null;

  async function handleSave() {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: name.trim(), usn: usn.trim() })
      .eq("id", candidate.id);

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
    const { error } = await supabase
      .from("profiles")
      .update({ skill_profile: null })
      .eq("id", candidate.id);
    if (error) {
      showToast("Delete failed.", "error");
      setDeleting(false);
    } else {
      onDelete(candidate.id);
    }
  }

  function handleCancel() {
    setName(candidate.full_name || "");
    setUsn(candidate.usn || "");
    setEditing(false);
  }

  function showToast(msg, type) {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  const statusColor = {
    submitted: "bg-blue-50 text-blue-600 border-blue-100",
    selected_round3: "bg-violet-50 text-violet-600 border-violet-100",
    assigned: "bg-amber-50 text-amber-600 border-amber-100",
  }[candidate.round2_status] || "bg-slate-50 text-slate-400 border-slate-100";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-[#E2E8F0] rounded-[24px] overflow-hidden shadow-sm hover:shadow-md transition-all"
    >
      {/* Top accent bar based on status */}
      <div
        className={`h-1 ${
          candidate.round2_status === "selected_round3"
            ? "bg-gradient-to-r from-violet-500 to-indigo-500"
            : skills.length > 0
            ? "bg-gradient-to-r from-amber-400 to-orange-400"
            : "bg-gradient-to-r from-slate-200 to-slate-100"
        }`}
      />

      <div className="p-6 space-y-4">
        {/* Avatar + Name row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-[#0F172A] flex items-center justify-center text-white font-black text-lg flex-shrink-0 shadow-lg shadow-slate-200">
              {(editing ? name : candidate.full_name)?.[0]?.toUpperCase() || "?"}
            </div>
            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="space-y-2">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-sm font-black text-[#0F172A] border-b-2 border-blue-500 bg-transparent outline-none pb-0.5"
                    placeholder="Full name"
                    autoFocus
                  />
                  <div className="flex items-center gap-2">
                    <Hash size={11} className="text-[#94A3B8] flex-shrink-0" />
                    <input
                      value={usn}
                      onChange={(e) => setUsn(e.target.value)}
                      className="w-full text-[11px] font-black text-[#64748B] uppercase border-b border-slate-300 bg-transparent outline-none pb-0.5"
                      placeholder="USN / Roll No."
                    />
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm font-black text-[#0F172A] truncate leading-tight">
                    {candidate.full_name || "—"}
                  </p>
                  {candidate.usn ? (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Hash size={10} className="text-[#94A3B8]" />
                      <span className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">
                        {candidate.usn}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[9px] font-bold text-slate-300 italic">No USN set</span>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Edit + Delete controls */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {editing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all active:scale-90 disabled:opacity-50"
                >
                  {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                </button>
                <button
                  onClick={handleCancel}
                  className="p-2 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 transition-all active:scale-90"
                >
                  <X size={13} />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="p-2 text-[#94A3B8] hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  title={confirmDelete ? "Click again to confirm" : "Remove from profiles"}
                  className={`p-2 rounded-xl transition-all active:scale-90 ${
                    confirmDelete
                      ? "bg-rose-500 text-white hover:bg-rose-600 animate-pulse"
                      : "text-[#94A3B8] hover:text-rose-500 hover:bg-rose-50"
                  }`}
                >
                  {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Meta info */}
        <div className="space-y-1.5">
          {candidate.email && (
            <div className="flex items-center gap-2">
              <Mail size={11} className="text-[#CBD5E1] flex-shrink-0" />
              <span className="text-[11px] font-medium text-[#64748B] truncate">{candidate.email}</span>
            </div>
          )}
          {candidate.branch && (
            <div className="flex items-center gap-2">
              <GraduationCap size={11} className="text-[#CBD5E1] flex-shrink-0" />
              <span className="text-[11px] font-medium text-[#64748B] truncate">{candidate.branch}</span>
            </div>
          )}
          {candidate.phone_number && (
            <div className="flex items-center gap-2">
              <Phone size={11} className="text-[#CBD5E1] flex-shrink-0" />
              <span className="text-[11px] font-medium text-[#64748B]">{candidate.phone_number}</span>
            </div>
          )}
        </div>

        {/* Status + avg rating */}
        <div className="flex items-center justify-between">
          <span
            className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${statusColor}`}
          >
            {candidate.round2_status || "enrolled"}
          </span>
          {avgRating && (
            <div className="flex items-center gap-1.5">
              <Star size={12} className="fill-amber-400 text-amber-400" />
              <span className="text-[11px] font-black text-[#0F172A]">{avgRating}</span>
              <span className="text-[9px] font-bold text-[#94A3B8]">avg</span>
            </div>
          )}
        </div>

        {/* Skills section */}
        {skills.length > 0 ? (
          <div className="border-t border-[#F1F5F9] pt-4">
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center justify-between w-full mb-3"
            >
              <span className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest">
                Skills · {skills.length}
              </span>
              {expanded ? (
                <ChevronUp size={13} className="text-[#94A3B8]" />
              ) : (
                <ChevronDown size={13} className="text-[#94A3B8]" />
              )}
            </button>

            <AnimatePresence>
              {(expanded ? skills : skills.slice(0, 3)).map((s, i) => (
                <motion.div
                  key={s.skill}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center justify-between py-1.5"
                >
                  <span className="text-[12px] font-semibold text-[#0F172A]">{s.skill}</span>
                  <StarBadge rating={s.rating} />
                </motion.div>
              ))}
            </AnimatePresence>

            {!expanded && skills.length > 3 && (
              <button
                onClick={() => setExpanded(true)}
                className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-1 hover:underline"
              >
                +{skills.length - 3} more
              </button>
            )}
          </div>
        ) : (
          <div className="border-t border-[#F1F5F9] pt-4">
            <p className="text-[10px] font-bold text-[#CBD5E1] uppercase tracking-widest italic">
              No skill profile yet
            </p>
          </div>
        )}
      </div>

      {/* Inline save toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`mx-4 mb-4 px-4 py-2 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${
              toast.type === "success"
                ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                : "bg-rose-50 text-rose-600 border border-rose-100"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 size={12} />
            ) : (
              <AlertCircle size={12} />
            )}
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
  const [filterSkills, setFilterSkills] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function checkAndLoad() {
      const { data: { user } } = await supabase.auth.getUser();
      const mockSession = document.cookie
        .split("; ")
        .find((r) => r.startsWith("mock_session="))
        ?.split("=")[1];
      const isMockAdmin = mockSession?.startsWith("admin");

      if (!user && !isMockAdmin) {
        router.push("/auth");
        return;
      }

      if (user && !isMockAdmin) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        if (prof?.role !== "admin" && prof?.role !== "evaluator") {
          router.push("/");
          return;
        }
      }

      // Only show candidates who have gone through the interview (skill_profile set)
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "candidate")
        .not("skill_profile", "is", null)
        .order("full_name", { ascending: true });

      // Further filter: must have at least one rated skill
      const withRatedSkills = (data || []).filter((c) => {
        try {
          const parsed = typeof c.skill_profile === "string"
            ? JSON.parse(c.skill_profile)
            : c.skill_profile;
          return Array.isArray(parsed) && parsed.some((s) => s.skill && s.rating > 0);
        } catch { return false; }
      });

      setCandidates(withRatedSkills);
      setLoading(false);
    }
    checkAndLoad();
  }, []);

  function handleSave(id, updates) {
    setCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  }

  const filtered = candidates.filter((c) => {
    const matchSearch =
      c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.usn?.toLowerCase().includes(searchTerm.toLowerCase());
    if (filterSkills) {
      let skills = [];
      try {
        skills = c.skill_profile
          ? (typeof c.skill_profile === "string"
              ? JSON.parse(c.skill_profile)
              : c.skill_profile
            ).filter((s) => s.skill && s.rating > 0)
          : [];
      } catch (_) {}
      return matchSearch && skills.length > 0;
    }
    return matchSearch;
  });

  const withSkills = candidates.filter((c) => {
    try {
      return (
        c.skill_profile &&
        (typeof c.skill_profile === "string"
          ? JSON.parse(c.skill_profile)
          : c.skill_profile
        ).some((s) => s.skill && s.rating > 0)
      );
    } catch (_) {
      return false;
    }
  });

  return (
    <div className="p-8 md:p-14 space-y-10">
      {/* Header */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-[#0F172A] tracking-tighter uppercase leading-none">
            Member <span className="text-[#2563EB]">Profiles</span>
          </h1>
          <p className="text-[11px] font-black text-[#94A3B8] uppercase tracking-[0.4em] mt-2">
            All club members · skill profiles · editable info
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Search */}
          <div className="bg-white border border-[#E2E8F0] px-4 py-2 rounded-2xl flex items-center gap-2 flex-1 md:flex-none md:min-w-[260px] shadow-sm">
            <Search size={15} className="text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Search by name, email, USN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-none text-xs font-bold w-full placeholder:text-[#CBD5E1]"
            />
          </div>

          {/* Filter: only with skills */}
          <button
            onClick={() => setFilterSkills(!filterSkills)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
              filterSkills
                ? "bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-100"
                : "bg-white text-[#64748B] border-[#E2E8F0] hover:border-amber-300"
            }`}
          >
            <Star size={13} />
            <span>Skill Rated Only</span>
          </button>
        </div>
      </header>

      {/* Stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Members", value: candidates.length, color: "text-[#0F172A]" },
          { label: "Skill Profiled", value: withSkills.length, color: "text-amber-600" },
          {
            label: "In Interview Pool",
            value: candidates.filter((c) => c.round2_status === "selected_round3").length,
            color: "text-violet-600",
          },
          {
            label: "Research Submitted",
            value: candidates.filter((c) => c.round2_status === "submitted" || c.round2_status === "selected_round3").length,
            color: "text-blue-600",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white border border-[#E2E8F0] rounded-[22px] p-5 shadow-sm"
          >
            <p className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest mb-1">
              {s.label}
            </p>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 opacity-20">
          <Loader2 size={40} className="animate-spin text-[#2563EB]" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em]">Loading Profiles</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-dashed border-[#E2E8F0] rounded-[32px] p-20 text-center">
          <Users size={48} className="mx-auto text-[#CBD5E1] mb-4" />
          <p className="text-sm font-bold text-[#64748B]">
            {searchTerm || filterSkills ? "No matching profiles found." : "No candidates registered yet."}
          </p>
        </div>
      ) : (
        <>
          <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest -mb-4">
            Showing {filtered.length} of {candidates.length} members
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((c) => (
              <ProfileCard
                key={c.id}
                candidate={c}
                onSave={handleSave}
                onDelete={(id) => setCandidates((prev) => prev.filter((x) => x.id !== id))}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
