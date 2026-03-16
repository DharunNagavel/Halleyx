"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      router.push("/dashboard");
    } else {
      router.push("/signin");
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <div className="animate-spin h-10 w-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full"></div>
          <div className="absolute inset-0 animate-ping h-10 w-10 border border-emerald-500/30 rounded-full"></div>
        </div>
        <div className="flex flex-col items-center">
            <p className="text-black font-black uppercase tracking-[0.3em] text-[10px]">Workflow <span className="text-emerald-500">Engine</span></p>
            <p className="text-zinc-400 font-black uppercase tracking-[0.1em] text-[8px] mt-1">Booting Core Modules...</p>
        </div>
      </div>
    </div>
  );
}
