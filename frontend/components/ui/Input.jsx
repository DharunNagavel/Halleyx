import { cn } from "@/lib/utils";
import { forwardRef } from "react";

const Input = forwardRef(({ className, label, error, ...props }, ref) => {
  return (
    <div className="w-full space-y-1.5">
      {label && <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">{label}</label>}
      <input
        ref={ref}
        className={cn(
          "flex w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/10 focus-visible:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 font-medium",
          error && "border-rose-500 focus-visible:ring-rose-500/10",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs font-medium text-red-500 mt-1">{error}</p>}
    </div>
  );
});

Input.displayName = "Input";

export { Input };
