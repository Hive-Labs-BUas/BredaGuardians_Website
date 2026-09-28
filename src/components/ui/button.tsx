import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        /* PRIMARY CTA — solid gold, near-black label, brightens + scales on hover */
        default:
          "gold-gradient text-primary-foreground hover:brightness-110 hover:scale-[1.04] active:scale-[0.99] shadow-[0_10px_30px_-12px_oklch(0.83_0.17_85/0.65)]",
        /* SECONDARY CTA — transparent with gold border and gold text */
        secondary:
          "border-2 border-primary bg-gradient-to-br from-primary/10 via-transparent to-transparent text-primary hover:from-primary/20 hover:to-primary/5 hover:scale-[1.03] active:scale-[0.99]",
        outline:
          "border border-border bg-gradient-to-b from-surface-2 to-surface text-foreground hover:border-primary/60 hover:text-primary hover:from-primary/10",
        ghost: "text-foreground hover:bg-surface-2 hover:text-primary",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        /* every size keeps a >=44px touch target */
        default: "min-h-11 px-5 py-2.5",
        sm: "min-h-11 px-4 py-2 text-xs",
        lg: "min-h-13 px-7 py-3 text-base",
        xl: "min-h-14 px-9 py-4 text-lg tracking-wide",
        icon: "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);


export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
