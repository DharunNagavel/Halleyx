"use client";

import { useEffect, useState } from "react";
import { executionApi } from "@/lib/api";
import Navbar from "@/components/Navbar";
import { Clock, CheckCircle2, XCircle, AlertCircle, Eye, Search, GitBranch } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function ExecutionDashboard() {
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedExecution, setSelectedExecution] = useState(null);

  useEffect(() => {
    fetchExecutions();
  }, []);

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
      case 'completed': return 'bg-green-100 text-green-700 border-green-200';
      case 'failed': return 'bg-red-100 text-red-700 border-red-200';
      case 'waiting': return 'bg-amber-100 text-amber-700 border-amber-200 animate-pulse';
      case 'in_progress': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const filteredExecutions = executions.filter(e => 
    e.workflow_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Clock className="w-6 h-6 text-blue-600" />
                Execution History
            </h1>
            <p className="text-gray-500 mt-1">Track the status and results of all workflow executions.</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by workflow or ID..."
              className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all w-full md:w-80"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
            <div className="space-y-4">
                {[1,2,3,4,5].map(i => (
                    <div key={i} className="h-20 bg-white rounded-xl animate-pulse border border-gray-100" />
                ))}
            </div>
        ) : filteredExecutions.length > 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Workflow</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Started</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Execution ID</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredExecutions.map((exec) => (
                            <tr key={exec.id} className="hover:bg-gray-50/50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                                            <GitBranch className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <span className="font-bold text-gray-900">{exec.workflow_name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusStyle(exec.status)}`}>
                                        {exec.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {new Date(exec.started_at).toLocaleString()}
                                </td>
                                <td className="px-6 py-4 text-xs font-mono text-gray-400">
                                    {exec.id.substring(0, 8)}...
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button 
                                        onClick={() => setSelectedExecution(exec)}
                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        ) : (
            <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-400 font-bold uppercase tracking-widest">No executions recorded</p>
            </div>
        )}
      </main>

      {/* DETAIL MODAL */}
      {selectedExecution && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                  <div className="px-8 py-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">{selectedExecution.workflow_name}</h2>
                        <p className="text-xs text-gray-400 font-mono mt-1">ID: {selectedExecution.id}</p>
                      </div>
                      <button onClick={() => setSelectedExecution(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                          <XCircle className="w-6 h-6 text-gray-400" />
                      </button>
                  </div>
                  
                  <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                      <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Status</p>
                              <p className={`text-sm font-bold uppercase ${
                                  selectedExecution.status === 'completed' ? 'text-green-600' : 
                                  selectedExecution.status === 'failed' ? 'text-red-600' : 'text-blue-600'
                              }`}>{selectedExecution.status}</p>
                          </div>
                          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Started</p>
                              <p className="text-sm font-bold text-gray-700">{new Date(selectedExecution.started_at).toLocaleTimeString()}</p>
                          </div>
                      </div>

                      <div className="space-y-3">
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Execution Path</h4>
                          {(() => {
                              const logs = typeof selectedExecution.logs === 'string' ? JSON.parse(selectedExecution.logs) : selectedExecution.logs;
                              return logs.map((log, i) => (
                                  <div key={i} className="flex gap-4 p-4 bg-white border border-gray-100 rounded-2xl hover:border-blue-100 transition-all">
                                      <div className={`w-1 origin-center scale-y-110 rounded-full ${
                                          log.status === 'completed' || log.status === 'approved' || log.status === 'notified' ? 'bg-green-500' : 
                                          log.status === 'waiting' ? 'bg-amber-500 animate-pulse' : 'bg-red-500'
                                      }`} />
                                      <div className="flex-1">
                                          <div className="flex justify-between items-center mb-1">
                                              <p className="font-bold text-gray-900 text-sm">{log.step_name}</p>
                                              <span className="text-[9px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full uppercase tracking-tighter border border-gray-200">{log.step_type}</span>
                                          </div>
                                          <p className="text-xs text-gray-500">Result: <span className="font-medium text-gray-700 italic">"{log.status}"</span></p>
                                      </div>
                                  </div>
                              ));
                          })()}
                      </div>

                      <div className="space-y-3">
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Payload Data</h4>
                          <pre className="p-4 bg-gray-900 text-gray-100 rounded-2xl text-[10px] font-mono overflow-x-auto shadow-inner">
                              {JSON.stringify(typeof selectedExecution.data === 'string' ? JSON.parse(selectedExecution.data) : selectedExecution.data, null, 2)}
                          </pre>
                      </div>
                  </div>

                  <div className="px-8 py-6 border-t border-gray-50 bg-gray-50 flex justify-end">
                      <Button onClick={() => setSelectedExecution(null)} className="px-8 bg-gray-900 hover:bg-black">Close Details</Button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}
