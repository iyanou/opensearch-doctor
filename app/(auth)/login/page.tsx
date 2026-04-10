"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { Activity, CheckCircle2, AlertCircle } from "lucide-react";

const FEATURES = [
  "50+ automated diagnostic checks",
  "Security & performance analysis",
  "Proactive alerts before outages",
  "Credentials never leave your network",
];

function GoogleIcon() {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGoogle() {
    try {
      setLoading(true);
      setError("");
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-primary px-12 py-12 text-primary-foreground">
        <a href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-lg bg-primary-foreground/15 flex items-center justify-center">
            <Activity className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-base">OpenSearch Doctor</span>
        </a>
        <div>
          <blockquote className="text-2xl font-semibold leading-snug mb-6 text-primary-foreground/95">
            "Know exactly what&apos;s wrong with your cluster — and how to fix it — in under 5 minutes."
          </blockquote>
          <div className="flex flex-col gap-3">
            {FEATURES.map((feat) => (
              <div key={feat} className="flex items-center gap-2.5 text-sm text-primary-foreground/80">
                <CheckCircle2 className="w-4 h-4 text-primary-foreground/60 shrink-0" />
                {feat}
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-primary-foreground/50">
          © {new Date().getFullYear()} OpenSearch Doctor
        </p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-background">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <a href="/" className="flex items-center gap-2 mb-10 lg:hidden hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Activity className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold">OpenSearch Doctor</span>
          </a>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight">Welcome</h1>
            <p className="text-muted-foreground text-sm mt-1.5">
              Sign in to monitor your OpenSearch clusters
            </p>
          </div>

          {/* Google button */}
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full h-12 flex items-center justify-center gap-3 rounded-xl border border-border/60 bg-background hover:bg-muted/50 active:bg-muted transition-colors font-medium text-sm shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <svg className="h-4 w-4 animate-spin text-muted-foreground" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            ) : (
              <GoogleIcon />
            )}
            <span>{loading ? "Redirecting to Google…" : "Continue with Google"}</span>
          </button>

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2.5 mt-4">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Divider + trust note */}
          <div className="mt-8 pt-6 border-t border-border/40 text-center">
            <p className="text-xs text-muted-foreground leading-relaxed">
              By continuing, you agree to our{" "}
              <span className="underline underline-offset-2 cursor-pointer hover:text-foreground transition-colors">Terms</span>{" "}
              and{" "}
              <span className="underline underline-offset-2 cursor-pointer hover:text-foreground transition-colors">Privacy Policy</span>.
            </p>
            <p className="text-xs text-muted-foreground mt-3">
              Free forever · 1 cluster · No credit card required
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
