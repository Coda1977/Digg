"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";

import { api } from "../../../convex/_generated/api";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EditorialNav } from "@/components/admin/EditorialNav";
import { EditorialLabel } from "@/components/editorial";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signOut } = useAuthActions();

  const user = useQuery(api.auth.currentUser);
  const ensureRole = useMutation(api.auth.ensureRole);
  const [roleError, setRoleError] = useState<string | null>(null);
  const roleSyncStartedRef = useRef(false);

  const isLoginRoute = pathname === "/admin/login";

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated) return;
    if (isLoginRoute) return;
    router.replace("/admin/login");
  }, [isAuthenticated, isLoading, isLoginRoute, router]);

  useEffect(() => {
    if (!isAuthenticated) {
      roleSyncStartedRef.current = false;
      return;
    }
    if (!user) return;
    if (user.role) return;
    if (roleSyncStartedRef.current) return;

    roleSyncStartedRef.current = true;
    void ensureRole().catch((err) => {
      setRoleError(err instanceof Error ? err.message : "Failed to sync role");
    });
  }, [ensureRole, isAuthenticated, user]);

  if (isLoginRoute) return <>{children}</>;

  const waitingForRole =
    isAuthenticated && !!user && user.role === null && !roleError;

  if (isLoading || user === undefined || waitingForRole) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-sm text-muted-foreground">
          Redirecting to login...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-lg">Session missing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Please sign in again.
            </p>
            <Button className="w-full" onClick={() => void signOut()}>
              Sign out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (roleError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-lg">Role sync failed</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-destructive" role="alert">
              {roleError}
            </p>
            <Button className="w-full" onClick={() => void signOut()}>
              Sign out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-lg">Not authorized</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              This account does not have admin access.
            </p>
            <Button className="w-full" onClick={() => void signOut()}>
              Sign out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b-3 border-ink/20 bg-paper sticky top-0 z-40">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <EditorialNav onSignOut={() => void signOut()} />
            <Link href="/admin" className="block">
              <EditorialLabel>Digg Admin</EditorialLabel>
            </Link>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <Button asChild variant="ghost" size="lg" className="hover:bg-ink/5">
              <Link href="/admin">Dashboard</Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => void signOut()}
              className="border-ink text-ink hover:bg-ink/5"
            >
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-3 sm:px-4 py-6 sm:py-8">{children}</main>
    </div>
  );
}
