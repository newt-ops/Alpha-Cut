import React from "react";
import { Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext.js";
import { AuthProvider } from "./context/AuthContext.js";
import { ProtectedRoute } from "./components/ProtectedRoute.js";
import { HomePage } from "./pages/HomePage.js";
import { LoginPage } from "./pages/auth/LoginPage.js";
import { RegisterPage } from "./pages/auth/RegisterPage.js";
import { VerifyEmailPage } from "./pages/auth/VerifyEmailPage.js";
import { LinkTelegramPage } from "./pages/auth/LinkTelegramPage.js";
import { ClientPortalPage } from "./pages/portal/ClientPortalPage.js";
import { AdminERPPage } from "./pages/admin/AdminERPPage.js";
import { PrivacyPage } from "./pages/legal/PrivacyPage.js";
import { TermsPage } from "./pages/legal/TermsPage.js";
import { DisclaimerPage } from "./pages/legal/DisclaimerPage.js";
import { CookiePolicyPage } from "./pages/legal/CookiePolicyPage.js";

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          {/* Public Marketing Landing Page */}
          <Route path="/" element={<HomePage />} />

          {/* Authentication */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/verify-email"
            element={
              <ProtectedRoute allowedRoles={["client", "super_admin"]} allowUnverifiedEmail>
                <VerifyEmailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/link-telegram"
            element={
              <ProtectedRoute allowedRoles={["client", "super_admin"]} allowUnlinkedTelegram>
                <LinkTelegramPage />
              </ProtectedRoute>
            }
          />

          {/* Client Portal (Protected) */}
          <Route
            path="/portal/*"
            element={
              <ProtectedRoute allowedRoles={["client", "super_admin"]}>
                <ClientPortalPage />
              </ProtectedRoute>
            }
          />

          {/* Agency ERP Dashboard (Super Admin Protected) */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={["super_admin"]}>
                <AdminERPPage />
              </ProtectedRoute>
            }
          />

          {/* 4 Mandatory Legal Compliance Pages */}
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/disclaimer" element={<DisclaimerPage />} />
          <Route path="/cookies" element={<CookiePolicyPage />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}
