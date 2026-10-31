import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Menu01Icon, Cancel01Icon, ArrowRight01Icon } from "hugeicons-react";
import { Button } from "@alpha-cut/ui";
import { ThemeToggle } from "./ThemeToggle.js";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[#F5F5F7]/85 dark:bg-[#161412]/85 border-b border-[#E5E5EA]/80 dark:border-[#33302C]/80 transition-colors">
      <div className="max-w-7xl mx-auto px-6 h-16 sm:h-[68px] flex items-center justify-between">
        {/* Brand Logo & Wordmark */}
        <Link to="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="h-9 w-9 rounded-xl bg-brand-brown dark:bg-brand-terracotta flex items-center justify-center text-brand-cream dark:text-[#161412] font-black text-sm tracking-tight shadow-sm ring-1 ring-black/5 dark:ring-white/10 group-hover:scale-105 transition-transform duration-200">
            A
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-[15px] sm:text-base tracking-tight text-[#181818] dark:text-[#F5F3EC] leading-none">
              ALPHA CUT
            </span>
            <span className="text-[9px] uppercase font-bold tracking-[0.18em] text-[#868686] dark:text-[#8C8A89] mt-0.5">
              Video Editing Agency
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 text-[13px] font-semibold text-[#636366] dark:text-[#A1A1A6]">
          <a
            href="#services"
            className="px-3.5 py-1.5 rounded-lg hover:text-[#181818] dark:hover:text-[#FFFFFF] hover:bg-black/5 dark:hover:bg-white/5 transition-all"
          >
            Styles
          </a>
          <a
            href="#portfolio"
            className="px-3.5 py-1.5 rounded-lg hover:text-[#181818] dark:hover:text-[#FFFFFF] hover:bg-black/5 dark:hover:bg-white/5 transition-all"
          >
            Portfolio
          </a>
          <a
            href="#packages"
            className="px-3.5 py-1.5 rounded-lg hover:text-[#181818] dark:hover:text-[#FFFFFF] hover:bg-black/5 dark:hover:bg-white/5 transition-all"
          >
            Packages
          </a>
          <a
            href="#founders"
            className="px-3.5 py-1.5 rounded-lg hover:text-[#181818] dark:hover:text-[#FFFFFF] hover:bg-black/5 dark:hover:bg-white/5 transition-all"
          >
            Founders
          </a>
        </nav>

        {/* Action CTAs */}
        <div className="hidden md:flex items-center gap-2.5">
          <ThemeToggle />
          <Link to="/login" className="shrink-0 inline-block">
            <Button variant="ghost" size="sm" className="text-[13px] px-3.5">
              Sign In
            </Button>
          </Link>
          <a href="#inquiry" className="shrink-0 inline-block">
            <Button variant="primary" size="sm" className="text-xs font-bold gap-1.5 px-4 shadow-sm hover:shadow">
              <span>Start Project</span>
              <ArrowRight01Icon className="h-3.5 w-3.5" />
            </Button>
          </a>
        </div>

        {/* Mobile menu trigger */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <button
            aria-label="Toggle Navigation Menu"
            className="h-9 w-9 rounded-xl border border-[#E5E5EA] dark:border-[#33302C] bg-white dark:bg-[#1E1C1A] text-[#181818] dark:text-[#F5F3EC] flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors focus:outline-none"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <Cancel01Icon className="h-5 w-5" /> : <Menu01Icon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#E5E5EA] dark:border-[#33302C] bg-white/95 dark:bg-[#1C1A18]/95 backdrop-blur-xl px-6 py-5 space-y-4 shadow-xl animate-fade-in">
          <nav className="flex flex-col space-y-1 text-sm font-semibold text-[#636366] dark:text-[#A1A1A6]">
            <a
              href="#services"
              className="px-3 py-2 rounded-lg hover:text-[#181818] dark:hover:text-[#F5F3EC] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Styles & Services
            </a>
            <a
              href="#portfolio"
              className="px-3 py-2 rounded-lg hover:text-[#181818] dark:hover:text-[#F5F3EC] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Portfolio Showcase
            </a>
            <a
              href="#packages"
              className="px-3 py-2 rounded-lg hover:text-[#181818] dark:hover:text-[#F5F3EC] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Pricing & Packages
            </a>
            <a
              href="#founders"
              className="px-3 py-2 rounded-lg hover:text-[#181818] dark:hover:text-[#F5F3EC] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              About Founders
            </a>
          </nav>
          <div className="pt-3 border-t border-[#E5E5EA] dark:border-[#33302C] flex flex-col gap-2.5">
            <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="w-full">
              <Button variant="outline" size="sm" className="w-full">
                Sign In to Portal
              </Button>
            </Link>
            <a href="#inquiry" onClick={() => setMobileMenuOpen(false)} className="w-full">
              <Button variant="primary" size="sm" className="w-full">
                Start a Project
              </Button>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}

