import React from "react";
import { Routes, Route } from "react-router-dom";
import { HomePage } from "./pages/HomePage.js";
import { PrivacyPage } from "./pages/legal/PrivacyPage.js";
import { TermsPage } from "./pages/legal/TermsPage.js";
import { DisclaimerPage } from "./pages/legal/DisclaimerPage.js";
import { CookiePolicyPage } from "./pages/legal/CookiePolicyPage.js";

export default function App() {
  return (
    <Routes>
      {/* Public Marketing Landing Page */}
      <Route path="/" element={<HomePage />} />

      {/* 4 Mandatory Legal Compliance Pages */}
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/disclaimer" element={<DisclaimerPage />} />
      <Route path="/cookies" element={<CookiePolicyPage />} />
    </Routes>
  );
}
