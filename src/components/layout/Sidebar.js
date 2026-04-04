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
  History
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [role, setRole] = useState("user");

  useEffect(() => {
    const cookies = document.cookie.split(';');
    const sessionCookie = cookies.find(c => c.trim().startsWith('mock_session='));
    if (sessionCookie) {
      setRole(sessionCookie.split('=')[1]);
    }
  }, []);

  const toggleSidebar = () => setIsOpen(!isOpen);

  const handleLogout = async () => {
    document.cookie = "mock_session=; path=/; max-age=0;";
    await supabase.auth.signOut();
    router.push("/login");
  };

  const isAdmin = role === "admin" || role === "evaluator";

  const adminItems = [
    { href: "/quiz/admin", label: "Control Center", icon: LayoutDashboard },
    { href: "/quiz/admin/quizzes", label: "Protocols", icon: FileText },
    { href: "/quiz/admin/users", label: "Node Registry", icon: Users },
    { href: "/quiz/admin/security", label: "Security Audit", icon: ShieldCheck },
    { href: "/dashboard/reports", label: "Intelligence", icon: Activity },
  ];

  const candidateItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/quiz/access", label: "Attendance List", icon: Zap },
    { href: "/dashboard/reports", label: "Answer Analysis", icon: Activity },
  ];

  const navItems = isAdmin ? adminItems : candidateItems;

  return (
    <>
      {/* Mobile Toggle Button */}
      <button 
        onClick={toggleSidebar}
        className="fixed top-6 left-6 z-[70] lg:hidden p-4 bg-white rounded-2xl shadow-2xl shadow-blue-200 text-[#0F172A] border border-[#f1f5f9] active:scale-95 transition-all"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Backdrop for mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleSidebar}
            className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-md z-[60] lg:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside 
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
        initial={false}
        animate={{ 
          width: isExpanded ? 280 : 80,
          translateX: (isOpen || !isExpanded) ? 0 : 0 
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`fixed left-0 top-0 bottom-0 bg-white border-r border-slate-100 flex flex-col z-[65] transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo Section */}
        <div className="h-28 flex items-center px-[18px] relative z-10 overflow-hidden">
           <div className="flex items-center gap-4 min-w-[240px]">
              <div className="w-11 h-11 bg-blue-600 rounded-xl flex items-center justify-center shadow-xl shadow-blue-100 flex-shrink-0">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <AnimatePresence>
                {isExpanded && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="flex flex-col"
                  >
                    <span className="font-black text-xl text-slate-900 tracking-tighter block leading-none">SKILL<span className="text-blue-600">FORGE</span></span>
                    <span className="text-[8px] font-black tracking-[0.4em] text-slate-300 uppercase mt-1.5 block">Enterprise v4</span>
                  </motion.div>
                )}
              </AnimatePresence>
           </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="px-6 mb-8 relative z-10 overflow-hidden"
            >
               <div className={`p-4 rounded-3xl border ${isAdmin ? "bg-blue-50 border-blue-100" : "bg-slate-50 border-slate-100"} flex items-center gap-4 transition-all hover:shadow-lg hover:shadow-slate-100 group`}>
                  <div className={`w-2 h-2 rounded-full ${isAdmin ? "bg-blue-600 animate-pulse" : "bg-slate-300"}`} />
                  <div className="flex flex-col min-w-0">
                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] block leading-none truncate ${isAdmin ? "text-blue-600" : "text-slate-500"}`}>
                      {isAdmin ? "Evaluator Node" : "Candidate Station"}
                    </span>
                    <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mt-1.5 block">Identity Verified</span>
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <nav className="flex-1 px-[10px] space-y-1 relative z-10 overflow-y-auto custom-scrollbar overflow-x-hidden">
          {navItems.map((item) => {
            const isActive = pathname ? (pathname === item.href || (item.label !== "Dashboard" && item.label !== "Control Center" && pathname.startsWith(item.href))) : false;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center px-[14px] py-4 transition-all rounded-xl group relative overflow-hidden h-[56px] min-w-[240px] ${
                  isActive 
                    ? "bg-blue-600 text-white shadow-xl shadow-blue-200" 
                    : "text-slate-400 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-6 flex-shrink-0">
                  <item.icon size={22} className={isActive ? "text-white" : "text-slate-300 group-hover:text-blue-600 transition-colors flex-shrink-0"} />
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.span 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="text-[12px] font-black uppercase tracking-tight whitespace-nowrap"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
                
                {isActive && isExpanded && (
                  <motion.div layoutId="active-indicator" className="ml-auto w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                )}
              </Link>
            );
          })}
        </nav>

        <AnimatePresence>
          {isExpanded && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="px-8 py-6 relative z-10"
            >
               <div className="bg-slate-50 border border-slate-100 rounded-[24px] p-5 transition-all hover:bg-white hover:shadow-lg hover:shadow-slate-100 group">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2.5 leading-none group-hover:text-blue-600 transition-colors">Resource Allocation</p>
                  <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
                     <motion.div initial={{ width: 0 }} animate={{ width: "68%" }} className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer/Logout */}
        <div className="p-3 border-t border-slate-50 relative z-10 overflow-hidden">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center px-[14px] py-4 text-[10px] font-black text-rose-500 hover:bg-rose-50 rounded-xl transition-all uppercase tracking-[0.2em] group min-w-[240px]"
          >
             <LogOut size={22} className="group-hover:-translate-x-1 transition-transform flex-shrink-0 mr-6" />
             <AnimatePresence>
               {isExpanded && (
                 <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="whitespace-nowrap"
                 >
                   Terminate Sync
                 </motion.span>
               )}
             </AnimatePresence>
          </button>
        </div>
      </motion.aside>
    </>
  );
}
