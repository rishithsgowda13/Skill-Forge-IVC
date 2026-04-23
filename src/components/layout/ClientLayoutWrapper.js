"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";
import { useSidebar } from "@/context/SidebarContext";
import { motion } from "framer-motion";

export default function ClientLayoutWrapper({ children }) {
  const { isExpanded } = useSidebar();
  const pathname = usePathname();
  
  // Routes where sidebar/nav should NOT appear
  const hideSidebarRoutes = ["/login", "/signup", "/auth", "/quiz/play", "/quiz/host"];
  const shouldShowSidebar = !hideSidebarRoutes.some(route => pathname?.startsWith(route)) && pathname !== "/";

  if (!shouldShowSidebar) {
    return (
      <main className="flex-1 w-full min-h-screen overflow-y-auto">{children}</main>
    );
  }

  return (
    <div className="flex min-h-screen bg-page-bg font-sans overflow-x-hidden">
      <Sidebar />
      <motion.main 
        initial={false}
        className={`flex-1 min-h-screen overflow-y-auto custom-scrollbar w-full relative pb-[100px] lg:pb-0 transition-[padding] duration-300 ease-in-out ${
          isExpanded ? "lg:pl-[240px]" : "lg:pl-[72px]"
        } pl-0`}
      >
        <div className="w-full max-w-full overflow-x-hidden">
          {children}
        </div>
        <MobileNav />
      </motion.main>
    </div>
  );
}
