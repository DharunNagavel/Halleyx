"use client";

import { useEffect, useState, useRef } from "react";
import { workflowApi } from "@/lib/api";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/Button";
import { PlusCircle, Search, Settings2, Trash2, Clock, GitBranch, Play, X, User } from "lucide-react";
import { Input } from "@/components/ui/Input";
import Link from "next/link";

export default function Dashboard() {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const searchInputRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Execution Modal State
  const [executingWorkflow, setExecutingWorkflow] = useState(null);
  const [execData, setExecData] = useState({});
  const [execStatus, setExecStatus] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
    fetchWorkflows();
  }, []);

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
    <div className="min-h-screen bg-gray-50/50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Role Badge */}
        <div className="flex justify-end mb-4">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                <User className="w-3 h-3" />
                {user?.role || 'Guest'} Role
            </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
                {isAdmin ? "Manage Workflows" : "Available Workflows"}
            </h1>
            <p className="text-gray-500 mt-1">
                {isAdmin ? "Create and manage automation pipelines." : "Execute workflows defined by administrators."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search workflows..."
                className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all w-full md:w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {isAdmin && (
                <Link href="/workflows/create">
                    <Button className="flex items-center gap-2">
                        <PlusCircle className="w-4 h-4" />
                        <span>Create New</span>
                    </Button>
                </Link>
            )}
          </div>
        </div>

        {loading && !executingWorkflow ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-white h-40 rounded-xl border border-gray-200" />
            ))}
          </div>
        ) : filteredWorkflows.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWorkflows.map((workflow) => (
              <div
                key={workflow.id}
                className="group bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300 relative"
              >
                {isAdmin && (
                    <div className="absolute top-0 right-0 p-3 flex gap-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                        <Link href={`/workflows/${workflow.id}/edit`}>
                            <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md">
                                <Settings2 className="w-4 h-4" />
                            </button>
                        </Link>
                        <button
                            onClick={() => handleDelete(workflow.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                )}
                
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-blue-50 p-2 rounded-lg group-hover:bg-blue-100 transition-colors">
                    <GitBranch className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 group-hover:text-blue-600">{workflow.name}</h3>
                </div>

                <div className="flex items-center justify-between mt-6">
                  <div className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(workflow.updated_at).toLocaleDateString()}
                  </div>
                  {!isAdmin && (
                    <Button 
                      variant="primary" 
                      size="sm" 
                      className="gap-2 bg-green-600 hover:bg-green-700"
                      onClick={() => {
                          setExecutingWorkflow(workflow);
                          setExecData({});
                      }}
                    >
                      <Play className="w-4 h-4 fill-current" /> Run
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200 uppercase tracking-widest text-gray-400 font-bold">
            No workflows found
          </div>
        )}
      </main>

      {/* EXECUTION MODAL */}
      {executingWorkflow && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <Play className="w-4 h-4 text-green-600" />
                        Run: {executingWorkflow.name}
                    </h2>
                    <button onClick={() => setExecutingWorkflow(null)} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                    {!execStatus ? (
                        <>
                            <p className="text-sm text-gray-500 mb-2">Provide the required input parameters for this workflow:</p>
                            {(() => {
                                try {
                                    if (!executingWorkflow.input_schema) return <p className="text-gray-400 text-sm italic">No input fields required.</p>;
                                    
                                    const schema = typeof executingWorkflow.input_schema === 'string' 
                                        ? JSON.parse(executingWorkflow.input_schema) 
                                        : executingWorkflow.input_schema;

                                    const keys = Object.keys(schema);
                                    if (keys.length === 0) return <p className="text-gray-400 text-sm italic">No input fields required.</p>;

                                    return keys.map((fieldName) => (
                                        <div key={fieldName} className="space-y-1.5">
                                            <label className="text-sm font-semibold text-gray-700 capitalize">{fieldName.replace(/_/g, ' ')}</label>
                                            <Input 
                                                type={schema[fieldName] === 'number' ? 'number' : 'text'}
                                                placeholder={`Enter ${fieldName}...`}
                                                value={execData[fieldName] || ''}
                                                onChange={(e) => setExecData({
                                                    ...execData,
                                                    [fieldName]: schema[fieldName] === 'number' ? Number(e.target.value) : e.target.value
                                                })}
                                            />
                                            <p className="text-[10px] text-gray-400 italic">Type: {schema[fieldName]}</p>
                                        </div>
                                    ));
                                } catch (e) {
                                    return <p className="text-red-500 text-sm">Invalid input schema format.</p>;
                                }
                            })()}
                        </>
                    ) : (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                            <div className={`p-4 rounded-xl border flex items-center gap-3 ${
                                execStatus.status === 'completed' ? 'bg-green-50 border-green-100 text-green-700' : 
                                execStatus.status === 'failed' ? 'bg-red-50 border-red-100 text-red-700' : 'bg-blue-50 border-blue-100 text-blue-700'
                            }`}>
                                <div className="font-bold uppercase tracking-widest text-xs">Final Status: {execStatus.status}</div>
                            </div>
                            
                            <div className="space-y-3">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Execution Path</h4>
                                {execStatus.logs?.map((log, i) => (
                                    <div key={i} className="flex items-start gap-3 p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                                        <div className={`mt-1 w-2 h-2 rounded-full ${
                                            log.status === 'completed' ? 'bg-green-500' : 
                                            log.status === 'waiting' ? 'bg-amber-500 animate-pulse' : 'bg-red-500'
                                        }`} />
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-bold text-gray-900">{log.step_name}</span>
                                                <span className="text-[10px] font-mono text-gray-400 uppercase px-1.5 py-0.5 bg-gray-50 rounded border border-gray-100">{log.step_type}</span>
                                            </div>
                                            {log.step_type === 'notification' && (
                                                <p className="text-xs text-blue-600 bg-blue-50/50 p-2 mt-2 rounded border border-blue-50 italic">
                                                    "Informational update sent to system logs."
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <div className="p-6 border-t border-gray-50 bg-gray-50 flex justify-end gap-3">
                    {!execStatus ? (
                        <>
                            <Button variant="ghost" onClick={() => setExecutingWorkflow(null)}>Cancel</Button>
                            <Button variant="primary" className="bg-green-600 hover:bg-green-700 gap-2" onClick={handleExecute} disabled={loading}>
                                {loading ? "Launching..." : "Execute Workflow"}
                            </Button>
                        </>
                    ) : (
                        <Button 
                            variant="primary" 
                            className="bg-blue-600 hover:bg-blue-700" 
                            onClick={() => {
                                setExecutingWorkflow(null);
                                setExecStatus(null);
                            }}
                        >
                            Close Results
                        </Button>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
