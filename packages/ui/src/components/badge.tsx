import * as React from "react";
import { cn } from "../utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline" | "success" | "warning";
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  const variants = {
    default:
      "bg-brand-brown text-brand-cream dark:bg-brand-terracotta dark:text-[#161412]",
    secondary:
      "bg-[#FBEFE1] text-[#451D13] dark:bg-[#754637] dark:text-[#FBEFE1]",
    outline:
      "border border-[#E5E5EA] dark:border-[#33302C] text-[#181818] dark:text-[#F5F3EC] bg-transparent",
    success:
      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20",
    warning:
      "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

