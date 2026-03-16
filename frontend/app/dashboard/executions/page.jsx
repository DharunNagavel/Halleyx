"use client";

import { useEffect, useState, useRef } from "react";
import { executionApi } from "@/lib/api";
import Navbar from "@/components/Navbar";
import { Clock, CheckCircle2, XCircle, AlertCircle, Eye, Search, GitBranch, History, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import gsap from "gsap";

export default function ExecutionDashboard() {
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedExecution, setSelectedExecution] = useState(null);

  const rowsRef = useRef([]);

  useEffect(() => {
    fetchExecutions();
  }, []);

  useEffect(() => {
    if (!loading && executions.length > 0) {
      gsap.fromTo(rowsRef.current, 
        { x: -20, opacity: 0 }, 
        { x: 0, opacity: 1, duration: 0.5, stagger: 0.05, ease: "power2.out" }
      );
    }
  }, [loading, executions]);

  const fetchExecutions = async () => {
    try {
      const response = await executionApi.getAll();
      setExecutions(response.data);
    } catch (err) {
      console.error("Failed to fetch executions", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-50 text-green-600 border-green-100 shadow-[0_0_10px_rgba(34,197,94,0.1)]';
      case 'failed': return 'bg-red-50 text-red-600 border-red-100 shadow-[0_0_10px_rgba(239,44,44,0.1)]';
      case 'waiting': return 'bg-amber-50 text-amber-600 border-amber-100 animate-pulse';
      case 'in_progress': return 'bg-blue-50 text-blue-600 border-blue-100';
      default: return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  const filteredExecutions = executions.filter(e => 
    e.workflow_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 bg-black rounded-xl shadow-lg shadow-emerald-500/20 border border-emerald-500/10">
                    <History className="w-5 h-5 text-emerald-500" />
                </div>
                <h1 className="text-4xl font-black text-black tracking-tighter">Execution <span className="text-emerald-500">Archive</span></h1>
            </div>
            <p className="text-zinc-500 font-medium ml-1">Traceable history for every automated process triggered in your system.</p>
          </div>
          
          <div className="relative group min-w-[320px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-emerald-500 transition-colors" />
            <input
              type="text"
              placeholder="Filter by workflow or ID..."
              className="w-full pl-12 pr-4 py-4 bg-white border border-zinc-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all shadow-sm font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
            <div className="space-y-4">
                {[1,2,3,4,5].map(i => (
                    <div key={i} className="h-24 bg-white rounded-3xl animate-pulse border border-zinc-100" />
                ))}
            </div>
        ) : filteredExecutions.length > 0 ? (
            <div className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-xl shadow-zinc-200/20 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-zinc-50/50 border-b border-zinc-50">
                                <th className="px-8 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Workflow Identity</th>
                                <th className="px-8 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Lifecycle Status</th>
                                <th className="px-8 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Launch Time</th>
                                <th className="px-8 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Reference ID</th>
                                <th className="px-8 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] text-right">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50">
                            {filteredExecutions.map((exec, index) => (
                                <tr 
                                    key={exec.id} 
                                    ref={el => rowsRef.current[index] = el}
                                    className="hover:bg-emerald-50/30 transition-all group opacity-0"
                                >
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-black rounded-xl group-hover:bg-emerald-500 transition-all duration-300">
                                                <GitBranch className="w-5 h-5 text-emerald-500 group-hover:text-black transition-colors" />
                                            </div>
                                            <span className="font-black text-black text-lg tracking-tighter group-hover:text-emerald-700 transition-colors">{exec.workflow_name}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${getStatusStyle(exec.status)}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${
                                                exec.status === 'completed' ? 'bg-emerald-500' :
                                                exec.status === 'failed' ? 'bg-rose-500' : 'bg-black'
                                            }`} />
                                            {exec.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-black">{new Date(exec.started_at).toLocaleDateString()}</span>
                                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{new Date(exec.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="text-[10px] font-black text-zinc-300 bg-zinc-50 px-2 py-1 rounded-lg border border-zinc-100 uppercase tracking-widest">
                                            {exec.id.substring(0, 8)}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <button 
                                            onClick={() => setSelectedExecution(exec)}
                                            className="inline-flex items-center gap-2 px-5 py-3 bg-black text-white rounded-xl hover:bg-emerald-500 hover:text-black transition-all duration-300 group/btn shadow-xl shadow-black/10"
                                        >
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Inspect</span>
                                            <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        ) : (
            <div className="text-center py-32 bg-white rounded-[4rem] border-2 border-dashed border-zinc-100">
                <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <History className="w-10 h-10 text-zinc-200" />
                </div>
                <p className="text-zinc-400 font-black uppercase tracking-[0.2em] text-xs">Awaiting process records</p>
            </div>
        )}
      </main>

      {/* DETAIL MODAL */}
      {selectedExecution && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
              <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
                  <div className="px-10 py-8 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                      <div className="flex items-center gap-4">
                          <div className="p-3 bg-blue-100 rounded-2xl">
                              <GitBranch className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <h2 className="text-2xl font-black text-gray-900 tracking-tight">{selectedExecution.workflow_name}</h2>
                            <p className="text-xs text-gray-400 font-mono mt-0.5 opacity-60">ID: {selectedExecution.id}</p>
                          </div>
                      </div>
                      <button onClick={() => setSelectedExecution(null)} className="p-3 hover:bg-white hover:shadow-sm rounded-2xl transition-all">
                          <XCircle className="w-7 h-7 text-gray-300 hover:text-red-400" />
                      </button>
                  </div>
                  
                  <div className="p-10 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                      <div className="grid grid-cols-2 gap-6">
                          <div className="p-6 bg-gray-50/50 rounded-3xl border border-gray-100 relative overflow-hidden group">
                              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                  <Activity className="w-12 h-12" />
                              </div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Lifecycle Status</p>
                              <p className={`text-xl font-black uppercase tracking-tighter ${
                                  selectedExecution.status === 'completed' ? 'text-green-600' : 
                                  selectedExecution.status === 'failed' ? 'text-red-600' : 'text-blue-600'
                              }`}>{selectedExecution.status}</p>
                          </div>
                          <div className="p-6 bg-gray-50/50 rounded-3xl border border-gray-100 relative overflow-hidden group">
                              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                  <Clock className="w-12 h-12" />
                              </div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Started At</p>
                              <p className="text-xl font-black text-gray-800 tracking-tighter">{new Date(selectedExecution.started_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                          </div>
                      </div>

                      <div className="space-y-4">
                          <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Execution Trajectory</h4>
                          <div className="space-y-3">
                              {(() => {
                                  const logs = typeof selectedExecution.logs === 'string' ? JSON.parse(selectedExecution.logs) : selectedExecution.logs;
                                  return logs.map((log, i) => (
                                      <div key={i} className="flex gap-5 p-5 bg-white border border-gray-100 rounded-3xl hover:border-blue-200 hover:shadow-lg transition-all group">
                                          <div className={`w-1.5 origin-center rounded-full ${
                                              log.status === 'completed' || log.status === 'approved' || log.status === 'notified' ? 'bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.4)]' : 
                                              log.status === 'waiting' ? 'bg-amber-500 animate-pulse' : 'bg-red-500 shadow-[0_0_12px_rgba(239,44,44,0.4)]'
                                          }`} />
                                          <div className="flex-1">
                                              <div className="flex justify-between items-center mb-1">
                                                  <p className="font-bold text-gray-900 text-base">{log.step_name}</p>
                                                  <span className="text-[9px] font-black bg-gray-50 text-gray-400 px-2.5 py-1 rounded-full uppercase tracking-widest border border-gray-100 group-hover:text-blue-500 group-hover:border-blue-100 transition-colors">{log.step_type}</span>
                                              </div>
                                              <p className="text-xs text-gray-400">Outcome: <span className="font-bold text-gray-600 italic">"{log.status}"</span></p>
                                          </div>
                                      </div>
                                  ));
                              })()}
                          </div>
                      </div>

                      <div className="space-y-4">
                          <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Data Payload</h4>
                          <div className="relative group">
                              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <span className="text-[10px] font-bold text-gray-500 uppercase bg-black/20 px-2 py-1 rounded-lg backdrop-blur-md">JSON</span>
                              </div>
                              <pre className="p-6 bg-[#0F172A] text-blue-400 rounded-3xl text-xs font-mono overflow-x-auto shadow-2xl custom-scrollbar leading-relaxed">
                                  {JSON.stringify(typeof selectedExecution.data === 'string' ? JSON.parse(selectedExecution.data) : selectedExecution.data, null, 2)}
                              </pre>
                          </div>
                      </div>
                  </div>

                  <div className="px-10 py-8 border-t border-gray-50 bg-gray-50/50 flex justify-end">
                      <Button onClick={() => setSelectedExecution(null)} className="h-12 px-10 rounded-2xl bg-gray-900 hover:bg-black text-white font-bold shadow-xl shadow-gray-200">Dismiss Analysis</Button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}

