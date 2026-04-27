"use client";

import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Zap, 
  Activity,
  LogOut,
  BookOpen,
  MessageSquare,
  Star,
  LayoutGrid
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

export default function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [role, setRole] = useState("user");

  useEffect(() => {
    const cookies = document.cookie.split(';');
    const sessionCookie = cookies.find(c => c.trim().startsWith('mock_session='));
    if (sessionCookie) {
      setRole(sessionCookie.split('=')[1]);
    }
  }, []);

  const isAdmin = role === "admin" || role === "evaluator";

  const adminItems = [
    { href: "/admin", label: "Control", icon: LayoutDashboard },
    { href: "/dashboard/chat", label: "Comms", icon: MessageSquare },
    { href: "/admin/round3", label: "Select", icon: Users },
    { href: "/admin/interview", label: "Interview", icon: Star },
    { href: "/admin/profiles", label: "Profiles", icon: LayoutGrid },
  ];

  const mentorItems = [
    { href: "/mentor", label: "Mentor", icon: LayoutDashboard },
    { href: "/dashboard/chat", label: "Comms", icon: MessageSquare },
    { href: "/mentor/projects", label: "Projects", icon: Activity },
  ];

  const candidateItems = [
    { href: "/dashboard", label: "Nexus", icon: LayoutDashboard },
    { href: "/dashboard/chat", label: "Comms", icon: MessageSquare },
    { href: "/dashboard/projects", label: "Projects", icon: Activity },
    { href: "/dashboard/research", label: "Forge", icon: BookOpen },
    { href: "/dashboard/interview", label: "Profile", icon: Star },
  ];

  const navItems = isAdmin ? adminItems : (role === "mentor" ? mentorItems : candidateItems);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-[#F1F5F9] px-4 py-3 flex items-center justify-between z-[100] lg:hidden safe-area-bottom shadow-[0_-15px_40px_rgba(0,0,0,0.05)] rounded-t-[24px]">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <button
            key={item.label}
            onClick={() => item.action ? item.action() : router.push(item.href)}
            className="flex flex-col items-center gap-1.5 px-3 relative"
          >
            <div className={`p-2 rounded-xl transition-all duration-300 ${
              isActive 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-200" 
                : "text-[#94A3B8]"
            }`}>
              <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} />
            </div>
            <span className={`text-[8.5px] font-black uppercase tracking-widest ${
              isActive ? "text-blue-600" : "text-[#94A3B8]"
            }`}>
              {item.label}
            </span>
            {isActive && (
              <motion.div 
                layoutId="mobile-nav-pill"
                className="absolute -top-4 w-1 h-1 bg-blue-600 rounded-full"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
