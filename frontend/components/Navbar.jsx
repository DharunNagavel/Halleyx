"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "./ui/Button";
import { Activity, LogOut, LayoutDashboard, PlusCircle, Clock, ChevronRight, User } from "lucide-react";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/signin");
  };

  const isAdmin = user?.role === "admin";

  return (
    <nav className="sticky top-0 z-[100] w-full bg-white/70 backdrop-blur-xl border-b border-zinc-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="bg-black p-2.5 rounded-2xl shadow-lg shadow-emerald-500/10 group-hover:rotate-12 transition-transform duration-300">
                <Activity className="h-6 w-6 text-emerald-500" />
              </div>
              <span className="text-xl font-black tracking-tight text-black">
                Workflow<span className="text-emerald-500">Engine</span>
              </span>
            </Link>
            
            <div className="hidden sm:flex items-center bg-zinc-50 p-1.5 rounded-2xl border border-zinc-100">
              <Link
                href="/dashboard"
                className={`flex items-center px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                    pathname === "/dashboard" 
                        ? "bg-black text-emerald-500 shadow-sm" 
                        : "text-zinc-500 hover:text-black"
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5 mr-2" />
                Workflows
              </Link>
              {!isAdmin && (
                <Link
                    href="/dashboard/executions"
                    className={`flex items-center px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                        pathname === "/dashboard/executions" 
                            ? "bg-black text-emerald-500 shadow-sm" 
                            : "text-zinc-500 hover:text-black"
                    }`}
                >
                    <Clock className="w-3.5 h-3.5 mr-2" />
                    Archive
                </Link>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            {user && (
                <div className="flex items-center gap-4 pl-4 border-l border-zinc-100">
                    <div className="hidden md:block text-right">
                        <p className="text-[10px] font-black text-black uppercase tracking-widest truncate max-w-[120px]">{user.name}</p>
                        <p className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.2em]">{user.role}</p>
                    </div>
                    <div className="w-10 h-10 rounded-2xl bg-black flex items-center justify-center border border-zinc-800">
                        <User className="w-5 h-5 text-emerald-500" />
                    </div>
                    <button
                        onClick={handleLogout}
                        className="group flex items-center gap-2 p-2.5 rounded-2xl text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-all border border-transparent hover:border-rose-100"
                    >
                        <LogOut className="h-5 w-5 group-hover:scale-110 transition-transform" />
                        <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest">Sign Out</span>
                    </button>
                </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
