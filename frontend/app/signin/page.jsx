"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signinSchema } from "@/lib/schemas";
import { authApi } from "@/lib/api";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { Activity, Zap, ShieldCheck } from "lucide-react";

export default function SigninPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const cardRef = useRef(null);
  const formRef = useRef(null);

  useEffect(() => {
    const tl = gsap.timeline();
    tl.fromTo(cardRef.current, 
      { scale: 0.9, opacity: 0, y: 20 },
      { scale: 1, opacity: 1, y: 0, duration: 0.8, ease: "power4.out" }
    );
    tl.fromTo(formRef.current.children,
      { y: 10, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.4, stagger: 0.1, ease: "power2.out" },
      "-=0.4"
    );
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(signinSchema),
  });

  const onSubmit = async (data) => {
    setLoading(true);
    setError("");
    try {
      const response = await authApi.signin(data);
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        router.push("/dashboard");
      } else {
        setError(response.data.message || "Invalid email or password");
      }
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred during sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4 py-12 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px] opacity-60" />
      <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-[600px] h-[600px] bg-zinc-800/20 rounded-full blur-[120px] opacity-60" />

      <div ref={cardRef} className="w-full max-w-md bg-zinc-950 border border-zinc-800 p-10 rounded-[2.5rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] relative z-10 transition-shadow hover:shadow-[0_40px_80px_-15px_rgba(16,185,129,0.1)]">
        <div className="flex justify-center mb-10">
            <div className="bg-emerald-500 p-4 rounded-2xl shadow-xl shadow-emerald-500/20 group hover:rotate-6 transition-transform">
                <Activity className="h-8 w-8 text-black" />
            </div>
        </div>
        
        <div className="text-center mb-12">
          <h2 className="text-4xl font-black text-white tracking-tighter leading-none mb-3">
            Welcome <span className="text-emerald-500">Back</span>
          </h2>
          <p className="text-zinc-500 font-bold text-xs uppercase tracking-widest">
            Continue your automation journey or{" "}
            <Link href="/signup" className="text-emerald-500 hover:text-emerald-400 font-black underline decoration-emerald-500/20 underline-offset-4 transition-all">
              create account
            </Link>
          </p>
        </div>

        <form className="space-y-8" onSubmit={handleSubmit(onSubmit)} ref={formRef}>
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl animate-in shake duration-500">
              <p className="text-[10px] text-rose-500 font-black uppercase tracking-widest text-center">{error}</p>
            </div>
          )}
          
          <div className="space-y-6">
            <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Identity Mail</label>
                <input
                    type="email"
                    placeholder="operator@engine.io"
                    className="w-full h-14 px-6 rounded-2xl border border-zinc-800 bg-zinc-900 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium"
                    {...register("email")}
                />
                {errors.email && <p className="text-[10px] text-rose-500 font-black uppercase ml-1">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Access Token</label>
                <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full h-14 px-6 rounded-2xl border border-zinc-800 bg-zinc-900 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium"
                    {...register("password")}
                />
                {errors.password && <p className="text-[10px] text-rose-500 font-black uppercase ml-1">{errors.password.message}</p>}
            </div>
          </div>

          <Button type="submit" className="w-full h-16 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm shadow-xl shadow-emerald-500/10 transition-all hover:-translate-y-1 active:scale-[0.98]" disabled={loading}>
            {loading ? (
              <span className="flex items-center justify-center gap-3">
                <div className="animate-spin h-5 w-5 border-2 border-black/30 border-t-black rounded-full"></div>
                Initializing...
              </span>
            ) : "Join the Engine"}
          </Button>
          
          <div className="flex items-center justify-center gap-6 pt-4">
              <div className="flex items-center gap-1.5 opacity-40">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" />
                  <span className="text-[10px] uppercase font-black tracking-widest text-white">Secure Shell</span>
              </div>
              <div className="flex items-center gap-1.5 opacity-40">
                  <Zap className="w-3 h-3 text-emerald-500" />
                  <span className="text-[10px] uppercase font-black tracking-widest text-white">Live Logic</span>
              </div>
          </div>
        </form>
      </div>
    </div>
  );
}

