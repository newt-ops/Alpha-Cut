import React from "react";
import { Sun01Icon, Moon02Icon } from "hugeicons-react";
import { useTheme } from "../context/ThemeContext.js";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className = "", showLabel = false }: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`inline-flex items-center justify-center shrink-0 ${showLabel ? "h-10 px-4 gap-2" : "h-10 w-10"} rounded-xl border border-[#E5E5EA] dark:border-[#33302C] bg-white dark:bg-[#1E1C1A] text-[#181818] dark:text-[#F5F3EC] hover:bg-black/5 dark:hover:bg-white/5 hover:border-brand-brown/40 dark:hover:border-brand-terracotta/40 transition-all active:scale-95 focus:outline-none focus:ring-1 focus:ring-brand-brown dark:focus:ring-brand-terracotta ${className}`}
    >
      <div className="relative h-4 w-4 flex items-center justify-center">
        {isDark ? (
          <Sun01Icon className="h-4 w-4 text-amber-400 transition-transform duration-200 rotate-0" />
        ) : (
          <Moon02Icon className="h-4 w-4 text-brand-brown transition-transform duration-200 rotate-0" />
        )}
      </div>

      {showLabel && (
        <span className="text-xs font-semibold">
          {isDark ? "Light Mode" : "Dark Mode"}
        </span>
      )}
    </button>
  );
}

