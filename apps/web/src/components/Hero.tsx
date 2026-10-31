import React from "react";
import { ArrowRight01Icon, PlayIcon, SparklesIcon, SecurityCheckIcon, Clock01Icon } from "hugeicons-react";
import { Button, Badge } from "@alpha-cut/ui";

export function Hero() {
  return (
    <section className="relative pt-20 pb-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 text-center">
        {/* Top Announcement Badge */}
        <div className="inline-flex items-center gap-2 mb-8 animate-fade-in">
          <Badge variant="secondary" className="px-4 py-1.5 text-xs font-semibold gap-1.5">
            <SparklesIcon className="h-3.5 w-3.5 text-brand-brown dark:text-brand-terracotta" />
            <span>Boutique Video Editing Agency</span>
          </Badge>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-[#181818] dark:text-[#F5F3EC] max-w-4xl mx-auto leading-[1.08]">
          Editing isn't decoration. <br />
          It's why people{" "}
          <span className="text-brand-brown dark:text-brand-terracotta underline decoration-brand-cream dark:decoration-brand-darkbrown decoration-4 underline-offset-8">
            stop scrolling
          </span>
          .
        </h1>

        {/* Subtitle */}
        <p className="mt-8 text-base sm:text-lg md:text-xl text-[#868686] dark:text-[#8C8A89] max-w-2xl mx-auto font-medium leading-relaxed">
          We turn raw footage into high-retention video engineered for hook strength, watch time, and conversion. Hand-cut directly by Amir and Aymen — no account managers, no junior handoffs.
        </p>

        {/* CTA Button Group */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a href="#inquiry" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto px-8 gap-2">
              <span>Submit Your Brief</span>
              <ArrowRight01Icon className="h-4 w-4" />
            </Button>
          </a>
          <a href="#portfolio" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full sm:w-auto px-8 gap-2">
              <PlayIcon className="h-4 w-4" />
              <span>Explore Portfolio</span>
            </Button>
          </a>
        </div>

        {/* Social Proof / Guarantee Strip */}
        <div className="mt-16 pt-10 border-t border-[#E5E5EA] dark:border-[#33302C] grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center text-brand-brown dark:text-brand-terracotta">
              <SecurityCheckIcon className="h-4 w-4" />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-[#181818] dark:text-[#F5F3EC]">Direct Collaboration</p>
              <p className="text-[11px] text-[#868686] dark:text-[#8C8A89]">Work directly with founders Amir & Aymen</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center text-brand-brown dark:text-brand-terracotta">
              <Clock01Icon className="h-4 w-4" />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-[#181818] dark:text-[#F5F3EC]">24h Proposal SLA</p>
              <p className="text-[11px] text-[#868686] dark:text-[#8C8A89]">Guaranteed response & scope breakdown</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center text-brand-brown dark:text-brand-terracotta">
              <SparklesIcon className="h-4 w-4" />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-[#181818] dark:text-[#F5F3EC]">5 Signature Styles</p>
              <p className="text-[11px] text-[#868686] dark:text-[#8C8A89]">Retention-engineered for every format</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

