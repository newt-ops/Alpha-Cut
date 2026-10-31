import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  TelegramIcon,
  CheckmarkCircle02Icon,
  SecurityCheckIcon,
  ArrowRight01Icon,
  Logout01Icon,
  SparklesIcon,
  Clock01Icon,
} from "hugeicons-react";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
  notify,
} from "@alpha-cut/ui";
import { useAuth } from "../../context/AuthContext.js";
import { ThemeToggle } from "../../components/ThemeToggle.js";

export function LinkTelegramPage() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [connecting, setConnecting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [verifyingManually, setVerifyingManually] = useState(false);

  // If already linked, automatically route to portal
  useEffect(() => {
    if (user?.telegramId) {
      setIsSuccess(true);
      const timer = setTimeout(() => {
        navigate("/portal", { replace: true });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user?.telegramId, navigate]);

  // Polling loop when listening for the user to tap START in Telegram
  useEffect(() => {
    if (!isListening || isSuccess) return;

    const interval = setInterval(async () => {
      try {
        await refreshUser();
      } catch {
        // silent catch during polling
      }
    }, 2000);

    const timeout = setTimeout(() => {
      setIsListening(false);
    }, 180000); // Stop polling after 3 minutes

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isListening, isSuccess, refreshUser]);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const res = await fetch("/api/auth/telegram-bind-token", {
        method: "POST",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to generate connection link");
      }

      const data = await res.json();
      window.open(data.bindUrl, "_blank");
      setIsListening(true);
      notify.info("Telegram Opened", "Tap START in the Telegram bot to complete your 1:1 link.");
    } catch (err: any) {
      notify.error("Connection Failed", err.message);
    } finally {
      setConnecting(false);
    }
  };

  const handleManualCheck = async () => {
    setVerifyingManually(true);
    try {
      await refreshUser();
      if (!user?.telegramId) {
        notify.warning(
          "Not Linked Yet",
          "We haven't received your /start command yet. Please open the bot and tap START."
        );
      }
    } catch (err: any) {
      notify.error("Check Failed", err.message);
    } finally {
      setVerifyingManually(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-lightBg dark:bg-surface-darkBg flex flex-col">
      {/* Responsive Header */}
      <header className="border-b border-[#E5E5EA] dark:border-[#33302C] bg-white dark:bg-[#161412] sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-brand-brown dark:bg-brand-terracotta flex items-center justify-center text-brand-cream dark:text-[#161412] font-black text-xs sm:text-sm">
                A
              </div>
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-[#181818] dark:text-[#F5F3EC]">
                ALPHA CUT
              </span>
            </Link>
            <span className="hidden sm:inline-flex text-[11px] px-2.5 py-0.5 rounded-md bg-[#FBEFE1] text-[#451D13] dark:bg-[#754637] dark:text-[#FBEFE1] font-bold">
              Account Onboarding
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs h-9 px-2.5 sm:px-3"
              onClick={() => logout()}
            >
              <Logout01Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 flex items-center justify-center p-3.5 sm:p-6 md:p-8">
        <div className="w-full max-w-lg space-y-4 sm:space-y-6">
          <Card className="border border-[#E5E5EA] dark:border-[#33302C] bg-white dark:bg-[#161412] shadow-sm rounded-2xl sm:rounded-3xl overflow-hidden">
            <CardHeader className="text-center px-4 sm:px-7 pt-6 sm:pt-8 pb-2">
              <div className="mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                <div
                  className={`h-14 w-14 sm:h-16 sm:w-16 rounded-2xl sm:rounded-3xl flex items-center justify-center transition-colors duration-300 ${
                    isSuccess
                      ? "bg-[#E8F5E9] text-[#2E7D32] dark:bg-[#1B5E20]/30 dark:text-[#81C784]"
                      : "bg-[#229ED9]/10 text-[#229ED9]"
                  }`}
                >
                  {isSuccess ? (
                    <CheckmarkCircle02Icon className="h-7 w-7 sm:h-8 sm:w-8" />
                  ) : (
                    <TelegramIcon className="h-7 w-7 sm:h-8 sm:w-8" />
                  )}
                </div>
              </div>

              <div className="flex justify-center mb-2">
                <Badge variant={isSuccess ? "success" : "secondary"} className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
                  {isSuccess ? "Account Verified" : "Step 2 of 2: Connect Telegram"}
                </Badge>
              </div>

              <CardTitle className="text-xl sm:text-2xl font-extrabold text-[#181818] dark:text-[#F5F3EC]">
                {isSuccess ? "Telegram Connected!" : "Connect Your Telegram"}
              </CardTitle>

              <CardDescription className="text-xs sm:text-sm text-[#868686] dark:text-[#8C8A89] mt-1.5 sm:mt-2 max-w-md mx-auto leading-relaxed px-1">
                {isSuccess
                  ? "Your Telegram account is paired 1:1. Unlocking your Client Portal..."
                  : "To access your client portal, every account must link with Telegram. This enables 1-tap proposal approvals, real-time draft notifications, and direct contact with Amir & Aymen."}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-7 pt-3 sm:pt-4">
              {/* Account summary pill */}
              <div className="p-3 sm:p-3.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-[#E5E5EA] dark:border-[#33302C] flex items-center justify-between gap-3 text-xs">
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] uppercase font-bold text-[#868686] dark:text-[#8C8A89] block">
                    Signed in as
                  </span>
                  <span className="font-bold text-[#181818] dark:text-[#F5F3EC] block truncate">
                    {user?.name ? `${user.name} (${user.email})` : user?.email || "Client"}
                  </span>
                </div>
                <Badge variant="outline" className="text-[10px] shrink-0 font-semibold">
                  Client
                </Badge>
              </div>

              {/* Security & Feature Checklist */}
              {!isSuccess && (
                <div className="space-y-2.5 p-3.5 sm:p-4 rounded-xl bg-[#FBEFE1]/50 dark:bg-[#754637]/15 border border-[#E4BCAE]/60 dark:border-[#754637]/30 text-[11px] sm:text-xs text-[#451D13] dark:text-[#FBEFE1]/90 leading-relaxed">
                  <div className="flex items-start gap-2.5">
                    <CheckmarkCircle02Icon className="h-4 w-4 text-brand-brown dark:text-brand-terracotta shrink-0 mt-0.5" />
                    <span>
                      <b>1-Tap Fast Actions:</b> Review and accept editing agreements directly in your Telegram chat to activate production instantly.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Clock01Icon className="h-4 w-4 text-brand-brown dark:text-brand-terracotta shrink-0 mt-0.5" />
                    <span>
                      <b>Real-Time Cut Alerts:</b> Get instant push notices the second a draft cut or revision is uploaded for review.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <SecurityCheckIcon className="h-4 w-4 text-brand-brown dark:text-brand-terracotta shrink-0 mt-0.5" />
                    <span>
                      <b>Strict 1:1 Security:</b> Your Telegram is bound exclusively to your user profile. No duplicate or shared links.
                    </span>
                  </div>
                </div>
              )}

              {/* Listening radar indicator */}
              {isListening && !isSuccess && (
                <div className="p-3.5 sm:p-4 rounded-xl bg-[#FFF8E1] dark:bg-[#F57F17]/10 border border-[#FFE082] dark:border-[#F57F17]/30 text-center space-y-1.5 sm:space-y-2">
                  <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#F57F17] dark:text-[#FFD54F]">
                    <span className="h-2 w-2 rounded-full bg-[#F57F17] animate-ping" />
                    <span>Listening for /start in Telegram...</span>
                  </div>
                  <p className="text-[11px] text-[#868686] dark:text-[#8C8A89]">
                    Tap <b>START</b> in the Telegram bot window. This page will automatically update once verified.
                  </p>
                </div>
              )}

              {/* Success celebration state */}
              {isSuccess && (
                <div className="p-3.5 sm:p-4 rounded-xl bg-[#E8F5E9] dark:bg-[#1B5E20]/20 border border-[#A5D6A7] dark:border-[#81C784]/30 text-center space-y-1 text-xs text-[#2E7D32] dark:text-[#81C784]">
                  <span className="font-bold block text-sm">Account Successfully Linked!</span>
                  <p className="text-[11px] text-[#2E7D32]/80 dark:text-[#81C784]/80">
                    Redirecting to your video dashboard...
                  </p>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex flex-col gap-2.5 sm:gap-3 pt-2 pb-5 sm:pb-7 px-4 sm:px-7">
              {!isSuccess ? (
                <>
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full gap-2 text-xs sm:text-sm font-bold h-11 sm:h-12 rounded-xl sm:rounded-2xl"
                    onClick={handleConnect}
                    disabled={connecting}
                  >
                    <TelegramIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span>
                      {connecting
                        ? "Opening Telegram..."
                        : isListening
                        ? "Re-open Telegram Bot"
                        : "Connect with Telegram"}
                    </span>
                  </Button>

                  {isListening && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs h-9"
                      onClick={handleManualCheck}
                      disabled={verifyingManually}
                    >
                      <span>{verifyingManually ? "Checking..." : "I've already tapped START — Verify"}</span>
                    </Button>
                  )}
                </>
              ) : (
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full gap-2 text-xs sm:text-sm font-bold h-11 sm:h-12 rounded-xl sm:rounded-2xl"
                  onClick={() => navigate("/portal", { replace: true })}
                >
                  <span>Go to Client Portal</span>
                  <ArrowRight01Icon className="h-4 w-4" />
                </Button>
              )}
            </CardFooter>
          </Card>

          <p className="text-center text-[11px] text-[#868686] dark:text-[#8C8A89]">
            Need help? Contact executive team directly:{" "}
            <a
              href="https://t.me/Amir_Alpha_Cut"
              target="_blank"
              rel="noreferrer"
              className="font-semibold underline hover:text-[#181818] dark:hover:text-white"
            >
              @Amir_Alpha_Cut
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}

