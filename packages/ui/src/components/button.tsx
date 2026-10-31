import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { Loading03Icon } from "hugeicons-react";
import { cn } from "../utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      asChild = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";

    const baseStyles =
      "inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-brown focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] select-none";

    const variants = {
      primary:
        "bg-brand-brown text-brand-cream hover:opacity-95 dark:bg-brand-terracotta dark:text-[#161412] shadow-none",
      secondary:
        "bg-brand-cream text-brand-brown hover:bg-[#F3E3D0] dark:bg-brand-darkbrown dark:text-brand-cream shadow-none",
      outline:
        "border border-[#E5E5EA] dark:border-[#33302C] bg-transparent text-[#181818] dark:text-[#F5F3EC] hover:bg-black/5 dark:hover:bg-white/5",
      ghost:
        "bg-transparent text-[#181818] dark:text-[#F5F3EC] hover:bg-black/5 dark:hover:bg-white/5",
      destructive:
        "bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800",
    };

    const sizes = {
      sm: "h-10 px-4 text-xs rounded-xl",
      md: "h-11 px-5 text-sm rounded-xl",
      lg: "h-14 px-8 text-base rounded-2xl",
      icon: "h-10 w-10 shrink-0 rounded-xl",
    };

    return (
      <Comp
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <Loading03Icon className="h-4 w-4 animate-spin" />
            <span>{children}</span>
          </span>
        ) : (
          children
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";

