import React from "react";
import { EDITING_STYLES, type EditingStyle } from "@alpha-cut/types";
import { Film01Icon, SmartPhone01Icon, ComputerIcon, Megaphone01Icon, BookOpen01Icon } from "hugeicons-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from "@alpha-cut/ui";

const styleIcons: Record<EditingStyle, React.ReactNode> = {
  viral_animation: <Megaphone01Icon className="h-6 w-6 text-brand-brown dark:text-brand-terracotta" />,
  cinematic_short: <Film01Icon className="h-6 w-6 text-brand-brown dark:text-brand-terracotta" />,
  saas_animation: <ComputerIcon className="h-6 w-6 text-brand-brown dark:text-brand-terracotta" />,
  hook_talking_head: <SmartPhone01Icon className="h-6 w-6 text-brand-brown dark:text-brand-terracotta" />,
  storytelling_explainer: <BookOpen01Icon className="h-6 w-6 text-brand-brown dark:text-brand-terracotta" />,
};

export function StylesSection() {
  const stylesList = Object.values(EDITING_STYLES);

  return (
    <section id="services" className="py-24 bg-black/[0.02] dark:bg-white/[0.01] border-y border-[#E5E5EA] dark:border-[#33302C]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="secondary" className="mb-3">
            Signature Capabilities
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#181818] dark:text-[#F5F3EC]">
            Crafted for the algorithm. Engineered for retention.
          </h2>
          <p className="mt-4 text-sm text-[#868686] dark:text-[#8C8A89]">
            Every cut follows an intentional pacing blueprint tailored to your content format, whether it's a 30-second kinetic Reel or a 45-minute podcast episode.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stylesList.map((style) => (
            <Card key={style.key} className="flex flex-col justify-between hover:border-brand-brown/40 dark:hover:border-brand-terracotta/40 transition-all duration-200">
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <div className="h-12 w-12 rounded-2xl bg-black/5 dark:bg-white/5 flex items-center justify-center">
                    {styleIcons[style.key]}
                  </div>
                  <div className="flex gap-1.5">
                    {style.formats.map((fmt) => (
                      <span
                        key={fmt}
                        className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#FBEFE1] text-[#451D13] dark:bg-[#754637] dark:text-[#FBEFE1]"
                      >
                        {fmt === "short_form" ? "9:16 Short" : "16:9 Long"}
                      </span>
                    ))}
                  </div>
                </div>
                <CardTitle className="text-xl">{style.label}</CardTitle>
                <CardDescription className="text-sm mt-2 text-[#868686] dark:text-[#8C8A89]">
                  {style.tagline}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="border-t border-[#E5E5EA] dark:border-[#33302C] pt-4 mt-2">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-[#868686] dark:text-[#8C8A89] block mb-1">
                    Best Applied To:
                  </span>
                  <p className="text-xs font-medium text-[#181818] dark:text-[#F5F3EC]">
                    {style.bestFor}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

