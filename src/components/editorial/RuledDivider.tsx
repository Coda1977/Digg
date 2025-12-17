import { cn } from "@/lib/utils";

interface RuledDividerProps {
  weight?: "thin" | "medium" | "thick";
  spacing?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

/**
 * Ruled Divider Component
 * Graphic rule for editorial structure (not shadows)
 */
export function RuledDivider({
  weight = "medium",
  spacing = "md",
  className,
}: RuledDividerProps) {
  const weightClass = {
    thin: "border-t",
    medium: "border-t-3",
    thick: "border-t-4",
  }[weight];

  const spacingClass = {
    xs: "my-editorial-xs",
    sm: "my-editorial-sm",
    md: "my-editorial-md",
    lg: "my-editorial-lg",
    xl: "my-editorial-xl",
  }[spacing];

  return (
    <hr
      className={cn(
        "border-ink",
        weightClass,
        spacingClass,
        className
      )}
    />
  );
}
