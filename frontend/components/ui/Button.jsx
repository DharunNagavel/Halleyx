import { cn } from "@/lib/utils";
import { forwardRef } from "react";

const Button = forwardRef(({ className, variant = "primary", size = "md", ...props }, ref) => {
  const variants = {
    primary: "bg-emerald-500 text-black hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transform active:scale-95 font-black uppercase tracking-wider",
    secondary: "bg-black text-white hover:bg-zinc-900 transform active:scale-95 font-black uppercase tracking-wider",
    outline: "border-2 border-emerald-500 text-emerald-500 hover:bg-emerald-500/10 transform active:scale-95",
    ghost: "text-zinc-600 hover:bg-zinc-100 transform active:scale-95",
    danger: "bg-rose-500 text-white hover:bg-rose-600 shadow-md transform active:scale-95",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-[10px]",
    md: "px-5 py-2.5 text-xs",
    lg: "px-8 py-4 text-sm font-black",
  };

  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-xl font-bold transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
});

Button.displayName = "Button";

export { Button };
