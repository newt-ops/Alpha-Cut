import * as React from "react";
import { cn } from "../utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          type={type}
          className={cn(
            "flex h-11 w-full rounded-xl border border-[#E5E5EA] dark:border-[#33302C] bg-white dark:bg-[#161412] px-4 py-2 text-sm text-[#181818] dark:text-[#F5F3EC] placeholder:text-[#868686] dark:placeholder:text-[#8C8A89] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-brown dark:focus-visible:ring-brand-terracotta disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-red-500 focus-visible:ring-red-500",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

