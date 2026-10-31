import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";
import { Skeleton } from "@alpha-cut/ui";
import type { UserRole } from "@alpha-cut/types";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  allowUnverifiedEmail?: boolean;
  allowUnlinkedTelegram?: boolean;
}

export function ProtectedRoute({
  children,
  allowedRoles = ["client", "super_admin"],
  allowUnverifiedEmail = false,
  allowUnlinkedTelegram = false,
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-lightBg dark:bg-surface-darkBg flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-10 w-32 rounded-xl mx-auto" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!user) {
    // If visiting /verify-email with a verification token from email, allow rendering
    if (allowUnverifiedEmail && location.search.includes("token=")) {
      return <>{children}</>;
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If a client attempts to access super admin area, redirect to client portal
    if (user.role === "client") {
      return <Navigate to="/portal" replace />;
    }
    return <Navigate to="/" replace />;
  }

  // ==========================================
  // CLIENT ONBOARDING SEQUENTIAL PIPELINE
  // Step 1: Verify Email -> Step 2: Link Telegram -> Step 3: Portal Dashboard
  // ==========================================
  if (user.role === "client") {
    // A. Route: /verify-email
    if (allowUnverifiedEmail) {
      if (user.emailVerified) {
        return <Navigate to={user.telegramId ? "/portal" : "/link-telegram"} replace />;
      }
      return <>{children}</>;
    }

    // Gate 1: If email is not confirmed, force redirect to /verify-email
    if (!user.emailVerified) {
      return <Navigate to="/verify-email" replace />;
    }

    // B. Route: /link-telegram
    if (allowUnlinkedTelegram) {
      if (user.telegramId) {
        return <Navigate to="/portal" replace />;
      }
      return <>{children}</>;
    }

    // Gate 2: If telegram is not linked, force redirect to /link-telegram
    if (!user.telegramId) {
      return <Navigate to="/link-telegram" replace />;
    }
  }

  return <>{children}</>;
}

