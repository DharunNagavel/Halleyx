"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line 
} from "recharts";
import { 
  Activity, Database, CheckCircle, XCircle, Clock, 
  ArrowLeft, Shield, AlertTriangle, Users 
} from "lucide-react";
import Link from "next/link";
import gsap from "gsap";

const COLORS = ["#10b981", "#ef4444", "#f59e0b", "#3b82f6", "#8b5cf6"];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/admin/stats");
      setStats(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch admin stats", err);
    }
  };

  useEffect(() => {
    if (!loading) {
      gsap.from(".stat-card", {
        y: 20,
        opacity: 0,
        duration: 0.5,
        stagger: 0.1,
        ease: "power2.out"
      });
    }
  }, [loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-green-500"></div>
      </div>
    );
  }

  const pieData = stats.executionStats.map(stat => ({
    name: stat.status,
    value: parseInt(stat.count)
  }));

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
          <div className="space-y-2">
            <Link href="/dashboard" className="inline-flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-emerald-500 transition-all group">
              <ArrowLeft className="w-3 h-3 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to System
            </Link>
            <h1 className="text-5xl font-black text-white tracking-tighter italic flex items-center gap-4">
              Admin <span className="bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent not-italic font-black">Control Center</span>
            </h1>
          </div>
          <div className="flex items-center gap-3 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl px-6 py-3 backdrop-blur-md shadow-2xl shadow-emerald-500/10 hover:border-emerald-500/40 transition-all">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
            <span className="text-emerald-500 text-[11px] font-black uppercase tracking-[0.2em]">System Terminal Secured</span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            icon={<Database className="w-5 h-5" />}
            label="Total Workflows"
            value={stats.totalWorkflows}
            color="indigo"
          />
          <StatCard 
            icon={<CheckCircle className="w-5 h-5" />}
            label="Successful"
            value={stats.executionStats.find(s => s.status === 'completed')?.count || 0}
            color="emerald"
          />
          <StatCard 
            icon={<XCircle className="w-5 h-5" />}
            label="Failed"
            value={stats.executionStats.find(s => s.status === 'failed')?.count || 0}
            color="rose"
          />
          <StatCard 
            icon={<Clock className="w-5 h-5" />}
            label="Running"
            value={stats.executionStats.find(s => s.status === 'running')?.count || 0}
            color="amber"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Execution Trends */}
          <div className="bg-zinc-900/30 border border-white/5 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full" />
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 mb-8 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500" />
                Execution Trends
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.executionsOverTime}>
                  <defs>
                    <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis 
                    dataKey="day" 
                    stroke="#52525b" 
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { weekday: 'short' })}
                  />
                  <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '12px', fontSize: '10px' }}
                    itemStyle={{ color: '#10b981' }}
                  />
                  <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={4} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#000' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Status Distribution */}
          <div className="bg-zinc-900/30 border border-white/5 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full" />
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 mb-8 flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-500" />
                Status Distribution
            </h3>
            <div className="h-[300px] flex flex-col items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={100}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '12px', fontSize: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center flex-wrap gap-x-8 gap-y-2 mt-4">
                {pieData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    <div className="w-2 h-2 rounded-full mr-2 shadow-lg" style={{ backgroundColor: COLORS[index % COLORS.length], boxShadow: `0 0 8px ${COLORS[index % COLORS.length]}` }}></div>
                    {entry.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Audit Logs */}
        <div className="bg-zinc-900/30 border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl relative group">
          <div className="p-8 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-500" />
                Recent System Activity
            </h3>
            <div className="flex items-center gap-2 text-[10px] text-emerald-500/50 font-black uppercase tracking-widest">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Monitoring Active
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-black/20 text-zinc-500 text-[10px] font-black uppercase tracking-widest border-b border-white/5">
                  <th className="px-8 py-6">Operation</th>
                  <th className="px-8 py-6">Target Resource</th>
                  <th className="px-8 py-6">Metadata</th>
                  <th className="px-8 py-6 text-right">System Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {stats.recentLogs.length > 0 ? stats.recentLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors group/row">
                    <td className="px-8 py-6">
                      <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${
                        log.action.includes('error') || log.action.includes('delete') 
                          ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' 
                          : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white uppercase tracking-tight">{log.target_type}</span>
                        <span className="text-[9px] text-zinc-600 font-mono mt-1 opacity-0 group-hover/row:opacity-100 transition-opacity">{log.target_id}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <code className="text-[10px] text-zinc-500 font-mono bg-black/40 px-3 py-1 rounded-lg border border-white/5">
                        {JSON.stringify(log.details)}
                      </code>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <span className="text-[10px] text-zinc-600 font-black uppercase tracking-tighter">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </span>
                      <p className="text-[9px] text-zinc-800 mt-1">
                        {new Date(log.created_at).toLocaleDateString()}
                      </p>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="4" className="px-8 py-20 text-center text-zinc-700 italic text-sm">
                      No system records synchronized.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  const colors = {
    indigo: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
    emerald: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    rose: "bg-rose-500/10 text-rose-500 border-rose-500/20",
    amber: "bg-amber-500/10 text-amber-500 border-amber-500/20"
  };

  return (
    <div className="stat-card bg-zinc-900/40 border border-white/5 rounded-[2rem] p-8 backdrop-blur-xl relative overflow-hidden group hover:border-emerald-500/20 transition-all duration-500">
      <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity bg-emerald-500`} />
      <div className="flex flex-col gap-6 relative z-10">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${colors[color] || colors.indigo}`}>
          {icon}
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-1">{label}</p>
          <p className="text-4xl font-black text-white tracking-tighter italic">{value}</p>
        </div>
      </div>
    </div>
  );
}
