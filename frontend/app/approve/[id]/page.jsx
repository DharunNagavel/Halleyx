"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { executionApi } from "@/lib/api";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

export default function ApprovalPage() {
    const { id } = useParams();
    const searchParams = useSearchParams();
    const action = searchParams.get("action");
    const router = useRouter();
    
    const [status, setStatus] = useState("processing");
    const [message, setMessage] = useState("");
    const [execution, setExecution] = useState(null);

    useEffect(() => {
        const fetchExecution = async () => {
            try {
                const res = await executionApi.getById(id);
                setExecution(res.data);
            } catch (err) {
                console.error("Failed to fetch execution:", err);
            }
        };
        if (id) fetchExecution();
    }, [id]);

    useEffect(() => {
        if (!id || !action) return;

        const processAction = async () => {
            try {
                // Small delay to let the user see the context if they want
                await new Promise(resolve => setTimeout(resolve, 500));
                const response = await executionApi.respond(id, action);
                setStatus("success");
                setMessage(response.data.message);
            } catch (err) {
                setStatus("error");
                setMessage(err.response?.data?.message || "Something went wrong.");
            }
        };

        processAction();
    }, [id, action]);

    const renderData = (data) => {
        if (!data) return null;
        let parsed = data;
        try {
            parsed = typeof data === 'string' ? JSON.parse(data) : data;
        } catch (e) {}
        
        const entries = Object.entries(parsed).filter(([key]) => !['id', 'workflow_id', 'execution_id', 'approval_status'].includes(key));
        
        if (entries.length === 0) return null;

        return (
            <div className="mt-10 space-y-4 text-left animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                <div className="flex items-center gap-2 px-2">
                    <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                    <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Context Archive</h3>
                </div>
                <div className="grid grid-cols-1 gap-3">
                    {entries.map(([key, value]) => (
                        <div key={key} className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-4 group hover:border-emerald-500/30 transition-all hover:bg-zinc-900/60 shadow-inner">
                            <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1 group-hover:text-emerald-500/50 transition-colors">{key.replace(/_/g, ' ')}</p>
                            <p className="text-sm font-bold text-white tracking-tight italic">
                                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] -z-10" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-zinc-100 rounded-full blur-[120px] -z-10" />

            <div className="max-w-md w-full bg-black rounded-[2.5rem] shadow-2xl p-12 text-center animate-in fade-in zoom-in duration-500 border border-zinc-800 relative">
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-black border border-zinc-800 rounded-3xl flex items-center justify-center shadow-2xl">
                    <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center">
                        <Loader2 className={`w-6 h-6 text-black ${status === 'processing' ? 'animate-spin' : ''}`} />
                    </div>
                </div>

                <div className="mt-8">
                    {status === "processing" && (
                        <div className="flex flex-col items-center gap-6">
                            <h1 className="text-2xl font-black text-white tracking-tighter uppercase tracking-widest">
                                Processing <span className="text-emerald-500">Decision</span>
                            </h1>
                            <p className="text-zinc-500 font-black uppercase tracking-widest text-[10px]">Please wait while the engine updates</p>
                            <div className="w-24 h-1 bg-zinc-900 rounded-full overflow-hidden">
                                <div className="w-1/2 h-full bg-emerald-500 animate-pulse" />
                            </div>
                        </div>
                    )}

                    {status === "success" && (
                        <div className="flex flex-col items-center gap-6 animate-in slide-in-from-top-4 duration-500">
                            <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl mb-2">
                                <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                            </div>
                            <h1 className="text-3xl font-black text-white tracking-tighter italic">Decision Recorded</h1>
                            <p className="text-zinc-400 font-medium text-sm leading-relaxed">{message}</p>
                            
                            <button 
                                onClick={() => router.push('/dashboard')}
                                className="mt-4 w-full h-14 bg-emerald-500 text-black font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl hover:bg-emerald-400 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-emerald-500/20"
                            >
                                Go to Dashboard
                            </button>
                        </div>
                    )}

                    {status === "error" && (
                        <div className="flex flex-col items-center gap-6">
                            <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl mb-2">
                                <XCircle className="w-12 h-12 text-rose-500" />
                            </div>
                            <h1 className="text-3xl font-black text-white tracking-tighter uppercase tracking-widest">Action Failed</h1>
                            <p className="text-rose-500/80 font-black uppercase tracking-widest text-[10px]">{message}</p>
                            
                            <button 
                                onClick={() => window.location.reload()}
                                className="mt-4 w-full h-14 bg-zinc-900 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl hover:bg-zinc-800 transition-all border border-zinc-800"
                            >
                                Try Again
                            </button>
                        </div>
                    )}

                    {execution && renderData(execution.data)}
                </div>
            </div>
        </div>
    );
}
