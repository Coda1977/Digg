"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import {
  EditorialSection,
  EditorialHeadline,
  EditorialLabel,
  RuledDivider,
} from "@/components/editorial";

interface EditorialNavProps {
  onSignOut: () => void;
}

/**
 * Editorial Navigation Overlay
 * Full-screen navigation for mobile following editorial design principles
 */
export function EditorialNav({ onSignOut }: EditorialNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { label: "Dashboard", href: "/admin" },
    { label: "Templates", href: "/admin/templates" },
    { label: "New Project", href: "/admin/projects/new" },
  ];

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="sm:hidden min-h-[44px] min-w-[44px] flex items-center justify-center text-ink hover:text-accent-red transition-colors touch-target"
        aria-label="Open menu"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Full-Screen Editorial Overlay */}
      {isOpen && (
        <div
          className="sm:hidden fixed inset-0 z-50 isolate overflow-y-auto"
          style={{ backgroundColor: '#FAFAF8' }}
        >
          {/* Solid backdrop to ensure nothing shows through */}
          <div className="absolute inset-0 bg-paper" aria-hidden="true" />
          <EditorialSection spacing="lg" className="relative z-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-editorial-sm">
              <EditorialLabel>Navigation</EditorialLabel>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-ink hover:text-accent-red transition-colors touch-target"
                aria-label="Close menu"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <EditorialHeadline as="h2" size="md" className="mb-editorial-sm">
              Digg Admin
            </EditorialHeadline>

            <RuledDivider spacing="md" />

            {/* Navigation Links */}
            <nav className="space-y-editorial-xs">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="group block"
                >
                  <div
                    className={`border-t-3 pt-6 transition-colors ${
                      isActive(item.href)
                        ? "border-accent-red"
                        : "border-ink/20 hover:border-ink"
                    }`}
                  >
                    <h3
                      className={`text-headline-xs font-serif font-bold ${
                        isActive(item.href)
                          ? "text-accent-red"
                          : "text-ink group-hover:text-accent-red"
                      } transition-colors`}
                    >
                      {item.label}
                    </h3>
                  </div>
                </Link>
              ))}
            </nav>

            <RuledDivider spacing="lg" />

            {/* Sign Out */}
            <button
              onClick={() => {
                setIsOpen(false);
                onSignOut();
              }}
              className="group block w-full text-left"
            >
              <div className="border-t-3 border-ink/20 hover:border-ink pt-6 transition-colors">
                <h3 className="text-headline-xs font-serif font-bold text-ink group-hover:text-accent-red transition-colors">
                  Sign out
                </h3>
              </div>
            </button>
          </EditorialSection>
        </div>
      )}
    </>
  );
}
