import React from "react";
import { Navbar } from "../components/Navbar.js";
import { Hero } from "../components/Hero.js";
import { StylesSection } from "../components/StylesSection.js";
import { Portfolio } from "../components/Portfolio.js";
import { Pricing } from "../components/Pricing.js";
import { Founders } from "../components/Founders.js";
import { InquiryForm } from "../components/InquiryForm.js";
import { Footer } from "../components/Footer.js";

export function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-surface-lightBg dark:bg-surface-darkBg text-[#181818] dark:text-[#F5F3EC]">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <StylesSection />
        <Portfolio />
        <Pricing />
        <Founders />
        <InquiryForm />
      </main>
      <Footer />
    </div>
  );
}

