"use client";

import { useEffect, useState, useRef } from "react";
import { workflowApi } from "@/lib/api";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/Button";
import { PlusCircle, Search, Settings2, Trash2, Clock, GitBranch, Play, X, User, Activity, Zap, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/Input";
import Link from "next/link";
import gsap from "gsap";

export default function Dashboard() {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const searchInputRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  const containerRef = useRef(null);
  const cardsRef = useRef([]);
  
  // Execution Modal State
  const [executingWorkflow, setExecutingWorkflow] = useState(null);
  const [execData, setExecData] = useState({});
  const [execStatus, setExecStatus] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
    fetchWorkflows();
  }, []);

  useEffect(() => {
    if (!loading && workflows.length > 0) {
      gsap.fromTo(cardsRef.current, 
        { y: 30, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: "power3.out" }
      );
    }
  }, [loading, workflows]);

  const fetchWorkflows = async () => {
    try {
      const response = await workflowApi.getAll();
      setWorkflows(response.data);
    } catch (err) {
      console.error("Failed to fetch workflows", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this workflow?")) {
      try {
        await workflowApi.delete(id);
        setWorkflows(workflows.filter((w) => w.id !== id));
      } catch (err) {
        console.error("Failed to delete workflow", err);
      }
    }
  };

  const handleExecute = async () => {
    setLoading(true);
    try {
      const response = await workflowApi.execute(executingWorkflow.id, execData);
      setExecStatus(response.data);
    } catch (err) {
      alert("Execution failed: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = user?.role === 'admin';

  const filteredWorkflows = workflows.filter((w) =>
    w.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC]" ref={containerRef}>
      <Navbar />
      
      {/* Premium Hero Section */}
      <div className="bg-black overflow-hidden relative border-b border-emerald-500/10">
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px]" />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[9px] font-black uppercase tracking-[0.2em] mb-6 border border-emerald-500/20">
                        <Zap className="w-3 h-3 fill-current" />
                        Next-Gen Automation
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-none mb-4">
                        {isAdmin ? "Orchestrate" : "Run Your"} <span className="text-emerald-500">Workflows</span>
                    </h1>
                    <p className="text-lg text-zinc-400 max-w-xl font-medium">
                        {isAdmin 
                            ? "Design complex business logic with ease using our visual engine." 
                            : "Easily trigger and monitor automated processes defined by your team."}
                    </p>
                </div>
                
                <div className="flex flex-col gap-3 min-w-[300px]">
                    <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl flex items-center gap-4 group hover:border-emerald-500/50 transition-all duration-500">
                        <div className="p-3 bg-emerald-500 rounded-2xl shadow-lg shadow-emerald-500/20">
                            <Activity className="w-5 h-5 text-black" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">System Status</p>
                            <p className="font-bold text-white uppercase tracking-tighter italic">Operational</p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="relative group flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-emerald-500 transition-colors" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search workflows by name..."
              className="w-full pl-12 pr-4 py-4 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all shadow-sm font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-4">
            {isAdmin && (
                <Link href="/workflows/create">
                    <Button className="h-14 px-8 rounded-2xl bg-black hover:bg-zinc-900 text-white shadow-xl shadow-zinc-200 flex items-center gap-3 group border border-zinc-800">
                        <PlusCircle className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500 text-emerald-500" />
                        <span className="font-black uppercase tracking-widest text-xs">Create Workflow</span>
                    </Button>
                </Link>
            )}
          </div>
        </div>

        {loading && !executingWorkflow ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-zinc-100 h-64 rounded-[2.5rem]" />
            ))}
          </div>
        ) : filteredWorkflows.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredWorkflows.map((workflow, index) => (
              <div
                key={workflow.id}
                ref={el => cardsRef.current[index] = el}
                className="group bg-white rounded-[2.5rem] border border-zinc-100 p-8 shadow-sm hover:shadow-2xl hover:shadow-emerald-500/5 hover:-translate-y-2 transition-all duration-500 relative flex flex-col h-full overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 -z-0" />
                
                {isAdmin && (
                    <div className="absolute top-6 right-6 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10">
                        <Link href={`/workflows/${workflow.id}/edit`}>
                            <button className="p-2 text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors">
                                <Settings2 className="w-4 h-4" />
                            </button>
                        </Link>
                        <button
                            onClick={() => handleDelete(workflow.id)}
                            className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                )}
                
                <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 shadow-xl shadow-emerald-500/10 relative z-10">
                  <GitBranch className="w-8 h-8 text-emerald-500" />
                </div>

                <div className="flex-1 relative z-10">
                    <h3 className="text-2xl font-black text-black mb-2 tracking-tighter group-hover:text-emerald-600 transition-colors">{workflow.name}</h3>
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2 mb-8">
                        <Clock className="w-3 h-3" />
                        {new Date(workflow.updated_at).toLocaleDateString()}
                    </p>
                </div>

                <div className="mt-auto pt-6 border-t border-zinc-50 flex items-center justify-between relative z-10">
                    <div className="flex -space-x-2">
                        {[1,2,3].map(i => (
                            <div key={i} className="w-8 h-8 rounded-full bg-zinc-100 border-2 border-white flex items-center justify-center">
                                <User className="w-4 h-4 text-zinc-400" />
                            </div>
                        ))}
                    </div>
                    {!isAdmin && (
                        <Button 
                            variant="primary" 
                            className="h-12 px-6 rounded-2xl bg-black hover:bg-zinc-900 border border-emerald-500/20 text-emerald-500 shadow-xl shadow-emerald-500/5 flex items-center gap-2 group/btn"
                            onClick={() => {
                                setExecutingWorkflow(workflow);
                                setExecData({});
                            }}
                        >
                            <Play className="w-4 h-4 fill-current group-hover/btn:scale-110 transition-transform" /> 
                            <span className="font-black text-xs uppercase tracking-widest">Execute</span>
                        </Button>
                    )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-zinc-100">
            <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-10 h-10 text-zinc-200" />
            </div>
            <p className="text-zinc-400 font-black uppercase tracking-widest text-xs">Awaiting data structures</p>
          </div>
        )}
      </main>

      {/* EXECUTION MODAL */}
      {executingWorkflow && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
                <div className="px-10 py-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 rounded-2xl">
                             <Play className="w-6 h-6 text-green-600 fill-current" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Launch Workflow</h2>
                            <p className="text-sm text-gray-400 font-medium">Ready to execute: {executingWorkflow.name}</p>
                        </div>
                    </div>
                    <button onClick={() => setExecutingWorkflow(null)} className="p-3 hover:bg-white hover:shadow-sm rounded-2xl transition-all">
                        <X className="w-6 h-6 text-gray-400" />
                    </button>
                </div>
                
                <div className="p-10 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {!execStatus ? (
                        <>
                            {(() => {
                                try {
                                    if (!executingWorkflow.input_schema) return (
                                        <div className="text-center py-10 bg-blue-50/30 rounded-3xl border border-blue-100/50">
                                            <Zap className="mx-auto w-10 h-10 text-blue-200 mb-2" />
                                            <p className="text-blue-500 font-bold">No parameters required. Instant launch!</p>
                                        </div>
                                    );
                                    
                                    const schema = typeof executingWorkflow.input_schema === 'string' 
                                        ? JSON.parse(executingWorkflow.input_schema) 
                                        : executingWorkflow.input_schema;

                                    const keys = Object.keys(schema);
                                    if (keys.length === 0) return <p className="text-gray-400 text-sm italic">No input fields required.</p>;

                                    return (
                                        <div className="space-y-6">
                                            {keys.map((fieldName) => (
                                                <div key={fieldName} className="space-y-2 group">
                                                    <label className="text-sm font-black text-gray-400 uppercase tracking-widest ml-1">{fieldName.replace(/_/g, ' ')}</label>
                                                    <div className="relative">
                                                        <Input 
                                                            type={schema[fieldName] === 'number' ? 'number' : 'text'}
                                                            placeholder={`e.g. ${schema[fieldName] === 'number' ? '100' : 'Your value'}`}
                                                            className="h-14 px-6 rounded-2xl border-gray-100 bg-gray-50/50 group-focus-within:bg-white transition-all shadow-none focus-within:ring-4 ring-blue-500/10 border"
                                                            value={execData[fieldName] || ''}
                                                            onChange={(e) => setExecData({
                                                                ...execData,
                                                                [fieldName]: schema[fieldName] === 'number' ? Number(e.target.value) : e.target.value
                                                            })}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                } catch (e) {
                                    return <p className="text-red-500 text-sm font-bold">Error: Invalid input schema format.</p>;
                                }
                            })()}
                        </>
                    ) : (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
                            <div className={`p-8 rounded-[2rem] border-2 flex flex-col items-center gap-4 text-center ${
                                execStatus.status === 'completed' ? 'bg-green-50 border-green-100 text-green-700' : 
                                execStatus.status === 'failed' ? 'bg-red-50 border-red-100 text-red-700' : 'bg-blue-50 border-blue-100 text-blue-700'
                            }`}>
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center bg-white shadow-xl ${
                                    execStatus.status === 'completed' ? 'text-green-600 shadow-green-200/50' : 
                                    execStatus.status === 'failed' ? 'text-red-600 shadow-red-200/50' : 'text-blue-600 shadow-blue-200/50'
                                }`}>
                                   {execStatus.status === 'completed' ? <CheckCircle2 className="w-8 h-8" /> : 
                                    execStatus.status === 'failed' ? <X className="w-8 h-8" /> : <Clock className="w-8 h-8 animate-spin" />}
                                </div>
                                <div>
                                    <p className="font-black uppercase tracking-[0.2em] text-xs opacity-60 mb-1">Execution Status</p>
                                    <h3 className="text-3xl font-black">{execStatus.status.charAt(0).toUpperCase() + execStatus.status.slice(1)}</h3>
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Flow Trajectory</h4>
                                <div className="space-y-3">
                                    {execStatus.logs?.map((log, i) => (
                                        <div key={i} className="flex items-center justify-between p-5 bg-white border border-gray-100 rounded-3xl shadow-sm hover:border-blue-200 transition-all group">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-3 h-3 rounded-full shadow-[0_0_15px] ${
                                                    log.status === 'completed' ? 'bg-green-500 shadow-green-500/50' : 
                                                    log.status === 'waiting' ? 'bg-amber-500 shadow-amber-500/50 animate-pulse' : 'bg-red-500 shadow-red-500/50'
                                                }`} />
                                                <span className="font-bold text-gray-900">{log.step_name}</span>
                                            </div>
                                            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest group-hover:text-blue-400 transition-colors">{log.step_type}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="p-10 border-t border-gray-50 bg-gray-50/50 flex justify-end gap-4">
                    {!execStatus ? (
                        <>
                            <button onClick={() => setExecutingWorkflow(null)} className="px-8 py-4 text-sm font-bold text-gray-400 hover:text-gray-900 transition-colors">Abort</button>
                            <Button 
                                className="h-14 px-10 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-200 flex items-center gap-3 font-bold text-lg" 
                                onClick={handleExecute} 
                                disabled={loading}
                            >
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Firing up...</span>
                                    </div>
                                ) : (
                                    <>
                                        <Zap className="w-5 h-5 fill-current" />
                                        <span>Launch Engine</span>
                                    </>
                                )}
                            </Button>
                        </>
                    ) : (
                        <Button 
                            className="h-14 px-10 rounded-2xl bg-gray-900 hover:bg-black text-white w-full font-bold shadow-xl shadow-gray-200" 
                            onClick={() => {
                                setExecutingWorkflow(null);
                                setExecStatus(null);
                            }}
                        >
                            Complete Review
                        </Button>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
}

// Additional Icon for the status view
function CheckCircle2(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}
