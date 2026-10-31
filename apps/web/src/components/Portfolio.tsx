import React, { useState } from "react";
import { PlayIcon, FilterIcon } from "hugeicons-react";
import { Card, Badge, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@alpha-cut/ui";
import type { VideoFormat, EditingStyle } from "@alpha-cut/types";

interface PortfolioItem {
  id: string;
  title: string;
  format: VideoFormat;
  style: EditingStyle;
  styleLabel: string;
  duration: string;
  thumbnail: string;
  videoUrl: string;
  description: string;
}

const PORTFOLIO_ITEMS: PortfolioItem[] = [
  {
    id: "cut-1",
    title: "Stop Wasting 4 Hours Every Day",
    format: "short_form",
    style: "hook_talking_head",
    styleLabel: "Hook-Driven Talking-Head",
    duration: "0:48",
    thumbnail: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=800&q=80",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    description: "Fast-paced vertical cut with multi-hook testing variants, kinetic sound design, and pattern interrupts.",
  },
  {
    id: "cut-2",
    title: "Deep Work Mastery & Focus Systems",
    format: "short_form",
    style: "storytelling_explainer",
    styleLabel: "Storytelling & Explainer",
    duration: "1:15",
    thumbnail: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    description: "Calm narrative pacing layering custom motion graphics, book highlights, and atmospheric audio.",
  },
  {
    id: "cut-3",
    title: "The AI Revolution in 60 Seconds",
    format: "short_form",
    style: "viral_animation",
    styleLabel: "Viral Animation Breakdown",
    duration: "0:59",
    thumbnail: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    description: "High-density kinetic text overlays, fast-cut b-roll, and retention markers engineered for TikTok.",
  },
  {
    id: "cut-4",
    title: "Founder Journey: The Hard Things",
    format: "long_form",
    style: "cinematic_short",
    styleLabel: "Cinematic Short-Film",
    duration: "12:40",
    thumbnail: "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=800&q=80",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    description: "Film-grade color grading, deep sonic landscape, and deliberate cinematic framing.",
  },
  {
    id: "cut-5",
    title: "SaaS Workflow Engine Launch",
    format: "long_form",
    style: "saas_animation",
    styleLabel: "SaaS Animations",
    duration: "4:20",
    thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    description: "High-fidelity UI breakdowns, smooth mockups, feature callouts, and clean vector transitions.",
  },
  {
    id: "cut-6",
    title: "The Art of Creative Execution",
    format: "long_form",
    style: "storytelling_explainer",
    styleLabel: "Storytelling & Explainer",
    duration: "24:15",
    thumbnail: "https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=800&q=80",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    description: "Full-length podcast cut structured for maximum watch time, multi-camera switching, and clear chapters.",
  },
];

export function Portfolio() {
  const [formatFilter, setFormatFilter] = useState<string>("all");
  const [styleFilter, setStyleFilter] = useState<string>("all");
  const [activeVideo, setActiveVideo] = useState<PortfolioItem | null>(null);

  const filteredItems = PORTFOLIO_ITEMS.filter((item) => {
    const matchesFormat = formatFilter === "all" || item.format === formatFilter;
    const matchesStyle = styleFilter === "all" || item.style === styleFilter;
    return matchesFormat && matchesStyle;
  });

  return (
    <section id="portfolio" className="py-24 max-w-7xl mx-auto px-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <Badge variant="secondary" className="mb-3">
            Portfolio Showcase
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#181818] dark:text-[#F5F3EC]">
            Recent Agency Deliverables
          </h2>
          <p className="mt-3 text-sm text-[#868686] dark:text-[#8C8A89] max-w-xl">
            Filter our work by format and editing approach. Every frame engineered for retention and platform conversion.
          </p>
        </div>

        {/* Format Filter Switcher */}
        <div className="flex p-1 bg-black/5 dark:bg-white/5 rounded-2xl border border-[#E5E5EA] dark:border-[#33302C] self-start md:self-auto">
          <button
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              formatFilter === "all"
                ? "bg-white dark:bg-[#252321] text-[#181818] dark:text-[#F5F3EC] shadow-sm"
                : "text-[#868686] dark:text-[#8C8A89] hover:text-[#181818]"
            }`}
            onClick={() => setFormatFilter("all")}
          >
            All Formats
          </button>
          <button
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              formatFilter === "short_form"
                ? "bg-white dark:bg-[#252321] text-[#181818] dark:text-[#F5F3EC] shadow-sm"
                : "text-[#868686] dark:text-[#8C8A89] hover:text-[#181818]"
            }`}
            onClick={() => setFormatFilter("short_form")}
          >
            9:16 Short-Form
          </button>
          <button
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              formatFilter === "long_form"
                ? "bg-white dark:bg-[#252321] text-[#181818] dark:text-[#F5F3EC] shadow-sm"
                : "text-[#868686] dark:text-[#8C8A89] hover:text-[#181818]"
            }`}
            onClick={() => setFormatFilter("long_form")}
          >
            16:9 Long-Form
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <Card
            key={item.id}
            className="group overflow-hidden cursor-pointer hover:border-brand-brown/40 dark:hover:border-brand-terracotta/40 transition-all duration-200"
            onClick={() => setActiveVideo(item)}
          >
            {/* Thumbnail Box */}
            <div className="relative aspect-video overflow-hidden bg-black/10">
              <img
                src={item.thumbnail}
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <div className="h-12 w-12 rounded-full bg-brand-brown/90 dark:bg-brand-terracotta/90 text-brand-cream dark:text-[#161412] flex items-center justify-center transform group-hover:scale-110 transition-transform shadow-lg">
                  <PlayIcon className="h-5 w-5 ml-0.5" />
                </div>
              </div>
              <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-md bg-black/75 text-white text-[10px] font-bold tracking-wider">
                {item.duration}
              </div>
            </div>

            {/* Content Details */}
            <div className="p-6">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-brown dark:text-brand-terracotta">
                  {item.styleLabel}
                </span>
                <span className="text-[10px] font-bold text-[#868686] dark:text-[#8C8A89]">
                  {item.format === "short_form" ? "9:16 Vertical" : "16:9 Widescreen"}
                </span>
              </div>
              <h3 className="font-bold text-base text-[#181818] dark:text-[#F5F3EC] group-hover:text-brand-brown dark:group-hover:text-brand-terracotta transition-colors line-clamp-1">
                {item.title}
              </h3>
              <p className="mt-1 text-xs text-[#868686] dark:text-[#8C8A89] line-clamp-2">
                {item.description}
              </p>
            </div>
          </Card>
        ))}
      </div>

      {/* Video Modal Player */}
      {activeVideo && (
        <Dialog open={!!activeVideo} onOpenChange={() => setActiveVideo(null)}>
          <DialogContent className="max-w-3xl p-0 overflow-hidden bg-black border-neutral-800">
            <div className="relative aspect-video w-full bg-black">
              <video
                src={activeVideo.videoUrl}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>
            <div className="p-6 bg-white dark:bg-[#252321]">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary">{activeVideo.styleLabel}</Badge>
                <span className="text-xs text-[#868686] dark:text-[#8C8A89]">{activeVideo.duration}</span>
              </div>
              <DialogTitle className="text-xl mt-2">{activeVideo.title}</DialogTitle>
              <DialogDescription className="mt-2 text-sm">
                {activeVideo.description}
              </DialogDescription>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </section>
  );
}

