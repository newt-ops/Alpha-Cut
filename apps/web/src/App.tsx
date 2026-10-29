import React from "react";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.js";
import { HomePage } from "./pages/HomePage.js";
import { LoginPage } from "./pages/auth/LoginPage.js";
import { RegisterPage } from "./pages/auth/RegisterPage.js";
import { ClientPortalPage } from "./pages/portal/ClientPortalPage.js";
import { AdminERPPage } from "./pages/admin/AdminERPPage.js";
import { PrivacyPage } from "./pages/legal/PrivacyPage.js";
import { TermsPage } from "./pages/legal/TermsPage.js";
import { DisclaimerPage } from "./pages/legal/DisclaimerPage.js";
import { CookiePolicyPage } from "./pages/legal/CookiePolicyPage.js";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Marketing Landing Page */}
        <Route path="/" element={<HomePage />} />

        {/* Authentication */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Client Portal */}
        <Route path="/portal/*" element={<ClientPortalPage />} />

        {/* Agency ERP Dashboard (Super Admin) */}
        <Route path="/admin/*" element={<AdminERPPage />} />

        {/* 4 Mandatory Legal Compliance Pages */}
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/disclaimer" element={<DisclaimerPage />} />
        <Route path="/cookies" element={<CookiePolicyPage />} />
      </Routes>
    </AuthProvider>
  );
}
