import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EditorialSectionProps {
  children: ReactNode;
  className?: string;
  ruled?: boolean;
  spacing?: "xs" | "sm" | "md" | "lg" | "xl";
}

/**
 * Editorial Section Component
 * Print-style section container with optional ruled divider
 */
export function EditorialSection({
  children,
  className,
  ruled = false,
  spacing = "md",
}: EditorialSectionProps) {
  const spacingClass = {
    xs: "py-editorial-xs",
    sm: "py-editorial-sm",
    md: "py-editorial-md",
    lg: "py-editorial-lg",
    xl: "py-editorial-xl",
  }[spacing];

  return (
    <section
      className={cn(
        spacingClass,
        ruled && "border-t-3 border-ink",
        className
      )}
    >
      {children}
    </section>
  );
}
