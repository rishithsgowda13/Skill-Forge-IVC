"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter, usePathname } from "next/navigation";

export default function AdminLayout({ children }) {
  const router = useRouter();
  const supabase = createClient();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      const mockSession = document.cookie
        .split("; ")
        .find((row) => row.startsWith("mock_session="))
        ?.split("=")[1];
      
      const isMockAdmin = mockSession?.startsWith("admin");
      
      if (!user && !isMockAdmin) {
        router.push("/login");
        return;
      }

      if (user && !isMockAdmin) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        
        if (profile?.role !== "admin") {
          router.push("/");
          return;
        }
      }
      
      setAuthorized(true);
    }

    checkAuth();
  }, [router, supabase]);

  if (!authorized) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 border-4 border-[#2563EB]/20 border-t-[#2563EB] rounded-full animate-spin mb-6" />
        <h2 className="text-sm font-black text-[#0F172A] uppercase tracking-[0.4em]">Synchronizing Security Protocols</h2>
        <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.2em] mt-2">Verifying administrative credentials...</p>
      </div>
    );
  }

  return children;
}
