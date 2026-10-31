import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft01Icon } from "hugeicons-react";
import { Button } from "@alpha-cut/ui";

export function CookiePolicyPage() {
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
          Cookie Policy
        </h1>
        <p className="mt-2 text-xs text-[#868686] dark:text-[#8C8A89]">
          Last Updated: October 2026 &bull; Alpha Cut Video Editing Agency
        </p>

        <div className="mt-8 space-y-6 text-xs sm:text-sm text-[#404040] dark:text-[#D1D1D1] leading-relaxed">
          <section>
            <h2 className="text-base font-bold text-[#181818] dark:text-[#F5F3EC] mb-2">
              1. What Are Cookies?
            </h2>
            <p>
              Cookies are small data files placed on your device by websites you visit. They are used to make web applications function efficiently and maintain authenticated state.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#181818] dark:text-[#F5F3EC] mb-2">
              2. Cookies We Deploy
            </h2>
            <p>
              Alpha Cut strictly uses essential functional cookies necessary for portal operation:
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs border border-[#E5E5EA] dark:border-[#33302C] rounded-xl overflow-hidden">
                <thead className="bg-black/5 dark:bg-white/5">
                  <tr>
                    <th className="p-3 font-bold">Cookie Name</th>
                    <th className="p-3 font-bold">Type</th>
                    <th className="p-3 font-bold">Purpose</th>
                    <th className="p-3 font-bold">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E5EA] dark:divide-[#33302C]">
                  <tr>
                    <td className="p-3 font-mono">token</td>
                    <td className="p-3">Strictly Necessary (HttpOnly)</td>
                    <td className="p-3">Maintains authenticated session state for registered clients and administrators.</td>
                    <td className="p-3">7 Days</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3">
              We do not deploy intrusive third-party cross-site advertising trackers or sell browsing data.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

