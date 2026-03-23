"use client";

import { supabase } from "@/lib/supabase";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";

export default function SignupPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    // Create user in Supabase Auth
    const { error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { name: form.name, plan: "starter" },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // Sign in via NextAuth so we get a session cookie
    const result = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    if (result?.error) {
      // Account created but sign-in failed — send to login
      window.location.href = "/login?signup=1";
    } else {
      window.location.href = "/dashboard?onboarding=true";
    }
  }

  async function handleGoogle() {
    setLoading(true);
    await signIn("google", { callbackUrl: "/dashboard?onboarding=true" });
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="text-2xl font-bold text-white tracking-tight">
              PAI
            </span>
          </Link>
          <h1 className="text-xl font-semibold text-white mt-3">
            Create your account
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            7-day free trial — no credit card required
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
          {/* Google sign-up */}
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white text-slate-900 font-medium py-2.5 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50 text-sm mb-6"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-slate-900 px-3 text-slate-500">
                or sign up with email
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Full name
              </label>
              <input
                type="text"
                required
                autoComplete="name"
                value={form.name}
                onChange={update("name")}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                placeholder="Jane Smith"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Email
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={update("email")}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={form.password}
                onChange={update("password")}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                placeholder="At least 8 characters"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Confirm password
              </label>
              <input
                type="password"
                required
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={update("confirmPassword")}
                className={`w-full bg-slate-800 border rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent ${
                  form.confirmPassword && form.password !== form.confirmPassword
                    ? "border-red-700"
                    : "border-slate-700"
                }`}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-400 bg-red-950 border border-red-900 px-3 py-2.5 rounded-lg">
                <svg
                  className="w-4 h-4 shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-600 text-white font-semibold py-2.5 rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50 text-sm mt-2"
            >
              {loading ? "Creating account…" : "Start free trial"}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-slate-500">
            By signing up you agree to our{" "}
            <Link href="/terms" className="underline hover:text-slate-400">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline hover:text-slate-400">
              Privacy Policy
            </Link>
            .
          </p>
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-brand-400 font-medium hover:text-brand-300"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
