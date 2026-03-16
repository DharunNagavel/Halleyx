"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import axios from "axios";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

export default function ApprovalPage() {
    const { id } = useParams();
    const searchParams = useSearchParams();
    const action = searchParams.get("action");
    const router = useRouter();
    
    const [status, setStatus] = useState("processing");
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (!id || !action) return;

        const processAction = async () => {
            try {
                // Use executionApi if imported or keep axios but update URL pattern
                const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/executions/${id}/respond`, {
                    action: action
                });
                setStatus("success");
                setMessage(response.data.message);
            } catch (err) {
                setStatus("error");
                setMessage(err.response?.data?.message || "Something went wrong.");
            }
        };

        processAction();
    }, [id, action]);

    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] -z-10" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-zinc-100 rounded-full blur-[120px] -z-10" />

            <div className="max-w-md w-full bg-black rounded-[2.5rem] shadow-2xl p-12 text-center animate-in fade-in zoom-in duration-500 border border-zinc-800 relative">
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-black border border-zinc-800 rounded-3xl flex items-center justify-center shadow-2xl">
                    <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center animate-pulse">
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
                                <div className="w-1/2 h-full bg-emerald-500 animate-slide" />
                            </div>
                        </div>
                    )}

                    {status === "success" && (
                        <div className="flex flex-col items-center gap-6">
                            <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl mb-2">
                                <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                            </div>
                            <h1 className="text-3xl font-black text-white tracking-tighter">Decision Recorded</h1>
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
                </div>
            </div>
        </div>
    );
}
