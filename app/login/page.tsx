"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Zap, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login, register, user, isLoading: authLoading } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  // Already logged in → go straight to dashboard
  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/dashboard");
    }
  }, [authLoading, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      if (isSignUp) {
        await register(form.name, form.email, form.password);
      } else {
        await login(form.email, form.password);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9f8]">
        <div className="w-8 h-8 border-2 border-[#baff29] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-[#0a0a0a] px-16 py-12 relative overflow-hidden">
        {/* Background decorative circles */}
        <div className="absolute top-[-80px] left-[-80px] w-[400px] h-[400px] rounded-full bg-[#baff29]/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-100px] right-[-60px] w-[350px] h-[350px] rounded-full bg-[#baff29]/8 blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="flex items-center gap-2 z-10">
          <div className="w-9 h-9 rounded-lg bg-[#baff29] flex items-center justify-center">
            <Zap size={20} className="text-black" fill="black" />
          </div>
          <span className="text-white text-xl font-bold tracking-tight">PaySim</span>
        </div>

        {/* Centre copy */}
        <div className="z-10 space-y-6">
          <div className="inline-flex items-center gap-2 bg-[#baff29]/10 border border-[#baff29]/20 rounded-full px-4 py-1.5">
            <span className="w-2 h-2 rounded-full bg-[#baff29] animate-pulse" />
            <span className="text-[#baff29] text-sm font-medium">
              Smart finance management
            </span>
          </div>
          <h1 className="text-5xl font-bold text-white leading-tight">
            Take control of
            <br />
            your <span className="text-[#baff29]">finances</span>.
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed max-w-md">
            Track spending, manage wallets, send payments and grow your savings
            — all in one beautiful dashboard.
          </p>

          {/* Stats */}
          <div className="flex gap-8 pt-4">
            {[
              { value: "2M+", label: "Active users" },
              { value: "$4.5B", label: "Processed" },
              { value: "99.9%", label: "Uptime" },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-2xl font-bold text-[#baff29]">
                  {s.value}
                </div>
                <div className="text-zinc-500 text-sm">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom testimonial */}
        <div className="z-10 border border-white/10 bg-white/5 backdrop-blur rounded-2xl p-5">
          <p className="text-white/80 text-sm leading-relaxed">
            "PaySim transformed how I manage my business finances. The dashboard
            is incredibly intuitive and beautiful."
          </p>
          <div className="flex items-center gap-3 mt-3">
            <div className="w-8 h-8 rounded-full bg-[#baff29] flex items-center justify-center text-black font-bold text-xs">
              MA
            </div>
            <div>
              <div className="text-white text-sm font-medium">
                Michael Anderson
              </div>
              <div className="text-zinc-500 text-xs">CEO, TechStart Inc.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel — Auth Form */}
      <div className="flex-1 flex items-center justify-center bg-[#f8f9f8] px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-9 h-9 rounded-lg bg-[#baff29] flex items-center justify-center">
              <Zap size={20} className="text-black" fill="black" />
            </div>
            <span className="text-black text-xl font-bold tracking-tight">
              PaySim
            </span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-[#0a0a0a]">
              {isSignUp ? "Create account" : "Welcome back"}
            </h2>
            <p className="text-zinc-500 mt-2">
              {isSignUp
                ? "Sign up to start managing your finances."
                : "Sign in to access your dashboard."}
            </p>
          </div>

          {/* Toggle tabs */}
          <div className="flex bg-white border border-zinc-200 rounded-xl p-1 mb-8">
            {["Sign In", "Sign Up"].map((tab) => {
              const active = tab === "Sign Up" ? isSignUp : !isSignUp;
              return (
                <button
                  key={tab}
                  onClick={() => {
                    setIsSignUp(tab === "Sign Up");
                    setError(null);
                  }}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                    active
                      ? "bg-[#baff29] text-black shadow-sm"
                      : "text-zinc-500 hover:text-zinc-700"
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {/* Error Banner */}
          {error && (
            <div className="flex items-start gap-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-4 py-3 mb-5 text-sm">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Alexander Johnson"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#baff29] focus:border-transparent transition"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                Email
              </label>
              <input
                type="email"
                required
                placeholder="alex@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#baff29] focus:border-transparent transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-zinc-700">
                  Password
                </label>
                {!isSignUp && (
                  <a
                    href="#"
                    className="text-xs text-[#2a7a00] hover:text-[#baff29] font-medium transition"
                  >
                    Forgot password?
                  </a>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#baff29] focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 transition"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {!isSignUp && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-[#baff29] rounded"
                />
                <span className="text-sm text-zinc-600">
                  Remember me for 30 days
                </span>
              </label>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-[#baff29] cursor-pointer text-black font-semibold rounded-xl hover:bg-[#aaee18] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 text-black"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                  {isSignUp ? "Creating account..." : "Signing in..."}
                </>
              ) : isSignUp ? (
                "Create Account"
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <p className="text-center text-sm text-zinc-500 mt-6">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              className="text-[#2a7a00] font-semibold hover:text-[#baff29] transition"
            >
              {isSignUp ? "Sign In" : "Sign Up"}
            </button>
          </p>

          <p className="text-center text-xs text-zinc-400 mt-8">
            By continuing, you agree to our{" "}
            <a href="#" className="underline hover:text-zinc-600">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="underline hover:text-zinc-600">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
