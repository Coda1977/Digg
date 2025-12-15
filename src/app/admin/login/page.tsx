"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl">{heading}</CardTitle>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={mode === "signIn" ? "default" : "outline"}
              onClick={() => setMode("signIn")}
            >
              Sign in
            </Button>
            <Button
              type="button"
              variant={mode === "signUp" ? "default" : "outline"}
              onClick={() => setMode("signUp")}
            >
              Sign up
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
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
              />
              <p className="text-xs text-muted-foreground">
                Password provider requires at least 8 characters.
              </p>
            </div>

            {error && (
              <div className="text-sm text-destructive" role="alert">
                {error}
              </div>
            )}

            <Button className="w-full" disabled={submitting || isLoading}>
              {submitting ? "Working…" : heading}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
