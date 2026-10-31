import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Menu01Icon, Cancel01Icon, ArrowRight01Icon } from "hugeicons-react";
import { Button } from "@alpha-cut/ui";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#F5F5F7]/80 dark:bg-[#161412]/80 border-b border-[#E5E5EA] dark:border-[#33302C] transition-colors">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Brand Logo & Wordmark */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="h-10 w-10 rounded-2xl bg-brand-brown dark:bg-brand-terracotta flex items-center justify-center text-brand-cream dark:text-[#161412] font-black text-lg transition-transform group-hover:scale-105">
            A
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-lg tracking-tight text-[#181818] dark:text-[#F5F3EC]">
              ALPHA CUT
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#868686] dark:text-[#8C8A89] -mt-1">
              Video Editing Agency
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-[#868686] dark:text-[#8C8A89]">
          <a href="#services" className="hover:text-[#181818] dark:hover:text-[#F5F3EC] transition-colors">
            Styles
          </a>
          <a href="#portfolio" className="hover:text-[#181818] dark:hover:text-[#F5F3EC] transition-colors">
            Portfolio
          </a>
          <a href="#packages" className="hover:text-[#181818] dark:hover:text-[#F5F3EC] transition-colors">
            Packages
          </a>
          <a href="#founders" className="hover:text-[#181818] dark:hover:text-[#F5F3EC] transition-colors">
            Founders
          </a>
        </nav>

        {/* Action CTAs */}
        <div className="hidden md:flex items-center gap-4">
          <Link to="/login">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
          </Link>
          <a href="#inquiry">
            <Button variant="primary" size="sm">
              <span>Start Project</span>
              <ArrowRight01Icon className="h-4 w-4 ml-1" />
            </Button>
          </a>
        </div>

        {/* Mobile menu trigger */}
        <button
          className="md:hidden p-2 rounded-xl text-[#181818] dark:text-[#F5F3EC] hover:bg-black/5 dark:hover:bg-white/5"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <Cancel01Icon className="h-6 w-6" /> : <Menu01Icon className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#E5E5EA] dark:border-[#33302C] bg-white dark:bg-[#252321] px-6 py-6 space-y-4">
          <nav className="flex flex-col space-y-3 text-sm font-semibold text-[#868686] dark:text-[#8C8A89]">
            <a
              href="#services"
              className="py-1 hover:text-[#181818] dark:hover:text-[#F5F3EC]"
              onClick={() => setMobileMenuOpen(false)}
            >
              Styles & Services
            </a>
            <a
              href="#portfolio"
              className="py-1 hover:text-[#181818] dark:hover:text-[#F5F3EC]"
              onClick={() => setMobileMenuOpen(false)}
            >
              Portfolio Showcase
            </a>
            <a
              href="#packages"
              className="py-1 hover:text-[#181818] dark:hover:text-[#F5F3EC]"
              onClick={() => setMobileMenuOpen(false)}
            >
              Pricing & Packages
            </a>
            <a
              href="#founders"
              className="py-1 hover:text-[#181818] dark:hover:text-[#F5F3EC]"
              onClick={() => setMobileMenuOpen(false)}
            >
              About Founders
            </a>
          </nav>
          <div className="pt-4 border-t border-[#E5E5EA] dark:border-[#33302C] flex flex-col gap-3">
            <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="outline" className="w-full">
                Sign In to Portal
              </Button>
            </Link>
            <a href="#inquiry" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="primary" className="w-full">
                Start a Project
              </Button>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}

