import React from "react";
import { Link } from "react-router-dom";
import { Mail01Icon } from "hugeicons-react";

export function Footer() {
  return (
    <footer className="border-t border-[#E5E5EA] dark:border-[#33302C] bg-white dark:bg-[#161412] text-[#868686] dark:text-[#8C8A89] py-16">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Brand Info */}
        <div className="space-y-4 md:col-span-2">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-brand-brown dark:bg-brand-terracotta flex items-center justify-center text-brand-cream dark:text-[#161412] font-black text-sm">
              A
            </div>
            <span className="font-extrabold text-base tracking-tight text-[#181818] dark:text-[#F5F3EC]">
              ALPHA CUT
            </span>
          </div>
          <p className="text-xs max-w-sm leading-relaxed">
            Boutique video editing agency engineered for retention, watch time, and conversion. Founded and operated directly by Amir and Aymen.
          </p>
          <div className="flex items-center gap-2 text-xs text-[#181818] dark:text-[#F5F3EC]">
            <Mail01Icon className="h-4 w-4 text-brand-brown dark:text-brand-terracotta" />
            <a href="mailto:alphacutagency@gmail.com" className="hover:underline">
              alphacutagency@gmail.com
            </a>
          </div>
        </div>

        {/* Navigation */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#181818] dark:text-[#F5F3EC]">
            Navigation
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <a href="#services" className="hover:text-[#181818] dark:hover:text-[#F5F3EC] transition-colors">
                Signature Styles
              </a>
            </li>
            <li>
              <a href="#portfolio" className="hover:text-[#181818] dark:hover:text-[#F5F3EC] transition-colors">
                Portfolio Showcase
              </a>
            </li>
            <li>
              <a href="#packages" className="hover:text-[#181818] dark:hover:text-[#F5F3EC] transition-colors">
                Pricing & Tiers
              </a>
            </li>
            <li>
              <a href="#founders" className="hover:text-[#181818] dark:hover:text-[#F5F3EC] transition-colors">
                About Founders
              </a>
            </li>
            <li>
              <Link to="/login" className="hover:text-[#181818] dark:hover:text-[#F5F3EC] transition-colors">
                Client Portal Sign In
              </Link>
            </li>
          </ul>
        </div>

        {/* Legal & Compliance (Mandatory Pages) */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#181818] dark:text-[#F5F3EC]">
            Legal & Compliance
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <Link to="/privacy" className="hover:text-[#181818] dark:hover:text-[#F5F3EC] transition-colors">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link to="/terms" className="hover:text-[#181818] dark:hover:text-[#F5F3EC] transition-colors">
                Terms of Service
              </Link>
            </li>
            <li>
              <Link to="/disclaimer" className="hover:text-[#181818] dark:hover:text-[#F5F3EC] transition-colors">
                Disclaimer
              </Link>
            </li>
            <li>
              <Link to="/cookies" className="hover:text-[#181818] dark:hover:text-[#F5F3EC] transition-colors">
                Cookie Policy
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-12 pt-6 border-t border-[#E5E5EA] dark:border-[#33302C] flex flex-col sm:flex-row items-center justify-between text-xs text-[#868686] dark:text-[#8C8A89] gap-4">
        <p>&copy; {new Date().getFullYear()} Alpha Cut Video Editing Agency. All rights reserved.</p>
        <p>Built with precision &bull; Telegram: @alpha_cut_bot</p>
      </div>
    </footer>
  );
}
