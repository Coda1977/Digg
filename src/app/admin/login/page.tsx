"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  EditorialSection,
  EditorialHeadline,
  EditorialLabel,
  RuledDivider,
} from "@/components/editorial";

type Mode = "signIn" | "signUp";

export default function AdminLoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signIn } = useAuthActions();

  const [mode, setMode] = useState<Mode>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const heading = useMemo(
    () => (mode === "signIn" ? "Sign in" : "Create an account"),
    [mode]
  );

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) return;
    router.replace("/admin");
  }, [isAuthenticated, isLoading, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const result = await signIn("password", {
        flow: mode,
        email: email.trim(),
        password,
      });

      if (result.redirect) {
        window.location.href = result.redirect.toString();
        return;
      }

      if (!result.signingIn) {
        setError(
          "Sign-in did not complete. Double-check your email/password and try again."
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="border-b-3 border-ink bg-paper sticky top-0 z-40">
        <div className="mx-auto max-w-[900px] px-5 sm:px-8 py-5 flex items-center justify-between">
          <Link href="/" className="block">
            <span className="text-label font-sans font-semibold uppercase tracking-label text-ink">
              Digg
            </span>
          </Link>
          <Link
            href="/"
            className="text-body text-ink hover:text-accent-red transition-colors"
          >
            Home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[900px] px-5 sm:px-8">
        <EditorialSection spacing="md">
          <div className="space-y-6 max-w-2xl">
            <EditorialLabel>Admin Access</EditorialLabel>
            <EditorialHeadline as="h1" size="lg">
              {heading}
            </EditorialHeadline>
            <p className="text-body-lg text-ink-soft">
              Sign in to create projects, manage templates, and review insights.
            </p>
          </div>
        </EditorialSection>

        <RuledDivider weight="thick" spacing="sm" />

        <EditorialSection spacing="md">
          <div className="max-w-xl space-y-8">
            <div className="flex gap-3">
              <Button
                type="button"
                onClick={() => setMode("signIn")}
                className={
                  "rounded-none border-3 px-6 py-3 " +
                  (mode === "signIn"
                    ? "border-ink bg-ink text-paper hover:bg-accent-red hover:border-accent-red"
                    : "border-ink bg-transparent text-ink hover:bg-ink hover:text-paper")
                }
              >
                Sign in
              </Button>
              <Button
                type="button"
                onClick={() => setMode("signUp")}
                className={
                  "rounded-none border-3 px-6 py-3 " +
                  (mode === "signUp"
                    ? "border-ink bg-ink text-paper hover:bg-accent-red hover:border-accent-red"
                    : "border-ink bg-transparent text-ink hover:bg-ink hover:text-paper")
                }
              >
                Sign up
              </Button>
            </div>

            <form className="space-y-6" onSubmit={onSubmit}>
              <div className="space-y-3">
                <Label
                  htmlFor="email"
                  className="text-label font-sans font-medium uppercase tracking-label text-ink-soft"
                >
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-14 text-base sm:text-base rounded-none border-3 border-ink bg-paper text-ink placeholder:text-ink-lighter focus-visible:border-accent-red focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>

              <div className="space-y-3">
                <Label
                  htmlFor="password"
                  className="text-label font-sans font-medium uppercase tracking-label text-ink-soft"
                >
                  Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={
                    mode === "signIn" ? "current-password" : "new-password"
                  }
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-14 text-base sm:text-base rounded-none border-3 border-ink bg-paper text-ink placeholder:text-ink-lighter focus-visible:border-accent-red focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <p className="text-label text-ink-soft">
                  Password provider requires at least 8 characters.
                </p>
              </div>

              {error && (
                <div className="border-l-4 border-accent-red pl-6 py-2" role="alert">
                  <p className="text-body text-accent-red">{error}</p>
                </div>
              )}

              <Button
                className="w-full rounded-none border-3 border-ink bg-ink text-paper px-7 py-3 font-medium hover:bg-accent-red hover:border-accent-red"
                disabled={submitting || isLoading}
              >
                {submitting ? "Working..." : heading}
              </Button>
            </form>
          </div>
        </EditorialSection>
      </main>

      <div className="h-editorial-md" aria-hidden="true" />
    </div>
  );
}
