"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "./ui/Button";
import { Activity, LogOut, LayoutDashboard, PlusCircle, Clock } from "lucide-react";

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

  const isAdmin = user?.role === 'admin';

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center gap-2 group">
              <div className="bg-blue-600 p-1.5 rounded-lg group-hover:bg-blue-700 transition-colors">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                Workflow Engine
              </span>
            </Link>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-4">
              <Link
                href="/dashboard"
                className={`inline-flex items-center px-1 py-2 text-sm font-medium transition-colors ${pathname === "/dashboard" ? "border-b-2 border-blue-600 text-gray-900" : "text-gray-500 hover:text-gray-900"}`}
              >
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Workflows
              </Link>
              {!isAdmin ? <Link
                href="/dashboard/executions"
                className={`inline-flex items-center px-1 py-2 text-sm font-medium transition-colors ${pathname === "/dashboard/executions" ? "border-b-2 border-blue-600 text-gray-900" : "text-gray-500 hover:text-gray-900"}`}
              >
                <Clock className="w-4 h-4 mr-2" />
                Executions
              </Link> : ""}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {isAdmin && (
              <Link href="/workflows/create">
                <Button size="sm" className="hidden sm:flex items-center gap-2">
                  <PlusCircle className="w-4 h-4" />
                  New Workflow
                </Button>
              </Link>
            )}
            <Button variant="ghost" size="sm" onClick={handleLogout} className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
