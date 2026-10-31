import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft01Icon } from "hugeicons-react";
import { Button } from "@alpha-cut/ui";

export function TermsPage() {
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
          Terms of Service
        </h1>
        <p className="mt-2 text-xs text-[#868686] dark:text-[#8C8A89]">
          Last Updated: October 2026 &bull; Alpha Cut Video Editing Agency
        </p>

        <div className="mt-8 space-y-6 text-xs sm:text-sm text-[#404040] dark:text-[#D1D1D1] leading-relaxed">
          <section>
            <h2 className="text-base font-bold text-[#181818] dark:text-[#F5F3EC] mb-2">
              1. Engagement & Service Scope
            </h2>
            <p>
              Alpha Cut provides professional video editing services across short-form (9:16) and long-form (16:9) formats. All work is executed in accordance with the specific package tier, style, delivery deadline, and price quoted in the agreed proposal.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#181818] dark:text-[#F5F3EC] mb-2">
              2. Revisions & Out-of-Scope Work
            </h2>
            <p>
              Each project proposal specifies an exact included revision allowance (typically 1 to 3 rounds depending on scope). Revisions must align with the original brief. Requests that introduce new footage, radical narrative direction shifts, or exceed the agreed revision allowance will be quoted as an out-of-scope addition.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#181818] dark:text-[#F5F3EC] mb-2">
              3. Payments & Deliverables
            </h2>
            <p>
              Alpha Cut confirms payments manually into the agency ledger. Depending on the agreed scope, projects may require an upfront deposit or retainer settlement prior to high-resolution master asset delivery.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#181818] dark:text-[#F5F3EC] mb-2">
              4. Intellectual Property & Portfolio Rights
            </h2>
            <p>
              Upon full settlement of all outstanding invoices, the client receives full commercial rights to the final rendered video deliverables. Alpha Cut reserves the right to showcase approved video cuts, excerpt snippets, and client feedback in our marketing portfolio and agency case studies unless an explicit non-disclosure agreement (NDA) has been signed in advance.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#181818] dark:text-[#F5F3EC] mb-2">
              5. Contact Information
            </h2>
            <p>
              For contractual or scope questions, contact:
            </p>
            <p className="mt-2 font-semibold text-[#181818] dark:text-[#F5F3EC]">
              Alpha Cut Video Editing Agency<br />
              Email: alphacutagency@gmail.com
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

