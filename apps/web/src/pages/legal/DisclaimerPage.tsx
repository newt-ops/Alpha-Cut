import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft01Icon } from "hugeicons-react";
import { Button } from "@alpha-cut/ui";

export function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-surface-lightBg dark:bg-surface-darkBg py-16 px-6">
      <div className="max-w-3xl mx-auto bg-white dark:bg-[#252321] rounded-[24px] border border-[#E5E5EA] dark:border-[#33302C] p-8 md:p-12">
        <Link to="/" className="inline-block mb-8">
          <Button variant="ghost" size="sm" className="gap-2 -ml-3">
            <ArrowLeft01Icon className="h-4 w-4" />
            <span>Back to Home</span>
          </Button>
        </Link>

        <h1 className="text-3xl font-extrabold text-[#181818] dark:text-[#F5F3EC]">
          Disclaimer
        </h1>
        <p className="mt-2 text-xs text-[#868686] dark:text-[#8C8A89]">
          Last Updated: October 2026 &bull; Alpha Cut Video Editing Agency
        </p>

        <div className="mt-8 space-y-6 text-xs sm:text-sm text-[#404040] dark:text-[#D1D1D1] leading-relaxed">
          <section>
            <h2 className="text-base font-bold text-[#181818] dark:text-[#F5F3EC] mb-2">
              1. Performance & Viewership Metrics
            </h2>
            <p>
              While Alpha Cut engineers edits for retention, hook performance, and watch time based on proven editing methodologies, we do not guarantee specific viral viewership numbers, algorithmic reach, follower increases, or sales conversions. Content performance is influenced by external variables including platform distribution algorithms, account standing, creator presentation, and market trends.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#181818] dark:text-[#F5F3EC] mb-2">
              2. Portfolio Representations
            </h2>
            <p>
              Portfolio items showcased on this website represent actual projects, client cuts, or sample editorial styles produced by Amir and Aymen. Metrics, engagement highlights, or past viewership stats associated with featured projects reflect specific campaign conditions and should not be viewed as guaranteed benchmarks.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#181818] dark:text-[#F5F3EC] mb-2">
              3. Third-Party Platforms
            </h2>
            <p>
              Alpha Cut is an independent video editing agency. We are not officially affiliated with, endorsed by, or sponsored by YouTube, TikTok, Meta (Instagram), Telegram, Frame.io, or Google. References to these platforms describe editorial formatting and delivery integration.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

