"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Plus } from "lucide-react";

import { api } from "../../../convex/_generated/api";

import { EditorialNav } from "@/components/admin/EditorialNav";
import { BottomNav } from "@/components/admin/BottomNav";
import {
  EditorialHeadline,
  EditorialLabel,
  EditorialButton,
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
            Loading...
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
            Redirecting...
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

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b-3 border-ink bg-paper">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 py-4 sm:py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <EditorialNav onSignOut={() => void signOut()} />
            <Link href="/admin" className="block">
              <EditorialLabel className="text-ink">Digg Admin</EditorialLabel>
            </Link>
          </div>
          <div className="hidden sm:flex items-center gap-4">
            <Link
              href="/admin"
              aria-current={isActive("/admin") && pathname === "/admin" ? "page" : undefined}
              className={`text-[15px] font-medium transition-colors ${
                isActive("/admin") && pathname === "/admin"
                  ? "text-accent-red underline underline-offset-4 decoration-2"
                  : "text-ink hover:text-accent-red"
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/admin/templates"
              aria-current={pathname.startsWith("/admin/templates") ? "page" : undefined}
              className={`text-[15px] font-medium transition-colors ${
                pathname.startsWith("/admin/templates")
                  ? "text-accent-red underline underline-offset-4 decoration-2"
                  : "text-ink hover:text-accent-red"
              }`}
            >
              Templates
            </Link>
            <EditorialButton variant="primary" size="small" asChild>
              <Link href="/admin/projects/new">
                <Plus className="h-4 w-4" />
                New Project
              </Link>
            </EditorialButton>
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
      <main className="mx-auto max-w-6xl px-5 sm:px-8 py-6 sm:py-8 pb-24 sm:pb-8">
        {children}
      </main>
      <BottomNav onSignOut={() => void signOut()} />
    </div>
  );
}
