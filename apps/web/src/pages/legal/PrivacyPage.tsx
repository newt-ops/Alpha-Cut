import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft01Icon } from "hugeicons-react";
import { Button } from "@alpha-cut/ui";

export function PrivacyPage() {
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
          Privacy Policy
        </h1>
        <p className="mt-2 text-xs text-[#868686] dark:text-[#8C8A89]">
          Last Updated: October 2026 &bull; Alpha Cut Video Editing Agency
        </p>

        <div className="mt-8 space-y-6 text-xs sm:text-sm text-[#404040] dark:text-[#D1D1D1] leading-relaxed">
          <section>
            <h2 className="text-base font-bold text-[#181818] dark:text-[#F5F3EC] mb-2">
              1. Information We Collect
            </h2>
            <p>
              Alpha Cut collects information that you directly provide when submitting an inquiry, registering an account, or communicating with us. This includes:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Contact details: Name, email address, social media handles.</li>
              <li>Telegram credentials: Telegram username and Telegram ID when linking with @alpha_cut_bot.</li>
              <li>Project briefs: Scope description, video formatting choices, footage links (Google Drive, Dropbox, Frame.io).</li>
              <li>Client feedback: Rating scores, testimonials, and revision requests.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#181818] dark:text-[#F5F3EC] mb-2">
              2. How We Use Your Information
            </h2>
            <p>
              We process your data exclusively for operational agency purposes:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Preparing and sending customized project proposals and quotes.</li>
              <li>Executing video editing services and delivering preview cuts.</li>
              <li>Sending automated milestone notifications via Resend and Telegram.</li>
              <li>Maintaining manual invoicing, payment confirmation records, and accounting ledgers.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#181818] dark:text-[#F5F3EC] mb-2">
              3. Data Storage & Third-Party Service Providers
            </h2>
            <p>
              We partner with reliable third-party infrastructure providers to support our agency operations:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>MongoDB Atlas:</strong> Secure cloud database storage.</li>
              <li><strong>Resend:</strong> Transactional email delivery for inquiry confirmations.</li>
              <li><strong>Cloudinary:</strong> Portfolio image and preview asset delivery.</li>
              <li><strong>Telegram Bot API:</strong> Instant notification dispatch and Mini App hosting.</li>
              <li><strong>Vercel & Render:</strong> Application hosting and API runtime execution.</li>
            </ul>
            <p className="mt-2">
              We never sell, rent, or monetize your personal data or uploaded footage links.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#181818] dark:text-[#F5F3EC] mb-2">
              4. Corporate Identity & Contact Information
            </h2>
            <p>
              For inquiries regarding personal data access, correction, or deletion, please contact us at:
            </p>
            <p className="mt-2 font-semibold text-[#181818] dark:text-[#F5F3EC]">
              Alpha Cut Video Editing Agency<br />
              Attn: Amir & Aymen<br />
              Email: alphacutagency@gmail.com<br />
              <em>[Registered Business Address & Legal Entity Details: Available upon request / Pending formal publication]</em>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

