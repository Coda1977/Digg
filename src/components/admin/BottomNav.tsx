"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, FolderOpen, LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  onSignOut: () => void;
}

export function BottomNav({ onSignOut }: BottomNavProps) {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/admin") {
      return pathname === "/admin";
    }
    return pathname.startsWith(path);
  };

  const navItems = [
    {
      label: "Dashboard",
      icon: Home,
      href: "/admin",
      active: isActive("/admin") && pathname === "/admin",
    },
    {
      label: "Projects",
      icon: FolderOpen,
      href: "/admin/projects/new",
      active: pathname.startsWith("/admin/projects"),
    },
  ];

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div
        className="flex items-center justify-around pb-[env(safe-area-inset-bottom)]"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.5rem)" }}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-3 px-4 min-w-[80px] transition-colors touch-target",
                item.active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon
                className={cn("h-5 w-5", item.active && "fill-current")}
                strokeWidth={item.active ? 2.5 : 2}
              />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}

        <button
          onClick={onSignOut}
          className="flex flex-col items-center justify-center gap-1 py-3 px-4 min-w-[80px] text-muted-foreground hover:text-foreground transition-colors touch-target"
        >
          <LogOut className="h-5 w-5" strokeWidth={2} />
          <span className="text-xs font-medium">Sign out</span>
        </button>
      </div>
    </nav>
  );
}
