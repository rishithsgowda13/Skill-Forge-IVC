"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LogOut, 
  FileText, 
  LayoutDashboard,
  Zap,
  ShieldCheck,
  Menu,
  X,
  Users,
  Settings,
  Activity,
  Trophy,
  History,
  BookOpen,
  UserCheck,
  Star,
  LayoutGrid,
  ShieldAlert,
  MessageSquare
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { useSidebar } from "@/context/SidebarContext";
import Link from "next/link";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { isExpanded, setIsExpanded } = useSidebar();
  const [isOpen, setIsOpen] = useState(false);
  const [role, setRole] = useState("user");
  const [userName, setUserName] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const [round2Status, setRound2Status] = useState(null);

  useEffect(() => {
    async function init() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase.from("profiles").select("full_name, role, round2_status").eq("id", user.id).single();
          if (profile) {
            setUserName(profile.full_name);
            if (profile.role) setRole(profile.role);
            setRound2Status(profile.round2_status);
          }
        }
        
        const cookies = document.cookie.split(';');
        const sessionCookie = cookies.find(c => c.trim().startsWith('mock_session='));
        if (sessionCookie) {
          const val = sessionCookie.split('=')[1];
          const [r, id] = val.split(':');
          setRole(r || "user");
          if (id) setUserName(id.includes('@') ? id.split('@')[0] : `can ${id}`);
          
          if ((r === "candidate" || r === "user") && id.includes('@')) {
             try {
               const { data: prof } = await supabase.from("profiles").select("round2_status").eq("email", id).single();
               if (prof) setRound2Status(prof.round2_status);
             } catch (e) {
               console.error("Mock status sync failed:", e);
             }
          }
        }
      } catch (err) {
        console.error("Sidebar initialization protocol error:", err);
      } finally {
        setIsMounted(true);
      }
    }
    init();
  }, []);

  if (!isMounted) return null;

  const toggleSidebar = () => setIsOpen(!isOpen);

  const handleLogout = async () => {
    document.cookie = "mock_session=; path=/; max-age=0;";
    await supabase.auth.signOut();
    router.push("/login");
  };

  const adminItems = [
    { href: "/admin", label: "Control Center", icon: LayoutDashboard },
    { href: "/dashboard/chat", label: "Neural Monitoring", icon: MessageSquare },
    { href: "/admin/round2", label: "Round 2 Selection", icon: BookOpen },
    { href: "/admin/round3", label: "Round 3 Selection", icon: UserCheck },
    { href: "/admin/interview", label: "Interview Panel", icon: Star },
    { href: "/admin/profiles", label: "Member Profiles", icon: LayoutGrid },
    { href: "/admin/projects", label: "Project Nexus", icon: Activity },
    { href: "/admin/roles", label: "Role Nexus", icon: ShieldCheck },
    { href: "/admin/achievements", label: "Hall of Valor", icon: Trophy },
    { href: "/admin/users", label: "Node Registry", icon: Users },
  ];

  const mentorItems = [
    { href: "/mentor", label: "Mentor Center", icon: LayoutDashboard },
    { href: "/dashboard/chat", label: "Node Communication", icon: MessageSquare },
    { href: "/mentor/projects", label: "Project Oversight", icon: Activity },
  ];

  const candidateItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/chat", label: "Communication", icon: MessageSquare },
    { href: "/dashboard/projects", label: "My Assignments", icon: Activity },
    { href: "/dashboard/achievements", label: "Achievements", icon: Trophy },
    { href: "/dashboard/research", label: "Skill Forge", icon: BookOpen },
    { href: "/dashboard/interview", label: "Skill Profile", icon: Star },
  ];

  const isAdmin = role === "admin" || role === "evaluator";
  const isMentor = role === "mentor";

  const navItems = isAdmin ? adminItems : (isMentor ? mentorItems : candidateItems);

  return (
    <motion.aside 
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      initial={false}
      animate={{ 
        width: isExpanded ? 220 : 64
      }}
      transition={{ type: "spring", stiffness: 400, damping: 35 }}
      className="fixed left-0 top-0 bottom-0 bg-white border-r border-[#F1F5F9] hidden lg:flex flex-col z-[65] overflow-hidden"
    >
        {/* Logo Section */}
        <div className="h-20 flex items-center px-4 relative z-10">
           <div className="flex items-center gap-3 min-w-[180px]">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-100 flex-shrink-0"
              >
                <ShieldCheck className="w-5 h-5 text-white" />
              </motion.div>
              <AnimatePresence>
                {isExpanded && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ delay: 0.1 }}
                  >
                    <span className="font-[900] text-xl text-[#0F172A] tracking-tight block leading-none">SkillForge</span>
                  </motion.div>
                )}
              </AnimatePresence>
           </div>
        </div>

        <div className="px-4 mb-6 relative z-10 h-10">
          <AnimatePresence mode="wait">
            {isExpanded ? (
              <motion.div 
                key="expanded-chip"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#F8FAFC] rounded-full px-4 py-2 flex items-center gap-2 border border-[#F1F5F9] transition-all w-fit whitespace-nowrap"
              >
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-[7.5px] font-black uppercase tracking-[0.2em] text-[#94A3B8] leading-none">
                    {isAdmin ? "Evaluator Node" : "Candidate Station"}
                  </span>
              </motion.div>
            ) : (
              <motion.div 
                key="collapsed-chip"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex justify-center w-10"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-[#F1F5F9] border border-[#E2E8F0]" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 space-y-1 relative z-10 overflow-y-auto custom-scrollbar overflow-x-hidden">
          {navItems.map((item) => {
            const isActive = pathname ? (pathname === item.href || (item.label !== "Dashboard" && item.label !== "Control Center" && pathname.startsWith(item.href))) : false;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center transition-all rounded-xl mx-2 group relative overflow-hidden h-[40px] border ${
                  isActive 
                    ? "bg-blue-600 text-white border-blue-500 shadow-[0_6px_15px_-4px_rgba(37,99,235,0.4)]" 
                    : "text-[#64748B] bg-transparent border-transparent hover:bg-slate-50 hover:border-slate-100 hover:text-[#0F172A]"
                }`}
                style={{ width: isExpanded ? '204px' : '48px' }}
              >
                <div className={`flex items-center gap-3 px-0 w-full ${isExpanded ? "pl-3.5" : "justify-center"}`}>
                  <item.icon size={15} className={`${isActive ? "text-white" : "text-[#94A3B8] group-hover:text-blue-600"} transition-all duration-300 flex-shrink-0`} />
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.span 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                        className="text-[9px] font-black uppercase tracking-[0.12em] whitespace-nowrap pt-[0.5px]"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  
                  {isActive && isExpanded && (
                    <motion.div 
                      layoutId="active-indicator" 
                      className="ml-auto mr-4 w-1.5 h-1.5 bg-white/40 rounded-full flex-shrink-0" 
                    />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-[#F1F5F9] relative z-10 mt-auto bg-white">
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/profile"
              className="flex-1 flex items-center p-2 rounded-2xl transition-all bg-[#F8FAFC] border border-[#F1F5F9] group cursor-pointer hover:border-blue-200 hover:bg-blue-50/30 overflow-hidden"
            >
               <div className="w-9 h-9 bg-[#0F172A] rounded-xl flex items-center justify-center text-white font-black text-[11px] flex-shrink-0 shadow-lg relative group-hover:scale-105 transition-transform uppercase border-2 border-white">
                  <span>{userName?.[0] || role?.[0] || "N"}</span>
                  <div className="absolute -right-1 -top-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white shadow-sm" />
               </div>
               
               <AnimatePresence>
                 {isExpanded && (
                   <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="ml-3 flex flex-col min-w-0"
                   >
                      <span className="text-[10px] font-black text-[#0F172A] uppercase tracking-tight truncate leading-none mb-1">
                        {userName || "Protocol Entity"}
                      </span>
                      <span className="text-[8px] font-bold text-[#94A3B8] uppercase tracking-widest truncate leading-none">
                        {role === "admin" ? "Master Evaluator" : "Authorized Node"}
                      </span>
                   </motion.div>
                 )}
               </AnimatePresence>
            </Link>
            
            {isExpanded && (
               <button 
                 onClick={handleLogout}
                 title="Terminate Session"
                 className="p-2.5 text-[#94A3B8] hover:text-rose-500 transition-colors rounded-xl hover:bg-rose-50 bg-slate-50 border border-[#F1F5F9]"
               >
                 <LogOut size={16} />
               </button>
            )}
          </div>
        </div>
      </motion.aside>
    );
  }
