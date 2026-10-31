import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Mail01Icon,
  CheckmarkCircle02Icon,
  ArrowRight01Icon,
  Clock01Icon,
  Logout01Icon,
  RefreshIcon,
  SecurityCheckIcon,
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
  Input,
  notify,
} from "@alpha-cut/ui";
import { useAuth } from "../../context/AuthContext.js";
import { ThemeToggle } from "../../components/ThemeToggle.js";

export function VerifyEmailPage() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(60);
  const [isSuccess, setIsSuccess] = useState(false);
  const autoChecked = useRef(false);

  // Auto-verify if ?token=...&email=... is present in the URL
  useEffect(() => {
    const token = searchParams.get("token");
    const emailParam = searchParams.get("email");

    if (token && !autoChecked.current) {
      autoChecked.current = true;
      handleAutoVerifyToken(token, emailParam || user?.email);
    }
  }, [searchParams, user?.email]);

  // Resend cooldown timer countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  // If already verified, forward to next step
  useEffect(() => {
    if (user?.emailVerified) {
      setIsSuccess(true);
      const timer = setTimeout(() => {
        navigate(user?.telegramId ? "/portal" : "/link-telegram", { replace: true });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user?.emailVerified, user?.telegramId, navigate]);

  const handleAutoVerifyToken = async (token: string, email?: string) => {
    setVerifying(true);
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token, email }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Email verification failed");
      }

      setIsSuccess(true);
      notify.success("Email Verified!", "Your email address has been confirmed.");
      await refreshUser();
      setTimeout(() => {
        navigate("/link-telegram", { replace: true });
      }, 1200);
    } catch (err: any) {
      notify.error("Verification Link Invalid", err.message);
    } finally {
      setVerifying(false);
    }
  };

  const handleManualCodeSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanCode = code.replace(/\D/g, "").trim();

    if (cleanCode.length !== 6) {
      notify.error("Invalid Code", "Please enter the complete 6-digit verification code");
      return;
    }

    setVerifying(true);
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code: cleanCode, email: user?.email }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Verification failed");
      }

      setIsSuccess(true);
      notify.success("Email Verified!", "Your email address has been confirmed.");
      await refreshUser();
      setTimeout(() => {
        navigate("/link-telegram", { replace: true });
      }, 1200);
    } catch (err: any) {
      notify.error("Verification Failed", err.message);
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: user?.email }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to resend code");
      }

      notify.success("Code Dispatched", "A fresh 6-digit code has been sent via Resend.");
      setCooldown(60);
    } catch (err: any) {
      notify.error("Resend Failed", err.message);
    } finally {
      setResending(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
    setCode(val);
    if (val.length === 6) {
      // Auto submit when 6th digit entered
      setTimeout(() => {
        const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
        handleManualCodeSubmit(fakeEvent);
      }, 100);
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
              Account Security
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
                      : "bg-[#FBEFE1] text-brand-brown dark:bg-[#754637]/25 dark:text-[#FBEFE1]"
                  }`}
                >
                  {isSuccess ? (
                    <CheckmarkCircle02Icon className="h-7 w-7 sm:h-8 sm:w-8" />
                  ) : (
                    <Mail01Icon className="h-7 w-7 sm:h-8 sm:w-8" />
                  )}
                </div>
              </div>

              <div className="flex justify-center mb-2">
                <Badge variant={isSuccess ? "success" : "secondary"} className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
                  {isSuccess ? "Email Verified" : "Step 1 of 2: Verify Your Email"}
                </Badge>
              </div>

              <CardTitle className="text-xl sm:text-2xl font-extrabold text-[#181818] dark:text-[#F5F3EC]">
                {isSuccess ? "Email Confirmed!" : "Check Your Inbox"}
              </CardTitle>

              <CardDescription className="text-xs sm:text-sm text-[#868686] dark:text-[#8C8A89] mt-1.5 sm:mt-2 max-w-md mx-auto leading-relaxed px-1">
                {isSuccess ? (
                  "Your email is confirmed. Proceeding to Telegram connection..."
                ) : (
                  <>
                    We sent a 6-digit confirmation code via Resend to{" "}
                    <span className="font-semibold text-[#181818] dark:text-[#F5F3EC] break-all">
                      {user?.email || "your email address"}
                    </span>
                    . Enter the code below or click the link in your email.
                  </>
                )}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5 sm:space-y-6 px-4 sm:px-7 pt-3 sm:pt-4">
              {!isSuccess ? (
                <form onSubmit={handleManualCodeSubmit} className="space-y-4 sm:space-y-5">
                  {/* Code Input */}
                  <div className="space-y-2">
                    <div className="flex justify-center">
                      <Input
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        placeholder="&bull;&bull;&bull;&bull;&bull;&bull;"
                        value={code}
                        onChange={handleCodeChange}
                        autoFocus
                        maxLength={6}
                        className="text-center text-xl sm:text-2xl md:text-3xl font-extrabold tracking-[4px] sm:tracking-[8px] md:tracking-[10px] h-12 sm:h-14 md:h-16 w-full max-w-[240px] sm:max-w-[280px] font-mono rounded-xl sm:rounded-2xl border-2 focus:border-brand-brown dark:focus:border-brand-terracotta"
                      />
                    </div>
                    <p className="text-[11px] text-center text-[#868686] dark:text-[#8C8A89]">
                      Enter the 6 digits sent to your email (expires in 15 mins)
                    </p>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full gap-2 text-xs sm:text-sm font-bold h-11 sm:h-12 rounded-xl sm:rounded-2xl"
                    isLoading={verifying}
                    disabled={code.length !== 6 || verifying}
                  >
                    <span>Confirm & Continue</span>
                    <ArrowRight01Icon className="h-4 w-4" />
                  </Button>

                  {/* Resend Action */}
                  <div className="pt-1 sm:pt-2 text-center text-xs text-[#868686] dark:text-[#8C8A89]">
                    Didn't receive the email?{" "}
                    {cooldown > 0 ? (
                      <span className="font-semibold text-[#181818] dark:text-[#F5F3EC]">
                        Resend code in {cooldown}s
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={resending}
                        className="font-bold text-brand-brown dark:text-brand-terracotta hover:underline ml-1 inline-flex items-center gap-1"
                      >
                        <RefreshIcon className="h-3 w-3" />
                        <span>{resending ? "Sending..." : "Resend code"}</span>
                      </button>
                    )}
                  </div>
                </form>
              ) : (
                <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-[#E8F5E9] dark:bg-[#1B5E20]/20 border border-[#A5D6A7] dark:border-[#81C784]/30 text-center space-y-1 text-xs text-[#2E7D32] dark:text-[#81C784]">
                  <span className="font-bold block text-sm">Email Verified Successfully!</span>
                  <p className="text-[11px] text-[#2E7D32]/80 dark:text-[#81C784]/80">
                    Advancing to Step 2: Connect Telegram...
                  </p>
                </div>
              )}

              {/* Value reminder */}
              <div className="p-3 sm:p-3.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-[#E5E5EA] dark:border-[#33302C] flex items-center gap-2.5 text-[11px] sm:text-xs text-[#868686] dark:text-[#8C8A89]">
                <SecurityCheckIcon className="h-4 w-4 text-brand-brown dark:text-brand-terracotta shrink-0" />
                <span>
                  Email verification guarantees verified invoices and secure project ownership.
                </span>
              </div>
            </CardContent>

            <CardFooter className="pt-0 pb-5 sm:pb-7 px-4 sm:px-7 justify-center">
              <p className="text-[11px] text-[#868686] dark:text-[#8C8A89] text-center">
                Need help? Contact concierge:{" "}
                <a
                  href="https://t.me/Amir_Alpha_Cut"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold underline hover:text-[#181818] dark:hover:text-white"
                >
                  @Amir_Alpha_Cut
                </a>
              </p>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
}

