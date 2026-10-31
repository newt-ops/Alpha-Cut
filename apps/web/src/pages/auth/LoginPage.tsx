import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft01Icon, ArrowRight01Icon } from "hugeicons-react";
import { Button, Input, Label, Card, CardHeader, CardTitle, CardDescription, CardContent, notify } from "@alpha-cut/ui";
import { useAuth } from "../../context/AuthContext.js";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      login(data.user);
      notify.success("Welcome back!", `Signed in as ${data.user.name}`);

      // Role-based routing
      if (data.user.role === "super_admin") {
        navigate("/admin");
      } else {
        navigate("/portal");
      }
    } catch (err: any) {
      notify.error("Login failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-lightBg dark:bg-surface-darkBg flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <Link to="/" className="inline-block mb-6">
          <Button variant="ghost" size="sm" className="gap-2 -ml-3">
            <ArrowLeft01Icon className="h-4 w-4" />
            <span>Back to Website</span>
          </Button>
        </Link>

        <Card className="border border-[#E5E5EA] dark:border-[#33302C] shadow-lg">
          <CardHeader className="text-center pb-6 border-b border-[#E5E5EA] dark:border-[#33302C]">
            <div className="h-10 w-10 rounded-2xl bg-brand-brown dark:bg-brand-terracotta flex items-center justify-center text-brand-cream dark:text-[#161412] font-black text-lg mx-auto mb-2">
              A
            </div>
            <CardTitle className="text-2xl font-extrabold">Sign In</CardTitle>
            <CardDescription className="text-xs">
              Access your Alpha Cut client portal or administrative ERP
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label required>Email Address</Label>
                <Input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label required>Password</Label>
                </div>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" size="lg" className="w-full gap-2 mt-2" isLoading={loading}>
                <span>Sign In</span>
                <ArrowRight01Icon className="h-4 w-4" />
              </Button>
            </form>

            <div className="mt-6 text-center text-xs text-[#868686] dark:text-[#8C8A89]">
              Don't have an account yet?{" "}
              <Link to="/register" className="font-semibold text-brand-brown dark:text-brand-terracotta hover:underline">
                Create an account
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

