import { cn } from "@/lib/utils";
import { forwardRef } from "react";

const Button = forwardRef(({ className, variant = "primary", size = "md", ...props }, ref) => {
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-md transform active:scale-95",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300 transform active:scale-95",
    outline: "border-2 border-blue-600 text-blue-600 hover:bg-blue-50 transform active:scale-95",
    ghost: "text-gray-600 hover:bg-gray-100 transform active:scale-95",
    danger: "bg-red-600 text-white hover:bg-red-700 shadow-md transform active:scale-95",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2",
    lg: "px-6 py-3 text-lg font-semibold",
  };

  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
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
