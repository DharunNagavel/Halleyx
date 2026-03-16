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
                const response = await axios.post(`http://localhost:5000/api/executions/${id}/respond`, {
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
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center animate-in fade-in zoom-in duration-300">
                {status === "processing" && (
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                        <h1 className="text-xl font-bold text-gray-900">Processing your decision...</h1>
                        <p className="text-gray-500 italic">Please wait while we update the workflow.</p>
                    </div>
                )}

                {status === "success" && (
                    <div className="flex flex-col items-center gap-4">
                        <CheckCircle2 className="w-16 h-16 text-green-500" />
                        <h1 className="text-2xl font-bold text-gray-900">Decision Recorded!</h1>
                        <p className="text-gray-600 font-medium">{message}</p>
                        <button 
                            onClick={() => router.push('/dashboard')}
                            className="mt-6 px-6 py-2 bg-gray-900 text-white rounded-xl hover:bg-black transition-all"
                        >
                            Go to Dashboard
                        </button>
                    </div>
                )}

                {status === "error" && (
                    <div className="flex flex-col items-center gap-4">
                        <XCircle className="w-16 h-16 text-red-500" />
                        <h1 className="text-2xl font-bold text-gray-900">Action Failed</h1>
                        <p className="text-red-600">{message}</p>
                        <button 
                            onClick={() => window.location.reload()}
                            className="mt-6 px-6 py-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-all font-bold"
                        >
                            Try Again
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
