import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ViewIcon,
  ViewOffSlashIcon,
  CheckmarkCircle02Icon,
  CancelCircleIcon,
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
  notify,
} from "@alpha-cut/ui";
import { ThemeToggle } from "../../components/ThemeToggle.js";
import { GoogleSignInButton } from "../../components/GoogleSignInButton.js";
import { useAuth } from "../../context/AuthContext.js";

export function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [telegramUsername, setTelegramUsername] = useState("");
  const [brandName, setBrandName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

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

  const isPasswordLongEnough = password.length >= 8;
  const doPasswordsMatch = password && confirmPassword && password === confirmPassword;
  const showMismatchWarning = confirmPassword && password !== confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isPasswordLongEnough) {
      notify.error("Password Too Short", "Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      notify.error("Password Mismatch", "Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const cleanTelegram = telegramUsername.replace(/^@/, "").trim();
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          telegramUsername: cleanTelegram,
          brandName: brandName.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      login(data.user, data.token);
      notify.success("Account created!", "Please verify your email address to continue.");
      handleRedirect(data.user.role, data.user.emailVerified, data.user.telegramId);
    } catch (err: any) {
      notify.error("Registration failed", err.message);
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
      <div className="max-w-md w-full my-8">
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
              Create an Account
            </CardTitle>
            <CardDescription className="text-xs">
              Join Alpha Cut to submit video briefs, track cuts, and approve deliverables
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6 space-y-5">
            {/* 1. Google OAuth Button */}
            <div className="space-y-3">
              <GoogleSignInButton
                text="signup_with"
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

            {/* 2. Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label required>Full Name</Label>
                <Input
                  placeholder="Jane Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  required
                />
              </div>

              <div>
                <Label required>Email Address</Label>
                <Input
                  type="email"
                  placeholder="jane@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>Telegram Handle</Label>
                  <Input
                    placeholder="@username"
                    value={telegramUsername}
                    onChange={(e) => setTelegramUsername(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Brand / Channel</Label>
                  <Input
                    placeholder="e.g. MyPodcast"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <Label required>Password</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    minLength={8}
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

              {/* Confirm Password Field */}
              <div>
                <Label required>Confirm Password</Label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#868686] hover:text-[#181818] dark:hover:text-[#F5F3EC] transition-colors p-1"
                  >
                    {showConfirmPassword ? (
                      <ViewOffSlashIcon className="h-4 w-4" />
                    ) : (
                      <ViewIcon className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* Validation indicators */}
                <div className="mt-2 space-y-1 text-[11px]">
                  <div
                    className={`flex items-center gap-1.5 ${
                      isPasswordLongEnough
                        ? "text-emerald-600 dark:text-emerald-400 font-medium"
                        : "text-[#868686]"
                    }`}
                  >
                    {isPasswordLongEnough ? (
                      <CheckmarkCircle02Icon className="h-3.5 w-3.5 shrink-0" />
                    ) : (
                      <div className="h-1.5 w-1.5 rounded-full bg-neutral-400 shrink-0 ml-1 mr-1" />
                    )}
                    <span>At least 8 characters</span>
                  </div>

                  {confirmPassword && (
                    <div
                      className={`flex items-center gap-1.5 ${
                        doPasswordsMatch
                          ? "text-emerald-600 dark:text-emerald-400 font-medium"
                          : "text-red-500 font-medium"
                      }`}
                    >
                      {doPasswordsMatch ? (
                        <CheckmarkCircle02Icon className="h-3.5 w-3.5 shrink-0" />
                      ) : (
                        <CancelCircleIcon className="h-3.5 w-3.5 shrink-0" />
                      )}
                      <span>
                        {doPasswordsMatch ? "Passwords match" : "Passwords do not match"}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full gap-2 mt-3"
                isLoading={loading}
                disabled={!isPasswordLongEnough || !doPasswordsMatch}
              >
                <span>Create Account & Connect Telegram</span>
                <ArrowRight01Icon className="h-4 w-4" />
              </Button>
            </form>

            <div className="pt-2 text-center text-xs text-[#868686] dark:text-[#8C8A89] border-t border-[#E5E5EA] dark:border-[#33302C]">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-bold text-brand-brown dark:text-brand-terracotta hover:underline ml-1"
              >
                Sign In
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
