import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ViewIcon,
  ViewOffSlashIcon,
  HelpCircleIcon,
  SentIcon,
} from "hugeicons-react";
import {
  Button,
  Input,
  Label,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  notify,
} from "@alpha-cut/ui";
import { ThemeToggle } from "../../components/ThemeToggle.js";
import { GoogleSignInButton } from "../../components/GoogleSignInButton.js";
import { useAuth } from "../../context/AuthContext.js";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);

  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleRedirect = (role: string, emailVerified?: boolean, telegramId?: string) => {
    if (role === "super_admin") {
      navigate("/admin", { replace: true });
      return;
    }
    // Step 1: Mandatory Email Verification Gate
    if (!emailVerified) {
      navigate("/verify-email", { replace: true });
      return;
    }
    // Step 2: Mandatory Telegram Gate
    if (!telegramId) {
      navigate("/link-telegram", { replace: true });
      return;
    }
    const destination =
      (location.state as any)?.from?.pathname || "/portal";
    navigate(destination, { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      login(data.user, data.token);
      notify.success("Welcome back!", `Signed in as ${data.user.name}`);
      handleRedirect(data.user.role, data.user.emailVerified, data.user.telegramId);
    } catch (err: any) {
      notify.error("Login failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credential: string) => {
    try {
      setLoading(true);
      const user = await loginWithGoogle(credential);
      notify.success("Signed in with Google", `Welcome, ${user.name}`);
      handleRedirect(user.role, user.emailVerified, user.telegramId);
    } catch (err: any) {
      notify.error("Google Sign-In failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = (err: Error) => {
    notify.error("Google Authentication Error", err.message);
  };

  return (
    <div className="min-h-screen bg-surface-lightBg dark:bg-surface-darkBg flex items-center justify-center p-6 transition-colors">
      <div className="max-w-md w-full">
        {/* Navigation Row */}
        <div className="flex items-center justify-between mb-6">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2 -ml-3">
              <ArrowLeft01Icon className="h-4 w-4" />
              <span>Back to Website</span>
            </Button>
          </Link>
          <ThemeToggle />
        </div>

        {/* Auth Card */}
        <Card className="border border-[#E5E5EA] dark:border-[#33302C] shadow-lg bg-white/95 dark:bg-[#1E1C1A]/95 backdrop-blur-xl">
          <CardHeader className="text-center pb-6 border-b border-[#E5E5EA] dark:border-[#33302C]">
            <div className="h-10 w-10 rounded-2xl bg-brand-brown dark:bg-brand-terracotta flex items-center justify-center text-brand-cream dark:text-[#161412] font-black text-lg mx-auto mb-2 shadow-sm ring-1 ring-black/5 dark:ring-white/10">
              A
            </div>
            <CardTitle className="text-2xl font-extrabold tracking-tight">
              Sign In
            </CardTitle>
            <CardDescription className="text-xs">
              Access your Alpha Cut client portal or administrative ERP
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6 space-y-5">
            {/* 1. Google OAuth Button */}
            <div className="space-y-3">
              <GoogleSignInButton
                text="continue_with"
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                disabled={loading}
              />

              <div className="relative flex items-center justify-center pt-1">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#E5E5EA] dark:border-[#33302C]" />
                </div>
                <div className="relative bg-white dark:bg-[#1E1C1A] px-3 text-[11px] uppercase tracking-wider font-semibold text-[#868686] dark:text-[#8C8A89]">
                  or with email
                </div>
              </div>
            </div>

            {/* 2. Standard Email/Password Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label required>Email Address</Label>
                <Input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label required>Password</Label>
                  <button
                    type="button"
                    onClick={() => setForgotModalOpen(true)}
                    className="text-xs text-brand-brown dark:text-brand-terracotta hover:underline font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#868686] hover:text-[#181818] dark:hover:text-[#F5F3EC] transition-colors p-1"
                  >
                    {showPassword ? (
                      <ViewOffSlashIcon className="h-4 w-4" />
                    ) : (
                      <ViewIcon className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  id="rememberMe"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-[#E5E5EA] dark:border-[#33302C] text-brand-brown dark:text-brand-terracotta focus:ring-brand-brown focus:ring-offset-0 bg-transparent cursor-pointer"
                />
                <label
                  htmlFor="rememberMe"
                  className="text-xs text-[#868686] dark:text-[#8C8A89] cursor-pointer select-none"
                >
                  Remember me for 30 days
                </label>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full gap-2 mt-2"
                isLoading={loading}
              >
                <span>Sign In</span>
                <ArrowRight01Icon className="h-4 w-4" />
              </Button>
            </form>

            <div className="pt-2 text-center text-xs text-[#868686] dark:text-[#8C8A89] border-t border-[#E5E5EA] dark:border-[#33302C]">
              Don't have an account yet?{" "}
              <Link
                to="/register"
                className="font-bold text-brand-brown dark:text-brand-terracotta hover:underline ml-1"
              >
                Create an account
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Forgot Password Concierge Modal */}
        {forgotModalOpen && (
          <Dialog open={forgotModalOpen} onOpenChange={setForgotModalOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <div className="h-10 w-10 rounded-full bg-brand-brown/10 text-brand-brown dark:text-brand-terracotta flex items-center justify-center mx-auto mb-2">
                  <HelpCircleIcon className="h-5 w-5" />
                </div>
                <DialogTitle className="text-center">Account Access Recovery</DialogTitle>
                <DialogDescription className="text-center text-xs">
                  We handle account recovery with VIP concierge service to protect your video projects and deliverables.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 pt-3 text-xs">
                <div className="p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-[#E5E5EA] dark:border-[#33302C] space-y-2">
                  <p className="font-semibold text-[#181818] dark:text-[#F5F3EC]">
                    Direct Founder Support Line
                  </p>
                  <p className="text-[#868686] dark:text-[#8C8A89] leading-relaxed">
                    Message Amir directly on Telegram with your registered email. We will verify your account and provide a direct recovery link within minutes.
                  </p>
                </div>

                <a
                  href="https://t.me/amir_alpha_cut"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full"
                >
                  <Button variant="primary" size="md" className="w-full gap-2 justify-center">
                    <SentIcon className="h-4 w-4" />
                    <span>Contact Amir on Telegram (@amir_alpha_cut)</span>
                  </Button>
                </a>

                <div className="text-center text-[11px] text-[#868686]">
                  Or email{" "}
                  <a href="mailto:alphacutagency@gmail.com" className="underline font-semibold">
                    alphacutagency@gmail.com
                  </a>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
