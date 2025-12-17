import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EditorialHeadlineProps {
  children: ReactNode;
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  size?: "xl" | "lg" | "md" | "sm" | "xs";
  className?: string;
}

/**
 * Editorial Headline Component
 * Large serif typography for editorial-style headlines
 */
export function EditorialHeadline({
  children,
  as: Component = "h1",
  size = "xl",
  className,
}: EditorialHeadlineProps) {
  const sizeClass = {
    xl: "text-headline-xl",
    lg: "text-headline-lg",
    md: "text-headline-md",
    sm: "text-headline-sm",
    xs: "text-headline-xs",
  }[size];

  return (
    <Component
      className={cn(
        "font-serif font-bold tracking-headline text-ink",
        sizeClass,
        className
      )}
    >
      {children}
    </Component>
  );
}
