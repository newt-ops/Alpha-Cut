import React from "react";
import { UserIcon, CodeCircleIcon, Video01Icon } from "hugeicons-react";
import { Card, Badge } from "@alpha-cut/ui";

export function Founders() {
  return (
    <section id="founders" className="py-24 max-w-7xl mx-auto px-6">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <Badge variant="secondary" className="mb-3">
          Behind Alpha Cut
        </Badge>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#181818] dark:text-[#F5F3EC]">
          No account managers. No middle layers.
        </h2>
        <p className="mt-4 text-sm text-[#868686] dark:text-[#8C8A89]">
          Every client works directly with the two people actually cutting the footage and engineering the systems.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Amir */}
        <Card className="overflow-hidden border border-[#E5E5EA] dark:border-[#33302C]">
          <div className="aspect-[4/3] bg-black/10 overflow-hidden relative">
            <img
              src="/amir-portrait.jpg"
              alt="Amir — Lead Video Editor"
              className="w-full h-full object-cover object-top"
            />
            <div className="absolute bottom-3 left-3">
              <Badge variant="default" className="gap-1 shadow-md">
                <Video01Icon className="h-3 w-3" />
                <span>Lead Video Editor</span>
              </Badge>
            </div>
          </div>
          <div className="p-6">
            <h3 className="text-xl font-bold text-[#181818] dark:text-[#F5F3EC]">Amir</h3>
            <p className="text-xs font-semibold text-brand-brown dark:text-brand-terracotta mt-0.5">
              Co-Founder & Creative Lead
            </p>
            <p className="mt-4 text-xs leading-relaxed text-[#868686] dark:text-[#8C8A89]">
              Specialist in visual rhythm, pattern interrupts, and retention engineering. Amir leads editorial direction, soundscapes, and color grading across high-performing social and long-form formats.
            </p>
          </div>
        </Card>

        {/* Aymen */}
        <Card className="overflow-hidden border border-[#E5E5EA] dark:border-[#33302C]">
          <div className="aspect-[4/3] bg-black/10 overflow-hidden relative">
            <img
              src="/aymen-portrait.jpg"
              alt="Aymen — Full-Stack Developer & Video Editor"
              className="w-full h-full object-cover object-top"
            />
            <div className="absolute bottom-3 left-3">
              <Badge variant="default" className="gap-1 shadow-md">
                <CodeCircleIcon className="h-3 w-3" />
                <span>Full-Stack Dev & Video Editor</span>
              </Badge>
            </div>
          </div>
          <div className="p-6">
            <h3 className="text-xl font-bold text-[#181818] dark:text-[#F5F3EC]">Aymen</h3>
            <p className="text-xs font-semibold text-brand-brown dark:text-brand-terracotta mt-0.5">
              Co-Founder & Technical Architect
            </p>
            <p className="mt-4 text-xs leading-relaxed text-[#868686] dark:text-[#8C8A89]">
              Full-stack developer and motion design editor. Aymen built the Alpha Cut multi-platform client infrastructure and specializes in SaaS motion graphics, kinetic animation, and delivery automation.
            </p>
          </div>
        </Card>
      </div>
    </section>
  );
}
