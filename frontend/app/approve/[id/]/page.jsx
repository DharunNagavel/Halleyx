"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { executionApi } from "@/lib/api";
import { Loader2, CheckCircle2, XCircle, ShieldCheck, Zap, Activity } from "lucide-react";
import Navbar from "@/components/Navbar";

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

    return (
        <div className="min-h-screen bg-[#F8FAFC] relative overflow-hidden flex flex-col">
            <Navbar />
            
            {/* Background Orbs */}
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-[120px] -z-10" />
            <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-[500px] h-[500px] bg-indigo-100/40 rounded-full blur-[120px] -z-10" />

            <div className="flex-1 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white border border-gray-100 rounded-[2.5rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] p-10 text-center relative z-10 animate-in fade-in zoom-in-95 duration-500">
                    {status === "processing" && (
                        <div className="flex flex-col items-center gap-6">
                            <div className="p-5 bg-blue-50 rounded-2xl">
                                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Syncing Decision</h1>
                                <p className="text-gray-400 font-medium italic">Committing your response to the engine...</p>
                            </div>
                            <div className="flex items-center gap-2 opacity-30 mt-4">
                                <ShieldCheck className="w-4 h-4" />
                                <span className="text-[10px] uppercase font-black tracking-widest">Encrypted Tunnel</span>
                            </div>
                        </div>
                    )}

                    {status === "success" && (
                        <div className="flex flex-col items-center gap-6">
                            <div className="p-5 bg-green-50 rounded-3xl shadow-xl shadow-green-100">
                                <CheckCircle2 className="w-12 h-12 text-green-500" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Decision <span className="text-green-600">Locked</span></h1>
                                <p className="text-gray-500 font-medium leading-relaxed">{message}</p>
                            </div>
                            <button 
                                onClick={() => router.push('/dashboard')}
                                className="w-full mt-6 h-14 bg-gray-900 text-white rounded-2xl hover:bg-black transition-all font-bold shadow-xl shadow-gray-200 hover:-translate-y-1 flex items-center justify-center gap-2"
                            >
                                <Activity className="w-4 h-4" /> Go to Dashboard
                            </button>
                        </div>
                    )}

                    {status === "error" && (
                        <div className="flex flex-col items-center gap-6">
                            <div className="p-5 bg-red-50 rounded-3xl shadow-xl shadow-red-100">
                                <XCircle className="w-12 h-12 text-red-500" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Transmission <span className="text-red-600">Failed</span></h1>
                                <p className="text-red-500 font-medium">{message}</p>
                            </div>
                            <button 
                                onClick={() => window.location.reload()}
                                className="w-full mt-6 h-14 bg-red-50 text-red-600 border border-red-100 rounded-2xl hover:bg-red-100 transition-all font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                            >
                                <Zap className="w-4 h-4" /> Retry Connection
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
