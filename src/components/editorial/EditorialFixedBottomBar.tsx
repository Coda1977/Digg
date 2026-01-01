import * as React from "react";
import { cn } from "@/lib/utils";

export interface EditorialFixedBottomBarProps {
  children: React.ReactNode;
  className?: string;
}

export function EditorialFixedBottomBar({
  children,
  className,
}: EditorialFixedBottomBarProps) {
  return (
    <div
      className={cn(
        // Mobile: Fixed at bottom with blur background
        "fixed bottom-0 left-0 right-0 p-4 bg-paper/80 backdrop-blur-md border-t border-ink/10",
        // Mobile: Stack buttons in reverse order (primary at top)
        "flex flex-col-reverse gap-3",
        // Desktop: Static positioning, no background
        "sm:static sm:bg-transparent sm:border-0 sm:p-0",
        // Desktop: Horizontal layout
        "sm:flex-row sm:items-center",
        className
      )}
    >
      {children}
    </div>
  );
}
