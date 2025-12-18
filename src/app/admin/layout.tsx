"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";

import { api } from "../../../convex/_generated/api";

import { EditorialNav } from "@/components/admin/EditorialNav";
import {
  EditorialHeadline,
  EditorialLabel,
} from "@/components/editorial";

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
      <div className="min-h-screen bg-paper flex items-center justify-center px-5 sm:px-8">
        <div className="w-full max-w-[900px] border-l-4 border-ink/20 pl-6 py-2 space-y-4">
          <EditorialLabel>Digg Admin</EditorialLabel>
          <EditorialHeadline as="h1" size="md">
            Loading…
          </EditorialHeadline>
          <p className="text-body text-ink-soft">Fetching your admin session.</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center px-5 sm:px-8">
        <div className="w-full max-w-[900px] border-l-4 border-ink/20 pl-6 py-2 space-y-4">
          <EditorialLabel>Digg Admin</EditorialLabel>
          <EditorialHeadline as="h1" size="md">
            Redirecting…
          </EditorialHeadline>
          <p className="text-body text-ink-soft">Taking you to the login page.</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center px-5 sm:px-8">
        <div className="w-full max-w-[900px] border-l-4 border-accent-red pl-6 py-2 space-y-4">
          <EditorialLabel accent>Session missing</EditorialLabel>
          <EditorialHeadline as="h1" size="md">
            Please sign in again
          </EditorialHeadline>
          <p className="text-body text-ink-soft">
            Your session expired or couldn&apos;t be loaded.
          </p>
          <button
            type="button"
            onClick={() => void signOut()}
            className="inline-flex items-center justify-center min-h-[48px] px-7 py-3 border-3 border-ink bg-ink text-paper font-medium hover:bg-accent-red hover:border-accent-red transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  if (roleError) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center px-5 sm:px-8">
        <div className="w-full max-w-[900px] border-l-4 border-accent-red pl-6 py-2 space-y-4">
          <EditorialLabel accent>Role sync failed</EditorialLabel>
          <EditorialHeadline as="h1" size="md">
            Can&apos;t load your admin role
          </EditorialHeadline>
          <p className="text-body text-accent-red" role="alert">
            {roleError}
          </p>
          <button
            type="button"
            onClick={() => void signOut()}
            className="inline-flex items-center justify-center min-h-[48px] px-7 py-3 border-3 border-ink bg-ink text-paper font-medium hover:bg-accent-red hover:border-accent-red transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center px-5 sm:px-8">
        <div className="w-full max-w-[900px] border-l-4 border-ink pl-6 py-2 space-y-4">
          <EditorialLabel>Not authorized</EditorialLabel>
          <EditorialHeadline as="h1" size="md">
            This account can&apos;t access admin
          </EditorialHeadline>
          <p className="text-body text-ink-soft">
            Sign out and sign in with an admin account.
          </p>
          <button
            type="button"
            onClick={() => void signOut()}
            className="inline-flex items-center justify-center min-h-[48px] px-7 py-3 border-3 border-ink bg-transparent text-ink font-medium hover:bg-ink hover:text-paper transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b-3 border-ink bg-paper sticky top-0 z-40">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 py-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <EditorialNav onSignOut={() => void signOut()} />
            <Link href="/admin" className="block">
              <EditorialLabel className="text-ink">Digg Admin</EditorialLabel>
            </Link>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <Link
              href="/admin"
              className="text-[15px] font-medium text-ink hover:text-accent-red transition-colors"
            >
              Dashboard
            </Link>
            <button
              type="button"
              onClick={() => void signOut()}
              className="text-[15px] font-medium text-ink hover:text-accent-red transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 sm:px-8 py-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
