import React from "react";
import { CheckmarkCircle02Icon, ArrowRight01Icon, SparklesIcon } from "hugeicons-react";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Badge } from "@alpha-cut/ui";

const TIERS = [
  {
    key: "basic",
    name: "Basic Tier",
    tagline: "Essential retention-first cutting for straightforward content.",
    revisions: "1 Revision Round Included",
    features: [
      "Dynamic captions & kinetic text",
      "Standard b-roll selection & sync",
      "Clean audio cleanup & dialogue level mix",
      "Basic color correction",
      "Export in platform-optimal vertical/horizontal formats",
      "48-hour delivery SLA",
    ],
    popular: false,
  },
  {
    key: "professional",
    name: "Professional Tier",
    tagline: "Engineered for maximum retention, pattern interrupts, and viral hooks.",
    revisions: "2 Revision Rounds Included",
    features: [
      "High-energy opening hook testing variants",
      "Multi-layered custom sound effects & sonic design",
      "Custom vector motion graphics & callouts",
      "Curated high-grade b-roll & punch zooms",
      "Studio color grading & skin tone enhancement",
      "Direct revision feedback in Client Portal & Telegram",
      "24 to 48-hour delivery SLA",
    ],
    popular: true,
  },
  {
    key: "premium",
    name: "Premium Tier",
    tagline: "Full-scale boutique production for high-stakes brand films & flagship creators.",
    revisions: "3 Revision Rounds Included",
    features: [
      "Bespoke 2D/3D kinetic animation breakdowns",
      "Film-grade color grading & cinematic LUT treatment",
      "Complex sound design & custom music sync",
      "Thumbnails & teaser variants included",
      "Priority VIP turnaround (< 24 hours available)",
      "Dedicated retainer delivery queue",
      "Direct phone/Telegram consultation with Amir & Aymen",
    ],
    popular: false,
  },
];

export function Pricing() {
  return (
    <section id="packages" className="py-24 bg-black/[0.02] dark:bg-white/[0.01] border-y border-[#E5E5EA] dark:border-[#33302C]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="secondary" className="mb-3">
            Engagement Tiers
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#181818] dark:text-[#F5F3EC]">
            Predictable scope. Zero ambiguity.
          </h2>
          <p className="mt-4 text-sm text-[#868686] dark:text-[#8C8A89]">
            We quote each project transparently before starting. Available for single one-off edits or weekly retainers with guaranteed turnaround.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {TIERS.map((tier) => (
            <Card
              key={tier.key}
              className={`flex flex-col justify-between relative ${
                tier.popular
                  ? "border-2 border-brand-brown dark:border-brand-terracotta shadow-md"
                  : "border border-[#E5E5EA] dark:border-[#33302C]"
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <Badge variant="default" className="gap-1 shadow-sm px-3 py-1">
                    <SparklesIcon className="h-3 w-3" />
                    <span>Most Requested</span>
                  </Badge>
                </div>
              )}

              <CardHeader className={tier.popular ? "pt-8" : ""}>
                <CardTitle className="text-2xl">{tier.name}</CardTitle>
                <CardDescription className="text-xs mt-2 text-[#868686] dark:text-[#8C8A89] min-h-[32px]">
                  {tier.tagline}
                </CardDescription>
                <div className="mt-4 pt-4 border-t border-[#E5E5EA] dark:border-[#33302C]">
                  <span className="text-xs font-bold text-brand-brown dark:text-brand-terracotta">
                    {tier.revisions}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 flex-1">
                <span className="text-[11px] uppercase tracking-wider font-bold text-[#868686] dark:text-[#8C8A89] block mb-2">
                  What's Included:
                </span>
                <ul className="space-y-2.5">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs text-[#181818] dark:text-[#F5F3EC]">
                      <CheckmarkCircle02Icon className="h-4 w-4 text-brand-brown dark:text-brand-terracotta shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="pt-6 border-t border-[#E5E5EA] dark:border-[#33302C]">
                <a href="#inquiry" className="w-full">
                  <Button
                    variant={tier.popular ? "primary" : "outline"}
                    className="w-full justify-between"
                  >
                    <span>Get a Quote for {tier.name}</span>
                    <ArrowRight01Icon className="h-4 w-4" />
                  </Button>
                </a>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

