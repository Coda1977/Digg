import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { type VariantProps, cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-sans font-medium transition-all focus-visible:outline-none focus-visible:outline-3 focus-visible:outline-[#DC2626] focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-40 disabled:cursor-not-allowed no-select touch-target",
  {
    variants: {
      variant: {
        primary:
          "bg-[#DC2626] border-3 border-[#DC2626] text-white hover:bg-[#B91C1C] hover:border-[#B91C1C]",
        secondary:
          "bg-ink border-3 border-ink text-paper hover:bg-[#DC2626] hover:border-[#DC2626]",
        outline:
          "bg-transparent border-3 border-ink text-ink hover:bg-ink hover:text-paper",
        ghost:
          "border-2 border-ink-lighter text-ink hover:border-ink",
      },
      size: {
        default: "px-7 py-3 text-[15px] min-h-[48px]",
        small: "px-5 py-2.5 text-[14px] min-h-[40px]",
        large: "px-9 py-4 text-[16px] min-h-[56px]",
      },
    },
    defaultVariants: {
      variant: "outline",
      size: "default",
    },
  }
);

export interface EditorialButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const EditorialButton = React.forwardRef<
  HTMLButtonElement,
  EditorialButtonProps
>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  );
});
EditorialButton.displayName = "EditorialButton";

export { EditorialButton, buttonVariants };
